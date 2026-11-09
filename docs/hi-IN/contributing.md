# योगदान

आधार: `origin/develop`, कमिट `c343698`, 08-11-2026 को जाँचा गया। वातावरण में अलग संस्करण हो सकता है; merge से deployment सिद्ध नहीं होता।

Issue: स्वीकृति/निर्भरता; Projects: प्राथमिकता/Sprint; Figma: दृश्य आशय; code/OpenAPI: वास्तविक अनुबंध। दीर्घकालिक निर्णय ADR में लिखें। PR खोलना issue पूर्ण नहीं करता; merge/दायरा जाँचें। पुराने ADR ऐतिहासिक रिकॉर्ड हैं।

`develop` → `tipo/numero-descricao` / `tipo/descricao` → PR `develop`. Conventional Commits: `tipo(escopo): descrição`; `Refs #N`.

GreenER अनुप्रयोगों की निगरानी करके ऊर्जा और CO₂e का अनुमान लगाता है। कैटलॉग, डैशबोर्ड, विवरण, इतिहास, पुनर्गणना पूर्वावलोकन, पद्धति और लॉगिन उपलब्ध हैं। UI और दस्तावेज़ 12 भाषाओं में हैं: `pt-BR`, `en-US`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`, `ja-JP`, `zh-CN`, `ko-KR`, `ru-RU`, `hi-IN`, `id-ID`। फ्रंटएंड का fallback अंग्रेज़ी है।

CI दस्तावेज़ build, frontend lint/test/build, backend lint/typecheck/PostgreSQL test/coverage/build/migration और वास्तविक browser integration जाँचता है। `TEST_DATABASE_URL` अलग PostgreSQL पर हो; बिना इसके Jest DB सूट छूटते हैं और integrated browser विफल होता है। `develop` PR के SonarQube में नया coverage ≥80%, duplication ≤3%, rating A और सभी hotspots की समीक्षा अनिवार्य है। स्वचालित जाँच उपयोगिता/उत्पाद स्वीकृति का विकल्प नहीं।

```sh
npm ci --prefix docs
npm run docs:build
npm ci --prefix frontend
npm run lint --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
npm ci --prefix backend
npm run lint --prefix backend
npm run typecheck --prefix backend
npm test --prefix backend -- --runInBand
npm run test:cov --prefix backend -- --runInBand
npm run build --prefix backend
# Isolated PostgreSQL: TEST_DATABASE_URL
npm run test:integration --prefix frontend
```

[दृष्टि और दायरा](./product/vision) · [उपयोग मार्गदर्शिका](./guide/monitoring) · [पद्धति और डेटा](./product/methodology) · [गुणवत्ता और स्वीकृति](./product/quality) · [निर्णय और निर्भरताएँ](./product/decisions) · [API संदर्भ](./reference/api) · [संचालन और निदान](./operations) · [शुरुआत करें](./getting-started) · [आर्किटेक्चर](./architecture) · [योगदान](./contributing) · [उत्पाद बैकलॉग](./roadmap)
