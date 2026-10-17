# Usar o catálogo e investigar uma aplicação

Este guia cobre catálogo e detalhe operacional existentes. Telas de dashboard, análise ambiental e administração continuam descritas como escopo nos [épicos](../roadmap).

## Encontrar uma aplicação

1. Abra o frontend do ambiente; localmente, siga [Primeiros passos](../getting-started).
2. Pesquise por nome, ID, código regional ou região. Combine a busca com o filtro de estado.
3. Use a paginação quando houver mais resultados. Se a busca não retornar itens, limpe os filtros antes de concluir que o catálogo está vazio.
4. Abra a aplicação e confirme ID e localização. Cidade nula não invalida o cadastro; localização legada incompleta deve ser apresentada como desconhecida.

Busca, filtro e página ficam na URL (`q`, `state` e `page`). Preserve o link para recuperar esse contexto. Atualmente esses filtros são aplicados no frontend, sobre a lista retornada pela API.

## Acompanhar atualizações

Catálogo e detalhe consultam a API ao abrir e agendam nova consulta 60 segundos após cada tentativa terminar. Esse polling é independente do intervalo de coleta do backend e do intervalo informado pelo agregador. Não há garantia de dado novo a cada atualização de tela.

A interface informa horários da tentativa e da resposta válida. Uma falha após sucesso mantém os dados anteriores; eles não devem ser lidos como uma nova observação. A atualização manual do catálogo permite tentar novamente sem recarregar a página. Ao sair da tela, consultas pendentes são canceladas.

## Interpretar o que aconteceu

| Situação | Leitura e próxima ação |
| --- | --- |
| Catálogo vazio | A API respondeu sem aplicações; verificar descoberta inicial. |
| Nenhum resultado filtrado | Ajustar busca/filtro; o ambiente pode conter outras aplicações. |
| Falha inicial | Não há dados válidos para mostrar; tentar novamente e consultar operação. |
| Falha depois de sucesso | Preservar a leitura anterior e observar seu horário. |
| Aplicação não encontrada | Conferir o ID/link; difere de aplicação conhecida removida. |
| Aplicação removida | A identidade e o histórico continuam conhecidos; ausência foi confirmada por snapshot válido. |

## Estado não é consumo

`AVAILABLE`, `UNAVAILABLE`, `NO_METRICS` e `REMOVED` descrevem o estado operacional. Frescor, motivo da tentativa e possibilidade de calcular indicadores são dimensões adicionais. Uma aplicação disponível pode não ter fator de carbono; uma indisponível pode possuir histórico válido.

A API já expõe evidências de coletas, mas o bloco completo de métricas e frescor tem entregas específicas na interface. Consulte [Metodologia e significado dos dados](../product/methodology) antes de interpretar indicadores.

## Idioma e comunicação de problemas

O seletor oferece oito idiomas e guarda a preferência neste navegador. Alterar idioma não cria outra aplicação nem muda os instantes das observações.

Ao relatar um problema, informe ambiente, ID, filtros, horário com fuso, ação executada e resultado esperado/observado. Inclua captura sem credenciais ou dados privados. Para falha de ambiente, siga [Operação e diagnóstico](../operations).

## Preferência de tema

Nas preferências da navegação, escolha **Claro** ou **Escuro**. A ação **Usar tema do sistema** restaura o acompanhamento automático da aparência do sistema, inclusive quando ela muda durante o uso. No primeiro acesso, o GreenER segue o sistema.

A escolha vale para o catálogo, detalhe e layout global, sem alterar filtros ou dados. Ela fica neste navegador, na chave local `greener-theme`, e é recuperada no próximo acesso. Se o navegador bloquear o armazenamento, a escolha continua válida durante a sessão, mas poderá não sobreviver à recarga.
