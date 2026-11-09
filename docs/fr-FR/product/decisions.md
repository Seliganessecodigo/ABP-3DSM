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
| D06 | Les échecs de surveillance ont un incident par identité et récupèrent après trois observations valides consécutives. | Délai total de 30 s par appel externe, trois tentatives HTTP maximum, appel initial inclus, retries limités aux erreurs temporaires ; les cycles ne se chevauchent pas et les observations valides sont conservées. #243. |
| D07 | Requêtes à fuseau explicite normalisées en UTC, [from,to), buckets UTC horaires/journaliers/mensuels/annuels, ancre unique et rejet au-delà de 10 000 points. | #174/#235. |
| D08 | Séries sur résultats enregistrés répartis par chevauchement, sans recalcul historique ; conflits par collecte récente/ID lexical croissant ; lacunes et snapshots préservés. | #164/#174/#235. |

D01 et EP00 confirmés le 15/10/2026 ; autres règles dans backlog et contrats versionnés.

## Décisions en attente

| Sujet | À résoudre | Livraisons |
| --- | --- | --- |
| Sources/exploitation | Confirmer quotas et limites de concurrence avec les responsables des API. La politique timeout/retry/retards de #243 est approuvée. | #155/#243 |
| Continuité | Rétention, sauvegarde/restauration, disponibilité/performance. | #110/#120/#125/#166 |
| Extras Figma | CSV, colonnes et efficacité par transaction. Le détail superpose déjà la série à la période précédente équivalente ; la comparaison entre applications et le tableau de bord temporel restent hors de ce périmètre. | #61/#248/#252 |

Le PO tranche périmètre/comportement avec les responsables techniques ; contrats source à confirmer avec le fournisseur. Ni dates ni personnes ne sont supposées.

## Sources et changements

Markdown : vision/règles. Issues : critères, tâches, dépendances, discussion. Projects : priorité, état, Sprint, dates, PRs ; ne prouve pas l’implémentation. Figma : intention visuelle/handoff, pas contrat tiré de chiffres illustratifs. OpenAPI/code : révision exposée. Contrats externes : schémas/unités avec version/date.

En cas de divergence, expliciter, décider avec le responsable et synchroniser les sources. Figma n’autorise pas un endpoint inventé. Issue/PR : décision, motif, alternatives pertinentes, impact sur histoires/données/compatibilité et preuves. Choix architecturaux durables : ADR. Voir [backlog](../roadmap) et [qualité](./quality).

## Décisions et dépendances — c343698

Dans `/administration/calculations`, comparer original et aperçu par application et dates. Le dernier jour inclut la journée UTC entière ; l’API reçoit `[from,to)`. Aperçu public avec modèle actuel et facteurs actuels des régions historiques, sans sauvegarde. Limites : 30 jours et 10 000 observations. Réponse : `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Un facteur indisponible conserve l’énergie calculable. Les pourcentages exigent unités/couvertures égales et référence positive.

Tableau de bord et consultations environnementales publics. `/login` accepte e-mail/mot de passe ou Google activé. Admin configure/confirme un TOTP à six chiffres, même après Google ; Analyst et Visitor n’obtiennent pas les droits administratifs. Session frontend en mémoire : rechargement exige une reconnexion. Backend vérifie JWT, session, rôle et état actuels : 401 pour identifiants absents/invalides, 403 pour rôle insuffisant. Nouvelles routes protégées par défaut.

Admin de la même organisation change les comptes entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, avec `expectedStatus` et motif. Blocage/désactivation révoquent toutes les sessions ; réactivation impose une nouvelle connexion. Protection du propre compte et du dernier Admin actif. Conflit : 409 ; cible déjà atteinte : succès idempotent. Audit partagé : succès dans la transaction, refus hors transaction annulée, acteur explicite et aucun secret. Cette route ne fournit pas la gestion complète des rôles ou la récupération du mot de passe.

Restent à livrer : comparaison dédiée de deux applications, simulation régionale, gestion générale utilisateurs/rôles, récupération autonome du mot de passe, configuration globale/pause du suivi et CSV. Le tri par impact existe. Quotas externes, rétention, sauvegarde/restauration et objectifs opérationnels restent à définir ; aucun SLA. Récupérer TOTP par support ne réinitialise pas le mot de passe.
