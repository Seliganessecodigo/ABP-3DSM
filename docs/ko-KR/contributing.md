# 기여 안내

기준: `origin/develop`, 커밋 `c343698`, 2026-11-08 확인. 환경마다 버전이 다를 수 있으며 병합이 배포를 증명하지 않습니다.

Issue는 인수/의존성, Projects는 우선순위/Sprint, Figma는 시각 의도, 코드/OpenAPI는 실제 계약을 기록합니다. 장기 결정은 ADR에 남깁니다. PR 생성으로 issue를 닫지 말고 병합/범위를 확인합니다. 기존 ADR은 역사 기록으로 유지합니다.

`develop` → `tipo/numero-descricao` / `tipo/descricao` → PR `develop`. Conventional Commits: `tipo(escopo): descrição`; `Refs #N`.

GreenER는 애플리케이션을 모니터링하고 에너지와 CO₂e를 추정합니다. 카탈로그, 대시보드, 상세, 이력, 재계산 미리보기, 방법론, 로그인을 제공합니다. UI와 문서는 12개 언어를 지원합니다: `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP`, `zh-CN`, `ko-KR`, `ru-RU`, `hi-IN`, `id-ID`. 프런트엔드의 대체 언어는 영어입니다.

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
# Isolated PostgreSQL: TEST_DATABASE_URL
npm run test:integration --prefix frontend
```

[비전과 범위](./product/vision) · [사용 안내](./guide/monitoring) · [방법론과 데이터](./product/methodology) · [품질과 인수 기준](./product/quality) · [결정과 의존성](./product/decisions) · [API 참조](./reference/api) · [운영과 진단](./operations) · [시작하기](./getting-started) · [아키텍처](./architecture) · [기여 안내](./contributing) · [제품 백로그](./roadmap)
