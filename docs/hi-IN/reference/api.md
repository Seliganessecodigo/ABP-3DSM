# API संदर्भ

आधार: `origin/develop`, कमिट `c343698`, 08-11-2026 को जाँचा गया। वातावरण में अलग संस्करण हो सकता है; merge से deployment सिद्ध नहीं होता।

Swagger: `http://localhost:3000/docs`; schema: `/openapi.json`.

| HTTP | URI | JWT / credential |
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
| POST | `/auth/login` | email + password |
| GET | `/auth/sso/google` | PKCE |
| GET | `/auth/sso/google/callback` | state + cookie |
| POST | `/auth/sso/handoff/exchange` | code + PKCE |
| POST | `/auth/totp/setup` | setupToken |
| POST | `/auth/totp/setup/confirm` | setupToken + TOTP |
| POST | `/auth/totp/challenge` | challengeToken + TOTP |
| POST | `/auth/sessions/refresh` | refreshToken |
| POST | `/auth/invitations/accept` | token |
| POST | `/auth/email/confirm` | token + password |
| POST | `/auth/email/confirmation/resend` | organization + email |
| GET | `/auth/me` | JWT |
| POST | `/auth/sessions/logout` | JWT |
| POST | `/auth/totp/replacement` | JWT + password + TOTP |
| POST | `/auth/totp/replacement/confirm` | JWT + confirmationToken + TOTP |
| GET | `/me/preferences` | JWT |
| PUT | `/me/preferences/{tab}` | JWT |
| POST | `/auth/sso/invitations` | JWT + ADMIN |
| DELETE | `/auth/sso/identities/{userId}` | JWT + ADMIN |
| PATCH | `/auth/users/{userId}/status` | JWT + ADMIN |

प्रश्नों में स्पष्ट समय क्षेत्र वाले RFC 3339 `from`, `to` चाहिए; `[from,to)` UTC में बदलता है। समूह `hour`, `day`, `month`, `year`, अधिकतम 10,000 बिंदु। सहेजे मान overlap अनुपात से बँटते हैं, पुनर्गणना नहीं; नया `collectedAt` जीतता है, बराबरी पर ID शब्दक्रम। अमान्य विजेता की जगह पुराना नहीं लेते। ऊर्जा/CO₂e कवरेज अलग है। `null` अनुपस्थित, शून्य वैध हो सकता है। स्रोत metrics में मापन समय नहीं: प्राप्ति समय से `collection_interval_seconds` घटाकर अवधि बनती है। कारक अनुरोध समय वैधता नहीं सिद्ध करता। ऊर्जा/कारक/उत्सर्जन 8 दशमलव, कवरेज 4 में सहेजते हैं।

`/administration/calculations` में ऐप और तारीख चुनकर मूल/पूर्वावलोकन तुलना करें। अंतिम तारीख में पूरा UTC दिन शामिल है; API `[from,to)` लेती है। सार्वजनिक पूर्वावलोकन वर्तमान मॉडल और ऐतिहासिक क्षेत्रों के वर्तमान कारक लेता है, परिणाम सहेजता नहीं। सीमा 30 दिन और 10,000 प्रेक्षण। उत्तर: `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`)। कारक विफलता में गणनीय ऊर्जा बचती है, CO₂e अनुपलब्ध रहता है। प्रतिशत हेतु समान इकाई/कवरेज और धनात्मक संदर्भ चाहिए।

`/methodology` में ऊर्जा, उत्सर्जन, कवरेज और विश्लेषण टैब में उदाहरण/व्यक्तिगत प्राथमिकताएँ हैं। प्रत्येक प्रमाणित भूमिका केवल अपने टैब सहेजती है, optimistic revision संघर्ष पर 409। प्रदर्शन सीमाएँ वैश्विक सेटिंग, गणना या बाहरी सूचना नहीं बदलतीं। सहेजी अवधि/समूह केवल विवरण URL में अनुपस्थित विकल्प भरते हैं। ऐतिहासिक पद्धति `/services/:id/methodology` और चुने `collectionId` से उपलब्ध है।

उसी संगठन का Admin `expectedStatus` और कारण देकर `ACTIVE`, `BLOCKED`, `DEACTIVATED` में बदलाव करता है। ब्लॉक/निष्क्रियता सभी सत्र रद्द करते हैं; पुनर्सक्रियता में नया लॉगिन चाहिए। अपना खाता और अंतिम सक्रिय Admin सुरक्षित हैं। अपेक्षित स्थिति संघर्ष पर 409; लक्ष्य पहले प्राप्त हो तो idempotent सफलता। साझा audit सफलता को बदलाव के transaction में, अस्वीकृति को rollback से बाहर लिखता है; स्पष्ट कर्ता, कोई रहस्य नहीं। यह मार्ग पूर्ण भूमिका प्रबंधन या पासवर्ड पुनर्प्राप्ति नहीं देता।

`GET /analysis/summary`: `from`, `to`; `states`, `regionCodes`, `applicationIds`. `/monitoring/incidents`: `applicationId`, `source`, `integration`, `status`, `page`, `limit` → `{items,total,page,limit}`. `series/contributions`: `bucketStart`, `page`, `pageSize` (5/10/15/20/all).

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

[दृष्टि और दायरा](../product/vision) · [उपयोग मार्गदर्शिका](../guide/monitoring) · [पद्धति और डेटा](../product/methodology) · [गुणवत्ता और स्वीकृति](../product/quality) · [निर्णय और निर्भरताएँ](../product/decisions) · [API संदर्भ](../reference/api) · [संचालन और निदान](../operations) · [शुरुआत करें](../getting-started) · [आर्किटेक्चर](../architecture) · [योगदान](../contributing) · [उत्पाद बैकलॉग](../roadmap)


```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example administrative action" }
```

`PATCH /auth/users/{userId}/status`: `400`, `401`, `403`, `404`, `409`.

`POST /applications/{id}/analysis/recalculation-preview`: `400 RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED`, `400 RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED`, `503 APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE`.

`GET /me/preferences`: `energy`, `emissions`, `coverage`, `analysis` → `null` / `{ value, revision, updatedAt }`. `PUT /me/preferences/{tab}`: `{ expectedRevision, value }`. `expectedRevision: 0` → create. `400 INVALID_PREFERENCE`, `409 PREFERENCE_CONFLICT`, `503 PREFERENCES_UNAVAILABLE`.

| tab | value |
| --- | --- |
| energy | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled}`; 0–100 |
| analysis | `{periodDays: 7 / 30, granularity: "hour" / "day"}` |
