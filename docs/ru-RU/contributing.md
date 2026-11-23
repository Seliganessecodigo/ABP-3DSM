# Участие в разработке

Эта часть для разработки и эксплуатации: локальная среда, контракты и проверки. Для использования продукта читайте руководство пользователя.

## Критерии проверки {#workflow}

Эпики, истории и задачи организуют продукт с проверяемыми критериями и ссылками на код. Issues, pull requests и коммиты связывают требования, реализацию и тесты; версионируемая документация объединяет архитектуру, контракты, эксплуатацию и доказательства.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Проверки {#quality}

CI проверяет сборку документации, lint/тесты/сборку frontend, lint/typecheck/тесты PostgreSQL/покрытие/сборку/миграции backend и реальный интегрированный поток браузера. `TEST_DATABASE_URL` — только изолированный PostgreSQL; без неё Jest пропускает БД, браузерная интеграция падает. SonarQube для PR в `develop`: новое покрытие ≥80%, дублирование ≤3%, оценки A, все hotspots проверены.

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

Интерфейс связывает показатели с периодом, единицей, покрытием и методологией, сохраняя фильтры и контекст навигации. Загрузка, пустые результаты, ошибки и устаревшие данные обрабатываются явно. Клавиатура, видимый фокус, текст в дополнение к цвету, мобильные устройства, темы и 12 языков входят в пользовательский опыт.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Связанные страницы {#related}

[Качество и приёмка](./product/quality) · [Бэклог продукта](./roadmap)

[План поставки и доказательства](./plano-de-entregas)
