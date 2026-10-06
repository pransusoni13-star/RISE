from app.config import Settings
import httpx

from app.mailer import _send, send_email_verification, send_product_feedback_notification


def test_resend_https_delivery_is_preferred_over_smtp(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class SuccessfulResponse:
        is_error = False

        def raise_for_status(self) -> None:
            captured["checked"] = True

    def capture_post(url: str, **kwargs):
        captured.update(url=url, **kwargs)
        return SuccessfulResponse()

    monkeypatch.setattr("app.mailer.httpx.post", capture_post)
    settings = Settings(resend_api_key="re_test_key", email_from="RISE <hello@rise.example>")
    _send(settings, "member@example.com", "A subject", "A private body", "<p>A private body</p>")

    assert captured["url"] == "https://api.resend.com/emails"
    assert captured["headers"] == {"Authorization": "Bearer re_test_key"}
    assert captured["json"] == {
        "from": "RISE <hello@rise.example>",
        "to": ["member@example.com"],
        "subject": "A subject",
        "text": "A private body",
        "html": "<p>A private body</p>",
    }
    assert captured["timeout"] == 10
    assert captured["checked"] is True


def test_explicit_smtp_provider_does_not_use_resend(monkeypatch) -> None:
    sent: dict[str, object] = {}

    class FakeSMTP:
        def __init__(self, host: str, port: int, timeout: int):
            sent.update(host=host, port=port, timeout=timeout)

        def __enter__(self):
            return self

        def __exit__(self, *_args) -> None:
            return None

        def starttls(self) -> None:
            sent["tls"] = True

        def login(self, username: str, password: str) -> None:
            sent.update(username=username, password=password)

        def send_message(self, message) -> None:
            sent["message"] = message

    monkeypatch.setattr("app.mailer.httpx.post", lambda *_args, **_kwargs: (_ for _ in ()).throw(AssertionError("Resend must not be used")))
    monkeypatch.setattr("app.mailer.smtplib.SMTP", FakeSMTP)
    settings = Settings(
        email_provider="smtp",
        resend_api_key="re_present_but_disabled",
        email_from="RISE <rise.app13@gmail.com>",
        public_app_url="https://rise.example",
        smtp_host="smtp.gmail.com",
        smtp_username="rise.app13@gmail.com",
        smtp_password="app-password",
    )

    _send(settings, "member@example.com", "A subject", "Text body", "<p>HTML body</p>")

    assert sent["host"] == "smtp.gmail.com"
    assert sent["tls"] is True
    assert sent["username"] == "rise.app13@gmail.com"
    message = sent["message"]
    assert message["From"] == "RISE <rise.app13@gmail.com>"
    assert message["To"] == "member@example.com"
    assert message.is_multipart()


def test_resend_error_log_redacts_secrets_and_query_tokens(monkeypatch, caplog) -> None:
    request = httpx.Request("POST", "https://api.resend.com/emails")
    response = httpx.Response(
        403,
        request=request,
        json={"message": "re_private_key rejected token=secret-verification-token"},
    )

    monkeypatch.setattr("app.mailer.httpx.post", lambda *args, **kwargs: response)
    settings = Settings(resend_api_key="re_private_key", email_from="RISE <hello@rise.example>")

    try:
        _send(settings, "member@example.com", "A subject", "A private body")
    except httpx.HTTPStatusError:
        pass
    else:
        raise AssertionError("Expected the provider error to be raised")

    assert "status=403" in caplog.text
    assert "[REDACTED]" in caplog.text
    assert "re_private_key" not in caplog.text
    assert "secret-verification-token" not in caplog.text


def test_verification_email_has_text_and_html_with_one_link(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class SuccessfulResponse:
        is_error = False

        def raise_for_status(self) -> None:
            return None

    def capture_post(url: str, **kwargs):
        captured.update(url=url, **kwargs)
        return SuccessfulResponse()

    monkeypatch.setattr("app.mailer.httpx.post", capture_post)
    settings = Settings(
        resend_api_key="re_test_key",
        email_from="RISE <hello@rise.example>",
        public_app_url="https://rise.example",
    )

    send_email_verification(settings, "member@example.com", "one-time-token")

    payload = captured["json"]
    assert isinstance(payload, dict)
    assert payload["subject"] == "Verify your email for RISE"
    assert payload["text"].count("https://rise.example/verify-email?token=one-time-token") == 1
    assert payload["html"].count("href=") == 1
    assert "24 hours" in payload["html"]


def test_feedback_uses_dedicated_resend_https_sender_when_smtp_is_selected(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class SuccessfulResponse:
        is_error = False

        def raise_for_status(self) -> None:
            return None

    def capture_post(url: str, **kwargs):
        captured.update(url=url, **kwargs)
        return SuccessfulResponse()

    monkeypatch.setattr("app.mailer.httpx.post", capture_post)
    monkeypatch.setattr("app.mailer.smtplib.SMTP", lambda *_args, **_kwargs: (_ for _ in ()).throw(AssertionError("Feedback must use Resend HTTPS")))
    settings = Settings(
        email_provider="smtp",
        resend_api_key="re_test_key",
        resend_from_email="RISE Feedback <onboarding@resend.dev>",
        email_from="RISE <rise.app13@gmail.com>",
        public_app_url="https://rise.example",
        smtp_host="smtp.gmail.com",
        smtp_username="rise.app13@gmail.com",
        smtp_password="app-password",
    )

    send_product_feedback_notification(
        settings,
        "rise.app13@gmail.com",
        feedback_id="feedback-123",
        member_email="member@example.com",
        category="bug",
        rating=2,
        message="The button did not respond.",
        app_version="1.0.0 (12)",
        submitted_at="2026-10-05T22:00:00Z",
    )

    assert captured["url"] == "https://api.resend.com/emails"
    payload = captured["json"]
    assert isinstance(payload, dict)
    assert payload["from"] == "RISE Feedback <onboarding@resend.dev>"
    assert payload["to"] == ["rise.app13@gmail.com"]
    assert payload["subject"] == "[RISE beta feedback] Bug · 2/5"
