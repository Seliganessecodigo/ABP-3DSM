# GreenER APIリファレンス

2026年10月23日の`develop`で確認したルートです（commit `1633ca2`）。ローカルSwaggerは`http://localhost:3000/docs`、スキーマは`/openapi.json`。完全なDTOは接続先環境のOpenAPIを確認してください。

## 既存の読み取り

| メソッド・ルート | 結果 |
| --- | --- |
| GET /health | サービスのHTTPヘルス応答。 |
| GET /applications | 永続化済み一覧。`[]`も有効。 |
| GET /applications/{id} | アプリ、状態、時刻、所在地。 |
| GET /applications/{id}/collections/latest | 最終有効観測と運用コンテキスト。 |
| GET /applications/{id}/collections/{collectionId} | 当該アプリの観測。collectionIdはUUID。 |
| GET /applications/{id}/analysis?from=…&to=… | アプリケーションと期間を指定して保存済み環境結果を取得。 |
| GET /applications/{id}/analysis/series?from=…&to=…&granularity=… | アプリごとの環境時系列。 |
| GET /applications/{id}/analysis/series/contributions?… | 時系列bucketの寄与と除外。ページ指定に対応。 |
| GET /analysis/summary?from=…&to=… | フィルター指定可能な環境集計サマリー。 |
| GET /monitoring/incidents | フィルターとページ指定による連携インシデントの取得。 |
| GET /openapi.json | 機械可読の契約。 |

読み取りは永続化済みデータを使います。環境クエリは保存済み結果を集計し、履歴を再計算しません。時系列はUTCの粒度を使い、欠損とイベントを保持します。カタログ検索とページ分割はフロントエンドで行います。

## ローカル要求

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

返却されたアプリIDをURLエンコードして使います。連番やアプリIDのUUID形式を仮定しません。DTOには`id`、`name`、`state`、`reason`、`lastObservationAt`、`isStale`、`isCalculable`、`firstSeenAt`、`lastCheckedAt`、`removedAt`、`updatedAt`、`location`があります。詳細画面は運用フィールドを状態、鮮度、計算可否の説明に使います。型とnull可否はOpenAPIを参照してください。都市はnull可、旧レコードの不完全な所在地は`location: null`です。

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

## 環境分析を取得する

`GET /applications/{id}/analysis`には、明示的なタイムゾーンを含むRFC 3339形式の`from`と`to`が必要です。開始は含み、終了は含みません。両方ともUTCに正規化されます。応答には`status`（`available`または`empty`）、期間、エネルギー、排出量、個別のカバー率、由来情報（方法論、参照した係数、理由）が含まれます。`null`は利用可能な結果がないことを示し、0は有効な値です。

| HTTP / code | 意味 |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | タイムスタンプが無効、タイムゾーンなし、または`to`が`from`以下。 |
| 404 / APPLICATION_NOT_FOUND | アプリケーションが見つかりません。 |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | 分析または保存結果の読み取りに失敗。 |

アプリごとの要約と時系列は詳細画面に統合されています。bucketの寄与も同画面から参照します。現行フロントエンドは最初のページを取得し、ページ切替の操作は今後の対応です。

## 環境時系列を取得する

`GET /applications/{id}/analysis/series`には`from`、`to`、`granularity`（`hour`、`day`、`month`、`year`）が必要です。応答には`points`、`events`、合計、カバー率が含まれます。bucketはUTCカレンダーを使い、期間との重なりだけを数え、部分bucketになる場合があります。10,000点を超える期間は拒否され、切り詰めや粒度の自動変更は行いません。

`GET /applications/{id}/analysis/series/contributions`には`bucketStart`も必要です。`page`の既定値は1、`pageSize`は10です。サイズは`5`、`10`、`15`、`20`、`all`で、`all`は1ページ目のみ有効です。応答は保存済みの方法論・係数スナップショットと寄与・除外を含みます。

## 集計サマリーを取得する

`GET /analysis/summary`には`from`と`to`が必要です。`states`、`regionCodes`、`applicationIds`は任意の繰り返し可能なフィルターです。応答には合計、カバー率、状態別件数、アプリ一覧、`dataAsOf`、由来情報が含まれます。APIはありますが、集計ダッシュボード画面はまだありません。

## 監視インシデントを取得する

`GET /monitoring/incidents`は`applicationId`、`source`、`integration`、`status`、`page`、`limit`を受け付けます。statusは`OPEN`、`RECOVERING`、`RESOLVED`で、既定値はpage 1、limit 20です。応答には`items`、`total`、`page`、`limit`が含まれます。最新の上限と列挙値はOpenAPIを参照してください。
