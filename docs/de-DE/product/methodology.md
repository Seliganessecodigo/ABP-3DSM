# Methodik und Daten

Ein vereinfachtes Modell schätzt Energie anhand von CPU, Speicher, Festplatte und Netzwerk im Beobachtungsintervall. Geschätzte Leistung wird über die Dauer in Energie umgerechnet. Emissionen ergeben sich aus Energie mal regionaler CO₂-Intensität. Die Koeffizienten gehören zum akademischen Modell, nicht zu direkter Strommessung oder offiziellen Regionalfaktoren. Ergebnisse erhalten ursprüngliche Methodik und Faktoren.

## Daten verstehen {#vocabulary}

| Begriff | Bedeutung |
| --- | --- |
| Anwendung | Dienst mit stabiler Identität im Katalog. |
| Beobachtung | Metriksatz für ein Intervall. |
| Energie | Geschätzte Menge eines Zeitraums in kWh. |
| CO₂-Intensität | Regionaler Faktor in gCO₂e/kWh. |
| Emissionen | CO₂-Äquivalentmenge mit angegebener Einheit. |
| Abdeckung | Anteil des Zeitraums mit gültigen Nachweisen. |

## Schätzmodell {#model}

| Parameter | Wert |
| --- | --- |
| CPU (100%) | 100 W |
| Speicher | 0.375 W/GB |
| Festplatte | 0.01 W/GB |
| Netzwerk | 0.02 W/GB |

```text
P [W] = P_CPU + P_RAM + P_disk + P_network
E [kWh] = P [W] × Δt [h] / 1000
CO₂e [g] = E [kWh] × I [gCO₂e/kWh]
```

## Abdeckung verstehen {#coverage}

Abdeckung ist der Anteil eines Zeitraums mit gültigen Beobachtungen. Energie und Emissionen haben getrennte Abdeckung: Energie kann ohne CO₂-Faktor zur Emissionsberechnung verfügbar sein. Vergleichen Sie kompatible Zeiträume, Einheiten und Abdeckung. Niedrige Abdeckung bedeutet Teilanalyse, keine nachgewiesene Verbrauchssenkung.

Nullverbrauch bedeutet, dass eine gültige Beobachtung diesen Wert belegt. Eine Lücke bedeutet fehlende nutzbare Daten, keinen Nullverbrauch. Nach Aktualisierungsfehlern kann die letzte gültige Messung mit ursprünglichem Zeitpunkt erhalten bleiben. Prüfen Sie Aktualität und Abdeckung vor Entscheidungen. Die Anzeige fragt 60 Sekunden nach jedem Versuch erneut ab; eine neue Messung ist damit nicht garantiert.

## Zeiträume und Verlauf {#history}

| Regel | Bedeutung |
| --- | --- |
| Erhaltener Verlauf | Einstellungen und Vorschauen ersetzen keine Originalergebnisse. |
| Explizite Lücken | Fehler, fehlende Metriken und ältere Daten bleiben von Null unterscheidbar. |
| Öffentliche Abfrage | Kennzahlen lesen ist öffentlich; Einstellungen speichern und Konten verwalten verlangt Berechtigung. |

Wählen Sie in der Neuberechnungsvorschau Anwendung und Datum, um das Original mit aktuellem Modell und aktuellen CO₂-Faktoren der beobachteten Regionen zu vergleichen. Der letzte Tag wird vollständig in UTC einbezogen. Höchstens 30 Tage und 10.000 Beobachtungen sind erlaubt. Die Vorschau wird nicht gespeichert und ändert keinen Verlauf. Prozentdifferenzen erfordern gleiche Einheiten und Abdeckung sowie einen positiven Originalwert.

## Weiterführende Seiten {#related}

[Benutzerhandbuch](../guide/monitoring) · [API-Referenz](../reference/api)
