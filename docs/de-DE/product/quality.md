# Qualität und Abnahme

Das Produkt muss Anwendungen auffindbar machen, Null von fehlenden Daten unterscheiden und Kennzahlen auf Zeitraum, Einheit, Abdeckung und Methodik zurückführen. Abfragen erhalten Navigationskontext und kennzeichnen Laden, Leere, Fehler und ältere Daten. Bewertet werden Tastatur, sichtbarer Fokus, Text zusätzlich zu Farbe, Mobilgeräte und alle 12 Sprachen.

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

Änderungen an Umfang und Regeln halten Problem, gewünschtes Ergebnis und Abnahmekriterien in den jeweiligen Stories fest. Reviews und Nutzbarkeitstests dokumentieren Schwierigkeiten, Rückmeldungen und Verbesserungen. Aufbewahrung, Backup/Wiederherstellung, Betriebsziele und externe Quoten benötigen noch Entscheidungen.

## Prüfungen {#engineering}

[Mitwirken](../contributing)

## Weiterführende Seiten {#related}

[Entscheidungen und Abhängigkeiten](../product/decisions) · [Mitwirken](../contributing)
