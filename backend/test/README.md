# test

Testes de integração e ponta a ponta do backend, fixtures e configuração de ambiente de teste. Testes unitários específicos devem ficar próximos do código testado.

## Fluxo integrado de qualidade (#129 / RNF-06)

`src/modules/applications/quality-flow.database.spec.ts` usa a aplicação Nest completa, os adapters HTTP reais, fontes HTTP locais e PostgreSQL com todas as migrations. Verifica descoberta, coleta, cálculo, evidências do modelo/fator, dashboard, detalhe, série, prévia sem alteração do histórico, falhas parciais e recuperação. A matriz administrativa usa convites SSO: leitura pública, Admin permitido, Analyst/Visitor/conta desativada negados, validação, ausência de segredos e rollback de convite/revogação quando a auditoria falha.

`frontend/tests/integration/quality-flow.spec.ts` abre a aplicação no Chromium contra esse backend. Não intercepta respostas da API. Reconcilia valores/cobertura/período entre dashboard, detalhe e histórico, testa retorno/reload e confirma que a prévia mantém os totais originais.

### Reproduzir em PowerShell

Na raiz de um checkout de teste, com Docker disponível:

```powershell
docker run --detach --rm --name greener-quality-postgres --env POSTGRES_DB=greener_quality --env POSTGRES_USER=greener --env POSTGRES_PASSWORD=greener_ci_only --publish 127.0.0.1:55439:5432 postgres:18-alpine
$env:TEST_DATABASE_URL = 'postgresql://greener:greener_ci_only@127.0.0.1:55439/greener_quality'
npm ci --prefix backend
npm ci --prefix frontend
npm test --prefix backend -- --runInBand quality-flow.database.spec.ts
Push-Location frontend
npx playwright install chromium
npm run test:integration
Pop-Location
docker stop greener-quality-postgres
```

Em Linux/macOS, exporte a mesma variável com `export TEST_DATABASE_URL='...'` e execute os comandos npm nas mesmas pastas. No CI, o job backend já fornece PostgreSQL e executa ambas as suítes; o gate do SonarQube continua obrigatório.

A credencial acima é demonstrativa, exclusiva do container de teste. A conexão indicada em `TEST_DATABASE_URL` precisa de permissão `CREATEDB`: cada fixture cria um banco `quality_129_<uuid>` separado, aplica migrations e remove somente esse banco ao encerrar. Não usa nem limpa o banco da aplicação. Em interrupção forçada, bancos temporários podem permanecer até o descarte do container. As portas 4300/4301 são reservadas pela suíte do navegador; nenhum servidor existente é reutilizado. O scheduler é desativado e os ciclos são disparados explicitamente. E-mail é capturado em memória; fontes externas reais não são chamadas.

As demais suítes de banco continuam sendo executadas pelos comandos existentes, com `TEST_DATABASE_URL` apontando para PostgreSQL descartável. Sem essa variável, os testes de banco do Jest são ignorados; a suíte do navegador falha explicitamente em vez de usar o banco da aplicação.

Convite e auditoria são persistidos na mesma transação antes do envio do e-mail. Este teste não define política de entrega de e-mail nem adiciona outbox ou compensação para falhas do provedor de e-mail.

`frontend/tests/integration/account-setup.spec.ts` percorre as telas de aceite de convite e criação de senha com os e-mails capturados da API real. Valida acesso ao cadastro TOTP e rejeição de link de confirmação reutilizado. O processo `quality-flow.server.ts` reserva também `127.0.0.1:4302` para consultar essa caixa de teste em memória; ela não faz parte da API de produção. As chaves demonstrativas do processo são exclusivas do banco descartável. Nenhuma mensagem é enviada a destinatários reais.
