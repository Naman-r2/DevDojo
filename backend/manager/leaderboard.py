from typing import List
from collections import defaultdict
from schemas.schemas import LeaderboardEntry, GroupLeaderboardEntry
from utils.es_utils import get_leaderboard


# manager/leaderboard.py
async def get_global_leaderboard_es() -> List[LeaderboardEntry]:
    all_entries = await get_leaderboard(group_id=None)
    user_score_aggregator = defaultdict(lambda: {"xp":0.0, "username": "Unknown"}) # Change score to xp

    for entry in all_entries:
        user_id = entry.get("user_id")
        if user_id:
            user_score_aggregator[user_id]["xp"] += entry.get("xp", 0.0) # Change score to xp
            if user_score_aggregator[user_id]["username"] == "Unknown":
                user_score_aggregator[user_id]["username"] = entry.get("username", "Unknown")

    global_leaderboard = [
        LeaderboardEntry(
            user_id=user_id,
            username=data["username"],
            xp=data["xp"] # Change score to xp
        )
        for user_id, data in user_score_aggregator.items()
    ]
    return sorted(global_leaderboard, key=lambda x: x.xp, reverse=True) # Change score to xp

async def get_group_leaderboard_es(group_id: str) -> List[GroupLeaderboardEntry]:
    try:
        raw_data = await get_leaderboard(group_id=group_id)
    except Exception as e:
        print(f"Error fetching leaderboard from ES: {e}")
        return []

    group_leaderboard = []
    for entry in raw_data:
        # Safely fetch values with fallback
        user_id = entry.get("user_id")
        username = entry.get("username", "Unknown")
        xp = entry.get("xp", 0.0)

        if not user_id:
            continue  # skip entries without user_id

        group_leaderboard.append(
            GroupLeaderboardEntry(
                user_id=user_id,
                username=username,
                xp=xp,
                group_id=group_id
            )
        )

    return sorted(group_leaderboard, key=lambda x: x.xp, reverse=True)