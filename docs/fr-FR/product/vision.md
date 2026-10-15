# Vision et périmètre du produit

GreenER répond à trois questions : quelles applications sont suivies, quelles preuves étayent leur consommation et comment interpréter énergie et émissions estimées. Découverte, métriques, contexte régional et historique facilitent investigation et priorisation.

## Publics

| Public | Besoin |
| --- | --- |
| Gestion d’infrastructure | Identifier les applications et les changements de l’environnement. |
| Analyse opérationnelle et environnementale | Étudier des périodes, comparer des résultats compatibles et comprendre les lacunes. |
| Administration | Modifier paramètres et accès avec autorisation et traçabilité. |
| Développement et évaluation | Reproduire l’environnement et démontrer les critères d’acceptation. |

Ces publics ne constituent pas la matrice définitive des permissions, encore [à définir](./decisions).

## Périmètre et disponibilité

Référence : code `develop` au 15/10/2026. Chaque environnement peut exécuter une révision différente ; une issue fermée ne prouve pas la disponibilité en production.

| Capacité | Situation |
| --- | --- |
| Catalogue, recherche/filtre d’état, navigation et huit langues | Implémentés dans l’interface. |
| Découverte, événements du cycle de vie, collecte périodique et persistance | Implémentés dans le backend. |
| État opérationnel et preuves des collectes | Exposés par l’API ; présentation complète confiée à des tâches UI. |
| Tableau de bord environnemental, énergie/CO₂e, séries, classement et comparaison | Périmètre prévu. |
| Thèmes, authentification, administration, simulation régionale et aperçu de recalcul | Prévus avec dépendances dans le backlog. |

## Parcours et valeur

1. Trouver une application, ouvrir son détail et vérifier identité, localisation et état.
2. Étudier un changement en distinguant dernière tentative, dernière observation valide et absence.
3. Dans le périmètre environnemental prévu, choisir une période, lire couverture/méthodologie et comparer le même contexte.
4. Dans l’administration prévue, modifier les paramètres autorisés sans réécrire l’historique.

Le [guide](../guide/monitoring) décrit l’existant ; les [épopées](../roadmap), le comportement attendu.

## Limites et évaluation

Les estimations ne sont ni des mesures électriques directes ni une preuve d’économies causées par une action. L’efficacité par transaction exige des données de travail produit. CSV, colonnes configurables et période précédente ne font pas automatiquement partie du MVP parce qu’ils figurent dans Figma. La carte est facultative.

En review, vérifier la recherche d’applications, la distinction zéro/absence et la traçabilité vers période, unité et preuves. Enregistrer difficultés, retours et changements dans [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133) et [#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Les objectifs de durée, satisfaction et performance nécessitent une référence et une approbation.
