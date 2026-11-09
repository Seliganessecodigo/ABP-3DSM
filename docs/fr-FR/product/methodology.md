# Méthodologie et données

L’énergie est estimée par un modèle simplifié utilisant CPU, mémoire, disque et réseau durant l’intervalle. La puissance estimée devient énergie selon la durée. Les émissions sont l’énergie multipliée par l’intensité carbone régionale. Les coefficients appartiennent au modèle académique ; ce ne sont ni des mesures électriques directes ni des facteurs régionaux officiels. Les résultats conservent méthode et facteur d’origine.

## Interpréter les données {#vocabulary}

| Concept | Signification |
| --- | --- |
| Application | Service doté d’une identité stable dans le catalogue. |
| Observation | Ensemble de métriques associé à un intervalle. |
| Énergie | Quantité estimée sur une période, en kWh. |
| Intensité carbone | Facteur régional, en gCO₂e/kWh. |
| Émissions | Quantité équivalente de CO₂ avec unité précisée. |
| Couverture | Part de la période étayée par des preuves valides. |

## Modèle d’estimation {#model}

| Paramètre | Valeur |
| --- | --- |
| CPU (100%) | 100 W |
| Mémoire | 0.375 W/GB |
| Disque | 0.01 W/GB |
| Réseau | 0.02 W/GB |

```text
P [W] = P_CPU + P_RAM + P_disk + P_network
E [kWh] = P [W] × Δt [h] / 1000
CO₂e [g] = E [kWh] × I [gCO₂e/kWh]
```

## Comprendre la couverture {#coverage}

La couverture est la proportion de la période étayée par des observations valides. Énergie et émissions ont des couvertures distinctes : l’énergie peut être estimée sans facteur permettant de calculer les émissions. Comparez périodes, unités et couvertures compatibles. Une faible couverture indique une analyse partielle, pas une baisse prouvée de consommation.

Zéro signifie qu’une observation valide justifie cette valeur. Une lacune indique des données inutilisables ou absentes, pas une consommation nulle. Après un échec de mise à jour, la dernière lecture valide peut rester affichée avec son horaire initial. Vérifiez actualisation et couverture avant de décider. Les écrans interrogent les données 60 secondes après chaque tentative ; cela ne garantit pas une nouvelle mesure.

## Périodes et historique {#history}

| Règle | Signification |
| --- | --- |
| Historique conservé | Modifier les préférences ou générer un aperçu ne remplace pas les originaux. |
| Absence explicite | Pannes, métriques manquantes et données anciennes se distinguent de zéro. |
| Consultation publique | Lire les indicateurs est public ; sauvegarder des préférences et administrer des comptes exige une autorisation. |

Dans l’aperçu de recalcul, choisissez application et dates pour comparer l’original à une estimation avec le modèle actuel et les facteurs actuels des régions observées. Le dernier jour est entièrement inclus en UTC. Limites : 30 jours et 10 000 observations. L’aperçu n’est pas sauvegardé et ne modifie pas l’historique. Les écarts en pourcentage exigent unités et couvertures identiques et une valeur originale positive.

## Lectures associées {#related}

[Guide d’utilisation](../guide/monitoring) · [Référence de l’API](../reference/api)
