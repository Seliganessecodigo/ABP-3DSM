# Эксплуатация и диагностика

Основа: `origin/develop`, коммит `c343698`, проверено 08.11.2026. Среда может использовать другую ревизию; слияние не доказывает развёртывание.

Нужны Node.js 24+, npm, Docker Compose v2. Скопируйте `.env.example` в `.env`, выполните `npm run dev`. Compose применяет миграции и пробует обнаружение; сбой источника не мешает запуску API. SMTP нужен для приглашений/подтверждений. Первый Admin: `organizations:create-invitation` в `backend/`, переменные `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Универсальной производственной записи Admin нет.

```text
AUTH_JWT_SECRET
AUTH_PASSWORD_PEPPER / AUTH_PASSWORD_PEPPER_VERSION / AUTH_PASSWORD_PEPPER_KEYS
AUTH_TOTP_ENCRYPTION_KEY_VERSION / AUTH_TOTP_ENCRYPTION_KEYS
APP_BASE_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/sso/google/callback
SSO_RETURN_URL=http://localhost:5173/sso/callback
VITE_GOOGLE_SSO_ENABLED=true
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_FROM
SMTP_USER / SMTP_PASSWORD
```

Панель и экологические запросы публичны. `/login`: почта/пароль или включённый Google. Admin настраивает/подтверждает шестизначный TOTP, включая вход Google; Analyst/Visitor не получают права администратора. Сессия frontend только в памяти; перезагрузка требует входа. Backend проверяет JWT, сессию, актуальные роль и состояние: 401 для отсутствующих/неверных учётных данных, 403 для недостаточных прав. Новые маршруты защищены по умолчанию.

Admin той же организации меняет состояние между `ACTIVE`, `BLOCKED`, `DEACTIVATED`, передавая `expectedStatus` и причину. Блокировка/деактивация отзывают все сессии; активация требует нового входа. Защищены собственная запись и последний активный Admin. Конфликт ожидания — 409; уже достигнутая цель — идемпотентный успех. Общий аудит пишет успех в транзакции изменения, отказы вне отката, явно указывает субъекта и исключает секреты. Полное управление ролями и восстановление пароля этим маршрутом не предоставляются.

`MONITORING_SCHEDULE_INTERVAL_SECONDS=60`, `MONITORING_METRICS_CONCURRENCY=2`.

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

Ещё не поставлены: отдельное сравнение двух приложений, региональная симуляция, общее управление пользователями/ролями, самостоятельное восстановление пароля, глобальная настройка/пауза мониторинга и CSV. Сортировка по воздействию доступна. Квоты источников, хранение, backup/restore и эксплуатационные цели требуют решений; SLA не заявлен. Восстановление TOTP поддержкой не является сбросом пароля.

[Видение и границы](./product/vision) · [Руководство пользователя](./guide/monitoring) · [Методология и данные](./product/methodology) · [Качество и приёмка](./product/quality) · [Решения и зависимости](./product/decisions) · [Справочник API](./reference/api) · [Эксплуатация и диагностика](./operations) · [Начало работы](./getting-started) · [Архитектура](./architecture) · [Участие в разработке](./contributing) · [Бэклог продукта](./roadmap)


Зарегистрируйте в Google Cloud точный URI `GOOGLE_CALLBACK_URL`. `VITE_GOOGLE_SSO_ENABLED=true` лишь включает кнопку, не настраивает backend и не создаёт аккаунты: привязка требует приглашения. `GOOGLE_CLIENT_SECRET`, JWT, pepper, ключи TOTP — секреты backend; используйте независимые значения и храните нужные старые версии. SMTP доставляет приглашения/подтверждения. Поддержка запускает `authentication:recover-admin-totp` после независимой проверки полномочий организации; сессии отзываются, операция аудируется.

Параметры мониторинга — положительные целые; текущий Compose не передаёт эти два значения из `.env` в контейнер API автоматически: нужен environment mapping. Защита от перекрытия действует на процесс, не является распределённой блокировкой реплик. `/health` не доказывает доступность источников или вычислимость. Staging из `develop` после CI публикует API в Azure App Service, frontend в Static Web Apps и выполняет smoke test. Документация — GitHub Pages. Автовосстановления БД нет; `dev:down` сохраняет том.
