# 아키텍처

기준: `origin/develop`, 커밋 `c343698`, 2026-11-08 확인. 환경마다 버전이 다를 수 있으며 병합이 배포를 증명하지 않습니다.

React 19/TypeScript/Vite가 표시하고 NestJS/TypeORM/PostgreSQL 18이 통합/저장합니다. 보조 출처는 백엔드만 호출합니다. controller는 전송, service는 사용 사례, adapter는 검증, repository는 저장을 담당합니다. 전역 인증/역할 guard와 `PublicRoute` 예외를 사용합니다. 설정은 사용자별이며 공유 감사는 `backend/src/shared/audit/`에서 성공한 변경 트랜잭션에 참여합니다.

카탈로그/상세는 식별, 위치, 지표, 시간을 보존합니다. 이름/ID/지역 검색, 상태, 페이지는 URL에 유지합니다. 각 시도 종료 후 60초 폴링은 백엔드 수집과 독립입니다. 성공 후 실패하면 이전 데이터와 시간을 보존합니다. `AVAILABLE`, `UNAVAILABLE`, `NO_METRICS`, `REMOVED`는 사용량이 아니며 누락/오류/stale은 0이 아닙니다. 도시는 null일 수 있습니다. 연속 3회 유효 관측으로 복구하며 출처 오류로 제거를 확정하지 않습니다.

모델은 `simplified-energy` 버전 `1`입니다. CPU 100%는 100 W, 메모리 0.375 W/GB, 디스크 0.01 W/GB, 네트워크 0.02 W/GB입니다. 단순화한 매개변수이며 전력 실측/공식 지역 계수라는 주장이 아닙니다. 전력은 합계, 에너지 = W × 시간 / 1000, CO₂e[g] = kWh × gCO₂e/kWh입니다. 스냅샷은 방법/계수를 보존하며 현재 계수로 미리보기해도 원본을 수정하지 않습니다.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

[비전과 범위](./product/vision) · [사용 안내](./guide/monitoring) · [방법론과 데이터](./product/methodology) · [품질과 인수 기준](./product/quality) · [결정과 의존성](./product/decisions) · [API 참조](./reference/api) · [운영과 진단](./operations) · [시작하기](./getting-started) · [아키텍처](./architecture) · [기여 안내](./contributing) · [제품 백로그](./roadmap)
