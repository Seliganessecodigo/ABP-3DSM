# Vision et périmètre du produit

GreenER répond à trois questions : quelles applications sont suivies, quelles preuves étayent leur consommation et comment interpréter énergie et émissions estimées. Découverte, métriques, contexte régional et historique facilitent investigation et priorisation.

## Publics

| Public | Besoin |
| --- | --- |
| Gestion d’infrastructure | Identifier les applications et les changements de l’environnement. |
| Analyse opérationnelle et environnementale | Étudier des périodes, comparer des résultats compatibles et comprendre les lacunes. |
| Développement et évaluation | Reproduire l’environnement et démontrer les critères d’acceptation. |

Tableau de bord et consultations environnementales publics. `/login` accepte e-mail/mot de passe ou Google activé. Admin configure/confirme un TOTP à six chiffres, même après Google ; Analyst et Visitor n’obtiennent pas les droits administratifs. Session frontend en mémoire : rechargement exige une reconnexion. Backend vérifie JWT, session, rôle et état actuels : 401 pour identifiants absents/invalides, 403 pour rôle insuffisant. Nouvelles routes protégées par défaut.

## Périmètre et disponibilité

Référence : `origin/develop`, commit `c343698`, vérifié le 08/11/2026. Un environnement peut exécuter une autre révision ; fusionner ne prouve pas le déploiement.

| Capacité | Situation |
| --- | --- |
| Catalogue, recherche, filtres, pagination, navigation et douze langues | Implémentés dans l’interface. |
| Découverte, cycle de vie, collecte périodique, incidents et persistance | Implémentés dans le backend. |
| État opérationnel, métriques sources, preuves et méthode de collecte | Disponibles dans l’API et le détail ; une page explique le modèle, la formule, les paramètres et le facteur enregistrés sans recalcul. Erreurs, absences et données anciennes restent distinctes. |
| Analyse environnementale, séries temporelles et inspection des contributions par application | Disponibles dans l’API et intégrées au détail de l’application. |
| `/dashboard` · `GET /analysis/summary` | Dans `/dashboard`, choisir 24 heures, 7, 30 ou 90 jours, état et région. Consulter totaux, couverture, états et composition des émissions en barres ou anneau. Recherche, filtres de colonnes, tri énergie/CO₂e et pagination concernent la table ; ils ne redéfinissent pas les totaux. Ouvrir une application pour examiner les preuves. `GET /analysis/summary` est actualisé périodiquement sans rechargement. |
| Thème clair/sombre | Disponible comme préférence de l’interface. |

## Parcours et valeur

1. Trouver une application, ouvrir son détail et vérifier identité, localisation et état.
2. Étudier un changement en distinguant dernière tentative, dernière observation valide et absence.
3. Dans le détail, choisir période et granularité, interpréter série/couverture et examiner les contributions d’un bucket sans transformer les lacunes en zéro.

Le [guide](../guide/monitoring) décrit l’existant ; les [épopées](../roadmap), le comportement attendu.

## Limites et évaluation

Les estimations ne sont ni des mesures électriques directes ni une preuve d’économies causées par une action. L’efficacité par transaction exige des données de travail produit. La série du détail compare une application à la fenêtre immédiatement précédente de même durée ; cela ne fournit ni comparaison entre applications ni comparaison de périodes dans un tableau de bord. La carte est facultative.

En review, vérifier la recherche d’applications, la distinction zéro/absence et la traçabilité vers période, unité et preuves. Enregistrer difficultés, retours et changements dans [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133) et [#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Les objectifs de durée, satisfaction et performance nécessitent une référence et une approbation.

## Guide d’utilisation

Dans `/history`, choisir une application. `applicationId`, période et granularité restent dans l’URL. Série persistée, filtres, fuseau d’affichage, événements, pages numérotées et inspection des buckets sont disponibles. Les contributions ont une pagination interactive de 5, 10, 15, 20 ou tous les éléments. Les buckets restent UTC ; changer l’affichage ne les regroupe pas. Le détail superpose la fenêtre précédente équivalente de la même application.

Dans `/administration/calculations`, comparer original et aperçu par application et dates. Le dernier jour inclut la journée UTC entière ; l’API reçoit `[from,to)`. Aperçu public avec modèle actuel et facteurs actuels des régions historiques, sans sauvegarde. Limites : 30 jours et 10 000 observations. Réponse : `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Un facteur indisponible conserve l’énergie calculable. Les pourcentages exigent unités/couvertures égales et référence positive.

`/methodology` propose énergie, émissions, couverture et analyse, avec exemples et préférences personnelles. Tout rôle connecté sauvegarde ses propres onglets avec révision optimiste ; 409 signale un conflit. Les seuils d’affichage ne modifient ni calcul, ni configuration globale, ni notifications externes. Période/granularité complètent uniquement les paramètres URL absents. Méthodologie historique : `/services/:id/methodology` avec `collectionId` sélectionné.

Admin de la même organisation change les comptes entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, avec `expectedStatus` et motif. Blocage/désactivation révoquent toutes les sessions ; réactivation impose une nouvelle connexion. Protection du propre compte et du dernier Admin actif. Conflit : 409 ; cible déjà atteinte : succès idempotent. Audit partagé : succès dans la transaction, refus hors transaction annulée, acteur explicite et aucun secret. Cette route ne fournit pas la gestion complète des rôles ou la récupération du mot de passe.
