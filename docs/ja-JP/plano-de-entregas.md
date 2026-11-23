# 提供計画と根拠

GreenERの成果は機能の広さ、ソフトウェア工学、環境データの追跡可能性を組み合わせています。本書では実装済み機能、評価ルーブリック27基準の根拠、3スプリントにおける5名全員の貢献を、コード・テスト・文書へのリンクとともに紹介します。

`2026-11-22` · `America/Sao_Paulo` · `240a2c26ecd2eb1b0adc184f4efe01799bab8a50`

## 統合製品とエンジニアリング {#engineering}

React 19とTypeScriptが画面を支え、NestJSは依存性注入を用いてAPIをモジュールとレイヤーに分離します。TypeORMとPostgreSQLはバージョン付きマイグレーションでデータを保持し、検証済み連携、トランザクション監査、計算スナップショットが指標の一貫性を支えます。

文書化した基準版では、CIがフロントエンド542件、バックエンド705件、統合フロー3件のテストと、lint、型チェック、ビルド、マイグレーション、SonarQube Cloudゲートを承認しました。サイトは12言語を提供し、内容・契約・リンクの同等性を自動検証します。

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

## 評価項目と確認 {#criteria}

| コード | 点数 | 提供内容 | 確認 | 提示する根拠 |
| --- | ---: | --- | --- | --- |
| GA01 | 5 | バックログ | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 構造化されたバックログ |
| GA02 | 5 | 計画と作業量 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Projectのイテレーションと担当者 |
| GA03 | 5 | 承認条件 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Issueの受入基準 |
| GA04 | 4 | 追跡 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 関連するPRとコミット |
| GA05 | 3 | 段階的提供 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| GA06 | 4 | レビューと改善 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 技術レビュー記録 |
| GA07 | 3 | 完了の定義 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 文書化されたDoD |
| GA08 | 3 | 文書と実行 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | バージョン管理文書 |
| GA09 | 8 | 参加 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| DW01 | 3 | 技術 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| DW02 | 5 | 連携 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| DW03 | 4 | APIとバックエンド | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| DW04 | 4 | ORM永続化 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| DW05 | 3 | フロントエンド | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| DW06 | 3 | 認証 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| DW07 | 3 | コンテナ | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| TP01 | 4 | 責任分担 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| TP02 | 4 | 依存性注入 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| TP03 | 4 | 型と読みやすさ | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| TP04 | 4 | 単体テスト | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| TP05 | 4 | 検証と障害 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| IHC01 | 3 | 利用者とタスク | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| IHC02 | 3 | 操作フローと試作 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | プロトタイプとフローの文書 |
| IHC03 | 3 | 指標と状態 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| IHC04 | 2 | 画面対応とフィードバック | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 実装・確認済み |
| IHC05 | 2 | 利用者評価 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 評価プロトコル |
| IHC06 | 2 | 改善と再検証 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 画面フィードバック記録 |

## スプリントと参照版 {#sprints}

| Sprint | 期間 | 統合された機能 |
| --- | --- | --- |
| [Sprint 1](./sprints/sprint-1) | 2026-10-05 / 2026-10-18 | 基盤・一覧・収集 |
| [Sprint 2](./sprints/sprint-2) | 2026-10-19 / 2026-11-01 | 指標・画面・認証 |
| [Sprint 3](./sprints/sprint-3) | 2026-11-02 / 2026-11-15 | 履歴・分析・運用の改善 |

## 完了の定義 {#done}

受入基準、データ整合性、テスト、CI、文書、アクセシビリティ、レビューがDefinition of Doneを構成します。各成果物はバージョンと検証の根拠を関連付けています。

[Definition of Done](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/definition-of-done.md)

## 参加と資料 {#sources}

5名全員の貢献が3スプリントに統合されています。表ではGitの著者と検証可能なコミットを結び、Projectのタスクと担当者を示して、製品構築への参加を追跡できるようにしています。

[GitHub Project](https://github.com/orgs/Seliganessecodigo/projects/2) · [Tasks](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/tasks.md) · [Git](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/historico.json)

## 品質の根拠 {#quality-evidence}

コード、自動テスト、契約、文書が成果の検証経路を構成します。詳細マトリクス、ユーザビリティ評価プロトコル、技術記録により、フロー、品質基準、各分野の根拠を確認できます。

[#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489) · [IHC05 / IHC06](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/usabilidade.md) · [Review](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/revisao-2026-11-22.md)
