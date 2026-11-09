# Участие в разработке

Основа: `origin/develop`, коммит `c343698`, проверено 08.11.2026. Среда может использовать другую ревизию; слияние не доказывает развёртывание.

Issues — приёмка/зависимости; Projects — приоритет/Sprint; Figma — визуальная задумка; код/OpenAPI — реальные контракты. Долговременные решения — в ADR. Открытие PR не закрывает issue: подтвердите merge/объём. Исторические ADR сохраняются.

`develop` → `tipo/numero-descricao` / `tipo/descricao` → PR `develop`. Conventional Commits: `tipo(escopo): descrição`; `Refs #N`.

GreenER отслеживает приложения и оценивает энергию и CO₂e. Доступны каталог, панель, подробности, история, предпросмотр пересчёта, методология и вход. Интерфейс и документация поддерживают 12 языков: `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP`, `zh-CN`, `ko-KR`, `ru-RU`, `hi-IN`, `id-ID`. Резервный язык frontend — английский.

CI проверяет сборку документации, lint/тесты/сборку frontend, lint/typecheck/тесты PostgreSQL/покрытие/сборку/миграции backend и реальный интегрированный поток браузера. `TEST_DATABASE_URL` — только изолированный PostgreSQL; без неё Jest пропускает БД, браузерная интеграция падает. SonarQube для PR в `develop`: новое покрытие ≥80%, дублирование ≤3%, оценки A, все hotspots проверены. Автоматизация не заменяет оценку удобства и приёмку продукта.

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

[Видение и границы](./product/vision) · [Руководство пользователя](./guide/monitoring) · [Методология и данные](./product/methodology) · [Качество и приёмка](./product/quality) · [Решения и зависимости](./product/decisions) · [Справочник API](./reference/api) · [Эксплуатация и диагностика](./operations) · [Начало работы](./getting-started) · [Архитектура](./architecture) · [Участие в разработке](./contributing) · [Бэклог продукта](./roadmap)
