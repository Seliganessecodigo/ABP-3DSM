# Produktvision und Umfang

GreenER beantwortet drei Fragen: Welche Anwendungen werden überwacht, welche Belege stützen ihren Verbrauch und wie sind geschätzte Energie und Emissionen zu verstehen? Erkennung, Metriken, regionaler Kontext und Historie unterstützen Untersuchung und Priorisierung.

## Zielgruppen

| Zielgruppe | Bedarf |
| --- | --- |
| Infrastrukturmanagement | Anwendungen und Änderungen der Umgebung erkennen. |
| Betriebs- und Umweltanalyse | Zeiträume untersuchen, vergleichbare Ergebnisse vergleichen und Lücken verstehen. |
| Administration | Parameter und Zugriff autorisiert und nachvollziehbar ändern. |
| Entwicklung und Bewertung | Umgebung reproduzieren und Akzeptanzkriterien demonstrieren. |

Das sind Nutzerbedürfnisse; die vollständige Berechtigungsmatrix ist eine [offene Entscheidung](./decisions).

## Umfang und Verfügbarkeit

Referenz: `develop`-Quellstand vom 15.10.2026. Umgebungen können andere Revisionen ausführen; ein geschlossenes Issue beweist keine Produktionsverfügbarkeit.

| Funktion | Dokumentierter Stand |
| --- | --- |
| Katalog, Suche/Zustandsfilter, Navigation, acht Sprachen | In der Oberfläche implementiert. |
| Erkennung, Lebenszyklusereignisse, regelmäßige Sammlung, Speicherung | Im Backend implementiert. |
| Betriebszustand und Abfrage von Erfassungsbelegen | Per API vorhanden; vollständige UI-Darstellung hat eigene Tasks. |
| Umweltdashboard, Energie/CO₂e, Zeitreihen, Rangliste, Vergleich | Geplanter Umfang. |
| Themes, Authentifizierung, Administration, regionale Simulation, Neuberechnungsvorschau | Geplant mit Backlog-Abhängigkeiten. |

## Abläufe und Nutzen

1. Anwendung finden, Detail öffnen und Identität, Ort und Zustand prüfen.
2. Änderungen anhand des letzten Versuchs, der letzten gültigen Beobachtung und fehlender Daten untersuchen.
3. Im geplanten Umweltumfang Zeitraum, Abdeckung und Methodik prüfen und denselben Ausschnitt vergleichen.
4. In der geplanten Administration autorisierte Parameter ändern, ohne Historie umzuschreiben.

Das [Handbuch](../guide/monitoring) beschreibt vorhandenes Verhalten; die [Epics](../roadmap) beschreiben den Sollumfang.

## Grenzen und Bewertung

Schätzungen sind keine direkte Strommessung und kein Beweis kausaler Einsparungen. Effizienz pro Transaktion benötigt Arbeitslastdaten. CSV, konfigurierbare Spalten und Vorperiodenvergleich gehören nicht allein wegen Figma zum MVP. Eine Karte ist optional.

In Reviews prüfen: Anwendung auffindbar, Null von fehlenden Daten unterscheidbar, Ergebnis bis Zeitraum, Einheit und Belegen nachvollziehbar. Schwierigkeiten, Feedback und Änderungen in [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133)/[#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134) erfassen. Zeit-, Zufriedenheits- und Leistungsziele benötigen Ausgangswerte und Freigabe.
