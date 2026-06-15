from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, time

class UserBase(BaseModel):
    name: str
    email: EmailStr
    student_id: Optional[str] = None
    mobile: Optional[str] = None
    course: Optional[str] = None
    year: Optional[int] = None

class UserCreate(UserBase):
    password: str
    face_image_base64: Optional[str] = None
    role: Optional[str] = "student"

class UserOut(UserBase):
    id: int
    role: str
    is_blocked: bool
    late_count: int
    face_image_url: Optional[str] = None

    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    student_id: int
    is_late: bool
    status: str

class AttendanceOut(AttendanceBase):
    id: int
    entry_time: datetime
    exit_time: Optional[datetime] = None
    marked_by: Optional[str] = "student"

    class Config:
        from_attributes = True

class AttendanceWithStudent(BaseModel):
    """Enriched attendance record that includes student name and ID string."""
    id: int
    student_user_id: int          # internal DB user.id
    student_id: Optional[str] = None   # e.g. STU0001
    student_name: Optional[str] = None
    entry_time: datetime
    exit_time: Optional[datetime] = None
    is_late: bool
    status: str
    marked_by: Optional[str] = "student"

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    student_id: Optional[str] = None
    mobile: Optional[str] = None
    course: Optional[str] = None
    year: Optional[int] = None
    is_blocked: Optional[bool] = None

class IDAttendanceRequest(BaseModel):
    student_id: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    mode: Optional[str] = "entry" # 'entry' or 'exit'

class GeoFenceBase(BaseModel):
    latitude: float
    longitude: float
    min_range: float
    max_range: float

class GeoFenceOut(GeoFenceBase):
    id: int
    class Config:
        from_attributes = True

class DayTimingBase(BaseModel):
    day_of_week: int
    start_time: str # "HH:MM"
    late_threshold: str # "HH:MM"

class DayTimingOut(BaseModel):
    id: int
    day_of_week: int
    start_time: time
    late_threshold: time
    class Config:
        from_attributes = True

class DateTimingBase(BaseModel):
    date: str           # 'YYYY-MM-DD'
    entry_start: Optional[str] = None  # 'HH:MM'
    entry_end:   Optional[str] = None
    exit_start:  Optional[str] = None
    exit_end:    Optional[str] = None

class DateTimingOut(BaseModel):
    id: int
    date: str
    entry_start: Optional[time] = None
    entry_end:   Optional[time] = None
    exit_start:  Optional[time] = None
    exit_end:    Optional[time] = None
    class Config:
        from_attributes = True
