from datetime import datetime
from json import dumps
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    display_name: str = Field(min_length=2, max_length=80)
    founding_code: str | None = Field(default=None, max_length=128)
    signup_elapsed_seconds: int | None = Field(default=None, ge=0, le=3600)
    usage_analytics_opt_in: bool = False

    @field_validator("display_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return " ".join(value.split())


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=32, max_length=256)


class FoundingClaimRequest(BaseModel):
    founding_code: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    display_name: str
    is_founding_member: bool
    founding_expires_at: datetime | None

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserResponse


class ProfileUpdate(BaseModel):
    selected_goals: list[str] = Field(default_factory=list, max_length=2)
    custom_goal: str = Field(default="", max_length=200)
    weekly_skill: str = Field(default="", max_length=100)
    focus_skills: list[str] = Field(default_factory=list, max_length=3)
    commitment: str = Field(default="Every 7 days", max_length=40)
    available_time: str = Field(default="30 minutes", max_length=40)
    experience: str = Field(default="", max_length=160)


class ProgressEventCreate(BaseModel):
    client_event_id: str = Field(min_length=3, max_length=120)
    event_type: Literal["skill_selected", "mission_completed", "quiz_completed", "reflection_completed", "app_session"]
    skill_slug: str = Field(min_length=1, max_length=100)
    value: float = Field(default=0, ge=0, le=100)
    minutes: int = Field(default=0, ge=0, le=1440)
    metadata: dict = Field(default_factory=dict)

    @field_validator("metadata")
    @classmethod
    def limit_metadata(cls, value: dict) -> dict:
        if len(dumps(value, ensure_ascii=False)) > 2048 or any(not isinstance(key, str) or len(key) > 80 for key in value):
            raise ValueError("Event metadata is too large")
        return value


class SkillResponse(BaseModel):
    slug: str
    name: str
    category: str
    description: str
    default_goal: str
    popularity_rank: int
    model_config = {"from_attributes": True}


class SkillProgressResponse(BaseModel):
    skill_slug: str
    baseline_score: float | None
    latest_score: float | None
    improvement_points: float | None
    missions_completed: int
    minutes_logged: int


class DashboardResponse(BaseModel):
    user: UserResponse
    skills: list[SkillProgressResponse]
    total_missions: int
    total_minutes: int
