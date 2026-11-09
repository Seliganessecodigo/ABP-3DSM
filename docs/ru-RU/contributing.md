# Участие в разработке

Эта часть для разработки и эксплуатации: локальная среда, контракты и проверки. Для использования продукта читайте руководство пользователя.

## Критерии проверки {#workflow}

Изменения объёма и правил фиксируют проблему, ожидаемый результат и критерии приёмки в соответствующих историях. Обзоры и оценка удобства записывают трудности, отзывы и улучшения. Хранение данных, резервирование/восстановление, эксплуатационные цели и внешние квоты требуют решений.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Проверки {#quality}

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
npm run test:integration --prefix frontend
```

## Техническая документация {#documentation}

Продукт должен позволять найти приложение, отличить ноль от отсутствия и связать показатель с периодом, единицей, покрытием и методом. Запросы сохраняют контекст переходов и сообщают о загрузке, пустоте, ошибках и старых данных. Оценка включает клавиатуру, видимый фокус, текст помимо цвета, мобильные устройства и 12 языков.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Связанные страницы {#related}

[Качество и приёмка](./product/quality) · [Бэклог продукта](./roadmap)
