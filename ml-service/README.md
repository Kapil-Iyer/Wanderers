# Wanderers ML Service

Python FastAPI microservice for K-means recommender.

## Local

```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Deploy to Render

1. New Web Service, connect repo
2. **Root Directory**: leave empty or set to repo root (Fahh) so `model/` is available
3. **Build**: `cd ml-service && pip install -r requirements.txt`
4. **Start**: `cd ml-service && PYTHONPATH=.. uvicorn main:app --host 0.0.0.0 --port $PORT`

## Endpoints

- `GET /health` - health check
- `POST /recommend` - get recommended activities
- `POST /cluster` - assign user to cluster (for signup)
