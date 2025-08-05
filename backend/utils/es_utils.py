import os
from typing import Dict, List, Optional
from elasticsearch import AsyncElasticsearch, NotFoundError
from elasticsearch.exceptions import RequestError
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
ES_HOST = os.getenv("ES_HOST", "http://localhost:9200")
CHALLENGE_INDEX = "challenges"
SUBMISSION_INDEX = "submissions"
LEADERBOARD_INDEX = "leaderboard"

# --- Elasticsearch Client Initialization ---
es = AsyncElasticsearch(ES_HOST)


# --- Index Initialization ---
async def init_indices():
    """Ensures all indices exist with proper mappings."""
    # Leaderboard index with explicit mapping
    if not await es.indices.exists(index=LEADERBOARD_INDEX):
        await es.indices.create(
            index=LEADERBOARD_INDEX,
            body={
                "mappings": {
                    "properties": {
                        "user_id": {"type": "keyword"},
                        "group_id": {"type": "keyword"},
                        "username": {"type": "text"},
                        "xp": {"type": "integer"}
                    }
                }
            }
        )
        print("[✅] Leaderboard index created.")


# --- Challenge Functions ---
async def save_challenge(challenge: Dict) -> str:
    """Saves a challenge document to Elasticsearch."""
    challenge_id = challenge["id"]
    res = await es.index(index=CHALLENGE_INDEX, id=challenge_id, document=challenge)
    print("Challenge save response:", res)
    return res["_id"]


async def get_challenge_by_id(challenge_id: str) -> Dict | None:
    """Retrieves a challenge document by its ID."""
    try:
        res = await es.get(index=CHALLENGE_INDEX, id=challenge_id)
        return res.get("_source")
    except NotFoundError:
        return None


# --- Submission Functions ---
async def save_submission(submission: Dict) -> str:
    """
    Saves a submission document to Elasticsearch.
    Crucially, this function now assumes 'username' is part of the 'submission' dictionary.
    """
    res = await es.index(index=SUBMISSION_INDEX, document=submission)
    print(f"[✅] Submission saved: {res['_id']}")

    # Automatically update leaderboard XP if completed
    if submission.get("status") == "completed" and submission.get("score") is not None:
        try:
            # Retrieve the username directly from the submission dictionary
            # The API endpoint (FastAPI route) is responsible for adding the correct username to the submission.
            # Added a robustness check here to ensure `actual_username` is not None
            actual_username = submission.get("username", submission["user_id"])
            if actual_username is None: # Double-check, though submission.get(key, fallback) handles this
                actual_username = submission["user_id"] # Fallback to user_id if username is somehow still None

            await update_leaderboard_xp(
                user_id=submission["user_id"],
                challenge_id=submission["challenge_id"],
                xp_to_add=int(float(submission["score"])),
                username=actual_username # Pass the *actual* user's username
            )
        except Exception as e:
            print(f"[❌] Failed to update XP after submission: {e}")

    return res["_id"]


async def get_submission_by_id(submission_id: str) -> Dict | None:
    """Retrieves a submission document by its ID."""
    try:
        res = await es.get(index=SUBMISSION_INDEX, id=submission_id)
        return res.get("_source")
    except NotFoundError:
        return None


# --- Leaderboard Functions ---
async def update_leaderboard_xp(user_id: str, challenge_id: str, xp_to_add: int, username: Optional[str] = None):
    """
    Updates a user's XP on the leaderboard for a specific challenge's group.
    Performs an upsert (update if exists, insert if not).
    The 'username' parameter now takes precedence.
    """
    print(f"[⚙️] Updating XP: user={user_id}, challenge={challenge_id}, xp={xp_to_add}")

    if not user_id:
        print("[WARN] Cannot update leaderboard for an unknown user.")
        return

    try:
        challenge_doc = await es.get(index=CHALLENGE_INDEX, id=challenge_id)
        group_id = challenge_doc["_source"].get("group_id")
        # THIS IS THE KEY CHANGE: REMOVE THE OLD PROBLEMATIC LINE BELOW!
        # if not username:
        #     username = user_id  # Placeholder until real user fetch
    except NotFoundError:
        print(f"[ERROR] Cannot update leaderboard: Challenge {challenge_id} not found.")
        return

    if not group_id:
        print(f"[WARN] Challenge {challenge_id} has no group_id. Skipping leaderboard update.")
        return

    doc_id = f"{group_id}_{user_id}"

    script = {
        "source": "if (ctx._source.containsKey('xp')) { ctx._source.xp += params.xp } else { ctx._source.xp = params.xp }",
        "lang": "painless",
        "params": {"xp": xp_to_add}
    }

    # Ensure final_username is never None when creating upsert_doc.
    # It prioritizes the 'username' argument passed to this function.
    # If for some reason 'username' is still None (e.g., bug in calling code),
    # it falls back to user_id as a last resort.
    final_username_for_upsert = username if username is not None else user_id

    upsert_doc = {
        "user_id": user_id,
        "group_id": group_id,
        "username": final_username_for_upsert, # Use the correctly provided username
        "xp": xp_to_add
    }

    try:
        await es.update(index=LEADERBOARD_INDEX, id=doc_id, script=script, upsert=upsert_doc)
        print(f"[✅] XP updated in leaderboard for {final_username_for_upsert}: {doc_id}")
    except RequestError as e:
        print("[ERROR] Failed to update leaderboard entry:", e)


async def get_leaderboard(group_id=None):
    if group_id:
        query = {"match": {"group_id": group_id}}
    else:
        query = {"match_all": {}}

    results = await es.search(index="leaderboard", body={"query": query})
    
    # ✅ FIX: Return only the _source fields
    return [hit["_source"] for hit in results["hits"]["hits"]]


