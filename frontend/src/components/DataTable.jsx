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
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {data.columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{fmt(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-count">{data.rows.length} resultado(s)</div>
    </div>
  )
}
