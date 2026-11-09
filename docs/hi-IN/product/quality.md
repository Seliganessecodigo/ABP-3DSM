# गुणवत्ता और स्वीकृति

आधार: `origin/develop`, कमिट `c343698`, 08-11-2026 को जाँचा गया। वातावरण में अलग संस्करण हो सकता है; merge से deployment सिद्ध नहीं होता।

CI दस्तावेज़ build, frontend lint/test/build, backend lint/typecheck/PostgreSQL test/coverage/build/migration और वास्तविक browser integration जाँचता है। `TEST_DATABASE_URL` अलग PostgreSQL पर हो; बिना इसके Jest DB सूट छूटते हैं और integrated browser विफल होता है। `develop` PR के SonarQube में नया coverage ≥80%, duplication ≤3%, rating A और सभी hotspots की समीक्षा अनिवार्य है। स्वचालित जाँच उपयोगिता/उत्पाद स्वीकृति का विकल्प नहीं।

कैटलॉग/विवरण पहचान, स्थान, metrics और समय बचाते हैं। नाम/ID/क्षेत्र खोज, स्थिति और पृष्ठ URL में हैं। प्रत्येक प्रयास के 60 सेकंड बाद polling बैकएंड संग्रह से स्वतंत्र है। सफलता के बाद त्रुटि पुराने डेटा/समय बचाती है। `AVAILABLE`, `UNAVAILABLE`, `NO_METRICS`, `REMOVED` खपत नहीं हैं; अनुपस्थित/error/stale शून्य नहीं। शहर null हो सकता है। लगातार तीन वैध प्रेक्षण पर incident recovery; स्रोत त्रुटि हटाना सिद्ध नहीं करती।

उसी संगठन का Admin `expectedStatus` और कारण देकर `ACTIVE`, `BLOCKED`, `DEACTIVATED` में बदलाव करता है। ब्लॉक/निष्क्रियता सभी सत्र रद्द करते हैं; पुनर्सक्रियता में नया लॉगिन चाहिए। अपना खाता और अंतिम सक्रिय Admin सुरक्षित हैं। अपेक्षित स्थिति संघर्ष पर 409; लक्ष्य पहले प्राप्त हो तो idempotent सफलता। साझा audit सफलता को बदलाव के transaction में, अस्वीकृति को rollback से बाहर लिखता है; स्पष्ट कर्ता, कोई रहस्य नहीं। यह मार्ग पूर्ण भूमिका प्रबंधन या पासवर्ड पुनर्प्राप्ति नहीं देता।

अभी उपलब्ध नहीं: दो ऐप की समर्पित तुलना, क्षेत्रीय simulation, सामान्य उपयोगकर्ता/भूमिका प्रबंधन, स्वयं पासवर्ड recovery, वैश्विक monitoring सेटिंग/pause और CSV। प्रभाव के अनुसार क्रम उपलब्ध है। बाहरी quota, retention, backup/restore और संचालन लक्ष्य पर निर्णय बाकी; SLA नहीं। Support द्वारा TOTP recovery पासवर्ड reset नहीं है।

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

[दृष्टि और दायरा](../product/vision) · [उपयोग मार्गदर्शिका](../guide/monitoring) · [पद्धति और डेटा](../product/methodology) · [गुणवत्ता और स्वीकृति](../product/quality) · [निर्णय और निर्भरताएँ](../product/decisions) · [API संदर्भ](../reference/api) · [संचालन और निदान](../operations) · [शुरुआत करें](../getting-started) · [आर्किटेक्चर](../architecture) · [योगदान](../contributing) · [उत्पाद बैकलॉग](../roadmap)
