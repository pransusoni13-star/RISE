from app.config import Settings
from app.mailer import _send


def test_resend_https_delivery_is_preferred_over_smtp(monkeypatch) -> None:
    captured: dict[str, object] = {}

    class SuccessfulResponse:
        def raise_for_status(self) -> None:
            captured["checked"] = True

    def capture_post(url: str, **kwargs):
        captured.update(url=url, **kwargs)
        return SuccessfulResponse()

    monkeypatch.setattr("app.mailer.httpx.post", capture_post)
    settings = Settings(resend_api_key="re_test_key", resend_from_email="RISE <onboarding@resend.dev>")
    _send(settings, "member@example.com", "A subject", "A private body")

    assert captured["url"] == "https://api.resend.com/emails"
    assert captured["headers"] == {"Authorization": "Bearer re_test_key"}
    assert captured["json"] == {
        "from": "RISE <onboarding@resend.dev>",
        "to": ["member@example.com"],
        "subject": "A subject",
        "text": "A private body",
    }
    assert captured["timeout"] == 10
    assert captured["checked"] is True
