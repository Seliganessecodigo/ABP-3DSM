export function tableSortPresentation(column: string, activeColumn: string | null, direction: string | null):
  Readonly<{ ariaSort: 'ascending' | 'descending' | 'none'; indicator: string }> {
  if (column !== activeColumn) return { ariaSort: 'none', indicator: '' }
  if (direction === 'asc') return { ariaSort: 'ascending', indicator: '↑' }
  return { ariaSort: 'descending', indicator: '↓' }
}
