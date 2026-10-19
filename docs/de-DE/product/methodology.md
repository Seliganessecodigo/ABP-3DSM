# Methodik und Bedeutung der Daten

Belege behalten ihre Bedeutung: fehlende, fehlerhafte und veraltete Daten bedeuten nicht Null. Energie wird mit dem vereinfachten Modell und versionierten Parametern geschätzt; sie ist keine reale elektrische Messung, und die Parameter sind kein offizieller Regionalfaktor. Die CO₂e-Umrechnung ist in #49/#53 implementiert.

## Begriffe und Einheiten

| Begriff | Bedeutung |
| --- | --- |
| Anwendung | Stabile Identität; Name/Ort können sich ändern. |
| Beobachtung/Erfassung | Gespeicherte Metriken einer Anwendung und eines Intervalls. |
| Zyklus | Erkennung, Abgleich und Sammlung; keine einzelne Messung. |
| Energie | Über Zeitraum akkumulierte Menge in kWh; nicht Leistung. |
| Kohlenstoffintensität | Regionaler Quellfaktor in gCO₂e/kWh. |
| CO₂e | Äquivalente Emissionen mit Einheit/Faktor. |
| Abdeckung | Durch gültige Belege gestützter Anteil des Zeitraums, getrennt für Energie und CO₂e berechnet. |
| Stale | Aufbewahrte frühere gültige Beobachtung, kein aktueller Erfolg. |

Aggregator: CPU in %, Speicher, Datenträger und Netzwerk in GB. Das sind keine kWh; Umrechnung benötigt dokumentiertes Modell, Koeffizienten und Annahmen.

## Zeit und Herkunft

Die Quelle liefert keinen Messzeitstempel. GreenER speichert den Empfang und leitet `[receivedAt - collection_interval_seconds, receivedAt]` ab; das beweist nicht die tatsächlichen Quellmesszeiten.

Letzter Versuch, gültige Beobachtung und Stammdatenänderung sind verschieden. Faktorabfragezeit beweist keine offizielle Gültigkeit. Snapshots bewahren Wert, interne Identität, Vertrag und Abfragezeit; unveröffentlichte Bibliografie/Gültigkeit bleiben unbekannt.

## Zeitregeln für Umweltdaten

Abfragen nutzen ISO-Zeitstempel mit Zeitzone, nach UTC normalisiert, und [from,to). UTC-Kalender-Buckets je Stunde/Tag/Monat/Jahr zählen nur Überlappung, auch an Teilrändern. Presets 24h/7d/30d/90d sind exakte gleitende Fenster mit gemeinsamem KPI/Serien-Anker. Maximal 10.000 Punkte; Überschreitung wird ohne Kürzung oder Granularitätswechsel abgelehnt. Serien teilen gespeicherte Ergebnisse nach Überlappung auf, ohne Beobachtungen neu zu berechnen; Konflikte löst collectedAt neuester, dann ID lexikalisch aufsteigend, ohne Rückfall bei fehlendem Messwert. Keine zusätzliche Rundung; Abdeckungen und Original-Snapshots bleiben getrennt erhalten.

## Energie und Emissionen

Die implementierte dimensionale Beziehung lautet:

    CO₂e [g] = Energie [kWh] × Intensität [gCO₂e/kWh]

Nur Lehrbeispiel: 2 kWh × 100 gCO₂e/kWh = 200 gCO₂e = 0,2 kgCO₂e. Keine freigegebenen Faktoren oder Produktmesswerte. Damit ist das Energiemodell für CPU/Speicher/Datenträger/Netzwerk nicht definiert.

Ohne Faktor bleibt gültige Energie gültig; CO₂e kann unberechenbar sein. Null braucht gültige Belege.

## Historie und Szenarien

| Ergebnis | Regel |
| --- | --- |
| Original | Beobachtungen, Konfiguration, Methodik, Faktor bewahren. |
| Neuberechnungsvorschau | Identifizierte aktuelle Konfiguration, ohne Speicherung/Ersetzung; Rechte, Grenzen und Faktorpolitik offen. |
| Regionale Simulation | Energie konstant, anderer Faktor, getrennt von offiziellen Ergebnissen. |

Summen, Ranglisten und Vergleiche brauchen kompatible Zeiträume und Abdeckungen. Lücken werden nicht zu Null; Prozente erfordern einen gültigen Nenner. Die bestätigte Zeitsemantik steht oben. Persistiert werden Energie, Emissionen in Gramm und Faktor mit acht Dezimalstellen; Abdeckung als Anteil von null bis eins mit vier. Zwischenwerte werden nicht gerundet; JSON-Snapshots behalten ihre ursprüngliche Darstellung.
