# Produktvision und Umfang

GreenER beantwortet drei Fragen: Welche Anwendungen werden überwacht, welche Belege stützen ihren Verbrauch und wie sind geschätzte Energie und Emissionen zu verstehen? Erkennung, Metriken, regionaler Kontext und Historie unterstützen Untersuchung und Priorisierung.

## Zielgruppen

| Zielgruppe | Bedarf |
| --- | --- |
| Infrastrukturmanagement | Anwendungen und Änderungen der Umgebung erkennen. |
| Betriebs- und Umweltanalyse | Zeiträume untersuchen, vergleichbare Ergebnisse vergleichen und Lücken verstehen. |
| Entwicklung und Bewertung | Umgebung reproduzieren und Akzeptanzkriterien demonstrieren. |

Das sind Nutzerbedürfnisse; die vollständige Berechtigungsmatrix ist eine [offene Entscheidung](./decisions).

## Umfang und Verfügbarkeit

Referenz: `develop`-Quellstand vom 23.10.2026 (Commit `1633ca2`). Umgebungen können andere Revisionen ausführen; ein geschlossenes Issue beweist keine Produktionsverfügbarkeit.

| Funktion | Dokumentierter Stand |
| --- | --- |
| Katalog, Suche, Filter, Seitennavigation, Navigation und acht Sprachen | In der Oberfläche implementiert. |
| Erkennung, Lebenszyklusereignisse, regelmäßige Sammlung, Vorfälle und Speicherung | Im Backend implementiert. |
| Betriebszustand, Quellmetriken, Erfassungsbelege und Methodik | Per API und im Anwendungsdetail verfügbar; eine eigene Seite erklärt gespeichertes Modell, Formel, Parameter und Faktor ohne Neuberechnung. Fehler, fehlende und veraltete Daten bleiben unterscheidbar. |
| Umweltanalyse, Zeitreihen und Beitragsprüfung je Anwendung | In der API verfügbar und in das Anwendungsdetail integriert. |
| Aggregierte Umweltübersicht | API-Endpunkt verfügbar (`GET /analysis/summary`); noch kein aggregiertes Dashboard in der Oberfläche. |
| Helles/dunkles Theme | Als Oberflächenpräferenz verfügbar. |

## Abläufe und Nutzen

1. Anwendung finden, Detail öffnen und Identität, Ort und Zustand prüfen.
2. Änderungen anhand des letzten Versuchs, der letzten gültigen Beobachtung und fehlender Daten untersuchen.
3. Im Detail Zeitraum und Granularität wählen, Zeitreihe/Abdeckung verstehen und Bucket-Beiträge prüfen, ohne Lücken als Null zu behandeln.

Das [Handbuch](../guide/monitoring) beschreibt vorhandenes Verhalten; die [Epics](../roadmap) beschreiben den Sollumfang.

## Grenzen und Bewertung

Schätzungen sind keine direkte Strommessung und kein Beweis kausaler Einsparungen. Effizienz pro Transaktion benötigt Arbeitslastdaten. Die Zeitreihe im Detail vergleicht eine Anwendung mit dem unmittelbar vorherigen Fenster gleicher Dauer; dies bietet weder anwendungsübergreifenden Vergleich noch Periodenvergleich im Dashboard. Eine Karte ist optional.

In Reviews prüfen: Anwendung auffindbar, Null von fehlenden Daten unterscheidbar, Ergebnis bis Zeitraum, Einheit und Belegen nachvollziehbar. Schwierigkeiten, Feedback und Änderungen in [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133)/[#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134) erfassen. Zeit-, Zufriedenheits- und Leistungsziele benötigen Ausgangswerte und Freigabe.
