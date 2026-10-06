# Configuração do deploy de staging no GitHub

O deploy automático ocorre somente depois de uma execução bem-sucedida do workflow `CI` para `develop`. A execução manual também só publica o ref `develop`. Pull requests só executam CI. Não existe workflow de produção nem gatilho em `main`.

## 1. Provisionar a infraestrutura

1. Entre na assinatura Azure for Students: `az login --tenant eabe64c5-68f5-4a76-8301-9577a679e449`.
2. Confirme `az account show --subscription 12692f32-f4bd-4549-b1f4-2d0c0fcf13aa` e verifique o nome **Azure for Students** antes de continuar.
3. No repositório, execute `./infra/deploy-staging.ps1 -PreviewOnly` e revise o `what-if`.
4. Execute `./infra/deploy-staging.ps1` para criar os recursos de staging. O script confirma assinatura e tenant antes de qualquer gravação, compila Bicep e solicita a senha PostgreSQL sem persistir em arquivo.
5. Guarde os nomes e URLs retornados pelo deployment; o token de deploy do Static Web App pode ser consultado no portal Azure e deve ser copiado diretamente para o GitHub Secret, nunca para um arquivo do repositório.

## 2. Criar a identidade OIDC do GitHub Actions

Crie uma **User Assigned Managed Identity** dedicada ao pipeline em um resource group de identidade separado. Configure uma credencial federada com:

- Issuer: `https://token.actions.githubusercontent.com`
- Subject: `repo:Seliganessecodigo/ABP-3DSM:environment:staging`
- Audience: `api://AzureADTokenExchange`

Atribua `Website Contributor` no resource group da aplicação para permitir o deploy do pacote no App Service. Não reutilize a identidade gerenciada da aplicação.

## 3. Configurar o environment `staging` no GitHub

Em **Settings → Environments**, crie `staging` e configure:

### Variables

| Nome | Valor |
| --- | --- |
| `AZURE_TENANT_ID` | `eabe64c5-68f5-4a76-8301-9577a679e449` |
| `AZURE_SUBSCRIPTION_ID` | `12692f32-f4bd-4549-b1f4-2d0c0fcf13aa` |
| `AZURE_RESOURCE_GROUP` | Resource group de staging criado pelo script |
| `AZURE_API_APP_NAME` | Output `apiAppName` do deployment |
| `VITE_API_URL` | Output `apiUrl` do deployment, sem barra final |

### Secrets

| Nome | Valor |
| --- | --- |
| `AZURE_CLIENT_ID` | Client ID da identidade OIDC dedicada ao GitHub Actions |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token do Static Web App de staging |

Depois de criar os recursos e cadastrar as variáveis e secrets, uma execução CI bem-sucedida em `develop` compila e publica API e frontend. A primeira implantação também pode ser disparada em **Actions → Deploy staging → Run workflow**, selecionando `develop`.

## Restrições de custo e acesso

- O plano da API e o Static Web App são configurados nos níveis gratuitos.
- O PostgreSQL usa B1ms, 32 GB, sem alta disponibilidade e backup geo-redundante; confirme que a oferta estudantil está aplicada no portal antes de considerar o serviço gratuito.
- O workspace de logs tem retenção de 30 dias e limite diário de ingestão configurável.
- O firewall PostgreSQL `0.0.0.0` permite conexões a partir de serviços Azure; o servidor continua exposto por endpoint público. Não use este ambiente para dados reais.
- O limite de ingestão de logs não é um orçamento financeiro. Crie alertas de orçamento no Cost Management e confira periodicamente o saldo/consumo no Education Hub.
