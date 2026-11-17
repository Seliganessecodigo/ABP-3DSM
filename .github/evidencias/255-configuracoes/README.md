# Configurações — protótipo e handoff #255

Proposta para revisão do produto. A implementação das tasks #94, #95 e #161 ainda não foi iniciada por esta entrega. A consulta operacional permanece no escopo de #246, sem assignee na consulta realizada. O handoff de contas #234, do Gui, é preservado.

## Arquivo Figma e revisão visual

- [Versão 2 — referência atual](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=857-4182).
- [Versão 1 — superada pelo feedback](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=855-4182).
- Página: `0:1`, Design System + Protótipos.
- Referências antigas das issues: configuração `8:653` e gestão de usuários `28:200`. Não foram excluídas ou modificadas.

Feedback do usuário após a primeira proposta: excesso de cards em uma aplicação que já utiliza esse recurso em várias telas. A versão 2 aplica uma superfície contínua, abas com sublinhado, informações operacionais em linha, integrações em lista, tabelas com divisórias e seções de conta sem cartões individuais. Diálogos ficam reservados às ações que exigem confirmação.

A prancha contém sete vistas: monitoramento desktop; usuários; auditoria; conta pessoal; monitoramento pausado no tema escuro; estados/confirmações; monitoramento mobile. A primeira composição mede 1440 × 980; a mobile, 390 × 1080. O protótipo HTML adapta todas as áreas ao mobile.

**Limitação comprovada:** a sessão Figma permitiu listar as páginas, mas as chamadas seguintes de leitura/edição nativa retornaram limite de chamadas do plano. `upload_assets` aceitou os dois SVGs e confirmou sua inserção como árvores vetoriais. Não foi possível conferir o resultado importado ou conectar as interações no Figma. As capturas deste diretório comprovam somente a renderização local. A prancha não equivale a componentes, auto-layout ou protótipo nativo navegável. O protótipo local permite revisar os fluxos enquanto essa limitação persistir.

## Decisões aceitas na conversa

1. Configurações reúne operação do monitoramento, usuários/acessos, auditoria e conta pessoal.
2. Admin acessa as quatro áreas. Analista e Visitante acessam Minha conta. A autorização real permanece no backend; o seletor de papel é somente um recurso da demonstração.
3. “Metodologia e minhas preferências” mantém seu conteúdo e organização atuais. Configurações oferece um acesso à rota existente, sem duplicar limites, avisos e padrões de análise.
4. A prévia de recálculo deixa de ser a entrada principal de Configurações. Este protótipo não remove sua API nem altera resultados ou metodologia.
5. Informações pessoais são somente leitura até existir escopo e contrato de edição. Tema e idioma reutilizarão os controles existentes, com o mesmo comportamento de persistência do produto.
6. Intervalo de coleta é somente leitura. “Atualizar diagnóstico” consulta informações; não inicia uma coleta.
7. Pausa/retomada exige motivo. A pausa afeta novos ciclos do GreenER, pode criar lacunas e não interrompe as aplicações monitoradas. Um ciclo em andamento pode concluir.

Todos os nomes, horários, contagens e o intervalo de 60 segundos são **exemplos visuais**, não valores padrão ou políticas novas.

## Contratos conferidos em develop

Base: `1e1342c`, consultada para este protótipo.

| Área | Contrato atual | Consequência para o design |
| --- | --- | --- |
| Minha conta | `GET /auth/me` | Apresentar somente dados autorizados; não presumir edição genérica de perfil |
| Monitoramento | `GET /monitoring/health` | Estado, intervalo, ciclo mais recente, integrações, incidentes e contagens |
| Ciclos | `GET /monitoring/cycles` | Leitura de execuções recentes; consulta não dispara coleta |
| Pausa/retomada | `PATCH /monitoring/control`, `{ paused, reason }` | Confirmação, motivo obrigatório, atualização somente após sucesso |
| Auditoria | `GET /monitoring/audit` | Eventos da organização autorizada; ator, instante, operação, antes/depois, motivo e resultado |
| Contas | `GET /auth/users`, `POST /auth/users` | Listagem e criação sem receber senha; ativação do titular segue fluxo existente |
| Papel | `PATCH /auth/users/{userId}/role` | Estado esperado/motivo, conflito, revogação e preservação do último Admin |
| Estado da conta | `PATCH /auth/users/{userId}/status` | Bloquear, reativar ou desativar com confirmação, motivo e estado esperado |

Fontes locais: `backend/src/modules/applications/monitoring-operations.controller.ts`, `backend/src/modules/authentication/accounts.controller.ts`, `backend/src/modules/authentication/AUTHORIZATION_MATRIX.md`. Assets e fonte vêm do shell GreenER e de `frontend/src/assets/`; a prancha utiliza os paths SVG originais da navegação.

## Estados e transições

| Origem | Ação | Resposta / destino | Preservação |
| --- | --- | --- | --- |
| Área disponível | Trocar de aba | Área selecionada | Na implementação, parâmetros próprios de cada consulta |
| Coleta ativa | Pausar | Diálogo com efeito e motivo obrigatório | Nenhuma mudança antes de confirmar |
| Diálogo | Cancelar ou Escape | Fecha e devolve foco ao disparador | Estado anterior intacto |
| Diálogo | Confirmar | Sucesso: estado confirmado e anúncio | Histórico original preservado |
| Diálogo | Falha | Erro dentro do diálogo e nova tentativa | Motivo e estado ativo preservados |
| Coleta pausada | Retomar | Nova confirmação com motivo | Lacunas anteriores não são preenchidas |
| Conta | Gerenciar | Operação, papel quando aplicável e motivo | Identidade e autoria mantidas |
| Alteração de conta | Revisar / confirmar | Atualiza lista após sucesso | Falha ou conflito não antecipam alteração |
| Auditoria | Abrir evento | Detalhe somente leitura | Ator, antes/depois, motivo e resultado permitidos |
| Consulta | 401 | Expiração e acesso ao login | Nunca apresentar dados protegidos de outra sessão |
| Consulta | 403 | Acesso restrito e retorno à conta | Não confundir com erro temporário |
| Consulta | Vazio | Mensagem específica | Vazio não equivale a falha ou a saúde normal |
| Consulta | Parcial | Fonte com falha e informação conhecida | Ausência não vira zero ou saudável |

O HTML demonstra os fluxos em memória; não chama APIs, não envia e-mails, não faz login real e não altera contas ou coletas. O seletor de estado permite inspecionar carregamento, vazio, erro, parcial, acesso negado e sessão expirada. A tradução e os filtros completos são requisitos do handoff, não recursos integralmente implementados nessa demonstração.

## Tabelas e contexto para a implementação

Busca geral: OU entre colunas visíveis, sem distinção de caixa/acentos, antes da paginação; filtros de colunas combinados por E. Não pesquisar credenciais, segredos ou campos não exibidos. Ausência tem opção própria quando aplicável, nunca marcador textual indexado.

| Listagem / coluna | Tipo | Filtro | Ordenação |
| --- | --- | --- | --- |
| Contas: nome, e-mail | Texto | Trecho | Crescente/decrescente por coluna |
| Contas: papel, estado | Enum do contrato | Select | Crescente/decrescente; confirmar conjunto permitido na API |
| Contas: ações | Comando | Não aplicável | Não ordenável |
| Auditoria: instante | Data/hora | Início/fim com fuso | Instante; inicial decrescente |
| Auditoria: responsável, operação | Texto | Trecho | Crescente/decrescente |
| Auditoria: resultado | Enum do contrato | Select | Confirmar colunas permitidas na API |
| Auditoria: antes/depois, motivo, identidade | Texto autorizado no detalhe | Somente conforme contrato | Não pressupor ordem de snapshots |
| Auditoria: abrir detalhe | Comando | Não aplicável | Não ordenável |
| Ciclos: início | Data/hora | Dependência do contrato | Inicial recente primeiro, sem presumir parâmetro inexistente |
| Ciclos: resultado | Enum | Dependência do contrato | Dependência do contrato |
| Ciclos: processadas, falhas | Número | Mínimo/máximo: dependência | Dependência do contrato |
| Ciclos: abrir detalhe | Comando | Não aplicável | Não ordenável |

Contas iniciam por nome crescente, com desempate por identidade estável. Ausentes ficam ao final nas duas direções. Uma coluna de ordenação por vez, com `aria-sort`. A implementação não deve oferecer ordenação ou filtros apenas sobre uma página carregada.

Listagens paginadas: padrão 10; opções 5, 10, 15, 20 e Todos; contagem filtrada, anterior/próxima, página atual e limites desabilitados. Todos significa todo o conjunto autorizado após filtros, não só a página atual. Mudar critérios/tamanho retorna à primeira página; limpar filtros preserva ordem. URL deve preservar busca, filtros, ordenação, quantidade e página. Atualização que invalida a página ajusta para a última existente. Os indicadores gerais não são reduzidos à página da tabela.

**Dependência real de ciclos:** a API conferida expõe `page`/`limit`, com limite máximo de 100, sem o conjunto completo de busca/filtros/ordenação/Todos exigido nas issues. A interface não deve simular suporte; alinhar contrato antes de implementar esses controles. Auditoria e contas também exigem verificar a matriz final de campos permitidos antes de codificar.

## Acessibilidade, responsividade e idiomas

- Sequência: navegação → título → área → ação principal → diagnóstico/listagem → paginação. Dentro de Minha conta, dados → aparência/idioma → acesso à metodologia → saída.
- Abas desktop usam setas, Home/End e seleção identificada; mobile usa select rotulado e rolagem vertical. Tabelas mantêm rolagem interna sem ampliar a página.
- Diálogo: título e efeito claros, motivo rotulado, cancelamento inicialmente focado, Escape e retorno de foco. Erro mantém o rascunho; sucesso é anunciado em região de status.
- Rótulos de estado permanecem textuais. Cores seguem tokens semânticos claros/escuros do produto. Textos de conteúdo não dependem de uma contagem fixa de caracteres para funcionar.
- No produto, todos os textos devem usar os doze catálogos atualmente suportados. Inglês é fallback; não criar seletor de unidade/fuso sem escopo. O HTML é uma demonstração em pt-BR, não prova validação nos doze idiomas.
- As capturas locais verificam a composição desktop e mobile; a revisão de contraste e de textos longos completa permanece parte da implementação e da validação de design.

## Pendências e tasks

- #255: revisão do PO sobre a versão 2, conexões nativas no Figma e validação do arquivo importado pendentes. A issue deve permanecer aberta.
- #94: consumir este handoff para shell e comandos. Execução manual ainda não tem rota no contrato conferido; não inventar endpoint nem usar atualizar diagnóstico como substituto.
- #95: o aceite antigo prevê parâmetros editáveis/versionados; a conversa agora mantém intervalo somente leitura e não define parâmetros/fatores editáveis. É necessário realinhar o aceite antes de implementar configuração sem finalidade aprovada. Não criar limites numéricos arbitrários.
- #161: implementar contas/papéis/transições usando #158/#245 e preservar autoria/handoff #234. Recuperação de senha permanece #265.
- #246: consultas de saúde/auditoria são necessárias para a proposta, mas a task não está atribuída ao usuário. A tela compartilhada não apaga essa responsabilidade nem presume sua conclusão.
- Recálculo #263/#264: a proposta retira seu destaque dentro de Configurações, sem excluir silenciosamente contratos ou declarar as tasks encerradas.

## Reprodução e verificações

Gerar arquivos em pasta de saída própria para não versionar duplicatas dos assets:

```powershell
node .github/evidencias/255-configuracoes/gerar-prototipo.cjs C:/temp/greener-configuracoes
```

Abrir `C:/temp/greener-configuracoes/index.html` no navegador. O arquivo gerado contém fonte, logo e decoração incorporados; não depende de servidor, login ou API. O SVG de saída é `GreenER-255-Configuracoes-v2.svg`. Geradores não enviam nada ao Figma.

Autoverificação opcional com Playwright já instalado no frontend:

```powershell
$env:NODE_PATH = (Resolve-Path frontend/node_modules).Path
# Se necessário, selecionar Chrome/Edge instalado:
$env:PROTOTYPE_BROWSER = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
node .github/evidencias/255-configuracoes/verificar-prototipo.cjs C:/temp/greener-configuracoes
```

Executado: geração com asserts de tamanho/estrutura; confirmação e cancelamento; falha/retry preservando motivo; estados de papel; mudança de acesso; criação ilustrativa; busca com caixa/acentos; Todos; detalhe de auditoria; tema escuro; mobile sem overflow da página; oito capturas; nenhuma requisição HTTP; nenhum erro JavaScript. A checagem usa o pacote Playwright já disponível em outra worktree, sem alterar dependências do projeto.

Não executados: testes/build de frontend/backend ou build de documentação, pois esta entrega só acrescenta evidência e código descartável do protótipo em `.github/evidencias/`; não modifica código de produção ou páginas publicadas. SonarQube e demais checks da PR devem ser conferidos na CI. Nenhuma issue deve ser fechada apenas pela abertura da PR.
