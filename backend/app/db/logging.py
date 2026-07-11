import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

async def create_system_log(db: AsyncIOMotorDatabase, action: str, email: str = None, details: str = None):
    await db["system_logs"].insert_one({
        "action": action,
        "email": email,
        "details": details,
        "timestamp": datetime.datetime.utcnow(),
        "created_at": datetime.datetime.utcnow()
    })

async def create_auth_log(db: AsyncIOMotorDatabase, email: str, action: str, status: str = "success"):
    # action: "login" or "logout"
    now = datetime.datetime.utcnow()
    if action == "login":
        await db["authentications"].insert_one({
            "email": email,
            "login_time": now,
            "logout_time": None,
            "record_date": now.date().isoformat(),
            "status": status
        })
    elif action == "logout":
        # Find the last active login for this email and set logout time
        last_auth = await db["authentications"].find_one(
            {"email": email, "logout_time": None, "status": "success"},
            sort=[("login_time", -1)]
        )
        if last_auth:
            await db["authentications"].update_one(
                {"_id": last_auth["_id"]},
                {"$set": {"logout_time": now, "status": "completed"}}
            )
        else:
            await db["authentications"].insert_one({
                "email": email,
                "login_time": None,
                "logout_time": now,
                "record_date": now.date().isoformat(),
                "status": "logout"
            })
