# Operação e diagnóstico

Este guia descreve os mecanismos existentes, não um SLA de produção. Para instalar, use [Primeiros passos](./getting-started); para o contrato, use [Referência da API](./reference/api).

## Configuração por fronteira

| Configuração | Onde atua |
| --- | --- |
| FRONTEND_PORT / API_PORT / POSTGRES_PORT | Portas publicadas pelo Compose. |
| DATABASE_URL | Backend no host/nuvem; no Compose a URL interna usa o serviço `postgres`. |
| METRICS_AGGREGATOR_URL / CARBON_INTENSITY_URL | Fontes consultadas exclusivamente pelo backend. |
| CORS_ORIGIN | Origem autorizada do frontend; deve corresponder ao endereço utilizado. |
| VITE_API_URL | URL da API incorporada ao build do frontend ou fornecida pelo ambiente de desenvolvimento. |
| MONITORING_SCHEDULE_INTERVAL_SECONDS | Intervalo do scheduler do backend; padrão 60 segundos. |
| MONITORING_METRICS_CONCURRENCY | Concorrência por processo; padrão inicial 2, não cota publicada pela origem. |

Os dois parâmetros de monitoramento devem ser inteiros positivos. O Compose atual não encaminha automaticamente essas duas chaves do `.env` ao container; para sobrescrevê-las ali, é necessário mapeamento explícito de ambiente. O exemplo contém apenas credenciais locais, nunca credenciais de ambiente compartilhado.

## Verificar o ambiente local

~~~sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
~~~

A descoberta manual é repetível e não deve duplicar identidades. O scheduler começa após o primeiro intervalo; a proteção contra ciclos sobrepostos é por processo, não distribuída entre réplicas. Atualização da UI e coleta são relógios independentes.

`/health` responder não comprova catálogo preenchido, origem acessível ou indicador ambiental calculável. Verifique também `/applications`, evidências disponíveis e logs do ciclo.

## Diagnóstico orientado por sintoma

| Sintoma | Verificação |
| --- | --- |
| Containers não iniciam | Docker ativo, portas livres, variáveis e logs de migrations. |
| UI abre, mas catálogo falha | URL da API no build, CORS, resposta da API e acesso ao banco. |
| Catálogo responde vazio | Resultado da descoberta inicial e acesso ao agregador; vazio não é erro HTTP. |
| Dados antigos permanecem | Hora da observação, falha da tentativa atual e resumo do ciclo. |
| Pipeline falha, mas API responde | Identificar se falhou qualidade, pacote, deploy ou smoke test; uma etapa pode ter publicado antes de outra falhar. |

## Publicação e recuperação

O workflow de staging parte de `develop` e depende da CI. API e frontend possuem jobs distintos: a API é empacotada para Azure App Service, o frontend para Static Web Apps; o smoke test verifica endpoints após publicar a API. Registrar run, SHA, etapa e diagnóstico antes de repetir.

O site usa build VitePress e workflow de Pages com `DOCS_BASE=/ABP-3DSM/`. Um build local válido não prova que a publicação terminou.

Não há restauração automática de banco demonstrada por esses workflows. Antes de rollback ou migration destrutiva, verificar compatibilidade e backup recuperável. Retenção e ensaio de restauração seguem como [dependências explícitas](./product/decisions). `npm run dev:down` preserva o volume; apagar volumes remove o banco local.

## Operação e diagnóstico — JWT / Google / SMTP

Node.js 24+, npm e Docker Compose v2 são necessários. Copie `.env.example` para `.env` e execute `npm run dev`. O Compose aplica migrations e tenta descoberta antes da API; falha da origem não impede a API de iniciar. Configure SMTP para enviar convites e confirmações. O primeiro Admin é provisionado pelo script `organizations:create-invitation` em `backend/`, com `ORGANIZATION_NAME`, `ORGANIZATION_SLUG` e `ORGANIZATION_REPRESENTATIVE_EMAIL`. Não há conta administrativa universal de produção.

```text
AUTH_JWT_SECRET
AUTH_PASSWORD_PEPPER / AUTH_PASSWORD_PEPPER_VERSION / AUTH_PASSWORD_PEPPER_KEYS
AUTH_TOTP_ENCRYPTION_KEY_VERSION / AUTH_TOTP_ENCRYPTION_KEYS
APP_BASE_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/sso/google/callback
SSO_RETURN_URL=http://localhost:5173/sso/callback
VITE_GOOGLE_SSO_ENABLED=true
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_FROM
SMTP_USER / SMTP_PASSWORD
```

O dashboard e as consultas ambientais são públicos. Em `/login`, use e-mail/senha ou Google quando habilitado. Admin precisa configurar ou confirmar TOTP de seis dígitos antes da sessão, inclusive após Google. Analyst e Visitor não recebem autorização administrativa. O frontend mantém a sessão em memória; recarregar exige novo login. O backend valida JWT, sessão, papel e estado atuais; credencial ausente/inválida resulta em 401, papel insuficiente em 403. Novas rotas são protegidas por padrão.

A API permite a Admin da mesma organização alterar contas entre `ACTIVE`, `BLOCKED` e `DEACTIVATED`, com `expectedStatus` e motivo obrigatório. Bloqueio/desativação revogam todas as sessões; reativação exige novo login. Há proteção da própria conta e do último Admin ativo. Estado esperado divergente retorna 409; estado desejado já alcançado é sucesso idempotente. A auditoria compartilhada grava sucesso na transação da alteração e negações fora da transação revertida, com ator explícito e sem segredos. Gestão completa de papéis e recuperação de senha não estão entregues por essa rota.

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)


Cadastre no Google Cloud a callback exatamente igual a `GOOGLE_CALLBACK_URL`. Habilitar o botão com `VITE_GOOGLE_SSO_ENABLED=true` não configura o backend nem provisiona contas: o vínculo precisa de convite. `GOOGLE_CLIENT_SECRET`, JWT, pepper e chaves TOTP são segredos exclusivos do backend; use valores independentes fora do desenvolvimento e preserve versões antigas necessárias à leitura. Confirmação de e-mail e convite dependem de SMTP. Para recuperar TOTP, o suporte usa `authentication:recover-admin-totp` após validação independente da organização; essa operação revoga sessões e é auditada.
