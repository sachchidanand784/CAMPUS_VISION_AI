from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import models, schemas, auth as authentication
from database import get_db
from typing import List

router = APIRouter()

# Dependency override to enforce admin
def get_admin_user(current_user: models.User = Depends(authentication.get_current_admin)):
    return current_user

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    total_students = db.query(models.User).filter(models.User.role == 'student').count()
    blocked_students = db.query(models.User).filter(models.User.is_blocked == True).count()
    active_students = total_students - blocked_students
    
    # Active today stats
    today = datetime.now(timezone.utc).date()
    today_attendances = db.query(models.Attendance)\
        .filter(models.Attendance.entry_time >= today).all()
    
    active_today = len(set([a.student_id for a in today_attendances]))
    on_time = len([a for a in today_attendances if not a.is_late])
    late_today = len([a for a in today_attendances if a.is_late])
    
    # Calculate min/max late time relative to threshold if possible
    # For now, let's just get the count. 
    # To get min/max late time, we'd need to compare entry_time with the threshold for that day.
    
    return {
        "total_students": total_students,
        "blocked_students": blocked_students,
        "active_students": active_students,
        "active_today": active_today,
        "on_time_today": on_time,
        "late_today": late_today
    }

@router.get("/students", response_model=List[schemas.UserOut])
def list_students(
    search: str = None, 
    status: str = None, 
    db: Session = Depends(get_db), 
    admin: models.User = Depends(authentication.get_current_gateman)
):
    query = db.query(models.User).filter(models.User.role == 'student')
    
    if search:
        query = query.filter(
            (models.User.name.ilike(f"%{search}%")) | 
            (models.User.student_id.ilike(f"%{search}%")) |
            (models.User.email.ilike(f"%{search}%"))
        )
    
    if status == "blocked":
        query = query.filter(models.User.is_blocked == True)
    elif status == "active":
        query = query.filter(models.User.is_blocked == False)
        
    return query.all()

@router.put("/students/{student_id}", response_model=schemas.UserOut)
def update_student(student_id: str, student_update: schemas.UserUpdate, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    user = db.query(models.User).filter(models.User.student_id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")
    
    for key, value in student_update.dict(exclude_unset=True).items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user

@router.delete("/students/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    user = db.query(models.User).filter(models.User.student_id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Clear attendance records first
    db.query(models.Attendance).filter(models.Attendance.student_id == user.id).delete()
    db.delete(user)
    db.commit()
    return {"message": "Student deleted successfully"}

from services.email_service import send_unblock_email

@router.post("/students/{student_id}/reset-late")
async def reset_late_count(student_id: str, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    user = db.query(models.User).filter(models.User.student_id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")
    
    user.late_count = 0
    was_blocked = user.is_blocked
    user.is_blocked = False
    db.commit()
    
    if was_blocked:
        try:
            await send_unblock_email(user.email, user.name)
        except Exception as e:
            print(f"Failed to send email: {e}")

    return {"message": "Late count reset and user unblocked"}

@router.get("/logs", response_model=List[schemas.AttendanceWithStudent])
def get_all_attendance(db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    records = db.query(models.Attendance).order_by(models.Attendance.entry_time.desc()).all()
    result = []
    for r in records:
        user = r.student
        result.append({
            "id": r.id,
            "student_user_id": r.student_id,
            "student_name": user.name if user else "Unknown",
            "student_id": user.student_id if user else None,
            "entry_time": r.entry_time,
            "exit_time": r.exit_time,
            "is_late": r.is_late,
            "status": r.status,
            "marked_by": r.marked_by or "student",
        })
    return result

@router.get("/today-entries")
def get_today_entries(db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    """All attendance records for today with student details."""
    from datetime import timezone
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    records = (
        db.query(models.Attendance)
        .filter(models.Attendance.entry_time >= today_start)
        .order_by(models.Attendance.entry_time.desc())
        .all()
    )
    result = []
    for r in records:
        user = db.query(models.User).filter(models.User.id == r.student_id).first()
        result.append({
            "id": r.id,
            "student_name": user.name if user else "Unknown",
            "student_id": user.student_id if user else None,
            "course": user.course if user else None,
            "entry_time": r.entry_time,
            "exit_time": r.exit_time,
            "is_late": r.is_late,
            "status": r.status,
            "marked_by": r.marked_by or "student",
        })
    return result
