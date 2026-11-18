# US-20 (#160) — plano de testes de recuperação de senha

Este plano prepara os ciclos TDD da recuperação de senha. Os testes cobrem contratos públicos e efeitos observáveis; não afirmam chamadas a métodos privados nem detalhes de organização interna. Executar em fatias verticais: um cenário, verificar a falha, implementar o mínimo para passar e só então avançar.

## Seams aprovados

- **Backend — HTTP + PostgreSQL isolado:** subir o backend real com `TEST_DATABASE_URL`, controlar o relógio e substituir somente a entrega SMTP na fronteira `EmailDelivery` por um fake em memória. Observar status/corpo HTTP, mensagens capturadas, login/refresh, auditoria e efeitos persistidos. O teste pode consultar o banco diretamente apenas para invariantes de segurança sem superfície pública, em especial comprovar que token/link não ficam em claro na outbox.
- **Worker da outbox:** disparar um ciclo de processamento pela interface suportada pelo worker/scheduler, usando o mesmo PostgreSQL e fake de e-mail, para verificar entrega, falha, retentativa e expiração. Não testar método privado nem ordem de chamadas internas.
- **Frontend — Playwright:** navegar por `/recover-password` nos 12 idiomas suportados. Observar conteúdo traduzido, acessibilidade, navegação ao login e ausência de formulário/chamadas à API.

## Dados de teste

Preparar organização principal e outra organização, além de contas com estes estados: ativa, e-mail confirmado e senha local; ativa mas sem confirmação; bloqueada; desativada; e sem senha local (SSO-only). Criar ao menos duas sessões para a conta principal. Usar senha conhecida compatível com a política existente, relógio controlável e caixa de saída falsa. Nenhum teste envia e-mail real.

## Ordem dos ciclos red-green

### Solicitação e resposta genérica

1. **Solicitação elegível é aceita** — `POST /auth/password-recovery/request` recebe `organization` e `email`, responde `202` com o código estruturado acordado e produz trabalho de entrega para a conta elegível.
2. **E-mail não cadastrado recebe a mesma resposta** — comparar status e corpo público com a solicitação elegível; nenhuma mensagem é enviada.
3. **Conta em outra organização não é encontrada** — usar o slug da organização principal com o e-mail cadastrado somente na outra organização; resposta indistinguível da conta desconhecida e sem envio.
4. **Conta inelegível não recebe token** — repetir para não verificada, bloqueada, desativada e SSO-only; todas recebem a resposta genérica e nenhuma mensagem.
5. **Entrada incompleta ou inválida é recusada** — campos ausentes, formato inválido de e-mail e slug inválido produzem erro 400 estruturado sem criar recuperação.

### Token e entrega protegida

6. **E-mail contém link de uma hora** — após o worker processar a solicitação, a caixa falsa captura o endereço e um link em `APP_BASE_URL/recover-password#token=...`; o token permite concluir o fluxo.
7. **Token é somente hash no registro de autenticação** — obter o valor enviado pela caixa falsa e verificar no banco isolado que ele não aparece em claro no registro do token e que o campo de hash não contém o token bruto.
8. **Payload da outbox não persiste token ou link em claro** — inspecionar somente os campos persistidos da outbox e verificar que token, link e conteúdo sensível estão cifrados; verificar que o payload ainda pode ser entregue depois de recriar a aplicação com a mesma chave versionada configurada.
9. **Nova solicitação substitui token anterior** — solicitar dois links, confirmar que o primeiro falha e somente o token mais recente pode redefinir a senha.
10. **Token expira após uma hora** — avançar o relógio além da validade e verificar que a conclusão falha sem alterar a senha nem revogar sessões.
11. **Falha transitória de SMTP não muda resposta pública** — fazer o fake de e-mail falhar durante o processamento; a solicitação HTTP já aceitou com a mesma resposta genérica. O worker pode retentar enquanto o token estiver válido.
12. **Outbox sobrevive à recriação do processo** — persistir um pedido, encerrar e subir novamente a aplicação sobre o mesmo PostgreSQL, processar o item pendente e observar a mensagem na caixa falsa.
13. **Outbox não envia link expirado** — manter a entrega falha até depois da expiração; o processamento seguinte encerra o item sem enviar o link vencido.

### Conclusão e efeitos na conta

14. **Token válido redefine a senha** — `POST /auth/password-recovery/complete` recebe `token` e `password`, retorna `204` e permite iniciar login com a nova senha.
15. **Senha respeita os limites existentes** — aceitar 8 e 1024 caracteres; recusar 7 e 1025 com erro estruturado sem consumir o token nem modificar a credencial.
16. **Token é de uso único** — após sucesso, repetir a conclusão retorna o mesmo erro estruturado aplicado a token inválido/expirado e não altera a senha.
17. **Token inválido, expirado e consumido têm resposta uniforme** — comparar código, razão e estrutura de erro; nenhum caso altera senha ou sessões.
18. **Consumo concorrente altera a senha uma única vez** — enviar duas conclusões concorrentes para o mesmo token; exatamente uma retorna `204`, a outra recebe o erro uniforme, e somente a senha vencedora autentica.
19. **Redefinição revoga todas as sessões de atualização** — estabelecer duas sessões e redefinir a senha; refresh de ambas falha e não emite novas credenciais.
20. **JWT já emitido mantém a validade atual** — o token de acesso pode acessar a rota protegida antes de 15 minutos e deixa de autorizar depois da expiração, sem modificar o TTL geral.
21. **TOTP permanece exigido para Admin** — concluir recuperação de uma conta Admin com TOTP e confirmar que login com senha nova continua exigindo a etapa TOTP.
22. **Falha de conclusão não revoga sessões** — tentativa inválida, expirada ou consumida não invalida refresh tokens de sessões ainda válidas.

### Limites, auditoria e segredos

23. **Limite por conta suprime envios após cinco em 15 minutos** — até cinco envios são aceitos na janela; o pedido seguinte mantém o mesmo `202` e não produz novo e-mail. Após avançar o relógio para fora da janela, um novo pedido pode gerar envio.
24. **Limite por IP recusa a 21ª solicitação em 15 minutos** — as primeiras vinte recebem o resultado normal; a seguinte recebe `429` genérico, sem variação conforme a conta exista. Após a janela, uma nova solicitação volta ao fluxo normal.
25. **Redefinição e negação deixam auditoria sem segredos** — confirmar eventos de sucesso e tentativa negada; eventos não contêm token, senha, hash, link ou e-mail.
26. **Solicitação desconhecida não gera evento identificável de conta** — verificar que a resposta permanece genérica e que a auditoria não associa o evento a um usuário que não existe.
27. **Falha de entrega deixa evidência técnica sem segredos** — verificar o resultado registrado sem token, senha ou endereço de e-mail.
28. **Respostas e logs não expõem segredos** — examinar respostas HTTP e logs capturados durante solicitação, falha, conclusão e retentativa; não podem conter senha, token, link, hash ou payload cifrado decifrado.

### Tela placeholder

29. **Placeholder mostra propósito e retorno ao login** — em `/recover-password`, verificar título, texto informativo e link acessível para `/login`; a tela não apresenta campos ou formulário.
30. **Placeholder não processa token nem chama API** — abrir a rota com fragmento `#token=...`, verificar que a página não consome o valor e que nenhuma chamada de rede é feita para endpoints de recuperação.
31. **Placeholder acompanha os 12 idiomas** — percorrer cada locale e verificar texto traduzido, heading, link e ausência de caracteres corrompidos.
32. **Placeholder funciona em teclado e viewport móvel** — acessar link por teclado, verificar foco visível e conferir que o conteúdo continua legível em viewport estreito e desktop.

## Observações

- Não testar armazenamento em claro por inspeção ampla do banco como substituto do fluxo; a consulta é estritamente limitada à propriedade de confidencialidade do payload que não pode ser observada por HTTP.
- Para auditoria e outbox, usar as leituras persistidas somente para provar essas garantias de armazenamento. Para efeitos do domínio, preferir resposta HTTP, autenticação/refresh e entrega capturada pelo adapter.
- Não fixar tempos de retentativa que não foram decididos; controlar o relógio e executar o ciclo de processamento suportado para observar nova tentativa antes da expiração e encerramento depois dela.
- Não incluir asserts de classe/método, número/ordem de chamadas a colaboradores internos ou snapshots de implementação.
