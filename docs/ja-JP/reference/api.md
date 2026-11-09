# APIリファレンス

GreenER API連携の参照です。完全な型、任意項目、上限は環境の`/openapi.json`、Swaggerは`/docs`。カタログ・履歴は保存データを読み、プレビュー・炭素ルートは炭素強度の情報源を照会する場合があります。

## 公開クエリ {#public}

| HTTP | URI | アクセス |
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

## 期間と履歴 {#queries}

`from`と`to`はタイムゾーン付きRFC 3339です。`[from,to)`をUTCに正規化します。系列は`hour`、`day`、`month`、`year`、上限10,000点で超過を拒否します。保存値を重複時間で按分し、最新`collectedAt`、次にID辞書順で優先します。優先観測で算出できない場合に古い値へ戻しません。

| URI | パラメーター |
| --- | --- |
| `/applications/{id}/analysis` | `from`, `to` |
| `/applications/{id}/analysis/series` | `from`, `to`, `granularity` |
| `/applications/{id}/analysis/series/contributions` | `from`, `to`, `granularity`, `bucketStart`, `page`, `pageSize` (5/10/15/20/all) |
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds`, `granularity` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

元の測定時刻はなく、受信時刻から`collection_interval_seconds`を引いて区間を導出します。係数照会時刻は有効期間ではなく、未公開の出典・有効性は不明です。エネルギー・係数・排出は小数8桁、カバー率4桁で保存し、中間丸めは行いません。別々のカバー率と原本snapshotを保持します。

## 時系列と計算の説明 {#environmental-presentation}

`/analysis/summary` の任意パラメーター `granularity` を指定すると、合計と同じ期間・フィルターの `series.points` が含まれます。各期間はアプリケーションの保存済み結果を合計し、指標別のカバレッジを維持します。欠損値は `null` のままです。

`/applications/{id}/analysis` の `calculation.energyKwh` は排出量を計算できた区間のエネルギーです。`calculation.intensity` は、その排出量を対応するエネルギーで割った等価排出係数（gCO₂e/kWh）です。エネルギーがゼロまたは欠損の場合、係数は未定義です。過去の結果と係数は保持されます。

## ログインする {#login}

ダッシュボードと環境参照は公開。`/login`でメール/パスワード、または有効化済みGoogleを使用。AdminはGoogle後も6桁TOTPの設定/確認が必要。Analyst/Visitorに管理権限は付与しません。UIセッションはメモリ内で、再読み込み後は再ログイン。backendはJWT、セッション、現在の役割と状態を確認し、認証不正は401、権限不足は403。新規ルートは既定で保護します。

| HTTP | URI | アクセス |
| --- | --- | --- |
| POST | `/auth/login` | `email + password` |
| GET | `/auth/sso/google` | `PKCE` |
| GET | `/auth/sso/google/callback` | `state + cookie` |
| POST | `/auth/sso/handoff/exchange` | `code + PKCE` |
| POST | `/auth/totp/setup` | `setupToken` |
| POST | `/auth/totp/setup/confirm` | `setupToken + TOTP` |
| POST | `/auth/totp/challenge` | `challengeToken + TOTP` |
| POST | `/auth/sessions/refresh` | `refreshToken` |
| POST | `/auth/invitations/accept` | `token` |
| POST | `/auth/email/confirm` | `token + password` |
| POST | `/auth/email/confirmation/resend` | `organization + email` |

## 保護された操作 {#protected}

| HTTP | URI | アクセス |
| --- | --- | --- |
| GET | `/auth/me` | `JWT` |
| POST | `/auth/sessions/logout` | `JWT` |
| POST | `/auth/totp/replacement` | `JWT + password + TOTP` |
| POST | `/auth/totp/replacement/confirm` | `JWT + confirmationToken + TOTP` |
| GET | `/me/preferences` | `JWT` |
| PUT | `/me/preferences/{tab}` | `JWT` |
| POST | `/auth/sso/invitations` | `JWT + ADMIN` |
| DELETE | `/auth/sso/identities/{userId}` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/status` | `JWT + ADMIN` |
| GET | `/auth/users` | `JWT + ADMIN` |
| POST | `/auth/users` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/role` | `JWT + ADMIN` |

同じ組織のAdminは`expectedStatus`と理由を指定し`ACTIVE`、`BLOCKED`、`DEACTIVATED`を変更可能。ブロック/無効化で全セッションを失効、再有効化後は新規ログイン。自分自身と最後の有効Adminを保護。期待状態の不一致は409、目標状態到達済みは冪等成功。共通監査は成功を変更と同じトランザクション、拒否をロールバック外で記録し、実行主体を明記、秘密を除外。役割管理全体やパスワード復旧はこのAPIの範囲外です。

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## API でアカウントを管理する {#accounts}

同じ組織の有効な Admin のみが、アカウントの一覧表示、作成、ロール変更を行えます。作成時は `name`、`email`、`role`、`reason` を指定し、パスワードの設定やメールの自動確認は行いません。本人が既存のメール確認フローでパスワードを設定します。確認メールの送信は別途要求します。管理画面とパスワード回復は別の開発項目です。

一覧では検索とフィルターを適用してから並べ替えとページ分割を行います。初期値は10件で、5、10、15、20件、および絞り込み後の全件を返す `all` を選べます。翻訳済みラベルは列挙コードに、現地日時はオフセット付き RFC 3339 に変換してください。欠損値は昇順・降順とも末尾に配置し、同値の場合は識別子で順序を決めます。

ロール変更には `expectedRole` と `reason` が必要です。変更時はセッションと一時 TOTP 資格情報を失効させ、監査を保持し、自分自身のアクセスやメール確認済みの最後の有効な Admin を失う変更を防ぎます。メール未確認のアカウントはその管理者の代わりにはなりません。Admin を割り当てても TOTP は必須です。

## 再計算プレビューと比較する {#preview}

`/administration/calculations`でアプリと日付を選び原本とプレビューを比較。終了日はUTCの一日全体を含み、APIは`[from,to)`。公開操作で現行モデルと過去地域の現在係数を使用し、保存しません。上限30日・10,000観測。応答は`original`、`preview`、`warnings`、`status`（`available`、`empty`、`partial`）。係数障害でも算出可能なエネルギーを保持。百分率は同じ単位・カバー率と正の基準値が必要です。

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## 分析を自分用に設定する {#preferences}

`/methodology`にエネルギー、排出量、カバー率、分析の4タブと例示データ。ログインした各役割は自分のタブだけ保存し、楽観的リビジョン競合は409。表示しきい値は全体設定・計算・外部通知を変更しません。保存した期間/粒度は詳細URLで未指定の場合のみ適用。記録済み方法論は`/services/:id/methodology`と選択時の`collectionId`で保持します。

```text
GET /me/preferences → { energy, emissions, coverage, analysis }
null | { value, revision, updatedAt }
PUT /me/preferences/{tab} ← { expectedRevision, value }
expectedRevision: 0 → create
threshold ≥ 0; finite number; thresholdPercent: 0–100
unknown fields / partial bodies / numeric strings → 400
```

| tab | value |
| --- | --- |
| energy | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled}`; 0–100 |
| analysis | `{periodDays: 7 / 30, granularity: "hour" / "day"}` |

## エラー処理 {#errors}

HTTP状態と構造化コードで処理し、メッセージを翻訳契約としません。`null`は欠損でゼロではありません。空一覧は有効で、照会失敗と区別します。各操作の文脈でコードを解釈します。

| HTTP | コード |
| --- | --- |
| 400 | `INVALID_ANALYSIS_PERIOD` |
| 404 | `APPLICATION_NOT_FOUND / COLLECTION_NOT_FOUND` |
| 503 | `CATALOG_UNAVAILABLE / APPLICATION_EVIDENCE_UNAVAILABLE / APPLICATION_ANALYSIS_UNAVAILABLE` |
| 400 | `RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED / RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED` |
| 503 | `APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE` |
| 400 / 409 / 503 | `INVALID_PREFERENCE / PREFERENCE_CONFLICT / PREFERENCES_UNAVAILABLE` |

## HTTP契約 {#contracts}

[AUTHORIZATION_MATRIX.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [EXTERNAL_API_CONTRACTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) · [preferences/README.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md)

## 関連ページ {#related}

[運用と診断](../operations) · [方法論とデータ](../product/methodology)
