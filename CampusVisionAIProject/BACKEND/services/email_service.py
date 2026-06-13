import os
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr
from dotenv import load_dotenv

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("SMTP_USER"),
    MAIL_PASSWORD = os.getenv("SMTP_PASS"),
    MAIL_FROM = os.getenv("SMTP_FROM"),
    MAIL_PORT = int(os.getenv("SMTP_PORT", 587)),
    MAIL_SERVER = os.getenv("SMTP_HOST"),
    MAIL_STARTTLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true",
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

async def send_email(subject: str, recipients: list, body: str):
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=body,
        subtype=MessageType.html
    )
    fm = FastMail(conf)
    await fm.send_message(message)

async def send_registration_email(email: EmailStr, name: str):
    subject = "Welcome to CampusVisionAI!"
    body = f"""
    <html>
        <body>
            <h2 style="color: #3b82f6;">Hello {name}!</h2>
            <p>Your registration for CampusVisionAI Smart Attendance System was successful.</p>
            <p>You can now use your face or Student ID for gate entry.</p>
            <br>
            <p>Best Regards,<br>CampusVisionAI Team</p>
        </body>
    </html>
    """
    await send_email(subject, [email], body)

async def send_block_email(email: EmailStr, name: str):
    subject = "IMPORTANT: Campus Access Blocked"
    body = f"""
    <html>
        <body>
            <h2 style="color: #ef4444;">Access Blocked</h2>
            <p>Hello {name},</p>
            <p>You have been blocked from campus access due to excessive late entries (5+ times).</p>
            <p>Please meet the administration office to resolve this issue and unblock your account.</p>
            <br>
            <p>Best Regards,<br>CampusVisionAI Team</p>
        </body>
    </html>
    """
    await send_email(subject, [email], body)

async def send_unblock_email(email: EmailStr, name: str):
    subject = "Campus Access Restored"
    body = f"""
    <html>
        <body>
            <h2 style="color: #22c55e;">Access Restored</h2>
            <p>Hello {name},</p>
            <p>Your campus access has been restored by the administrator. You can now mark your attendance as usual.</p>
            <br>
            <p>Best Regards,<br>CampusVisionAI Team</p>
        </body>
    </html>
    """
    await send_email(subject, [email], body)
