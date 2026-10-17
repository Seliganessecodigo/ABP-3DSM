# Utiliser le catalogue et étudier une application

Ce guide couvre le catalogue et le détail opérationnel existants. Tableau de bord environnemental, analyses et administration restent prévus dans les [épopées](../roadmap).

## Trouver une application

1. Ouvrir le frontend ; en local, suivre [Démarrage](../getting-started).
2. Rechercher par nom, ID, code régional ou région et combiner le filtre d’état.
3. Parcourir les pages. Supprimer les filtres avant de confondre absence de correspondance et catalogue vide.
4. Vérifier ID et localisation dans le détail. Une ville nulle est valide ; une localisation historique incomplète est inconnue.

L’URL conserve `q`, `state` et `page`. Garder le lien pour retrouver le contexte. Les filtres sont actuellement appliqués côté frontend à la liste de l’API.

## Actualisation

Catalogue et détail interrogent l’API à l’ouverture, puis 60 secondes après la fin de chaque tentative. Ce polling est indépendant de la collecte backend et de l’intervalle de l’agrégateur ; rafraîchir l’écran ne garantit pas une nouvelle observation.

L’interface affiche l’heure de tentative et de réponse valide. Après un succès, un échec conserve les anciennes données sans en faire une nouvelle observation. L’actualisation manuelle du catalogue permet de réessayer sans recharger. Quitter l’écran annule les requêtes en cours.

## Interpréter les situations

| Situation | Signification / action |
| --- | --- |
| Catalogue vide | API sans applications ; vérifier la découverte initiale. |
| Aucune correspondance | Ajuster les filtres ; d’autres applications peuvent exister. |
| Échec initial | Pas de données valides ; réessayer et vérifier l’exploitation. |
| Échec après succès | Conserver la lecture précédente et regarder son heure. |
| Application introuvable | Vérifier ID/lien ; différent d’une application connue retirée. |
| Application retirée | Identité/historique conservés ; absence confirmée par snapshot valide. |

## État, langue et assistance

`AVAILABLE`, `UNAVAILABLE`, `NO_METRICS` et `REMOVED` sont des états opérationnels. Fraîcheur, motif et calculabilité sont distincts. Une application disponible peut manquer de facteur carbone ; une indisponible peut avoir un historique valide. Les preuves sont déjà dans l’API ; leur présentation complète a ses tâches UI. Lire la [méthodologie](../product/methodology).

Le sélecteur propose huit langues et mémorise la préférence dans ce navigateur. La langue ne change ni identité ni instants.

Signaler environnement, ID, filtres, date/heure avec fuseau, action et résultat attendu/observé. Exclure secrets/données privées des captures et suivre [Exploitation](../operations).

## Préférence de thème

Dans les préférences de navigation, choisissez **Clair** ou **Sombre**. **Utiliser le thème du système** rétablit le suivi automatique de l’apparence du système, y compris ses changements pendant l’utilisation. Lors de la première visite, GreenER suit le système.

Le choix s’applique au catalogue, aux détails et à la présentation globale sans modifier les filtres ni les données. Il est conservé dans ce navigateur sous `greener-theme` pour la prochaine visite. Si le stockage est bloqué, le choix fonctionne pendant la session mais peut être perdu au rechargement.
