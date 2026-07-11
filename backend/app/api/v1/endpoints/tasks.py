from fastapi import APIRouter, Depends, HTTPException
from app.db.mongodb import get_database
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate
from app.api.deps import get_current_user
from app.schemas.user import UserOut
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from typing import List
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=TaskOut)
async def create_task(
    task_in: TaskCreate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserOut = Depends(get_current_user)
):
    task_dict = task_in.dict()
    task_dict["user_id"] = current_user.id
    task_dict["created_at"] = datetime.utcnow()
    
    result = await db["tasks"].insert_one(task_dict)
    task_dict["id"] = str(result.inserted_id)
    return task_dict

@router.get("/", response_model=List[TaskOut])
async def read_tasks(
    skip: int = 0,
    limit: int = 100,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserOut = Depends(get_current_user)
):
    cursor = db["tasks"].find({"user_id": current_user.id}).skip(skip).limit(limit)
    tasks = []
    async for document in cursor:
        document["id"] = str(document["_id"])
        tasks.append(document)
    return tasks

@router.put("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: str,
    task_in: TaskUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserOut = Depends(get_current_user)
):
    update_data = task_in.dict(exclude_unset=True)
    if not update_data:
        task = await db["tasks"].find_one({"_id": ObjectId(task_id), "user_id": current_user.id})
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        task["id"] = str(task["_id"])
        return task

    result = await db["tasks"].update_one(
        {"_id": ObjectId(task_id), "user_id": current_user.id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
        
    updated_task = await db["tasks"].find_one({"_id": ObjectId(task_id)})
    updated_task["id"] = str(updated_task["_id"])
    return updated_task

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    current_user: UserOut = Depends(get_current_user)
):
    result = await db["tasks"].delete_one({"_id": ObjectId(task_id), "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "message": "Task deleted"}
