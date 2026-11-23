# शुरुआत करें

यह भाग विकास और संचालन हेतु स्थानीय वातावरण, अनुबंध और जाँच बताता है। उत्पाद उपयोग सीखने के लिए उपयोग मार्गदर्शिका पढ़ें।

## कॉन्फ़िगरेशन {#requirements}

Node.js 24+, npm, Docker Compose v2 चाहिए। `.env.example` को `.env` में कॉपी करके `npm run dev` चलाएँ। Compose migration और खोज करता है; स्रोत विफलता API आरंभ नहीं रोकती। निमंत्रण/पुष्टि हेतु SMTP सेट करें। पहला Admin: `backend/` में `organizations:create-invitation`, चर `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`। सार्वभौमिक production Admin नहीं है।

## कहाँ से शुरू करें {#start}

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

```powershell
Copy-Item .env.example .env
```

```sh
cp .env.example .env
```

```sh
npm run dev
```

| सुविधा | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5432` |

## कॉन्फ़िगरेशन {#commands}

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

## संबंधित पठन {#related}

[उपयोग मार्गदर्शिका](./guide/monitoring) · [संचालन और निदान](./operations)
