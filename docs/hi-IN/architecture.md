# आर्किटेक्चर

यह भाग विकास और संचालन हेतु स्थानीय वातावरण, अनुबंध और जाँच बताता है। उत्पाद उपयोग सीखने के लिए उपयोग मार्गदर्शिका पढ़ें।

## तकनीकी दस्तावेज़ {#components}

React 19/TypeScript/Vite प्रस्तुत करता है; NestJS/TypeORM/PostgreSQL 18 एकीकरण/संग्रह करते हैं। सहायक स्रोत केवल बैकएंड बुलाता है। Controller परिवहन, service उपयोग प्रक्रिया, adapter सत्यापन, repository संग्रह संभालते हैं। वैश्विक authentication/role guard तथा `PublicRoute` अपवाद हैं। प्राथमिकताएँ प्रति उपयोगकर्ता; audit `backend/src/shared/audit/` में सफल बदलाव के transaction में शामिल होता है।

```text
frontend/  React 19 · TypeScript · Vite
backend/   NestJS · TypeScript · TypeORM
PostgreSQL 18
frontend → GreenER API → auxiliary APIs
```

## लॉगिन करें {#security}

डैशबोर्ड और पर्यावरण प्रश्न सार्वजनिक हैं। `/login` में ईमेल/पासवर्ड या सक्रिय Google लें। Admin को Google के बाद भी छह अंकों का TOTP सेट/सत्यापित करना है; Analyst/Visitor को प्रशासन अधिकार नहीं मिलता। फ्रंटएंड सत्र केवल मेमोरी में है; reload पर फिर लॉगिन। बैकएंड JWT, सत्र, वर्तमान भूमिका/खाता स्थिति जाँचता है। गायब/अमान्य पहचान पर 401, अपर्याप्त भूमिका पर 403। नए मार्ग मूलतः संरक्षित हैं।

उसी संगठन का Admin `expectedStatus` और कारण देकर `ACTIVE`, `BLOCKED`, `DEACTIVATED` में बदलाव करता है। ब्लॉक/निष्क्रियता सभी सत्र रद्द करते हैं; पुनर्सक्रियता में नया लॉगिन चाहिए। अपना खाता और अंतिम सक्रिय Admin सुरक्षित हैं। अपेक्षित स्थिति संघर्ष पर 409; लक्ष्य पहले प्राप्त हो तो idempotent सफलता। साझा audit सफलता को बदलाव के transaction में, अस्वीकृति को rollback से बाहर लिखता है; स्पष्ट कर्ता, कोई रहस्य नहीं। यह मार्ग पूर्ण भूमिका प्रबंधन या पासवर्ड पुनर्प्राप्ति नहीं देता।

## अवधि और इतिहास {#data}

`from`, `to` में स्पष्ट समय क्षेत्र सहित RFC 3339 चाहिए; `[from,to)` UTC में बदलता है। `hour`, `day`, `month`, `year`, अधिकतम 10,000 बिंदु; अतिरिक्त अस्वीकृत। सहेजे मान overlap से बाँटे जाते हैं। नया `collectedAt`, फिर ID शब्दक्रम जीतता है; विजेता metric नहीं दे सके तो पुराने प्रेक्षण पर नहीं लौटते।

स्रोत metrics में मापन समय नहीं; प्राप्ति से `collection_interval_seconds` घटाकर अंतराल है। factor query समय वैधता सिद्ध नहीं करता; अप्रकाशित स्रोत/वैधता अज्ञात हैं। ऊर्जा/factor/उत्सर्जन 8 दशमलव, कवरेज4; मध्य rounding नहीं। अलग कवरेज और मूल snapshots सुरक्षित हैं।

## संबंधित पठन {#related}

[API संदर्भ](./reference/api) · [शुरुआत करें](./getting-started)

[ADR](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/adr) · [Design](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/design) · [Specs](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/specs)
