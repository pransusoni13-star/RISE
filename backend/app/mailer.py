from email.message import EmailMessage
from html import escape
import logging
import re
import smtplib

import httpx

from .config import Settings

logger = logging.getLogger(__name__)


def _safe_provider_message(settings: Settings, response: httpx.Response) -> str:
    try:
        detail = str(response.json().get("message", "Email provider rejected the request"))
    except (ValueError, AttributeError):
        detail = "Email provider rejected the request"
    if settings.resend_api_key:
        detail = detail.replace(settings.resend_api_key, "[REDACTED]")
    detail = re.sub(r"(?i)(token|key|code)=([^\s&\"']+)", r"\1=[REDACTED]", detail)
    return detail[:300]


def _send(settings: Settings, recipient: str, subject: str, text_body: str, html_body: str | None = None) -> None:
    provider = settings.resolved_email_provider
    if provider == "resend":
        try:
            response = httpx.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={"from": settings.email_from, "to": [recipient], "subject": subject, "text": text_body, "html": html_body},
                timeout=10,
            )
        except httpx.RequestError:
            logger.error("Resend delivery failed: status=unavailable message=network request failed")
            raise
        if response.is_error:
            logger.error(
                "Resend delivery failed: status=%s message=%s",
                response.status_code,
                _safe_provider_message(settings, response),
            )
        response.raise_for_status()
        return
    if provider != "smtp" or not all((settings.smtp_host, settings.smtp_username, settings.smtp_password, settings.public_app_url)):
        if settings.env.lower() == "production":
            raise RuntimeError("Email delivery is not configured")
        return
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.email_from
    message["To"] = recipient
    message.set_content(text_body)
    if html_body:
        message.add_alternative(html_body, subtype="html")
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as client:
        if settings.smtp_use_tls:
            client.starttls()
        client.login(settings.smtp_username, settings.smtp_password)
        client.send_message(message)


def send_password_reset(settings: Settings, recipient: str, token: str) -> None:
    reset_url = f"{settings.public_app_url.rstrip('/')}/recover?token={token}"
    text = "A password reset was requested for your RISE account.\n\n" f"Open this link within 30 minutes: {reset_url}\n\n" "If you did not request this, ignore this message. Never share this link or code.\n" f"Support: {settings.support_email}"
    html = f"<p>A password reset was requested for your RISE account.</p><p><a href=\"{escape(reset_url, quote=True)}\">Reset my RISE password</a></p><p>This link expires in 30 minutes. If you did not request this, ignore this message. Never share this link or code.</p><p>Support: {escape(settings.support_email)}</p>"
    _send(settings, recipient, "Reset your RISE password", text, html)


def send_email_verification(settings: Settings, recipient: str, token: str) -> None:
    verify_url = f"{settings.public_app_url.rstrip('/')}/verify-email?token={token}"
    text = "Confirm that this email belongs to your RISE account.\n\n" f"Open this link within 24 hours: {verify_url}\n\n" "If you did not create a RISE account, ignore this message. Never share this link or code.\n" f"Support: {settings.support_email}"
    html = f"<p>Confirm that this email belongs to your RISE account.</p><p><a href=\"{escape(verify_url, quote=True)}\">Verify my RISE email</a></p><p>This link expires in 24 hours and can be used once. If you did not create a RISE account, ignore this message. Never share this link or code.</p><p>Support: {escape(settings.support_email)}</p>"
    _send(settings, recipient, "Verify your email for RISE", text, html)


def send_product_feedback_notification(
    settings: Settings,
    recipient: str,
    *,
    feedback_id: str,
    member_email: str,
    category: str,
    rating: int,
    message: str,
    app_version: str,
    submitted_at: str,
) -> None:
    """Send a privacy-minimized copy of explicitly submitted product feedback."""
    subject = f"[RISE beta feedback] {category.title()} · {rating}/5"
    body = (
        "A signed-in RISE beta member submitted feedback.\n\n"
        f"Category: {category}\n"
        f"Rating: {rating}/5\n"
        f"App version: {app_version}\n"
        f"Submitted: {submitted_at}\n"
        f"Feedback ID: {feedback_id}\n"
        f"Member email: {member_email}\n\n"
        "Feedback:\n"
        f"{message}\n\n"
        "This message does not include proof files, reflections, passwords, or analytics. "
        "Handle the member's email and note as private support data."
    )
    html = "".join(
        [
            "<p>A signed-in RISE beta member submitted feedback.</p>",
            f"<p><strong>Category:</strong> {escape(category)}<br><strong>Rating:</strong> {rating}/5<br><strong>App version:</strong> {escape(app_version)}<br><strong>Submitted:</strong> {escape(submitted_at)}<br><strong>Feedback ID:</strong> {escape(feedback_id)}<br><strong>Member email:</strong> {escape(member_email)}</p>",
            f"<p><strong>Feedback</strong></p><p>{escape(message).replace(chr(10), '<br>')}</p>",
            "<p>This message does not include proof files, reflections, passwords, or analytics. Handle the member's email and note as private support data.</p>",
        ]
    )
    _send(settings, recipient, subject, body, html)
