# Usar o catálogo e investigar uma aplicação

Este guia cobre catálogo, detalhe operacional e análise ambiental por aplicação, disponíveis na interface. O resumo agregado já existe na API, mas dashboard, ranking, comparação e administração permanecem no escopo dos [épicos](../roadmap).

## Encontrar uma aplicação

1. Abra o frontend do ambiente; localmente, siga [Primeiros passos](../getting-started).
2. Pesquise por nome, ID, código regional ou região. Combine a busca com o filtro de estado.
3. Use a paginação quando houver mais resultados. Se a busca não retornar itens, limpe os filtros antes de concluir que o catálogo está vazio.
4. Abra a aplicação e confirme ID e localização. Cidade nula não invalida o cadastro; localização legada incompleta deve ser apresentada como desconhecida.

Busca, filtro e página ficam na URL (`q`, `state` e `page`). Preserve o link para recuperar esse contexto. Atualmente esses filtros são aplicados no frontend, sobre a lista retornada pela API.

## Acompanhar atualizações

Catálogo e detalhe consultam a API ao abrir e agendam nova consulta 60 segundos após cada tentativa terminar. Esse polling é independente do intervalo de coleta do backend e do intervalo informado pelo agregador. Não há garantia de dado novo a cada atualização de tela.

A interface informa horários da tentativa e da resposta válida. Uma falha após sucesso mantém os dados anteriores; eles não devem ser lidos como uma nova observação. A atualização manual do catálogo permite tentar novamente sem recarregar a página. Ao sair da tela, consultas pendentes são canceladas.

## Analisar resultados ambientais

No detalhe, escolha uma janela móvel de 24 horas, 7, 30 ou 90 dias e a granularidade de hora, dia, mês ou ano. A série mostra energia e CO₂e dos resultados persistidos; a sobreposição compara a janela selecionada com a janela imediatamente anterior, de mesma duração. Essa é uma comparação temporal da mesma aplicação, não um ranking nem uma comparação entre aplicações.

Use os filtros e a ordenação da tabela para localizar buckets. Inspecione um bucket para consultar as contribuições incluídas e as exclusões com seus motivos. A tabela pagina os resultados; a interface ainda carrega a primeira página das contribuições. Lacunas e exclusões não representam zero. Sem evidência calculável, o resultado permanece indisponível.

## Interpretar o que aconteceu

Para rastrear um indicador, abra **Ver metodologia completa** no detalhe da aplicação; também é possível escolher **Metodologia** na navegação e selecionar uma aplicação. A página apresenta o modelo, a fórmula, os parâmetros e pressupostos registrados, além dos dados do fator de carbono quando disponíveis. Pelo detalhe, ela usa a coleta selecionada; pela navegação, usa a coleta válida mais recente. A página explica a evidência salva e não recalcula o resultado.

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

A tela de detalhe apresenta estado operacional, métricas, resultados ambientais, série histórica e contribuições consultáveis por período. Consulte a [referência da API](../reference/api) e a [metodologia](../product/methodology) para interpretar os dados sem confundir ausência, falha e zero.

## Idioma e comunicação de problemas

O seletor oferece oito idiomas e guarda a preferência neste navegador. Alterar idioma não cria outra aplicação nem muda os instantes das observações.

Ao relatar um problema, informe ambiente, ID, filtros, horário com fuso, ação executada e resultado esperado/observado. Inclua captura sem credenciais ou dados privados. Para falha de ambiente, siga [Operação e diagnóstico](../operations).

## Preferência de tema

Nas preferências da navegação, use o interruptor **Modo escuro**: desligado aplica claro; ligado aplica escuro. No primeiro acesso, o GreenER acompanha a aparência do sistema, inclusive suas mudanças durante o uso, até você acionar o interruptor. A partir daí, vale a escolha explícita; esta interface não oferece uma ação para voltar a seguir o sistema.

A escolha vale para o catálogo, detalhe e layout global, sem alterar filtros ou dados. Ela fica neste navegador, na chave local `greener-theme`, e é recuperada no próximo acesso. Se o navegador bloquear o armazenamento, a escolha continua válida durante a sessão, mas poderá não sobreviver à recarga.
