"""
Wanderers ML Service - FastAPI
K-means recommender microservice for activity and friend recommendations.
Deploy to Render: https://wanderers-ml.onrender.com
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from recommender_api import recommend, get_cluster

app = FastAPI(title="Wanderers ML", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendRequest(BaseModel):
    user_id: Optional[str] = None
    user_vector: Optional[list[float]] = None
    user: Optional[dict] = None
    activities: list[dict]
    top_k: int = 6


class ClusterRequest(BaseModel):
    user: dict


@app.get("/health")
def health():
    return {"status": "ok", "service": "wanderers-ml"}


@app.post("/recommend")
def recommend_api(data: RecommendRequest):
    """Return recommended activities for a user."""
    results = recommend(
        user=data.user or {"interests": [], "preferred_time": "afternoon", "social_level": 0.5},
        activities=data.activities,
        top_k=data.top_k,
    )
    return {"recommendations": results}


@app.post("/cluster")
def cluster_api(data: ClusterRequest):
    """Assign new user to cluster. Returns cluster_id."""
    cluster_id = get_cluster(data.user)
    return {"cluster_id": cluster_id}
