# Piano di consegna e prove

Le consegne GreenER combinano ampiezza funzionale, ingegneria del software e tracciabilità ambientale. Questo documento presenta capacità implementate, evidenze dei 27 criteri della rubrica e contributi dei cinque membri in tre sprint, con collegamenti a codice, test e documentazione.

`2026-11-22` · `America/Sao_Paulo` · `240a2c26ecd2eb1b0adc184f4efe01799bab8a50`

## Prodotto integrato e ingegneria {#engineering}

React 19 e TypeScript sostengono l’interfaccia; NestJS organizza l’API in moduli e livelli con dependency injection; TypeORM e PostgreSQL preservano i dati mediante migrazioni versionate. Integrazioni validate, audit transazionale e snapshot di calcolo sostengono la coerenza degli indicatori.

Per la base documentata, la CI ha approvato 542 test frontend, 705 backend e tre flussi integrati, oltre a lint, controllo dei tipi, build, migrazioni e gate SonarQube Cloud. Il sito offre 12 lingue con verifica automatica dell’equivalenza di contenuti, contratti e collegamenti.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

## Criteri e verifica {#criteria}

| Codice | Punti | Consegna | Verifica | Evidenza presentata |
| --- | ---: | --- | --- | --- |
| GA01 | 5 | Backlog | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Backlog strutturato |
| GA02 | 5 | Pianificazione e capacità | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Iterazioni e responsabili nel Project |
| GA03 | 5 | Criteri di accettazione | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Criteri nelle issue |
| GA04 | 4 | Monitoraggio | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | PR e commit collegati |
| GA05 | 3 | Incrementi | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| GA06 | 4 | Review e adattamento | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Revisioni tecniche documentate |
| GA07 | 3 | Definizione di completamento | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | DoD documentata |
| GA08 | 3 | Documentazione ed esecuzione | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Documentazione versionata |
| GA09 | 8 | Partecipazione | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| DW01 | 3 | Tecnologie | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| DW02 | 5 | Integrazioni | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| DW03 | 4 | API e backend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| DW04 | 4 | Persistenza ORM | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| DW05 | 3 | Frontend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| DW06 | 3 | Autenticazione | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| DW07 | 3 | Container | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| TP01 | 4 | Responsabilità | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| TP02 | 4 | Iniezione delle dipendenze | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| TP03 | 4 | Tipi e leggibilità | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| TP04 | 4 | Test unitari | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| TP05 | 4 | Validazione ed errori | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| IHC01 | 3 | Utenti e attività | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| IHC02 | 3 | Flussi e prototipi | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Prototipi e flussi documentati |
| IHC03 | 3 | Indicatori e stati | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| IHC04 | 2 | Adattabilità e feedback | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implementato/verificato |
| IHC05 | 2 | Valutazione utenti | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Protocollo di valutazione |
| IHC06 | 2 | Miglioramenti e nuova verifica | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Feedback di interfaccia documentato |

## Sprint e riferimenti {#sprints}

| Sprint | Periodo | Capacità integrate |
| --- | --- | --- |
| [Sprint 1](./sprints/sprint-1) | 2026-10-05 / 2026-10-18 | Fondamenti, catalogo e raccolta |
| [Sprint 2](./sprints/sprint-2) | 2026-10-19 / 2026-11-01 | Indicatori, interfaccia e autenticazione |
| [Sprint 3](./sprints/sprint-3) | 2026-11-02 / 2026-11-15 | Cronologia, analisi ed evoluzione operativa |

## Definizione di completamento {#done}

Criteri di accettazione, integrità dei dati, test, CI, documentazione, accessibilità e revisione compongono la Definition of Done. Ogni consegna collega la propria versione alle evidenze di verifica.

[Definition of Done](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/definition-of-done.md)

## Partecipazione e fonti {#sources}

I cinque membri hanno contributi integrati nei tre sprint. Le tabelle collegano gli autori Git ai commit verificabili e mostrano attività e responsabili registrati nel Project, rendendo tracciabile la partecipazione alla costruzione del prodotto.

[GitHub Project](https://github.com/orgs/Seliganessecodigo/projects/2) · [Tasks](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/tasks.md) · [Git](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/historico.json)

## Evidenze di qualità {#quality-evidence}

Codice, test automatizzati, contratti e documentazione costituiscono una catena di verifica delle consegne. La matrice dettagliata, il protocollo di usabilità e i documenti tecnici permettono di esaminare flussi, criteri di qualità ed evidenze di ogni dimensione del progetto.

[#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489) · [IHC05 / IHC06](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/usabilidade.md) · [Review](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/revisao-2026-11-22.md)
