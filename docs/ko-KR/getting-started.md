# 시작하기

이 부분은 개발·운영을 위한 로컬 환경, 계약, 검증 문서입니다. 제품 사용법은 사용 안내를 읽으세요.

## 설정 {#requirements}

Node.js 24+, npm, Docker Compose v2가 필요합니다. `.env.example`을 `.env`로 복사하고 `npm run dev`를 실행합니다. Compose는 마이그레이션/초기 탐색을 수행하고 출처 장애에도 API를 시작합니다. 초대/확인용 SMTP를 설정합니다. 첫 Admin은 `backend/`의 `organizations:create-invitation`과 `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`로 준비합니다. 공통 운영 Admin 계정은 없습니다.

## 시작할 곳 {#start}

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

```powershell
Copy-Item .env.example .env
```

```sh
cp .env.example .env
```

```sh
npm run dev
```

| 기능 | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5432` |

## 설정 {#commands}

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

## 관련 문서 {#related}

[사용 안내](./guide/monitoring) · [운영과 진단](./operations)
