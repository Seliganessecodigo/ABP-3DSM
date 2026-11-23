# Benutzerhandbuch

Beginnen Sie mit der Umweltübersicht, wählen Sie eine auffällige Anwendung und öffnen Sie ihre Details. Untersuchen Sie den Zeitraum im Verlauf und die Schätzung in der Methodik. Berücksichtigen Sie vor jedem Vergleich die Abdeckung.

## Eine Anwendung finden {#catalog}

Suchen Sie im Katalog nach Name, Kennung oder Region und filtern Sie nach Status. Blättern Sie in der Tabelle und öffnen Sie eine Anwendung. Prüfen Sie die Filter, wenn keine Treffer erscheinen. Die Seitenadresse erhält Suche und Seitenauswahl zum Teilen oder Fortsetzen.

## Dashboard lesen {#dashboard}

Wählen Sie im Dashboard Zeitraum, Region und Zustand für Energie, CO₂e, Erfassungserfolg und Anwendungen nach Zustand. Erfassungserfolg ist der Anteil aufgezeichneter Versuche mit gültigen gespeicherten Metriken; ohne Aufzeichnungen ist die Quote nicht verfügbar. Der erste Eintrag im Zeitraum wird angezeigt. Zeitliche Abdeckung bleibt in Analysen und Tabelle mit Hinweisen auf Teildaten erhalten. Diagramme, Suche, Filter und Seitennavigation behalten den Kontext bei.

Wechseln Sie in der Zeitreihe zwischen Energie und CO₂e oder öffnen Sie die Intervalltabelle. Das 24-Stunden-Fenster wird stündlich gruppiert, die übrigen täglich. Die Intervalle folgen UTC und denselben Filtern wie die Kennzahlen. Lücken bleiben ohne Wert.

## Details untersuchen {#detail}

Öffnen Sie Details für Identität, Standort, Status und Aktualisierungszeiten. Prüfen Sie Metriken und Umweltergebnisse im selben Zeitraum. Die aufgezeichnete Methodik zeigt Modell, Parameter und CO₂-Faktor der Berechnung, ohne das Ergebnis zu ändern. Fehlt die Stadt, bleiben andere Ortsangaben nutzbar.

Der äquivalente Faktor fasst die angewendeten regionalen Faktoren zusammen, gewichtet nach der Energie mit berechneten Emissionen. Die Erklärung verwendet diese Energie, die bei fehlenden Faktoren geringer als die Gesamtenergie sein kann. Prüfen Sie Werte und Quellen je Region in der Methodik. Die Faktorkarte bleibt gleich hoch wie die anderen Kennzahlen und wird nicht innerhalb der Karte erweitert.

## Verlauf erkunden {#history}

Wählen Sie im Verlauf Anwendung, Zeitraum und stündliche, tägliche, monatliche oder jährliche Gruppierung. Filter und Seiten helfen beim Finden von Intervallen; deren Zusammensetzung zeigt einbezogene Beobachtungen und Ausschlüsse. Die Zeitzone ändert die Datumsanzeige, die Gruppierung bleibt UTC. Die Detailüberlagerung vergleicht dieselbe Anwendung mit dem gleich langen Vorzeitraum.

## Berechnungsvorschau {#preview}

Anwendungsvergleiche erfordern kompatible Zeiträume, Einheiten und Abdeckung. Regionale Simulation erhält beobachtete Energie, ändert den Szenariofaktor und trennt Ergebnisse von offiziellen Kennzahlen.

## Analyse anpassen {#preferences}

Unter Methodik finden Sie Energie, Emissionen, Abdeckung und Analysevorgaben. Vorschauen nutzen echte Daten und kennzeichnen fehlende Ergebnisse oder Fehler; Verlauf und Formel bleiben unverändert. Melden Sie sich an, um persönliche Grenzwerte und Vorgaben zu speichern. Explizite Daten, Filter und Gruppierungen in der Adresse haben Vorrang.

## Anmelden {#access}

Katalog, Dashboard und Umweltabfragen sind öffentlich. Zum Speichern persönlicher Einstellungen nutzen Sie E-Mail/Passwort oder aktiviertes Google mit per Einladung verknüpftem Konto. Administratoren bestätigen zusätzlich einen sechsstelligen Code der Authenticator-App. Neuladen beendet die Sitzung der Oberfläche und verlangt erneute Anmeldung. Verwaltungsrechte hängen von der Kontorolle ab.

## Sprache und Darstellung {#appearance}

Wählen Sie im Menü zwischen 12 Sprachen; die Auswahl bleibt in diesem Browser. Der Dunkelmodus ändert die Darstellung; vor einer ausdrücklichen Auswahl folgt sie dem System. Gesperrter Browserspeicher kann Einstellungen beim Neuladen verlieren. Die Sprache formatiert Zahlen und Daten, ohne Beobachtungszeitpunkte zu ändern.

## Daten verstehen {#data}

Nullverbrauch bedeutet, dass eine gültige Beobachtung diesen Wert belegt. Eine Lücke bedeutet fehlende nutzbare Daten, keinen Nullverbrauch. Nach Aktualisierungsfehlern kann die letzte gültige Messung mit ursprünglichem Zeitpunkt erhalten bleiben. Prüfen Sie Aktualität und Abdeckung vor Entscheidungen. Die Anzeige fragt 60 Sekunden nach jedem Versuch erneut ab; eine neue Messung ist damit nicht garantiert.

| Status | Bedeutung |
| --- | --- |
| Verfügbar | Die Anwendung hat nutzbare Metriken geliefert. |
| Nicht verfügbar | Der aktuelle Versuch schlug fehl; gültiger Verlauf kann vorhanden sein. |
| Keine Metriken | Die Anwendung ist bekannt, im Versuch fehlen nutzbare Metriken. |
| Entfernt | Das Fehlen wurde im Quellkatalog bestätigt; Identität und Verlauf bleiben erhalten. |

Abdeckung ist der Anteil eines Zeitraums mit gültigen Beobachtungen. Energie und Emissionen haben getrennte Abdeckung: Energie kann ohne CO₂-Faktor zur Emissionsberechnung verfügbar sein. Vergleichen Sie kompatible Zeiträume, Einheiten und Abdeckung. Niedrige Abdeckung bedeutet Teilanalyse, keine nachgewiesene Verbrauchssenkung.

## Diagnose {#support}

Nennen Sie bei Problemen Anwendung, Zeitraum, Filter, Uhrzeit mit Zeitzone und Aktion. Beschreiben Sie erwartetes und beobachtetes Ergebnis. Screenshots helfen, sofern sie keine Zugangsdaten oder privaten Daten enthalten.

## Weitere Analysen und Einstellungen {#other}

Die Rangliste ordnet Ergebnisse nach Energie oder CO₂e im Zeitraum. Der Vergleich umfasst Anwendungen und eine Referenz; die regionale Simulation behält die Energie bei und zeigt ein getrenntes Szenario. Berechtigte Benutzer finden Überwachung, Konten und Änderungsprüfung in den Einstellungen. Im persönlichen Konto kann das Passwort geändert werden; die Anmeldung bietet Wiederherstellung per temporärem Token.

## Weiterführende Seiten {#related}

[Methodik und Daten](../product/methodology) · [API-Referenz](../reference/api)
