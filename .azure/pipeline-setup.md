# Deploy de staging e gates de qualidade

## Staging no Azure

A assinatura `Azure for Students` usa o tenant `eabe64c5-68f5-4a76-8301-9577a679e449` e o subscription ID `12692f32-f4bd-4549-b1f4-2d0c0fcf13aa`. O resource group é `azrggreenerstaging`.

- Frontend: https://wonderful-glacier-044773e0f.1.azurestaticapps.net
- API: https://app-greener-api-staging-brs-ecxiqsrl.azurewebsites.net
- API health: `/health`
- App Service: `app-greener-api-staging-brs-ecxiqsrl`
- Static Web App: `swa-greener-staging-eus2-nyg4tklq`

O GitHub Actions publica somente o branch `develop`. A identidade `id-greener-github-deploy` autentica por OIDC usando o environment `staging`; tem a role `Website Contributor` limitada ao App Service da API. O token de publicação do frontend fica como secret do environment `staging` e não deve ser gravado no repositório.

Para repetir manualmente: **Actions → Deploy staging → Run workflow**, selecionando `develop`. Pushes para `develop` executam CI e só iniciam a publicação depois do sucesso das verificações de frontend, backend e documentação.

A infraestrutura está definida em `infra/main.bicep`. Antes de reaplicar mudanças de infraestrutura, rode `./infra/deploy-staging.ps1 -PreviewOnly`, revise o `what-if` e confira o saldo/custo estimado no Azure for Students.

## Verificações e operação

Consulte os [gates de qualidade](../.github/quality-gates.md) para a matriz de CI e as regras de branches, e o [guia de operação](../docs/operations.md) para diagnóstico e configuração.
