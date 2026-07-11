import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Add backend directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.security import get_password_hash
from app.core.config import settings

async def seed():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    users_coll = db["users"]
    
    # 1. Seed regular user
    email_user = "test@example.com"
    existing_user = await users_coll.find_one({"email": email_user})
    if not existing_user:
        hashed_password = get_password_hash("password123")
        user_dict = {
            "name": "Test User",
            "email": email_user,
            "age": 22,
            "gender": "Male",
            "is_admin": False,
            "hashed_password": hashed_password,
            "primaryGoal": "Productivity",
            "workStart": "09:00",
            "workEnd": "17:00",
            "productivityStyle": "Morning Owl",
            "sleepGoal": 8,
            "waterGoal": 2.5,
            "stressLevel": 2,
            "hasCompletedOnboarding": False
        }
        await users_coll.insert_one(user_dict)
        print(f"Successfully seeded regular user: {email_user} (password123)")
    else:
        print(f"User {email_user} already exists.")
        
    # 2. Seed admin user
    email_admin = "admin@mindsync.com"
    existing_admin = await users_coll.find_one({"email": email_admin})
    if not existing_admin:
        hashed_password = get_password_hash("admin123")
        admin_dict = {
            "name": "MindSync Admin",
            "email": email_admin,
            "age": 30,
            "gender": "Other",
            "is_admin": True,
            "hashed_password": hashed_password,
            "primaryGoal": "Management",
            "workStart": "09:00",
            "workEnd": "17:00",
            "productivityStyle": "Balanced",
            "sleepGoal": 8,
            "waterGoal": 2.5,
            "stressLevel": 1,
            "hasCompletedOnboarding": True
        }
        await users_coll.insert_one(admin_dict)
        print(f"Successfully seeded admin user: {email_admin} (admin123)")
    else:
        print(f"Admin {email_admin} already exists.")
        
    client.close()

if __name__ == '__main__':
    asyncio.run(seed())
