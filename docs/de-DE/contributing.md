# Mitwirken

## Arbeitsablauf

1. Issue und Akzeptanzkriterien lesen, bevor der Code geändert wird.
2. Einen Branch auf Basis von `develop` erstellen und den Umfang der Aufgabe einhalten.
3. Einen Pull Request nach `develop` mit Conventional-Commit-Titel und Referenzen auf zugehörige Issues öffnen.
4. Entscheidungen, Einschränkungen, tatsächlich ausgeführte Prüfungen und visuelle Nachweise für Änderungen an der Oberfläche beschreiben.

## Prüfungen

Die CI führt Linting, Tests und Builds für Frontend und Backend sowie das SonarQube-Cloud-Quality-Gate aus. Neue Befunde vor Abschluss des Pull Requests beheben. Nicht lokal ausgeführte Prüfungen angeben; keine nicht beobachteten Ergebnisse behaupten.

## Änderungen an der Oberfläche

Jede Seite bleibt mit ihren Styles, Hooks und Übersetzungen zusammen. Das Frontend unterstützt `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP` und `zh-CN`, `ko-KR`, `ru-RU`, `hi-IN`, `id-ID`. Neue sichtbare Texte müssen in allen zwölf Sprachen vollständig sein; Englisch ist die Fallback-Sprache.

## Änderungen an Integration oder Domäne

Verträge und Entscheidungen in Issues und technischen Dokumenten prüfen. Keine Endpunkte, Schemas, Einheiten, Umweltfaktoren oder Retry-Richtlinien erfinden. Änderungen am persistenten Schema benötigen eine Migration; Vertragsänderungen müssen OpenAPI und Dokumentation aktualisieren.

## Website-Dokumentation

Veröffentlichte Inhalte werden als Markdown in `docs/` gepflegt. Die entsprechende Seite in allen zwölf Sprachen aktualisieren und die Website mit `npm run docs:build` prüfen.

## Git

Branches: `typ/nummer-beschreibung` mit Issue, sonst `typ/beschreibung`; kleingeschriebenes kebab-case ohne Akzente. Commits/PR-Titel: `typ(bereich): beschreibung`, Beschreibung portugiesisch, mit Verb und ohne Schlusspunkt. `Refs #N`, Entscheidungen/Grenzen, beobachtete Checks angeben. Vollständiger Standard in [AGENTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/AGENTS.md).

[Qualität und Abnahme](./product/quality) · [Entscheidungen und Abhängigkeiten](./product/decisions)

## CI

CI prüft Dokumentation, Frontend-Lint/Tests/Build, Backend-Lint/Typecheck/PostgreSQL-Tests/Abdeckung/Build/Migrationen und echten integrierten Browserablauf. `TEST_DATABASE_URL` verlangt isoliertes PostgreSQL; ohne Variable überspringt Jest Datenbanksuiten, Browserintegration schlägt fehl. SonarQube für PRs nach `develop`: neue Abdeckung ≥ 80 %, Duplikation ≤ 3 %, Bewertungen A, Hotspots vollständig geprüft. Kein Ersatz für Usability/Produktabnahme.

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
