from email.message import EmailMessage
import smtplib

from .config import Settings


def _send(settings: Settings, recipient: str, subject: str, body: str) -> None:
    if not all((settings.smtp_host, settings.smtp_username, settings.smtp_password, settings.smtp_from_email, settings.public_app_url)):
        if settings.env.lower() == "production":
            raise RuntimeError("Email delivery is not configured")
        return
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message.set_content(body)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as client:
        if settings.smtp_use_tls:
            client.starttls()
        client.login(settings.smtp_username, settings.smtp_password)
        client.send_message(message)


def send_password_reset(settings: Settings, recipient: str, token: str) -> None:
    reset_url = f"{settings.public_app_url.rstrip('/')}/recover?token={token}"
    _send(settings, recipient, "Reset your RISE password", "A password reset was requested for your RISE account.\n\n" f"Open this link within 30 minutes: {reset_url}\n\n" "If you did not request this, ignore this message. Never share this link or code.\n" f"Support: {settings.support_email}")


def send_email_verification(settings: Settings, recipient: str, token: str) -> None:
    verify_url = f"{settings.public_app_url.rstrip('/')}/verify-email?token={token}"
    _send(settings, recipient, "Verify your RISE email", "Confirm that this email belongs to your RISE account.\n\n" f"Open this link within 24 hours: {verify_url}\n\n" "If you did not create a RISE account, ignore this message. Never share this link or code.\n" f"Support: {settings.support_email}")
