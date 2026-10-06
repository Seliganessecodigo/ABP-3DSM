# Deploy de staging e gates de qualidade

## Staging no Azure

A assinatura `Azure for Students` usa o tenant `eabe64c5-68f5-4a76-8301-9577a679e449` e o subscription ID `12692f32-f4bd-4549-b1f4-2d0c0fcf13aa`. O resource group é `azrggreenerstaging`.

- Frontend: https://wonderful-glacier-044773e0f.1.azurestaticapps.net
- API: https://app-greener-api-staging-brs-ecxiqsrl.azurewebsites.net
- API health: `/health`
- App Service: `app-greener-api-staging-brs-ecxiqsrl`
- Static Web App: `swa-greener-staging-eus2-nyg4tklq`

O GitHub Actions publica somente o branch `develop`. A identidade `id-greener-github-deploy` autentica por OIDC usando o environment `staging`; tem a role `Website Contributor` limitada ao App Service da API. O token de publicação do frontend fica como secret do environment `staging` e não deve ser gravado no repositório.

Para repetir manualmente: **Actions → Deploy staging → Run workflow**, selecionando `develop`. Pushes para `develop` executam CI e só iniciam a publicação depois do sucesso dos quality gates.

A infraestrutura está definida em `infra/main.bicep`. Antes de reaplicar mudanças de infraestrutura, rode `./infra/deploy-staging.ps1 -PreviewOnly`, revise o `what-if` e confira o saldo/custo estimado no Azure for Students.

## SonarQube Cloud

O CI executa lint, typecheck, build e migrações de PostgreSQL, além da análise SonarQube Cloud. O scan espera pelo quality gate; falhas bloqueiam o CI e o deploy.

Configure no repositório GitHub, em **Settings → Environments → quality**:

- Secret `SONAR_TOKEN`: token de análise criado no SonarQube Cloud.
- Variable `SONAR_ORGANIZATION`: chave da organização exibida no SonarQube Cloud.
- Variable `SONAR_PROJECT_KEY`: chave do projeto importado.

Importe `Seliganessecodigo/ABP-3DSM` no SonarQube Cloud como projeto público antes de criar o token. Mantenha o token somente como secret no environment `quality`.

## Regras de branch no GitHub

Em **Settings → Rules → Rulesets**, crie um ruleset direcionado a `develop` que exija PR e os checks:

- `Frontend build and lint`
- `Backend build, lint, typecheck, and migrations`
- `SonarQube Cloud quality gate`

Bloqueie force push e remoção da branch. No fim da sprint, aplique proteção equivalente a `main`. A integração GitHub disponível para este ambiente permite consultar configurações, mas não criar rulesets; salve essa parte pelo GitHub UI.

## Limites conhecidos

Ainda não há scripts de testes unitários ou de integração no frontend/backend. Inclua testes automatizados junto com as features e adicione os comandos correspondentes aos jobs de CI. O App Service F1 é gratuito; o PostgreSQL B1ms é cobrado e consome o crédito estudantil. Configure alertas de custo e acompanhe o saldo.