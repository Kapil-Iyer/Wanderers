"""
K-means recommender: clusters USERS. Recommends activities popular in user's cluster.

Score = w_cluster * cluster_popularity + w_interest * interest_match + w_time * time_match + w_proximity * proximity
"""

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from .synthetic_data import CATEGORIES, CATEGORY_TO_IDS, INTEREST_TO_CATEGORY, parse_distance_km

CLUSTER_COUNT_MIN = 3
CLUSTER_COUNT_MAX = 6

DEFAULT_SCORE_WEIGHTS = {
    "cluster_popularity": 2.0,
    "interest_match": 1.2,
    "time_match": 0.8,
    "proximity": 1.0,
}


def build_user_vector(user: dict) -> np.ndarray:
    """[sports, study, casual, music, gaming, outdoors, time_afternoon, time_evening, social_level]"""
    vec = np.zeros(6)
    for interest in user.get("interests", []):
        cat = INTEREST_TO_CATEGORY.get(interest, interest)
        if cat in CATEGORY_TO_IDS:
            vec[CATEGORY_TO_IDS[cat]] += 1
    norm = np.linalg.norm(vec)
    vec = vec / (norm + 1e-8) if norm > 0 else vec
    time_afternoon = 1.0 if user.get("preferred_time") == "afternoon" else 0.0
    time_evening = 1.0 if user.get("preferred_time") == "evening" else 0.0
    social = user.get("social_level", 0.5)
    return np.concatenate([vec, [time_afternoon, time_evening, social]])


def fit_user_clusters(users: list, train_joins: list, bubbles: list, n_clusters: int = 4, kmeans_seed: int = 42):
    """
    Fit K-means on user vectors. Compute activity popularity per cluster from TRAIN joins only (no leakage).
    """
    bubble_ids = [b["id"] for b in bubbles]
    X = np.array([build_user_vector(u) for u in users])
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    n_clusters = min(max(2, n_clusters), len(users) - 1)
    kmeans = KMeans(n_clusters=n_clusters, random_state=kmeans_seed, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    user_id_to_idx = {u["id"]: i for i, u in enumerate(users)}
    user_id_to_cluster = {uid: int(labels[user_id_to_idx[uid]]) for uid in user_id_to_idx}

    cluster_popularity = {}
    for c in range(n_clusters):
        cluster_user_ids = [uid for uid, cl in user_id_to_cluster.items() if cl == c]
        cnt = {bid: 0 for bid in bubble_ids}
        for uid, bid in train_joins:
            if uid in cluster_user_ids and bid in cnt:
                cnt[bid] += 1
        cluster_popularity[c] = cnt
    return kmeans, scaler, cluster_popularity, user_id_to_cluster


def recommend_kmeans(
    user: dict,
    bubbles: list,
    kmeans,
    scaler,
    cluster_popularity: dict,
    user_id_to_cluster: dict,
    top_k: int = 6,
    score_weights: dict | None = None,
) -> list[dict]:
    """
    Score = w_cluster*pop + w_interest*match + w_time*match + w_proximity*proximity.
    user_id_to_cluster used only for existing users; new users get cluster from prediction.
    """
    if not bubbles:
        return []
    w = {**DEFAULT_SCORE_WEIGHTS, **(score_weights or {})}

    user_vec = build_user_vector(user)
    user_vec_scaled = scaler.transform(user_vec.reshape(1, -1))
    cluster = int(kmeans.predict(user_vec_scaled)[0])
    pop = cluster_popularity.get(cluster, {})

    user_cats = {INTEREST_TO_CATEGORY.get(x, "") for x in user.get("interests", [])}
    user_time = user.get("preferred_time", "afternoon")

    results = []
    for b in bubbles:
        cluster_pop = pop.get(b["id"], 0)
        interest_match = 1.0 if b["category"] in user_cats else 0.0
        activity_time = b.get("time_slot", "afternoon")
        time_match = 1.0 if activity_time == user_time else 0.0
        dist_km = parse_distance_km(b["distance"])
        proximity = 1.0 / (1.0 + dist_km)

        score = (
            w["cluster_popularity"] * cluster_pop
            + w["interest_match"] * interest_match
            + w["time_match"] * time_match
            + w["proximity"] * proximity
        )

        reasons = []
        if cluster_pop > 0:
            reasons.append("Popular in your community")
        if interest_match:
            reasons.append("Matches your interests")
        if time_match:
            reasons.append("Fits your schedule")
        if dist_km <= 0.5:
            reasons.append("Nearby")
        elif dist_km <= 1.0:
            reasons.append("Close by")

        b_copy = b.copy()
        b_copy["recommendation_score"] = float(score)
        b_copy["recommendation_reason"] = " • ".join(reasons[:3]) if reasons else "Recommended for you"
        results.append((score, b_copy))

    results.sort(key=lambda x: -x[0])
    return [r[1] for r in results[:top_k]]


def get_recommended_bubbles(
    user: dict,
    bubbles: list,
    top_k: int = 6,
    n_clusters: int = 4,
) -> list[dict]:
    """Public API."""
    from .synthetic_data import SYNTHETIC_USERS, USER_ACTIVITY_JOINS
    kmeans, scaler, cluster_pop, user_to_cluster = fit_user_clusters(
        SYNTHETIC_USERS, USER_ACTIVITY_JOINS, bubbles, n_clusters
    )
    return recommend_kmeans(user, bubbles, kmeans, scaler, cluster_pop, user_to_cluster, top_k)
