# Katalog nutzen und Anwendungen untersuchen

Dieses Handbuch beschreibt vorhandenen Katalog und Betriebsdetail. Umweltdashboard, Analyse und Administration bleiben in den [Epics](../roadmap) geplant.

## Anwendung finden

1. Frontend öffnen; lokal nach [Erste Schritte](../getting-started) vorgehen.
2. Nach Name, ID, Regionscode oder Region suchen und Zustandsfilter kombinieren.
3. Seiten wechseln. Filter entfernen, bevor fehlende Treffer als leerer Katalog gelten.
4. ID und Ort im Detail prüfen. Eine fehlende Stadt ist zulässig; unvollständige Altstandorte bleiben unbekannt.

`q`, `state` und `page` stehen in der URL. Den Link zur Wiederherstellung des Kontexts speichern. Die Filter werden derzeit im Frontend auf die API-Liste angewandt.

## Aktualisierung

Katalog und Detail rufen beim Öffnen ab und planen den nächsten Abruf 60 Sekunden nach Abschluss jedes Versuchs. UI-Polling, Backend-Erfassung und Aggregatorintervall sind unabhängig; ein Bildschirmabruf garantiert keine neue Beobachtung.

Die UI zeigt Versuchs- und gültige Antwortzeiten. Bei Fehler nach Erfolg bleiben frühere Daten erhalten, ohne als neue Beobachtung zu gelten. Manuelle Katalogaktualisierung erlaubt erneuten Versuch ohne Seitenreload. Verlassen bricht laufende Anfragen ab.

## Situationen verstehen

| Situation | Bedeutung / Aktion |
| --- | --- |
| Leerer Katalog | API liefert keine Anwendungen; Ersterkennung prüfen. |
| Keine Filtertreffer | Filter anpassen; andere Anwendungen können existieren. |
| Anfangsfehler | Keine gültigen Daten; erneut versuchen und Betrieb prüfen. |
| Fehler nach Erfolg | Frühere Anzeige erhalten, Zeit beachten. |
| Anwendung nicht gefunden | ID/Link prüfen; anders als bekannte entfernte Anwendung. |
| Entfernte Anwendung | Identität und Historie bleiben; gültiger Snapshot bestätigte Abwesenheit. |

## Zustand, Sprache und Support

`AVAILABLE`, `UNAVAILABLE`, `NO_METRICS` und `REMOVED` sind Betriebszustände. Aktualität, Grund und Berechenbarkeit sind eigenständig. Verfügbar kann ohne Kohlenstofffaktor sein; nicht verfügbar kann gültige Historie haben. Erfassungsbelege sind per API vorhanden; vollständige Metrik-/Aktualitätsdarstellung hat UI-Tasks. Siehe [Methodik](../product/methodology).

Der Sprachwähler bietet acht Sprachen und speichert die Auswahl in diesem Browser. Sprache verändert weder Identität noch Beobachtungszeitpunkte.

Fehlerbericht: Umgebung, ID, Filter, Uhrzeit mit Zeitzone, Aktion, Soll-/Ist-Ergebnis. Screenshots ohne Geheimnisse/private Daten; siehe [Betrieb](../operations).
