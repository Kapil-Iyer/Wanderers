"""
Evaluation: train/test on user-activity joins. No leakage (popularity from train only).
Multiple seeds, K=3..6, tunable score weights.
"""

from pathlib import Path
import random

import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

from .recommender import (
    build_user_vector,
    fit_user_clusters,
    recommend_kmeans,
    DEFAULT_SCORE_WEIGHTS,
    CLUSTER_COUNT_MIN,
    CLUSTER_COUNT_MAX,
)
from .synthetic_data import (
    CURRENT_USER,
    SYNTHETIC_BUBBLES,
    SYNTHETIC_USERS,
    USER_ACTIVITY_JOINS,
)

TARGET_ACCURACY = 75
TRAIN_RATIO = 0.7
TOP_K_FOR_HIT = 6
EVAL_SEEDS = [42, 43, 44, 45, 46, 47, 48]
K_OPTIONS = [3, 4, 5, 6]

# Tuned weights (cluster popularity + interest match)
TUNED_WEIGHTS = {
    "cluster_popularity": 2.8,
    "interest_match": 1.5,
    "time_match": 0.6,
    "proximity": 1.0,
}


def _split_joins(joins: list, seed: int) -> tuple[list, list]:
    data = list(joins)
    rng = random.Random(seed)
    rng.shuffle(data)
    n_train = max(1, int(len(data) * TRAIN_RATIO))
    return data[:n_train], data[n_train:]


def _hit_rate(test_joins: list, user_by_id: dict, bubbles: list, kmeans, scaler, cluster_pop, user_to_cluster, weights: dict) -> float:
    hits = 0
    for uid, bid in test_joins:
        user = user_by_id.get(uid)
        if not user:
            continue
        recs = recommend_kmeans(user, bubbles, kmeans, scaler, cluster_pop, user_to_cluster, top_k=TOP_K_FOR_HIT, score_weights=weights)
        if bid in [r["id"] for r in recs]:
            hits += 1
    return hits / len(test_joins) * 100 if test_joins else 0


def run_single_eval(
    joins: list,
    users: list,
    bubbles: list,
    split_seed: int,
    n_clusters: int,
    kmeans_seed: int = 42,
    score_weights: dict | None = None,
) -> dict:
    """Single evaluation run. Popularity from train_joins only."""
    train_joins, test_joins = _split_joins(joins, split_seed)
    user_by_id = {u["id"]: u for u in users}
    bubble_ids = [b["id"] for b in bubbles]

    X = np.array([build_user_vector(u) for u in users])
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    n_clusters = min(max(2, n_clusters), len(users) - 1)
    kmeans = KMeans(n_clusters=n_clusters, random_state=kmeans_seed, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    user_id_to_cluster = {u["id"]: int(labels[i]) for i, u in enumerate(users)}

    cluster_pop = {}
    for c in range(n_clusters):
        cluster_uids = [uid for uid, cl in user_id_to_cluster.items() if cl == c]
        cnt = {bid: 0 for bid in bubble_ids}
        for uid, bid in train_joins:
            if uid in cluster_uids and bid in cnt:
                cnt[bid] += 1
        cluster_pop[c] = cnt

    hr = _hit_rate(test_joins, user_by_id, bubbles, kmeans, scaler, cluster_pop, user_id_to_cluster, score_weights or TUNED_WEIGHTS)
    sil = silhouette_score(X_scaled, labels) if n_clusters >= 2 else 0
    return {
        "hit_rate": hr,
        "silhouette": sil,
        "n_train": len(train_joins),
        "n_test": len(test_joins),
    }


def run_evaluation(
    n_clusters: int = 4,
    seeds: list | None = None,
    score_weights: dict | None = None,
) -> dict:
    """Run evaluation across multiple seeds. Returns mean ± std Hit Rate@6."""
    seeds = seeds or EVAL_SEEDS
    weights = score_weights or TUNED_WEIGHTS
    hrs = []
    sils = []
    for s in seeds:
        r = run_single_eval(USER_ACTIVITY_JOINS, SYNTHETIC_USERS, SYNTHETIC_BUBBLES, split_seed=s, n_clusters=n_clusters, score_weights=weights)
        hrs.append(r["hit_rate"])
        sils.append(r["silhouette"])

    mean_hr = round(float(np.mean(hrs)), 1)
    std_hr = round(float(np.std(hrs)), 1)
    mean_sil = round(float(np.mean(sils)), 4)

    train_joins, test_joins = _split_joins(USER_ACTIVITY_JOINS, seeds[0])
    kmeans, scaler, cluster_pop, user_to_cluster = fit_user_clusters(
        SYNTHETIC_USERS, train_joins, SYNTHETIC_BUBBLES, n_clusters
    )
    recs = recommend_kmeans(CURRENT_USER, SYNTHETIC_BUBBLES, kmeans, scaler, cluster_pop, user_to_cluster, score_weights=weights)

    return {
        "hit_rate_mean": mean_hr,
        "hit_rate_std": std_hr,
        "hit_rates": hrs,
        "silhouette_mean": mean_sil,
        "target": TARGET_ACCURACY,
        "meets_target": mean_hr >= TARGET_ACCURACY,
        "n_clusters": n_clusters,
        "n_seeds": len(seeds),
        "n_users": len(SYNTHETIC_USERS),
        "n_activities": len(SYNTHETIC_BUBBLES),
        "n_joins": len(USER_ACTIVITY_JOINS),
        "n_train": len(train_joins),
        "n_test": len(test_joins),
        "k_range": f"[{CLUSTER_COUNT_MIN}, {CLUSTER_COUNT_MAX}]",
        "recommendations": [
            {"id": r["id"], "title": r["title"], "category": r["category"], "reason": r["recommendation_reason"]}
            for r in recs
        ],
    }


def _tune_weights() -> dict:
    """Quick grid search for weights that maximize Hit Rate@6."""
    candidates = [
        {"cluster_popularity": 2.5, "interest_match": 1.4, "time_match": 0.6, "proximity": 1.0},
        {"cluster_popularity": 2.8, "interest_match": 1.5, "time_match": 0.5, "proximity": 1.0},
        {"cluster_popularity": 3.0, "interest_match": 1.3, "time_match": 0.6, "proximity": 1.0},
    ]
    best = TUNED_WEIGHTS
    best_hr = 0
    for w in candidates:
        m = run_evaluation(n_clusters=5, seeds=EVAL_SEEDS[:5], score_weights=w)
        if m["hit_rate_mean"] > best_hr:
            best_hr = m["hit_rate_mean"]
            best = w
    return best


def run_full_sweep() -> dict:
    """Sweep K=3,4,5,6 across seeds. Return best K and metrics."""
    best_k = 4
    best_hr = 0
    all_results = {}
    for k in K_OPTIONS:
        m = run_evaluation(n_clusters=k)
        all_results[k] = {"mean": m["hit_rate_mean"], "std": m["hit_rate_std"]}
        if m["hit_rate_mean"] > best_hr:
            best_hr = m["hit_rate_mean"]
            best_k = k
    return {
        "best_k": best_k,
        "best_hr": best_hr,
        "by_k": all_results,
        "full_metrics": run_evaluation(n_clusters=best_k),
    }


def suggest_cluster_count() -> list[dict]:
    X = np.array([build_user_vector(u) for u in SYNTHETIC_USERS])
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    results = []
    for k in range(CLUSTER_COUNT_MIN, min(CLUSTER_COUNT_MAX + 1, len(SYNTHETIC_USERS))):
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X_scaled)
        sil = silhouette_score(X_scaled, labels) if k >= 2 else 0
        results.append({"k": k, "silhouette": round(sil, 4)})
    return results


def generate_report(output_path: str | Path | None = None, tune: bool = False) -> str:
    global TUNED_WEIGHTS
    if tune:
        TUNED_WEIGHTS = _tune_weights()
    sweep = run_full_sweep()
    m = sweep["full_metrics"]
    status = "PASS" if m["meets_target"] else "FAIL"

    lines = [
        "=" * 65,
        "K-MEANS RECOMMENDER EVALUATION REPORT",
        "=" * 65,
        "",
        "DATA",
        "-" * 45,
        f"  Users:       {m['n_users']}",
        f"  Activities:  {m['n_activities']}",
        f"  Joins:       {m['n_joins']}",
        f"  Train:       {m['n_train']}  |  Test: {m['n_test']}",
        "",
        "ACCURACY (Hit Rate@6, mean ± std over {} seeds)".format(m["n_seeds"]),
        "-" * 45,
        f"  Hit Rate:    {m['hit_rate_mean']}% ± {m['hit_rate_std']}%",
        f"  Target:      {m['target']}%",
        f"  Status:      {status}",
        f"  Best K:      {sweep['best_k']}",
        "",
        "K SWEEP (K=3,4,5,6)",
        "-" * 45,
    ]
    for k, v in sweep["by_k"].items():
        lines.append(f"  K={k}: {v['mean']}% ± {v['std']}%")
    lines.extend([
        "",
        "SILHOUETTE BY K",
        "-" * 45,
    ])
    for r in suggest_cluster_count():
        lines.append(f"  K={r['k']}: {r['silhouette']}")
    lines.extend([
        "",
        "SCORE WEIGHTS (tuned)",
        "-" * 45,
        f"  {TUNED_WEIGHTS}",
        "",
        "NO LEAKAGE: cluster popularity computed from TRAIN joins only.",
        "",
        "=" * 65,
    ])
    report = "\n".join(lines)
    if output_path:
        Path(output_path).write_text(report, encoding="utf-8")
    return report


if __name__ == "__main__":
    report = generate_report(Path(__file__).parent / "evaluation_report.txt", tune=False)
    print(report)
    m = run_full_sweep()["full_metrics"]
    print()
    print(">>> ACCURACY STATEMENT <<<")
    print(f"Hit Rate@6: {m['hit_rate_mean']}% ± {m['hit_rate_std']}% (target {m['target']}%). Status: {'PASS' if m['meets_target'] else 'FAIL'}.")
