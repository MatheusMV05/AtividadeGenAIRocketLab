import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .models import ChatRequest, ChatResponse
from .agent import run_agent

load_dotenv()

app = FastAPI(
    title="E-Commerce AI Agent",
    description="Agente de análise de dados de e-commerce com Text-to-SQL via Gemini",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "model": os.getenv("GEMINI_MODEL", "gemini-2.5-flash")}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada.")

    if not request.messages:
        raise HTTPException(status_code=400, detail="Nenhuma mensagem fornecida.")

    # Keep last 20 messages to avoid token overflow
    messages = request.messages[-20:]

    try:
        return await run_agent(messages, api_key)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
