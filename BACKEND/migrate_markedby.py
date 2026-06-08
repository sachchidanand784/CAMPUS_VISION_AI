from sqlalchemy import text
from database import engine

def migrate_attendance():
    with engine.connect() as connection:
        try:
            print("Adding marked_by column to attendances table...")
            connection.execute(text("ALTER TABLE attendances ADD COLUMN IF NOT EXISTS marked_by TEXT DEFAULT 'student';"))
            connection.commit()
            print("Successfully added marked_by column!")
        except Exception as e:
            print(f"Error during migration: {e}")
            connection.rollback()

if __name__ == "__main__":
    migrate_attendance()
