FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY scripts ./scripts

RUN addgroup --system rise && adduser --system --ingroup rise rise
USER rise

EXPOSE 8000
CMD ["python", "-m", "app.serve"]
