from pydantic import BaseModel, Field


class IdentityRequest(BaseModel):
    display_name: str = Field(min_length=2, max_length=120)
    email: str | None = Field(default=None, max_length=255)


class CreateRoomRequest(BaseModel):
    host_user_id: str
    title: str = Field(min_length=3, max_length=180)
    challenge_prompt: str = Field(min_length=10)


class JoinRoomRequest(BaseModel):
    user_id: str


class StartRoundRequest(BaseModel):
    host_user_id: str


class SubmitPromptRequest(BaseModel):
    user_id: str
    prompt: str = Field(min_length=10)


class ScoreSubmissionRequest(BaseModel):
    host_user_id: str
    score: int = Field(ge=1, le=10)
    decision: str = Field(pattern="^(survived|eliminated|winner)$")
    comment: str | None = Field(default=None, max_length=800)

