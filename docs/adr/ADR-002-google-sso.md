# ADR-002: Login SSO Google com convite

- **Status:** aceito
- **Data:** 2026-10-23
- **Escopo:** #317

## Contexto

O GreenER precisa permitir login por provedor confiável sem transferir ao provedor a decisão de organização, papel ou autorização. As contas são provisionadas por convite de Admin ativo e Admins continuam sujeitos ao TOTP GreenER definido na ADR-001.

## Decisão

- Integrar inicialmente Google OpenID Connect pelo fluxo Authorization Code no backend. Solicitar somente `openid email`; exigir assinatura RS256 válida, issuer Google permitido, audience GreenER, expiração, nonce e `email_verified=true`. Usar o `sub` estável e canonicalizar o issuer para `https://accounts.google.com`.
- Iniciar login global sem slug. O backend usa endpoints Google fixos, `state`, `nonce`, PKCE S256 e cookie `HttpOnly`, `SameSite=Lax`, de validade curta para vincular callback e navegador. O retorno à UI é uma URL fixa configurada.
- Admin ativo pode convidar e-mail, nome e papel GreenER existente. O link é enviado por SMTP; o banco guarda somente o hash do token. Convites expiram em 24 horas, são de uso único e a reemissão revoga o anterior para o mesmo e-mail e organização.
- A aceitação exige o token do convite e igualdade entre o e-mail convidado e o e-mail Google verificado. Conta nova recebe nome e papel do convite e não recebe senha local. Conta existente na mesma organização preserva nome, papel e senha local. Não há associação automática apenas por e-mail.
- A identidade externa é única globalmente por issuer+subject e só pode pertencer a uma organização GreenER. Uma tentativa de aceitar convite de outra organização com identidade já vinculada é recusada.
- O retorno à UI transporta apenas código GreenER de handoff, de uso único e validade de 60 segundos, vinculado ao PKCE da UI. A troca emite sessão GreenER para Analyst/Visitor; para Admin, emite somente o desafio ou setup TOTP existente, sem sessão normal antes do segundo fator.
- Admin ativo pode revogar o vínculo Google de outra conta da mesma organização e emitir novo convite. Não há auto-desvinculação. Recuperação de Admin segue o procedimento de suporte da ADR-001.
- Identidades, convites, handoffs e sessões são persistidos em entidades próprias. Convite, vínculo, revogação e login são auditados; tokens e credenciais do provedor não são registrados.

## Consequências

- Configurar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` e `SSO_RETURN_URL` por ambiente. Segredos reais ficam fora do Git; `.env.example` contém somente valores demonstrativos.
- Registrar a callback URI exata no Google Cloud Console. A UI de login/retorno pertence a #319 e a interface TOTP pertence a #318.
- Sessões GreenER, papéis do banco, autorização #91 e estados de conta #245 continuam como fonte de acesso à API. Tokens Google não autorizam rotas GreenER.
- #158 continua dona da gestão geral de usuários e papéis; #317 implementa somente o mínimo de emissão e aceitação de convite SSO.
