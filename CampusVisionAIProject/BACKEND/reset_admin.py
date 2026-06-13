import os
import sys
from sqlalchemy.orm import Session

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import models
import auth as authentication
from database import SessionLocal

def reset_admin():
    db = SessionLocal()
    try:
        admins = db.query(models.User).filter(models.User.role == "admin").all()
        if not admins:
            print("No admin users found in the database.")
            create_new = input("Would you like to create a new default admin? (y/n): ").strip().lower()
            if create_new == 'y':
                email = input("Enter email for new admin: ").strip()
                name = input("Enter name for new admin: ").strip()
                password = input("Enter password for new admin: ").strip()
                
                hashed_password = authentication.get_password_hash(password)
                new_admin = models.User(
                    name=name,
                    email=email,
                    student_id=None,
                    role="admin",
                    hashed_password=hashed_password,
                    course="Admin",
                    year=0
                )
                db.add(new_admin)
                db.commit()
                print(f"Successfully created admin account: {email}")
            return

        print("\nExisting Admin Accounts:")
        for idx, admin in enumerate(admins, 1):
            print(f"{idx}. Name: {admin.name} | Email: {admin.email}")
            
        choice = input("\nSelect the number of the admin you want to reset, or press Enter to cancel: ").strip()
        if not choice:
            return
            
        try:
            selected_idx = int(choice) - 1
            if selected_idx < 0 or selected_idx >= len(admins):
                print("Invalid choice.")
                return
            selected_admin = admins[selected_idx]
        except ValueError:
            print("Invalid input.")
            return

        new_password = input(f"Enter new password for {selected_admin.email}: ").strip()
        if not new_password:
            print("Password cannot be empty.")
            return

        selected_admin.hashed_password = authentication.get_password_hash(new_password)
        db.commit()
        print(f"Successfully reset password for {selected_admin.email}!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
