# RNF-07 — componentes compartilhados e estados de interação

Registro da entrega de design para a issue [#260](https://github.com/Seliganessecodigo/ABP-3DSM/issues/260), no arquivo [GreenER — RNF-07 / Componentes compartilhados](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=344-530).

A proposta consolida a biblioteca já existente e documenta variantes primário, secundário e ghost, com estados padrão, hover, foco, desabilitado e em andamento. Os exemplos usam instâncias existentes: filtros por coluna no catálogo, seleção de período no detalhe desktop e mobile, e teste com rótulo longo. Botões, badges, KPI Card, Chart Panel e Navigation Item não são recriados em uma coleção paralela.

O quadro registra regras para carregamento, atualização, vazio e erro. Em caso de erro após dados válidos, mantém a informação anterior visível e indica a falha e a última atualização. Também documenta semântica de botão/link, navegação por teclado, indicador de foco, anúncios de progresso e medições de contraste. A base de tokens claro/escuro de #213 é reutilizada; classificação de badges/incidentes (#242/#244) e handoffs (#247–#256) permanecem fora do escopo.

O handoff serve de referência para a implementação da base visual #261. Testes de teclado, leitor de tela e rede pertencem à implementação. A revisão do PO está explicitamente pendente no Figma.

A imagem `RNF-07-componentes-compartilhados.png` é uma captura do Design System no Figma, incluída como evidência visual desta PR.
