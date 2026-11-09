# संचालन और निदान

आधार: `origin/develop`, कमिट `c343698`, 08-11-2026 को जाँचा गया। वातावरण में अलग संस्करण हो सकता है; merge से deployment सिद्ध नहीं होता।

Node.js 24+, npm, Docker Compose v2 चाहिए। `.env.example` को `.env` में कॉपी करके `npm run dev` चलाएँ। Compose migration और खोज करता है; स्रोत विफलता API आरंभ नहीं रोकती। निमंत्रण/पुष्टि हेतु SMTP सेट करें। पहला Admin: `backend/` में `organizations:create-invitation`, चर `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`। सार्वभौमिक production Admin नहीं है।

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

डैशबोर्ड और पर्यावरण प्रश्न सार्वजनिक हैं। `/login` में ईमेल/पासवर्ड या सक्रिय Google लें। Admin को Google के बाद भी छह अंकों का TOTP सेट/सत्यापित करना है; Analyst/Visitor को प्रशासन अधिकार नहीं मिलता। फ्रंटएंड सत्र केवल मेमोरी में है; reload पर फिर लॉगिन। बैकएंड JWT, सत्र, वर्तमान भूमिका/खाता स्थिति जाँचता है। गायब/अमान्य पहचान पर 401, अपर्याप्त भूमिका पर 403। नए मार्ग मूलतः संरक्षित हैं।

उसी संगठन का Admin `expectedStatus` और कारण देकर `ACTIVE`, `BLOCKED`, `DEACTIVATED` में बदलाव करता है। ब्लॉक/निष्क्रियता सभी सत्र रद्द करते हैं; पुनर्सक्रियता में नया लॉगिन चाहिए। अपना खाता और अंतिम सक्रिय Admin सुरक्षित हैं। अपेक्षित स्थिति संघर्ष पर 409; लक्ष्य पहले प्राप्त हो तो idempotent सफलता। साझा audit सफलता को बदलाव के transaction में, अस्वीकृति को rollback से बाहर लिखता है; स्पष्ट कर्ता, कोई रहस्य नहीं। यह मार्ग पूर्ण भूमिका प्रबंधन या पासवर्ड पुनर्प्राप्ति नहीं देता।

`MONITORING_SCHEDULE_INTERVAL_SECONDS=60`, `MONITORING_METRICS_CONCURRENCY=2`.

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

अभी उपलब्ध नहीं: दो ऐप की समर्पित तुलना, क्षेत्रीय simulation, सामान्य उपयोगकर्ता/भूमिका प्रबंधन, स्वयं पासवर्ड recovery, वैश्विक monitoring सेटिंग/pause और CSV। प्रभाव के अनुसार क्रम उपलब्ध है। बाहरी quota, retention, backup/restore और संचालन लक्ष्य पर निर्णय बाकी; SLA नहीं। Support द्वारा TOTP recovery पासवर्ड reset नहीं है।

[दृष्टि और दायरा](./product/vision) · [उपयोग मार्गदर्शिका](./guide/monitoring) · [पद्धति और डेटा](./product/methodology) · [गुणवत्ता और स्वीकृति](./product/quality) · [निर्णय और निर्भरताएँ](./product/decisions) · [API संदर्भ](./reference/api) · [संचालन और निदान](./operations) · [शुरुआत करें](./getting-started) · [आर्किटेक्चर](./architecture) · [योगदान](./contributing) · [उत्पाद बैकलॉग](./roadmap)


Google Cloud में `GOOGLE_CALLBACK_URL` का बिल्कुल समान URI दर्ज करें। `VITE_GOOGLE_SSO_ENABLED=true` केवल बटन सक्रिय करता है, बैकएंड या खाते नहीं; लिंक हेतु निमंत्रण चाहिए। `GOOGLE_CLIENT_SECRET`, JWT, pepper और TOTP keys बैकएंड रहस्य हैं; स्वतंत्र मान तथा पढ़ने हेतु आवश्यक पुराने संस्करण रखें। निमंत्रण/पुष्टि SMTP पर निर्भर हैं। Support संगठन अधिकार की स्वतंत्र जाँच के बाद `authentication:recover-admin-totp` चलाता है; सत्र रद्द होते हैं और audit दर्ज होता है।

Monitoring चर धनात्मक पूर्णांक हैं; वर्तमान Compose इन दोनों को `.env` से API container तक स्वतः नहीं भेजता, environment mapping चाहिए। overlap सुरक्षा प्रति process है, replicas का distributed lock नहीं। `/health` स्रोत उपलब्धता/गणनीयता नहीं सिद्ध करता। `develop` staging में CI के बाद API Azure App Service और frontend Static Web Apps पर जाते हैं, फिर smoke test होता है। दस्तावेज़ GitHub Pages पर हैं। स्वतः DB restore नहीं; `dev:down` volume बचाता है।
