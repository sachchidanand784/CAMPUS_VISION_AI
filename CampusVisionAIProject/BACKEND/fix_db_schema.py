from sqlalchemy import text
from database import engine

def apply_migrations():
    with engine.connect() as connection:
        try:
            print("Applying database schema fixes...")
            
            # Fix geofencing table
            print("Checking geofencing table...")
            connection.execute(text("ALTER TABLE geofencing ADD COLUMN IF NOT EXISTS min_range FLOAT DEFAULT 0.0;"))
            connection.execute(text("ALTER TABLE geofencing ADD COLUMN IF NOT EXISTS max_range FLOAT DEFAULT 500.0;"))
            
            # Ensure day_timings table exists (SQLAlchemy create_all doesn't always handle it if something changed)
            print("Checking day_timings table...")
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS day_timings (
                    id SERIAL PRIMARY KEY,
                    day_of_week INTEGER UNIQUE,
                    start_time TIME,
                    late_threshold TIME
                );
            """))
            
            connection.commit()
            print("Schema fixes applied successfully!")
        except Exception as e:
            print(f"Error applying fixes: {e}")
            connection.rollback()

if __name__ == "__main__":
    apply_migrations()
