# Benutzerhandbuch

Beginnen Sie mit der Umweltübersicht, wählen Sie eine auffällige Anwendung und öffnen Sie ihre Details. Untersuchen Sie den Zeitraum im Verlauf und die Schätzung in der Methodik. Berücksichtigen Sie vor jedem Vergleich die Abdeckung.

## Eine Anwendung finden {#catalog}

Suchen Sie im Katalog nach Name, Kennung oder Region und filtern Sie nach Status. Blättern Sie in der Tabelle und öffnen Sie eine Anwendung. Prüfen Sie die Filter, wenn keine Treffer erscheinen. Die Seitenadresse erhält Suche und Seitenauswahl zum Teilen oder Fortsetzen.

## Dashboard lesen {#dashboard}

Wählen Sie im Dashboard 24 Stunden, 7, 30 oder 90 Tage, Region und Status. Prüfen Sie Energie, Emissionen, Abdeckung und Anzahl nach Status. Das Diagramm zeigt Emissionsanteile als Balken oder Ring. Tabellenfilter, Suche und Impact-Sortierung ändern die sichtbaren Zeilen; die Gesamtsummen behalten den ausgewählten Umfang.

## Details untersuchen {#detail}

Öffnen Sie Details für Identität, Standort, Status und Aktualisierungszeiten. Prüfen Sie Metriken und Umweltergebnisse im selben Zeitraum. Die aufgezeichnete Methodik zeigt Modell, Parameter und CO₂-Faktor der Berechnung, ohne das Ergebnis zu ändern. Fehlt die Stadt, bleiben andere Ortsangaben nutzbar.

## Verlauf erkunden {#history}

Wählen Sie im Verlauf Anwendung, Zeitraum und stündliche, tägliche, monatliche oder jährliche Gruppierung. Filter und Seiten helfen beim Finden von Intervallen; deren Zusammensetzung zeigt einbezogene Beobachtungen und Ausschlüsse. Die Zeitzone ändert die Datumsanzeige, die Gruppierung bleibt UTC. Die Detailüberlagerung vergleicht dieselbe Anwendung mit dem gleich langen Vorzeitraum.

## Mit einer Neuberechnungsvorschau vergleichen {#preview}

Wählen Sie in der Neuberechnungsvorschau Anwendung und Datum, um das Original mit aktuellem Modell und aktuellen CO₂-Faktoren der beobachteten Regionen zu vergleichen. Der letzte Tag wird vollständig in UTC einbezogen. Höchstens 30 Tage und 10.000 Beobachtungen sind erlaubt. Die Vorschau wird nicht gespeichert und ändert keinen Verlauf. Prozentdifferenzen erfordern gleiche Einheiten und Abdeckung sowie einen positiven Originalwert.

## Analyse anpassen {#preferences}

Methodik bietet Energie, Emissionen, Abdeckung und Analyse. Beispiele sind auf dem Bildschirm gekennzeichnet. Melden Sie sich an, um Anzeigegrenzen sowie anfänglichen Zeitraum und Gruppierung zu speichern. Jede Person ändert nur eigene Einstellungen; Berechnungen und globale Konfiguration bleiben erhalten. Bei Speicherkonflikten laden Sie die Einstellung vor dem nächsten Versuch neu. Bereits in der Analyseadresse gewählte Optionen haben Vorrang.

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

## Weiterführende Seiten {#related}

[Methodik und Daten](../product/methodology) · [API-Referenz](../reference/api)
