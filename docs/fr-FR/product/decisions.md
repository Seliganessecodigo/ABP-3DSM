# Décisions et dépendances

Les changements de périmètre et de règles consignent problème, résultat attendu et critères d’acceptation dans les récits concernés. Revues et évaluations d’utilisabilité enregistrent difficultés, retours et améliorations. Rétention, sauvegarde/reprise, objectifs opérationnels et quotas externes restent à définir.

## Règles du produit {#rules}

| Règle | Signification |
| --- | --- |
| Historique conservé | Modifier les préférences ou générer un aperçu ne remplace pas les originaux. |
| Absence explicite | Pannes, métriques manquantes et données anciennes se distinguent de zéro. |
| Consultation publique | Lire les indicateurs est public ; sauvegarder des préférences et administrer des comptes exige une autorisation. |

## Évolutions prévues {#planned}

Sont prévus : comparaison dédiée entre applications, simulation dans une autre région, gestion complète utilisateurs/rôles, récupération autonome du mot de passe, contrôles globaux de surveillance. Le périmètre de l’export CSV reste à définir. Le tableau de bord trie déjà par énergie ou émissions. Les priorités sont dans le backlog ; aucune date n’est fixée ici.

## Modèle d’estimation {#method}

L’énergie est estimée par un modèle simplifié utilisant CPU, mémoire, disque et réseau durant l’intervalle. La puissance estimée devient énergie selon la durée. Les émissions sont l’énergie multipliée par l’intensité carbone régionale. Les coefficients appartiennent au modèle académique ; ce ne sont ni des mesures électriques directes ni des facteurs régionaux officiels. Les résultats conservent méthode et facteur d’origine.

## Critères d’acceptation {#acceptance}

Le produit doit permettre de trouver une application, distinguer zéro de l’absence et relier un indicateur à sa période, son unité, sa couverture et sa méthode. Les consultations préservent le contexte et indiquent chargement, vide, panne et données anciennes. L’évaluation inclut clavier, focus visible, texte au-delà des couleurs, mobiles et 12 langues.

## Lectures associées {#related}

[Backlog du produit](../roadmap) · [Méthodologie et données](../product/methodology)
