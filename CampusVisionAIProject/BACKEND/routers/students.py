from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
import uuid
import models, schemas, auth as authentication
from database import get_db
from services.email_service import send_registration_email
from pydantic import BaseModel

router = APIRouter()

class FaceUpdate(BaseModel):
    image_base64: str

@router.post("/register/student", response_model=schemas.UserOut)
async def register_student_specific(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user.role = "student"
    return await register_user_logic(user, background_tasks, db)

@router.post("/register/gateman", response_model=schemas.UserOut)
async def register_gateman_specific(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user.role = "gate_man"
    # Gateman doesn't have course/year
    user.course = "Staff"
    user.year = 0
    return await register_user_logic(user, background_tasks, db)

@router.post("/register/admin", response_model=schemas.UserOut)
async def register_admin_specific(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user.role = "admin"
    user.student_id = None # Admin usually doesn't have student_id
    user.course = "Admin"
    user.year = 0
    return await register_user_logic(user, background_tasks, db)

async def register_user_logic(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session):
    try:
        # db_user = db.query(models.User).filter(models.User.email == user.email).first()
        # if db_user:
        #     raise HTTPException(status_code=400, detail="Email already registered")
        
        if user.student_id:
            db_student_id = db.query(models.User).filter(models.User.student_id == user.student_id).first()
            if db_student_id:
                raise HTTPException(status_code=400, detail=f"{user.role.capitalize()} ID already registered")

        hashed_password = authentication.get_password_hash(user.password)
        
        # Original mock: face_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.name}"
        # For testing, we'll use the actual base64 as the URL (Data URI)
        # In production, this would be a Cloudinary URL
        face_url = user.face_image_base64 if user.face_image_base64 else f"https://api.dicebear.com/7.x/avataaars/svg?seed={user.name}"
            
        db_user = models.User(
            name=user.name,
            email=user.email,
            student_id=user.student_id if user.role != "gate_man" else f"GT-{uuid.uuid4().hex[:6].upper()}",
            mobile=user.mobile,
            hashed_password=hashed_password,
            role=user.role,
            course=user.course,
            year=user.year,
            face_image_url=face_url
        )
        # If gateman provided a student_id (Gate Man ID), use it
        if user.role == "gate_man" and user.student_id:
            db_user.student_id = user.student_id

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Send Welcome Email in background to prevent hanging
        background_tasks.add_task(send_registration_email, db_user.email, db_user.name)

        return db_user
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update-face", response_model=schemas.UserOut)
def update_face(
    req: FaceUpdate, 
    current_user: models.User = Depends(authentication.get_current_active_student),
    db: Session = Depends(get_db)
):
    # In production, upload req.image_base64 to Cloudinary and get URL
    new_face_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={current_user.student_id}_new"
    current_user.face_image_url = new_face_url
    db.commit()
    db.refresh(current_user)
    return current_user
