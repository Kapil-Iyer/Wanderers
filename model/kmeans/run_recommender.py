#!/usr/bin/env python3
"""
Run K-means recommender and output JSON for the Home screen.
Usage: python run_recommender.py [--output path]
"""

import argparse
import json
from pathlib import Path

try:
    from .recommender import get_recommended_bubbles
    from .synthetic_data import CURRENT_USER, SYNTHETIC_BUBBLES
except ImportError:
    from recommender import get_recommended_bubbles
    from synthetic_data import CURRENT_USER, SYNTHETIC_BUBBLES


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", "-o", help="Write JSON to file instead of stdout")
    args = parser.parse_args()

    recs = get_recommended_bubbles(CURRENT_USER, SYNTHETIC_BUBBLES)

    # Convert to frontend-friendly format (camelCase for JS)
    output = [
        {
            "id": r["id"],
            "emoji": r["emoji"],
            "title": r["title"],
            "category": r["category"],
            "joined": r["joined"],
            "maxPeople": r["max_people"],
            "startingIn": r["starting_in"],
            "distance": r["distance"],
            "description": r["description"],
            "creator": r["creator"],
            "creatorAvatar": r.get("creator_avatar", r["creator"][:2].upper()),
            "recommendationScore": r["recommendation_score"],
            "recommendationReason": r["recommendation_reason"],
        }
        for r in recs
    ]

    json_str = json.dumps(output, indent=2)

    if args.output:
        Path(args.output).write_text(json_str, encoding="utf-8")
        print(f"Wrote {len(output)} recommendations to {args.output}")
    else:
        print(json_str)


if __name__ == "__main__":
    main()
