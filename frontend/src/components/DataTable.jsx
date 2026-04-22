import {
  Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Paper, Typography, Box,
} from '@mui/material'

export default function DataTable({ data }) {
  if (!data || !data.columns.length) return null

  const fmt = (val) => {
    if (val === null || val === undefined) return '—'
    if (typeof val === 'number') {
      if (Number.isInteger(val)) return val.toLocaleString('pt-BR')
      return val.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
    }
    return String(val)
  }

  return (
    <Box sx={{ mt: 1.5 }}>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small" sx={{ minWidth: 'max-content' }}>
          <TableHead>
            <TableRow>
              {data.columns.map((col) => (
                <TableCell
                  key={col}
                  sx={{
                    bgcolor: 'background.default',
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {col}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.rows.map((row, i) => (
              <TableRow
                key={i}
                hover
                sx={{ '&:last-child td': { borderBottom: 0 } }}
              >
                {row.map((cell, j) => (
                  <TableCell
                    key={j}
                    sx={{ whiteSpace: 'nowrap', fontSize: 12.5, color: 'text.primary' }}
                  >
                    {fmt(cell)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, color: 'text.secondary' }}>
        {data.rows.length} resultado(s)
      </Typography>
    </Box>
  )
}
