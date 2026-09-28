import pytest

from app.serve import server_port


def test_default_port(monkeypatch):
    monkeypatch.delenv("PORT", raising=False)
    assert server_port() == 8000


def test_provider_port(monkeypatch):
    monkeypatch.setenv("PORT", "10000")
    assert server_port() == 10000


@pytest.mark.parametrize("value", ["0", "65536", "abc", ""])
def test_invalid_port(monkeypatch, value):
    monkeypatch.setenv("PORT", value)
    with pytest.raises(ValueError):
        server_port()
