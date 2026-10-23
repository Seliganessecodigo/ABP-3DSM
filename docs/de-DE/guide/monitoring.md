# Katalog nutzen und Anwendungen untersuchen

Dieses Handbuch beschreibt Katalog, Betriebsdetail und die in der Oberfläche verfügbare Umweltanalyse je Anwendung. Die aggregierte Zusammenfassung gibt es bereits in der API; Dashboard, Rangliste, Vergleich und Administration bleiben in den [Epics](../roadmap) geplant.

## Anwendung finden

1. Frontend öffnen; lokal nach [Erste Schritte](../getting-started) vorgehen.
2. Nach Name, ID, Regionscode oder Region suchen und Zustandsfilter kombinieren.
3. Seiten wechseln. Filter entfernen, bevor fehlende Treffer als leerer Katalog gelten.
4. ID und Ort im Detail prüfen. Eine fehlende Stadt ist zulässig; unvollständige Altstandorte bleiben unbekannt.

`q`, `state` und `page` stehen in der URL. Den Link zur Wiederherstellung des Kontexts speichern. Die Filter werden derzeit im Frontend auf die API-Liste angewandt.

## Aktualisierung

Katalog und Detail rufen beim Öffnen ab und planen den nächsten Abruf 60 Sekunden nach Abschluss jedes Versuchs. UI-Polling, Backend-Erfassung und Aggregatorintervall sind unabhängig; ein Bildschirmabruf garantiert keine neue Beobachtung.

Die UI zeigt Versuchs- und gültige Antwortzeiten. Bei Fehler nach Erfolg bleiben frühere Daten erhalten, ohne als neue Beobachtung zu gelten. Manuelle Katalogaktualisierung erlaubt erneuten Versuch ohne Seitenreload. Verlassen bricht laufende Anfragen ab.

## Umweltergebnisse untersuchen

Im Anwendungsdetail wählen Sie ein rollierendes Fenster von 24 Stunden, 7, 30 oder 90 Tagen sowie eine stündliche, tägliche, monatliche oder jährliche Granularität. Die Zeitreihe zeigt Energie und CO₂e aus gespeicherten Ergebnissen. Die Überlagerung vergleicht das gewählte Fenster mit dem unmittelbar vorherigen Fenster gleicher Dauer. Das ist ein Zeitvergleich für eine Anwendung, keine Rangliste und kein Vergleich zwischen Anwendungen.

Mit Filtern und Sortierung der Tabelle finden Sie Buckets. Prüfen Sie einen Bucket auf enthaltene Beiträge und Ausschlüsse samt Gründen. Die Tabelle ist paginiert; die Oberfläche lädt derzeit nur die erste Beitragsseite. Lücken und Ausschlüsse bedeuten nicht null. Ohne berechenbare Belege bleibt das Ergebnis nicht verfügbar.

## Situationen verstehen

Für die Nachverfolgung eines Indikators öffnen Sie im Anwendungsdetail **Vollständige Methodik ansehen**. Alternativ wählen Sie in der Navigation **Methodik** und danach eine Anwendung. Die Seite zeigt das gespeicherte Modell, die Formel, Parameter und Annahmen sowie verfügbare Angaben zum Kohlenstofffaktor. Der Link im Detail verwendet die ausgewählte Erfassung; die Navigation verwendet die letzte gültige Erfassung. Die Seite erklärt gespeicherte Belege und berechnet das Ergebnis nicht neu.

| Situation | Bedeutung / Aktion |
| --- | --- |
| Leerer Katalog | API liefert keine Anwendungen; Ersterkennung prüfen. |
| Keine Filtertreffer | Filter anpassen; andere Anwendungen können existieren. |
| Anfangsfehler | Keine gültigen Daten; erneut versuchen und Betrieb prüfen. |
| Fehler nach Erfolg | Frühere Anzeige erhalten, Zeit beachten. |
| Anwendung nicht gefunden | ID/Link prüfen; anders als bekannte entfernte Anwendung. |
| Entfernte Anwendung | Identität und Historie bleiben; gültiger Snapshot bestätigte Abwesenheit. |

## Zustand, Sprache und Support

`AVAILABLE`, `UNAVAILABLE`, `NO_METRICS` und `REMOVED` sind Betriebszustände. Aktualität, Grund und Berechenbarkeit sind eigenständig. Verfügbar kann ohne Kohlenstofffaktor sein; nicht verfügbar kann gültige Historie haben. Das Detail zeigt Betriebszustand, Metriken, Umweltergebnisse, Zeitreihe und Beiträge je Zeitraum. Siehe [API-Referenz](../reference/api) und [Methodik](../product/methodology), um fehlende Daten, Fehler und Nullwerte zu unterscheiden.

Der Sprachwähler bietet acht Sprachen und speichert die Auswahl in diesem Browser. Sprache verändert weder Identität noch Beobachtungszeitpunkte.

Fehlerbericht: Umgebung, ID, Filter, Uhrzeit mit Zeitzone, Aktion, Soll-/Ist-Ergebnis. Screenshots ohne Geheimnisse/private Daten; siehe [Betrieb](../operations).

## Designpräferenz

Verwenden Sie in den Navigationseinstellungen den Schalter **Dunkelmodus**: ausgeschaltet für hell, eingeschaltet für dunkel. Beim ersten Besuch folgt GreenER dem Systemdesign und dessen Änderungen, bis Sie den Schalter betätigen. Danach hat Ihre ausdrückliche Auswahl Vorrang; diese Oberfläche bietet keine Aktion zur Rückkehr zum Systemdesign.

Die Auswahl gilt für Katalog, Details und das globale Layout, ohne Filter oder Daten zu ändern. Sie wird in diesem Browser unter `greener-theme` für den nächsten Besuch gespeichert. Bei blockiertem Speicher gilt sie während der Sitzung, kann aber beim Neuladen verloren gehen.
