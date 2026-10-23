# Utiliser le catalogue et étudier une application

Ce guide couvre le catalogue, le détail opérationnel et l’analyse environnementale par application, disponibles dans l’interface. Le résumé agrégé existe dans l’API, mais le tableau de bord, le classement, la comparaison et l’administration restent prévus dans les [épopées](../roadmap).

## Trouver une application

1. Ouvrir le frontend ; en local, suivre [Démarrage](../getting-started).
2. Rechercher par nom, ID, code régional ou région et combiner le filtre d’état.
3. Parcourir les pages. Supprimer les filtres avant de confondre absence de correspondance et catalogue vide.
4. Vérifier ID et localisation dans le détail. Une ville nulle est valide ; une localisation historique incomplète est inconnue.

L’URL conserve `q`, `state` et `page`. Garder le lien pour retrouver le contexte. Les filtres sont actuellement appliqués côté frontend à la liste de l’API.

## Actualisation

Catalogue et détail interrogent l’API à l’ouverture, puis 60 secondes après la fin de chaque tentative. Ce polling est indépendant de la collecte backend et de l’intervalle de l’agrégateur ; rafraîchir l’écran ne garantit pas une nouvelle observation.

L’interface affiche l’heure de tentative et de réponse valide. Après un succès, un échec conserve les anciennes données sans en faire une nouvelle observation. L’actualisation manuelle du catalogue permet de réessayer sans recharger. Quitter l’écran annule les requêtes en cours.

## Analyser les résultats environnementaux

Dans le détail d’une application, choisissez une fenêtre glissante de 24 heures, 7, 30 ou 90 jours et une granularité horaire, quotidienne, mensuelle ou annuelle. La série présente l’énergie et le CO₂e des résultats persistés. La superposition compare la fenêtre choisie à la fenêtre précédente de même durée. Il s’agit d’une comparaison temporelle pour une application, pas d’un classement ni d’une comparaison entre applications.

Utilisez les filtres et le tri du tableau pour trouver une période. Inspectez-la pour consulter les contributions incluses et les exclusions avec leurs motifs. Le tableau est paginé ; l’interface ne charge actuellement que la première page des contributions. Les lacunes et exclusions ne valent pas zéro. Sans preuve calculable, le résultat reste indisponible.

## Interpréter les situations

Pour retracer un indicateur, ouvrez **Voir la méthodologie complète** dans le détail de l’application. Vous pouvez aussi choisir **Méthodologie** dans la navigation et sélectionner une application. La page présente le modèle, la formule, les paramètres et hypothèses enregistrés, ainsi que les détails du facteur carbone lorsqu’ils sont disponibles. Le lien du détail utilise la collecte sélectionnée ; la navigation utilise la dernière collecte valide. La page explique les preuves enregistrées sans recalculer le résultat.

| Situation | Signification / action |
| --- | --- |
| Catalogue vide | API sans applications ; vérifier la découverte initiale. |
| Aucune correspondance | Ajuster les filtres ; d’autres applications peuvent exister. |
| Échec initial | Pas de données valides ; réessayer et vérifier l’exploitation. |
| Échec après succès | Conserver la lecture précédente et regarder son heure. |
| Application introuvable | Vérifier ID/lien ; différent d’une application connue retirée. |
| Application retirée | Identité/historique conservés ; absence confirmée par snapshot valide. |

## État, langue et assistance

`AVAILABLE`, `UNAVAILABLE`, `NO_METRICS` et `REMOVED` sont des états opérationnels. Fraîcheur, motif et calculabilité sont distincts. Une application disponible peut manquer de facteur carbone ; une indisponible peut avoir un historique valide. Le détail affiche l’état, les métriques, les résultats environnementaux, la série historique et les contributions consultables par période. Consultez la [référence API](../reference/api) et la [méthodologie](../product/methodology) pour distinguer absence, erreur et zéro.

Le sélecteur propose huit langues et mémorise la préférence dans ce navigateur. La langue ne change ni identité ni instants.

Signaler environnement, ID, filtres, date/heure avec fuseau, action et résultat attendu/observé. Exclure secrets/données privées des captures et suivre [Exploitation](../operations).

## Préférence de thème

Dans les préférences de navigation, utilisez l’interrupteur **Mode sombre** : désactivé pour le thème clair, activé pour le thème sombre. Lors de la première visite, GreenER suit l’apparence du système, y compris ses changements pendant l’utilisation, jusqu’à l’activation de l’interrupteur. Votre choix explicite prévaut ensuite ; cette interface ne propose pas d’action pour rétablir le suivi du système.

Le choix s’applique au catalogue, aux détails et à la présentation globale sans modifier les filtres ni les données. Il est conservé dans ce navigateur sous `greener-theme` pour la prochaine visite. Si le stockage est bloqué, le choix fonctionne pendant la session mais peut être perdu au rechargement.
