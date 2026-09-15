"""
ML API - K-means recommender. Pre-fitted on synthetic data.
Load once at startup; no training during requests.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from model.kmeans.recommender import (
    build_user_vector,
    fit_user_clusters,
    recommend_kmeans,
)
from model.kmeans.synthetic_data import SYNTHETIC_USERS, SYNTHETIC_BUBBLES, USER_ACTIVITY_JOINS

# Fit once at startup
_KMEANS, _SCALER, _CLUSTER_POP, _USER_TO_CLUSTER = fit_user_clusters(
    SYNTHETIC_USERS, USER_ACTIVITY_JOINS, SYNTHETIC_BUBBLES, n_clusters=6
)


def _to_bubble_format(activities: list) -> list:
    """Normalize activity dict (camelCase or snake_case) to internal format."""
    out = []
    for a in activities:
        out.append({
            "id": str(a.get("id", a.get("id", ""))),
            "emoji": a.get("emoji", "🫧"),
            "title": a.get("title", a.get("name", "Activity")),
            "category": a.get("category", "Casual"),
            "joined": int(a.get("joined", a.get("joined", 0))),
            "max_people": int(a.get("maxPeople", a.get("max_people", 6))),
            "starting_in": a.get("startingIn", a.get("starting_in", "1 hr")),
            "distance": a.get("distance", "0.5 km"),
            "description": a.get("description", ""),
            "creator": a.get("creator", "?"),
            "creator_avatar": a.get("creatorAvatar", a.get("creator_avatar", "?")),
            "time_slot": a.get("time_slot", "afternoon"),
        })
    return out


def recommend(user: dict, activities: list, top_k: int = 6) -> list[dict]:
    """Return recommended activities in frontend format (camelCase)."""
    if not activities:
        return []
    bubbles = _to_bubble_format(activities)
    recs = recommend_kmeans(
        user, bubbles, _KMEANS, _SCALER, _CLUSTER_POP, _USER_TO_CLUSTER, top_k=top_k
    )
    return [
        {
            "id": r["id"],
            "emoji": r["emoji"],
            "title": r["title"],
            "category": r["category"],
            "joined": r["joined"],
            "maxPeople": r["max_people"],
            "startingIn": r["starting_in"],
            "distance": r["distance"],
            "description": r.get("description", ""),
            "creator": r["creator"],
            "creatorAvatar": r.get("creator_avatar", r["creator"][:2].upper()),
            "recommendationScore": r["recommendation_score"],
            "recommendationReason": r["recommendation_reason"],
        }
        for r in recs
    ]


def get_cluster(user: dict) -> int:
    """Assign user to cluster. For new-user signup."""
    user_vec = build_user_vector(user)
    user_vec_scaled = _SCALER.transform(user_vec.reshape(1, -1))
    return int(_KMEANS.predict(user_vec_scaled)[0])
