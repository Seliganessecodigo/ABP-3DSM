# Operação e diagnóstico

Esta parte da documentação se destina a desenvolvimento e operação. Apresenta ambiente local, contratos e verificações. Para aprender a usar o produto, consulte o guia de uso.

## Configuração {#environment}

```text
FRONTEND_PORT=5173
API_PORT=3000
POSTGRES_PORT=5432
DATABASE_URL
METRICS_AGGREGATOR_URL
CARBON_INTENSITY_URL
CORS_ORIGIN
VITE_API_URL
MONITORING_SCHEDULE_INTERVAL_SECONDS=60
MONITORING_METRICS_CONCURRENCY=2
```

## Monitoramento automático {#monitoring}

O monitoramento inicia após o primeiro intervalo e impede ciclos sobrepostos por processo. Intervalo e concorrência devem ser inteiros positivos. O Compose não encaminha automaticamente `MONITORING_SCHEDULE_INTERVAL_SECONDS` e `MONITORING_METRICS_CONCURRENCY` do `.env` para a API; sobrescritas exigem mapeamento explícito. `/health` verifica resposta HTTP, mas não comprova descoberta ou cálculo. Confirme catálogo, evidências e logs. Falha de fonte não confirma remoção; incidentes recuperam após três observações válidas consecutivas.

A primeira ausência em um snapshot completo e válido confirma remoção. Cada chamada externa tem prazo total de 30 segundos e no máximo três tentativas HTTP, contando a inicial; somente falhas temporárias são repetidas.

## Entrar na sua conta {#authentication}

Node.js 24+, npm e Docker Compose v2 são necessários. Copie `.env.example` para `.env` e execute `npm run dev`. O Compose aplica migrations e tenta descoberta antes da API; falha da origem não impede a API de iniciar. Configure SMTP para enviar convites e confirmações. O primeiro Admin é provisionado pelo script `organizations:create-invitation` em `backend/`, com `ORGANIZATION_NAME`, `ORGANIZATION_SLUG` e `ORGANIZATION_REPRESENTATIVE_EMAIL`. Não há conta administrativa universal de produção.

O primeiro acesso pelo site segue duas etapas: abrir o convite em `/setup-admin`, informar nome e e-mail e, depois, abrir a confirmação em `/confirm-email` para criar a senha. Em seguida, entre pelo login e configure o autenticador obrigatório do Admin. Links inválidos, expirados ou utilizados exibem orientação para solicitar um novo; os tokens são retirados da URL e ficam apenas na memória da página. Ao atualizar a página, reabra o link original do e-mail. O SMTP precisa entregar mensagens a uma caixa real; endereços `.test` são apenas demonstrativos. Na Azure, o operador emite o primeiro convite no console do backend já configurado com `npm run organizations:create-invitation:prod`; a pessoa convidada conclui o cadastro pelo site. `APP_BASE_URL` deve apontar para o frontend publicado. O arquivo `frontend/public/staticwebapp.config.json` garante acesso direto às rotas na hospedagem.

No menu **Usuários** (`/administration/users`), o Admin consulta as contas da organização e envia convites para acesso com Google. **Vincular minha conta Google** preenche o formulário com os dados do próprio Admin; confirme o envio e abra o link recebido usando a conta Google com o mesmo e-mail. A identidade não é vinculada apenas pela coincidência de endereço. Novas contas aparecem após a aceitação; convites pendentes não integram a listagem. Reenviar revoga o convite anterior, e contas existentes mantêm nome, papel e senha. O Admin continua sujeito ao TOTP. A publicação de staging lê `VITE_GOOGLE_SSO_ENABLED` das variáveis do GitHub: só defina `true` após configurar as credenciais e URLs do backend. Use `GOOGLE_CALLBACK_URL` com o endereço público da API e `/auth/sso/google/callback`, e `SSO_RETURN_URL` com o endereço público do frontend e `/sso/callback`.

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

Cadastre no Google Cloud a callback exatamente igual a `GOOGLE_CALLBACK_URL`. Habilitar o botão com `VITE_GOOGLE_SSO_ENABLED=true` não configura o backend nem provisiona contas: o vínculo precisa de convite. `GOOGLE_CLIENT_SECRET`, JWT, pepper e chaves TOTP são segredos exclusivos do backend; use valores independentes fora do desenvolvimento e preserve versões antigas necessárias à leitura. Confirmação de e-mail e convite dependem de SMTP. Para recuperar TOTP, o suporte usa `authentication:recover-admin-totp` após validação independente da organização; essa operação revoga sessões e é auditada.

```text
ORGANIZATION_NAME
ORGANIZATION_SLUG
ORGANIZATION_REPRESENTATIVE_EMAIL
ADMIN_EMAIL
NEW_RECOVERY_REPRESENTATIVE_EMAIL
SUPPORT_OPERATOR_ID
SUPPORT_RECOVERY_REASON
```

```sh
npm run organizations:create-invitation --prefix backend
npm run authentication:recover-admin-totp --prefix backend
```

## Diagnóstico {#diagnosis}

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

## Publicação e recuperação {#release}

Staging é publicado a partir de `develop`, após a CI: API no Azure App Service e frontend no Static Web Apps, com verificação de endpoints após a API. A documentação é publicada no GitHub Pages com `DOCS_BASE=/ABP-3DSM/`. Antes de repetir uma publicação, identifique a etapa que falhou. Não há restauração automática de banco nesse fluxo. `npm run dev:down` preserva o volume; a remoção do volume apaga dados locais.

## Leitura relacionada {#related}

[Primeiros passos](./getting-started) · [Referência da API](./reference/api)
