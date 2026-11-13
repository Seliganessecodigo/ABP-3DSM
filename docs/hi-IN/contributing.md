# योगदान

यह भाग विकास और संचालन हेतु स्थानीय वातावरण, अनुबंध और जाँच बताता है। उत्पाद उपयोग सीखने के लिए उपयोग मार्गदर्शिका पढ़ें।

## सत्यापन मानदंड {#workflow}

दायरे और नियम बदलाव में संबंधित कहानियों में समस्या, अपेक्षित परिणाम और स्वीकृति मानदंड लिखें। समीक्षा तथा उपयोगिता मूल्यांकन कठिनाई, प्रतिक्रिया और सुधार दर्ज करते हैं। डेटा retention, backup/recovery, संचालन लक्ष्य और बाहरी quota पर निर्णय बाकी है।

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## जाँच {#quality}

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
npm run test:integration --prefix frontend
```

## तकनीकी दस्तावेज़ {#documentation}

उत्पाद में ऐप ढूँढना, शून्य और अनुपस्थिति अलग करना तथा संकेतक से अवधि, इकाई, कवरेज और पद्धति तक पहुँचना चाहिए। प्रश्नों में संदर्भ बचना और लोडिंग, खाली, विफलता, पुराने डेटा की सूचना चाहिए। मूल्यांकन में कीबोर्ड, स्पष्ट focus, रंग के अलावा पाठ, मोबाइल और 12 भाषाएँ हैं।

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## संबंधित पठन {#related}

[गुणवत्ता और स्वीकृति](./product/quality) · [उत्पाद बैकलॉग](./roadmap)
