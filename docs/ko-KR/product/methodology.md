# 방법론과 데이터

기준: `origin/develop`, 커밋 `c343698`, 2026-11-08 확인. 환경마다 버전이 다를 수 있으며 병합이 배포를 증명하지 않습니다.

모델은 `simplified-energy` 버전 `1`입니다. CPU 100%는 100 W, 메모리 0.375 W/GB, 디스크 0.01 W/GB, 네트워크 0.02 W/GB입니다. 단순화한 매개변수이며 전력 실측/공식 지역 계수라는 주장이 아닙니다. 전력은 합계, 에너지 = W × 시간 / 1000, CO₂e[g] = kWh × gCO₂e/kWh입니다. 스냅샷은 방법/계수를 보존하며 현재 계수로 미리보기해도 원본을 수정하지 않습니다.

조회는 시간대가 명시된 RFC 3339 `from`, `to`를 요구하며 `[from,to)`를 UTC로 정규화합니다. 집계 단위 `hour`, `day`, `month`, `year`, 최대 10,000포인트. 저장값은 중첩 시간 비율로 배분하며 재계산하지 않습니다. 최신 `collectedAt`, 동률이면 ID 사전순이 우선하며 무효한 승자에서 이전 값으로 대체하지 않습니다. 에너지/CO₂e 커버리지는 별도입니다. `null`은 누락, 0은 유효할 수 있습니다. 원본 지표에 측정 시각이 없어 수신 시각에서 `collection_interval_seconds`를 빼서 구간을 구합니다. 계수 조회 시각은 유효기간이 아닙니다. 에너지/계수/배출량은 소수 8자리, 커버리지는 4자리로 저장합니다.

`/administration/calculations`에서 앱과 날짜를 골라 원본/미리보기를 비교합니다. 종료일은 UTC 하루 전체를 포함하며 API는 `[from,to)`를 받습니다. 공개 작업으로 현재 모델과 과거 지역의 현재 계수를 사용하고 저장하지 않습니다. 한도는 30일, 관측 10,000개입니다. `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`)를 반환합니다. 계수 실패 시 계산 가능한 에너지는 보존하고 CO₂e는 미제공합니다. 백분율은 같은 단위/커버리지와 양수 기준이 필요합니다.

`/methodology`는 에너지, 배출량, 커버리지, 분석 탭과 예제/개인 설정을 제공합니다. 로그인한 모든 역할이 자신의 탭만 저장하며 낙관적 버전 충돌은 409입니다. 표시 임계값은 전역 설정·계산·외부 알림을 바꾸지 않습니다. 저장된 기간/집계 단위는 상세 URL에 값이 없을 때만 적용합니다. 기록된 방법론은 `/services/:id/methodology`와 선택한 `collectionId`로 조회합니다.

[비전과 범위](../product/vision) · [사용 안내](../guide/monitoring) · [방법론과 데이터](../product/methodology) · [품질과 인수 기준](../product/quality) · [결정과 의존성](../product/decisions) · [API 참조](../reference/api) · [운영과 진단](../operations) · [시작하기](../getting-started) · [아키텍처](../architecture) · [기여 안내](../contributing) · [제품 백로그](../roadmap)
