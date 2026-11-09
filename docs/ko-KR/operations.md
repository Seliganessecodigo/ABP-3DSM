# 운영과 진단

기준: `origin/develop`, 커밋 `c343698`, 2026-11-08 확인. 환경마다 버전이 다를 수 있으며 병합이 배포를 증명하지 않습니다.

Node.js 24+, npm, Docker Compose v2가 필요합니다. `.env.example`을 `.env`로 복사하고 `npm run dev`를 실행합니다. Compose는 마이그레이션/초기 탐색을 수행하고 출처 장애에도 API를 시작합니다. 초대/확인용 SMTP를 설정합니다. 첫 Admin은 `backend/`의 `organizations:create-invitation`과 `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`로 준비합니다. 공통 운영 Admin 계정은 없습니다.

```text
AUTH_JWT_SECRET
AUTH_PASSWORD_PEPPER / AUTH_PASSWORD_PEPPER_VERSION / AUTH_PASSWORD_PEPPER_KEYS
AUTH_TOTP_ENCRYPTION_KEY_VERSION / AUTH_TOTP_ENCRYPTION_KEYS
APP_BASE_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/sso/google/callback
SSO_RETURN_URL=http://localhost:5173/sso/callback
VITE_GOOGLE_SSO_ENABLED=true
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_FROM
SMTP_USER / SMTP_PASSWORD
```

대시보드와 환경 조회는 공개입니다. `/login`은 이메일/비밀번호 또는 활성화된 Google을 사용합니다. Admin은 Google 이후에도 6자리 TOTP 설정/확인이 필요하며 Analyst/Visitor에 관리 권한은 부여하지 않습니다. 프런트엔드 세션은 메모리에만 있어 새로고침 시 다시 로그인합니다. 백엔드는 JWT, 세션, 현재 역할/계정 상태를 검사합니다. 인증 누락/무효는 401, 역할 부족은 403이며 새 경로는 기본 보호됩니다.

같은 조직 Admin은 `expectedStatus`와 사유를 보내 계정을 `ACTIVE`, `BLOCKED`, `DEACTIVATED`로 변경합니다. 차단/비활성화는 모든 세션을 폐기하고 재활성화는 새 로그인을 요구합니다. 본인과 마지막 활성 Admin을 보호합니다. 기대 상태 충돌은 409, 이미 달성한 상태는 멱등 성공입니다. 공유 감사는 성공을 변경과 같은 트랜잭션에, 거부를 롤백 밖에 기록하며 행위자를 명시하고 비밀을 제외합니다. 전체 역할 관리/비밀번호 복구는 이 경로의 범위가 아닙니다.

`MONITORING_SCHEDULE_INTERVAL_SECONDS=60`, `MONITORING_METRICS_CONCURRENCY=2`.

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

미제공: 두 앱 전용 비교, 지역 시뮬레이션, 일반 사용자/역할 관리, 셀프 비밀번호 복구, 전역 모니터링 설정/일시정지, CSV. 영향도 정렬은 제공됩니다. 외부 할당량, 보존, 백업/복원과 운영 목표는 결정이 필요하며 SLA는 선언하지 않습니다. 지원팀 TOTP 복구는 비밀번호 초기화가 아닙니다.

[비전과 범위](./product/vision) · [사용 안내](./guide/monitoring) · [방법론과 데이터](./product/methodology) · [품질과 인수 기준](./product/quality) · [결정과 의존성](./product/decisions) · [API 참조](./reference/api) · [운영과 진단](./operations) · [시작하기](./getting-started) · [아키텍처](./architecture) · [기여 안내](./contributing) · [제품 백로그](./roadmap)


Google Cloud에 `GOOGLE_CALLBACK_URL`과 정확히 같은 URI를 등록합니다. `VITE_GOOGLE_SSO_ENABLED=true`는 버튼만 켜며 백엔드 설정/계정 생성을 하지 않습니다. 연결에는 초대가 필요합니다. `GOOGLE_CLIENT_SECRET`, JWT, pepper, TOTP 키는 백엔드 비밀이며 독립 값과 읽기에 필요한 이전 버전을 유지합니다. 초대/확인은 SMTP가 필요합니다. 지원팀은 조직 권한을 독립 검증한 뒤 `authentication:recover-admin-totp`를 실행하며 세션을 폐기하고 감사를 기록합니다.

모니터링 변수는 양의 정수이며 현재 Compose는 이 두 값을 `.env`에서 API 컨테이너로 자동 전달하지 않습니다. 재정의하려면 environment 매핑이 필요합니다. 주기/중복 방지는 프로세스 단위이며 여러 복제본의 분산 잠금이 아닙니다. `/health`는 출처 접근이나 데이터 계산 가능성을 증명하지 않습니다. `develop`의 staging은 CI 후 API를 Azure App Service, frontend를 Static Web Apps에 배포하고 smoke test를 실행합니다. 문서는 GitHub Pages에 배포됩니다. 자동 DB 복구는 없으며 `dev:down`은 볼륨을 보존합니다.
