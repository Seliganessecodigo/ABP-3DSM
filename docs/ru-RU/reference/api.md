# Справочник API

Основа: `origin/develop`, коммит `c343698`, проверено 08.11.2026. Среда может использовать другую ревизию; слияние не доказывает развёртывание.

Swagger: `http://localhost:3000/docs`; schema: `/openapi.json`.

| HTTP | URI | JWT / credential |
| --- | --- | --- |
| GET | `/health` | — |
| GET | `/applications` | — |
| GET | `/applications/{id}` | — |
| GET | `/applications/{id}/collections/latest` | — |
| GET | `/applications/{id}/collections/{collectionId}` | — |
| GET | `/applications/{id}/analysis` | — |
| GET | `/applications/{id}/analysis/series` | — |
| GET | `/applications/{id}/analysis/series/contributions` | — |
| GET | `/analysis/summary` | — |
| GET | `/monitoring/incidents` | — |
| GET | `/carbon/regions` | — |
| GET | `/carbon/regions/{code}/intensity` | — |
| POST | `/applications/{id}/analysis/recalculation-preview` | — |
| POST | `/auth/login` | email + password |
| GET | `/auth/sso/google` | PKCE |
| GET | `/auth/sso/google/callback` | state + cookie |
| POST | `/auth/sso/handoff/exchange` | code + PKCE |
| POST | `/auth/totp/setup` | setupToken |
| POST | `/auth/totp/setup/confirm` | setupToken + TOTP |
| POST | `/auth/totp/challenge` | challengeToken + TOTP |
| POST | `/auth/sessions/refresh` | refreshToken |
| POST | `/auth/invitations/accept` | token |
| POST | `/auth/email/confirm` | token + password |
| POST | `/auth/email/confirmation/resend` | organization + email |
| GET | `/auth/me` | JWT |
| POST | `/auth/sessions/logout` | JWT |
| POST | `/auth/totp/replacement` | JWT + password + TOTP |
| POST | `/auth/totp/replacement/confirm` | JWT + confirmationToken + TOTP |
| GET | `/me/preferences` | JWT |
| PUT | `/me/preferences/{tab}` | JWT |
| POST | `/auth/sso/invitations` | JWT + ADMIN |
| DELETE | `/auth/sso/identities/{userId}` | JWT + ADMIN |
| PATCH | `/auth/users/{userId}/status` | JWT + ADMIN |

Нужны `from`, `to` RFC 3339 с явным поясом; `[from,to)` нормализуется в UTC. Гранулярность: `hour`, `day`, `month`, `year`, до 10 000 точек. Сохранённые значения распределяются по пересечению без пересчёта: побеждает новейший `collectedAt`, при равенстве — ID по возрастанию. Неверный победитель не заменяется прежним. Покрытие энергии/CO₂e раздельное. `null` — отсутствие, ноль может быть корректным. У источника метрик нет времени измерения: интервал получен из времени приёма минус `collection_interval_seconds`. Время запроса фактора не доказывает срок действия. Энергия/фактор/выбросы хранят 8 знаков, покрытие 4.

В `/administration/calculations` выберите приложение и даты, сравните оригинал/предпросмотр. Конечная дата включает весь день UTC; API принимает `[from,to)`. Публичный предпросмотр использует текущую модель и текущие коэффициенты исторических регионов, ничего не сохраняет. Лимиты: 30 дней, 10 000 наблюдений. Ответ: `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Ошибка коэффициента сохраняет вычислимую энергию, CO₂e недоступен. Проценты требуют равных единиц/покрытия и положительной базы.

`/methodology` содержит вкладки энергии, выбросов, покрытия и анализа с примерами/личными настройками. Любая авторизованная роль сохраняет только свои вкладки с оптимистической ревизией; конфликт — 409. Пороги отображения не меняют общие настройки, расчёты или внешние уведомления. Период/детализация подставляются лишь при отсутствии параметров URL. Историческая методология: `/services/:id/methodology`, с выбранным `collectionId`.

Admin той же организации меняет состояние между `ACTIVE`, `BLOCKED`, `DEACTIVATED`, передавая `expectedStatus` и причину. Блокировка/деактивация отзывают все сессии; активация требует нового входа. Защищены собственная запись и последний активный Admin. Конфликт ожидания — 409; уже достигнутая цель — идемпотентный успех. Общий аудит пишет успех в транзакции изменения, отказы вне отката, явно указывает субъекта и исключает секреты. Полное управление ролями и восстановление пароля этим маршрутом не предоставляются.

`GET /analysis/summary`: `from`, `to`; `states`, `regionCodes`, `applicationIds`. `/monitoring/incidents`: `applicationId`, `source`, `integration`, `status`, `page`, `limit` → `{items,total,page,limit}`. `series/contributions`: `bucketStart`, `page`, `pageSize` (5/10/15/20/all).

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

[Видение и границы](../product/vision) · [Руководство пользователя](../guide/monitoring) · [Методология и данные](../product/methodology) · [Качество и приёмка](../product/quality) · [Решения и зависимости](../product/decisions) · [Справочник API](../reference/api) · [Эксплуатация и диагностика](../operations) · [Начало работы](../getting-started) · [Архитектура](../architecture) · [Участие в разработке](../contributing) · [Бэклог продукта](../roadmap)


```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example administrative action" }
```

`PATCH /auth/users/{userId}/status`: `400`, `401`, `403`, `404`, `409`.

`POST /applications/{id}/analysis/recalculation-preview`: `400 RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED`, `400 RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED`, `503 APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE`.

`GET /me/preferences`: `energy`, `emissions`, `coverage`, `analysis` → `null` / `{ value, revision, updatedAt }`. `PUT /me/preferences/{tab}`: `{ expectedRevision, value }`. `expectedRevision: 0` → create. `400 INVALID_PREFERENCE`, `409 PREFERENCE_CONFLICT`, `503 PREFERENCES_UNAVAILABLE`.

| tab | value |
| --- | --- |
| energy | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled}`; 0–100 |
| analysis | `{periodDays: 7 / 30, granularity: "hour" / "day"}` |
