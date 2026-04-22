import sqlite3
import re
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "bd" / "banco.db"

SCHEMA_DESCRIPTION = """
Banco de dados de e-commerce brasileiro com as seguintes tabelas:

1. dim_consumidores(id_consumidor TEXT PK, prefixo_cep INTEGER, nome_consumidor TEXT, cidade TEXT, estado TEXT)
   - Cadastro de clientes. 'estado' usa siglas como 'SP', 'RJ', 'MG', etc.

2. dim_produtos(id_produto TEXT PK, nome_produto TEXT, categoria_produto TEXT, peso_produto_gramas REAL,
   comprimento_centimetros REAL, altura_centimetros REAL, largura_centimetros REAL)
   - Catálogo de produtos com categoria e dimensões físicas.

3. dim_vendedores(id_vendedor TEXT PK, nome_vendedor TEXT, prefixo_cep INTEGER, cidade TEXT, estado TEXT)
   - Cadastro de vendedores/sellers do marketplace.

4. fat_avaliacoes_pedidos(id_avaliacao TEXT PK, id_pedido TEXT FK, avaliacao INTEGER, titulo_comentario TEXT,
   comentario TEXT, data_comentario TEXT, data_resposta TEXT)
   - Avaliações dos pedidos. 'avaliacao' vai de 1 (pior) a 5 (melhor). Avaliações 1-2 são negativas.

5. fat_itens_pedidos(id_pedido TEXT FK, id_item INTEGER, id_produto TEXT FK, id_vendedor TEXT FK,
   preco_BRL REAL, preco_frete REAL)
   - Itens individuais de cada pedido com preço e frete.

6. fat_pedido_total(id_pedido TEXT PK/FK, id_consumidor TEXT FK, status TEXT, valor_total_pago_brl REAL,
   valor_total_pago_usd REAL, data_pedido TEXT)
   - Totais financeiros por pedido. 'data_pedido' no formato 'YYYY-MM-DD'.
   - Status possíveis: 'entregue', 'cancelado', 'enviado', 'faturado', 'em processamento', 'aprovado', 'criado', 'indisponível'

7. fat_pedidos(id_pedido TEXT PK/FK, id_consumidor TEXT FK, status TEXT, pedido_compra_timestamp TEXT,
   pedido_entregue_timestamp TEXT, data_estimada_entrega TEXT, tempo_entrega_dias REAL,
   tempo_entrega_estimado_dias INTEGER, diferenca_entrega_dias REAL, entrega_no_prazo TEXT)
   - Informações de logística e entrega.
   - 'entrega_no_prazo': 'Sim', 'Não' ou 'Não Entregue'
   - 'diferenca_entrega_dias': negativo = entregue antes do prazo, positivo = com atraso

Relacionamentos principais:
- fat_pedidos.id_pedido = fat_pedido_total.id_pedido = fat_itens_pedidos.id_pedido = fat_avaliacoes_pedidos.id_pedido
- fat_pedidos.id_consumidor = fat_pedido_total.id_consumidor = dim_consumidores.id_consumidor
- fat_itens_pedidos.id_produto = dim_produtos.id_produto
- fat_itens_pedidos.id_vendedor = dim_vendedores.id_vendedor
"""


def execute_query(sql: str) -> dict:
    cleaned = sql.strip().upper()

    if not (cleaned.startswith("SELECT") or cleaned.startswith("WITH")):
        return {
            "columns": [],
            "rows": [],
            "error": "Apenas consultas SELECT são permitidas por segurança.",
        }

    forbidden = r"\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|PRAGMA)\b"
    if re.search(forbidden, cleaned):
        return {
            "columns": [],
            "rows": [],
            "error": "Operação não permitida. Apenas leitura é autorizada.",
        }

    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        rows = [list(row) for row in cursor.fetchmany(150)]
        conn.close()
        return {"columns": columns, "rows": rows, "error": None}
    except Exception as exc:
        conn.close()
        return {"columns": [], "rows": [], "error": str(exc)}
