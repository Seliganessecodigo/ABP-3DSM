# はじめに

## 必要条件

- Docker Desktopと、`docker compose`コマンドで利用できるDocker Compose v2。
- ルートのスクリプトを実行するためのNode.js 24以降とnpm。

## 環境を起動する

リポジトリをクローンして、プロジェクトのディレクトリに移動します。

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

サンプルからローカル設定を作成します。

```powershell
Copy-Item .env.example .env
```

macOSまたはLinuxの場合:

```sh
cp .env.example .env
```

フロントエンド、API、PostgreSQLを起動します。

```sh
npm run dev
```

Composeがコンテナ内に依存関係をインストールします。未適用のマイグレーションはAPI起動前に実行されます。APIは起動時にアプリケーションの検出を試みます。Aggregatorが利用できない場合はエラーをログに記録して起動を続けます。

## ローカルアドレス

| サービス | アドレス |
| --- | --- |
| フロントエンド | `http://localhost:5173` |
| API | `http://localhost:3000` |
| OpenAPI | `http://localhost:3000/docs` |
| APIヘルスチェック | `http://localhost:3000/health` |
| PostgreSQL | localhost:5432 |

## よく使うコマンド

| コマンド | 操作 |
| --- | --- |
| `npm run dev:detached` | サービスをバックグラウンドで起動 |
| `npm run dev:logs` | サービスログを表示 |
| `npm run dev:down` | データボリュームを残してコンテナを停止 |
| `docker compose up --build` | イメージを再ビルド |

APIを再起動せず検出を再実行するには、`docker compose exec api npm run applications:discover`を実行します。

## よくある問題

- Dockerが見つからない場合はDocker Desktopを起動し、`docker compose version`を確認してください。
- ポートが使用中の場合は、`.env`の`FRONTEND_PORT`、`API_PORT`、`POSTGRES_PORT`を変更してください。
- APIが正常にならない場合は`npm run dev:logs`を確認してください。APIはPostgreSQLに依存し、起動時にマイグレーションを実行します。
- `.env.example`の値はローカル開発専用です。実際の認証情報や`.env`ファイルを共有・コミットしないでください。
