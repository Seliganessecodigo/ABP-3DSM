# Lieferplan und Nachweise

Die GreenER-Lieferungen verbinden funktionalen Umfang, Softwareentwicklung und ökologische Rückverfolgbarkeit. Dieses Dokument zeigt implementierte Fähigkeiten, Nachweise für die 27 Bewertungskriterien und Beiträge aller fünf Mitglieder in drei Sprints mit Links zu Code, Tests und Dokumentation.

`2026-11-22` · `America/Sao_Paulo` · `240a2c26ecd2eb1b0adc184f4efe01799bab8a50`

## Integriertes Produkt und Entwicklung {#engineering}

React 19 und TypeScript tragen die Oberfläche; NestJS gliedert die API mit Dependency Injection in Module und Schichten; TypeORM und PostgreSQL erhalten Daten durch versionierte Migrationen. Validierte Integrationen, transaktionale Auditierung und Berechnungssnapshots stützen konsistente Kennzahlen.

Für die dokumentierte Basis bestand die CI 542 Frontend-Tests, 705 Backend-Tests und drei integrierte Abläufe sowie Lint, Typprüfung, Builds, Migrationen und das SonarQube-Cloud-Gate. Die Website bietet 12 Sprachen mit automatischer Prüfung gleicher Inhalte, Verträge und Links.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

## Kriterien und Prüfung {#criteria}

| Code | Punkte | Lieferung | Prüfung | Vorliegender Nachweis |
| --- | ---: | --- | --- | --- |
| GA01 | 5 | Backlog | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Strukturierter Backlog |
| GA02 | 5 | Planung und Kapazität | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Project-Iterationen und Zuständige |
| GA03 | 5 | Abnahmekriterien | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Kriterien in Issues |
| GA04 | 4 | Nachverfolgung | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Verknüpfte PRs und Commits |
| GA05 | 3 | Inkremente | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| GA06 | 4 | Review und Anpassung | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Dokumentierte technische Reviews |
| GA07 | 3 | Fertigstellungsdefinition | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Dokumentierte DoD |
| GA08 | 3 | Dokumentation und Ausführung | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Versionierte Dokumentation |
| GA09 | 8 | Beteiligung | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| DW01 | 3 | Technologien | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| DW02 | 5 | Integrationen | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| DW03 | 4 | API und Backend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| DW04 | 4 | ORM-Persistenz | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| DW05 | 3 | Frontend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| DW06 | 3 | Authentifizierung | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| DW07 | 3 | Container | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| TP01 | 4 | Verantwortlichkeiten | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| TP02 | 4 | Abhängigkeitsinjektion | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| TP03 | 4 | Typen und Lesbarkeit | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| TP04 | 4 | Unit-Tests | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| TP05 | 4 | Validierung und Fehler | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| IHC01 | 3 | Nutzer und Aufgaben | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| IHC02 | 3 | Abläufe und Prototypen | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Dokumentierte Prototypen und Abläufe |
| IHC03 | 3 | Indikatoren und Zustände | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| IHC04 | 2 | Anpassung und Rückmeldung | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementiert/geprüft |
| IHC05 | 2 | Nutzerevaluation | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Evaluierungsprotokoll |
| IHC06 | 2 | Verbesserung und Wiederholung | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Dokumentiertes Oberflächenfeedback |

## Sprints und Referenzen {#sprints}

| Sprint | Zeitraum | Integrierte Fähigkeiten |
| --- | --- | --- |
| [Sprint 1](./sprints/sprint-1) | 2026-10-05 / 2026-10-18 | Grundlagen, Katalog und Erfassung |
| [Sprint 2](./sprints/sprint-2) | 2026-10-19 / 2026-11-01 | Indikatoren, Oberfläche und Authentifizierung |
| [Sprint 3](./sprints/sprint-3) | 2026-11-02 / 2026-11-15 | Verlauf, Analyse und betriebliche Entwicklung |

## Fertigstellungsdefinition {#done}

Abnahmekriterien, Datenintegrität, Tests, CI, Dokumentation, Barrierefreiheit und Review bilden die Definition of Done. Jede Lieferung verknüpft ihre Version mit Prüfungsnachweisen.

[Definition of Done](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/definition-of-done.md)

## Beteiligung und Quellen {#sources}

Alle fünf Mitglieder haben integrierte Beiträge in den drei Sprints. Die Tabellen verbinden Git-Autoren mit überprüfbaren Commits und zeigen Aufgaben und Zuständige im Project; so wird die Beteiligung an der Produktentwicklung nachvollziehbar.

[GitHub Project](https://github.com/orgs/Seliganessecodigo/projects/2) · [Tasks](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/tasks.md) · [Git](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/historico.json)

## Qualitätsnachweise {#quality-evidence}

Code, automatisierte Tests, Verträge und Dokumentation bilden eine Nachweiskette der Lieferungen. Die detaillierte Matrix, das Usability-Protokoll und technische Unterlagen ermöglichen die Prüfung von Abläufen, Qualitätskriterien und Nachweisen jeder Projektdimension.

[#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489) · [IHC05 / IHC06](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/usabilidade.md) · [Review](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/revisao-2026-11-22.md)
