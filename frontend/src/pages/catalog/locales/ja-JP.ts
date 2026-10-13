import ptBR from './pt-BR.ts'
import type { Widen } from '../../../i18n/types.ts'

const messages = {
  eyebrow: 'モニタリング',
  title: 'アプリケーション',
  description: '監視対象アプリケーションの一覧と現在の状態です。',
  refresh: '一覧を更新',
  searchLabel: '名前、識別子、地域でアプリケーションを検索',
  searchPlaceholder: '名前、識別子、地域で検索...',
  filterLabel: '状態でアプリケーションを絞り込む',
  loading: 'アプリケーションを読み込み中...',
  errorTitle: '一覧を取得できませんでした',
  stale: '最後に確認できたデータを表示しています。古い可能性があります。',
  errorNotRemoved: 'アプリケーションが削除されたという意味ではありません。',
  emptyTitle: 'アプリケーションがありません',
  empty: '一覧にはまだアプリケーションがありません。',
  noResults: '検索に一致するアプリケーションがありません',
  adjustFilters: '検索語句または選択したフィルターを見直してください。',
  app: 'アプリケーション',
  actions: '操作',
  details: '詳細を見る',
  page: '{{count}}ページ中{{page}}ページ',
  total_one: '{{count}}件のアプリケーション',
  total_other: '{{count}}件のアプリケーション',
  previous: '前へ',
  next: '次へ',
  previousAria: '前のページ',
  nextAria: '次のページ',
  noneSelected: 'アプリケーションが選択されていません',
  selectHint: '一覧から選択すると、詳細、メトリクス、履歴を確認できます。',
  updated: '一覧を更新しました',
  stateHint: '状態はテキストと視覚的なアイコンで示されます。',
} satisfies Widen<typeof ptBR>

export default messages
