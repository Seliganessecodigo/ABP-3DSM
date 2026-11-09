# Usar o catálogo e investigar uma aplicação

Este guia cobre catálogo, dashboard, detalhe, histórico, prévia de recálculo, metodologia e login, disponíveis na interface.

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

O seletor oferece doze idiomas e guarda a preferência neste navegador. Alterar idioma não cria outra aplicação nem muda os instantes das observações.

Ao relatar um problema, informe ambiente, ID, filtros, horário com fuso, ação executada e resultado esperado/observado. Inclua captura sem credenciais ou dados privados. Para falha de ambiente, siga [Operação e diagnóstico](../operations).

## Preferência de tema

Nas preferências da navegação, use o interruptor **Modo escuro**: desligado aplica claro; ligado aplica escuro. No primeiro acesso, o GreenER acompanha a aparência do sistema, inclusive suas mudanças durante o uso, até você acionar o interruptor. A partir daí, vale a escolha explícita; esta interface não oferece uma ação para voltar a seguir o sistema.

A escolha vale para o catálogo, detalhe e layout global, sem alterar filtros ou dados. Ela fica neste navegador, na chave local `greener-theme`, e é recuperada no próximo acesso. Se o navegador bloquear o armazenamento, a escolha continua válida durante a sessão, mas poderá não sobreviver à recarga.

## Dashboard

Em `/dashboard`, selecione 24 horas, 7, 30 ou 90 dias, estado e região. O resumo apresenta totais, cobertura, contagens por estado e composição de emissões em barras ou rosca. A tabela permite busca, filtros por coluna, ordenação por energia/CO₂e e paginação. Os filtros da tabela recortam as linhas, sem redefinir os totais do resumo. Abra uma aplicação para investigar sua evidência. O dashboard consulta `GET /analysis/summary` e atualiza periodicamente sem reload.

## Guia de uso

Em `/history`, escolha uma aplicação; `applicationId`, período e granularidade preservam contexto na URL. A tela reutiliza a série persistida do detalhe, com filtros, fuso de apresentação, eventos, paginação numerada e inspeção de buckets. As contribuições também possuem paginação interativa de 5, 10, 15, 20 ou todos os itens. Buckets do backend continuam em UTC; mudar o fuso de apresentação não reagrupa a série. A sobreposição do detalhe compara a mesma aplicação com a janela anterior equivalente.

Em `/administration/calculations`, selecione aplicação e datas para comparar original e prévia. A data final da UI é inclusiva em dias UTC; a API recebe `[from,to)`. A prévia é pública, usa o modelo atual e consulta fatores atuais para as regiões históricas, sem salvar ou substituir resultados. Limites: 30 dias e 10.000 observações. A resposta contém `original`, `preview`, `warnings` e `status` (`available`, `empty` ou `partial`). Falha do fator preserva energia calculável e informa CO₂e indisponível. Percentuais exigem unidades e coberturas iguais e referência positiva.

Em `/methodology`, as abas de energia, emissões, cobertura e análise permitem explorar exemplos e editar preferências pessoais. Salvar exige login de qualquer papel e altera apenas a própria aba, com revisão otimista: 409 indica conflito. Os limites são de apresentação; não alteram parâmetros globais, cálculos nem notificações externas. Período/granularidade salvos preenchem somente opções ausentes na URL do detalhe. A metodologia histórica permanece em `/services/:id/methodology`, com `collectionId` quando selecionado.

O dashboard e as consultas ambientais são públicos. Em `/login`, use e-mail/senha ou Google quando habilitado. Admin precisa configurar ou confirmar TOTP de seis dígitos antes da sessão, inclusive após Google. Analyst e Visitor não recebem autorização administrativa. O frontend mantém a sessão em memória; recarregar exige novo login. O backend valida JWT, sessão, papel e estado atuais; credencial ausente/inválida resulta em 401, papel insuficiente em 403. Novas rotas são protegidas por padrão.
