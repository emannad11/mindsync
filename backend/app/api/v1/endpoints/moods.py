from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import get_database
from app.schemas.mood import MoodCreate, MoodOut
from app.api.deps import get_current_user
from app.schemas.user import UserOut
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=MoodOut)
async def log_mood(
    mood_in: MoodCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserOut = Depends(get_current_user)
):
    mood_dict = mood_in.dict()
    mood_dict["user_id"] = current_user.id
    mood_dict["timestamp"] = datetime.utcnow()
    
    result = await db["moods"].insert_one(mood_dict)
    mood_dict["id"] = str(result.inserted_id)
    return mood_dict

@router.get("/", response_model=List[MoodOut])
async def get_mood_history(
    limit: int = 30,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserOut = Depends(get_current_user)
):
    cursor = db["moods"].find({"user_id": current_user.id}).sort("timestamp", -1).limit(limit)
    moods = []
    async for document in cursor:
        document["id"] = str(document["_id"])
        moods.append(document)
    return moods
