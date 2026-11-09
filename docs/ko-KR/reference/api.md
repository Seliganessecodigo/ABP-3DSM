# API 참조

GreenER API 통합 참조입니다. 전체 타입·선택 필드·제한은 환경 `/openapi.json`, Swagger는 `/docs`에 있습니다. 카탈로그/이력은 저장 데이터를 읽으며 미리보기/탄소 경로는 탄소 집약도 출처를 조회할 수 있습니다.

## 공개 조회 {#public}

| HTTP | URI | 접근 |
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

## 기간과 이력 {#queries}

`from`, `to`는 명시적 시간대의 RFC 3339이며 `[from,to)`를 UTC로 정규화합니다. `hour`, `day`, `month`, `year`, 최대 10,000포인트로 초과를 거부합니다. 저장값은 중첩에 따라 배분하며 최신 `collectedAt`, ID 사전순이 우선입니다. 승자가 지표를 지원하지 못해도 이전 관측으로 대체하지 않습니다.

| URI | 매개변수 |
| --- | --- |
| `/applications/{id}/analysis` | `from`, `to` |
| `/applications/{id}/analysis/series` | `from`, `to`, `granularity` |
| `/applications/{id}/analysis/series/contributions` | `from`, `to`, `granularity`, `bucketStart`, `page`, `pageSize` (5/10/15/20/all) |
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

원본 측정 시각이 없으므로 수신 시각에서 `collection_interval_seconds`를 빼 구간을 구합니다. 계수 조회 시각은 유효기간이 아니며 비공개 출처·유효성은 미상입니다. 에너지/계수/배출은 소수8자리, 커버리지4자리로 저장하고 중간 반올림은 없습니다. 별도 커버리지와 원본 snapshot을 보존합니다.

## 로그인 {#login}

대시보드와 환경 조회는 공개입니다. `/login`은 이메일/비밀번호 또는 활성화된 Google을 사용합니다. Admin은 Google 이후에도 6자리 TOTP 설정/확인이 필요하며 Analyst/Visitor에 관리 권한은 부여하지 않습니다. 프런트엔드 세션은 메모리에만 있어 새로고침 시 다시 로그인합니다. 백엔드는 JWT, 세션, 현재 역할/계정 상태를 검사합니다. 인증 누락/무효는 401, 역할 부족은 403이며 새 경로는 기본 보호됩니다.

| HTTP | URI | 접근 |
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

## 보호된 작업 {#protected}

| HTTP | URI | 접근 |
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

같은 조직 Admin은 `expectedStatus`와 사유를 보내 계정을 `ACTIVE`, `BLOCKED`, `DEACTIVATED`로 변경합니다. 차단/비활성화는 모든 세션을 폐기하고 재활성화는 새 로그인을 요구합니다. 본인과 마지막 활성 Admin을 보호합니다. 기대 상태 충돌은 409, 이미 달성한 상태는 멱등 성공입니다. 공유 감사는 성공을 변경과 같은 트랜잭션에, 거부를 롤백 밖에 기록하며 행위자를 명시하고 비밀을 제외합니다. 전체 역할 관리/비밀번호 복구는 이 경로의 범위가 아닙니다.

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## API로 계정 관리 {#accounts}

동일 조직의 활성 Admin만 계정 조회, 생성, 역할 변경을 수행할 수 있습니다. 생성 시 `name`, `email`, `role`, `reason`을 받으며 비밀번호를 받거나 이메일을 자동 확인하지 않습니다. 계정 소유자가 기존 이메일 확인 절차에서 비밀번호를 설정하며, 확인 메일 발송은 별도로 요청합니다. 관리 화면과 비밀번호 복구는 별도 개발 항목입니다.

목록은 검색과 필터를 적용한 후 정렬하고 페이지를 나눕니다. 기본값은 10개이며 5, 10, 15, 20개 또는 필터링된 전체 목록을 반환하는 `all`을 선택할 수 있습니다. 번역된 레이블은 열거형 코드로, 현지 날짜는 시간대 오프셋이 있는 RFC 3339로 변환해야 합니다. 누락된 값은 양방향 정렬에서 마지막에 배치하고 동일한 값은 식별자로 순서를 정합니다.

역할 변경에는 `expectedRole`과 `reason`이 필요합니다. 변경 시 세션과 임시 TOTP 자격 증명을 폐기하고 감사 기록을 보존하며, 본인의 접근 권한이나 이메일이 확인된 마지막 활성 Admin을 제거하지 못하게 합니다. 이메일 미확인 계정은 해당 관리자를 대신할 수 없습니다. Admin을 부여해도 TOTP 인증은 필수입니다.

## 재계산 미리보기와 비교하기 {#preview}

`/administration/calculations`에서 앱과 날짜를 골라 원본/미리보기를 비교합니다. 종료일은 UTC 하루 전체를 포함하며 API는 `[from,to)`를 받습니다. 공개 작업으로 현재 모델과 과거 지역의 현재 계수를 사용하고 저장하지 않습니다. 한도는 30일, 관측 10,000개입니다. `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`)를 반환합니다. 계수 실패 시 계산 가능한 에너지는 보존하고 CO₂e는 미제공합니다. 백분율은 같은 단위/커버리지와 양수 기준이 필요합니다.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## 분석 개인화 {#preferences}

`/methodology`는 에너지, 배출량, 커버리지, 분석 탭과 예제/개인 설정을 제공합니다. 로그인한 모든 역할이 자신의 탭만 저장하며 낙관적 버전 충돌은 409입니다. 표시 임계값은 전역 설정·계산·외부 알림을 바꾸지 않습니다. 저장된 기간/집계 단위는 상세 URL에 값이 없을 때만 적용합니다. 기록된 방법론은 `/services/:id/methodology`와 선택한 `collectionId`로 조회합니다.

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

## 오류 처리 {#errors}

HTTP 상태와 구조화 코드로 오류를 처리하고 메시지를 번역 계약으로 삼지 마세요. `null`은 누락이며 0이 아닙니다. 빈 목록은 유효 응답으로 조회 실패와 구분합니다. 작업 맥락에서 코드를 해석하세요.

| HTTP | 코드 |
| --- | --- |
| 400 | `INVALID_ANALYSIS_PERIOD` |
| 404 | `APPLICATION_NOT_FOUND / COLLECTION_NOT_FOUND` |
| 503 | `CATALOG_UNAVAILABLE / APPLICATION_EVIDENCE_UNAVAILABLE / APPLICATION_ANALYSIS_UNAVAILABLE` |
| 400 | `RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED / RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED` |
| 503 | `APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE` |
| 400 / 409 / 503 | `INVALID_PREFERENCE / PREFERENCE_CONFLICT / PREFERENCES_UNAVAILABLE` |

## HTTP 계약 {#contracts}

[AUTHORIZATION_MATRIX.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [EXTERNAL_API_CONTRACTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) · [preferences/README.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md)

## 관련 문서 {#related}

[운영과 진단](../operations) · [방법론과 데이터](../product/methodology)
