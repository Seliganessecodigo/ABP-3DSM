# 제공 계획 및 증거

GreenER의 결과물은 기능의 폭, 소프트웨어 공학, 환경 데이터 추적성을 결합합니다. 이 문서는 구현된 기능, 평가 기준 27개의 근거, 3개 스프린트에서 5명 구성원이 기여한 내용을 코드·테스트·문서 링크와 함께 제시합니다.

`2026-11-22` · `America/Sao_Paulo` · `240a2c26ecd2eb1b0adc184f4efe01799bab8a50`

## 통합 제품과 엔지니어링 {#engineering}

React 19와 TypeScript가 인터페이스를 지원하고 NestJS는 의존성 주입으로 API를 모듈과 계층으로 구성합니다. TypeORM과 PostgreSQL은 버전 관리 마이그레이션으로 데이터를 보존합니다. 검증된 통합, 트랜잭션 감사, 계산 스냅샷이 지표 일관성을 뒷받침합니다.

문서의 기준 버전에서 CI는 프론트엔드 테스트 542개, 백엔드 테스트 705개, 통합 흐름 3개와 lint, 타입 검사, 빌드, 마이그레이션, SonarQube Cloud 게이트를 통과했습니다. 사이트는 12개 언어의 콘텐츠, 계약, 링크 동등성을 자동 검증합니다.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

## 기준 및 검증 {#criteria}

| 코드 | 점수 | 제공 내용 | 검증 | 제시된 근거 |
| --- | ---: | --- | --- | --- |
| GA01 | 5 | 백로그 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구조화된 백로그 |
| GA02 | 5 | 계획 및 작업량 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Project 반복 주기와 담당자 |
| GA03 | 5 | 승인 기준 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 이슈의 인수 기준 |
| GA04 | 4 | 추적 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 연결된 PR과 커밋 |
| GA05 | 3 | 점진적 제공 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| GA06 | 4 | 리뷰 및 개선 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 기록된 기술 리뷰 |
| GA07 | 3 | 완료의 정의 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 문서화된 DoD |
| GA08 | 3 | 문서 및 실행 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 버전 관리 문서 |
| GA09 | 8 | 참여 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| DW01 | 3 | 기술 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| DW02 | 5 | 연동 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| DW03 | 4 | API 및 백엔드 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| DW04 | 4 | ORM 영속성 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| DW05 | 3 | 프런트엔드 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| DW06 | 3 | 인증 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| DW07 | 3 | 컨테이너 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| TP01 | 4 | 책임 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| TP02 | 4 | 의존성 주입 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| TP03 | 4 | 타입 및 가독성 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| TP04 | 4 | 단위 테스트 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| TP05 | 4 | 검증 및 오류 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| IHC01 | 3 | 사용자 및 작업 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| IHC02 | 3 | 흐름 및 프로토타입 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 프로토타입 및 흐름 문서 |
| IHC03 | 3 | 지표 및 상태 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| IHC04 | 2 | 반응형 및 피드백 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 구현·검증됨 |
| IHC05 | 2 | 사용자 평가 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 평가 프로토콜 |
| IHC06 | 2 | 개선 및 재검증 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 기록된 인터페이스 피드백 |

## 스프린트 및 참조 버전 {#sprints}

| Sprint | 기간 | 통합 기능 |
| --- | --- | --- |
| [Sprint 1](./sprints/sprint-1) | 2026-10-05 / 2026-10-18 | 기반, 카탈로그 및 수집 |
| [Sprint 2](./sprints/sprint-2) | 2026-10-19 / 2026-11-01 | 지표, 화면 및 인증 |
| [Sprint 3](./sprints/sprint-3) | 2026-11-02 / 2026-11-15 | 기록, 분석 및 운영 개선 |

## 완료의 정의 {#done}

인수 기준, 데이터 무결성, 테스트, CI, 문서, 접근성, 리뷰가 Definition of Done을 구성합니다. 각 결과물은 버전과 검증 근거를 연결합니다.

[Definition of Done](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/definition-of-done.md)

## 참여 및 출처 {#sources}

5명 모두 3개 스프린트에 통합된 기여가 있습니다. 표는 Git 작성자와 검증 가능한 커밋을 연결하고 Project의 작업과 담당자를 제시해 제품 구축 참여를 추적할 수 있도록 합니다.

[GitHub Project](https://github.com/orgs/Seliganessecodigo/projects/2) · [Tasks](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/tasks.md) · [Git](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/historico.json)

## 품질 근거 {#quality-evidence}

코드, 자동화 테스트, 계약, 문서는 결과물의 검증 경로를 구성합니다. 상세 매트릭스, 사용성 평가 프로토콜, 기술 기록으로 흐름, 품질 기준, 프로젝트 각 영역의 근거를 확인할 수 있습니다.

[#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489) · [IHC05 / IHC06](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/usabilidade.md) · [Review](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/revisao-2026-11-22.md)
