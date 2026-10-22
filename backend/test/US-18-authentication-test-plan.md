# US-18 — plano de testes de autenticação

Este documento define comportamentos observados pelo seam HTTP integrado. O contrato implementado usa `POST /auth/login`, `POST /auth/sessions/refresh`, `POST /auth/sessions/logout`, `GET /auth/me`, `POST /auth/invitations/accept`, `POST /auth/email/confirm` e `POST /auth/email/confirmation/resend`. Os testes observam respostas e efeitos pela API, sem asserts sobre detalhes internos de serviços, guards, ORM, formato do hash ou claims não publicados.

## Seam e ambiente

- Subir a aplicação NestJS pela interface HTTP pública em ambiente de teste.
- Usar PostgreSQL isolado e dados de fixture para organizações e contas.
- Capturar e-mails em uma caixa de saída de teste; não enviar mensagens reais.
- Controlar o relógio nos cenários de expiração de convite, access token e sessão.
- Preparar estados de domínio por fixtures; validar resultados por respostas HTTP e efeitos observáveis pela API. Não consultar o banco como atalho para provar comportamento público.
- Usar PostgreSQL isolado via `TEST_DATABASE_URL`; sem essa variável, os testes de integração são ignorados.
- Capturar o tempo por um relógio controlado no módulo de teste e injetar um adapter de e-mail em memória.

## Sequência TDD sugerida

Executar cada caso como um ciclo vertical: escrever um teste no seam HTTP, confirmar que falha pelo comportamento ausente, implementar somente o necessário para passá-lo e então avançar ao próximo caso. A sequência prioriza o caminho de autenticação e acrescenta as proteções e fluxos de bootstrap em seguida.

## Casos de teste

### Login e proteção de rotas

1. **Login válido** — uma conta ativa, verificada e com credenciais válidas consegue autenticar-se usando e-mail, senha e identificador da organização; recebe a resposta de sucesso definida no contrato e pode acessar uma rota protegida.
2. **Senha incorreta** — a autenticação é recusada e a resposta não revela que o e-mail existe.
3. **E-mail inexistente** — a resposta pública é indistinguível da resposta para senha incorreta, conforme contrato.
4. **Organização inexistente ou incompatível** — a autenticação falha sem revelar se há uma conta correspondente em outra organização.
5. **Conta não verificada** — login não concede sessão antes da confirmação do e-mail.
6. **Conta bloqueada, inativa ou desativada** — login não concede sessão.
7. **Credenciais inválidas não vazam dados** — respostas de falha não contêm senha, hash, pepper, token ou detalhes internos.
8. **Rota pública sem credenciais** — rota declarada pública continua acessível sem token.
9. **Rota protegida sem token** — requisição é recusada com HTTP 401.
10. **Token inválido ou expirado** — requisição é recusada com HTTP 401.
11. **Usuário autenticado sem permissão** — requisição é recusada com HTTP 403.

### Senhas e sessões

12. **Senha mínima aceita** — senha de 8 caracteres pode ser cadastrada e usada para autenticação.
13. **Senha abaixo do mínimo recusada** — senha com menos de 8 caracteres não pode ser cadastrada.
14. **Frase-senha longa aceita** — uma senha longa permitida pelo contrato é aceita e autentica corretamente.
15. **Access token expira em 15 minutos** — após avançar o relógio além da validade, o token deixa de autorizar a rota protegida.
16. **Refresh token rotaciona** — renovar uma sessão produz credencial de renovação nova e a anterior não pode ser reutilizada.
17. **Sessão inativa expira após 12 horas** — após exceder o limite sem atividade, a sessão não pode ser renovada nem usada para acessar a rota protegida.
18. **Limite absoluto de 7 dias** — atividade contínua não permite renovar a sessão além do limite absoluto.
19. **Logout revoga a sessão atual** — após sair, a sessão encerrada deixa de permitir renovação e acesso protegido; outra sessão do mesmo usuário permanece válida.
20. **Conta desativada revoga todas as sessões** — sessões abertas deixam de permitir acesso e renovação imediatamente após a desativação.
21. **Sessão revogada não pode ser renovada** — credencial de renovação revogada falha mesmo que ainda esteja dentro do prazo nominal.

### Papéis e isolamento organizacional

22. **Visitor consulta somente rotas públicas autorizadas** — tentativa de acessar operações administrativas ou de análise é recusada.
23. **Analyst consulta análises e histórico** — leitura permitida; operações de administração de usuários e configurações são recusadas.
24. **Admin acessa operações administrativas autorizadas** — ações administrativas disponíveis à conta são aceitas dentro da própria organização.
25. **Acesso entre organizações é negado** — uma conta autenticada não consegue ler ou alterar recursos pertencentes a outra organização, mesmo se fornecer o identificador do recurso.
26. **Papéis não são elevados pelo cliente** — alterar dados enviados pelo cliente não concede permissões superiores às atribuídas à conta.

### Convite do primeiro Admin e confirmação de e-mail

27. **Convite válido cria o primeiro Admin da organização** — o representante usa convite ainda válido e recebe o resultado de sucesso definido no contrato.
28. **E-mail do representante pode diferir do Admin** — o representante recebe o link no próprio e-mail e cadastra uma conta Admin com outro endereço.
29. **Convite é de uso único** — reutilizar convite já consumido é recusado.
30. **Convite expira em 24 horas** — convite fora da validade é recusado.
31. **Reenvio invalida convite anterior** — após novo envio, o link anterior deixa de ser utilizável e somente o mais recente pode ser consumido.
32. **Convite está vinculado à organização** — não é possível usar um convite de uma organização para criar Admin em outra.
33. **Confirmação é enviada ao e-mail do Admin** — após o representante cadastrar o Admin, a caixa de saída de teste recebe mensagem de confirmação destinada ao endereço informado para a conta.
34. **Admin não entra antes de confirmar o e-mail** — tentativa de login antes da confirmação não cria sessão.
35. **Confirmação válida libera login** — após consumir o link de confirmação, as credenciais válidas do Admin permitem autenticação.
36. **Confirmação é de uso único e vinculada à conta** — reutilizar o link ou usá-lo para confirmar outro endereço/conta é recusado.

### Proteção de dados e auditoria

37. **Segredos não aparecem em respostas** — respostas HTTP e erros não expõem senha, hash, pepper, access token, refresh token ou token de convite além do valor necessário para o fluxo definido.
38. **Segredos não aparecem em logs** — eventos de login, falha, logout, revogação, convite e confirmação não registram senhas nem tokens.
39. **Operações relevantes deixam evidência de auditoria** — operações previstas pela política de auditoria registram ator, ação, entidade, resultado e timestamp sem incluir segredos.

## Limites conhecidos

- Rotas específicas de administração de usuários e configurações ainda não existem; os papéis e guards são disponibilizados para os módulos que as implementarem. Os cenários de autorização por endpoint de negócio devem ser adicionados quando esses endpoints entrarem no escopo.
- O adapter de produção usa SMTP configurável; os testes HTTP substituem a entrega por uma caixa de saída em memória.
- O representante informa o nome e e-mail do Admin; o Admin define a própria senha ao confirmar o endereço.
- Os links apontam para as páginas `setup-admin` e `confirm-email` em `APP_BASE_URL`; essas páginas de interface dependem de uma entrega frontend.
- O escopo de isolamento completo de aplicações, coleções e histórico é de tarefa posterior; os testes desta entrega devem cobrir organização, usuário, sessão e operações que o backend efetivamente incluir no escopo da US-18.
