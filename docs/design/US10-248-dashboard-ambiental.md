# Dashboard ambiental — US-10 / task #248

Status: **em revisão; entrega parcial**. Este registro não encerra a task #248 nem aprova o handoff de implementação #61.

## Arquivo e referência

- [Dashboard desktop existente — 8:2](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=8-2).
- [Dashboard mobile ajustado — 414:1362](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=414-1362).
- [Protótipo mobile](https://www.figma.com/proto/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=414-1362&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=414%3A1362).
- Referência visual: PNG fornecido pelo solicitante na conversa da task. O print orienta hierarquia, cores, indicadores e gráficos; ações visuais fora do MVP continuam sujeitas ao escopo da issue.

## Alterações verificadas no mobile

O frame usa viewport de 390 × 844 e rolagem vertical. O conteúdo permanece em auto layout, com margem externa de 16 px, sem padding horizontal duplicado, largura útil de 358 px e separação de 16 px entre seções. Foram preservados os elementos e estilos existentes; as artes dos dois gráficos foram adaptadas em vetores para a largura mobile.

- Cabeçalho com quebra de linhas no resumo; filtros distribuídos em linhas e controles com 44 px de altura. Ordem final das opções: 24 h, 7 dias, 30 dias e 90 dias.
- Alerta com mensagem completa e ação em linha separada. A leitura anterior continua identificada pelo horário; ausência não se transforma em zero.
- Quatro indicadores em coluna, com altura de 112 px e padding interno de 16 px. Cobertura apresenta `85%`, com contexto separado para energia (92%) e CO₂e (85%, 36 de 42 aplicações).
- Resumo dos estados: 31 disponíveis, 4 indisponíveis, 5 sem métricas e 2 removidas. O valor principal permanece `31 disponíveis`.
- Série temporal com eixos de 12 px, espaço para datas e interrupção da linha atual na lacuna. O tooltip reduzido da versão desktop foi retirado da composição estática mobile; sua interação ainda precisa ser prototipada.
- Composição com donut acima da legenda, nomes e percentuais/valores inteiros visíveis em linhas distintas. Parcelas ilustrativas: 8,4 + 4,2 + 3,2 + 2,1 + 23,3 = 41,2 kgCO₂e; percentuais arredondados somam 100%.
- Tabela com linhas de 44 px e texto dos dados de 12 px. Cabeçalho das colunas e linhas ficam em contêiner horizontal próprio; título, instrução de deslizar e busca ficam fora desse contêiner. A rolagem foi testada para acessar região e energia mantendo a busca visível.
- Colunas e Exportar CSV foram retirados dos controles mobile: a issue declara que essas ações não entram no MVP por inferência do print.
- Textos auxiliares de qualidade dos dados ampliados para 12 px. O fluxo de apresentação mobile tem início próprio e rolagem vertical configurada.

## Ajustes desktop conferidos contra o PNG

- Frame desktop mantido em 1440 × 1134; padding externo reduzido a 8 px. O cartão adicional de qualidade dos dados foi retirado para liberar a área da tabela, que é a última seção mostrada na referência.
- Alerta atualizado para a mensagem de dado válido desatualizado às 14:20 e sua participação de 20% no CO₂e. O cartão de cobertura agora exibe `85%` e `36 de 42 aplicações com dados válidos`.
- Cartão de aplicações por estado apresenta as quatro contagens da referência: 31 disponíveis, 4 indisponíveis, 5 sem métricas e 2 removidas.
- Donut mantém a soma de 41,2 kgCO₂e, com os cinco valores e percentuais completos. A linha `Outras` duplicada no topo foi removida; o painel ficou em 392 × 308 px para manter todos os valores visíveis.
- Navegação desktop recebeu o bloco verde “Tecnologia para um amanhã mais verde.” no espaço da referência. Seletor de idioma, modo escuro e título “Preferências” foram ocultados neste frame.
- A revisão visual confirmou a estrutura principal, a mensagem do alerta, os quatro estados e os valores completos da composição na tela desktop.

Ainda há diferenças visuais frente ao PNG: o cartão de estados usa rótulos textuais em vez de quatro badges coloridos; o bloco promocional não tem o ícone de folha nem o degradê; o painel do donut não mostra as abas “Por aplicação/Por região” nem o seletor `kgCO₂e`; a série temporal ainda precisa do padrão hachurado para o intervalo sem observações. O balanço entre os painéis temporais e do donut foi aproximado, mas não reproduz a proporção do PNG ao pixel.

As telas foram inspecionadas visualmente pela interface do Figma. Uma captura local final versionada continua pendente. As artes SVG importadas são vetoriais; isso não equivale a componentes interativos ou a validação de acessibilidade.

## Revisão UX/UI

Uma revisão independente por agente identificou cortes na composição/tabela, eixos e tooltip pequenos, vazio excessivo nos KPIs, unidade incorreta na cobertura, omissão de removidas e ordem dos períodos. As correções acima foram aplicadas e conferidas diretamente no protótipo. A nova revisão independente e a revisão desktop ficaram pendentes: o agente atingiu seu limite de uso e, depois, o navegador deixou de responder em duas tentativas de recuperação.

O frame desktop foi ajustado e conferido visualmente, mas a nova revisão independente UX/UI ainda está pendente. Não apresentar a entrega como concluída ao PO até fechar as diferenças visuais acima e validar o design system.

## Critérios ainda pendentes

| Área | Trabalho necessário antes do aceite |
| --- | --- |
| Desktop | Fechar badges de estados, banner promocional, controles do donut e hachuras da série temporal; comparar espaçamentos contra o PNG e registrar evidência final. |
| Design system | Auditar vínculos de todos os elementos pertinentes à biblioteca 28:336, consolidação #260 e temas #213. Os gráficos importados não ganharam bindings de variáveis automaticamente. |
| Navegação mobile | Consumir a solução global de #271, com controle de menu acessível e retorno às demais áreas; a navegação global permanece responsabilidade dessa task. |
| Estados | Criar e ligar carregamento, vazio, nenhum resultado, erro/retry, sucesso e estados parciais; documentar transições. |
| Contexto | Demonstrar navegação ao detalhe preservando período/filtros e retorno, em alinhamento com #262. |
| Comparação | Validar duração, cobertura e referência com o contrato aprovado #156; o checkbox visual não comprova uma interação implementada. |
| Tabela | Demonstrar busca, filtros, ordenação e paginação de todo o conjunto; a amostra de cinco linhas continua ilustrativa e não demonstra o padrão de dez itens. |
| Acessibilidade e idiomas | Documentar foco/teclado, mensagens acessíveis, contraste calculado e expansão dos textos nos oito idiomas. |
| Evidência e PO | Capturar antes/depois final, repetir revisão UX/UI das duas versões e registrar decisão do PO. |

## Contrato de interação para concluir a tabela

Esta matriz é especificação para o handoff; não descreve controles já navegáveis no Figma nem presume endpoints novos.

| Coluna | Tipo | Filtro | Ordem |
| --- | --- | --- | --- |
| Aplicação | Nome/identidade textual | Texto livre por trecho | Locale, crescente/decrescente |
| Estado | Enum do contrato | Select com valores aprovados | Pendente de definir a ordem semântica no contrato; não usar ordem de cor |
| Região | Código/nome textual | Texto livre; ausência explícita se permitida | Locale, crescente/decrescente |
| Energia (kWh) | Número ou ausência | Mínimo/máximo em kWh e opção de ausência | Valor numérico, crescente/decrescente |
| CO₂e (kgCO₂e) | Número ou ausência | Mínimo/máximo em kgCO₂e e opção de ausência | Valor numérico, crescente/decrescente |
| Atualização | Instante e condição da observação | Início/fim, com fuso identificado; condição separada | Instante, crescente/decrescente |
| Tendência, se mantida | Série/decoração | Sem filtro por desenho; valores pesquisáveis somente se exibidos e aprovados | Não ordenar pela geometria |
| Ações de detalhe | Ação | Não se aplica | Não ordenável |

Confirmar a ordem inicial com produto/contrato. Manter uma coluna ativa por vez, ausentes ao final nas duas direções e desempate pela identidade estável. Expor direção e `aria-sort`, sem depender apenas da seta/cor.

Busca geral: OU entre todas as colunas de dados exibidas, ignorando caixa e acentos; AND com filtros específicos. Pesquisar valores completos em todo o conjunto autorizado antes da paginação, excluindo segredos e marcadores de ausência. Exibir filtros ativos e limpar por coluna ou todos, preservando ordenação.

Paginação: padrão 10; opções 5, 10, 15, 20 e Todos. Mudanças de busca/filtros/ordem/tamanho retornam à primeira página; preservar esses critérios e página na URL, recarga, voltar/avançar e retorno do detalhe. Exibir intervalo e total filtrado, sem linhas vazias artificiais e com ações desabilitadas nos limites. Todos abrange o conjunto filtrado completo autorizado, conforme contrato, sem inventar valor especial de API. Paginar a lista não reduz totais, gráfico ou percentuais globais.

## Verificações

- Inspeção visual do dashboard desktop após os ajustes descritos e teste de rolagem no protótipo mobile, conforme descrito acima.
- Conferência aritmética dos exemplos da composição e dos estados (31 + 4 + 5 + 2 = 42).
- `git diff --check` para o handoff e configuração local.
- Sem alterações executáveis de frontend/backend; testes de aplicação não executados. Build/lint, SonarQube, acessibilidade e aceite do PO não são declarados aprovados por este registro.
