# Plan de livraison et preuves

Les livraisons GreenER associent richesse fonctionnelle, ingénierie logicielle et traçabilité environnementale. Ce document présente les capacités implémentées, les preuves des 27 critères de la grille et les contributions des cinq membres sur trois sprints, avec des liens vers le code, les tests et la documentation.

`2026-11-22` · `America/Sao_Paulo` · `240a2c26ecd2eb1b0adc184f4efe01799bab8a50`

## Produit intégré et ingénierie {#engineering}

React 19 et TypeScript portent l’interface ; NestJS structure l’API en modules et couches avec injection de dépendances ; TypeORM et PostgreSQL préservent les données par des migrations versionnées. Intégrations validées, audit transactionnel et instantanés de calcul soutiennent la cohérence des indicateurs.

Pour la base documentée, la CI a validé 542 tests frontend, 705 tests backend et trois parcours intégrés, ainsi que lint, typage, builds, migrations et le gate SonarQube Cloud. Le site propose 12 langues avec vérification automatique de l’équivalence du contenu, des contrats et des liens.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

## Critères et vérification {#criteria}

| Code | Points | Livraison | Vérification | Preuve présentée |
| --- | ---: | --- | --- | --- |
| GA01 | 5 | Backlog | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Backlog structuré |
| GA02 | 5 | Planification et capacité | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Itérations et responsables du Project |
| GA03 | 5 | Critères d’acceptation | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Critères dans les issues |
| GA04 | 4 | Suivi | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | PR et commits liés |
| GA05 | 3 | Incréments | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| GA06 | 4 | Review et adaptation | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Revues techniques documentées |
| GA07 | 3 | Définition de terminé | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | DoD documentée |
| GA08 | 3 | Documentation et exécution | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Documentation versionnée |
| GA09 | 8 | Participation | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| DW01 | 3 | Technologies | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| DW02 | 5 | Intégrations | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| DW03 | 4 | API et backend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| DW04 | 4 | Persistance ORM | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| DW05 | 3 | Frontend | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| DW06 | 3 | Authentification | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| DW07 | 3 | Conteneurs | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| TP01 | 4 | Responsabilités | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| TP02 | 4 | Injection de dépendances | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| TP03 | 4 | Types et lisibilité | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| TP04 | 4 | Tests unitaires | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| TP05 | 4 | Validation et erreurs | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| IHC01 | 3 | Utilisateurs et tâches | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| IHC02 | 3 | Parcours et prototypes | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Prototypes et parcours documentés |
| IHC03 | 3 | Indicateurs et états | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| IHC04 | 2 | Adaptation et feedback | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Implémenté/vérifié |
| IHC05 | 2 | Évaluation utilisateurs | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Protocole d’évaluation |
| IHC06 | 2 | Améliorations et nouvel essai | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Retours d’interface documentés |

## Sprints et références {#sprints}

| Sprint | Période | Capacités intégrées |
| --- | --- | --- |
| [Sprint 1](./sprints/sprint-1) | 2026-10-05 / 2026-10-18 | Fondations, catalogue et collecte |
| [Sprint 2](./sprints/sprint-2) | 2026-10-19 / 2026-11-01 | Indicateurs, interface et authentification |
| [Sprint 3](./sprints/sprint-3) | 2026-11-02 / 2026-11-15 | Historique, analyse et évolution opérationnelle |

## Définition de terminé {#done}

Critères d’acceptation, intégrité des données, tests, CI, documentation, accessibilité et revue composent la Definition of Done. Chaque livraison relie sa version aux preuves de vérification.

[Definition of Done](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/definition-of-done.md)

## Participation et sources {#sources}

Les cinq membres ont des contributions intégrées dans les trois sprints. Les tableaux relient les auteurs Git aux commits vérifiables et présentent les tâches et responsables du Project, permettant de suivre la participation à la réalisation du produit.

[GitHub Project](https://github.com/orgs/Seliganessecodigo/projects/2) · [Tasks](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/tasks.md) · [Git](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/historico.json)

## Preuves de qualité {#quality-evidence}

Code, tests automatisés, contrats et documentation forment une chaîne de vérification des livraisons. La matrice détaillée, le protocole d’utilisabilité et les documents techniques permettent d’examiner les parcours, critères de qualité et preuves de chaque dimension du projet.

[#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489) · [IHC05 / IHC06](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/usabilidade.md) · [Review](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/revisao-2026-11-22.md)
