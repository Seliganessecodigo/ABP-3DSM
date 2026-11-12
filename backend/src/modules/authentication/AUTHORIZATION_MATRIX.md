# Matriz de autorização HTTP

A autorização é aplicada no backend. O AuthenticationGuard é global e protege por padrão
toda operação sem PublicRoute. O RolesGuard global aplica RequireRoles após validar a sessão.
Para rotas protegidas, ausência ou invalidade da sessão resulta em 401; papel insuficiente resulta em 403.

## Acesso público

| Método e rota | Credencial | Observação |
| --- | --- | --- |
| GET /health | Nenhuma | Verificação de disponibilidade |
| GET /applications | Nenhuma | Catálogo |
| GET /applications/{id} | Nenhuma | Detalhe |
| GET /applications/{id}/collections/latest | Nenhuma | Observação mais recente |
| GET /applications/{id}/collections/{collectionId} | Nenhuma | Observação armazenada |
| GET /analysis/summary | Nenhuma | Resumo ambiental agregado |
| GET /applications/{id}/analysis | Nenhuma | Resultado ambiental por período |
| GET /applications/{id}/analysis/series | Nenhuma | Série ambiental persistida |
| GET /applications/{id}/analysis/series/contributions | Nenhuma | Contribuições persistidas |
| POST /applications/{id}/analysis/recalculation-preview | Nenhuma | Prévia em memória; não altera resultados oficiais |
| GET /monitoring/incidents | Nenhuma | Incidentes de monitoramento |
| GET /carbon/regions | Nenhuma | Regiões e fatores |
| GET /carbon/regions/{code}/intensity | Nenhuma | Fator por região |

## Bootstrap de autenticação

Estas rotas não exigem JWT prévio. Cada fluxo valida a credencial de seu contrato.

| Método e rota | Prova do fluxo |
| --- | --- |
| POST /auth/login | E-mail e senha |
| GET /auth/sso/google | Parâmetros de início e convite opcional |
| GET /auth/sso/google/callback | Código, estado e cookie de estado SSO |
| POST /auth/sso/handoff/exchange | Código de handoff e verificador PKCE |
| POST /auth/totp/setup | Token de configuração |
| POST /auth/totp/setup/confirm | Token de configuração e código TOTP |
| POST /auth/totp/challenge | Token de desafio e código TOTP |
| POST /auth/sessions/refresh | Refresh token |
| POST /auth/invitations/accept | Token de convite e dados de cadastro |
| POST /auth/email/confirm | Token de confirmação e senha |
| POST /auth/email/confirmation/resend | Organização e e-mail |

## Sessão e preferências

| Método e rota | Acesso |
| --- | --- |
| GET /auth/me | Qualquer papel GreenER autenticado |
| POST /auth/sessions/logout | Qualquer papel GreenER autenticado |
| POST /auth/totp/replacement | Sessão autenticada e senha/TOTP atuais |
| POST /auth/totp/replacement/confirm | Sessão autenticada e prova de confirmação |
| GET /me/preferences | Qualquer papel autenticado; somente as próprias preferências |
| PUT /me/preferences/{tab} | Qualquer papel autenticado; somente as próprias preferências |

## Operações administrativas

| Método e rota | Papel |
| --- | --- |
| POST /auth/sso/invitations | ADMIN autenticado |
| DELETE /auth/sso/identities/{userId} | ADMIN autenticado; mantém restrição de organização e bloqueio de autorrevogação |
| PATCH /auth/users/{userId}/status | ADMIN autenticado da mesma organização; motivo e estado esperado obrigatórios; transição e revogação atômicas |
| GET /auth/users | ADMIN ativo da mesma organização; busca, filtros, ordenação e paginação; sem credenciais |
| POST /auth/users | ADMIN ativo da mesma organização; cria conta pendente de confirmação, sem receber senha |
| PATCH /auth/users/{userId}/role | ADMIN ativo da mesma organização; papel esperado, motivo e revogação atômica de sessões |

A conta pode estar ativa, bloqueada ou desativada. Bloqueio e desativação revogam todas as sessões;
reativação exige novo login. O Admin não pode bloquear a própria conta nem o último Admin ativo.
Estado esperado divergente retorna 409, exceto quando o estado desejado já foi alcançado, que é
sucesso idempotente. Valores ou motivos inválidos retornam 400.

As novas rotas de contas usam o guard global de sessão e conferem o papel persistido no
caso de uso, dentro da transação, para também auditar as negações de usuários autenticados.
Mudança de papel revoga sessões e credenciais TOTP temporárias; o próximo login usa o papel
atual e mantém TOTP obrigatório para Admin. Um Admin ainda sem e-mail confirmado não conta
como substituto do último Admin com acesso, tanto na alteração de papel quanto de estado.
O contrato de consultas, criação e auditoria está em [ACCOUNTS.md](ACCOUNTS.md).
