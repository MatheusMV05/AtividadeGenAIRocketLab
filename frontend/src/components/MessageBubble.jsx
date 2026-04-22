import { useState } from 'react'
import DataTable from './DataTable'

function formatText(text) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      return part
    })
    return <p key={i}>{parts}</p>
  })
}

function SqlBlock({ queries }) {
  const [open, setOpen] = useState(false)
  if (!queries || !queries.length) return null

  return (
    <div className="sql-block">
      <button
        className={`sql-toggle${open ? ' open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span>🔍</span>
        <span>Ver SQL gerado ({queries.length} consulta{queries.length > 1 ? 's' : ''})</span>
        <span className="chevron">▼</span>
      </button>
      {open && (
        <div className="sql-content">
          {queries.map((q, i) => (
            <div key={i}>
              {i > 0 && <div style={{ borderTop: '1px solid #334155', margin: '8px 0' }} />}
              {q}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`message ${message.role}`}>
      <div className="avatar">{isUser ? '👤' : '🤖'}</div>
      <div className="bubble">
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <>
            {formatText(message.content)}
            {message.sqlQueries?.length > 0 && (
              <SqlBlock queries={message.sqlQueries} />
            )}
            {message.data && <DataTable data={message.data} />}
          </>
        )}
      </div>
    </div>
  )
}
