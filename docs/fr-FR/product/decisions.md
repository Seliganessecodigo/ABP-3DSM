# Principes d’ingénierie

Épopées, récits et tâches structurent le produit avec des critères vérifiables et des références au code. Issues, pull requests et commits relient exigences, implémentation et tests ; la documentation rassemble architecture, contrats, exploitation et preuves dans un ensemble versionné.

## Règles du produit {#rules}

| Règle | Signification |
| --- | --- |
| Historique conservé | Modifier les préférences ou générer un aperçu ne remplace pas les originaux. |
| Absence explicite | Pannes, métriques manquantes et données anciennes se distinguent de zéro. |
| Consultation publique | Lire les indicateurs est public ; sauvegarder des préférences et administrer des comptes exige une autorisation. |

## Capacités intégrées {#planned}

La plateforme propose comparaison d’applications, classement environnemental, simulation régionale, gestion des utilisateurs et des rôles, récupération de mot de passe et contrôles de surveillance. JWT, Google SSO et le second facteur TOTP protègent les parcours administratifs, tandis que les consultations environnementales restent publiques.

## Modèle d’estimation {#method}

L’énergie est estimée par un modèle simplifié utilisant CPU, mémoire, disque et réseau durant l’intervalle. La puissance estimée devient énergie selon la durée. Les émissions sont l’énergie multipliée par l’intensité carbone régionale. Les coefficients appartiennent au modèle académique ; ce ne sont ni des mesures électriques directes ni des facteurs régionaux officiels. Les résultats conservent méthode et facteur d’origine.

## Critères d’acceptation {#acceptance}

L’interface associe les indicateurs à leur période, unité, couverture et méthodologie, tout en conservant les filtres et le contexte de navigation. Chargement, absence de résultats, erreurs et données anciennes sont traités explicitement. Clavier, focus visible, texte en complément des couleurs, mobile, thèmes et 12 langues font partie de l’expérience.

## Lectures associées {#related}

[Backlog du produit](../roadmap) · [Méthodologie et données](../product/methodology)
