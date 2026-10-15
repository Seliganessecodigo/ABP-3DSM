# Décisions, dépendances et sources

Ce registre rend les choix visibles sans approuver une fonctionnalité par omission. Le PDF v1.1 reste historique ; Markdown évolue par PR et doit rester aligné aux issues.

## Décisions confirmées

| ID | Décision | Conséquence |
| --- | --- | --- |
| D01 | Aperçu de recalcul sans enregistrement. | Original intact, aperçu exclu des totaux/historique. US-12, #263/#264. |
| D02 | Première absence dans un snapshot complet valide confirme retrait. | Échec source/404 métriques ne retire pas. US-02, #171. |
| D03 | Réception GreenER distincte de l’horodatage source. | Identifier intervalles dérivés ; ne pas inventer de validité. #154/#155. |
| D04 | RNFs transversaux, fondations/qualité dans EP00. | Tâches achevées ne dispensent pas de qualité future. |
| D05 | Simulation régionale à énergie constante. | Scénario sans modification des mesures/résultats officiels. US-15. |

D01 et EP00 confirmés le 15/10/2026 ; autres règles dans backlog et contrats versionnés.

## Décisions en attente

| Sujet | À résoudre | Livraisons |
| --- | --- | --- |
| Énergie | Formule, coefficients, conversions, hypothèses. | #49/#53/#58 |
| Temps/couverture | Bornes, fuseau, granularité, arrondi, résultats partiels. | #49/#156/#174/#175/#178 |
| Recalcul | Permissions, limites volume/période, choix du facteur. | #91/#263/#264 |
| Accès/comptes | Rôles, bootstrap, sessions, mots de passe/récupération. | #90/#91/#158/#160/#245 |
| Sources/exploitation | Timeout, retry, quotas, concurrence, retards. | #155/#243 |
| Continuité | Rétention, sauvegarde/restauration, disponibilité/performance. | #110/#120/#125/#166 |
| Extras Figma | CSV, colonnes, période précédente, efficacité par transaction. | #61/#248/#252 |

Le PO tranche périmètre/comportement avec les responsables techniques ; contrats source à confirmer avec le fournisseur. Ni dates ni personnes ne sont supposées.

## Sources et changements

Markdown : vision/règles. Issues : critères, tâches, dépendances, discussion. Projects : priorité, état, Sprint, dates, PRs ; ne prouve pas l’implémentation. Figma : intention visuelle/handoff, pas contrat tiré de chiffres illustratifs. OpenAPI/code : révision exposée. Contrats externes : schémas/unités avec version/date.

En cas de divergence, expliciter, décider avec le responsable et synchroniser les sources. Figma n’autorise pas un endpoint inventé. Issue/PR : décision, motif, alternatives pertinentes, impact sur histoires/données/compatibilité et preuves. Choix architecturaux durables : ADR. Voir [backlog](../roadmap) et [qualité](./quality).
