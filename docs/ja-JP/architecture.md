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

## アーキテクチャ — c343698

React 19/TypeScript/Viteが表示、NestJS/TypeORM/PostgreSQL 18が統合と保存を担当。補助APIはbackendのみが使用。controllerは転送、serviceはユースケース、adapterは検証、repositoryは保存。グローバルguardと`PublicRoute`例外を使用。設定はユーザー単位、共通監査は`backend/src/shared/audit/`で成功時は同一トランザクションです。

ダッシュボードと環境参照は公開。`/login`でメール/パスワード、または有効化済みGoogleを使用。AdminはGoogle後も6桁TOTPの設定/確認が必要。Analyst/Visitorに管理権限は付与しません。UIセッションはメモリ内で、再読み込み後は再ログイン。backendはJWT、セッション、現在の役割と状態を確認し、認証不正は401、権限不足は403。新規ルートは既定で保護します。

同じ組織のAdminは`expectedStatus`と理由を指定し`ACTIVE`、`BLOCKED`、`DEACTIVATED`を変更可能。ブロック/無効化で全セッションを失効、再有効化後は新規ログイン。自分自身と最後の有効Adminを保護。期待状態の不一致は409、目標状態到達済みは冪等成功。共通監査は成功を変更と同じトランザクション、拒否をロールバック外で記録し、実行主体を明記、秘密を除外。役割管理全体やパスワード復旧はこのAPIの範囲外です。

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)
