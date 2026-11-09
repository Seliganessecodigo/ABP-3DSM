# Mitwirken

Dieser Teil richtet sich an Entwicklung und Betrieb und beschreibt lokale Umgebung, Verträge und Prüfungen. Zur Produktnutzung lesen Sie das Benutzerhandbuch.

## Validierungskriterien {#workflow}

Änderungen an Umfang und Regeln halten Problem, gewünschtes Ergebnis und Abnahmekriterien in den jeweiligen Stories fest. Reviews und Nutzbarkeitstests dokumentieren Schwierigkeiten, Rückmeldungen und Verbesserungen. Aufbewahrung, Backup/Wiederherstellung, Betriebsziele und externe Quoten benötigen noch Entscheidungen.

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## Prüfungen {#quality}

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
npm run test:integration --prefix frontend
```

## Technische Dokumentation {#documentation}

Das Produkt muss Anwendungen auffindbar machen, Null von fehlenden Daten unterscheiden und Kennzahlen auf Zeitraum, Einheit, Abdeckung und Methodik zurückführen. Abfragen erhalten Navigationskontext und kennzeichnen Laden, Leere, Fehler und ältere Daten. Bewertet werden Tastatur, sichtbarer Fokus, Text zusätzlich zu Farbe, Mobilgeräte und alle 12 Sprachen.

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## Weiterführende Seiten {#related}

[Qualität und Abnahme](./product/quality) · [Produkt-Backlog](./roadmap)
