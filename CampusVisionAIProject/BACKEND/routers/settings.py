from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth as authentication
from database import get_db
from datetime import time

router = APIRouter()

# Dependency for admin check
def get_admin_user(current_user: models.User = Depends(authentication.get_current_admin)):
    return current_user

@router.get("/geofence", response_model=schemas.GeoFenceOut)
def get_geofence(db: Session = Depends(get_db)):
    geofence = db.query(models.GeoFence).first()
    if not geofence:
        # Default Hippo College Location or similar
        return {"id": 0, "latitude": 0.0, "longitude": 0.0, "min_range": 0.0, "max_range": 500.0}
    return geofence

@router.post("/geofence", response_model=schemas.GeoFenceOut)
def update_geofence(req: schemas.GeoFenceBase, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    geofence = db.query(models.GeoFence).first()
    if not geofence:
        geofence = models.GeoFence(**req.dict())
        db.add(geofence)
    else:
        for key, value in req.dict().items():
            setattr(geofence, key, value)
    db.commit()
    db.refresh(geofence)
    return geofence

@router.get("/timings", response_model=List[schemas.DayTimingOut])
def get_all_timings(db: Session = Depends(get_db)):
    return db.query(models.DayTiming).all()

@router.post("/timings", response_model=schemas.DayTimingOut)
def update_day_timing(req: schemas.DayTimingBase, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    # Parse times
    try:
        start_t = time(*map(int, req.start_time.split(':')))
        late_t = time(*map(int, req.late_threshold.split(':')))
    except:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")

    timing = db.query(models.DayTiming).filter(models.DayTiming.day_of_week == req.day_of_week).first()
    if not timing:
        timing = models.DayTiming(
            day_of_week=req.day_of_week,
            start_time=start_t,
            late_threshold=late_t
        )
        db.add(timing)
    else:
        timing.start_time = start_t
        timing.late_threshold = late_t
    
    db.commit()
    db.refresh(timing)
    return timing

# ── Date-wise Timing ────────────────────────────────────────

def _parse_t(s):
    """Parse 'HH:MM' string → time object, or None."""
    if not s:
        return None
    try:
        h, m = map(int, s.split(':'))
        return time(h, m)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid time: {s!r}. Use HH:MM")

@router.get("/date-timing")
def get_date_timing(date: str, db: Session = Depends(get_db)):
    """Return date-timing for a given date (YYYY-MM-DD). Returns null if not set."""
    row = db.query(models.DateTiming).filter(models.DateTiming.date == date).first()
    if not row:
        return None
    return row

@router.post("/date-timing", response_model=schemas.DateTimingOut)
def set_date_timing(
    req: schemas.DateTimingBase,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    """Upsert date-specific entry/exit timing for the given date."""
    row = db.query(models.DateTiming).filter(models.DateTiming.date == req.date).first()
    if not row:
        row = models.DateTiming(date=req.date)
        db.add(row)
    row.entry_start = _parse_t(req.entry_start)
    row.entry_end   = _parse_t(req.entry_end)
    row.exit_start  = _parse_t(req.exit_start)
    row.exit_end    = _parse_t(req.exit_end)
    db.commit()
    db.refresh(row)
    return row

@router.delete("/date-timing")
def delete_date_timing(
    date: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user),
):
    """Remove a date-specific timing rule."""
    row = db.query(models.DateTiming).filter(models.DateTiming.date == date).first()
    if row:
        db.delete(row)
        db.commit()
    return {"message": "Deleted"}
