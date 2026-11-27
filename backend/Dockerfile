FROM python:3.12-slim

# Refresh OS security packages even when the upstream image tag has not yet
# incorporated the distribution's latest fixes. CI scans the resulting image.
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY alembic.ini ./alembic.ini
COPY migrations ./migrations
COPY scripts ./scripts

RUN addgroup --system rise && adduser --system --ingroup rise rise
USER rise

EXPOSE 8000
CMD ["python", "-m", "app.serve"]
