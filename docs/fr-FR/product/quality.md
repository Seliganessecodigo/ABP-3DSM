# Qualité et acceptation

L’interface associe les indicateurs à leur période, unité, couverture et méthodologie, tout en conservant les filtres et le contexte de navigation. Chargement, absence de résultats, erreurs et données anciennes sont traités explicitement. Clavier, focus visible, texte en complément des couleurs, mobile, thèmes et 12 langues font partie de l’expérience.

## Critères d’acceptation {#acceptance}

| Règle | Signification |
| --- | --- |
| Historique conservé | Modifier les préférences ou générer un aperçu ne remplace pas les originaux. |
| Absence explicite | Pannes, métriques manquantes et données anciennes se distinguent de zéro. |
| Consultation publique | Lire les indicateurs est public ; sauvegarder des préférences et administrer des comptes exige une autorisation. |

## Interpréter les données {#integrity}

Zéro signifie qu’une observation valide justifie cette valeur. Une lacune indique des données inutilisables ou absentes, pas une consommation nulle. Après un échec de mise à jour, la dernière lecture valide peut rester affichée avec son horaire initial. Vérifiez actualisation et couverture avant de décider. Les écrans interrogent les données 60 secondes après chaque tentative ; cela ne garantit pas une nouvelle mesure.

La couverture est la proportion de la période étayée par des observations valides. Énergie et émissions ont des couvertures distinctes : l’énergie peut être estimée sans facteur permettant de calculer les émissions. Comparez périodes, unités et couvertures compatibles. Une faible couverture indique une analyse partielle, pas une baisse prouvée de consommation.

## Critères de validation {#assessment}

Épopées, récits et tâches structurent le produit avec des critères vérifiables et des références au code. Issues, pull requests et commits relient exigences, implémentation et tests ; la documentation rassemble architecture, contrats, exploitation et preuves dans un ensemble versionné.

## Vérifications {#engineering}

Pour la base documentée, la CI a validé 542 tests frontend, 705 tests backend et trois parcours intégrés, ainsi que lint, typage, builds, migrations et le gate SonarQube Cloud. Le site propose 12 langues avec vérification automatique de l’équivalence du contenu, des contrats et des liens.

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

[Contribuer](../contributing)

## Lectures associées {#related}

[Principes d’ingénierie](../product/decisions) · [Contribuer](../contributing)
