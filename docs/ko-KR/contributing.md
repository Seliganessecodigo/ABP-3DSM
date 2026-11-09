# 기여 안내

이 부분은 개발·운영을 위한 로컬 환경, 계약, 검증 문서입니다. 제품 사용법은 사용 안내를 읽으세요.

## 검증 기준 {#workflow}

범위·규칙 변경은 관련 스토리에 문제, 기대 결과, 인수 기준을 기록합니다. 제품 리뷰와 사용성 평가는 어려움·피드백·개선을 남깁니다. 보존 정책, 백업·복구, 운영 목표와 외부 할당량은 결정이 필요합니다.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## 검증 {#quality}

CI는 문서 빌드, 프런트엔드 lint/테스트/빌드, 백엔드 lint/typecheck/PostgreSQL 테스트/커버리지/빌드/마이그레이션과 실제 브라우저 통합 흐름을 검사합니다. `TEST_DATABASE_URL`은 격리 PostgreSQL이어야 합니다. 미설정 시 Jest DB 테스트는 생략되고 브라우저 통합은 실패합니다. `develop` PR의 SonarQube는 신규 커버리지 ≥80%, 중복 ≤3%, 등급 A, hotspot 전체 검토를 요구합니다. 자동 검증은 사용성 평가/제품 인수를 대체하지 않습니다.

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

제품은 앱을 찾고 0과 누락을 구분하며 지표의 기간·단위·커버리지·방법론을 추적할 수 있어야 합니다. 조회는 탐색 맥락을 유지하고 로딩·빈 결과·오류·이전 데이터를 알려야 합니다. 평가에는 키보드, 보이는 포커스, 색상 외 텍스트, 모바일과 12개 언어를 포함합니다.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## 관련 문서 {#related}

[품질과 인수 기준](./product/quality) · [제품 백로그](./roadmap)
