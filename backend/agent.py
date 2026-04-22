import os
from google import genai
from google.genai import types

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


def _build_contents(messages: list[ChatMessage]) -> list[types.Content]:
    contents = []
    for msg in messages:
        role = "user" if msg.role == "user" else "model"
        contents.append(
            types.Content(role=role, parts=[types.Part(text=msg.content)])
        )
    return contents


def _make_tool() -> types.Tool:
    return types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="execute_sql",
                description="Executa uma consulta SQL SELECT no banco de dados do e-commerce e retorna os resultados.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "query": types.Schema(
                            type=types.Type.STRING,
                            description="A consulta SQL SELECT a ser executada. Apenas leitura é permitida.",
                        )
                    },
                    required=["query"],
                ),
            )
        ]
    )


async def run_agent(messages: list[ChatMessage], api_key: str) -> ChatResponse:
    client = genai.Client(api_key=api_key)
    tool = _make_tool()
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=[tool],
        temperature=0.1,
    )

    contents = _build_contents(messages)
    sql_queries: list[str] = []
    last_data: QueryData | None = None

    for _ in range(8):  # max agentic iterations
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=config,
        )

        candidate = response.candidates[0]
        function_calls = [
            part.function_call
            for part in candidate.content.parts
            if part.function_call
        ]

        if not function_calls:
            final_text = "".join(
                part.text for part in candidate.content.parts if part.text
            )
            return ChatResponse(
                answer=final_text,
                sql_queries=sql_queries,
                data=last_data,
            )

        # Add model turn to history
        contents.append(candidate.content)

        # Execute each tool call and collect responses
        tool_response_parts: list[types.Part] = []
        for fc in function_calls:
            query: str = fc.args.get("query", "")
            sql_queries.append(query)
            result = execute_query(query)

            if result["error"]:
                response_payload = {"error": result["error"]}
            else:
                last_data = QueryData(columns=result["columns"], rows=result["rows"])
                response_payload = {
                    "columns": result["columns"],
                    "rows": result["rows"],
                    "row_count": len(result["rows"]),
                }

            tool_response_parts.append(
                types.Part(
                    function_response=types.FunctionResponse(
                        name=fc.name,
                        response=response_payload,
                    )
                )
            )

        contents.append(types.Content(role="user", parts=tool_response_parts))

    return ChatResponse(
        answer="Não foi possível completar a análise. Tente reformular sua pergunta.",
        sql_queries=sql_queries,
        data=last_data,
    )
