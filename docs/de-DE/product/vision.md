# Vision und Umfang

GreenER unterstützt die Überwachung von Anwendungen und das Verständnis ihres geschätzten Energieverbrauchs und ihrer Kohlendioxidäquivalent-Emissionen (CO₂e). Kennzahlen, Standort und Verlauf helfen, die Umweltwirkung digitaler Dienste zu untersuchen.

## Zielgruppen {#readers}

| Zielgruppe | Bedarf |
| --- | --- |
| Infrastrukturverwaltung | Anwendungen erkennen und Änderungen der Umgebung verfolgen. |
| Umwelt- und Betriebsanalyse | Verbrauch, Emissionen und Datenqualität eines Zeitraums untersuchen. |
| Entwicklung und Bewertung | Produktverhalten prüfen und Ergebnisse nachvollziehen. |

## Verfügbare Funktionen {#features}

| Funktion | Referenz |
| --- | --- |
| Katalog und Suche | [Eine Anwendung finden](../guide/monitoring#catalog) |
| Automatische Überwachung | [Daten verstehen](../guide/monitoring#data) |
| Umweltdashboard | [Dashboard lesen](../guide/monitoring#dashboard) |
| Anwendungsdetails | [Details untersuchen](../guide/monitoring#detail) |
| Verlauf und Zusammensetzung | [Verlauf erkunden](../guide/monitoring#history) |
| Neuberechnungsvorschau | [Mit einer Neuberechnungsvorschau vergleichen](../guide/monitoring#preview) |
| Persönliche Einstellungen | [Analyse anpassen](../guide/monitoring#preferences) |
| Anmeldung und zweiter Faktor | [Anmelden](../guide/monitoring#access) |
| Sortierung nach Wirkung | [Dashboard lesen](../guide/monitoring#dashboard) |

## Analyseablauf {#journey}

Beginnen Sie mit der Umweltübersicht, wählen Sie eine auffällige Anwendung und öffnen Sie ihre Details. Untersuchen Sie den Zeitraum im Verlauf und die Schätzung in der Methodik. Berücksichtigen Sie vor jedem Vergleich die Abdeckung.

## Nutzungsgrenzen {#limits}

Ein vereinfachtes Modell schätzt Energie anhand von CPU, Speicher, Festplatte und Netzwerk im Beobachtungsintervall. Geschätzte Leistung wird über die Dauer in Energie umgerechnet. Emissionen ergeben sich aus Energie mal regionaler CO₂-Intensität. Die Koeffizienten gehören zum akademischen Modell, nicht zu direkter Strommessung oder offiziellen Regionalfaktoren. Ergebnisse erhalten ursprüngliche Methodik und Faktoren.

Abdeckung ist der Anteil eines Zeitraums mit gültigen Beobachtungen. Energie und Emissionen haben getrennte Abdeckung: Energie kann ohne CO₂-Faktor zur Emissionsberechnung verfügbar sein. Vergleichen Sie kompatible Zeiträume, Einheiten und Abdeckung. Niedrige Abdeckung bedeutet Teilanalyse, keine nachgewiesene Verbrauchssenkung.

## Geplante Erweiterungen {#planned}

Geplant sind ein eigener Anwendungsvergleich, Simulation anderer Regionen, vollständige Benutzer-/Rollenverwaltung, Passwortselbsthilfe, globale Überwachungssteuerung. Der Umfang des CSV-Exports braucht noch eine Entscheidung. Das Dashboard sortiert bereits nach Energie oder Emissionen. Prioritäten stehen im Backlog; diese Dokumentation legt keine Liefertermine fest.

## Weiterführende Seiten {#related}

[Benutzerhandbuch](../guide/monitoring) · [Methodik und Daten](../product/methodology) · [Produkt-Backlog](../roadmap)
