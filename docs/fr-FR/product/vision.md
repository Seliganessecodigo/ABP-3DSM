# Vision et périmètre

GreenER réunit surveillance continue, estimations d’énergie et de CO₂e et analyse environnementale dans une plateforme intégrée. Catalogue dynamique, tableau de bord, historique, classement, comparaison et simulation régionale relient la vue générale à l’étude de chaque application, avec des indicateurs traçables jusqu’aux données et à la méthodologie d’origine.

## Publics concernés {#readers}

| Public | Besoin |
| --- | --- |
| Gestion d’infrastructure | Identifier les applications et suivre les changements de l’environnement. |
| Analyse environnementale et opérationnelle | Étudier consommation, émissions et qualité des données d’une période. |
| Développement et évaluation | Vérifier le comportement du produit et reproduire ses résultats. |

## Fonctions disponibles {#features}

| Fonction | Référence |
| --- | --- |
| Catalogue et recherche | [Trouver une application](../guide/monitoring#catalog) |
| Surveillance automatique | [Interpréter les données](../guide/monitoring#data) |
| Tableau de bord environnemental | [Lire le tableau de bord](../guide/monitoring#dashboard) |
| Détail de l’application | [Examiner le détail](../guide/monitoring#detail) |
| Historique et composition | [Explorer l’historique](../guide/monitoring#history) |
| Préférences personnelles | [Personnaliser l’analyse](../guide/monitoring#preferences) |
| Connexion et second facteur | [Se connecter](../guide/monitoring#access) |
| Classement environnemental | [Classement environnemental](../guide/monitoring#other) |
| Comparaison des applications | [Comparaison des applications](../guide/monitoring#other) |
| Simulation régionale | [Simulation régionale](../guide/monitoring#other) |
| Comptes et récupération de mot de passe | [Comptes et récupération de mot de passe](../guide/monitoring#other) |

## Parcours d’analyse {#journey}

Commencez par le résumé environnemental, repérez une application à examiner et ouvrez son détail. Utilisez l’historique pour étudier la période et la méthodologie pour comprendre les estimations. Tenez toujours compte de la couverture avant de comparer.

## Limites d’utilisation {#limits}

L’énergie est estimée par un modèle simplifié utilisant CPU, mémoire, disque et réseau durant l’intervalle. La puissance estimée devient énergie selon la durée. Les émissions sont l’énergie multipliée par l’intensité carbone régionale. Les coefficients appartiennent au modèle académique ; ce ne sont ni des mesures électriques directes ni des facteurs régionaux officiels. Les résultats conservent méthode et facteur d’origine.

La couverture est la proportion de la période étayée par des observations valides. Énergie et émissions ont des couvertures distinctes : l’énergie peut être estimée sans facteur permettant de calculer les émissions. Comparez périodes, unités et couvertures compatibles. Une faible couverture indique une analyse partielle, pas une baisse prouvée de consommation.

## Capacités intégrées {#planned}

La plateforme propose comparaison d’applications, classement environnemental, simulation régionale, gestion des utilisateurs et des rôles, récupération de mot de passe et contrôles de surveillance. JWT, Google SSO et le second facteur TOTP protègent les parcours administratifs, tandis que les consultations environnementales restent publiques.

## Lectures associées {#related}

[Guide d’utilisation](../guide/monitoring) · [Méthodologie et données](../product/methodology) · [Backlog du produit](../roadmap)
