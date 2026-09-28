"""Container entry point supporting a hosting provider's assigned PORT."""
import os

import uvicorn


def server_port() -> int:
    port = int(os.environ.get("PORT", "8000"))
    if not 1 <= port <= 65535:
        raise ValueError("PORT must be between 1 and 65535")
    return port


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=server_port(), proxy_headers=True)
