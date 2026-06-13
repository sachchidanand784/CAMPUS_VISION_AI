from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta, time
from pydantic import BaseModel
from typing import Optional
import math
import models, schemas, auth as authentication
from database import get_db
from services.face_service import match_face
from services.email_service import send_block_email

router = APIRouter()

class FaceAttendanceRequest(BaseModel):
    image_base64: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    mode: Optional[str] = "entry" # 'entry' or 'exit'

class IDAttendanceRequest(BaseModel):
    student_id: str
    lat: Optional[float] = None
    lon: Optional[float] = None

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula
    R = 6371000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

async def check_geofence(lat, lon, db: Session):
    geo = db.query(models.GeoFence).first()
    if not geo or (lat is None or lon is None):
        return True # Default to allow if not set or mocking
    
    dist = calculate_distance(lat, lon, geo.latitude, geo.longitude)
    if dist > geo.max_range:
        raise HTTPException(status_code=403, detail=f"Outside campus range ({int(dist)}m away, max Allowed: {int(geo.max_range)}m)")
    if dist < geo.min_range:
        raise HTTPException(status_code=403, detail=f"Too close to center ({int(dist)}m away, min required: {int(geo.min_range)}m)")
    return True

async def check_late_and_update(user: models.User, now: datetime, db: Session):
    try:
        is_late = False
        status  = "present"

        today_str    = now.strftime("%Y-%m-%d")
        current_time = now.time()

        # 1. Check date-specific timing first (highest priority)
        date_timing = db.query(models.DateTiming)\
            .filter(models.DateTiming.date == today_str).first()

        if date_timing and date_timing.entry_end:
            # entry_end is the late threshold for this date
            is_late = current_time > date_timing.entry_end
        else:
            # 2. Fall back to day-of-week timing
            day_idx = now.weekday()  # 0=Monday
            timing  = db.query(models.DayTiming)\
                .filter(models.DayTiming.day_of_week == day_idx).first()

            if timing:
                is_late = current_time > timing.late_threshold
            else:
                # 3. Hard fallback: 9 AM
                is_late = current_time > time(9, 0)

        if is_late:
            user.late_count += 1
            if user.late_count >= 5:
                user.is_blocked = True
                status = "blocked"
                try:
                    await send_block_email(user.email, user.name)
                except Exception as e:
                    print(f"Failed to send block email: {e}")
            elif user.late_count >= 3:
                status = "warning"

        return is_late, status
    except Exception as e:
        print(f"Error in check_late_and_update: {e}")
        return False, "present"

@router.post("/gate/scan", response_model=schemas.AttendanceOut)
async def gate_scan_face(
    req: FaceAttendanceRequest,
    db: Session = Depends(get_db)
):
    try:
        await check_geofence(req.lat, req.lon, db)
        
        all_students = db.query(models.User).filter(
            models.User.role == "student",
            models.User.is_blocked == False
        ).all()

        if not all_students:
            raise HTTPException(status_code=404, detail="No registered students found")
        
        matched_student = None
        for student in all_students:
            if match_face(req.image_base64, student.face_image_url):
                matched_student = student
                break
                
        if not matched_student:
             raise HTTPException(status_code=404, detail="Face not recognized")

        return await process_attendance(matched_student, db, force_exit=(req.mode == "exit"), marked_by="gateman")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Critical error in gate_scan_face: {e}")
        raise HTTPException(status_code=500, detail=f"Gate scan server error: {str(e)}")

@router.post("/mark/face", response_model=schemas.AttendanceOut)
async def mark_attendance_face(
    req: FaceAttendanceRequest,
    current_user: models.User = Depends(authentication.get_current_active_student),
    db: Session = Depends(get_db)
):
    try:
        await check_geofence(req.lat, req.lon, db)
        if not match_face(req.image_base64, current_user.face_image_url):
             raise HTTPException(status_code=400, detail="Face validation failed")

        return await process_attendance(current_user, db, marked_by="student")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Critical error in mark_attendance_face: {e}")
        raise HTTPException(status_code=500, detail=f"Biometric marking error: {str(e)}")

@router.post("/mark/id", response_model=schemas.AttendanceOut)
async def mark_attendance_id(
    req: IDAttendanceRequest,
    db: Session = Depends(get_db),
    current_gateman: models.User = Depends(authentication.get_current_gateman)
):
    try:
        await check_geofence(req.lat, req.lon, db)
        user = db.query(models.User).filter(models.User.student_id == req.student_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Student ID not found")

        return await process_attendance(user, db, marked_by="gateman")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Manual marking error: {str(e)}")

@router.post("/exit", response_model=schemas.AttendanceOut)
async def mark_exit(
    req: FaceAttendanceRequest,
    current_user: models.User = Depends(authentication.get_current_active_student),
    db: Session = Depends(get_db)
):
    try:
        await check_geofence(req.lat, req.lon, db)
        
        # Verify face for exit just like entry
        try:
            match_face(req.image_base64, current_user.face_image_url)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))

        return await process_attendance(current_user, db, force_exit=True, marked_by="student")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Exit marking error: {str(e)}")

async def process_attendance(user: models.User, db: Session, force_exit: bool = False, marked_by: str = "student"):
    try:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Check if there is already any attendance record for this student today
        today_record = db.query(models.Attendance)\
            .filter(
                models.Attendance.student_id == user.id,
                models.Attendance.entry_time >= today_start
            )\
            .order_by(models.Attendance.id.desc()).first()

        # Handle Exit (force_exit=True)
        if force_exit:
            if today_record:
                if today_record.status == "Re-entered" or today_record.exit_time is not None:
                    today_record.exit_time = now
                    today_record.status = "Re-exited"
                    today_record.marked_by = marked_by
                    db.commit()
                    db.refresh(today_record)
                    return today_record
                
                if today_record.exit_time is None:
                    today_record.exit_time = now
                    today_record.marked_by = marked_by
                    
                    # Check Early Exit
                    is_early = False
                    today_str = now.strftime("%Y-%m-%d")
                    current_time = now.time()
                    date_timing = db.query(models.DateTiming).filter(models.DateTiming.date == today_str).first()
                    if date_timing and date_timing.exit_start:
                        is_early = current_time < date_timing.exit_start
                    else:
                        is_early = current_time < time(16, 0) # 4:00 PM default 
                    
                    today_record.status = "EarlyExit" if is_early else "OnTime"
                    db.commit()
                    db.refresh(today_record)
                    return today_record
            
            raise HTTPException(status_code=400, detail="No active entry found to mark exit.")

        # Handle Entry (force_exit=False)
        if user.is_blocked:
            raise HTTPException(status_code=403, detail="Student is blocked due to repeated late entries. Visit admin office.")

        if today_record:
            # If they already entered and exited today: They are trying to re-enter
            if today_record.exit_time is not None:
                today_record.entry_time = now
                today_record.exit_time = None
                today_record.status = "Re-entered"
                today_record.marked_by = marked_by
                db.commit()
                db.refresh(today_record)
                return today_record
            
            # If they already entered today and did not exit yet:
            # Check Cooldown (1 min for testing instead of 30)
            diff = now - today_record.entry_time
            if diff < timedelta(minutes=1): 
                return today_record
            raise HTTPException(status_code=400, detail="You have already entered today and are currently in campus.")

        # First entry of the day
        is_late, attn_status = await check_late_and_update(user, now, db)
        entry_status_str = "LateEntry" if is_late else "OnTime"
        
        new_attn = models.Attendance(
            student_id=user.id,
            entry_time=now,
            is_late=is_late,
            status=entry_status_str,
            marked_by=marked_by
        )
        db.add(new_attn)
        db.commit()
        db.refresh(new_attn)
        db.refresh(user)
        
        return new_attn
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Process logic error: {str(e)}")

# ─────────────────────────────────────────────────
#  Gate Man Dashboard – read-only analytics endpoints
# ─────────────────────────────────────────────────

def _build_entry_list(records, db: Session):
    """Helper: join Attendance rows with User data and return dicts."""
    result = []
    for rec in records:
        user = db.query(models.User).filter(models.User.id == rec.student_id).first()
        result.append({
            "id": rec.id,
            "student_user_id": rec.student_id,
            "student_id": user.student_id if user else None,
            "student_name": user.name if user else "Unknown",
            "entry_time": rec.entry_time,
            "exit_time": rec.exit_time,
            "is_late": rec.is_late,
            "status": rec.status,
            "marked_by": rec.marked_by or "student",
        })
    return result

@router.get("/today/manual")
def get_today_manual_entries(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(authentication.get_current_gateman),
):
    """Return all Gate-Man-marked attendance records for today (UTC date)."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    records = (
        db.query(models.Attendance)
        .filter(
            models.Attendance.marked_by == "gateman",
            models.Attendance.entry_time >= today_start,
        )
        .order_by(models.Attendance.entry_time.desc())
        .all()
    )
    return _build_entry_list(records, db)

@router.get("/by-date")
def get_entries_by_date(
    date: str,   # format YYYY-MM-DD
    db: Session = Depends(get_db),
    current_user: models.User = Depends(authentication.get_current_gateman),
):
    """Return all attendance records for a given calendar date (local IST date sent as YYYY-MM-DD)."""
    try:
        from datetime import date as date_type
        selected_date = date_type.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    day_start = datetime(selected_date.year, selected_date.month, selected_date.day,
                         0, 0, 0, tzinfo=timezone.utc)
    day_end   = datetime(selected_date.year, selected_date.month, selected_date.day,
                         23, 59, 59, tzinfo=timezone.utc)

    records = (
        db.query(models.Attendance)
        .filter(
            models.Attendance.entry_time >= day_start,
            models.Attendance.entry_time <= day_end,
        )
        .order_by(models.Attendance.entry_time.desc())
        .all()
    )
    return _build_entry_list(records, db)

# ─────────────────────────────────────────────────
#  Student Dashboard – personal history endpoints
# ─────────────────────────────────────────────────

@router.get("/my/today")
def get_my_today(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(authentication.get_current_active_student),
):
    """Return today's attendance record for the logged-in student."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    record = (
        db.query(models.Attendance)
        .filter(
            models.Attendance.student_id == current_user.id,
            models.Attendance.entry_time >= today_start,
        )
        .order_by(models.Attendance.entry_time.desc())
        .first()
    )
    if not record:
        return {"has_entry": False, "has_exit": False, "entry_time": None, "exit_time": None, "is_late": None, "status": None}
    return {
        "has_entry": True,
        "has_exit": record.exit_time is not None,
        "entry_time": record.entry_time,
        "exit_time": record.exit_time,
        "is_late": record.is_late,
        "status": record.status,
        "marked_by": record.marked_by,
    }

@router.get("/my/history")
def get_my_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(authentication.get_current_active_student),
):
    """Return full attendance history for the logged-in student (newest first)."""
    records = (
        db.query(models.Attendance)
        .filter(models.Attendance.student_id == current_user.id)
        .order_by(models.Attendance.entry_time.desc())
        .limit(90)  # last 3 months worth
        .all()
    )
    return [
        {
            "id": r.id,
            "entry_time": r.entry_time,
            "exit_time": r.exit_time,
            "is_late": r.is_late,
            "status": r.status,
            "marked_by": r.marked_by or "student",
        }
        for r in records
    ]
