# 품질과 인수 기준

기준: `origin/develop`, 커밋 `c343698`, 2026-11-08 확인. 환경마다 버전이 다를 수 있으며 병합이 배포를 증명하지 않습니다.

CI는 문서 빌드, 프런트엔드 lint/테스트/빌드, 백엔드 lint/typecheck/PostgreSQL 테스트/커버리지/빌드/마이그레이션과 실제 브라우저 통합 흐름을 검사합니다. `TEST_DATABASE_URL`은 격리 PostgreSQL이어야 합니다. 미설정 시 Jest DB 테스트는 생략되고 브라우저 통합은 실패합니다. `develop` PR의 SonarQube는 신규 커버리지 ≥80%, 중복 ≤3%, 등급 A, hotspot 전체 검토를 요구합니다. 자동 검증은 사용성 평가/제품 인수를 대체하지 않습니다.

카탈로그/상세는 식별, 위치, 지표, 시간을 보존합니다. 이름/ID/지역 검색, 상태, 페이지는 URL에 유지합니다. 각 시도 종료 후 60초 폴링은 백엔드 수집과 독립입니다. 성공 후 실패하면 이전 데이터와 시간을 보존합니다. `AVAILABLE`, `UNAVAILABLE`, `NO_METRICS`, `REMOVED`는 사용량이 아니며 누락/오류/stale은 0이 아닙니다. 도시는 null일 수 있습니다. 연속 3회 유효 관측으로 복구하며 출처 오류로 제거를 확정하지 않습니다.

같은 조직 Admin은 `expectedStatus`와 사유를 보내 계정을 `ACTIVE`, `BLOCKED`, `DEACTIVATED`로 변경합니다. 차단/비활성화는 모든 세션을 폐기하고 재활성화는 새 로그인을 요구합니다. 본인과 마지막 활성 Admin을 보호합니다. 기대 상태 충돌은 409, 이미 달성한 상태는 멱등 성공입니다. 공유 감사는 성공을 변경과 같은 트랜잭션에, 거부를 롤백 밖에 기록하며 행위자를 명시하고 비밀을 제외합니다. 전체 역할 관리/비밀번호 복구는 이 경로의 범위가 아닙니다.

미제공: 두 앱 전용 비교, 지역 시뮬레이션, 일반 사용자/역할 관리, 셀프 비밀번호 복구, 전역 모니터링 설정/일시정지, CSV. 영향도 정렬은 제공됩니다. 외부 할당량, 보존, 백업/복원과 운영 목표는 결정이 필요하며 SLA는 선언하지 않습니다. 지원팀 TOTP 복구는 비밀번호 초기화가 아닙니다.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

[비전과 범위](../product/vision) · [사용 안내](../guide/monitoring) · [방법론과 데이터](../product/methodology) · [품질과 인수 기준](../product/quality) · [결정과 의존성](../product/decisions) · [API 참조](../reference/api) · [운영과 진단](../operations) · [시작하기](../getting-started) · [아키텍처](../architecture) · [기여 안내](../contributing) · [제품 백로그](../roadmap)
