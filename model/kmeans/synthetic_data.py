"""
Synthetic database for K-means recommender.
Architecture: K-means clusters USERS. Recommend activities popular in user's cluster.

User archetypes: Sporty, Academic, Social, Creative, Outdoors, Gaming, Mixed.
"""

import random
from typing import Optional

CATEGORIES = ["Sports", "Casual", "Study", "Music", "Gaming", "Outdoors"]
CATEGORY_TO_IDS = {c: i for i, c in enumerate(CATEGORIES)}

INTEREST_TO_CATEGORY = {
    "Basketball": "Sports", "Soccer": "Sports", "Running": "Sports", "Swimming": "Sports",
    "Yoga": "Sports", "Ping Pong": "Sports", "Coffee": "Casual", "Food": "Casual",
    "Studying": "Study", "Coding": "Study", "Music": "Music", "Gaming": "Gaming",
    "Board Games": "Gaming", "Hiking": "Outdoors", "Photography": "Outdoors", "Gardening": "Outdoors",
}

# Archetype definitions: (primary_category, secondary_categories, preferred_time, social_level_range)
ARCHETYPES = [
    ("Sporty", ["Sports"], ["afternoon", "evening"], (0.6, 0.95)),
    ("Academic", ["Study"], ["evening", "afternoon"], (0.3, 0.7)),
    ("Social", ["Casual"], ["afternoon", "evening"], (0.7, 0.95)),
    ("Creative", ["Music"], ["evening", "afternoon"], (0.4, 0.8)),
    ("Outdoors", ["Outdoors"], ["morning", "afternoon"], (0.4, 0.7)),
    ("Gaming", ["Gaming"], ["evening"], (0.5, 0.9)),
    ("Mixed", ["Sports", "Casual", "Study", "Music", "Gaming", "Outdoors"], ["afternoon", "evening"], (0.5, 0.85)),
]

INTERESTS_BY_CATEGORY = {
    "Sports": ["Basketball", "Soccer", "Running", "Swimming", "Yoga", "Ping Pong"],
    "Casual": ["Coffee", "Food"],
    "Study": ["Studying", "Coding"],
    "Music": ["Music"],
    "Gaming": ["Gaming", "Board Games"],
    "Outdoors": ["Hiking", "Photography", "Gardening"],
}


def _pick_interests(categories: list, n_primary: int = 2, n_secondary: int = 0) -> list[str]:
    out = []
    for cat in categories[:2]:
        opts = INTERESTS_BY_CATEGORY.get(cat, [cat])
        out.extend(random.sample(opts, min(n_primary, len(opts))))
    for cat in categories[2:2 + n_secondary]:
        opts = INTERESTS_BY_CATEGORY.get(cat, [cat])
        if opts:
            out.append(random.choice(opts))
    return list(dict.fromkeys(out))


def generate_users(n: int = 80, seed: Optional[int] = None) -> list[dict]:
    """Generate n users from archetypes with realistic variation."""
    rng = random.Random(seed)
    users = []
    per_archetype = max(2, n // len(ARCHETYPES))
    remainder = n - per_archetype * len(ARCHETYPES)

    for i, (name, cats, times, (slo, shi)) in enumerate(ARCHETYPES):
        count = per_archetype + (1 if i < remainder else 0)
        for j in range(count):
            uid = f"u{len(users) + 1}"
            n_prim = rng.randint(2, 3)
            n_sec = rng.randint(0, 1) if "Mixed" in name else 0
            interests = _pick_interests(cats, n_prim, n_sec)
            time = rng.choice(times)
            social = round(rng.uniform(slo, shi), 2)
            users.append({
                "id": uid,
                "name": f"User {uid}",
                "interests": interests,
                "preferred_time": time,
                "social_level": social,
            })
    rng.shuffle(users)
    return users


SYNTHETIC_BUBBLES = [
    {"id": "1", "emoji": "🏀", "title": "3v3 Basketball", "category": "Sports", "time_slot": "afternoon",
     "joined": 4, "max_people": 6, "starting_in": "15 mins", "distance": "0.3 km", "creator": "M", "creator_avatar": "MJ"},
    {"id": "2", "emoji": "☕", "title": "Coffee & Chat", "category": "Casual", "time_slot": "afternoon",
     "joined": 2, "max_people": 5, "starting_in": "30 mins", "distance": "0.5 km", "creator": "S", "creator_avatar": "SK"},
    {"id": "3", "emoji": "📚", "title": "CS 341 Study Group", "category": "Study", "time_slot": "evening",
     "joined": 3, "max_people": 8, "starting_in": "1 hr", "distance": "0.1 km", "creator": "A", "creator_avatar": "AW"},
    {"id": "4", "emoji": "🎮", "title": "Smash Bros Tournament", "category": "Gaming", "time_slot": "evening",
     "joined": 6, "max_people": 8, "starting_in": "45 mins", "distance": "0.8 km", "creator": "D", "creator_avatar": "DL"},
    {"id": "5", "emoji": "🎵", "title": "Open Jam Session", "category": "Music", "time_slot": "evening",
     "joined": 3, "max_people": 6, "starting_in": "2 hrs", "distance": "1.2 km", "creator": "P", "creator_avatar": "PR"},
    {"id": "6", "emoji": "🥾", "title": "Sunset Hike", "category": "Outdoors", "time_slot": "evening",
     "joined": 5, "max_people": 10, "starting_in": "3 hrs", "distance": "2.0 km", "creator": "J", "creator_avatar": "JT"},
    {"id": "7", "emoji": "⚽", "title": "Pickup Soccer", "category": "Sports", "time_slot": "afternoon",
     "joined": 8, "max_people": 14, "starting_in": "20 mins", "distance": "0.4 km", "creator": "C", "creator_avatar": "CM"},
    {"id": "8", "emoji": "🍕", "title": "Pizza Night", "category": "Casual", "time_slot": "evening",
     "joined": 4, "max_people": 6, "starting_in": "1 hr", "distance": "0.2 km", "creator": "E", "creator_avatar": "EL"},
    {"id": "9", "emoji": "🎲", "title": "Board Game Night", "category": "Gaming", "time_slot": "evening",
     "joined": 5, "max_people": 8, "starting_in": "45 mins", "distance": "0.6 km", "creator": "S", "creator_avatar": "SP"},
    {"id": "10", "emoji": "🧘", "title": "Campus Yoga", "category": "Sports", "time_slot": "morning",
     "joined": 2, "max_people": 12, "starting_in": "1 hr", "distance": "0.3 km", "creator": "M", "creator_avatar": "MK"},
    {"id": "11", "emoji": "📖", "title": "Algo Study Session", "category": "Study", "time_slot": "evening",
     "joined": 4, "max_people": 6, "starting_in": "2 hrs", "distance": "0.2 km", "creator": "T", "creator_avatar": "TS"},
    {"id": "12", "emoji": "🎤", "title": "Karaoke Night", "category": "Music", "time_slot": "evening",
     "joined": 6, "max_people": 10, "starting_in": "1 hr", "distance": "0.7 km", "creator": "N", "creator_avatar": "NV"},
    {"id": "13", "emoji": "🏃", "title": "Morning Run", "category": "Sports", "time_slot": "morning",
     "joined": 3, "max_people": 8, "starting_in": "30 mins", "distance": "0.5 km", "creator": "R", "creator_avatar": "RK"},
    {"id": "14", "emoji": "🍜", "title": "Dinner & Chill", "category": "Casual", "time_slot": "evening",
     "joined": 5, "max_people": 8, "starting_in": "1 hr", "distance": "0.4 km", "creator": "A", "creator_avatar": "AM"},
    {"id": "15", "emoji": "🌲", "title": "Trail Walk", "category": "Outdoors", "time_slot": "afternoon",
     "joined": 4, "max_people": 8, "starting_in": "2 hrs", "distance": "1.5 km", "creator": "Z", "creator_avatar": "ZH"},
]


def generate_joins(
    users: list,
    bubbles: list,
    target_joins: int = 200,
    match_prob: float = 0.58,
    cross_prob: float = 0.10,
    seed: Optional[int] = None,
) -> list[tuple[str, str]]:
    """
    Generate user-activity joins. Match = user interests include activity category.
    Strong preference for matches; some cross-interest noise.
    No leakage: joins are independent of train/test split.
    """
    rng = random.Random(seed)
    user_by_id = {u["id"]: u for u in users}
    bubble_by_id = {b["id"]: b for b in bubbles}
    user_cats = {
        uid: {INTEREST_TO_CATEGORY.get(i, "") for i in u["interests"]}
        for uid, u in user_by_id.items()
    }
    joins = []
    pool = [(uid, bid) for uid in user_by_id for bid in bubble_by_id]
    rng.shuffle(pool)
    for uid, bid in pool:
        if len(joins) >= target_joins:
            break
        u = user_by_id[uid]
        b = bubble_by_id[bid]
        cats = user_cats[uid]
        is_match = b["category"] in cats
        p = match_prob if is_match else cross_prob
        if rng.random() < p:
            joins.append((uid, bid))
    return joins


# Default dataset (reproducible)
DEFAULT_SEED = 42
SYNTHETIC_USERS = generate_users(n=80, seed=DEFAULT_SEED)
USER_ACTIVITY_JOINS = generate_joins(
    SYNTHETIC_USERS, SYNTHETIC_BUBBLES,
    target_joins=200, match_prob=0.52, cross_prob=0.06, seed=DEFAULT_SEED,
)
CURRENT_USER = SYNTHETIC_USERS[0]


def parse_distance_km(distance_str: str) -> float:
    import re
    m = re.search(r"[\d.]+", str(distance_str))
    return float(m.group()) if m else 999.0
