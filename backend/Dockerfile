FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Train the sentiment model (generates .pkl from CSV data)
RUN python -m app.ml.train.train_sentiment

# Expose port (Railway/Render inject PORT env var)
EXPOSE ${PORT:-8000}

# Start the server
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
