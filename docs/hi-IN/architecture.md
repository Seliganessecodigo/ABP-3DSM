# आर्किटेक्चर

आधार: `origin/develop`, कमिट `c343698`, 08-11-2026 को जाँचा गया। वातावरण में अलग संस्करण हो सकता है; merge से deployment सिद्ध नहीं होता।

React 19/TypeScript/Vite प्रस्तुत करता है; NestJS/TypeORM/PostgreSQL 18 एकीकरण/संग्रह करते हैं। सहायक स्रोत केवल बैकएंड बुलाता है। Controller परिवहन, service उपयोग प्रक्रिया, adapter सत्यापन, repository संग्रह संभालते हैं। वैश्विक authentication/role guard तथा `PublicRoute` अपवाद हैं। प्राथमिकताएँ प्रति उपयोगकर्ता; audit `backend/src/shared/audit/` में सफल बदलाव के transaction में शामिल होता है।

कैटलॉग/विवरण पहचान, स्थान, metrics और समय बचाते हैं। नाम/ID/क्षेत्र खोज, स्थिति और पृष्ठ URL में हैं। प्रत्येक प्रयास के 60 सेकंड बाद polling बैकएंड संग्रह से स्वतंत्र है। सफलता के बाद त्रुटि पुराने डेटा/समय बचाती है। `AVAILABLE`, `UNAVAILABLE`, `NO_METRICS`, `REMOVED` खपत नहीं हैं; अनुपस्थित/error/stale शून्य नहीं। शहर null हो सकता है। लगातार तीन वैध प्रेक्षण पर incident recovery; स्रोत त्रुटि हटाना सिद्ध नहीं करती।

मॉडल `simplified-energy`, संस्करण `1`: CPU 100% पर 100 W, मेमोरी 0.375 W/GB, डिस्क 0.01 W/GB, नेटवर्क 0.02 W/GB। ये सरल मॉडल मान हैं, वास्तविक विद्युत माप या आधिकारिक क्षेत्रीय कारक नहीं। शक्ति घटकों का योग है; ऊर्जा = W × घंटे / 1000; CO₂e[g] = kWh × gCO₂e/kWh। snapshots पद्धति/कारक रखते हैं; वर्तमान कारक का पूर्वावलोकन मूल को नहीं बदलता।

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

[दृष्टि और दायरा](./product/vision) · [उपयोग मार्गदर्शिका](./guide/monitoring) · [पद्धति और डेटा](./product/methodology) · [गुणवत्ता और स्वीकृति](./product/quality) · [निर्णय और निर्भरताएँ](./product/decisions) · [API संदर्भ](./reference/api) · [संचालन और निदान](./operations) · [शुरुआत करें](./getting-started) · [आर्किटेक्चर](./architecture) · [योगदान](./contributing) · [उत्पाद बैकलॉग](./roadmap)
