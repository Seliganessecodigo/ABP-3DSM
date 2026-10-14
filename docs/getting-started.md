# Primeiros passos

## Pré-requisitos

- Docker Desktop com Docker Compose v2 disponível como `docker compose`.
- Node.js 24 ou superior e npm para executar os scripts da raiz.

## Iniciar o ambiente

Clone o projeto e entre na pasta:

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

Crie a configuração local a partir do exemplo:

```powershell
Copy-Item .env.example .env
```

No macOS ou Linux:

```sh
cp .env.example .env
```

Inicie frontend, API e PostgreSQL:

```sh
npm run dev
```

O Compose instala as dependências dos containers. Migrations pendentes são aplicadas antes de iniciar a API. A API tenta descobrir aplicações no início; se o agregador estiver indisponível, ela registra a falha e continua iniciando.

## Endereços locais

| Serviço | Endereço |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| OpenAPI | `http://localhost:3000/docs` |
| Saúde da API | `http://localhost:3000/health` |
| PostgreSQL | localhost:5432 |

## Comandos úteis

| Comando | Ação |
| --- | --- |
| `npm run dev:detached` | Inicia os serviços em segundo plano |
| `npm run dev:logs` | Acompanha os logs |
| `npm run dev:down` | Para os containers e mantém o volume de dados |
| `docker compose up --build` | Reconstrói as imagens |

Para repetir a descoberta sem reiniciar a API, execute `docker compose exec api npm run applications:discover`.

## Problemas comuns

- Se Docker não for encontrado, inicie o Docker Desktop e confira `docker compose version`.
- Se uma porta estiver ocupada, ajuste `FRONTEND_PORT`, `API_PORT` ou `POSTGRES_PORT` em `.env`.
- Se a API não ficar saudável, consulte `npm run dev:logs`. Ela depende do PostgreSQL e aplica migrations ao iniciar.
- Os valores de `.env.example` são apenas para desenvolvimento local. Não versione credenciais reais nem o arquivo `.env`.
