# GreenER

Plataforma para monitorar aplicações e estimar seu consumo de energia e impacto em CO₂e.

## Pré-requisitos

- Node.js 24 ou superior e npm.
- Docker Desktop em modo de containers Linux, com Docker Compose v2 disponível no comando `docker compose`.

## Iniciar o ambiente local

Clone o repositório e entre na pasta do projeto. Não é necessário instalar dependências na raiz: os containers instalam as dependências do frontend e da API a partir dos respectivos lockfiles.

Copie o arquivo de variáveis de exemplo:

```powershell
Copy-Item .env.example .env
```

No macOS ou Linux:

```sh
cp .env.example .env
```

Inicie os serviços:

```sh
npm run dev
```

O comando constrói e inicia frontend, API e PostgreSQL. O banco usa um volume persistente; as migrations pendentes são aplicadas quando a API inicia. Em seguida, a API consulta `/services` e cadastra no catálogo local as aplicações ainda desconhecidas, registrando o ciclo de descoberta. Se o agregador estiver indisponível, a API continua iniciando e o erro aparece nos logs.

No staging do Azure, a API aplica as migrations de produção antes de iniciar o servidor. Depois que começa a escutar, tenta sincronizar o catálogo com `/services` em segundo plano; a lista pode ficar vazia até a primeira sincronização terminar. Falha ou demora da integração não impede a API de responder, e falha de migration impede a inicialização para evitar servir contra um schema incompatível.

| Serviço | Endereço local |
| --- | --- |
| Frontend | http://localhost:5173 |
| Healthcheck da API | http://localhost:3000/health |
| PostgreSQL | localhost:5432 |

As portas e credenciais de desenvolvimento podem ser ajustadas no `.env`. Os valores do `.env.example` são somente para uso local.

## Comandos úteis

| Comando | Ação |
| --- | --- |
| `npm run dev` | Construir e iniciar os serviços em primeiro plano |
| `npm run dev:detached` | Iniciar os serviços em segundo plano |
| `npm run dev:logs` | Acompanhar os logs dos serviços |
| `npm run dev:down` | Parar os containers mantendo os dados do banco |

Para reconstruir as imagens depois de alterar dependências ou Dockerfiles, execute `docker compose up --build` na raiz.

## Solução de problemas

- Se `npm run dev` não encontrar Docker, inicie o Docker Desktop e confirme que `docker compose version` funciona.
- Se uma porta estiver ocupada, altere `FRONTEND_PORT`, `API_PORT` ou `POSTGRES_PORT` no `.env`.
- Se a API não ficar saudável, consulte os logs com `npm run dev:logs`; o serviço depende de PostgreSQL saudável e aplica migrations antes de iniciar.
- Para repetir manualmente a descoberta sem reiniciar a API, execute `docker compose exec api npm run applications:discover`.
- Não versione o arquivo `.env`; ele contém a configuração privada da máquina local. O `.env.example` é o modelo versionado.
