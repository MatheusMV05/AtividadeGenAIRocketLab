# E-Commerce AI Agent

Agente de IA para análise de dados de um e-commerce brasileiro com Text-to-SQL via **Gemini 2.5 Flash**, backend **FastAPI** e interface de chat em **React**.

## Stack

| Camada | Tecnologia |
|---|---|
| Modelo de IA | Google Gemini 2.5 Flash |
| Backend | Python + FastAPI |
| Frontend | React + Vite |
| Banco de dados | SQLite3 (`banco.db`) |

## Pré-requisitos

- Python 3.11+
- Node.js 18+
- Chave de API do Google Gemini ([obter aqui](https://aistudio.google.com/apikey))

## Instalação e execução

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e insira sua chave:

```env
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-2.5-flash
```

### 2. Backend (FastAPI)

```bash
# Criar e ativar ambiente virtual
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Iniciar o servidor
uvicorn backend.main:app --reload
```

O backend ficará disponível em `http://localhost:8000`.  
Documentação da API: `http://localhost:8000/docs`

### 3. Frontend (React)

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend ficará disponível em `http://localhost:5173`.

## Estrutura do projeto

```
├── backend/
│   ├── main.py        # FastAPI app e endpoints
│   ├── agent.py       # Agente Gemini com function calling
│   ├── database.py    # Conexão SQLite e execução de queries
│   └── models.py      # Modelos Pydantic
├── frontend/
│   └── src/
│       ├── App.jsx    # Componente principal com estado da conversa
│       └── components/
│           ├── MessageBubble.jsx  # Exibe uma mensagem (texto + SQL + tabela)
│           └── DataTable.jsx      # Tabela de resultados SQL
├── bd/
│   └── banco.db       # Banco SQLite com dados do e-commerce
├── requirements.txt
└── .env.example
```

## Tabelas disponíveis

| Tabela | Descrição |
|---|---|
| `dim_consumidores` | Cadastro de clientes (cidade, estado) |
| `dim_produtos` | Catálogo de produtos e categorias |
| `dim_vendedores` | Cadastro de vendedores |
| `fat_pedidos` | Dados de entrega e logística |
| `fat_pedido_total` | Valores financeiros por pedido |
| `fat_itens_pedidos` | Itens individuais de cada pedido |
| `fat_avaliacoes_pedidos` | Avaliações dos pedidos (1–5) |

## Exemplos de perguntas

- Top 10 produtos mais vendidos
- Receita total por categoria de produto
- % de pedidos entregues no prazo por estado
- Média de avaliação por vendedor (top 10)
- Estados com maior volume de pedidos e ticket médio
- Categorias com maior taxa de avaliação negativa

## Como funciona o agente

1. O usuário digita uma pergunta em português
2. O Gemini recebe a pergunta com o schema do banco e uma ferramenta `execute_sql`
3. O modelo gera e executa uma ou mais queries SQL via function calling
4. Os resultados são devolvidos ao modelo, que gera uma resposta em linguagem natural
5. A interface exibe a resposta, a tabela de dados e as queries SQL usadas (expansível)
