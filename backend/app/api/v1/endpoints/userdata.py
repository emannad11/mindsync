from fastapi import APIRouter, Depends, HTTPException, status
from app.db.mongodb import get_database
from app.api import deps
from app.schemas.user import UserOut
from app.schemas.userdata import UserDataCreate, UserDataOut
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from typing import List
from app.db.logging import create_system_log

router = APIRouter()

@router.post("/", response_model=UserDataOut)
async def log_userdata(
    data_in: UserDataCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserOut = Depends(deps.get_current_user)
):
    data_dict = data_in.dict()
    data_dict["user_id"] = current_user.id
    data_dict["created_at"] = datetime.utcnow()
    
    result = await db["userdata"].insert_one(data_dict)
    data_dict["id"] = str(result.inserted_id)
    
    await create_system_log(
        db, 
        action="user_log_data", 
        email=current_user.email, 
        details=f"Logged daily metrics: Sleep={data_in.sleep_hours}h, Study={data_in.study_hours}h, Activity={data_in.activity_level}, Workload={data_in.workload_intensity}"
    )
    
    return data_dict

@router.get("/", response_model=List[UserDataOut])
async def get_userdata_history(
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserOut = Depends(deps.get_current_user)
):
    records = await db["userdata"].find({"user_id": current_user.id}).sort("created_at", -1).to_list(100)
    for r in records:
        r["id"] = str(r["_id"])
    return [UserDataOut(**r) for r in records]
