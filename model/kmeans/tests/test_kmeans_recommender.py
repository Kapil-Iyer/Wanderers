"""
Test cases for K-means recommender (user-clustering architecture).
"""

import pytest
import numpy as np

import sys
from pathlib import Path
_root = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(_root))

from model.kmeans.recommender import (
    get_recommended_bubbles,
    recommend_kmeans,
    build_user_vector,
    fit_user_clusters,
    CLUSTER_COUNT_MIN,
    CLUSTER_COUNT_MAX,
)
from model.kmeans.synthetic_data import (
    CURRENT_USER,
    SYNTHETIC_BUBBLES,
    SYNTHETIC_USERS,
    USER_ACTIVITY_JOINS,
    CATEGORIES,
)


class TestBuildUserVector:
    """User vector: [sports, study, casual, music, gaming, outdoors, time_afternoon, time_evening, social_level]"""

    def test_returns_nine_dims(self):
        vec = build_user_vector(CURRENT_USER)
        assert len(vec) == 9

    def test_category_part_normalized(self):
        vec = build_user_vector(CURRENT_USER)
        cat_part = vec[:6]
        norm = np.linalg.norm(cat_part)
        assert 0.99 <= norm <= 1.01 or norm < 1e-6

    def test_empty_interests_category_part_zero(self):
        user = {"interests": [], "preferred_time": "afternoon", "social_level": 0.5}
        vec = build_user_vector(user)
        assert np.allclose(vec[:6], 0)
        assert vec[6] >= 0 and vec[8] >= 0

    def test_interests_map_to_categories(self):
        user = {"interests": ["Basketball", "Coffee"], "preferred_time": "afternoon", "social_level": 0.5}
        vec = build_user_vector(user)
        sports_idx = list(CATEGORIES).index("Sports")
        casual_idx = list(CATEGORIES).index("Casual")
        assert vec[sports_idx] > 0
        assert vec[casual_idx] > 0


class TestFitUserClusters:
    """Test user clustering and popularity computation."""

    def test_fit_returns_four_items(self):
        kmeans, scaler, pop, user_to_cluster = fit_user_clusters(
            SYNTHETIC_USERS, USER_ACTIVITY_JOINS, SYNTHETIC_BUBBLES, n_clusters=4
        )
        assert kmeans is not None
        assert scaler is not None
        assert len(user_to_cluster) == len(SYNTHETIC_USERS)
        assert len(pop) == 4

    def test_cluster_labels_in_range(self):
        _, _, _, user_to_cluster = fit_user_clusters(
            SYNTHETIC_USERS, USER_ACTIVITY_JOINS, SYNTHETIC_BUBBLES, n_clusters=4
        )
        for uid, c in user_to_cluster.items():
            assert 0 <= c < 4


class TestRecommendKmeans:
    """Test recommendation logic."""

    def test_returns_list(self):
        recs = get_recommended_bubbles(CURRENT_USER, SYNTHETIC_BUBBLES)
        assert isinstance(recs, list)

    def test_returns_at_most_top_k(self):
        recs = get_recommended_bubbles(CURRENT_USER, SYNTHETIC_BUBBLES, top_k=4)
        assert len(recs) <= 4

    def test_empty_bubbles_returns_empty(self):
        recs = get_recommended_bubbles(CURRENT_USER, [])
        assert recs == []

    def test_each_result_has_required_fields(self):
        recs = get_recommended_bubbles(CURRENT_USER, SYNTHETIC_BUBBLES)
        for r in recs:
            assert "id" in r
            assert "title" in r
            assert "recommendation_score" in r
            assert "recommendation_reason" in r

    def test_scores_ordered_descending(self):
        recs = get_recommended_bubbles(CURRENT_USER, SYNTHETIC_BUBBLES)
        scores = [r["recommendation_score"] for r in recs]
        assert scores == sorted(scores, reverse=True)

    def test_reason_non_empty(self):
        recs = get_recommended_bubbles(CURRENT_USER, SYNTHETIC_BUBBLES)
        for r in recs:
            assert isinstance(r["recommendation_reason"], str)
            assert len(r["recommendation_reason"]) > 0

    def test_user_interests_affect_ranking(self):
        sports_user = {"interests": ["Basketball", "Soccer"], "preferred_time": "afternoon", "social_level": 0.8}
        recs_sports = get_recommended_bubbles(sports_user, SYNTHETIC_BUBBLES)
        sports_cats = [r["category"] for r in recs_sports]
        assert "Sports" in sports_cats, "Sports user should get at least one Sports rec (cluster + interest)"

    def test_no_duplicates(self):
        recs = get_recommended_bubbles(CURRENT_USER, SYNTHETIC_BUBBLES)
        ids = [r["id"] for r in recs]
        assert len(ids) == len(set(ids))


class TestDeterminism:
    def test_same_input_same_output(self):
        r1 = get_recommended_bubbles(CURRENT_USER, SYNTHETIC_BUBBLES)
        r2 = get_recommended_bubbles(CURRENT_USER, SYNTHETIC_BUBBLES)
        assert [x["id"] for x in r1] == [x["id"] for x in r2]


class TestClusterCountConstants:
    def test_recommended_interval(self):
        assert CLUSTER_COUNT_MIN >= 2
        assert CLUSTER_COUNT_MAX >= CLUSTER_COUNT_MIN
        assert CLUSTER_COUNT_MAX <= 10
