# Primeiros passos

Esta parte da documentação se destina a desenvolvimento e operação. Apresenta ambiente local, contratos e verificações. Para aprender a usar o produto, consulte o guia de uso.

## Configuração {#requirements}

Node.js 24+, npm e Docker Compose v2 são necessários. Copie `.env.example` para `.env` e execute `npm run dev`. O Compose aplica migrations e tenta descoberta antes da API; falha da origem não impede a API de iniciar. Configure SMTP para enviar convites e confirmações. O primeiro Admin é provisionado pelo script `organizations:create-invitation` em `backend/`, com `ORGANIZATION_NAME`, `ORGANIZATION_SLUG` e `ORGANIZATION_REPRESENTATIVE_EMAIL`. Não há conta administrativa universal de produção.

## Por onde começar {#start}

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

| Recurso | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5432` |

## Configuração {#commands}

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

## Leitura relacionada {#related}

[Guia de uso](./guide/monitoring) · [Operação e diagnóstico](./operations)
