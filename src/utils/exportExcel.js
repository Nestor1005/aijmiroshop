import * as XLSX from 'xlsx'

/**
 * Exporta un array de objetos a XLSX y descarga el archivo.
 */
export function exportToXLSX(rows, filename = 'datos.xlsx') {
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Datos')
  XLSX.writeFile(wb, filename)
}

/**
 * Importa un archivo XLSX y retorna sus filas como array de objetos.
 */
export function importFromXLSX(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result)
      const wb = XLSX.read(data, { type: 'array' })
      const firstSheet = wb.SheetNames[0]
      const ws = wb.Sheets[firstSheet]
      const rows = XLSX.utils.sheet_to_json(ws)
      resolve(rows)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
