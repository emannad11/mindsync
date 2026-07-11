from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    is_admin: Optional[bool] = False
    primaryGoal: Optional[str] = None
    workStart: Optional[str] = None
    workEnd: Optional[str] = None
    productivityStyle: Optional[str] = None
    sleepGoal: Optional[int] = None
    waterGoal: Optional[float] = None
    stressLevel: Optional[int] = None
    hasCompletedOnboarding: Optional[bool] = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    is_admin: Optional[bool] = None
    primaryGoal: Optional[str] = None
    workStart: Optional[str] = None
    workEnd: Optional[str] = None
    productivityStyle: Optional[str] = None
    sleepGoal: Optional[int] = None
    waterGoal: Optional[float] = None
    stressLevel: Optional[int] = None
    hasCompletedOnboarding: Optional[bool] = None

class UserInDB(UserBase):
    id: str
    hashed_password: str

class UserOut(UserBase):
    id: str
