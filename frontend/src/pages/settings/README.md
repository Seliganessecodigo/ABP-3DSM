# Configurações

`SettingsPage` compõe `/settings?tab=monitoring|users|audit|account`. Admin vê as quatro áreas; demais papéis autenticados veem Minha conta. Navegação direta a uma área administrativa por outro papel apresenta acesso negado sem iniciar a consulta. Ausência de sessão oferece login. As APIs continuam responsáveis pela autorização.

O layout segue a [versão 2 do protótipo #255](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=857-4182), aprovada pelo usuário após feedback sobre excesso de cards: superfície contínua, navegação sublinhada, integrações em linhas e tabelas com divisórias. Os links das áreas são navegação real, utilizáveis por teclado e pelo histórico do navegador.

- `MonitoringSettings`/`useMonitoring` consultam saúde, fontes e o último ciclo. Atualizar é somente leitura. Pausa/retomada exige motivo e confirmação; falha mantém estado e motivo. Controle sem estado conhecido fica bloqueado. Ciclo em andamento pode concluir e a pausa pode criar lacunas; aplicações externas continuam funcionando.
- `AuditSettings` consulta a auditoria autorizada com busca, resultado, responsável, operação, motivo e datas explícitas em UTC. Ordenação usa instante, responsável, operação ou resultado. O detalhe apresenta os snapshots autorizados, motivo e identidade do evento. Nada é exportado ou alterado pela consulta.
- `pages/accounts/AccountsPage` é reutilizada como conteúdo da aba Usuários. Gestão de contas, convites e seus hooks continuam nessa pasta. `/administration/users` é um alias que preserva a consulta e abre `tab=users`; a entrada separada da sidebar foi removida.
- Minha conta apresenta dados da sessão somente para consulta, reaproveita os idiomas existentes e a preferência local de tema, incluindo Sistema. Os controles de tema da conta e sidebar sincronizam a mesma preferência. Não acrescenta edição genérica de perfil ou controles de senha sem contrato.

As consultas de auditoria e usuários mantêm parâmetros independentes na URL (`audit.*` e `users.*`), preservados ao alternar áreas. Busca/filtros/ordenação são enviados ao servidor antes de paginar; 10 é o tamanho inicial e as opções são 5/10/15/20/Todos. Todos usa o contrato `pageSize=all`. Requisições e operações são canceladas ao desmontar; respostas antigas não substituem o contexto atual.

“Metodologia e minhas preferências” permanece na rota existente com os mesmos formulários e efeitos. A configuração pessoal contém apenas um acesso para essa tela. `/administration/calculations` continua atendendo links existentes para a prévia; deixou de ser o destino do menu Configurações. O backend de recálculo e os resultados históricos não foram alterados.

## Limites das tasks

Refs #94, #161 e #255. As consultas de saúde/auditoria atendem parte do fluxo descrito em #246, compartilhando a navegação proposta. Não encerrar nenhuma issue antes da revisão e do merge.

O contrato atual não oferece execução manual nem edição de parâmetros versionados. A proposta aceita mantém o intervalo somente leitura e não aprova coeficientes ou fatores editáveis. Por isso, os aceites antigos de #94 (manual) e #95 (parâmetros autorizados/limites/vigência) precisam ser realinhados com o produto. Nenhum endpoint, limite ou campo fictício foi criado para simular esse suporte. Ciclos anteriores, filtros/paginação completos de ciclos e diagnóstico dedicado de banco não são presumidos a partir do resumo de saúde atual.

## Verificação

Na pasta `frontend`: `npm ci`, `npm run lint`, `npm run build`, `npm run test:unit` e `npm run test:e2e -- e2e/settings.spec.ts e2e/accounts.spec.ts --workers=1`. O Playwright aceita `PLAYWRIGHT_PORT` quando houver outra instância local. Testes de tema, navegação e ajuda verificam os controles compartilhados; a CI mantém o gate SonarQube e o fluxo com backend/PostgreSQL reais.

Os testes locais usam respostas controladas: sucesso/falha, ausência e payload inválido, autorização, confirmação, conflito, cancelamento, convites preservados, URL, temas e mobile. Eles não substituem homologação com APIs e banco reais.
