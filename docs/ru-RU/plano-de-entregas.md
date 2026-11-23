# План поставки и доказательства

Результаты GreenER объединяют функциональную широту, программную инженерию и прослеживаемость экологических данных. Документ представляет реализованные возможности, доказательства по 27 критериям рубрики и вклад пяти участников в трёх спринтах со ссылками на код, тесты и документацию.

`2026-11-22` · `America/Sao_Paulo` · `240a2c26ecd2eb1b0adc184f4efe01799bab8a50`

## Интегрированный продукт и инженерия {#engineering}

React 19 и TypeScript обеспечивают интерфейс; NestJS организует API в модули и слои с внедрением зависимостей; TypeORM и PostgreSQL сохраняют данные через версионируемые миграции. Проверяемые интеграции, транзакционный аудит и снимки расчётов поддерживают согласованность показателей.

Для документированной базовой версии CI успешно выполнила 542 теста frontend, 705 тестов backend и три интегрированных сценария, а также lint, проверку типов, сборки, миграции и gate SonarQube Cloud. Сайт предлагает 12 языков с автоматической проверкой эквивалентности содержания, контрактов и ссылок.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

## Критерии и проверка {#criteria}

| Код | Баллы | Результат | Проверка | Представленное доказательство |
| --- | ---: | --- | --- | --- |
| GA01 | 5 | Бэклог | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Структурированный бэклог |
| GA02 | 5 | Планирование и ресурсы | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Итерации и ответственные в Project |
| GA03 | 5 | Критерии приёмки | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Критерии в issues |
| GA04 | 4 | Отслеживание | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Связанные PR и коммиты |
| GA05 | 3 | Инкременты | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| GA06 | 4 | Обзор и адаптация | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Записанные технические проверки |
| GA07 | 3 | Определение готовности | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Документированная DoD |
| GA08 | 3 | Документация и запуск | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Версионируемая документация |
| GA09 | 8 | Участие | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| DW01 | 3 | Технологии | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| DW02 | 5 | Интеграции | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| DW03 | 4 | API и бэкенд | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| DW04 | 4 | Хранение через ORM | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| DW05 | 3 | Фронтенд | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| DW06 | 3 | Аутентификация | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| DW07 | 3 | Контейнеры | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| TP01 | 4 | Ответственность | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| TP02 | 4 | Внедрение зависимостей | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| TP03 | 4 | Типы и читаемость | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| TP04 | 4 | Модульные тесты | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| TP05 | 4 | Проверка и сбои | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| IHC01 | 3 | Пользователи и задачи | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| IHC02 | 3 | Потоки и прототипы | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Документированные прототипы и сценарии |
| IHC03 | 3 | Показатели и состояния | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| IHC04 | 2 | Адаптивность и обратная связь | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Реализовано/проверено |
| IHC05 | 2 | Оценка пользователями | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Протокол оценки |
| IHC06 | 2 | Улучшения и повторная проверка | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Записанная обратная связь по интерфейсу |

## Спринты и версии {#sprints}

| Sprint | Период | Интегрированные возможности |
| --- | --- | --- |
| [Sprint 1](./sprints/sprint-1) | 2026-10-05 / 2026-10-18 | Основа, каталог и сбор |
| [Sprint 2](./sprints/sprint-2) | 2026-10-19 / 2026-11-01 | Показатели, интерфейс и аутентификация |
| [Sprint 3](./sprints/sprint-3) | 2026-11-02 / 2026-11-15 | История, анализ и развитие эксплуатации |

## Определение готовности {#done}

Критерии приёмки, целостность данных, тесты, CI, документация, доступность и ревью составляют Definition of Done. Каждый результат связывает свою версию с доказательствами проверки.

[Definition of Done](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/definition-of-done.md)

## Участие и источники {#sources}

Все пять участников имеют интегрированные вклады в трёх спринтах. Таблицы связывают авторство Git с проверяемыми коммитами и показывают задачи и ответственных в Project, обеспечивая прослеживаемость участия в создании продукта.

[GitHub Project](https://github.com/orgs/Seliganessecodigo/projects/2) · [Tasks](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/tasks.md) · [Git](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/historico.json)

## Доказательства качества {#quality-evidence}

Код, автоматические тесты, контракты и документация образуют цепочку проверки результатов. Подробная матрица, протокол оценки удобства и технические записи позволяют изучить процессы, критерии качества и доказательства по каждому направлению проекта.

[#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489) · [IHC05 / IHC06](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/usabilidade.md) · [Review](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/revisao-2026-11-22.md)
