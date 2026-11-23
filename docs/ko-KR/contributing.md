# 기여 안내

이 부분은 개발·운영을 위한 로컬 환경, 계약, 검증 문서입니다. 제품 사용법은 사용 안내를 읽으세요.

## 검증 기준 {#workflow}

에픽, 스토리, 작업은 검증 가능한 기준과 코드 참조로 제품을 구성합니다. 이슈, 풀 리퀘스트, 커밋이 요구사항·구현·테스트를 연결하며 버전 관리 문서는 아키텍처, 계약, 운영, 근거를 모읍니다.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## 검증 {#quality}

CI는 문서 빌드, 프런트엔드 lint/테스트/빌드, 백엔드 lint/typecheck/PostgreSQL 테스트/커버리지/빌드/마이그레이션과 실제 브라우저 통합 흐름을 검사합니다. `TEST_DATABASE_URL`은 격리 PostgreSQL이어야 합니다. 미설정 시 Jest DB 테스트는 생략되고 브라우저 통합은 실패합니다. `develop` PR의 SonarQube는 신규 커버리지 ≥80%, 중복 ≤3%, 등급 A, hotspot 전체 검토를 요구합니다.

```sh
npm ci --prefix docs
npm run docs:build
npm ci --prefix frontend
npm run lint --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
npm ci --prefix backend
npm run lint --prefix backend
npm run typecheck --prefix backend
npm test --prefix backend -- --runInBand
npm run test:cov --prefix backend -- --runInBand
npm run build --prefix backend
npm run test:integration --prefix frontend
```

## 기술 문서 {#documentation}

인터페이스는 지표를 기간, 단위, 데이터 범위, 방법론과 연결하고 필터 및 탐색 맥락을 유지합니다. 로딩, 빈 결과, 오류, 오래된 데이터 상태를 명시적으로 처리합니다. 키보드, 보이는 포커스, 색상 외의 텍스트, 모바일, 테마, 12개 언어가 사용자 경험을 구성합니다.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## 관련 문서 {#related}

[품질과 인수 기준](./product/quality) · [제품 백로그](./roadmap)

[제공 계획 및 증거](./plano-de-entregas)
