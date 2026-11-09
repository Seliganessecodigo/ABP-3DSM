# API संदर्भ

GreenER API एकीकरण संदर्भ। पूर्ण प्रकार, वैकल्पिक fields और सीमाएँ `/openapi.json`, Swagger `/docs` में हैं। कैटलॉग/इतिहास सहेजे डेटा पढ़ते हैं; पूर्वावलोकन और carbon मार्ग intensity स्रोत पूछ सकते हैं।

## सार्वजनिक प्रश्न {#public}

| HTTP | URI | प्रवेश |
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

## अवधि और इतिहास {#queries}

`from`, `to` में स्पष्ट समय क्षेत्र सहित RFC 3339 चाहिए; `[from,to)` UTC में बदलता है। `hour`, `day`, `month`, `year`, अधिकतम 10,000 बिंदु; अतिरिक्त अस्वीकृत। सहेजे मान overlap से बाँटे जाते हैं। नया `collectedAt`, फिर ID शब्दक्रम जीतता है; विजेता metric नहीं दे सके तो पुराने प्रेक्षण पर नहीं लौटते।

| URI | मानदंड |
| --- | --- |
| `/applications/{id}/analysis` | `from`, `to` |
| `/applications/{id}/analysis/series` | `from`, `to`, `granularity` |
| `/applications/{id}/analysis/series/contributions` | `from`, `to`, `granularity`, `bucketStart`, `page`, `pageSize` (5/10/15/20/all) |
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds`, `granularity` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

स्रोत metrics में मापन समय नहीं; प्राप्ति से `collection_interval_seconds` घटाकर अंतराल है। factor query समय वैधता सिद्ध नहीं करता; अप्रकाशित स्रोत/वैधता अज्ञात हैं। ऊर्जा/factor/उत्सर्जन 8 दशमलव, कवरेज4; मध्य rounding नहीं। अलग कवरेज और मूल snapshots सुरक्षित हैं।

## समय श्रृंखला और गणना की व्याख्या {#environmental-presentation}

`/analysis/summary` में वैकल्पिक `granularity` पैरामीटर कुल योग के समान अवधि और फ़िल्टर वाले `series.points` जोड़ता है। प्रत्येक अंतराल अनुप्रयोगों के सहेजे गए परिणामों को जोड़ता है और स्वतंत्र कवरेज बनाए रखता है। अनुपलब्ध मान `null` रहते हैं।

`/applications/{id}/analysis` में `calculation.energyKwh` उन खंडों की ऊर्जा है जिनके उत्सर्जन की गणना हुई है; `calculation.intensity` उन उत्सर्जनों को संबंधित ऊर्जा से भाग देकर प्राप्त समतुल्य कारक (gCO₂e/kWh) है। ऊर्जा शून्य या अनुपलब्ध होने पर कारक अपरिभाषित रहता है। ऐतिहासिक परिणाम और कारक सुरक्षित रहते हैं।

## लॉगिन करें {#login}

डैशबोर्ड और पर्यावरण प्रश्न सार्वजनिक हैं। `/login` में ईमेल/पासवर्ड या सक्रिय Google लें। Admin को Google के बाद भी छह अंकों का TOTP सेट/सत्यापित करना है; Analyst/Visitor को प्रशासन अधिकार नहीं मिलता। फ्रंटएंड सत्र केवल मेमोरी में है; reload पर फिर लॉगिन। बैकएंड JWT, सत्र, वर्तमान भूमिका/खाता स्थिति जाँचता है। गायब/अमान्य पहचान पर 401, अपर्याप्त भूमिका पर 403। नए मार्ग मूलतः संरक्षित हैं।

| HTTP | URI | प्रवेश |
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

## संरक्षित कार्य {#protected}

| HTTP | URI | प्रवेश |
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

उसी संगठन का Admin `expectedStatus` और कारण देकर `ACTIVE`, `BLOCKED`, `DEACTIVATED` में बदलाव करता है। ब्लॉक/निष्क्रियता सभी सत्र रद्द करते हैं; पुनर्सक्रियता में नया लॉगिन चाहिए। अपना खाता और अंतिम सक्रिय Admin सुरक्षित हैं। अपेक्षित स्थिति संघर्ष पर 409; लक्ष्य पहले प्राप्त हो तो idempotent सफलता। साझा audit सफलता को बदलाव के transaction में, अस्वीकृति को rollback से बाहर लिखता है; स्पष्ट कर्ता, कोई रहस्य नहीं। यह मार्ग पूर्ण भूमिका प्रबंधन या पासवर्ड पुनर्प्राप्ति नहीं देता।

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## API से खातों का प्रबंधन {#accounts}

केवल उसी संगठन का सक्रिय Admin खातों की सूची देख सकता है, खाते बना सकता है या भूमिकाएँ बदल सकता है। खाता बनाने के लिए `name`, `email`, `role` और `reason` दिए जाते हैं; पासवर्ड नहीं लिया जाता और ईमेल अपने आप सत्यापित नहीं होता। खाताधारक मौजूदा ईमेल पुष्टि प्रक्रिया में पासवर्ड तय करता है; पुष्टि ईमेल भेजने का अनुरोध अलग से किया जाता है। प्रबंधन स्क्रीन और पासवर्ड पुनर्प्राप्ति अलग कार्य हैं।

सूची में खोज और फ़िल्टर लगाने के बाद क्रम और पृष्ठ तय होते हैं। डिफ़ॉल्ट 10 आइटम हैं; 5, 10, 15, 20 और पूरा फ़िल्टर किया गया समूह पाने के लिए `all` उपलब्ध हैं। अनूदित लेबल को एनम कोड में और स्थानीय तारीखों को समय क्षेत्र सहित RFC 3339 में बदलना चाहिए। अनुपस्थित मान दोनों क्रमों में अंत में रहते हैं; समान मानों का क्रम पहचानकर्ता से तय होता है।

भूमिका बदलने के लिए `expectedRole` और `reason` आवश्यक हैं। बदलाव सत्रों और अस्थायी TOTP प्रमाणों को रद्द करता है, ऑडिट सुरक्षित रखता है और अपना पहुँच अधिकार या सत्यापित ईमेल वाले अंतिम सक्रिय Admin का अधिकार हटाने से रोकता है। अपुष्ट खाते उस प्रशासक का स्थान नहीं लेते। Admin भूमिका दिए जाने पर भी TOTP आवश्यक रहता है।

## पुनर्गणना पूर्वावलोकन से तुलना {#preview}

`/administration/calculations` में ऐप और तारीख चुनकर मूल/पूर्वावलोकन तुलना करें। अंतिम तारीख में पूरा UTC दिन शामिल है; API `[from,to)` लेती है। सार्वजनिक पूर्वावलोकन वर्तमान मॉडल और ऐतिहासिक क्षेत्रों के वर्तमान कारक लेता है, परिणाम सहेजता नहीं। सीमा 30 दिन और 10,000 प्रेक्षण। उत्तर: `original`, `preview`, `warnings`, `status` (`available`, `empty`, `partial`)। कारक विफलता में गणनीय ऊर्जा बचती है, CO₂e अनुपलब्ध रहता है। प्रतिशत हेतु समान इकाई/कवरेज और धनात्मक संदर्भ चाहिए।

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## विश्लेषण व्यक्तिगत बनाएँ {#preferences}

`/methodology` में ऊर्जा, उत्सर्जन, कवरेज और विश्लेषण टैब में उदाहरण/व्यक्तिगत प्राथमिकताएँ हैं। प्रत्येक प्रमाणित भूमिका केवल अपने टैब सहेजती है, optimistic revision संघर्ष पर 409। प्रदर्शन सीमाएँ वैश्विक सेटिंग, गणना या बाहरी सूचना नहीं बदलतीं। सहेजी अवधि/समूह केवल विवरण URL में अनुपस्थित विकल्प भरते हैं। ऐतिहासिक पद्धति `/services/:id/methodology` और चुने `collectionId` से उपलब्ध है।

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

## त्रुटि प्रबंधन {#errors}

HTTP स्थिति और structured codes से त्रुटि सँभालें; संदेश अनुवाद अनुबंध नहीं। `null` अनुपस्थिति है, शून्य नहीं। खाली सूची वैध है, query failure नहीं। कार्य संदर्भ में codes समझें।

| HTTP | कोड |
| --- | --- |
| 400 | `INVALID_ANALYSIS_PERIOD` |
| 404 | `APPLICATION_NOT_FOUND / COLLECTION_NOT_FOUND` |
| 503 | `CATALOG_UNAVAILABLE / APPLICATION_EVIDENCE_UNAVAILABLE / APPLICATION_ANALYSIS_UNAVAILABLE` |
| 400 | `RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED / RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED` |
| 503 | `APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE` |
| 400 / 409 / 503 | `INVALID_PREFERENCE / PREFERENCE_CONFLICT / PREFERENCES_UNAVAILABLE` |

## HTTP अनुबंध {#contracts}

[AUTHORIZATION_MATRIX.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [EXTERNAL_API_CONTRACTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) · [preferences/README.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md)

## संबंधित पठन {#related}

[संचालन और निदान](../operations) · [पद्धति और डेटा](../product/methodology)
