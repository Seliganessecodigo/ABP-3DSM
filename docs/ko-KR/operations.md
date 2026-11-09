# 운영과 진단

이 부분은 개발·운영을 위한 로컬 환경, 계약, 검증 문서입니다. 제품 사용법은 사용 안내를 읽으세요.

## 설정 {#environment}

```text
FRONTEND_PORT=5173
API_PORT=3000
POSTGRES_PORT=5432
DATABASE_URL
METRICS_AGGREGATOR_URL
CARBON_INTENSITY_URL
CORS_ORIGIN
VITE_API_URL
MONITORING_SCHEDULE_INTERVAL_SECONDS=60
MONITORING_METRICS_CONCURRENCY=2
```

## 자동 모니터링 {#monitoring}

첫 간격 후 모니터링하며 프로세스별 중복을 방지합니다. 간격/동시성은 양의 정수입니다. Compose는 `.env`의 `MONITORING_SCHEDULE_INTERVAL_SECONDS`, `MONITORING_METRICS_CONCURRENCY`를 자동 전달하지 않아 명시 매핑이 필요합니다. `/health`는 HTTP만 확인하며 발견/계산을 보장하지 않습니다. 카탈로그·근거·로그를 확인하세요. 출처 장애로 제거하지 않으며 연속 3회 유효 관측으로 복구합니다.

완전하고 유효한 snapshot의 첫 부재로 제거를 확정합니다. 외부 호출은 총30초, 최초 포함 최대3회 HTTP 시도이며 일시적 오류만 재시도합니다.

## 로그인 {#authentication}

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

Google Cloud에 `GOOGLE_CALLBACK_URL`과 정확히 같은 URI를 등록합니다. `VITE_GOOGLE_SSO_ENABLED=true`는 버튼만 켜며 백엔드 설정/계정 생성을 하지 않습니다. 연결에는 초대가 필요합니다. `GOOGLE_CLIENT_SECRET`, JWT, pepper, TOTP 키는 백엔드 비밀이며 독립 값과 읽기에 필요한 이전 버전을 유지합니다. 초대/확인은 SMTP가 필요합니다. 지원팀은 조직 권한을 독립 검증한 뒤 `authentication:recover-admin-totp`를 실행하며 세션을 폐기하고 감사를 기록합니다.

```text
ORGANIZATION_NAME
ORGANIZATION_SLUG
ORGANIZATION_REPRESENTATIVE_EMAIL
ADMIN_EMAIL
NEW_RECOVERY_REPRESENTATIVE_EMAIL
SUPPORT_OPERATOR_ID
SUPPORT_RECOVERY_REASON
```

```sh
npm run organizations:create-invitation --prefix backend
npm run authentication:recover-admin-totp --prefix backend
```

## 진단 {#diagnosis}

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

## 배포와 복구 {#release}

staging은 `develop`에서 CI 후 API를 Azure App Service, frontend를 Static Web Apps에 배포하고 API 뒤 endpoint를 확인합니다. 문서는 GitHub Pages와 `DOCS_BASE=/ABP-3DSM/`를 사용합니다. 재시도 전 실패 단계를 확인하세요. 자동 DB 복원은 없습니다. `npm run dev:down`은 volume을 유지하며 volume 삭제는 로컬 데이터를 지웁니다.

## 관련 문서 {#related}

[시작하기](./getting-started) · [API 참조](./reference/api)
