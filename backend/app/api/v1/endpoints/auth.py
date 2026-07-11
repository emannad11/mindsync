from fastapi import APIRouter, Depends, HTTPException, status
from app.db.mongodb import get_database
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.user import UserCreate, UserOut
from app.schemas.token import Token
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import timedelta
from app.core.config import settings
from app.db.logging import create_system_log, create_auth_log
from app.api import deps

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
