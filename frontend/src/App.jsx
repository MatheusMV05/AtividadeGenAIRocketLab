import { useState, useRef, useEffect } from 'react'
import {
  AppBar, Toolbar, Box, Typography, Button, Chip,
  List, ListSubheader, ListItemButton, ListItemText, Divider,
  TextField, IconButton,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import BarChartIcon from '@mui/icons-material/BarChart'
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
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', maxWidth: '85%' }}>
      <Box
        sx={{
          width: 32, height: 32, borderRadius: '50%',
          bgcolor: '#EDE9FE', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 16, flexShrink: 0,
        }}
      >
        <SmartToyIcon sx={{ fontSize: 18, color: 'primary.main' }} />
      </Box>
      <Box
        sx={{
          border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
          borderRadius: 3, borderBottomLeftRadius: 1,
          px: 2, py: 1.5, display: 'flex', gap: 0.5, alignItems: 'center',
        }}
      >
        <Box className="dot" />
        <Box className="dot" sx={{ animationDelay: '0.2s !important' }} />
        <Box className="dot" sx={{ animationDelay: '0.4s !important' }} />
      </Box>
    </Box>
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
          content: `Erro: ${err.message}`,
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* ── Top App Bar (M3) ── */}
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 1.5, minHeight: 64 }}>
          <ShoppingCartIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', flexGrow: 0 }}>
            E-Commerce AI Agent
          </Typography>
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important' }} />}
            label="Gemini 2.5 Flash"
            size="small"
            sx={{ bgcolor: '#EDE9FE', color: 'primary.dark', fontWeight: 500, ml: 0.5 }}
          />
          <Box sx={{ flexGrow: 1 }} />
          {messages.length > 0 && (
            <Button variant="outlined" size="small" onClick={() => setMessages([])}>
              Nova conversa
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* ── Main layout ── */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Navigation Drawer (M3 permanent) ── */}
        <Box
          component="nav"
          sx={{
            width: 260,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflowY: 'auto',
            py: 1,
          }}
        >
          <Typography
            sx={{
              px: 2, py: 1, display: 'block',
              fontSize: 11, fontWeight: 700,
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Perguntas sugeridas
          </Typography>

          <List dense disablePadding sx={{ px: 1 }}>
            {SUGGESTIONS.map((group, gi) => (
              <Box key={group.category}>
                {gi > 0 && <Divider sx={{ my: 1 }} />}
                <ListSubheader
                  disableSticky
                  sx={{
                    bgcolor: 'transparent',
                    color: 'primary.main',
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    lineHeight: 2.5,
                    px: 2,
                  }}
                >
                  {group.category}
                </ListSubheader>
                {group.items.map((item) => (
                  <ListItemButton
                    key={item}
                    onClick={() => sendMessage(item)}
                    disabled={loading}
                    sx={{ px: 2, py: 0.5, mb: 0.25 }}
                  >
                    <ListItemText
                      primary={item}
                      slotProps={{ primary: { sx: { fontSize: 12.5, lineHeight: 1.4 } } }}
                    />
                  </ListItemButton>
                ))}
              </Box>
            ))}
          </List>
        </Box>

        {/* ── Chat area ── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <Box
            sx={{
              flex: 1, overflowY: 'auto',
              p: 3, display: 'flex',
              flexDirection: 'column', gap: 2,
            }}
          >
            {messages.length === 0 && !loading ? (
              <Box
                sx={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', gap: 1.5,
                  color: 'text.secondary', p: 5,
                }}
              >
                <BarChartIcon sx={{ fontSize: 64, color: 'primary.light', opacity: 0.7 }} />
                <Typography variant="h5" sx={{ color: 'text.primary', mt: 1 }}>
                  Analise seus dados de e-commerce
                </Typography>
                <Typography variant="body2" sx={{ maxWidth: 400, lineHeight: 1.7 }}>
                  Faça perguntas em português sobre vendas, entregas, avaliações, consumidores e muito mais.
                  Selecione uma sugestão ao lado ou digite sua pergunta.
                </Typography>
              </Box>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}
                {loading && <LoadingBubble />}
              </>
            )}
            <div ref={bottomRef} />
          </Box>

          {/* Input area */}
          <Box
            sx={{
              px: 3, py: 2,
              bgcolor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              gap: 1,
              alignItems: 'flex-end',
            }}
          >
            <TextField
              inputRef={inputRef}
              multiline
              maxRows={4}
              fullWidth
              placeholder="Digite sua pergunta sobre os dados do e-commerce..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 4,
                  bgcolor: 'background.default',
                },
              }}
            />
            <IconButton
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: 3,
                width: 42, height: 42,
                flexShrink: 0,
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
