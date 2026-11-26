import { useState } from 'react'
import { faFileExcel } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'react-i18next'
import { ActionButton } from './ActionButton.tsx'
import type { ExcelCell } from '../utils/excelWorkbook.ts'
import './TableExportButton.css'

function cellValue(cell: HTMLTableCellElement): ExcelCell {
  if (cell.dataset.exportNumber !== undefined) {
    return cell.dataset.exportNumber === '' ? null : Number(cell.dataset.exportNumber)
  }
  if (cell.dataset.exportText !== undefined) return cell.dataset.exportText
  const copy = cell.cloneNode(true) as HTMLTableCellElement
  copy.querySelectorAll('[aria-hidden="true"], [data-export-ignore]').forEach(node => node.remove())
  copy.querySelectorAll('br, small').forEach(node => node.before(' '))
  return copy.textContent?.trim() ?? ''
}

export function TableExportButton({ tableId, disabled = false }: Readonly<{ tableId: string; disabled?: boolean }>) {
  const { t } = useTranslation('common')
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function download() {
    const table = document.getElementById(tableId)
    if (!(table instanceof HTMLTableElement)) return
    const rows = Array.from(table.rows, row => Array.from(row.cells)
      .filter(cell => !cell.hasAttribute('data-export-ignore'))
      .map(cellValue))
    setPending(true)
    setFailed(false)
    try {
      const { createExcelWorkbook } = await import('../utils/excelWorkbook.ts')
      const workbook = createExcelWorkbook(rows)
      const blob = new Blob([workbook], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `greener-${tableId}.xlsx`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return <div className="table-export">
    <ActionButton appearance="secondary" pending={pending} disabled={disabled} aria-controls={tableId}
      title={t('excel.scope')} onClick={() => void download()}>
      <FontAwesomeIcon icon={faFileExcel} aria-hidden="true" />{t('excel.download')}
    </ActionButton>
    {failed && <span role="alert">{t('excel.error')}</span>}
  </div>
}
