from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class MoodBase(BaseModel):
    mood_score: int = Field(ge=1, le=5, description="Mood score from 1 (lowest) to 5 (highest)")
    stress_level: Optional[int] = Field(None, ge=1, le=5, description="Stress level from 1 (lowest) to 5 (highest)")
    fatigue_level: Optional[int] = Field(None, ge=1, le=5, description="Fatigue level from 1 (lowest) to 5 (highest)")
    notes: Optional[str] = None

class MoodCreate(MoodBase):
    pass

class MoodInDB(MoodBase):
    id: str
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MoodOut(MoodInDB):
    pass
