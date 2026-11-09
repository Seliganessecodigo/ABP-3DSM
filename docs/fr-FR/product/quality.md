# Exigences transversales et acceptation

[EP00](../backlog/ep00) organise fondations et qualité. Un RNF reste permanent ; une tâche livre un artefact fini. Terminer l’installation de la base ne met pas fin à l’obligation d’intégrité.

## Preuves de qualité

| Exigence | Preuve |
| --- | --- |
| RNF-01 — Technologies | React/TypeScript et NestJS/TypeScript compilables. |
| RNF-02 — Responsabilités | UI présente ; backend décide ; adapters valident ; repositories persistent. |
| RNF-03 — Historique | Migrations/tests d’identité, intégrité et versions conservées. |
| RNF-04 — Sécurité | Secrets hors Git et autorisation dans le backend. |
| RNF-05 — Reproductibilité | Environnement documenté, CI vérifiable et publication validée. |
| RNF-06 — Défaillances | Succès, vide, erreur, absence et stale distinguables. |
| RNF-07 — Expérience | Clavier, focus, contraste, texte/icône au-delà de la couleur, responsive et douze langues. |

Restent à livrer : comparaison dédiée de deux applications, simulation régionale, gestion générale utilisateurs/rôles, récupération autonome du mot de passe, configuration globale/pause du suivi et CSV. Le tri par impact existe. Quotas externes, rétention, sauvegarde/restauration et objectifs opérationnels restent à définir ; aucun SLA. Récupérer TOTP par support ne réinitialise pas le mot de passe.

## Scénarios de démonstration

| Étant donné / quand | Résultat attendu | Référence |
| --- | --- | --- |
| Application connue absente d’un snapshot complet valide | Enregistrer le retrait, conserver l’historique. | US-02 |
| Source en échec ou payload invalide | Ne confirmer aucun retrait et ne fabriquer aucun zéro. | US-02/05 |
| Observation valide, puis tentative en échec | Conserver l’observation et distinguer la fraîcheur. | US-03/04 |
| Énergie valide sans facteur | Ni inventer CO₂e ni supprimer l’énergie. | US-07/08 |
| Demande d’aperçu de recalcul | Original intact, aperçu non persisté. | US-12 |
| Opération administrative sans permission | Refus par le backend. | US-18/19/20 |

Les capacités prévues doivent être implémentées et testées avant d’être annoncées livrées.

## Préparation, conclusion et gate

Avant de commencer : livraison, consommateurs, critères, contrat et dépendances identifiés. Coefficient/permission en attente ne devient pas hypothèse technique. Design : états, navigation et handoff vérifiables.

Conclusion : critères démontrés, code revu, échecs testés, contrat/documentation et preuves actualisés. Ouvrir une PR ne termine pas l’issue. Planning, review et feedback relèvent de #134.

PRs vers `develop` : vérifications pertinentes et SonarQube Cloud, couverture nouvelle ≥ 80%, duplication ≤ 3%, ratings A et 100% des hotspots revus. Backend exécutable : tests et LCOV. Voir [CI](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/.github/quality-gates.md) et [Contribuer](../contributing). La CI ne remplace ni acceptation fonctionnelle ni évaluation d’utilisabilité.

## CI — c343698

CI vérifie documentation, lint/tests/build frontend, lint/typecheck/tests PostgreSQL/couverture/build/migrations backend et flux navigateur intégré réel. `TEST_DATABASE_URL` exige PostgreSQL isolé ; sans cette variable, Jest ignore les suites de base et le navigateur intégré échoue. SonarQube obligatoire vers `develop` : couverture nouvelle ≥ 80 %, duplication ≤ 3 %, notes A, hotspots 100 % revus. Ne remplace ni utilisabilité ni acceptation produit.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)
