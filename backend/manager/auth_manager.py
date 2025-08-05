from elasticsearch import AsyncElasticsearch, NotFoundError
from uuid import uuid4
from schemas.schemas import UserCreate, UserUpdate
from utils.password_utils import hash_password
from datetime import datetime

es = AsyncElasticsearch("http://localhost:9200")
USER_INDEX = "users"

# --- Create User ---
async def create_user(user: UserCreate) -> dict:
    user_id = str(uuid4())
    hashed_pw = hash_password(user.password)
    doc = {
        "id": user_id,
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_pw,
        "github_username": None,
        "created_at": datetime.utcnow().isoformat()
    }
    await es.index(index=USER_INDEX, id=user_id, document=doc)
    return {"id": user_id, "username": user.username, "email": user.email}

# --- Get User by Email ---
async def get_user_by_email(email: str) -> dict | None:
    query = {
        "query": {
            "term": {
                "email": email
            }
        }
    }
    response = await es.search(index=USER_INDEX, body=query)
    hits = response["hits"]["hits"]
    return hits[0]["_source"] if hits else None

# --- Get User by ID ---
async def get_user_by_id(user_id: str) -> dict | None:
    try:
        response = await es.get(index=USER_INDEX, id=user_id)
        return response["_source"]
    except NotFoundError:
        return None

# --- Update User Profile ---
async def update_user_profile(user_id: str, user_update: UserUpdate) -> dict | None:
    script = {
        "source": "ctx._source.github_username = params.github_username",
        "lang": "painless",
        "params": {
            "github_username": user_update.github_username
        }
    }
    try:
        await es.update(index=USER_INDEX, id=user_id, script=script)
        updated_user = await get_user_by_id(user_id)
        return updated_user
    except NotFoundError:
        return None

# --- NEW: Delete User ---
async def delete_user_by_id(user_id: str) -> bool:
    """
    Deletes a user from Elasticsearch by their ID.
    Returns True if deletion is successful, False if user not found.
    """
    try:
        await es.delete(index=USER_INDEX, id=user_id)
        return True
    except NotFoundError:
        return False
