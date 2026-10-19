# Méthodologie et sens des données

Les données gardent leur sens : absence, erreur et données périmées ne valent pas zéro. L’énergie est estimée par le modèle simplifié à paramètres versionnés ; ce n’est pas une mesure électrique réelle et ses paramètres ne sont pas un facteur régional officiel. La relation de conversion CO₂e est implémentée dans #49/#53.

## Vocabulaire et unités

| Concept | Sens |
| --- | --- |
| Application | Identité stable ; nom/localisation peuvent changer. |
| Observation/collecte | Métriques persistées liées à une application et un intervalle. |
| Cycle | Exécution de découverte, réconciliation et collecte ; pas une mesure individuelle. |
| Énergie | Quantité cumulée en kWh, distincte de la puissance. |
| Intensité carbone | Facteur régional fourni en gCO₂e/kWh. |
| CO₂e | Émissions équivalentes avec unité et facteur identifiés. |
| Couverture | Part de la période demandée étayée par des preuves valides, calculée séparément pour énergie et CO₂e. |
| Stale | Ancienne observation valide conservée, pas réussite de la tentative actuelle. |

L’agrégateur documente CPU en %, mémoire, disque et réseau en GB. Ce ne sont pas des kWh ; conversion, modèle, coefficients et hypothèses doivent être documentés.

## Temps et provenance

La source ne publie pas d’horodatage de mesure. GreenER conserve la réception et dérive `[receivedAt - collection_interval_seconds, receivedAt]` sans prouver les instants exacts de la mesure d’origine.

Dernière tentative, observation valide et mise à jour du registre sont distinctes. La consultation d’un facteur ne prouve pas sa validité officielle. Le snapshot conserve valeur, identité interne, contrat et heure de consultation ; bibliographie/validité non publiées restent inconnues.

## Règles temporelles environnementales

Les requêtes utilisent des timestamps ISO à fuseau explicite normalisés en UTC et [from,to). Les buckets UTC horaires/journaliers/mensuels/annuels ne comptent que le chevauchement, y compris aux bords partiels. Presets 24h/7d/30d/90d : fenêtres mobiles exactes avec ancre commune KPI/série. Limite : 10 000 points ; rejet au-delà, sans troncature ni changement de granularité. La série répartit les résultats enregistrés sans recalculer les observations ; chevauchements départagés par collectedAt récent puis ID lexical croissant, sans repli si la métrique manque. Pas d’arrondi supplémentaire ; couvertures et snapshots restent distincts et préservés.

## Énergie et émissions

La relation dimensionnelle implémentée est :

    CO₂e [g] = énergie [kWh] × intensité [gCO₂e/kWh]

Exemple pédagogique : 2 kWh × 100 gCO₂e/kWh = 200 gCO₂e = 0,2 kgCO₂e. Ni facteurs approuvés ni mesures du produit. Cette relation ne définit pas l’estimation d’énergie à partir de CPU/mémoire/disque/réseau.

Sans facteur, une énergie valide reste valide mais CO₂e peut être non calculable. Zéro exige une preuve valide.

## Historique et scénarios

| Résultat | Règle |
| --- | --- |
| Original | Conserver observations, configuration, méthodologie et facteur utilisés. |
| Aperçu de recalcul | Configuration actuelle identifiée, sans enregistrement/remplacement ; permissions, limites et facteur à définir. |
| Simulation régionale | Énergie constante, autre facteur, séparée des résultats officiels. |

Totaux, classements et comparaisons exigent des périodes et couvertures compatibles. Les lacunes ne deviennent pas zéro et les pourcentages exigent un dénominateur valide. La sémantique approuvée est ci-dessus. En persistance, énergie, émissions en grammes et facteur ont huit décimales ; la couverture, fraction de zéro à un, en a quatre. Les calculs ne arrondissent pas les intermédiaires et les snapshots JSON gardent leur représentation d’origine.
