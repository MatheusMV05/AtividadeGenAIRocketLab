import { useState } from 'react'
import { Box, Paper, Typography, Button, Collapse } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import DataTable from './DataTable'

function formatText(text) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      return part
    })
    return (
      <Typography key={i} variant="body2" component="p" sx={{ my: 0.25, lineHeight: 1.6 }}>
        {parts}
      </Typography>
    )
  })
}

function SqlBlock({ queries }) {
  const [open, setOpen] = useState(false)
  if (!queries?.length) return null

  return (
    <Box sx={{ mt: 1.5, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      <Button
        startIcon={<SearchIcon sx={{ fontSize: '14px !important' }} />}
        endIcon={
          <ExpandMoreIcon
            sx={{
              fontSize: '16px !important',
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'none',
            }}
          />
        }
        onClick={() => setOpen((v) => !v)}
        size="small"
        fullWidth
        sx={{
          justifyContent: 'flex-start',
          textTransform: 'none',
          color: 'text.secondary',
          bgcolor: 'background.default',
          borderRadius: 0,
          px: 1.5, py: 0.75,
          '& .MuiButton-endIcon': { ml: 'auto' },
          '&:hover': { bgcolor: 'divider' },
        }}
      >
        Ver SQL gerado ({queries.length} consulta{queries.length > 1 ? 's' : ''})
      </Button>
      <Collapse in={open}>
        <Box
          component="pre"
          sx={{
            m: 0,
            bgcolor: '#1e293b',
            color: '#94a3b8',
            p: '10px 14px',
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            overflowX: 'auto',
          }}
        >
          {queries.map((q, i) => (
            <Box key={i} component="span">
              {i > 0 && (
                <Box component="span" sx={{ display: 'block', borderTop: '1px solid #334155', my: 1 }} />
              )}
              {q}
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        maxWidth: '85%',
        alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease',
        ...(isUser && { marginLeft: 'auto', flexDirection: 'row-reverse' }),
      }}
    >
      {/* Avatar */}
      <Box
        sx={{
          width: 32, height: 32,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
          bgcolor: isUser ? 'primary.main' : '#EDE9FE',
        }}
      >
        {isUser
          ? <PersonIcon sx={{ fontSize: 18, color: 'white' }} />
          : <SmartToyIcon sx={{ fontSize: 18, color: 'primary.main' }} />
        }
      </Box>

      {/* Bubble */}
      {isUser ? (
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 3,
            borderBottomRightRadius: 0.5,
            px: 2, py: 1.25,
            boxShadow: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: 'white', lineHeight: 1.6 }}>
            {message.content}
          </Typography>
        </Box>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            borderBottomLeftRadius: 0.5,
            px: 2, py: 1.25,
            maxWidth: '100%',
          }}
        >
          {formatText(message.content)}
          {message.sqlQueries?.length > 0 && <SqlBlock queries={message.sqlQueries} />}
          {message.data && <DataTable data={message.data} />}
        </Paper>
      )}
    </Box>
  )
}
