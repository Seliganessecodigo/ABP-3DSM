export type TableSortState = 'ascending' | 'descending' | 'none'

export function tableSortPresentation(column: string, activeColumn: string | null, direction: string | null):
  Readonly<{ ariaSort: TableSortState }> {
  if (column !== activeColumn) return { ariaSort: 'none' }
  return { ariaSort: direction === 'asc' ? 'ascending' : 'descending' }
}
