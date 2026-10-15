# Methodik und Bedeutung der Daten

Fehlende, fehlerhafte und veraltete Daten bedeuten nicht Null. Umweltregeln sind Produktanforderungen; vollständiges Energiemodell und Koeffizienten benötigen Freigabe.

## Begriffe und Einheiten

| Begriff | Bedeutung |
| --- | --- |
| Anwendung | Stabile Identität; Name/Ort können sich ändern. |
| Beobachtung/Erfassung | Gespeicherte Metriken einer Anwendung und eines Intervalls. |
| Zyklus | Erkennung, Abgleich und Sammlung; keine einzelne Messung. |
| Energie | Über Zeitraum akkumulierte Menge in kWh; nicht Leistung. |
| Kohlenstoffintensität | Regionaler Quellfaktor in gCO₂e/kWh. |
| CO₂e | Äquivalente Emissionen mit Einheit/Faktor. |
| Abdeckung | Durch gültige Belege gestützter Teil; Berechnungspolitik offen. |
| Stale | Aufbewahrte frühere gültige Beobachtung, kein aktueller Erfolg. |

Aggregator: CPU in %, Speicher, Datenträger und Netzwerk in GB. Das sind keine kWh; Umrechnung benötigt dokumentiertes Modell, Koeffizienten und Annahmen.

## Zeit und Herkunft

Die Quelle liefert keinen Messzeitstempel. GreenER speichert den Empfang und leitet `[receivedAt - collection_interval_seconds, receivedAt]` ab; das beweist nicht die tatsächlichen Quellmesszeiten.

Letzter Versuch, gültige Beobachtung und Stammdatenänderung sind verschieden. Faktorabfragezeit beweist keine offizielle Gültigkeit. Snapshots bewahren Wert, interne Identität, Vertrag und Abfragezeit; unveröffentlichte Bibliografie/Gültigkeit bleiben unbekannt.

## Energie und Emissionen

Geplante dimensionale Beziehung:

    CO₂e [g] = Energie [kWh] × Intensität [gCO₂e/kWh]

Nur Lehrbeispiel: 2 kWh × 100 gCO₂e/kWh = 200 gCO₂e = 0,2 kgCO₂e. Keine freigegebenen Faktoren oder Produktmesswerte. Damit ist das Energiemodell für CPU/Speicher/Datenträger/Netzwerk nicht definiert.

Ohne Faktor bleibt gültige Energie gültig; CO₂e kann unberechenbar sein. Null braucht gültige Belege.

## Historie und Szenarien

| Ergebnis | Regel |
| --- | --- |
| Original | Beobachtungen, Konfiguration, Methodik, Faktor bewahren. |
| Neuberechnungsvorschau | Identifizierte aktuelle Konfiguration, ohne Speicherung/Ersetzung; Rechte, Grenzen und Faktorpolitik offen. |
| Regionale Simulation | Energie konstant, anderer Faktor, getrennt von offiziellen Ergebnissen. |

Summen, Ranglisten und Vergleiche brauchen kompatible Zeiträume/Abdeckung. Keine künstlichen Nullen in Lücken oder Prozente ohne gültigen Nenner. Rundung, Zeitgrenzen und Granularität sind [offene Entscheidungen](./decisions).
