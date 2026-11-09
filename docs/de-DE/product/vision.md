# Produktvision und Umfang

GreenER beantwortet drei Fragen: Welche Anwendungen werden überwacht, welche Belege stützen ihren Verbrauch und wie sind geschätzte Energie und Emissionen zu verstehen? Erkennung, Metriken, regionaler Kontext und Historie unterstützen Untersuchung und Priorisierung.

## Zielgruppen

| Zielgruppe | Bedarf |
| --- | --- |
| Infrastrukturmanagement | Anwendungen und Änderungen der Umgebung erkennen. |
| Betriebs- und Umweltanalyse | Zeiträume untersuchen, vergleichbare Ergebnisse vergleichen und Lücken verstehen. |
| Entwicklung und Bewertung | Umgebung reproduzieren und Akzeptanzkriterien demonstrieren. |

Dashboard und Umweltabfragen sind öffentlich. `/login`: E-Mail/Passwort oder aktiviertes Google. Admin benötigt sechsstelligen TOTP, auch nach Google; Analyst/Visitor erhalten keine Verwaltungsrechte. Frontend-Sitzung nur im Speicher; Neuladen verlangt Anmeldung. Backend prüft JWT, Sitzung, aktuelle Rolle und Kontostatus: 401 bei fehlender/ungültiger Anmeldung, 403 bei unzureichender Rolle. Neue Routen sind standardmäßig geschützt.

## Umfang und Verfügbarkeit

Stand: `origin/develop`, Commit `c343698`, geprüft am 08.11.2026. Umgebungen können andere Revisionen ausführen; Merge beweist kein Deployment.

| Funktion | Dokumentierter Stand |
| --- | --- |
| Katalog, Suche, Filter, Seitennavigation, Navigation und zwölf Sprachen | In der Oberfläche implementiert. |
| Erkennung, Lebenszyklusereignisse, regelmäßige Sammlung, Vorfälle und Speicherung | Im Backend implementiert. |
| Betriebszustand, Quellmetriken, Erfassungsbelege und Methodik | Per API und im Anwendungsdetail verfügbar; eine eigene Seite erklärt gespeichertes Modell, Formel, Parameter und Faktor ohne Neuberechnung. Fehler, fehlende und veraltete Daten bleiben unterscheidbar. |
| Umweltanalyse, Zeitreihen und Beitragsprüfung je Anwendung | In der API verfügbar und in das Anwendungsdetail integriert. |
| `/dashboard` · `GET /analysis/summary` | Unter `/dashboard` 24 Stunden, 7, 30 oder 90 Tage, Status und Region wählen. Summen, Abdeckung, Statusanzahl und Emissionsanteile als Balken/Ring anzeigen. Tabelle mit Suche, Spaltenfiltern, Energie-/CO₂e-Sortierung und Seiten; Tabellenfilter ändern die Summen nicht. Anwendung zur Untersuchung öffnen. `GET /analysis/summary` wird regelmäßig ohne Neuladen abgefragt. |
| Helles/dunkles Theme | Als Oberflächenpräferenz verfügbar. |

## Abläufe und Nutzen

1. Anwendung finden, Detail öffnen und Identität, Ort und Zustand prüfen.
2. Änderungen anhand des letzten Versuchs, der letzten gültigen Beobachtung und fehlender Daten untersuchen.
3. Im Detail Zeitraum und Granularität wählen, Zeitreihe/Abdeckung verstehen und Bucket-Beiträge prüfen, ohne Lücken als Null zu behandeln.

Das [Handbuch](../guide/monitoring) beschreibt vorhandenes Verhalten; die [Epics](../roadmap) beschreiben den Sollumfang.

## Grenzen und Bewertung

Schätzungen sind keine direkte Strommessung und kein Beweis kausaler Einsparungen. Effizienz pro Transaktion benötigt Arbeitslastdaten. Die Zeitreihe im Detail vergleicht eine Anwendung mit dem unmittelbar vorherigen Fenster gleicher Dauer; dies bietet weder anwendungsübergreifenden Vergleich noch Periodenvergleich im Dashboard. Eine Karte ist optional.

In Reviews prüfen: Anwendung auffindbar, Null von fehlenden Daten unterscheidbar, Ergebnis bis Zeitraum, Einheit und Belegen nachvollziehbar. Schwierigkeiten, Feedback und Änderungen in [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133)/[#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134) erfassen. Zeit-, Zufriedenheits- und Leistungsziele benötigen Ausgangswerte und Freigabe.

## Benutzerhandbuch

Unter `/history` Anwendung wählen; `applicationId`, Zeitraum und Granularität bleiben in der URL. Gespeicherte Zeitreihe mit Filtern, Anzeigezeitzone, Ereignissen, nummerierten Seiten und Bucket-Inspektion. Beiträge haben interaktive Seiten mit 5, 10, 15, 20 oder allen Einträgen. Buckets bleiben UTC; Anzeigezeitzone gruppiert nicht neu. Die Detailüberlagerung vergleicht dieselbe Anwendung mit dem gleich langen Vorzeitraum.

Unter `/administration/calculations` Anwendung/Datum wählen und Original/Vorschau vergleichen. Enddatum umfasst den ganzen UTC-Tag; API verwendet `[from,to)`. Öffentliche Vorschau mit aktuellem Modell und aktuellen Faktoren historischer Regionen, ohne Speicherung. Grenzen: 30 Tage, 10.000 Beobachtungen. Antwort: `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Faktorfehler erhält berechenbare Energie; CO₂e bleibt nicht verfügbar. Prozente verlangen gleiche Einheiten/Abdeckung und positiven Referenzwert.

`/methodology` bietet Energie, Emissionen, Abdeckung und Analyse mit Beispielen/persönlichen Einstellungen. Jede angemeldete Rolle speichert nur eigene Register mit optimistischer Revision; 409 bei Konflikt. Anzeigegrenzen ändern weder globale Parameter noch Berechnungen oder externe Benachrichtigungen. Gespeicherter Zeitraum/Granularität ergänzen nur fehlende URL-Werte. Historische Methodik: `/services/:id/methodology`, gegebenenfalls mit `collectionId`.

Admin derselben Organisation ändert Konten zwischen `ACTIVE`, `BLOCKED`, `DEACTIVATED`, mit `expectedStatus` und Begründung. Sperre/Deaktivierung widerruft alle Sitzungen; Reaktivierung erfordert neue Anmeldung. Eigenes Konto und letzter aktiver Admin sind geschützt. Erwartungskonflikt: 409; Ziel bereits erreicht: idempotenter Erfolg. Gemeinsames Audit speichert Erfolg in der Transaktion und Ablehnungen außerhalb des Rollbacks, mit explizitem Akteur und ohne Geheimnisse. Keine vollständige Rollenverwaltung oder Passwortwiederherstellung durch diese Route.
