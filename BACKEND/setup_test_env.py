import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import models
from datetime import time

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_test_data():
    db = SessionLocal()
    try:
        # 1. Update GeoFence to be massive (Testing Mode)
        geofence = db.query(models.GeoFence).first()
        if not geofence:
            geofence = models.GeoFence(latitude=0.0, longitude=0.0, radius_meters=20000000.0)
            db.add(geofence)
        else:
            geofence.latitude = 0.0
            geofence.longitude = 0.0
            geofence.radius_meters = 20000000.0 # 20,000 KM (Whole Earth)
        
        # 2. Update Timings for 24/7 Access
        for day in range(7):
            timing = db.query(models.DayTiming).filter(models.DayTiming.day_of_week == day).first()
            if not timing:
                timing = models.DayTiming(
                    day_of_week=day,
                    start_time=time(0, 0),
                    late_threshold=time(23, 59)
                )
                db.add(timing)
            else:
                timing.start_time = time(0, 0)
                timing.late_threshold = time(23, 59)
        
        db.commit()
        print("✅ TEST ENVIRONMENT CONFIGURED:")
        print("   - GeoFence: 20,000km Radius (Access from anywhere)")
        print("   - Timings: 24/7 Access (No late marking for testing)")
    except Exception as e:
        print(f"❌ Error setting up test data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_test_data()
