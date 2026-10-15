# Méthodologie et sens des données

Absence, erreur et données périmées ne valent pas zéro. Les règles environnementales sont des exigences ; le modèle complet d’énergie et ses coefficients restent à approuver.

## Vocabulaire et unités

| Concept | Sens |
| --- | --- |
| Application | Identité stable ; nom/localisation peuvent changer. |
| Observation/collecte | Métriques persistées liées à une application et un intervalle. |
| Cycle | Exécution de découverte, réconciliation et collecte ; pas une mesure individuelle. |
| Énergie | Quantité cumulée en kWh, distincte de la puissance. |
| Intensité carbone | Facteur régional fourni en gCO₂e/kWh. |
| CO₂e | Émissions équivalentes avec unité et facteur identifiés. |
| Couverture | Partie de la période étayée par des preuves valides ; politique à définir. |
| Stale | Ancienne observation valide conservée, pas réussite de la tentative actuelle. |

L’agrégateur documente CPU en %, mémoire, disque et réseau en GB. Ce ne sont pas des kWh ; conversion, modèle, coefficients et hypothèses doivent être documentés.

## Temps et provenance

La source ne publie pas d’horodatage de mesure. GreenER conserve la réception et dérive `[receivedAt - collection_interval_seconds, receivedAt]` sans prouver les instants exacts de la mesure d’origine.

Dernière tentative, observation valide et mise à jour du registre sont distinctes. La consultation d’un facteur ne prouve pas sa validité officielle. Le snapshot conserve valeur, identité interne, contrat et heure de consultation ; bibliographie/validité non publiées restent inconnues.

## Énergie et émissions

Relation dimensionnelle prévue :

    CO₂e [g] = énergie [kWh] × intensité [gCO₂e/kWh]

Exemple pédagogique : 2 kWh × 100 gCO₂e/kWh = 200 gCO₂e = 0,2 kgCO₂e. Ni facteurs approuvés ni mesures du produit. Cette relation ne définit pas l’estimation d’énergie à partir de CPU/mémoire/disque/réseau.

Sans facteur, une énergie valide reste valide mais CO₂e peut être non calculable. Zéro exige une preuve valide.

## Historique et scénarios

| Résultat | Règle |
| --- | --- |
| Original | Conserver observations, configuration, méthodologie et facteur utilisés. |
| Aperçu de recalcul | Configuration actuelle identifiée, sans enregistrement/remplacement ; permissions, limites et facteur à définir. |
| Simulation régionale | Énergie constante, autre facteur, séparée des résultats officiels. |

Totaux, classement et comparaison exigent des périodes/couvertures compatibles. Ni zéros artificiels dans les lacunes, ni pourcentages sans dénominateur valide. Arrondi, bornes et granularité sont des [décisions en attente](./decisions).
