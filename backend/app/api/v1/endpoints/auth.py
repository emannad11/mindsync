from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from app.db.mongodb import get_database
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.user import UserCreate, UserOut
from app.schemas.token import Token
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import timedelta
from app.core.config import settings
from app.db.logging import create_system_log, create_auth_log
from app.api import deps
from pydantic import BaseModel
import urllib.request
import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter()

@router.post("/signup", response_model=UserOut)
async def signup(user_in: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    # Check if user already exists
    existing_user = await db["users"].find_one({"email": user_in.email})
    if existing_user:
        await create_system_log(db, action="user_signup_failed", email=user_in.email, details="Email already exists.")
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    
    user_dict = user_in.dict()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    
    result = await db["users"].insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    await create_system_log(db, action="user_signup_success", email=user_in.email, details=f"User registered with ID {user_dict['id']}")
    return user_dict

@router.post("/login", response_model=Token)
async def login(user_in: dict, db: AsyncIOMotorDatabase = Depends(get_database)):
    email = user_in.get("email")
    user = await db["users"].find_one({"email": email})
    if not user or not verify_password(user_in.get("password"), user["hashed_password"]):
        await create_system_log(db, action="user_login_failed", email=email, details="Incorrect email or password.")
        await create_auth_log(db, email=email, action="login", status="failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = create_access_token(subject=str(user["_id"]))
    await create_system_log(db, action="user_login_success", email=email, details="User logged in successfully.")
    await create_auth_log(db, email=email, action="login", status="success")
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserOut = Depends(deps.get_current_user)
):
    await create_system_log(db, action="user_logout", email=current_user.email, details="User logged out.")
    await create_auth_log(db, email=current_user.email, action="logout")
    return {"status": "success", "message": "Successfully logged out."}

class GoogleAuthRequest(BaseModel):
    credential: str

def verify_google_token(token: str) -> dict:
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                return json.loads(response.read().decode())
    except Exception as e:
        print(f"Google token verification HTTP request failed: {e}")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid Google credentials or signature verification failed.",
    )

def send_login_email(email: str, name: str):
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD
    smtp_from = settings.SMTP_FROM

    subject = "MindSync AI Login Alert"
    body = f"Hello {name},\n\nYou have successfully logged in to MindSync AI.\n\nBest,\nMindSync AI Team"

    # Print a simulated notification in terminal console
    print(f"\n=======================================================")
    print(f"[EMAIL NOTIFICATION]")
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
            print(f"Real email successfully sent to {email}")
        except Exception as e:
            print(f"[ERROR SENDING REAL EMAIL] {str(e)}")

@router.post("/google", response_model=Token)
async def login_google(
    body: GoogleAuthRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # Verify token
    payload = await run_in_threadpool(verify_google_token, body.credential)
    
    # Verify audience (client ID) matches if configured
    if settings.GOOGLE_CLIENT_ID:
        if payload.get("aud") != settings.GOOGLE_CLIENT_ID:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token audience mismatch.",
            )
            
    email = payload.get("email")
    name = payload.get("name", email.split("@")[0] if email else "Google User")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token is missing email address.",
        )
        
    # Check if user already exists
    user = await db["users"].find_one({"email": email})
    
    if not user:
        # Create new user if registering for the first time
        user_dict = {
            "email": email,
            "name": name,
            "age": None,
            "gender": None,
            "is_admin": False,
            "hashed_password": "",  # Signed up via Google, no password hash
            "hasCompletedOnboarding": False,
        }
        result = await db["users"].insert_one(user_dict)
        user_dict["id"] = str(result.inserted_id)
        user = user_dict
        await create_system_log(db, action="user_google_signup_success", email=email, details=f"User signed up via Google with ID {user['id']}")
    else:
        user["id"] = str(user["_id"])
        await create_system_log(db, action="user_google_login_success", email=email, details="User logged in via Google successfully.")
        
    # Create system / auth audit log
    await create_auth_log(db, email=email, action="google_login", status="success")
    
    # Send login notification email
    await run_in_threadpool(send_login_email, email, name)
    
    # Generate access token
    access_token = create_access_token(subject=str(user["id"]))
    return {"access_token": access_token, "token_type": "bearer"}
