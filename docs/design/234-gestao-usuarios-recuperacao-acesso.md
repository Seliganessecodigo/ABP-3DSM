# US-20 — gestão de usuários e recuperação de acesso

Registro da entrega de design para a issue [#234](https://github.com/Seliganessecodigo/ABP-3DSM/issues/234), no arquivo [GreenER — protótipo](https://www.figma.com/design/bbt97My6jOZpJVYxbOc9T2/GreenER?node-id=0-1).

O protótipo acrescenta fluxos de gestão administrativa de contas e recuperação pública de acesso, mantendo as telas existentes. Os novos quadros cobrem lista de usuários, criação e alteração de acesso, recuperação e redefinição de senha, variações desktop/mobile e handoff. A linguagem visual segue a base GreenER existente, com Inter, superfícies claras e ações em verde.

Na administração, a lista representa busca geral, filtros por estado e papel, ordenação, paginação e ausência de resultados. O handoff documenta busca sem distinção de caixa ou acentos, combinação de busca geral (OU) com filtros (E), aplicação dos critérios antes da paginação, ordenação de uma coluna por vez e paginação inicial de 10 itens com opções 5, 10, 15, 20 e Todos. A URL preserva busca, filtros, ordenação, quantidade e página.

Os estados de operação incluem carregamento, vazio, erro, sucesso e acesso negado. Bloqueio, reativação e desativação têm confirmação, retorno e indicação de autoria. O fluxo de recuperação pode ser iniciado sem sessão administrativa e usa uma confirmação genérica, sem revelar se a conta existe; também representa token inválido, expirado ou usado e retorno ao login.

As decisões ainda não definidas pelo contrato — canal de envio e política de senha — ficam como pendências, sem presumir comportamento. A proposta inclui foco visível, navegação por teclado, mensagens compreensíveis sem depender apenas de cor e consideração para textos longos nos oito idiomas.

## Escopo do PR

- Registra no repositório o handoff e as decisões de interação do protótipo.
- Não altera a implementação frontend/backend nem encerra a issue #234.

## Verificação

- Protótipo conferido no arquivo Figma GreenER; os quadros de gestão e recuperação estão organizados por fluxo.
- Não foram executados testes ou builds, pois esta alteração é somente documentação do design.
