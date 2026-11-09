# शुरुआत करें

आधार: `origin/develop`, कमिट `c343698`, 08-11-2026 को जाँचा गया। वातावरण में अलग संस्करण हो सकता है; merge से deployment सिद्ध नहीं होता।

Node.js 24+, npm, Docker Compose v2 चाहिए। `.env.example` को `.env` में कॉपी करके `npm run dev` चलाएँ। Compose migration और खोज करता है; स्रोत विफलता API आरंभ नहीं रोकती। निमंत्रण/पुष्टि हेतु SMTP सेट करें। पहला Admin: `backend/` में `organizations:create-invitation`, चर `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`। सार्वभौमिक production Admin नहीं है।

```powershell
Copy-Item .env.example .env
```

```sh
# macOS / Linux
cp .env.example .env
npm run dev
```

| HTTP | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | localhost:5432 |

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

[दृष्टि और दायरा](./product/vision) · [उपयोग मार्गदर्शिका](./guide/monitoring) · [पद्धति और डेटा](./product/methodology) · [गुणवत्ता और स्वीकृति](./product/quality) · [निर्णय और निर्भरताएँ](./product/decisions) · [API संदर्भ](./reference/api) · [संचालन और निदान](./operations) · [शुरुआत करें](./getting-started) · [आर्किटेक्चर](./architecture) · [योगदान](./contributing) · [उत्पाद बैकलॉग](./roadmap)
