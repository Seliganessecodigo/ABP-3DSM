# Архитектура

Основа: `origin/develop`, коммит `c343698`, проверено 08.11.2026. Среда может использовать другую ревизию; слияние не доказывает развёртывание.

React 19/TypeScript/Vite отображает; NestJS/TypeORM/PostgreSQL 18 интегрирует и сохраняет. Только backend обращается к вспомогательным источникам. Controller — транспорт, service — сценарии, adapter — проверка, repository — хранение. Глобальные guards и исключения `PublicRoute`. Настройки разделены по пользователям; аудит в `backend/src/shared/audit/`, успешная запись транзакционна.

Каталог/подробности сохраняют идентичность, расположение, метрики и время. Поиск по имени/ID/региону, состояние и страница в URL. Опрос через 60 секунд после попытки независим от сбора backend. После ошибки сохраняются прежние данные/время. `AVAILABLE`, `UNAVAILABLE`, `NO_METRICS`, `REMOVED` не означают расход; отсутствие/ошибка/stale не равны нулю. Город nullable. Инцидент восстанавливается после трёх корректных наблюдений; сбой источника не подтверждает удаление.

Модель `simplified-energy`, версия `1`: CPU 100% — 100 W, память 0,375 W/GB, диск 0,01 W/GB, сеть 0,02 W/GB. Это упрощённые параметры, не измерение электричества и не официальные региональные факторы. Мощность суммируется; энергия = W × часы / 1000; CO₂e[g] = kWh × gCO₂e/kWh. Снимки хранят метод/фактор; предпросмотр с текущими факторами не меняет оригиналы.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

[Видение и границы](./product/vision) · [Руководство пользователя](./guide/monitoring) · [Методология и данные](./product/methodology) · [Качество и приёмка](./product/quality) · [Решения и зависимости](./product/decisions) · [Справочник API](./reference/api) · [Эксплуатация и диагностика](./operations) · [Начало работы](./getting-started) · [Архитектура](./architecture) · [Участие в разработке](./contributing) · [Бэклог продукта](./roadmap)
