# Vision et périmètre du produit

GreenER répond à trois questions : quelles applications sont suivies, quelles preuves étayent leur consommation et comment interpréter énergie et émissions estimées. Découverte, métriques, contexte régional et historique facilitent investigation et priorisation.

## Publics

| Public | Besoin |
| --- | --- |
| Gestion d’infrastructure | Identifier les applications et les changements de l’environnement. |
| Analyse opérationnelle et environnementale | Étudier des périodes, comparer des résultats compatibles et comprendre les lacunes. |
| Développement et évaluation | Reproduire l’environnement et démontrer les critères d’acceptation. |

Ces publics ne constituent pas la matrice définitive des permissions, encore [à définir](./decisions).

## Périmètre et disponibilité

Référence : code `develop` au 23/10/2026 (commit `1633ca2`). Chaque environnement peut exécuter une révision différente ; une issue fermée ne prouve pas la disponibilité en production.

| Capacité | Situation |
| --- | --- |
| Catalogue, recherche, filtres, pagination, navigation et huit langues | Implémentés dans l’interface. |
| Découverte, cycle de vie, collecte périodique, incidents et persistance | Implémentés dans le backend. |
| État opérationnel, métriques sources, preuves et méthode de collecte | Disponibles dans l’API et le détail ; une page explique le modèle, la formule, les paramètres et le facteur enregistrés sans recalcul. Erreurs, absences et données anciennes restent distinctes. |
| Analyse environnementale, séries temporelles et inspection des contributions par application | Disponibles dans l’API et intégrées au détail de l’application. |
| Résumé environnemental agrégé | Endpoint disponible (`GET /analysis/summary`) ; pas encore de tableau de bord agrégé dans l’interface. |
| Thème clair/sombre | Disponible comme préférence de l’interface. |

## Parcours et valeur

1. Trouver une application, ouvrir son détail et vérifier identité, localisation et état.
2. Étudier un changement en distinguant dernière tentative, dernière observation valide et absence.
3. Dans le détail, choisir période et granularité, interpréter série/couverture et examiner les contributions d’un bucket sans transformer les lacunes en zéro.

Le [guide](../guide/monitoring) décrit l’existant ; les [épopées](../roadmap), le comportement attendu.

## Limites et évaluation

Les estimations ne sont ni des mesures électriques directes ni une preuve d’économies causées par une action. L’efficacité par transaction exige des données de travail produit. La série du détail compare une application à la fenêtre immédiatement précédente de même durée ; cela ne fournit ni comparaison entre applications ni comparaison de périodes dans un tableau de bord. La carte est facultative.

En review, vérifier la recherche d’applications, la distinction zéro/absence et la traçabilité vers période, unité et preuves. Enregistrer difficultés, retours et changements dans [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133) et [#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Les objectifs de durée, satisfaction et performance nécessitent une référence et une approbation.
