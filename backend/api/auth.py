from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from schemas.schemas import Token, UserCreate, UserOut, UserUpdate
from manager.auth_manager import create_user, get_user_by_email, update_user_profile, delete_user_by_id
from services.security import get_current_user, create_access_token, create_refresh_token
from utils.password_utils import verify_password
from services.sns_notify import subscribe_user_to_topic  # ✅ NEW IMPORT

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = await create_user(user)

    # ✅ Subscribe user to SNS topic (confirmation mail will be sent)
    subscribe_user_to_topic(user.email)

    return new_user

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return Token(
        access_token=create_access_token(user_id=user["id"], email=user["email"]),
        refresh_token=create_refresh_token(user_id=user["id"], email=user["email"]),
    )

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserOut(**current_user)

@router.put("/me", response_model=UserOut)
async def update_me(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    updated_user = await update_user_profile(user_id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(**updated_user)

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    success = await delete_user_by_id(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found or already deleted")
    return
