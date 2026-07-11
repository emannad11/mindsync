from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints import auth
from app.db.mongodb import connect_to_mongo, close_mongo_connection
import uvicorn

app = FastAPI(title="MindSync AI API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            user_id = str(user["_id"])
            latest_log = await db["userdata"].find_one({
                "user_id": user_id,
                "created_at": {"$gte": today_start}
            })
            
            if not latest_log:
                email = user.get("email", "unknown@example.com")
                print(f"\n=======================================================")
                print(f"[SIMULATED OFFLINE EMAIL REMINDER]")
                print(f"To: {email}")
                print(f"Subject: MindSync Reminder: Complete Your Self-Assessment Today")
                print(f"Body: Hello {user.get('name')},\n\nWe noticed you haven't completed your daily self-assessment for today. Please log in to complete it and update your AI predictions.\n\nBest,\nMindSync AI Team")
                print(f"=======================================================\n")
                
                # Check duplicate and insert notification into MongoDB
                existing_reminder = await db["notifications"].find_one({
                    "user_id": user_id,
                    "type": "daily_assessment_reminder",
                    "created_at": {"$gte": today_start}
                })
                if not existing_reminder:
                    await db["notifications"].insert_one({
                        "user_id": user_id,
                        "type": "daily_assessment_reminder",
                        "title": "Daily Assessment Missing",
                        "message": "You haven't logged your self-assessment today. Please complete it now.",
                        "status": "unread",
                        "created_at": datetime.utcnow()
                    })
    except Exception as e:
        print(f"[ERROR IN BACKGROUND TASK] {str(e)}")

def start_background_loop(loop):
    import asyncio
    asyncio.set_event_loop(loop)
    loop.run_until_complete(run_assessment_checks())

@app.on_event("startup")
async def startup_event():
    import threading
    import asyncio
    await connect_to_mongo()
    
    # Start background check thread
    loop = asyncio.new_event_loop()
    t = threading.Thread(target=start_background_loop, args=(loop,), daemon=True)
    t.start()

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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
