# Начало работы

Основа: `origin/develop`, коммит `c343698`, проверено 08.11.2026. Среда может использовать другую ревизию; слияние не доказывает развёртывание.

Нужны Node.js 24+, npm, Docker Compose v2. Скопируйте `.env.example` в `.env`, выполните `npm run dev`. Compose применяет миграции и пробует обнаружение; сбой источника не мешает запуску API. SMTP нужен для приглашений/подтверждений. Первый Admin: `organizations:create-invitation` в `backend/`, переменные `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Универсальной производственной записи Admin нет.

```powershell
Copy-Item .env.example .env
```

```sh
# macOS / Linux
cp .env.example .env
npm run dev
```

| HTTP | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | localhost:5432 |

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

[Видение и границы](./product/vision) · [Руководство пользователя](./guide/monitoring) · [Методология и данные](./product/methodology) · [Качество и приёмка](./product/quality) · [Решения и зависимости](./product/decisions) · [Справочник API](./reference/api) · [Эксплуатация и диагностика](./operations) · [Начало работы](./getting-started) · [Архитектура](./architecture) · [Участие в разработке](./contributing) · [Бэклог продукта](./roadmap)
