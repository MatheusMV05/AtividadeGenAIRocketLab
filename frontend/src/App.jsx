import { useState, useRef, useEffect } from 'react'
import MessageBubble from './components/MessageBubble'

const SUGGESTIONS = [
  {
    category: 'Vendas & Receita',
    items: [
      'Quais são os top 10 produtos mais vendidos?',
      'Qual a receita total por categoria de produto?',
      'Qual foi a receita total do e-commerce?',
    ],
  },
  {
    category: 'Entrega & Logística',
    items: [
      'Quantidade de pedidos por status',
      '% de pedidos entregues no prazo por estado',
      'Quais estados têm maior atraso médio?',
    ],
  },
  {
    category: 'Avaliações',
    items: [
      'Qual a média geral de avaliações dos pedidos?',
      'Top 10 vendedores com melhor avaliação',
      'Categorias com maior taxa de avaliação negativa',
    ],
  },
  {
    category: 'Consumidores',
    items: [
      'Estados com maior volume de pedidos e ticket médio',
      'Qual estado tem o maior ticket médio?',
    ],
  },
  {
    category: 'Vendedores',
    items: [
      'Produtos mais vendidos por estado',
      'Top 10 vendedores por receita gerada',
    ],
  },
]

function LoadingBubble() {
  return (
    <div className="message assistant">
      <div className="avatar">🤖</div>
      <div className="bubble loading-bubble">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
    </div>
  )
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const userText = (text || input).trim()
    if (!userText || loading) return

    const userMsg = { role: 'user', content: userText }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const apiPayload = newMessages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiPayload }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Erro na requisição')
      }

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sqlQueries: data.sql_queries,
          data: data.data,
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Erro: ${err.message}`,
          sqlQueries: [],
          data: null,
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <span className="logo">🛒</span>
          <h1>E-Commerce AI Agent</h1>
          <span>Gemini 2.5 Flash</span>
        </div>
        {messages.length > 0 && (
          <button className="btn-clear" onClick={() => setMessages([])}>
            Nova conversa
          </button>
        )}
      </header>

      <div className="main-area">
        <aside className="sidebar">
          <h3>Perguntas sugeridas</h3>
          {SUGGESTIONS.map((group) => (
            <div className="sidebar-section" key={group.category}>
              <div className="sidebar-category">{group.category}</div>
              {group.items.map((item) => (
                <button
                  key={item}
                  className="suggestion-btn"
                  onClick={() => sendMessage(item)}
                  disabled={loading}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <div className="chat-container">
          <div className="messages-area">
            {messages.length === 0 && !loading ? (
              <div className="welcome">
                <div className="icon">📊</div>
                <h2>Analise seus dados de e-commerce</h2>
                <p>
                  Faça perguntas em português sobre vendas, entregas, avaliações, consumidores e muito mais.
                  Selecione uma sugestão ao lado ou digite sua pergunta.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}
                {loading && <LoadingBubble />}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="input-area">
            <div className="input-wrap">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder="Digite sua pergunta sobre os dados do e-commerce..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
            </div>
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              title="Enviar (Enter)"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
