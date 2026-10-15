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
