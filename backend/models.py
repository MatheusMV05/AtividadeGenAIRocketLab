from pydantic import BaseModel
from typing import Any


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class QueryData(BaseModel):
    columns: list[str]
    rows: list[list[Any]]


class ChatResponse(BaseModel):
    answer: str
    sql_queries: list[str] = []
    data: QueryData | None = None
    error: str | None = None
