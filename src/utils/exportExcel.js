// Carga bajo demanda para reducir el tamaño del bundle inicial

/**
 * Exporta un array de objetos a XLSX y descarga el archivo.
 */
export function exportToXLSX(rows, filename = 'datos.xlsx') {
  import('xlsx').then((XLSX) => {
    // Formatear fechas en zona horaria de Bolivia para que la hora sea correcta al abrir en Excel
    const TZ = 'America/La_Paz'
    const formatInTZ = (date) => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(date)
      const get = (t) => parts.find((p) => p.type === t)?.value
      return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
    }

    const isISODateString = (v) => typeof v === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)
    const normalizeRowDates = (row) => Object.fromEntries(
      Object.entries(row).map(([k, v]) => {
        if (v instanceof Date) return [k, formatInTZ(v)]
        if (isISODateString(v)) {
          const d = new Date(v)
          if (!isNaN(d)) return [k, formatInTZ(d)]
        }
        return [k, v]
      })
    )

    const prepared = Array.isArray(rows) ? rows.map(normalizeRowDates) : []
    const ws = XLSX.utils.json_to_sheet(prepared)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Datos')
    XLSX.writeFile(wb, filename)
  })
}

/**
 * Importa un archivo XLSX y retorna sus filas como array de objetos.
 */
export function importFromXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      import('xlsx')
        .then((XLSX) => {
          const data = new Uint8Array(e.target.result)
          const wb = XLSX.read(data, { type: 'array' })
          const firstSheet = wb.SheetNames[0]
          const ws = wb.Sheets[firstSheet]
          const rows = XLSX.utils.sheet_to_json(ws)
          resolve(rows)
        })
        .catch(reject)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
