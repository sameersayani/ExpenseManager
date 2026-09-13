from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=12000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)


class ChatResponse(BaseModel):
    message: str
    tool_calls: list[dict[str, Any]] = Field(default_factory=list)
    pending_delete: dict[str, Any] | None = None


class DeleteConfirmationRequest(BaseModel):
    expense_id: int
