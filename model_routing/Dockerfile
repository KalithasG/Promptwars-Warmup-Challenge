# Portable container — works on Railway, Fly.io, Cloud Run, or any Docker host.
# Build context is the model_routing/ directory.
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hosts inject $PORT; default to 8000 for local `docker run -p 8000:8000`.
ENV PORT=8000
EXPOSE 8000

# GEMINI_API_KEY is supplied at runtime (docker run -e GEMINI_API_KEY=... or the
# host's secret manager) — never baked into the image.
CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT}"]
