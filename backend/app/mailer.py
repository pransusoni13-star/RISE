from email.message import EmailMessage
import smtplib

from .config import Settings


def send_password_reset(settings: Settings, recipient: str, token: str) -> None:
    if not all((settings.smtp_host, settings.smtp_username, settings.smtp_password, settings.smtp_from_email, settings.public_app_url)):
        if settings.env.lower() == "production":
            raise RuntimeError("Email delivery is not configured")
        return
    reset_url = f"{settings.public_app_url.rstrip('/')}/recover?token={token}"
    message = EmailMessage()
    message["Subject"] = "Reset your RISE password"
    message["From"] = settings.smtp_from_email
    message["To"] = recipient
    message.set_content(
        "A password reset was requested for your RISE account.\n\n"
        f"Open this link within 30 minutes: {reset_url}\n\n"
        "If you did not request this, you can ignore this message. Never share this link or code.\n"
        f"Support: {settings.support_email}"
    )
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as client:
        if settings.smtp_use_tls:
            client.starttls()
        client.login(settings.smtp_username, settings.smtp_password)
        client.send_message(message)
