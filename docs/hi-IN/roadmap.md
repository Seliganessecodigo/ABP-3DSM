# उत्पाद बैकलॉग

आधार: `origin/develop`, कमिट `c343698`, 08-11-2026 को जाँचा गया। वातावरण में अलग संस्करण हो सकता है; merge से deployment सिद्ध नहीं होता।

GreenER अनुप्रयोगों की निगरानी करके ऊर्जा और CO₂e का अनुमान लगाता है। कैटलॉग, डैशबोर्ड, विवरण, इतिहास, पुनर्गणना पूर्वावलोकन, पद्धति और लॉगिन उपलब्ध हैं। UI और दस्तावेज़ 12 भाषाओं में हैं: `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP`, `zh-CN`, `ko-KR`, `ru-RU`, `hi-IN`, `id-ID`। फ्रंटएंड का fallback अंग्रेज़ी है।

- [EP00 — आधार और गुणवत्ता](./backlog/ep00)
- [EP01 — अनुप्रयोग कैटलॉग](./backlog/ep01)
- [EP02 — निगरानी](./backlog/ep02)
- [EP03 — पर्यावरण गणना](./backlog/ep03)
- [EP04 — पर्यावरण डैशबोर्ड](./backlog/ep04)
- [EP05 — विश्लेषण और सिमुलेशन](./backlog/ep05)
- [EP06 — सेटिंग और प्रशासन](./backlog/ep06)

अभी उपलब्ध नहीं: दो ऐप की समर्पित तुलना, क्षेत्रीय simulation, सामान्य उपयोगकर्ता/भूमिका प्रबंधन, स्वयं पासवर्ड recovery, वैश्विक monitoring सेटिंग/pause और CSV। प्रभाव के अनुसार क्रम उपलब्ध है। बाहरी quota, retention, backup/restore और संचालन लक्ष्य पर निर्णय बाकी; SLA नहीं। Support द्वारा TOTP recovery पासवर्ड reset नहीं है।

Issue: स्वीकृति/निर्भरता; Projects: प्राथमिकता/Sprint; Figma: दृश्य आशय; code/OpenAPI: वास्तविक अनुबंध। दीर्घकालिक निर्णय ADR में लिखें। PR खोलना issue पूर्ण नहीं करता; merge/दायरा जाँचें। पुराने ADR ऐतिहासिक रिकॉर्ड हैं।

[दृष्टि और दायरा](./product/vision) · [उपयोग मार्गदर्शिका](./guide/monitoring) · [पद्धति और डेटा](./product/methodology) · [गुणवत्ता और स्वीकृति](./product/quality) · [निर्णय और निर्भरताएँ](./product/decisions) · [API संदर्भ](./reference/api) · [संचालन और निदान](./operations) · [शुरुआत करें](./getting-started) · [आर्किटेक्चर](./architecture) · [योगदान](./contributing) · [उत्पाद बैकलॉग](./roadmap)
