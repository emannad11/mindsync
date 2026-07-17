from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from app.api.v1.endpoints import auth
from app.db.mongodb import connect_to_mongo, close_mongo_connection
import uvicorn

app = FastAPI(title="MindSync AI API", version="1.0.0")

# CORS configuration
import os
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
if frontend_url not in origins:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def send_assessment_reminder_email(email: str, name: str):
    from app.core.config import settings
    import os
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD
    smtp_from = settings.SMTP_FROM

    subject = "MindSync Reminder: Complete Your Self-Assessment Today"
    body = f"Hello {name},\n\nWe noticed you haven't completed your daily self-assessment for today. Please log in to complete it and update your AI predictions.\n\nBest,\nMindSync AI Team"

    # Print simulated console notification
    print(f"\n=======================================================")
    print(f"[EMAIL REMINDER NOTIFICATION]")
    print(f"To: {email}")
    print(f"Subject: {subject}")
    print(f"Body: {body}")
    print(f"=======================================================\n")

    if smtp_host and smtp_user and smtp_password:
        try:
            msg = MIMEMultipart()
            msg["From"] = smtp_from
            msg["To"] = email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            server = smtplib.SMTP(smtp_host, int(smtp_port))
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_from, email, msg.as_string())
            server.quit()
            print(f"Real daily assessment email reminder sent to {email}")
        except Exception as e:
            print(f"[ERROR SENDING REAL REMINDER EMAIL] {str(e)}")

# Event handlers
async def run_assessment_checks():
    import asyncio
    from app.db.mongodb import get_database
    from datetime import datetime
    
    # Wait a few seconds for DB connection to establish
    await asyncio.sleep(3)
    try:
        db = await get_database()
        if db is None:
            return
        
        print("[SYSTEM SENDER] Background daily assessment reminder task initiated.")
        users = await db["users"].find({}).to_list(1000)
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        for user in users:
            # Skip reminder check if user is an admin
            if user.get("is_admin", False):
                continue
                
            user_id = str(user["_id"])
            latest_log = await db["userdata"].find_one({
                "user_id": user_id,
                "created_at": {"$gte": today_start}
            })
            
            if not latest_log:
                email = user.get("email", "unknown@example.com")
                name = user.get("name", "User")
                
                # Send daily assessment email reminder
                await run_in_threadpool(send_assessment_reminder_email, email, name)
    except Exception as e:
        print(f"[ERROR IN BACKGROUND TASK] {str(e)}")

def start_background_loop(loop):
    import asyncio
    asyncio.set_event_loop(loop)
    loop.run_until_complete(run_assessment_checks())

@app.on_event("startup")
async def startup_event():
    import asyncio
    await connect_to_mongo()
    
    # Start background check task in the main event loop
    asyncio.create_task(run_assessment_checks())

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Include Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
from app.api.v1.endpoints import users, tasks, moods, ai, admin, userdata
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(moods.router, prefix="/moods", tags=["moods"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(userdata.router, prefix="/userdata", tags=["userdata"])

@app.get("/")
async def root():
    return {"message": "Welcome to MindSync AI API"}

if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
