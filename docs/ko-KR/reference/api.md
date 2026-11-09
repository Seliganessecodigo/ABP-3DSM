# API 참조

기준: `origin/develop`, 커밋 `c343698`, 2026-11-08 확인. 환경마다 버전이 다를 수 있으며 병합이 배포를 증명하지 않습니다.

Swagger: `http://localhost:3000/docs`; schema: `/openapi.json`.

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

조회는 시간대가 명시된 RFC 3339 `from`, `to`를 요구하며 `[from,to)`를 UTC로 정규화합니다. 집계 단위 `hour`, `day`, `month`, `year`, 최대 10,000포인트. 저장값은 중첩 시간 비율로 배분하며 재계산하지 않습니다. 최신 `collectedAt`, 동률이면 ID 사전순이 우선하며 무효한 승자에서 이전 값으로 대체하지 않습니다. 에너지/CO₂e 커버리지는 별도입니다. `null`은 누락, 0은 유효할 수 있습니다. 원본 지표에 측정 시각이 없어 수신 시각에서 `collection_interval_seconds`를 빼서 구간을 구합니다. 계수 조회 시각은 유효기간이 아닙니다. 에너지/계수/배출량은 소수 8자리, 커버리지는 4자리로 저장합니다.

`/administration/calculations`에서 앱과 날짜를 골라 원본/미리보기를 비교합니다. 종료일은 UTC 하루 전체를 포함하며 API는 `[from,to)`를 받습니다. 공개 작업으로 현재 모델과 과거 지역의 현재 계수를 사용하고 저장하지 않습니다. 한도는 30일, 관측 10,000개입니다. `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`)를 반환합니다. 계수 실패 시 계산 가능한 에너지는 보존하고 CO₂e는 미제공합니다. 백분율은 같은 단위/커버리지와 양수 기준이 필요합니다.

`/methodology`는 에너지, 배출량, 커버리지, 분석 탭과 예제/개인 설정을 제공합니다. 로그인한 모든 역할이 자신의 탭만 저장하며 낙관적 버전 충돌은 409입니다. 표시 임계값은 전역 설정·계산·외부 알림을 바꾸지 않습니다. 저장된 기간/집계 단위는 상세 URL에 값이 없을 때만 적용합니다. 기록된 방법론은 `/services/:id/methodology`와 선택한 `collectionId`로 조회합니다.

같은 조직 Admin은 `expectedStatus`와 사유를 보내 계정을 `ACTIVE`, `BLOCKED`, `DEACTIVATED`로 변경합니다. 차단/비활성화는 모든 세션을 폐기하고 재활성화는 새 로그인을 요구합니다. 본인과 마지막 활성 Admin을 보호합니다. 기대 상태 충돌은 409, 이미 달성한 상태는 멱등 성공입니다. 공유 감사는 성공을 변경과 같은 트랜잭션에, 거부를 롤백 밖에 기록하며 행위자를 명시하고 비밀을 제외합니다. 전체 역할 관리/비밀번호 복구는 이 경로의 범위가 아닙니다.

`GET /analysis/summary`: `from`, `to`; `states`, `regionCodes`, `applicationIds`. `/monitoring/incidents`: `applicationId`, `source`, `integration`, `status`, `page`, `limit` → `{items,total,page,limit}`. `series/contributions`: `bucketStart`, `page`, `pageSize` (5/10/15/20/all).

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

[비전과 범위](../product/vision) · [사용 안내](../guide/monitoring) · [방법론과 데이터](../product/methodology) · [품질과 인수 기준](../product/quality) · [결정과 의존성](../product/decisions) · [API 참조](../reference/api) · [운영과 진단](../operations) · [시작하기](../getting-started) · [아키텍처](../architecture) · [기여 안내](../contributing) · [제품 백로그](../roadmap)


```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example administrative action" }
```

`PATCH /auth/users/{userId}/status`: `400`, `401`, `403`, `404`, `409`.

`POST /applications/{id}/analysis/recalculation-preview`: `400 RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED`, `400 RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED`, `503 APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE`.

`GET /me/preferences`: `energy`, `emissions`, `coverage`, `analysis` → `null` / `{ value, revision, updatedAt }`. `PUT /me/preferences/{tab}`: `{ expectedRevision, value }`. `expectedRevision: 0` → create. `400 INVALID_PREFERENCE`, `409 PREFERENCE_CONFLICT`, `503 PREFERENCES_UNAVAILABLE`.

| tab | value |
| --- | --- |
| energy | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled}`; 0–100 |
| analysis | `{periodDays: 7 / 30, granularity: "hour" / "day"}` |
