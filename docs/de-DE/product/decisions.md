# Entscheidungen und Abhängigkeiten

Änderungen an Umfang und Regeln halten Problem, gewünschtes Ergebnis und Abnahmekriterien in den jeweiligen Stories fest. Reviews und Nutzbarkeitstests dokumentieren Schwierigkeiten, Rückmeldungen und Verbesserungen. Aufbewahrung, Backup/Wiederherstellung, Betriebsziele und externe Quoten benötigen noch Entscheidungen.

## Produktregeln {#rules}

| Regel | Bedeutung |
| --- | --- |
| Erhaltener Verlauf | Einstellungen und Vorschauen ersetzen keine Originalergebnisse. |
| Explizite Lücken | Fehler, fehlende Metriken und ältere Daten bleiben von Null unterscheidbar. |
| Öffentliche Abfrage | Kennzahlen lesen ist öffentlich; Einstellungen speichern und Konten verwalten verlangt Berechtigung. |

## Aktueller Stand und Abhängigkeiten {#planned}

Vergleich, regionale Simulation, Rangliste, Benutzer- und Rollenverwaltung, Passwortwiederherstellung und Überwachungssteuerung sind implementiert. Die Verwaltung erfordert Berechtigung; SSO und E-Mail-Versand benötigen Umgebungskonfiguration. CSV-Export sowie Aufbewahrungs-, Sicherungs- und Wiederherstellungsrichtlinien bleiben Produktabhängigkeiten.

## Schätzmodell {#method}

Ein vereinfachtes Modell schätzt Energie anhand von CPU, Speicher, Festplatte und Netzwerk im Beobachtungsintervall. Geschätzte Leistung wird über die Dauer in Energie umgerechnet. Emissionen ergeben sich aus Energie mal regionaler CO₂-Intensität. Die Koeffizienten gehören zum akademischen Modell, nicht zu direkter Strommessung oder offiziellen Regionalfaktoren. Ergebnisse erhalten ursprüngliche Methodik und Faktoren.

## Abnahmekriterien {#acceptance}

Das Produkt muss Anwendungen auffindbar machen, Null von fehlenden Daten unterscheiden und Kennzahlen auf Zeitraum, Einheit, Abdeckung und Methodik zurückführen. Abfragen erhalten Navigationskontext und kennzeichnen Laden, Leere, Fehler und ältere Daten. Bewertet werden Tastatur, sichtbarer Fokus, Text zusätzlich zu Farbe, Mobilgeräte und alle 12 Sprachen.

## Weiterführende Seiten {#related}

[Produkt-Backlog](../roadmap) · [Methodik und Daten](../product/methodology)
