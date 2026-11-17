# Configurações integradas — #94 / #161

Implementação baseada na [versão 2 do protótipo #255](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=857-4182), cuja direção visual foi aprovada pelo solicitante na conversa.

- Admin: Monitoramento, Usuários, Auditoria e Minha conta.
- Analista/Visitante: Minha conta; áreas administrativas diretas apresentam acesso negado e não iniciam a consulta.
- Usuários existentes integrados a Configurações, sem item separado da sidebar. Convites Google preservados; criação de conta e mudanças de papel/estado usam os contratos existentes, motivo e confirmação.
- Links antigos de usuários preservados como alias. Metodologia e minhas preferências mantém a tela e os efeitos atuais.
- Superfície contínua, títulos e divisórias; sem coleção de cards de indicadores.

## Evidências locais

- [Usuários dentro de Configurações — desktop](usuarios-integrados-desktop.png).
- [Monitoramento — desktop](monitoramento-desktop.png).
- [Auditoria — desktop](auditoria-desktop.png).
- [Minha conta — mobile](conta-mobile.png).
- [Usuários — mobile](usuarios-mobile.png).

As capturas usam respostas controladas do Playwright. Nomes, contagens e horários são dados de teste, não valores adicionados ao produto. A UI de produção consulta somente a API GreenER autenticada.

## Verificações

- `npm ci`, `npm run lint`, `npm run build`: executados. O build mantém o aviso de bundle acima de 500 kB.
- `npm run test:unit`: 72 testes passaram, incluindo integridade dos doze catálogos de idioma.
- `npm run test:e2e -- e2e/settings.spec.ts e2e/accounts.spec.ts --workers=1`: 23 testes passaram.
- Testes de menu desktop/mobile nas linhas 521/538 de `applications.spec.ts`: dois passaram.
- `npm run test:e2e -- e2e/theme.spec.ts e2e/page-help.spec.ts:70 --workers=1`: 24 testes passaram, após corrigir o bloqueio do módulo React no teste de inicialização do tema para também reconhecer query strings do Vite.
- Verificação visual das capturas desktop/mobile realizada; não equivale à homologação contra fontes externas reais.
- `git diff --check`: executado.

Os testes novos cobrem pausa, falha/retry, cancelamento/foco, payload inválido, diagnóstico ausente, sessão/papel, criação, alteração de papel, bloqueio/reativação/desativação, conflito, preservação de convites, URL entre abas, auditoria, tema sincronizado e mobile sem ampliar a largura da página. A proteção de último Admin, autorrebaixamento e transições continua sendo verificada no backend existente; a UI não duplica essas regras.

Backend, migrations e dependências não foram alterados. Testes locais usam mocks HTTP; o fluxo com backend/PostgreSQL e o gate obrigatório do SonarQube Cloud devem ser conferidos na CI. `docs:build` não foi executado localmente: as mudanças documentais estão no frontend e em evidências internas, sem alterar páginas publicadas em `docs/`.

## Pendências explícitas

Os aceites antigos de #94 e #95 ainda citam execução manual e parâmetros editáveis/versionados. A conversa aprova monitoramento com intervalo somente leitura, e o contrato conferido não tem essas operações. Esses critérios precisam ser realinhados, não simulados por endpoints ou campos inventados. A implementação consulta o último ciclo disponível; histórico completo de ciclos e seu contrato de filtros/Todos ficam fora desta entrega. Nenhuma issue é encerrada pela abertura da PR.
