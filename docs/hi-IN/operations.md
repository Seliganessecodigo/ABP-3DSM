# संचालन और निदान

यह भाग विकास और संचालन हेतु स्थानीय वातावरण, अनुबंध और जाँच बताता है। उत्पाद उपयोग सीखने के लिए उपयोग मार्गदर्शिका पढ़ें।

## कॉन्फ़िगरेशन {#environment}

```text
FRONTEND_PORT=5173
API_PORT=3000
POSTGRES_PORT=5432
DATABASE_URL
METRICS_AGGREGATOR_URL
CARBON_INTENSITY_URL
CORS_ORIGIN
VITE_API_URL
MONITORING_SCHEDULE_INTERVAL_SECONDS=60
MONITORING_METRICS_CONCURRENCY=2
```

## स्वचालित निगरानी {#monitoring}

पहले अंतराल बाद monitoring शुरू और प्रति process overlap रोकता है। अंतराल/concurrency धनात्मक पूर्णांक हैं। Compose `.env` के `MONITORING_SCHEDULE_INTERVAL_SECONDS`, `MONITORING_METRICS_CONCURRENCY` स्वतः नहीं भेजता; explicit mapping चाहिए। `/health` HTTP जाँचता है, discovery/calculation नहीं। कैटलॉग, प्रमाण, logs देखें। स्रोत त्रुटि हटाना पुष्ट नहीं करती; तीन लगातार वैध प्रेक्षण बाद recovery।

पूर्ण वैध snapshot में पहली अनुपस्थिति हटाना पुष्ट करती है। बाहरी कॉल में कुल30 सेकंड और प्रारंभिक सहित अधिकतम तीन HTTP प्रयास हैं; केवल अस्थायी विफलताएँ दोहरती हैं।

## लॉगिन करें {#authentication}

Node.js 24+, npm, Docker Compose v2 चाहिए। `.env.example` को `.env` में कॉपी करके `npm run dev` चलाएँ। Compose migration और खोज करता है; स्रोत विफलता API आरंभ नहीं रोकती। निमंत्रण/पुष्टि हेतु SMTP सेट करें। पहला Admin: `backend/` में `organizations:create-invitation`, चर `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`। सार्वभौमिक production Admin नहीं है।

साइट पर पहली पहुँच के दो चरण हैं: `/setup-admin` पर आमंत्रण खोलें, नाम और ईमेल दर्ज करें, फिर `/confirm-email` पर पुष्टि खोलकर पासवर्ड बनाएँ। इसके बाद प्रवेश करके व्यवस्थापक के लिए अनिवार्य ऑथेंटिकेटर ऐप सेट करें। अमान्य, समाप्त या इस्तेमाल किए गए लिंक पर नया लिंक माँगने का निर्देश मिलता है; टोकन URL से हटकर केवल पृष्ठ की मेमोरी में रहते हैं। पृष्ठ दोबारा लोड करने पर मूल ईमेल लिंक फिर खोलें। SMTP को वास्तविक मेलबॉक्स में संदेश पहुँचाने चाहिए; `.test` पते केवल उदाहरण हैं। Azure में ऑपरेटर कॉन्फ़िगर किए गए बैकएंड कंसोल से `npm run organizations:create-invitation:prod` चलाकर पहला आमंत्रण भेजता है; आमंत्रित व्यक्ति साइट पर पंजीकरण पूरा करता है। `APP_BASE_URL` प्रकाशित फ्रंटएंड का पता होना चाहिए। `frontend/public/staticwebapp.config.json` होस्ट किए गए मार्गों को सीधे खोलने देता है।

```text
AUTH_JWT_SECRET
AUTH_PASSWORD_PEPPER / AUTH_PASSWORD_PEPPER_VERSION / AUTH_PASSWORD_PEPPER_KEYS
AUTH_TOTP_ENCRYPTION_KEY_VERSION / AUTH_TOTP_ENCRYPTION_KEYS
APP_BASE_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/sso/google/callback
SSO_RETURN_URL=http://localhost:5173/sso/callback
VITE_GOOGLE_SSO_ENABLED=true
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_FROM
SMTP_USER / SMTP_PASSWORD
```

Google Cloud में `GOOGLE_CALLBACK_URL` का बिल्कुल समान URI दर्ज करें। `VITE_GOOGLE_SSO_ENABLED=true` केवल बटन सक्रिय करता है, बैकएंड या खाते नहीं; लिंक हेतु निमंत्रण चाहिए। `GOOGLE_CLIENT_SECRET`, JWT, pepper और TOTP keys बैकएंड रहस्य हैं; स्वतंत्र मान तथा पढ़ने हेतु आवश्यक पुराने संस्करण रखें। निमंत्रण/पुष्टि SMTP पर निर्भर हैं। Support संगठन अधिकार की स्वतंत्र जाँच के बाद `authentication:recover-admin-totp` चलाता है; सत्र रद्द होते हैं और audit दर्ज होता है।

```text
ORGANIZATION_NAME
ORGANIZATION_SLUG
ORGANIZATION_REPRESENTATIVE_EMAIL
ADMIN_EMAIL
NEW_RECOVERY_REPRESENTATIVE_EMAIL
SUPPORT_OPERATOR_ID
SUPPORT_RECOVERY_REASON
```

```sh
npm run organizations:create-invitation --prefix backend
npm run authentication:recover-admin-totp --prefix backend
```

## निदान {#diagnosis}

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

## प्रकाशन और पुनर्प्राप्ति {#release}

Staging `develop` से CI बाद API Azure App Service, frontend Static Web Apps भेजता है और API बाद endpoint जाँचता है। दस्तावेज़ GitHub Pages और `DOCS_BASE=/ABP-3DSM/` प्रयोग करते हैं। दोहराने से पहले विफल चरण पहचानें। स्वतः DB restore नहीं। `npm run dev:down` volume बचाता है, volume हटाना स्थानीय डेटा मिटाता है।

## संबंधित पठन {#related}

[शुरुआत करें](./getting-started) · [API संदर्भ](./reference/api)
