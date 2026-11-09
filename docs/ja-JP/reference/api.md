# GreenER APIリファレンス

基準：`origin/develop`、コミット`c343698`、2026年11月8日確認。環境の版は異なる場合があり、マージは公開完了を証明しません。 Swagger: `http://localhost:3000/docs`; schema: `/openapi.json`.

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

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

## 環境分析を取得する

`GET /applications/{id}/analysis`には、明示的なタイムゾーンを含むRFC 3339形式の`from`と`to`が必要です。開始は含み、終了は含みません。両方ともUTCに正規化されます。応答には`status`（`available`または`empty`）、期間、エネルギー、排出量、個別のカバー率、由来情報（方法論、参照した係数、理由）が含まれます。`null`は利用可能な結果がないことを示し、0は有効な値です。

| HTTP / code | 意味 |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | タイムスタンプが無効、タイムゾーンなし、または`to`が`from`以下。 |
| 404 / APPLICATION_NOT_FOUND | アプリケーションが見つかりません。 |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | 分析または保存結果の読み取りに失敗。 |

`/history`でアプリを選び、`applicationId`、期間、粒度をURLに保持。保存系列、フィルター、表示タイムゾーン、イベント、番号付きページ、bucket検査を提供。寄与も5・10・15・20件または全件のページ切替に対応。backendのbucketはUTCで、表示タイムゾーンでは再集計しません。詳細の重ね合わせは同じアプリの直前同期間と比較します。

## 環境時系列を取得する

`GET /applications/{id}/analysis/series`には`from`、`to`、`granularity`（`hour`、`day`、`month`、`year`）が必要です。応答には`points`、`events`、合計、カバー率が含まれます。bucketはUTCカレンダーを使い、期間との重なりだけを数え、部分bucketになる場合があります。10,000点を超える期間は拒否され、切り詰めや粒度の自動変更は行いません。

`GET /applications/{id}/analysis/series/contributions`には`bucketStart`も必要です。`page`の既定値は1、`pageSize`は10です。サイズは`5`、`10`、`15`、`20`、`all`で、`all`は1ページ目のみ有効です。応答は保存済みの方法論・係数スナップショットと寄与・除外を含みます。

## 集計サマリーを取得する

`GET /analysis/summary`: `from`, `to`; `states`, `regionCodes`, `applicationIds`; `totals`, `coverage`, `states`, `applications`, `dataAsOf`, `provenance`. `/dashboard`で24時間・7・30・90日、状態、地域を選択。合計、カバー率、状態別件数、排出構成の棒・ドーナツ図を表示。表は検索、列フィルター、エネルギー/CO₂e順、ページ切替に対応します。表の絞り込みは合計を変更しません。アプリを開いて根拠を調べます。`GET /analysis/summary`を再読み込みなしで定期更新します。

## 監視インシデントを取得する

`GET /monitoring/incidents`は`applicationId`、`source`、`integration`、`status`、`page`、`limit`を受け付けます。statusは`OPEN`、`RECOVERING`、`RESOLVED`で、既定値はpage 1、limit 20です。応答には`items`、`total`、`page`、`limit`が含まれます。最新の上限と列挙値はOpenAPIを参照してください。

## APIリファレンス — JWT

| HTTP | URI | JWT / credential |
| --- | --- | --- |
| GET | `/health` | — |
| GET | `/applications` | — |
| GET | `/applications/{id}` | — |
| GET | `/applications/{id}/collections/latest` | — |
| GET | `/applications/{id}/collections/{collectionId}` | — |
| GET | `/applications/{id}/analysis` | — |
| GET | `/applications/{id}/analysis/series` | — |
| GET | `/applications/{id}/analysis/series/contributions` | — |
| GET | `/analysis/summary` | — |
| GET | `/monitoring/incidents` | — |
| GET | `/carbon/regions` | — |
| GET | `/carbon/regions/{code}/intensity` | — |
| POST | `/applications/{id}/analysis/recalculation-preview` | — |
| POST | `/auth/login` | email + password |
| GET | `/auth/sso/google` | PKCE |
| GET | `/auth/sso/google/callback` | state + cookie |
| POST | `/auth/sso/handoff/exchange` | code + PKCE |
| POST | `/auth/totp/setup` | setupToken |
| POST | `/auth/totp/setup/confirm` | setupToken + TOTP |
| POST | `/auth/totp/challenge` | challengeToken + TOTP |
| POST | `/auth/sessions/refresh` | refreshToken |
| POST | `/auth/invitations/accept` | token |
| POST | `/auth/email/confirm` | token + password |
| POST | `/auth/email/confirmation/resend` | organization + email |
| GET | `/auth/me` | JWT |
| POST | `/auth/sessions/logout` | JWT |
| POST | `/auth/totp/replacement` | JWT + password + TOTP |
| POST | `/auth/totp/replacement/confirm` | JWT + confirmationToken + TOTP |
| GET | `/me/preferences` | JWT |
| PUT | `/me/preferences/{tab}` | JWT |
| POST | `/auth/sso/invitations` | JWT + ADMIN |
| DELETE | `/auth/sso/identities/{userId}` | JWT + ADMIN |
| PATCH | `/auth/users/{userId}/status` | JWT + ADMIN |

ダッシュボードと環境参照は公開。`/login`でメール/パスワード、または有効化済みGoogleを使用。AdminはGoogle後も6桁TOTPの設定/確認が必要。Analyst/Visitorに管理権限は付与しません。UIセッションはメモリ内で、再読み込み後は再ログイン。backendはJWT、セッション、現在の役割と状態を確認し、認証不正は401、権限不足は403。新規ルートは既定で保護します。

同じ組織のAdminは`expectedStatus`と理由を指定し`ACTIVE`、`BLOCKED`、`DEACTIVATED`を変更可能。ブロック/無効化で全セッションを失効、再有効化後は新規ログイン。自分自身と最後の有効Adminを保護。期待状態の不一致は409、目標状態到達済みは冪等成功。共通監査は成功を変更と同じトランザクション、拒否をロールバック外で記録し、実行主体を明記、秘密を除外。役割管理全体やパスワード復旧はこのAPIの範囲外です。

## APIリファレンス — POST /applications/{id}/analysis/recalculation-preview

`/administration/calculations`でアプリと日付を選び原本とプレビューを比較。終了日はUTCの一日全体を含み、APIは`[from,to)`。公開操作で現行モデルと過去地域の現在係数を使用し、保存しません。上限30日・10,000観測。応答は`original`、`preview`、`warnings`、`status`（`available`、`empty`、`partial`）。係数障害でも算出可能なエネルギーを保持。百分率は同じ単位・カバー率と正の基準値が必要です。

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

## APIリファレンス — /me/preferences

`/methodology`にエネルギー、排出量、カバー率、分析の4タブと例示データ。ログインした各役割は自分のタブだけ保存し、楽観的リビジョン競合は409。表示しきい値は全体設定・計算・外部通知を変更しません。保存した期間/粒度は詳細URLで未指定の場合のみ適用。記録済み方法論は`/services/:id/methodology`と選択時の`collectionId`で保持します。

`GET /me/preferences`: `energy`, `emissions`, `coverage`, `analysis` → `null` / `{ value, revision, updatedAt }`. `PUT /me/preferences/{tab}`: `{ expectedRevision, value }`; `expectedRevision: 0` → create; `400 INVALID_PREFERENCE`, `409 PREFERENCE_CONFLICT`, `503 PREFERENCES_UNAVAILABLE`.


```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example administrative action" }
```

`PATCH /auth/users/{userId}/status`: `400`, `401`, `403`, `404`, `409`.

`POST /applications/{id}/analysis/recalculation-preview`: `400 RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED`, `400 RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED`, `503 APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE`.
