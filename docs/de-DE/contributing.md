# Mitwirken

## Arbeitsablauf

1. Issue und Akzeptanzkriterien lesen, bevor der Code geändert wird.
2. Einen Branch auf Basis von `develop` erstellen und den Umfang der Aufgabe einhalten.
3. Einen Pull Request nach `develop` mit Conventional-Commit-Titel und Referenzen auf zugehörige Issues öffnen.
4. Entscheidungen, Einschränkungen, tatsächlich ausgeführte Prüfungen und visuelle Nachweise für Änderungen an der Oberfläche beschreiben.

## Prüfungen

Die CI führt Linting, Tests und Builds für Frontend und Backend sowie das SonarQube-Cloud-Quality-Gate aus. Neue Befunde vor Abschluss des Pull Requests beheben. Nicht lokal ausgeführte Prüfungen angeben; keine nicht beobachteten Ergebnisse behaupten.

## Änderungen an der Oberfläche

Jede Seite bleibt mit ihren Styles, Hooks und Übersetzungen zusammen. Das Frontend unterstützt `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP` und `zh-CN`. Neue sichtbare Texte müssen in allen acht Sprachen vollständig sein; Englisch ist die Fallback-Sprache.

## Änderungen an Integration oder Domäne

Verträge und Entscheidungen in Issues und technischen Dokumenten prüfen. Keine Endpunkte, Schemas, Einheiten, Umweltfaktoren oder Retry-Richtlinien erfinden. Änderungen am persistenten Schema benötigen eine Migration; Vertragsänderungen müssen OpenAPI und Dokumentation aktualisieren.

## Website-Dokumentation

Veröffentlichte Inhalte werden als Markdown in `docs/` gepflegt. Die entsprechende Seite in allen acht Sprachen aktualisieren und die Website mit `npm run docs:build` prüfen.
