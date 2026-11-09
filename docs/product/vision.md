# Visão e escopo do produto

O GreenER ajuda a responder três perguntas: quais aplicações estão sendo acompanhadas, que evidências existem sobre seu consumo e como interpretar sua energia e emissões estimadas. O produto reúne descoberta, métricas, contexto regional e histórico para apoiar investigação e priorização.

## Para quem

| Público | Necessidade |
| --- | --- |
| Gestão de infraestrutura | Reconhecer aplicações e acompanhar mudanças do ambiente. |
| Análise operacional e ambiental | Investigar períodos, comparar resultados compatíveis e entender lacunas. |
| Equipe de desenvolvimento e avaliação | Reproduzir o ambiente e demonstrar critérios de aceite. |

O dashboard e as consultas ambientais são públicos. Em `/login`, use e-mail/senha ou Google quando habilitado. Admin precisa configurar ou confirmar TOTP de seis dígitos antes da sessão, inclusive após Google. Analyst e Visitor não recebem autorização administrativa. O frontend mantém a sessão em memória; recarregar exige novo login. O backend valida JWT, sessão, papel e estado atuais; credencial ausente/inválida resulta em 401, papel insuficiente em 403. Novas rotas são protegidas por padrão.

## Escopo e disponibilidade

Referência: `origin/develop`, commit `c343698`, conferido em 08/11/2026. Cada ambiente pode executar outra revisão; merge não comprova publicação.

| Capacidade | Situação documentada |
| --- | --- |
| Catálogo, busca, filtros, paginação, navegação e doze idiomas | Implementados na interface. |
| Descoberta, eventos de ciclo de vida, coleta periódica, incidentes e persistência | Implementados no backend. |
| Estado operacional, métricas de origem, evidências e metodologia da coleta | API e detalhe da aplicação disponíveis; uma página expõe modelo, fórmula, parâmetros e fator registrados sem recalcular. Falhas, ausência e dados antigos permanecem distintos. |
| Análise ambiental por aplicação, série temporal e inspeção de contribuições | Disponíveis na API e integradas ao detalhe da aplicação. |
| `/dashboard` · `GET /analysis/summary` | Em `/dashboard`, selecione 24 horas, 7, 30 ou 90 dias, estado e região. O resumo apresenta totais, cobertura, contagens por estado e composição de emissões em barras ou rosca. A tabela permite busca, filtros por coluna, ordenação por energia/CO₂e e paginação. Os filtros da tabela recortam as linhas, sem redefinir os totais do resumo. Abra uma aplicação para investigar sua evidência. O dashboard consulta `GET /analysis/summary` e atualiza periodicamente sem reload. |
| Tema claro/escuro | Preferência disponível na interface. |

## Jornadas e valor

1. Localizar uma aplicação no catálogo e abrir seu detalhe: confirmar identidade, localização e estado.
2. Investigar uma mudança: distinguir última tentativa, última observação válida e ausência de dados.
3. No detalhe, selecionar período e granularidade, interpretar série/cobertura e investigar as contribuições de um bucket sem transformar lacunas em zero.

O [guia de uso](../guide/monitoring) descreve a experiência existente; os [épicos](../roadmap) detalham o comportamento esperado.

## Limites do produto

Estimativas ambientais não são medição elétrica direta nem prova de economia causada por uma ação. Não há indicador de eficiência por transação sem dados de trabalho produzido. A série do detalhe compara uma aplicação com a janela imediatamente anterior de mesma duração; isso não representa comparação entre aplicações ou dashboard de períodos. Mapa é opcional.

## Como avaliar o resultado

Nas reviews, verificar se as pessoas encontram a aplicação, distinguem zero de ausência e rastreiam um resultado até período, unidade e evidências. Registrar tarefas avaliadas, dificuldades, feedback e mudanças em [#133](https://github.com/Seliganessecodigo/ABP-3DSM/issues/133) e [#134](https://github.com/Seliganessecodigo/ABP-3DSM/issues/134). Metas de tempo, satisfação e desempenho exigem baseline e aprovação; esta documentação não estabelece números arbitrários.

## Guia de uso

Em `/history`, escolha uma aplicação; `applicationId`, período e granularidade preservam contexto na URL. A tela reutiliza a série persistida do detalhe, com filtros, fuso de apresentação, eventos, paginação numerada e inspeção de buckets. As contribuições também possuem paginação interativa de 5, 10, 15, 20 ou todos os itens. Buckets do backend continuam em UTC; mudar o fuso de apresentação não reagrupa a série. A sobreposição do detalhe compara a mesma aplicação com a janela anterior equivalente.

Em `/administration/calculations`, selecione aplicação e datas para comparar original e prévia. A data final da UI é inclusiva em dias UTC; a API recebe `[from,to)`. A prévia é pública, usa o modelo atual e consulta fatores atuais para as regiões históricas, sem salvar ou substituir resultados. Limites: 30 dias e 10.000 observações. A resposta contém `original`, `preview`, `warnings` e `status` (`available`, `empty` ou `partial`). Falha do fator preserva energia calculável e informa CO₂e indisponível. Percentuais exigem unidades e coberturas iguais e referência positiva.

Em `/methodology`, as abas de energia, emissões, cobertura e análise permitem explorar exemplos e editar preferências pessoais. Salvar exige login de qualquer papel e altera apenas a própria aba, com revisão otimista: 409 indica conflito. Os limites são de apresentação; não alteram parâmetros globais, cálculos nem notificações externas. Período/granularidade salvos preenchem somente opções ausentes na URL do detalhe. A metodologia histórica permanece em `/services/:id/methodology`, com `collectionId` quando selecionado.

A API permite a Admin da mesma organização alterar contas entre `ACTIVE`, `BLOCKED` e `DEACTIVATED`, com `expectedStatus` e motivo obrigatório. Bloqueio/desativação revogam todas as sessões; reativação exige novo login. Há proteção da própria conta e do último Admin ativo. Estado esperado divergente retorna 409; estado desejado já alcançado é sucesso idempotente. A auditoria compartilhada grava sucesso na transação da alteração e negações fora da transação revertida, com ator explícito e sem segredos. Gestão completa de papéis e recuperação de senha não estão entregues por essa rota.
