# Qualität und Abnahme

Die Oberfläche verknüpft Kennzahlen mit Zeitraum, Einheit, Abdeckung und Methodik und erhält Filter sowie Navigationskontext. Lade-, Leer-, Fehler- und veraltete Datenzustände werden ausdrücklich behandelt. Tastaturbedienung, sichtbarer Fokus, Text zusätzlich zu Farbe, Mobilgeräte, Themes und 12 Sprachen gehören zur Nutzungserfahrung.

## Abnahmekriterien {#acceptance}

| Regel | Bedeutung |
| --- | --- |
| Erhaltener Verlauf | Einstellungen und Vorschauen ersetzen keine Originalergebnisse. |
| Explizite Lücken | Fehler, fehlende Metriken und ältere Daten bleiben von Null unterscheidbar. |
| Öffentliche Abfrage | Kennzahlen lesen ist öffentlich; Einstellungen speichern und Konten verwalten verlangt Berechtigung. |

## Daten verstehen {#integrity}

Nullverbrauch bedeutet, dass eine gültige Beobachtung diesen Wert belegt. Eine Lücke bedeutet fehlende nutzbare Daten, keinen Nullverbrauch. Nach Aktualisierungsfehlern kann die letzte gültige Messung mit ursprünglichem Zeitpunkt erhalten bleiben. Prüfen Sie Aktualität und Abdeckung vor Entscheidungen. Die Anzeige fragt 60 Sekunden nach jedem Versuch erneut ab; eine neue Messung ist damit nicht garantiert.

Abdeckung ist der Anteil eines Zeitraums mit gültigen Beobachtungen. Energie und Emissionen haben getrennte Abdeckung: Energie kann ohne CO₂-Faktor zur Emissionsberechnung verfügbar sein. Vergleichen Sie kompatible Zeiträume, Einheiten und Abdeckung. Niedrige Abdeckung bedeutet Teilanalyse, keine nachgewiesene Verbrauchssenkung.

## Validierungskriterien {#assessment}

Epics, Stories und Aufgaben strukturieren das Produkt mit überprüfbaren Kriterien und Codeverweisen. Issues, Pull Requests und Commits verbinden Anforderungen, Implementierung und Tests; die versionierte Dokumentation vereint Architektur, Verträge, Betrieb und Nachweise.

## Prüfungen {#engineering}

Für die dokumentierte Basis bestand die CI 542 Frontend-Tests, 705 Backend-Tests und drei integrierte Abläufe sowie Lint, Typprüfung, Builds, Migrationen und das SonarQube-Cloud-Gate. Die Website bietet 12 Sprachen mit automatischer Prüfung gleicher Inhalte, Verträge und Links.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

[Mitwirken](../contributing)

## Weiterführende Seiten {#related}

[Entwicklungsprinzipien](../product/decisions) · [Mitwirken](../contributing)
