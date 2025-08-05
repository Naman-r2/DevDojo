import os
import asyncio
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks,Path
from elasticsearch import AsyncElasticsearch, NotFoundError

from services.security import get_current_user
from schemas.schemas import ChallengeCreate, ChallengeOut
from services.dify_agents import (
    trigger_agent_1,
    trigger_agent_2_breakdown,
    trigger_agent_3_testcases,
)
from utils.es_utils import save_challenge
from services.sns_notify import notify_member_of_new_repo
from services.github_service import create_challenge_repository_and_invite
from manager.group_manager_es import get_group_members_es
from manager.auth_manager import get_user_by_id

CHALLENGE_INDEX = "challenges"
BREAKDOWN_INDEX = "breakdowns"
SUBMISSION_INDEX = "submissions"

TESTCASE_INDEX = "testcases"
ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")

es = AsyncElasticsearch(ELASTICSEARCH_URL)
router = APIRouter(prefix="/challenges", tags=["Challenges"])

# --- Background Task ---
async def setup_challenge_repos_for_group(
    challenge_id: str,
    group_id: str,
    challenge_topic: str,
    api_description: str = ""  # ✅ NEW PARAM
):
    """
    Creates a unique, private GitHub repo for each member of a group.
    Sends SNS email with API info.
    """
    print(f"🚀 Starting background task: Create repos for challenge {challenge_id}")
    
    member_ids = await get_group_members_es(group_id)
    if not member_ids:
        print(f"[WARN] No members found for group {group_id}.")
        return

    for user_id in member_ids:
        user = await get_user_by_id(user_id)
        if not user:
            print(f"[WARN] User {user_id} not found. Skipping.")
            continue

        email = user.get("email")
        github_username = user.get("github_username")

        if not email or not github_username:
            print(f"[WARN] User {user_id} missing email or GitHub username. Skipping.")
            continue

        print(f"Creating repo for challenge '{challenge_id}' for user '{github_username}'...")

        repo_details = create_challenge_repository_and_invite(
            challenge_id=challenge_id,
            user_id=user_id,
            collaborator_username=github_username
        )

        if not repo_details:
            print(f"❌ Repo creation failed for user {user_id}.")
            continue

        # ✅ Notify user with API description from Agent 2
        notify_member_of_new_repo(
            email=email,
            challenge_title=challenge_topic,
            repo_name=repo_details["repo_name"],
            clone_url=repo_details["clone_url"],
            api_description=api_description
        )
        await asyncio.sleep(2)  # Avoid rate limit

    print(f"✅ Repo setup completed for challenge {challenge_id}")


@router.post("/", response_model=ChallengeOut, status_code=202)
async def create_challenge(
    challenge: ChallengeCreate,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user)
):
    """
    Creates a challenge, generates content via agents, and schedules repo creation.
    """
    challenge_id = str(uuid4())
    doc = challenge.dict()
    doc["id"] = challenge_id
    doc["created_by"] = current_user["id"]

    try:
        print(f"[{challenge_id}] Triggering agents for topic: {challenge.Topic}")
        problem_statement = await trigger_agent_1(Topic=challenge.Topic, difficulty=challenge.difficulty, user_id=current_user["id"])
        doc["problem_statement"] = problem_statement.get("data", {}).get("outputs", {}).get("answer", "").strip()
        if not doc["problem_statement"]:
            raise ValueError("Agent 1 (Problem Statement) returned empty.")

        breakdown_result = await trigger_agent_2_breakdown(statement=doc["problem_statement"], user_id=current_user["id"])
        breakdown_text = breakdown_result.get("data", {}).get("outputs", {}).get("answer", {}).get("api", "")
        api_description = breakdown_text  # ✅ Needed in background task

        test_result = await trigger_agent_3_testcases(prompt=doc["problem_statement"], user_id=current_user["id"])
        test_cases_text = test_result.get("data", {}).get("outputs", {}).get("answer", {}).get("raw_text_from_previous_step", "")

        await save_challenge(doc)
        await es.index(index=BREAKDOWN_INDEX, id=challenge_id, document={"challenge_id": challenge_id, "breakdown": breakdown_text})
        await es.index(index=TESTCASE_INDEX, id=challenge_id, document={"challenge_id": challenge_id, "testcases": test_cases_text})
        print(f"[{challenge_id}] ✅ Agent generation complete.")

    except Exception as e:
        print(f"❌ Exception during agent orchestration: {e}")
        raise HTTPException(status_code=503, detail=f"Agent failure: {e}")

    # ✅ Schedule background task and pass Agent 2 breakdown
    background_tasks.add_task(
        setup_challenge_repos_for_group,
        challenge_id=challenge_id,
        group_id=challenge.group_id,
        challenge_topic=challenge.Topic,
        api_description=api_description  # ✅ Passed here
    )

    print(f"[{challenge_id}] ✅ Background task for repo setup scheduled.")
    return ChallengeOut(**doc)


@router.get("/{challenge_id}", response_model=ChallengeOut)
async def get_challenge_by_id(
    challenge_id: str = Path(..., title="Challenge ID"),
    current_user=Depends(get_current_user)
):
    """
    Retrieve a challenge by its ID.
    """
    try:
        response = await es.get(index=CHALLENGE_INDEX, id=challenge_id)
        challenge_doc = response["_source"]

        return ChallengeOut(**challenge_doc)

    except Exception as e:
        print(f"❌ Failed to get challenge {challenge_id}: {e}")
        raise HTTPException(status_code=404, detail=f"Challenge with ID '{challenge_id}' not found.")
    

@router.get("/groups/{group_id}")
async def get_group(group_id: str):
    response = await es.get(index="groups", id=group_id, ignore=[404])
    if not response["found"]:
        raise HTTPException(status_code=404, detail="Group not found")
    return response["_source"]


@router.get("/group/{group_id}/previous")
async def get_previous_challenges(group_id: str, current_user=Depends(get_current_user)):
    """
    Returns all previous challenges created in the given group.
    """
    try:
        query = {
            "bool": {
                "must": [
                    { "match": { "group_id": group_id } }
                ]
            }
        }

        results = await es.search(index=CHALLENGE_INDEX, query=query, size=100)
        challenges = [hit["_source"] for hit in results["hits"]["hits"]]

        return challenges

    except Exception as e:
        print(f"❌ Error fetching previous challenges for group {group_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch previous challenges")



@router.get("/feedback/{user_id}")
async def get_recent_feedback(user_id: str):
    """
    Returns last 2 feedbacks for a user based on submissions.
    """
    try:
        query = {
            "bool": {
                "must": [
                    {"match": {"user_id": user_id}},
                    {"match": {"status": "completed"}}
                ]
            }
        }

        results = await es.search(
            index=SUBMISSION_INDEX,
            query=query,
            size=2,
            sort=[{"processed_at": {"order": "desc"}}]
        )

        feedbacks = []
        for hit in results["hits"]["hits"]:
            src = hit["_source"]
            feedbacks.append({
                "challenge_id": src.get("challenge_id"),
                "score": src.get("score"),
                "feedback": src.get("feedback"),
                "processed_at": src.get("processed_at")
            })

        return feedbacks

    except NotFoundError:
        print(f"❌ Submissions index '{SUBMISSION_INDEX}' not found.")
        raise HTTPException(status_code=500, detail="Submission index not found.")
    except Exception as e:
        print(f"❌ Error fetching feedback for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch feedback")