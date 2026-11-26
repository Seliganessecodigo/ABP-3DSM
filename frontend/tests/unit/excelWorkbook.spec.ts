import { expect, test } from '@playwright/test'
import { strFromU8, unzipSync } from 'fflate'
import { createExcelWorkbook } from '../../src/utils/excelWorkbook.ts'

test('writes numeric cells, empty readings and literal text into a workbook', () => {
  const files = unzipSync(createExcelWorkbook([
    ['Aplicação', 'CO₂e (kg)'],
    ['=A1 & <Brasil>', 0],
    ['_x000D_\r', null],
  ]))
  expect(Object.keys(files)).toEqual([
    '[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml',
    'xl/_rels/workbook.xml.rels', 'xl/worksheets/sheet1.xml',
  ])
  const sheet = strFromU8(files['xl/worksheets/sheet1.xml'])
  expect(sheet).toContain('<t xml:space="preserve">Aplicação</t>')
  expect(sheet).toContain('<t xml:space="preserve">=A1 &amp; &lt;Brasil&gt;</t>')
  expect(sheet).toContain('<c><v>0</v></c>')
  expect(sheet).toContain('<t xml:space="preserve">_x005F_x000D__x000d_</t></is></c><c/>')
  expect(sheet).not.toContain('<f>')
})
