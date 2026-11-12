# Référence de l’API

Référence d’intégration à l’API GreenER. L’environnement publie types, champs facultatifs et limites dans `/openapi.json`, Swagger dans `/docs`. Catalogue et historique lisent les données persistées. Aperçu et routes carbone peuvent appeler la source d’intensité.

## Consultations publiques {#public}

| HTTP | URI | Accès |
| --- | --- | --- |
| GET | `/health` | — |
| GET | `/applications` | — |
| GET | `/applications/{id}` | — |
| GET | `/applications/{id}/collections/latest` | — |
| GET | `/applications/{id}/collections/{collectionId}` | — |
| GET | `/applications/{id}/analysis` | — |
| GET | `/applications/{id}/analysis/series` | — |
| GET | `/applications/{id}/analysis/series/contributions` | — |
| GET | `/analysis/summary` | — |
| GET | `/monitoring/incidents` | — |
| GET | `/carbon/regions` | — |
| GET | `/carbon/regions/{code}/intensity` | — |
| POST | `/applications/{id}/analysis/recalculation-preview` | — |

## Périodes et historique {#queries}

`from` et `to` exigent RFC 3339 avec fuseau explicite. `[from,to)` est normalisé UTC. Série : `hour`, `day`, `month`, `year`, au plus 10 000 points ; excès refusé. Les valeurs sauvegardées sont proratisées par chevauchement. Le `collectedAt` le plus récent gagne, puis l’ID lexical croissant, sans recours à une observation antérieure si la gagnante ne permet pas la métrique.

| URI | Paramètre |
| --- | --- |
| `/applications/{id}/analysis` | `from`, `to` |
| `/applications/{id}/analysis/series` | `from`, `to`, `granularity` |
| `/applications/{id}/analysis/series/contributions` | `from`, `to`, `granularity`, `bucketStart`, `page`, `pageSize` (5/10/15/20/all) |
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds`, `granularity` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

Les métriques n’incluent pas l’heure de mesure source. L’intervalle dérive de la réception moins `collection_interval_seconds`. L’heure de requête du facteur ne prouve pas sa validité ; source/validité non publiées restent inconnues. Énergie, facteur, émissions : huit décimales ; couverture : quatre. Pas d’arrondi intermédiaire. Couvertures séparées et snapshots originaux conservés.

## Série et explication du calcul {#environmental-presentation}

Dans `/analysis/summary`, le paramètre facultatif `granularity` ajoute `series.points` avec la même période et les mêmes filtres que les totaux. Chaque intervalle additionne les résultats persistés des applications et conserve des couvertures indépendantes. Les valeurs manquantes restent `null`.

Dans `/applications/{id}/analysis`, `calculation.energyKwh` indique l’énergie des segments avec des émissions calculées ; `calculation.intensity` est le facteur équivalent en gCO₂e/kWh, obtenu en divisant ces émissions par l’énergie correspondante. Si l’énergie est nulle ou manquante, le facteur reste nul. Les résultats et facteurs historiques sont conservés.

## Se connecter {#login}

Tableau de bord et consultations environnementales publics. `/login` accepte e-mail/mot de passe ou Google activé. Admin configure/confirme un TOTP à six chiffres, même après Google ; Analyst et Visitor n’obtiennent pas les droits administratifs. Session frontend en mémoire : rechargement exige une reconnexion. Backend vérifie JWT, session, rôle et état actuels : 401 pour identifiants absents/invalides, 403 pour rôle insuffisant. Nouvelles routes protégées par défaut.

| HTTP | URI | Accès |
| --- | --- | --- |
| POST | `/auth/login` | `email + password` |
| GET | `/auth/sso/google` | `PKCE` |
| GET | `/auth/sso/google/callback` | `state + cookie` |
| POST | `/auth/sso/handoff/exchange` | `code + PKCE` |
| POST | `/auth/totp/setup` | `setupToken` |
| POST | `/auth/totp/setup/confirm` | `setupToken + TOTP` |
| POST | `/auth/totp/challenge` | `challengeToken + TOTP` |
| POST | `/auth/sessions/refresh` | `refreshToken` |
| POST | `/auth/invitations/accept` | `token` |
| POST | `/auth/email/confirm` | `token + password` |
| POST | `/auth/email/confirmation/resend` | `organization + email` |

## Opérations protégées {#protected}

| HTTP | URI | Accès |
| --- | --- | --- |
| GET | `/auth/me` | `JWT` |
| POST | `/auth/sessions/logout` | `JWT` |
| POST | `/auth/totp/replacement` | `JWT + password + TOTP` |
| POST | `/auth/totp/replacement/confirm` | `JWT + confirmationToken + TOTP` |
| GET | `/me/preferences` | `JWT` |
| PUT | `/me/preferences/{tab}` | `JWT` |
| POST | `/auth/sso/invitations` | `JWT + ADMIN` |
| DELETE | `/auth/sso/identities/{userId}` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/status` | `JWT + ADMIN` |
| GET | `/auth/users` | `JWT + ADMIN` |
| POST | `/auth/users` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/role` | `JWT + ADMIN` |

Admin de la même organisation change les comptes entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, avec `expectedStatus` et motif. Blocage/désactivation révoquent toutes les sessions ; réactivation impose une nouvelle connexion. Protection du propre compte et du dernier Admin actif. Conflit : 409 ; cible déjà atteinte : succès idempotent. Audit partagé : succès dans la transaction, refus hors transaction annulée, acteur explicite et aucun secret. Cette route ne fournit pas la gestion complète des rôles ou la récupération du mot de passe.

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## Administrer les comptes par l’API {#accounts}

Seul un Admin actif de la même organisation peut consulter et créer des comptes ou modifier les rôles. La création reçoit `name`, `email`, `role` et `reason`, sans mot de passe ni confirmation automatique de l’adresse e-mail. Le titulaire définit son mot de passe dans le parcours de confirmation existant ; l’envoi de la confirmation est demandé séparément. L’écran de gestion et la récupération du mot de passe restent des livraisons distinctes.

La liste applique la recherche et les filtres avant le tri et la pagination. La valeur par défaut est de 10 éléments, avec les options 5, 10, 15, 20 et `all` pour tout le jeu filtré. Les libellés traduits doivent être convertis en codes d’énumération et les dates locales en RFC 3339 avec décalage horaire. Les valeurs absentes restent à la fin dans les deux sens ; les égalités sont départagées par identifiant.

Modifier un rôle exige `expectedRole` et `reason`. Le changement révoque les sessions et les justificatifs TOTP temporaires, préserve l’audit et empêche de retirer son propre accès ou le dernier Admin actif dont l’e-mail est confirmé. Les comptes non confirmés ne remplacent pas cet administrateur. L’attribution du rôle Admin conserve l’exigence TOTP.

## Comparer avec un aperçu de recalcul {#preview}

Dans `/administration/calculations`, comparer original et aperçu par application et dates. Le dernier jour inclut la journée UTC entière ; l’API reçoit `[from,to)`. Aperçu public avec modèle actuel et facteurs actuels des régions historiques, sans sauvegarde. Limites : 30 jours et 10 000 observations. Réponse : `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Un facteur indisponible conserve l’énergie calculable. Les pourcentages exigent unités/couvertures égales et référence positive.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## Personnaliser l’analyse {#preferences}

Dans `/methodology`, configurez les limites d’énergie et d’émissions par application, le seuil de couverture et les paramètres initiaux d’analyse. Choisissez les dernières 24 heures, 7, 30 ou 90 jours, le mois UTC courant ou un intervalle personnalisé avec début inclus et fin exclue. L’aperçu consulte les données réelles sans enregistrer et utilise le même panneau d’avertissements que les applications et le Dashboard. L’enregistrement nécessite une connexion et concerne uniquement votre compte ; les calculs, l’historique et les états opérationnels restent inchangés. Les avertissements utilisent la période de chaque limite indépendamment des filtres. Les paramètres initiaux complètent uniquement les options absentes de l’URL du Dashboard et du détail. Des données partielles sous la limite ne prouvent pas son respect ; une absence ne signifie jamais zéro.

```text
GET /me/preferences → { energy, emissions, coverage, analysis }
null | { value, revision, updatedAt }
PUT /me/preferences/{tab} ← { expectedRevision, value }
expectedRevision: 0 → create
threshold ≥ 0; finite number; thresholdPercent: 0–100
unknown fields / partial bodies / numeric strings → 400
```

| tab | value |
| --- | --- |
| energy | `{threshold, alertsEnabled, scope: "application", period: {kind}, unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", period: {kind}, unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled, period: {kind}}`; 0–100 |
| analysis | `{period: {kind}, granularity: "hour" / "day"}` |

```json
{ "period": { "kind": "custom", "from": "2026-11-01T00:00:00Z", "to": "2026-11-08T00:00:00Z" } }
```

```text
period.kind = 24h | 7d | 30d | 90d | month | custom
GET /me/preferences/alerts (JWT)
POST /me/preferences/alerts/preview (public, read-only)
{ energy, emissions, coverage } -> { configured, evaluatedAt, applications }
```

## Gestion des erreurs {#errors}

Traiter erreurs via HTTP et codes structurés ; le message n’est pas un contrat de traduction. `null` indique une absence, pas zéro. Une liste vide est valide et distincte d’une panne. Interpréter les codes selon l’opération.

| HTTP | Code |
| --- | --- |
| 400 | `INVALID_ANALYSIS_PERIOD` |
| 404 | `APPLICATION_NOT_FOUND / COLLECTION_NOT_FOUND` |
| 503 | `CATALOG_UNAVAILABLE / APPLICATION_EVIDENCE_UNAVAILABLE / APPLICATION_ANALYSIS_UNAVAILABLE` |
| 400 | `RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED / RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED` |
| 503 | `APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE` |
| 400 / 409 / 503 | `INVALID_PREFERENCE / PREFERENCE_CONFLICT / PREFERENCES_UNAVAILABLE` |

## Contrat HTTP {#contracts}

[AUTHORIZATION_MATRIX.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [EXTERNAL_API_CONTRACTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) · [preferences/README.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md)

## Lectures associées {#related}

[Exploitation et diagnostic](../operations) · [Méthodologie et données](../product/methodology)
