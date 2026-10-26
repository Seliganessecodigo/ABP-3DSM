# Auditoria das telas implementadas — aplicação e Figma

Data: 26/10/2026. Aplicação: `origin/develop`, commit `5bf6be7`, após a integração da PR #328.

**Resultado:** o dashboard tem divergências confirmadas com os metadados atuais do Figma. O catálogo difere das capturas de design versionadas. A conferência completa dos frames atuais de catálogo, detalhe, metodologia e componentes ficou bloqueada pela cota do Figma; esses pontos são apresentados como pendências, sem afirmar que estejam ausentes no arquivo atual.

## Evidências e alcance

- 27 capturas novas com Playwright/Chromium, incluindo as quatro páginas implementadas, seleção de aplicação na metodologia, filtros, detalhe em tabela/contexto, menu mobile, tema escuro e carregamento inicial.
- Viewports: notebook `1366×850`, monitor `1920×1080` e celular `390×844`. As imagens são `fullPage`: algumas ultrapassam a altura do viewport por conterem rolagem vertical.
- Idioma das capturas: português brasileiro. Contexto de navegador: `America/Sao_Paulo`. Tema escuro capturado em 1920 px. Movimento reduzido habilitado para estabilizar as imagens.
- Respostas controladas reutilizam os fixtures de `frontend/e2e/`. A análise ambiental usa o mesmo cenário do teste de responsividade. Não são respostas reais do backend nem uma validação dos cálculos. O fator indisponível no detalhe e a fórmula disponível na coleta/metodologia são estados de endpoints diferentes desses fixtures.
- Nenhuma tela ou componente foi alterado no Figma ou na aplicação.
- A consulta inicial ao [arquivo GreenER](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=0-1) retornou metadados da página `Design System + Protótipos`, incluindo o dashboard desktop `8:2` e mobile `414:1362`. As consultas seguintes, inclusive inspeção pela Plugin API, foram recusadas pelo limite do plano Starter. Não foi obtido um render atual do Figma.
- A tentativa de abrir o arquivo pelo navegador retornou HTTP 403: [registro](figma-browser.json) e [captura do bloqueio](figma-browser.png).

O relatório diferencia três níveis: **confirmado nos metadados atuais**, **diferença contra referência versionada** e **conferência pendente**. Diferença de valores de exemplo, quantidade de aplicações ou datas não é tratada como desatualização de design.

## 1. Dashboard: divergências confirmadas

Referência atual consultada: [US-10 · Dashboard ambiental · #248 — 8:2](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=8-2). Evidências da aplicação: [notebook](dashboard-1366-claro.png), [monitor](dashboard-1920-claro.png) e [celular](dashboard-390-claro.png).

| Prioridade | O que o frame apresenta | O que existe na aplicação | Atualização necessária no Figma |
| --- | --- | --- | --- |
| Alta | Gráfico agregado de CO₂e com série atual, anterior, lacunas, marcador de região e tooltip (`8:61`, `15:196`, `15:167`, `15:191`). | Painel informa que a série histórica agregada ainda não faz parte do contrato da API. | Representar o estado indisponível entregue. Identificar o gráfico demonstrativo como proposta futura, se for mantido. |
| Alta | Checkbox “Comparar com período anterior” (`15:231`) e variações percentuais nos KPIs (`8:47`, `8:51`). | Aviso de comparação indisponível; os KPIs mostram cobertura, sem as variações demonstrativas. | Substituir esses elementos na versão que documenta o produto implementado. |
| Alta | “Ao vivo · 14:32” e “Próximo ciclo previsto: 1 min” no header (`15:232`, `15:233`). | Botão “Atualizar dados”, data de corte dos dados e resumo do escopo/período. | Atualizar o cabeçalho e distinguir atualização manual, data dos dados e eventual acompanhamento automático. |
| Média | Tabela com Aplicação, Estado, Região, Energia, CO₂e e Atualização (`8:77`). | Região atual, coberturas de energia e CO₂e separadas; texto explica a diferença entre região histórica do filtro e região atual da aplicação. | Atualizar colunas e explicação de contexto. |
| Média | Ferramentas “Colunas” e “Exportar CSV” (`15:239`, `15:241`). | Busca e botão “Filtros”, além de tamanho de página e paginação; esses dois controles do protótipo não aparecem na tela entregue. | Trocar os controles da versão implementada ou identificá-los como fora do escopo atual. |
| Média | Cobertura genérica “85% / 36 de 42 aplicações” no desktop (`8:52`–`8:55`). | Cobertura do período com energia e CO₂e explicitamente separados. | Atualizar conteúdo e hierarquia do card. Não confundir percentual de aplicações com cobertura das duas métricas. |
| Baixa | Ordem desktop: 24 h, 30 dias, 7 dias, 90 dias (`8:29`, `8:33`, `8:31`, `8:35`). | 24 horas, 7 dias, 30 dias, 90 dias. | Uniformizar ordem e rótulos com a aplicação. |

O frame desktop tem `1440×1134`; o mobile tem `390×2262`. Essas dimensões vêm dos metadados consultados, não de uma captura atual renderizada. Não foi feita comparação de cores, tipografia ou alinhamento pixel a pixel.

## 2. Catálogo: diferenças contra as referências versionadas

Referências: [design desktop escuro](../213-temas/aplicacoes-escuro-desktop.png), [design mobile escuro](../213-temas/aplicacoes-escuro-mobile.png) e [origem dessas evidências](../213-temas/README.md). São referências históricas; não comprovam como o arquivo Figma está hoje.

| Área | Referência versionada | Aplicação atual | O que conferir/atualizar no frame atual |
| --- | --- | --- | --- |
| Cabeçalho | Título, descrição e busca. | Acrescenta “Monitoramento”, “Atualizar catálogo” e “Filtros por coluna”. | Cabeçalho e [painel de filtros](catalogo-filtros.png). |
| Colunas e localização | “Região”, códigos como `sa-east-1`, cidade ausente como traço. | “Código regional”, resposta da origem como `BR-SP`, “Não informada” para cidade nula. | Terminologia e exemplos compatíveis com o contrato vigente; não converter códigos por estética. |
| Estado | Badge simples. | Badge com texto/símbolo e abertura do motivo operacional. | Representar estado fechado/aberto e ações. |
| Verificação | Somente hora. | Data, hora e fuso horário. | Reservar espaço para o texto completo. |
| Ação e paginação | “Ver detalhes →”; indicador de página textual no mobile. | Ícone de olho, texto no mobile, seletor de quantidade e páginas numeradas. | Atualizar ações e rodapé. |
| Painel inferior | “Nenhuma aplicação selecionada” no desktop. | A navegação abre a rota do detalhe; esse painel não aparece no catálogo. | Retirar o painel da representação da tela entregue, se ainda existir. |
| Mobile | Cartões muito compactos, com informações em poucas linhas. | Campos rotulados por linha, botão de detalhe e cartões mais altos. | Atualizar altura/densidade dos cartões e o comprimento da tela. |
| Marca e navegação | Wordmark e marca antigos nas capturas de referência. | Símbolo circular e wordmark atuais; itens ainda não implementados ficam desabilitados. | Sincronizar a marca e os estados de disponibilidade nos componentes compartilhados, se ainda estiverem antigos. |

Comparar com [catálogo atual desktop](catalogo-1920-claro.png), [escuro](catalogo-1920-escuro.png) e [mobile](catalogo-390-claro.png). A diferença de tema entre algumas imagens não é usada como evidência de alteração de cor.

## 3. Detalhe ambiental: conferência pendente dos frames atuais

Os links existentes no repositório apontam para [desktop claro `150:1105`](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=150-1105), [mobile claro `150:1403`](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=150-1403), [desktop escuro `363:19084`](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=363-19084) e [mobile escuro `363:19401`](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=363-19401). Não foram reinspecionados nesta auditoria.

As capturas atuais mostram os seguintes itens que o Figma precisa representar para documentar a implementação:

- Quatro indicadores: Energia, CO₂e, Fator regional e Cobertura; indisponibilidade não é representada como zero.
- Resumo “Como este número foi calculado” e abertura do contexto de cálculo/metodologia.
- Painel “Qualidade da coleta” separado das “Evidências da coleta”, com última tentativa e último sucesso.
- Série com alternância Energia/CO₂e, Gráfico/Tabela e granularidade Hora/Dia/Mês/Ano.
- Tabela com busca, filtros, unidades, paginação e inspeção de contribuições.
- Dados operacionais e localização acessíveis dentro do contexto expandido; não aparecem todos como blocos permanentes na tela principal.
- Em monitor grande, gráfico ocupa a altura disponível e evidências ficam na coluna direita. No celular, os blocos se empilham e há rolagem vertical.

Evidências: [desktop](detalhe-1920-claro.png), [mobile](detalhe-390-claro.png), [tabela](detalhe-tabela.png) e [contexto aberto](detalhe-contexto.png). Estes são **itens de conferência**, não uma afirmação de ausência nos frames atuais.

## 4. Metodologia e componentes compartilhados: conferência pendente

Para a metodologia, conferir duas rotas distintas: [seleção de aplicação em `/methodology`](metodologia-selecao-1366.png) e [metodologia da coleta em `/services/:id/methodology`](metodologia-1920-claro.png).

A tela da coleta apresenta indicador de energia, fórmula registrada, versão, entradas e unidades, resultado, parâmetros, configuração vinculada, validade/fonte, fator, emissões e intervalo da coleta. Há botão de retorno e breadcrumb. Estados sem coleta, sem resultado e indisponível existem no código, mas não foram capturados neste conjunto. O Figma atual dessa página não pôde ser conferido.

Na biblioteca e nos frames das quatro telas, conferir:

| Prioridade | Implementação atual que precisa estar documentada | Evidência |
| --- | --- | --- |
| Alta | Loading inicial com aviso, “Processando…” e skeletons; atualização compacta preserva dados. | [Catálogo](catalogo-loading.png), [dashboard](dashboard-loading.png), [detalhe](detalhe-loading.png), [metodologia](metodologia-loading.png). A captura do detalhe retém todas as respostas, portanto mostra a aplicação ainda sem identificação; o cenário com aplicação já carregada/período preservado está na [evidência da PR #328](../loading-locales/environmental-loading.png). |
| Média | 12 idiomas, incluindo coreano, russo, hindi e indonésio; seletor com bandeira e nome nativo. | Opções registradas em [capturas.json](capturas.json); exemplos dos idiomas em [loading-locales](../loading-locales/README.md). O arquivo de design não foi verificado quanto a esses quatro idiomas. |
| Média | Menu mobile em gaveta, marca atual, tema e disponibilidade dos destinos. | [Menu mobile](menu-mobile.png) e [catálogo escuro](catalogo-1920-escuro.png). |
| Média | Distribuição em notebook/monitor, empilhamento mobile e comportamento dos blocos que crescem. | Conjunto de capturas abaixo. Frames fixos isolados não demonstram, por si, as regras de responsividade implementadas. |

Histórico, Ranking, Comparação, Simulação regional e Configurações foram excluídos da auditoria de paridade: os itens estão desabilitados e não há páginas correspondentes no roteamento atual. Protótipos dessas áreas não devem ser classificados como desatualizados por falta de implementação.

## 5. Observações sobre a aplicação durante as capturas

Nas 27 capturas, a medição do documento apontou **zero overflow horizontal**. Isso não equivale a validar todos os componentes, larguras intermediárias, idiomas ou estados possíveis.

O detalhe ocupou exatamente a altura do viewport em `1366×850` e `1920×1080`. O dashboard completo mediu `993 px` no notebook de `850 px` de altura. A metodologia da coleta mediu `1152 px` tanto no notebook quanto no monitor de `1080 px`. Portanto, a intenção de toda informação caber sem rolagem ainda não é atendida por todas as telas nesses cenários. É uma observação da aplicação e deve ser considerada ao atualizar o design; não é prova de desatualização do Figma. Não foram feitas correções de interface nesta tarefa.

## Galeria das capturas

| Tela | Notebook 1366×850 | Monitor 1920×1080 | Celular 390×844 | Escuro 1920×1080 |
| --- | --- | --- | --- | --- |
| Catálogo | [Abrir](catalogo-1366-claro.png) | [Abrir](catalogo-1920-claro.png) | [Abrir](catalogo-390-claro.png) | [Abrir](catalogo-1920-escuro.png) |
| Dashboard | [Abrir](dashboard-1366-claro.png) | [Abrir](dashboard-1920-claro.png) | [Abrir](dashboard-390-claro.png) | [Abrir](dashboard-1920-escuro.png) |
| Detalhe ambiental | [Abrir](detalhe-1366-claro.png) | [Abrir](detalhe-1920-claro.png) | [Abrir](detalhe-390-claro.png) | [Abrir](detalhe-1920-escuro.png) |
| Metodologia da coleta | [Abrir](metodologia-1366-claro.png) | [Abrir](metodologia-1920-claro.png) | [Abrir](metodologia-390-claro.png) | [Abrir](metodologia-1920-escuro.png) |
| Seleção na metodologia | [Abrir](metodologia-selecao-1366.png) | [Abrir](metodologia-selecao-1920.png) | [Abrir](metodologia-selecao-390.png) | — |

[Galeria HTML com miniaturas](index.html). [Dados das 27 capturas](capturas.json): texto visível, cabeçalhos do DOM (inclusive seções recolhidas), dimensões, opções de idioma e navegação desabilitada.

## Reprodução e pendência para fechar a comparação

Com Node 24 e Chromium do Playwright disponíveis, na raiz desta branch:

```sh
npm ci --prefix frontend
npm run dev --prefix frontend -- --host 127.0.0.1 --port 4173 --strictPort
```

Em outro terminal:

```sh
node .github/evidencias/auditoria-figma/capture.mjs
```

O script importa os fixtures existentes, captura as telas e registra a tentativa de acesso ao Figma. Foi executado com sucesso; o acesso ao Figma terminou com 403 e ficou registrado. Não foram executados lint/build nem a suíte funcional nesta tarefa: não houve alteração no frontend/backend. A execução das capturas é evidência de apresentação, não substitui testes funcionais.

Para concluir a comparação de **todos os frames atuais**, é necessário restabelecer a leitura pelo conector Figma ou receber exportações atuais das quatro páginas e dos componentes compartilhados. Até lá, apenas os achados da seção 1 são classificados como divergências confirmadas com os metadados atuais; a seção 2 compara referências históricas, e as seções 3–4 permanecem como checklist.
