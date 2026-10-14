# Primeros pasos

## Requisitos previos

- Docker Desktop con Docker Compose v2 disponible como `docker compose`.
- Node.js 24 o superior y npm para ejecutar los scripts de la raíz.

## Iniciar el entorno

Clona el repositorio y entra en su carpeta:

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

Crea la configuración local a partir del ejemplo:

```powershell
Copy-Item .env.example .env
```

En macOS o Linux:

```sh
cp .env.example .env
```

Inicia el frontend, la API y PostgreSQL:

```sh
npm run dev
```

Compose instala las dependencias dentro de los contenedores. Las migraciones pendientes se ejecutan antes de iniciar la API. La API intenta descubrir aplicaciones al arrancar; si el agregador no está disponible, registra el error y continúa iniciando.

## Direcciones locales

| Servicio | Dirección |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| OpenAPI | `http://localhost:3000/docs` |
| Estado de la API | `http://localhost:3000/health` |
| PostgreSQL | localhost:5432 |

## Comandos útiles

| Comando | Acción |
| --- | --- |
| `npm run dev:detached` | Inicia los servicios en segundo plano |
| `npm run dev:logs` | Muestra los registros de los servicios |
| `npm run dev:down` | Detiene los contenedores y conserva el volumen de datos |
| `docker compose up --build` | Reconstruye las imágenes |

Para repetir el descubrimiento sin reiniciar la API, ejecuta `docker compose exec api npm run applications:discover`.

## Problemas frecuentes

- Si no se encuentra Docker, inicia Docker Desktop y comprueba `docker compose version`.
- Si un puerto está ocupado, cambia `FRONTEND_PORT`, `API_PORT` o `POSTGRES_PORT` en `.env`.
- Si la API no alcanza el estado saludable, consulta `npm run dev:logs`. Depende de PostgreSQL y ejecuta las migraciones al iniciar.
- Los valores de `.env.example` son solo para desarrollo local. No compartas credenciales reales ni el archivo `.env`.
