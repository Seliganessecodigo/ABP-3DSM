# アーキテクチャ

## コンポーネント

ローカル環境ではDocker Composeを使って、フロントエンド、API、PostgreSQLの3つのサービスを起動します。

| 領域 | 責務 | 技術 |
| --- | --- | --- |
| `frontend/` | UI、ナビゲーション、表示 | React 19、TypeScript、Vite、i18next |
| `backend/` | API、ユースケース、外部連携 | NestJS、TypeScript、TypeORM |
| PostgreSQL | アプリケーションとドメインデータの永続化 | PostgreSQL 18 |

フロントエンドが呼び出すのはGreenER APIのみです。メトリクス集約サービスと炭素強度サービスに接続するのはバックエンドだけです。

## コード構成

- `frontend/src/pages/`には、各画面と専用のhooks、翻訳、CSS Modulesを配置します。
- `frontend/src/features/`は、ドメイン契約、検証、HTTPアクセス、キャッシュ、純粋なルールを担当します。
- `backend/src/modules/`はドメインごとにエンドポイントとユースケースをまとめます。
- `backend/src/integrations/`は補助APIの応答を変換・検証します。
- `backend/src/database/`にはエンティティ、マイグレーション、リポジトリを配置します。

## データと信頼性

バックエンドがデータソースと連携し、データを永続化します。文書化された契約、スキーマ、単位に従います。エラー、欠損値、不正な応答、古いデータ、有効なゼロ値はそれぞれ異なる状態であり、画面でも区別を保ちます。

実装の詳細は、[リポジトリ内の外部API契約](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)と[フロントエンド構成ガイド](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/frontend/src/README.md)を参照してください。

## 関連資料

[方法論とデータ](./product/methodology) · [APIリファレンス](./reference/api) · [運用と診断](./operations)
