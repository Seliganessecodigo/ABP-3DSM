# 運用と診断

既存の仕組みを記載し、本番SLAを定義しません。導入は[はじめに](./getting-started)、契約は[API](./reference/api)を参照します。

## 設定

| 設定 | 用途 |
| --- | --- |
| FRONTEND_PORT / API_PORT / POSTGRES_PORT | Compose公開ポート。 |
| DATABASE_URL | ホスト・クラウドのバックエンド。Compose内部は`postgres`。 |
| METRICS_AGGREGATOR_URL / CARBON_INTENSITY_URL | バックエンド専用の情報源。 |
| CORS_ORIGIN | 実際に使うフロントエンドの許可オリジン。 |
| VITE_API_URL | UIビルドに組み込む、または開発環境のAPI URL。 |
| MONITORING_SCHEDULE_INTERVAL_SECONDS | バックエンド周期、既定60秒。 |
| MONITORING_METRICS_CONCURRENCY | プロセスごと、初期既定2。外部の割当ではない。 |

監視設定は正の整数です。Composeはこの2つの`.env`キーを自動転送しないため、上書きには明示マッピングが必要です。サンプル認証情報はローカル限定です。

## 環境確認

~~~sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
~~~

手動検出を反復してもIDを重複させません。周期処理は最初の間隔後に開始します。重複実行防止はプロセス内のみで、レプリカ間には分散されません。UI更新と収集は独立です。

`/health`は一覧の充足、元への接続、環境計算可否を保証しません。`/applications`、証拠、サイクルログも確認します。

## 症状別診断

| 症状 | 確認 |
| --- | --- |
| コンテナー起動失敗 | Docker、ポート、変数、マイグレーション。 |
| UI表示、一方で一覧失敗 | ビルドURL、CORS、API、DB。 |
| 一覧が空 | 初期検出と集約元。空はHTTPエラーではない。 |
| 古いデータ | 観測時刻、現在の試行失敗、サイクル概要。 |
| パイプライン失敗、API応答あり | 品質、パッケージ、配布、smokeのどこか。配布後に別工程が失敗し得る。 |

## 公開と復旧

Stagingは`develop`からCI後に実行し、API（Azure App Service）とUI（Static Web Apps）は別ジョブです。API配布後にsmoke testを実施します。再実行前にrun、SHA、工程、診断を記録します。

PagesはVitePressと`DOCS_BASE=/ABP-3DSM/`を使います。ローカルビルド成功は公開完了を証明しません。ワークフローで自動DB復元は実証されていません。Rollbackや破壊的migration前に互換性と復元可能なbackupを確認します。保存期間と復元演習は[未決](./product/decisions)です。`npm run dev:down`はボリュームを保持し、削除するとローカルDBが消えます。

## 運用と診断 — JWT / Google / SMTP

Node.js 24以上、npm、Docker Compose v2を使用。`.env.example`を`.env`にコピーし`npm run dev`。Composeはmigrationと初期検出を実行し、情報源障害でもAPIを開始します。招待/確認にはSMTPを設定。初期Adminは`backend/`の`organizations:create-invitation`、変数`ORGANIZATION_NAME`、`ORGANIZATION_SLUG`、`ORGANIZATION_REPRESENTATIVE_EMAIL`で用意します。共通の本番Adminはありません。

```text
AUTH_JWT_SECRET
AUTH_PASSWORD_PEPPER / AUTH_PASSWORD_PEPPER_VERSION / AUTH_PASSWORD_PEPPER_KEYS
AUTH_TOTP_ENCRYPTION_KEY_VERSION / AUTH_TOTP_ENCRYPTION_KEYS
APP_BASE_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/sso/google/callback
SSO_RETURN_URL=http://localhost:5173/sso/callback
VITE_GOOGLE_SSO_ENABLED=true
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_FROM
SMTP_USER / SMTP_PASSWORD
```

ダッシュボードと環境参照は公開。`/login`でメール/パスワード、または有効化済みGoogleを使用。AdminはGoogle後も6桁TOTPの設定/確認が必要。Analyst/Visitorに管理権限は付与しません。UIセッションはメモリ内で、再読み込み後は再ログイン。backendはJWT、セッション、現在の役割と状態を確認し、認証不正は401、権限不足は403。新規ルートは既定で保護します。

同じ組織のAdminは`expectedStatus`と理由を指定し`ACTIVE`、`BLOCKED`、`DEACTIVATED`を変更可能。ブロック/無効化で全セッションを失効、再有効化後は新規ログイン。自分自身と最後の有効Adminを保護。期待状態の不一致は409、目標状態到達済みは冪等成功。共通監査は成功を変更と同じトランザクション、拒否をロールバック外で記録し、実行主体を明記、秘密を除外。役割管理全体やパスワード復旧はこのAPIの範囲外です。

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)


Google Cloudに`GOOGLE_CALLBACK_URL`と完全一致するURIを登録します。`VITE_GOOGLE_SSO_ENABLED=true`はボタンのみを有効化し、backend設定やアカウント作成は行いません。関連付けには招待が必要です。`GOOGLE_CLIENT_SECRET`、JWT、pepper、TOTP鍵はbackend専用の秘密として管理し、独立した値と読み取りに必要な旧版を保持します。招待・確認にはSMTPが必要。サポートは組織権限を独立確認した上で`authentication:recover-admin-totp`を実行し、セッションを失効して監査を残します。
