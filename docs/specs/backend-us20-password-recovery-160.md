# Spec — Recuperação de senha com token temporário (#160)

## Problem Statement

Pessoas com uma conta GreenER que esqueceram a senha não têm um fluxo de autoatendimento para recuperar o acesso. Sem um processo seguro, a pessoa depende de suporte ou de uma intervenção administrativa, e mensagens ou respostas diferentes podem revelar se um endereço está cadastrado.

## Solution

Oferecer solicitação e conclusão de recuperação por e-mail para contas ativas, verificadas e com senha local. O backend cria uma prova temporária de uso único, envia o link pelo provedor SMTP já configurado e permite definir uma nova senha dentro da política atual. A resposta pública não revela se uma conta existe. Uma outbox persistida processa os envios em segundo plano. O frontend ganha uma tela placeholder traduzida que informa sobre recuperação e permite voltar ao login, sem executar o fluxo funcional.

## User Stories

1. Como pessoa com conta elegível que esqueceu a senha, quero solicitar recuperação com minha organização e e-mail, para iniciar a retomada do acesso sem suporte administrativo.
2. Como pessoa que informa um e-mail não cadastrado, quero receber a mesma resposta pública de uma solicitação válida, para que a API não revele a existência de contas.
3. Como titular de uma conta ativa, verificada e com senha local, quero receber um link temporário, para comprovar a posse do e-mail antes de alterar a credencial.
4. Como titular de conta bloqueada ou desativada, quero que o fluxo não reative nem conceda acesso à minha conta, para que recuperação de senha não contorne o estado administrativo.
5. Como titular de conta ainda não verificada, quero que a recuperação não substitua o fluxo de confirmação de e-mail, para que a posse do endereço seja comprovada pelo processo previsto.
6. Como pessoa com acesso somente por SSO e sem senha local, quero que a recuperação de senha local não altere minhas credenciais, para que a autenticação continue sob responsabilidade do provedor de identidade.
7. Como titular que solicita outro link, quero que tokens anteriores sejam invalidados, para que somente a solicitação mais recente possa redefinir a senha.
8. Como titular, quero que meu token expire após uma hora, para limitar o período em que um link recebido indevidamente possa ser usado.
9. Como titular, quero que um token válido só possa ser consumido uma vez, para que um link já utilizado não permita outra alteração de senha.
10. Como titular que abre um token inválido, expirado ou já utilizado, quero receber uma falha estruturada sem alteração de senha, para saber que preciso reiniciar o fluxo sem obter estados inconsistentes.
11. Como titular com token válido, quero definir uma senha segundo a política atual de 8 a 1024 caracteres, para recuperar o acesso sem criar uma política de credenciais paralela.
12. Como titular, quero que a nova senha seja protegida pelo mecanismo de hash existente, para que a recuperação preserve os controles atuais de armazenamento de credenciais.
13. Como titular que conclui a redefinição, quero que todas as sessões de atualização existentes sejam revogadas, para que sessões antigas não possam continuar sendo renovadas.
14. Como titular com sessão de acesso já emitida, quero que ela expire segundo sua validade atual de até 15 minutos, para que a recuperação não altere a duração geral dos JWTs.
15. Como Administrador sujeito ao segundo fator TOTP, quero que a redefinição da senha preserve meu vínculo e a exigência do autenticador, para que recuperar a senha não desative uma proteção independente.
16. Como titular, quero que a API confirme a solicitação de forma imediata e uniforme, para que latência ou falha do provedor de e-mail não revele se a conta existe.
17. Como titular elegível, quero que uma falha transitória de e-mail possa ser retentada enquanto o token ainda for válido, para aumentar a chance de receber o link sem uma nova solicitação.
18. Como equipe de operação, quero que envios pendentes sobrevivam a reinícios do processo, para que a API não perca solicitações aceitas antes da entrega.
19. Como equipe de operação, quero que um envio que permaneça falho até a expiração seja encerrado sem enviar um link vencido, para que mensagens atrasadas não induzam a pessoa a usar uma credencial inválida.
20. Como titular, quero que pedidos repetidos dentro do limite por conta não gerem novos e-mails e ainda recebam a resposta genérica, para reduzir abuso sem criar um sinal de enumeração.
21. Como pessoa que excede o limite por IP, quero receber uma recusa genérica de excesso de solicitações, para que o endpoint limite abuso automatizado.
22. Como responsável pela segurança, quero que tentativas de recuperação e redefinições sejam auditáveis sem armazenar senhas, tokens ou endereços de e-mail, para investigar resultados sem expor segredos.
23. Como pessoa visitante da tela `/recover-password`, quero encontrar uma explicação visual e uma ação para voltar ao login, para reconhecer o destino do link sem depender de uma tela em branco.
24. Como pessoa usuária em qualquer idioma suportado, quero ver a tela placeholder traduzida, para compreender seu propósito no idioma selecionado.
25. Como equipe de frontend, quero que o placeholder não faça chamadas à API nem processe o token, para que a interface não prometa um fluxo que ainda não está implementado.

## Implementation Decisions

- Expor dois endpoints públicos no domínio de autenticação: solicitação em `POST /auth/password-recovery/request`, com `organization` (slug) e `email`; conclusão em `POST /auth/password-recovery/complete`, com `token` e `password`.
- A solicitação responde `202` com um código estruturado estável para pedidos válidos, contas inexistentes, inelegíveis ou com entrega de e-mail malsucedida. Erros de validação mantêm o contrato estruturado da API. A resposta não contém texto dependente de idioma nem indica envio efetivo.
- A conclusão retorna `204` quando a senha é alterada. Tokens inválidos, expirados ou consumidos produzem o mesmo código/razão pública e não alteram senha, sessões ou estado da conta.
- Elegibilidade: a conta pertence à organização informada, está `ACTIVE`, tem e-mail verificado e possui senha local. Contas `BLOCKED`/`DEACTIVATED`, e-mails não verificados e contas sem hash de senha local não recebem token nem e-mail.
- Gerar um token opaco aleatório com o mecanismo criptográfico já usado pela autenticação. Persistir apenas seu hash, associado à conta, organização e finalidade de recuperação. Token tem validade de uma hora e consumo único.
- A nova solicitação revoga transacionalmente tokens de recuperação anteriores ainda não consumidos da mesma conta antes de persistir o token e o item de outbox. A validação e o consumo do token, alteração do hash de senha e revogação de refresh tokens são atômicos para impedir consumo concorrente ou atualização parcial.
- Reutilizar a política de senha e o `PasswordHasher` atuais, sem ajustar limites nem o mecanismo de hash nesta entrega.
- Persistir a intenção de envio na mesma unidade transacional da emissão do token. A outbox guarda o payload sensível do e-mail cifrado com AES-256-GCM e o identificador da chave versionada de autenticação; o token de recuperação continua armazenado como hash no token de autenticação. O processador em segundo plano decifra o payload somente para usar o `EmailDelivery` configurado (SMTP na configuração atual). A API não aguarda a entrega. Falhas são retentadas com atraso crescente enquanto o token for válido; após a expiração, o item é marcado como falho e não é enviado. Uma retentativa pode produzir mais de uma mensagem com o mesmo token de uso único.
- O e-mail aponta para `APP_BASE_URL/recover-password#token=<token>`, mantendo o token no fragmento da URL conforme o padrão de links de autenticação atual. A página em `/recover-password` é um placeholder estático, não lê o token, não tem formulário e não chama a API; oferece ação para `/login` e segue os padrões visuais da tela de login.
- Aplicar limite móvel de 5 envios aceitos por conta e 20 solicitações por IP em 15 minutos. Após 5 envios aceitos na janela, solicitações seguintes da conta suprimem novo envio e mantêm a resposta `202` genérica. A 21ª solicitação do mesmo IP na janela responde `429` com erro estruturado genérico que não revela existência de conta.
- Em redefinição concluída, revogar todos os refresh tokens da conta. JWTs de acesso já emitidos permanecem válidos até a expiração atual (máximo de 15 minutos); não introduzir lista de bloqueio ou alteração geral de TTL nesta entrega.
- Recuperação da senha não remove nem redefine TOTP. Perda do autenticador permanece no fluxo de recuperação próprio.
- Registrar em auditoria as redefinições concluídas e as tentativas de conclusão negadas, com ator não autenticado/sistema conforme o mecanismo compartilhado e sem token, senha ou e-mail. Falhas técnicas de entrega também deixam evidência sem segredo. Solicitações para endereço inexistente não criam evento identificável de conta. Logs de aplicação não incluem payload sensível.
- Atualizar os DTOs, validações, autorização de rota pública e documentação OpenAPI com os contratos, códigos, elegibilidade, expiração, respostas genéricas, limites, efeitos sobre sessões e erros.
- Atualizar a documentação de autenticação e operação para registrar a outbox, o provedor utilizado, o processamento/expiração de mensagens e a configuração necessária. Registrar a escolha da outbox em ADR-005 e incluir os termos de recuperação no glossário do domínio.
- Criar a página placeholder de recuperação como dona de seu texto, estilo e traduções nos 12 idiomas suportados. Registrar a rota no mecanismo de navegação existente e associar a página na composição da aplicação, sem adicionar dependência de roteamento nem integração HTTP.

## Testing Decisions

- Avaliar apenas comportamento externo: respostas HTTP, e-mails capturados pelo adapter fake, registros persistidos, sessões, auditoria e apresentação visual. Evitar asserts sobre nomes de métodos, classes internas ou ordem de chamadas sem consequência observável.
- Usar como seam principal o fluxo HTTP real de autenticação com PostgreSQL isolado, relógio controlável e `EmailDelivery` substituído por fake. Observar solicitação, token via mensagem capturada, conclusão, expiração, consumo único, persistência do hash, sessões, auditoria, limite e comportamento de falha/retry do envio. Consultas diretas ao banco ficam restritas a invariantes de segurança impossíveis de observar pela API, como ausência do token/link em claro nos campos persistidos da outbox.
- Executar os casos backend em fatias verticais red-green: um comportamento observável por vez, teste falhando antes da mudança mínima que o atende; não escrever toda a suíte antes de iniciar a implementação.
- Cobrir solicitação para conta elegível, inexistente, de outra organização, bloqueada, desativada, não verificada e sem senha local; comparar status e corpo genérico entre estados esperados e verificar ausência de envio quando inelegível.
- Cobrir geração, expiração, substituição, token inválido, consumo único e solicitações/conclusões concorrentes; demonstrar que falhas não mudam senha nem revogam sessões parcialmente.
- Cobrir senha nos limites da política atual, atualização via hasher existente, invalidação de refresh tokens, preservação do TOTP e validade inalterada dos JWTs já emitidos.
- Cobrir envio assíncrono por outbox, sobrevivência da intenção persistida após recriar a aplicação, falha do adapter, retentativa enquanto válido, encerramento após expiração e ausência de token/link em claro no payload persistido. Verificar também ausência de token/senha/e-mail em auditoria e logs observáveis.
- Cobrir limites por conta e IP, incluindo resposta `202` uniforme quando o limite por conta suprime envio e `429` genérico no limite por IP.
- Usar um teste Playwright da rota `/recover-password` para verificar título, texto, ação de retorno, ausência de formulário/chamadas à API e conteúdo traduzido nos 12 idiomas suportados; validar acessibilidade básica e apresentação responsiva conforme o padrão do frontend.
- Como referência de testes, reutilizar o padrão de autenticação HTTP com PostgreSQL, relógio controlável e adapter de e-mail em memória, bem como a suíte Playwright de traduções e navegação. Os testes de unidade ficam reservados a regras que não possam ser observadas com clareza pelos seams de integração.

## Out of Scope

- Formulário funcional de solicitação de recuperação no frontend, formulário para definir nova senha e integração da tela com os endpoints.
- Recuperação, remoção ou novo cadastro de TOTP; recuperação de conta gerenciada somente por SSO.
- Alteração da política geral de senha, do provedor/canal SMTP, do TTL de JWTs ou do desenho de sessão global.
- Revogação imediata de JWT de acesso já emitido por denylist, mudança de senha autenticada, gestão administrativa de senhas ou desbloqueio/reativação de conta.
- Inclusão de provedores externos de fila, novo serviço de mensageria ou entrega de SMS.

## Further Notes

- A issue #160 define os critérios originais; esta spec registra as decisões de produto e contrato aceitas durante a entrevista, incluindo o placeholder visual pedido pelo usuário.
- As escolhas de uma hora de validade, elegibilidade, limites e resposta pública são próprias desta recuperação e não alteram as políticas gerais já implementadas para autenticação ou confirmação de e-mail.
- A decisão de usar outbox é registrada separadamente em ADR-005 por ser uma escolha arquitetural entre persistir trabalho assíncrono e aguardar o SMTP na requisição.
- Os seams de teste descritos acima foram apresentados e aprovados pelo usuário antes da redação desta spec.
- Esta especificação não altera código executável; verificações de build e testes serão realizadas na implementação.
