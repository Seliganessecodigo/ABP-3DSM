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
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

Les métriques n’incluent pas l’heure de mesure source. L’intervalle dérive de la réception moins `collection_interval_seconds`. L’heure de requête du facteur ne prouve pas sa validité ; source/validité non publiées restent inconnues. Énergie, facteur, émissions : huit décimales ; couverture : quatre. Pas d’arrondi intermédiaire. Couvertures séparées et snapshots originaux conservés.

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

Admin de la même organisation change les comptes entre `ACTIVE`, `BLOCKED`, `DEACTIVATED`, avec `expectedStatus` et motif. Blocage/désactivation révoquent toutes les sessions ; réactivation impose une nouvelle connexion. Protection du propre compte et du dernier Admin actif. Conflit : 409 ; cible déjà atteinte : succès idempotent. Audit partagé : succès dans la transaction, refus hors transaction annulée, acteur explicite et aucun secret. Cette route ne fournit pas la gestion complète des rôles ou la récupération du mot de passe.

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## Comparer avec un aperçu de recalcul {#preview}

Dans `/administration/calculations`, comparer original et aperçu par application et dates. Le dernier jour inclut la journée UTC entière ; l’API reçoit `[from,to)`. Aperçu public avec modèle actuel et facteurs actuels des régions historiques, sans sauvegarde. Limites : 30 jours et 10 000 observations. Réponse : `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`). Un facteur indisponible conserve l’énergie calculable. Les pourcentages exigent unités/couvertures égales et référence positive.

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## Personnaliser l’analyse {#preferences}

`/methodology` propose énergie, émissions, couverture et analyse, avec exemples et préférences personnelles. Tout rôle connecté sauvegarde ses propres onglets avec révision optimiste ; 409 signale un conflit. Les seuils d’affichage ne modifient ni calcul, ni configuration globale, ni notifications externes. Période/granularité complètent uniquement les paramètres URL absents. Méthodologie historique : `/services/:id/methodology` avec `collectionId` sélectionné.

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
| energy | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled}`; 0–100 |
| analysis | `{periodDays: 7 / 30, granularity: "hour" / "day"}` |

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
