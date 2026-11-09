# Справочник API

Справочник интеграции GreenER API. Полные типы, необязательные поля и лимиты в `/openapi.json`, Swagger в `/docs`. Каталог/история читают сохранённые данные. Предпросмотр и углеродные маршруты могут запрашивать источник интенсивности.

## Публичные запросы {#public}

| HTTP | URI | Доступ |
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

## Периоды и история {#queries}

`from`, `to` требуют RFC 3339 с явным поясом; `[from,to)` нормализуется UTC. `hour`, `day`, `month`, `year`, до 10 000 точек, превышение отклоняется. Сохранённые значения распределяются по пересечению. Побеждает новейший `collectedAt`, затем ID по возрастанию; без возврата к прежним данным, если победитель не поддерживает метрику.

| URI | Параметр |
| --- | --- |
| `/applications/{id}/analysis` | `from`, `to` |
| `/applications/{id}/analysis/series` | `from`, `to`, `granularity` |
| `/applications/{id}/analysis/series/contributions` | `from`, `to`, `granularity`, `bucketStart`, `page`, `pageSize` (5/10/15/20/all) |
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds`, `granularity` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

Источник метрик не даёт время измерения; интервал — приём минус `collection_interval_seconds`. Время запроса фактора не определяет срок действия; неопубликованные источник/валидность неизвестны. Энергия/фактор/выбросы: 8 десятичных знаков, покрытие 4, без промежуточного округления. Сохраняются раздельные покрытия и исходные снимки.

## Временной ряд и объяснение расчёта {#environmental-presentation}

В `/analysis/summary` необязательный параметр `granularity` добавляет `series.points` с теми же периодом и фильтрами, что и итоги. Каждый интервал суммирует сохранённые результаты приложений и сохраняет независимое покрытие. Отсутствующие значения остаются `null`.

В `/applications/{id}/analysis` поле `calculation.energyKwh` содержит энергию сегментов с рассчитанными выбросами; `calculation.intensity` — эквивалентный коэффициент в gCO₂e/kWh, полученный делением этих выбросов на соответствующую энергию. При нулевой или отсутствующей энергии коэффициент остаётся неопределённым. Исторические результаты и коэффициенты сохраняются.

## Войти {#login}

Панель и экологические запросы публичны. `/login`: почта/пароль или включённый Google. Admin настраивает/подтверждает шестизначный TOTP, включая вход Google; Analyst/Visitor не получают права администратора. Сессия frontend только в памяти; перезагрузка требует входа. Backend проверяет JWT, сессию, актуальные роль и состояние: 401 для отсутствующих/неверных учётных данных, 403 для недостаточных прав. Новые маршруты защищены по умолчанию.

| HTTP | URI | Доступ |
| --- | --- | --- |
| POST | `/auth/login` | `email + password` |
| GET | `/auth/sso/google` | `PKCE` |
| GET | `/auth/sso/google/callback` | `state + cookie` |
| POST | `/auth/sso/handoff/exchange` | `code + PKCE` |
| POST | `/auth/totp/setup` | `setupToken` |
| POST | `/auth/totp/setup/confirm` | `setupToken + TOTP` |
| POST | `/auth/totp/challenge` | `challengeToken + TOTP` |
| POST | `/auth/sessions/refresh` | `refreshToken` |
| POST | `/auth/invitations/accept` | `token` |
| POST | `/auth/email/confirm` | `token + password` |
| POST | `/auth/email/confirmation/resend` | `organization + email` |

## Защищённые операции {#protected}

| HTTP | URI | Доступ |
| --- | --- | --- |
| GET | `/auth/me` | `JWT` |
| POST | `/auth/sessions/logout` | `JWT` |
| POST | `/auth/totp/replacement` | `JWT + password + TOTP` |
| POST | `/auth/totp/replacement/confirm` | `JWT + confirmationToken + TOTP` |
| GET | `/me/preferences` | `JWT` |
| PUT | `/me/preferences/{tab}` | `JWT` |
| POST | `/auth/sso/invitations` | `JWT + ADMIN` |
| DELETE | `/auth/sso/identities/{userId}` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/status` | `JWT + ADMIN` |
| GET | `/auth/users` | `JWT + ADMIN` |
| POST | `/auth/users` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/role` | `JWT + ADMIN` |

Admin той же организации меняет состояние между `ACTIVE`, `BLOCKED`, `DEACTIVATED`, передавая `expectedStatus` и причину. Блокировка/деактивация отзывают все сессии; активация требует нового входа. Защищены собственная запись и последний активный Admin. Конфликт ожидания — 409; уже достигнутая цель — идемпотентный успех. Общий аудит пишет успех в транзакции изменения, отказы вне отката, явно указывает субъекта и исключает секреты. Полное управление ролями и восстановление пароля этим маршрутом не предоставляются.

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## Управление учётными записями через API {#accounts}

Только активный Admin той же организации может просматривать и создавать учётные записи или менять роли. При создании передаются `name`, `email`, `role` и `reason`, без пароля и автоматического подтверждения почты. Владелец задаёт пароль в существующем процессе подтверждения; отправка письма запрашивается отдельно. Экран управления и восстановление пароля остаются отдельными задачами.

Поиск и фильтры применяются до сортировки и разбиения на страницы. По умолчанию выводится 10 записей; доступны 5, 10, 15, 20 и `all` для полного отфильтрованного набора. Переведённые названия нужно преобразовывать в коды перечислений, а местные даты — в RFC 3339 со смещением часового пояса. Пропуски находятся в конце при обоих направлениях сортировки; равные значения упорядочиваются по идентификатору.

Изменение роли требует `expectedRole` и `reason`. Оно отзывает сеансы и временные учётные данные TOTP, сохраняет аудит и запрещает лишать доступа себя или последнего активного Admin с подтверждённой почтой. Неподтверждённые записи не заменяют этого администратора. Назначение Admin сохраняет обязательность TOTP.

## Сравнить с предпросмотром пересчёта {#preview}

В `/administration/calculations` выберите приложение и даты, сравните оригинал/предпросмотр. Конечная дата включает весь день UTC; API принимает `[from,to)`. Публичный предпросмотр использует текущую модель и текущие коэффициенты исторических регионов, ничего не сохраняет. Лимиты: 30 дней, 10 000 наблюдений. Ответ: `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Ошибка коэффициента сохраняет вычислимую энергию, CO₂e недоступен. Проценты требуют равных единиц/покрытия и положительной базы.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## Настроить анализ {#preferences}

`/methodology` содержит вкладки энергии, выбросов, покрытия и анализа с примерами/личными настройками. Любая авторизованная роль сохраняет только свои вкладки с оптимистической ревизией; конфликт — 409. Пороги отображения не меняют общие настройки, расчёты или внешние уведомления. Период/детализация подставляются лишь при отсутствии параметров URL. Историческая методология: `/services/:id/methodology`, с выбранным `collectionId`.

```text
GET /me/preferences → { energy, emissions, coverage, analysis }
null | { value, revision, updatedAt }
PUT /me/preferences/{tab} ← { expectedRevision, value }
expectedRevision: 0 → create
threshold ≥ 0; finite number; thresholdPercent: 0–100
unknown fields / partial bodies / numeric strings → 400
```

| tab | value |
| --- | --- |
| energy | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled}`; 0–100 |
| analysis | `{periodDays: 7 / 30, granularity: "hour" / "day"}` |

## Обработка ошибок {#errors}

Обрабатывайте HTTP-статус и структурированные коды, не используйте текст как контракт перевода. `null` — отсутствие, не ноль. Пустой список допустим и отличается от ошибки. Коды рассматриваются в контексте операции.

| HTTP | Код |
| --- | --- |
| 400 | `INVALID_ANALYSIS_PERIOD` |
| 404 | `APPLICATION_NOT_FOUND / COLLECTION_NOT_FOUND` |
| 503 | `CATALOG_UNAVAILABLE / APPLICATION_EVIDENCE_UNAVAILABLE / APPLICATION_ANALYSIS_UNAVAILABLE` |
| 400 | `RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED / RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED` |
| 503 | `APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE` |
| 400 / 409 / 503 | `INVALID_PREFERENCE / PREFERENCE_CONFLICT / PREFERENCES_UNAVAILABLE` |

## Контракт HTTP {#contracts}

[AUTHORIZATION_MATRIX.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [EXTERNAL_API_CONTRACTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) · [preferences/README.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md)

## Связанные страницы {#related}

[Эксплуатация и диагностика](../operations) · [Методология и данные](../product/methodology)
