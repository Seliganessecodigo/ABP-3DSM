# はじめに

ここからは開発・運用向けの文書です。ローカル環境、契約、検証を説明します。製品の使い方は利用ガイドを参照してください。

## 設定 {#requirements}

Node.js 24以上、npm、Docker Compose v2を使用。`.env.example`を`.env`にコピーし`npm run dev`。Composeはmigrationと初期検出を実行し、情報源障害でもAPIを開始します。招待/確認にはSMTPを設定。初期Adminは`backend/`の`organizations:create-invitation`、変数`ORGANIZATION_NAME`、`ORGANIZATION_SLUG`、`ORGANIZATION_REPRESENTATIVE_EMAIL`で用意します。共通の本番Adminはありません。

## 最初に読むページ {#start}

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

```powershell
Copy-Item .env.example .env
```

```sh
cp .env.example .env
```

```sh
npm run dev
```

| 機能 | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5432` |

## 設定 {#commands}

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

## 関連ページ {#related}

[利用ガイド](./guide/monitoring) · [運用と診断](./operations)
