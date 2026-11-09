# Начало работы

Эта часть для разработки и эксплуатации: локальная среда, контракты и проверки. Для использования продукта читайте руководство пользователя.

## Настройка {#requirements}

Нужны Node.js 24+, npm, Docker Compose v2. Скопируйте `.env.example` в `.env`, выполните `npm run dev`. Compose применяет миграции и пробует обнаружение; сбой источника не мешает запуску API. SMTP нужен для приглашений/подтверждений. Первый Admin: `organizations:create-invitation` в `backend/`, переменные `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Универсальной производственной записи Admin нет.

## С чего начать {#start}

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

```powershell
Copy-Item .env.example .env
```

```sh
cp .env.example .env
```

```sh
npm run dev
```

| Функция | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5432` |

## Настройка {#commands}

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

## Связанные страницы {#related}

[Руководство пользователя](./guide/monitoring) · [Эксплуатация и диагностика](./operations)
