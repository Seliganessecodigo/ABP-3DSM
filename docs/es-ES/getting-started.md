# Primeros pasos

Esta parte está destinada a desarrollo y operación. Presenta entorno local, contratos y comprobaciones. Para aprender a utilizar el producto, consulte la guía de uso.

## Configuración {#requirements}

Node.js 24+, npm y Docker Compose v2. Copie `.env.example` a `.env`; ejecute `npm run dev`. Compose aplica migrations e intenta descubrimiento; fallo de origen no impide iniciar API. Configure SMTP para invitaciones/confirmaciones. Primer Admin: script `organizations:create-invitation` en `backend/`, con `ORGANIZATION_NAME`, `ORGANIZATION_SLUG`, `ORGANIZATION_REPRESENTATIVE_EMAIL`. Sin Admin universal de producción.

## Por dónde empezar {#start}

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

| Función | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5432` |

## Configuración {#commands}

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

## Lecturas relacionadas {#related}

[Guía de uso](./guide/monitoring) · [Operación y diagnóstico](./operations)
