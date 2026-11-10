# 運用と診断

ここからは開発・運用向けの文書です。ローカル環境、契約、検証を説明します。製品の使い方は利用ガイドを参照してください。

## 設定 {#environment}

```text
FRONTEND_PORT=5173
API_PORT=3000
POSTGRES_PORT=5432
DATABASE_URL
METRICS_AGGREGATOR_URL
CARBON_INTENSITY_URL
CORS_ORIGIN
VITE_API_URL
MONITORING_SCHEDULE_INTERVAL_SECONDS=60
MONITORING_METRICS_CONCURRENCY=2
```

## 自動監視 {#monitoring}

監視は最初の間隔後に開始し、プロセス単位で重複を防ぎます。間隔・並列数は正の整数です。Composeは`MONITORING_SCHEDULE_INTERVAL_SECONDS`と`MONITORING_METRICS_CONCURRENCY`を`.env`から自動転送せず、明示マッピングが必要です。`/health`はHTTP応答であり検出・算出の保証ではありません。カタログ、根拠、ログを確認。情報源障害で削除確定せず、有効観測3回連続で復旧します。

完全で有効なsnapshotで最初の不在を確認すると削除を確定します。外部呼び出しは合計30秒、初回を含む最大3回のHTTP試行とし、一時的な障害だけを再試行します。

## ログインする {#authentication}

Node.js 24以上、npm、Docker Compose v2を使用。`.env.example`を`.env`にコピーし`npm run dev`。Composeはmigrationと初期検出を実行し、情報源障害でもAPIを開始します。招待/確認にはSMTPを設定。初期Adminは`backend/`の`organizations:create-invitation`、変数`ORGANIZATION_NAME`、`ORGANIZATION_SLUG`、`ORGANIZATION_REPRESENTATIVE_EMAIL`で用意します。共通の本番Adminはありません。

サイトでの初回アクセスは2段階です。`/setup-admin` の招待を開いて氏名とメールアドレスを入力し、続いて `/confirm-email` の確認を開いてパスワードを作成します。その後ログインし、管理者に必須の認証アプリを設定します。無効、期限切れ、使用済みリンクには再発行の案内が表示されます。トークンはURLから削除され、ページのメモリにのみ保持されます。再読み込み後は元のメールのリンクを開き直してください。SMTPは実際のメールボックスに配信する必要があります。`.test` アドレスは例です。Azureでは、運用担当者が設定済みバックエンドのコンソールで `npm run organizations:create-invitation:prod` を実行して最初の招待を発行し、招待された人がサイトで登録を完了します。`APP_BASE_URL` は公開フロントエンドを指す必要があります。`frontend/public/staticwebapp.config.json` により公開ルートに直接アクセスできます。

**ユーザー** (`/administration/users`) で管理者は組織のアカウントを確認し、Googleの招待を送信できます。**自分のGoogleアカウントを連携**で自分の情報を入力し、送信を確認してから、同じメールアドレスのGoogleアカウントでメールのリンクを開きます。メールアドレスの一致だけで自動連携は行いません。新規アカウントは承諾後に表示され、未承諾の招待は含まれません。再送すると以前の招待は無効になります。既存の名前、役割、パスワードは維持され、管理者のTOTPは引き続き必須です。ステージングはGitHub変数の `VITE_GOOGLE_SSO_ENABLED` を読み取ります。バックエンドの認証情報とURLを設定してから `true` にしてください。`GOOGLE_CALLBACK_URL` は公開APIのURLに `/auth/sso/google/callback` を、`SSO_RETURN_URL` は公開フロントエンドのURLに `/sso/callback` を付けます。

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

Google Cloudに`GOOGLE_CALLBACK_URL`と完全一致するURIを登録します。`VITE_GOOGLE_SSO_ENABLED=true`はボタンのみを有効化し、backend設定やアカウント作成は行いません。関連付けには招待が必要です。`GOOGLE_CLIENT_SECRET`、JWT、pepper、TOTP鍵はbackend専用の秘密として管理し、独立した値と読み取りに必要な旧版を保持します。招待・確認にはSMTPが必要。サポートは組織権限を独立確認した上で`authentication:recover-admin-totp`を実行し、セッションを失効して監査を残します。

```text
ORGANIZATION_NAME
ORGANIZATION_SLUG
ORGANIZATION_REPRESENTATIVE_EMAIL
ADMIN_EMAIL
NEW_RECOVERY_REPRESENTATIVE_EMAIL
SUPPORT_OPERATOR_ID
SUPPORT_RECOVERY_REASON
```

```sh
npm run organizations:create-invitation --prefix backend
npm run authentication:recover-admin-totp --prefix backend
```

## 診断 {#diagnosis}

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

## 公開と復元 {#release}

stagingは`develop`からCI後にAPIをAzure App Service、frontendをStatic Web Appsへ公開し、API後にendpointを検証します。文書はGitHub Pages、`DOCS_BASE=/ABP-3DSM/`です。再実行前に失敗段階を確認します。DB自動復元はありません。`npm run dev:down`はvolumeを保持し、volume削除でローカルデータを失います。

## 関連ページ {#related}

[はじめに](./getting-started) · [APIリファレンス](./reference/api)
