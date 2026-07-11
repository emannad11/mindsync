from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserDataBase(BaseModel):
    sleep_hours: float
    study_hours: float
    activity_level: str  # "low", "medium", "high"
    workload_intensity: str  # "low", "medium", "high"
    mood_score: Optional[float] = 3.0
    stress_level: Optional[float] = 2.0
    fatigue_level: Optional[float] = 2.0
    pending_tasks: Optional[float] = 2.0

class UserDataCreate(UserDataBase):
    pass

class UserDataOut(UserDataBase):
    id: str
    user_id: str
    created_at: datetime
