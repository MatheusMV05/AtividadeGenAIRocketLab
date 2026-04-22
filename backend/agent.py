import os
from dataclasses import dataclass

from pydantic_ai import Agent, RunContext
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider

from .database import execute_query, SCHEMA_DESCRIPTION
from .models import ChatMessage, ChatResponse, QueryData

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

SYSTEM_PROMPT = f"""Você é um assistente especializado em análise de dados de um e-commerce brasileiro.
Você ajuda usuários não técnicos a consultar e entender os dados do sistema respondendo perguntas em linguagem natural.

{SCHEMA_DESCRIPTION}

Instruções:
- Sempre responda em português brasileiro de forma clara e objetiva.
- Use a ferramenta execute_sql para consultar o banco de dados sempre que precisar de dados.
- Você pode executar múltiplas consultas se necessário para responder completamente.
- Formate números grandes com separadores (ex: 1.234.567) e valores monetários com R$.
- Quando retornar listas, use formatação clara.
- Adicione insights e interpretações além dos dados brutos quando relevante.
- Se a pergunta não for sobre análise de dados do e-commerce, informe educadamente que só pode ajudar com dados do sistema.
- NUNCA execute operações de escrita (INSERT, UPDATE, DELETE, DROP, etc.).
- Limite resultados a no máximo 50 itens em listagens, a menos que o usuário peça mais.
"""


@dataclass
class AgentDeps:
    sql_queries: list[str]
    last_data: QueryData | None


def _build_agent(api_key: str) -> Agent[AgentDeps, str]:
    model = GoogleModel(GEMINI_MODEL, provider=GoogleProvider(api_key=api_key))
    agent: Agent[AgentDeps, str] = Agent(
        model,
        system_prompt=SYSTEM_PROMPT,
        deps_type=AgentDeps,
        output_type=str,
    )

    @agent.tool
    async def execute_sql(ctx: RunContext[AgentDeps], query: str) -> dict:
        """Executa uma consulta SQL SELECT no banco de dados do e-commerce e retorna os resultados."""
        ctx.deps.sql_queries.append(query)
        result = execute_query(query)
        if result["error"]:
            return {"error": result["error"]}
        ctx.deps.last_data = QueryData(
            columns=result["columns"], rows=result["rows"]
        )
        return {
            "columns": result["columns"],
            "rows": result["rows"],
            "row_count": len(result["rows"]),
        }

    return agent


def _build_history(messages: list[ChatMessage]):
    from pydantic_ai.messages import (
        ModelRequest,
        ModelResponse,
        UserPromptPart,
        TextPart,
    )

    history = []
    # All messages except the last one become history; the last user message is the prompt.
    for msg in messages[:-1]:
        if msg.role == "user":
            history.append(ModelRequest(parts=[UserPromptPart(content=msg.content)]))
        else:
            history.append(ModelResponse(parts=[TextPart(content=msg.content)]))
    return history


async def run_agent(messages: list[ChatMessage], api_key: str) -> ChatResponse:
    if not messages:
        return ChatResponse(answer="Nenhuma mensagem fornecida.")

    agent = _build_agent(api_key)
    deps = AgentDeps(sql_queries=[], last_data=None)
    history = _build_history(messages)
    user_prompt = messages[-1].content

    try:
        result = await agent.run(
            user_prompt,
            deps=deps,
            message_history=history,
        )
        return ChatResponse(
            answer=result.output,
            sql_queries=deps.sql_queries,
            data=deps.last_data,
        )
    except Exception as exc:
        import traceback; traceback.print_exc()
        return ChatResponse(
            answer="Não foi possível completar a análise. Tente reformular sua pergunta.",
            sql_queries=deps.sql_queries,
            data=deps.last_data,
            error=str(exc),
        )
