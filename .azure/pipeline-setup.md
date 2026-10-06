# Configuração do deploy de staging no GitHub

O deploy automático ocorre somente depois de uma execução bem-sucedida do workflow `CI` para `develop`. A execução manual também só publica o ref `develop`. Pull requests só executam CI. Não existe workflow de produção nem gatilho em `main`.

## 1. Infraestrutura já provisionada

1. Entre na assinatura Azure for Students: `az login --tenant eabe64c5-68f5-4a76-8301-9577a679e449`.
2. Confirme `az account show --subscription 12692f32-f4bd-4549-b1f4-2d0c0fcf13aa` e verifique o nome **Azure for Students** antes de continuar.
3. A infraestrutura do grupo `azrggreenerstaging` já foi provisionada. Frontend e serviços auxiliares ficam em East US 2; API e PostgreSQL 17 B1ms ficam em Brazil South.
4. Para repetir uma implantação de infraestrutura, execute `./infra/deploy-staging.ps1 -PreviewOnly`, revise o `what-if` e então execute `./infra/deploy-staging.ps1`. O script valida assinatura e tenant, compila Bicep e gera uma senha PostgreSQL forte em memória. Ela passa por um arquivo temporário com acesso restrito, removido automaticamente ao fim, e é armazenada no Key Vault pelo deployment.
5. URLs atuais: API `https://azappecxiqsrlijpgo.azurewebsites.net`; frontend `https://black-beach-07872580f.4.azurestaticapps.net`. O token do Static Web App deve ser copiado diretamente do portal Azure para o GitHub Secret, nunca para um arquivo do repositório.

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
| `AZURE_RESOURCE_GROUP` | `azrggreenerstaging` |
| `AZURE_API_APP_NAME` | `azappecxiqsrlijpgo` |
| `VITE_API_URL` | `https://azappecxiqsrlijpgo.azurewebsites.net` |

### Secrets

| Nome | Valor |
| --- | --- |
| `AZURE_CLIENT_ID` | Client ID da identidade OIDC dedicada ao GitHub Actions |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token do Static Web App de staging |

Depois de criar os recursos e cadastrar as variáveis e secrets, uma execução CI bem-sucedida em `develop` compila e publica API e frontend. A primeira implantação também pode ser disparada em **Actions → Deploy staging → Run workflow**, selecionando `develop`.

## Restrições de custo e acesso

- O plano da API em Brazil South e o Static Web App em East US 2 são configurados nos níveis gratuitos.
- O PostgreSQL usa B1ms, 32 GB, sem alta disponibilidade e backup geo-redundante; confirme que a oferta estudantil está aplicada no portal antes de considerar o serviço gratuito.
- O workspace de logs tem retenção de 30 dias e limite diário de ingestão configurável.
- O firewall PostgreSQL `0.0.0.0` permite conexões a partir de serviços Azure; o servidor continua exposto por endpoint público. Não use este ambiente para dados reais.
- O limite de ingestão de logs não é um orçamento financeiro. Crie alertas de orçamento no Cost Management e confira periodicamente o saldo/consumo no Education Hub.
