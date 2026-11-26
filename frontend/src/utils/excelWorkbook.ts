import { strToU8, zipSync } from 'fflate'

export type ExcelCell = string | number | null

const spreadsheet = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const office = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const relationships = 'http://schemas.openxmlformats.org/package/2006/relationships'
const contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml'

function xmlText(value: string) {
  return Array.from(value.replace(/_x[0-9a-f]{4}_/gi, match => `_x005F_${match.slice(1)}`), character => {
    const code = character.codePointAt(0) ?? 0
    if (code < 32 && code !== 9 && code !== 10 || code === 0xfffe || code === 0xffff) {
      return `_x${code.toString(16).padStart(4, '0')}_`
    }
    if (character === '&') return '&amp;'
    if (character === '<') return '&lt;'
    if (character === '>') return '&gt;'
    return character
  }).join('')
}

export function createExcelWorkbook(rows: readonly (readonly ExcelCell[])[]) {
  const sheetRows = rows.map(row => `<row>${row.map(cell => {
    if (cell === null) return '<c/>'
    if (typeof cell === 'number' && Number.isFinite(cell)) return `<c><v>${cell}</v></c>`
    return `<c t="inlineStr"><is><t xml:space="preserve">${xmlText(String(cell))}</t></is></c>`
  }).join('')}</row>`).join('')
  const parts = {
    '[Content_Types].xml': `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/xl/workbook.xml" ContentType="${contentType}.sheet.main+xml"/>
      <Override PartName="/xl/worksheets/sheet1.xml" ContentType="${contentType}.worksheet+xml"/>
    </Types>`,
    '_rels/.rels': `<Relationships xmlns="${relationships}"><Relationship Id="rId1" Type="${office}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<workbook xmlns="${spreadsheet}" xmlns:r="${office}"><sheets><sheet name="GreenER" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<Relationships xmlns="${relationships}"><Relationship Id="rId1" Type="${office}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': `<worksheet xmlns="${spreadsheet}"><sheetData>${sheetRows}</sheetData></worksheet>`,
  }
  return zipSync(Object.fromEntries(Object.entries(parts).map(([path, xml]) => [path, strToU8(xml)])))
}
