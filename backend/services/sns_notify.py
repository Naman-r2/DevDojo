import os
import boto3
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

# Initialize the Boto3 SNS client using credentials from environment variables
sns = boto3.client(
    "sns",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN")


# ✅ Check if email is already subscribed
def is_email_subscribed(email: str) -> bool:
    try:
        response = sns.list_subscriptions_by_topic(TopicArn=SNS_TOPIC_ARN)
        for sub in response.get("Subscriptions", []):
            if sub["Protocol"] == "email" and sub["Endpoint"] == email:
                return True
        return False
    except Exception as e:
        print(f"[SNS ERROR] Failed to check subscriptions: {e}")
        return False


# ✅ Subscribe user to SNS topic
def subscribe_user_to_topic(email: str):
    if not SNS_TOPIC_ARN:
        print("[SNS ERROR] SNS_TOPIC_ARN is not configured in .env file.")
        return None
    try:
        print(f"[SNS] Subscribing {email} to SNS topic...")
        response = sns.subscribe(
            TopicArn=SNS_TOPIC_ARN,
            Protocol="email",
            Endpoint=email,
            ReturnSubscriptionArn=False  # They need to confirm manually
        )
        print(f"[SNS] Subscription request sent to {email}")
        return response
    except Exception as e:
        print(f"[SNS ERROR] Could not subscribe {email}: {e}")
        return None


# 🔔 Challenge repo notification
def notify_member_of_new_repo(
    email: str,
    challenge_title: str,
    repo_name: str,
    clone_url: str | None,
    api_description: str | None = None  # ← Added optional param
):
    """
    Sends a personalized email to a single user about their challenge.
    The message content changes based on whether the repo was created successfully.
    Also includes API list if provided.
    """
    if not SNS_TOPIC_ARN:
        print("[SNS ERROR] SNS_TOPIC_ARN is not configured in .env file.")
        return None

    deadline = (datetime.utcnow() + timedelta(hours=8)).strftime('%Y-%m-%d %H:%M UTC')

    # ✅ FIX: Subject must be ASCII and max 100 characters
    safe_title = ''.join(c if ord(c) < 128 else '' for c in challenge_title)
    subject = f"Your Personal Challenge Environment for '{safe_title}'"[:100]

    if clone_url:
        repo_section = f"""
Your personal, private repository for this challenge has been created.

Repo Name: {repo_name}
Clone URL: {clone_url}

Please accept the collaborator invitation you receive from GitHub to gain push access.
"""
    else:
        repo_section = f"""
There was an issue creating your personal GitHub repository for this challenge. Please contact an administrator for assistance. You can still view the challenge details on the platform.
"""

    api_section = f"\n\n🔧 **APIs involved in this challenge:**\n{api_description}" if api_description else ""

    message = f"""
Hello!

A new challenge, '{challenge_title}', has started in your group.

{repo_section}

⏰ **Deadline:** You have 8 hours to submit your solution. The deadline is {deadline}.

{api_section}

Good luck!

- The Dojo Team
"""

    try:
        print(f"[SNS] Sending personalized repo notification to topic for user {email}")
        response = sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        print(f"[SNS Success] Sent notification regarding repo {repo_name}.")
        return response
    except Exception as e:
        print(f"[SNS ERROR] Could not send personalized notification: {e}")
        return None
