# GreenER APIリファレンス

2026年10月15日の`develop`で確認したルートです。ローカルSwaggerは`http://localhost:3000/docs`、スキーマは`/openapi.json`。完全なDTOは接続先環境のOpenAPIを確認してください。

## 既存の読み取り

| メソッド・ルート | 結果 |
| --- | --- |
| GET /health | サービスのHTTPヘルス応答。 |
| GET /applications | 永続化済み一覧。`[]`も有効。 |
| GET /applications/{id} | アプリ、状態、時刻、所在地。 |
| GET /applications/{id}/collections/latest | 最終有効観測と運用コンテキスト。 |
| GET /applications/{id}/collections/{collectionId} | 当該アプリの観測。collectionIdはUUID。 |
| GET /openapi.json | 機械可読の契約。 |

読み取りは収集や環境計算を起動しません。検索・ページ分割は現在フロントエンド側です。サーバーページ分割パラメーターは定義されていません。

## ローカル要求

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

返却されたアプリIDをURLエンコードして使います。連番やアプリIDのUUID形式を仮定しません。DTOには`id`、`name`、`state`、`firstSeenAt`、`lastCheckedAt`、`removedAt`、`location`があります。理由、鮮度、計算可否もバックエンドにありますが、UIはすべてを消費していません。都市はnull可、旧レコードの不完全な所在地は`location: null`です。

## エラー

| HTTP / コード | 意味 |
| --- | --- |
| 400 / INVALID_APPLICATION_ID | ルート上で空・不正なID。収集UUID不正も400。 |
| 404 / APPLICATION_NOT_FOUND | 未知のアプリ。 |
| 404 / COLLECTION_NOT_FOUND | 当該アプリに観測がない。 |
| 503 / CATALOG_UNAVAILABLE | 一覧読み取り失敗。 |
| 503 / APPLICATION_EVIDENCE_UNAVAILABLE | 証拠読み取り失敗。 |

構造化コードとHTTPを使い、文言を翻訳契約にしません。失敗を空やゼロへ置換しません。

## 統合境界

外部源はバックエンドだけが呼びます。[版管理された契約](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)を参照。将来のエネルギー・認証・管理APIはここで公開しません。JWT管理は[EP06](../backlog/ep06)の要件であり、提供済みとは仮定しません。URL・CORS・診断は[運用](../operations)、区間は[方法論](../product/methodology)へ。
