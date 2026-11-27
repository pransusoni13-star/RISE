import asyncio

from app.request_limits import RequestBodyLimitMiddleware


def run_body(chunks: list[bytes], headers: list[tuple[bytes, bytes]] | None = None):
    called = []
    sent = []
    messages = [{"type": "http.request", "body": chunk, "more_body": index < len(chunks) - 1} for index, chunk in enumerate(chunks)]

    async def receive():
        return messages.pop(0) if messages else {"type": "http.disconnect"}

    async def send(message):
        sent.append(message)

    async def endpoint(scope, receive, send):
        called.append(await receive())

    asyncio.run(RequestBodyLimitMiddleware(endpoint, max_bytes=10)({"type": "http", "method": "POST", "headers": headers or []}, receive, send))
    return called, sent, messages


def test_chunked_request_is_rejected_before_parsing_or_endpoint_work():
    called, sent, unread = run_body([b"123456", b"789012", b"never read"])
    assert called == []
    assert sent[0]["status"] == 413
    assert len(unread) == 1


def test_dishonest_content_length_cannot_bypass_actual_body_limit():
    called, sent, _ = run_body([b"12345678901"], [(b"content-length", b"1")])
    assert called == []
    assert sent[0]["status"] == 413


def test_invalid_duplicate_and_enormous_lengths_are_rejected_without_reading():
    for headers in [[(b"content-length", b"11")], [(b"content-length", b"-1")], [(b"content-length", b"9" * 5000)], [(b"content-length", b"1"), (b"content-length", b"1")]]:
        called, sent, unread = run_body([b"a"], headers)
        assert called == []
        assert sent[0]["status"] == 413
        assert len(unread) == 1


def test_valid_chunked_body_is_replayed_intact_once():
    called, sent, _ = run_body([b"12345", b"67890"])
    assert called == [{"type": "http.request", "body": b"1234567890", "more_body": False}]
    assert sent == []
