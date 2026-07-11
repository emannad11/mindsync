from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import get_database
from app.schemas.user import UserOut, UserUpdate
from app.api.deps import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

router = APIRouter()

@router.get("/me", response_model=UserOut)
async def read_user_me(
    current_user: UserOut = Depends(get_current_user)
):
    return current_user

@router.put("/me", response_model=UserOut)
async def update_user_me(
    user_in: UserUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserOut = Depends(get_current_user)
):
    update_data = user_in.dict(exclude_unset=True)
    if not update_data:
        return current_user

    await db["users"].update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_data}
    )
    
    updated_user = await db["users"].find_one({"_id": ObjectId(current_user.id)})
    if updated_user:
        updated_user["id"] = str(updated_user["_id"])
        return UserOut(**updated_user)
    
    return current_user
