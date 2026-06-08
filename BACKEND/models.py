from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Float, Time
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True, nullable=True) # None for admin
    name = Column(String, index=True)
    email = Column(String, index=True)
    mobile = Column(String, nullable=True)
    hashed_password = Column(String)
    
    # role can be "student", "admin", or "gate_man"
    role = Column(String, default="student") # "admin", "student", or "gate_man"
    course = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    face_image_url = Column(String, nullable=True)
    late_count = Column(Integer, default=0)
    is_blocked = Column(Boolean, default=False)
    
    attendances = relationship("Attendance", back_populates="student")

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    entry_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    exit_time = Column(DateTime, nullable=True)
    is_late = Column(Boolean, default=False)
    status = Column(String, default="present") # present, warning, blocked
    marked_by = Column(String, default="student") # student or gate_man

    student = relationship("User", back_populates="attendances")

class GeoFence(Base):
    __tablename__ = "geofencing"
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    min_range = Column(Float, default=0.0)
    max_range = Column(Float, default=500.0)

class DayTiming(Base):
    __tablename__ = "day_timings"
    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(Integer, unique=True) # 0=Monday, 6=Sunday
    start_time = Column(Time) # Allowed entry start
    late_threshold = Column(Time) # After this time is late

class DateTiming(Base):
    """Date-specific entry/exit window (overrides DayTiming for that date)."""
    __tablename__ = "date_timings"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, unique=True, index=True)  # 'YYYY-MM-DD'
    entry_start = Column(Time, nullable=True)   # e.g. 09:00
    entry_end   = Column(Time, nullable=True)   # e.g. 10:30  (after this = late)
    exit_start  = Column(Time, nullable=True)   # e.g. 15:30
    exit_end    = Column(Time, nullable=True)   # e.g. 16:30
