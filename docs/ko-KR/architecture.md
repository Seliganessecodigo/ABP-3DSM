# 아키텍처

이 부분은 개발·운영을 위한 로컬 환경, 계약, 검증 문서입니다. 제품 사용법은 사용 안내를 읽으세요.

## 기술 문서 {#components}

React 19/TypeScript/Vite가 표시하고 NestJS/TypeORM/PostgreSQL 18이 통합/저장합니다. 보조 출처는 백엔드만 호출합니다. controller는 전송, service는 사용 사례, adapter는 검증, repository는 저장을 담당합니다. 전역 인증/역할 guard와 `PublicRoute` 예외를 사용합니다. 설정은 사용자별이며 공유 감사는 `backend/src/shared/audit/`에서 성공한 변경 트랜잭션에 참여합니다.

```text
frontend/  React 19 · TypeScript · Vite
backend/   NestJS · TypeScript · TypeORM
PostgreSQL 18
frontend → GreenER API → auxiliary APIs
```

## 로그인 {#security}

대시보드와 환경 조회는 공개입니다. `/login`은 이메일/비밀번호 또는 활성화된 Google을 사용합니다. Admin은 Google 이후에도 6자리 TOTP 설정/확인이 필요하며 Analyst/Visitor에 관리 권한은 부여하지 않습니다. 프런트엔드 세션은 메모리에만 있어 새로고침 시 다시 로그인합니다. 백엔드는 JWT, 세션, 현재 역할/계정 상태를 검사합니다. 인증 누락/무효는 401, 역할 부족은 403이며 새 경로는 기본 보호됩니다.

같은 조직 Admin은 `expectedStatus`와 사유를 보내 계정을 `ACTIVE`, `BLOCKED`, `DEACTIVATED`로 변경합니다. 차단/비활성화는 모든 세션을 폐기하고 재활성화는 새 로그인을 요구합니다. 본인과 마지막 활성 Admin을 보호합니다. 기대 상태 충돌은 409, 이미 달성한 상태는 멱등 성공입니다. 공유 감사는 성공을 변경과 같은 트랜잭션에, 거부를 롤백 밖에 기록하며 행위자를 명시하고 비밀을 제외합니다. 전체 역할 관리/비밀번호 복구는 이 경로의 범위가 아닙니다.

## 기간과 이력 {#data}

`from`, `to`는 명시적 시간대의 RFC 3339이며 `[from,to)`를 UTC로 정규화합니다. `hour`, `day`, `month`, `year`, 최대 10,000포인트로 초과를 거부합니다. 저장값은 중첩에 따라 배분하며 최신 `collectedAt`, ID 사전순이 우선입니다. 승자가 지표를 지원하지 못해도 이전 관측으로 대체하지 않습니다.

원본 측정 시각이 없으므로 수신 시각에서 `collection_interval_seconds`를 빼 구간을 구합니다. 계수 조회 시각은 유효기간이 아니며 비공개 출처·유효성은 미상입니다. 에너지/계수/배출은 소수8자리, 커버리지4자리로 저장하고 중간 반올림은 없습니다. 별도 커버리지와 원본 snapshot을 보존합니다.

## 관련 문서 {#related}

[API 참조](./reference/api) · [시작하기](./getting-started)

[ADR](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/adr) · [Design](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/design) · [Specs](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/specs)
