from sqlalchemy import text
from database import engine

def drop_unique_email_constraint():
    with engine.connect() as connection:
        try:
            print("Dropping unique email constraint for testing...")
            # Supabase/PostgreSQL usually names the unique constraint ix_users_email if it's created as an index or constraint
            connection.execute(text("ALTER TABLE users DROP CONSTRAINT IF EXISTS ix_users_email CASCADE;"))
            connection.execute(text("DROP INDEX IF EXISTS ix_users_email CASCADE;"))
            connection.commit()
            print("Successfully removed uniqueness requirement for email!")
        except Exception as e:
            print(f"Error dropping constraint: {e}")
            connection.rollback()

if __name__ == "__main__":
    drop_unique_email_constraint()
