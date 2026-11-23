# Mitwirken

Dieser Teil richtet sich an Entwicklung und Betrieb und beschreibt lokale Umgebung, Verträge und Prüfungen. Zur Produktnutzung lesen Sie das Benutzerhandbuch.

## Validierungskriterien {#workflow}

Epics, Stories und Aufgaben strukturieren das Produkt mit überprüfbaren Kriterien und Codeverweisen. Issues, Pull Requests und Commits verbinden Anforderungen, Implementierung und Tests; die versionierte Dokumentation vereint Architektur, Verträge, Betrieb und Nachweise.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Prüfungen {#quality}

CI prüft Dokumentation, Frontend-Lint/Tests/Build, Backend-Lint/Typecheck/PostgreSQL-Tests/Abdeckung/Build/Migrationen und echten integrierten Browserablauf. `TEST_DATABASE_URL` verlangt isoliertes PostgreSQL; ohne Variable überspringt Jest Datenbanksuiten, Browserintegration schlägt fehl. SonarQube für PRs nach `develop`: neue Abdeckung ≥ 80 %, Duplikation ≤ 3 %, Bewertungen A, Hotspots vollständig geprüft.

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

## Technische Dokumentation {#documentation}

Die Oberfläche verknüpft Kennzahlen mit Zeitraum, Einheit, Abdeckung und Methodik und erhält Filter sowie Navigationskontext. Lade-, Leer-, Fehler- und veraltete Datenzustände werden ausdrücklich behandelt. Tastaturbedienung, sichtbarer Fokus, Text zusätzlich zu Farbe, Mobilgeräte, Themes und 12 Sprachen gehören zur Nutzungserfahrung.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Weiterführende Seiten {#related}

[Qualität und Abnahme](./product/quality) · [Produkt-Backlog](./roadmap)

[Lieferplan und Nachweise](./plano-de-entregas)
