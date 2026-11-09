# 시작하기

기준: `origin/develop`, 커밋 `c343698`, 2026-11-08 확인. 환경마다 버전이 다를 수 있으며 병합이 배포를 증명하지 않습니다.

Node.js 24+, npm, Docker Compose v2가 필요합니다. `.env.example`을 `.env`로 복사하고 `npm run dev`를 실행합니다. Compose는 마이그레이션/초기 탐색을 수행하고 출처 장애에도 API를 시작합니다. 초대/확인용 SMTP를 설정합니다. 첫 Admin은 `backend/`의 `organizations:create-invitation`과 `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`로 준비합니다. 공통 운영 Admin 계정은 없습니다.

```powershell
Copy-Item .env.example .env
```

```sh
# macOS / Linux
cp .env.example .env
npm run dev
```

| HTTP | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | localhost:5432 |

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

[비전과 범위](./product/vision) · [사용 안내](./guide/monitoring) · [방법론과 데이터](./product/methodology) · [품질과 인수 기준](./product/quality) · [결정과 의존성](./product/decisions) · [API 참조](./reference/api) · [운영과 진단](./operations) · [시작하기](./getting-started) · [아키텍처](./architecture) · [기여 안내](./contributing) · [제품 백로그](./roadmap)
