# Administração de contas — US-20 / #158

Somente Admin ativo, com e-mail confirmado e sessão GreenER válida (incluindo TOTP), pode administrar contas da própria organização. O guard global valida JWT/sessão; `AccountsService` consulta novamente o ator persistido dentro da transação e audita negações de autorização. Identidade, organização e papel não são aceitos por inferência do cliente.

## Endpoints

| Método e rota | Corpo / resultado |
| --- | --- |
| `GET /auth/users` | `{items, pagination}`; somente contas da organização do ator |
| `POST /auth/users` | `{name, email, role, reason}` → conta criada |
| `PATCH /auth/users/{userId}/role` | `{role, expectedRole, reason}` → conta atualizada |

Campos desconhecidos, campos vazios, arrays onde se espera texto, enums inválidos e UUID de destino inválido retornam 400. `name` aceita até 160 caracteres, `email` até 320 e `reason` até 512. E-mail é normalizado com trim/minúsculas e sua unicidade global sem caixa reutiliza o índice existente. Duplicidade retorna 409 com mensagem genérica, inclusive quando a conta pertence a outra organização. Nenhuma migration é necessária.

As respostas contêm somente `id`, `name`, `email`, `role`, `status`, `emailVerifiedAt`, `lastAccessAt`, `createdAt` e `updatedAt`. Datas usam ISO UTC; confirmação e último acesso podem ser nulos. Hashes de senha, tokens, sessões, segredos e dados do autenticador não participam de respostas, filtros ou busca.

## Criação e acesso

A criação não recebe senha e não confirma o e-mail automaticamente: `status=ACTIVE`, `emailVerifiedAt=null` e `passwordHash=null`. A conta permanece sem acesso até comprovar o e-mail. O titular usa o fluxo existente de `POST /auth/email/confirmation/resend` (`organization` é o slug, `email` é o endereço) e `POST /auth/email/confirm` (`token`, `password`). O segundo fluxo define a senha de 8–1024 caracteres usando o `PasswordHasher` existente (Argon2id e pepper), sem devolver a senha ou o hash. O novo endpoint de criação não envia e-mail automaticamente; o reenvio de confirmação e o convite Google mantêm seus contratos atuais. A recuperação de senha está documentada na seção correspondente; interface administrativa (#161) não faz parte deste fluxo.

## Listagem

A ordem é autorização/organização → busca e filtros → ordenação → paginação. A contagem usa os mesmos filtros da consulta de dados.

| Parâmetro | Contrato |
| --- | --- |
| `search` | OU entre todas as nove colunas públicas; trecho literal sem caixa/acentos latinos; não consulta dados ocultos |
| `id`, `name`, `email` | Trecho literal, combinados por E com os demais filtros; `%`, `_` e barra invertida não são curingas |
| `role`, `status` | Enums estáveis `ADMIN/ANALYST/VISITOR` e `ACTIVE/BLOCKED/DEACTIVATED` |
| `emailVerified`, `hasLastAccess` | `true` ou `false`; ausência explícita, sem indexar marcadores como “não informado” |
| `emailVerifiedAtFrom/To`, `lastAccessAtFrom/To`, `createdAtFrom/To`, `updatedAtFrom/To` | RFC 3339 com fuso, normalizado para UTC; limites inclusivos; início não pode superar fim |
| `sortBy` | Uma das nove colunas da resposta; padrão `name` |
| `sortDirection` | `asc` ou `desc`; padrão `asc` |
| `page` | Inteiro positivo seguro; padrão 1 |
| `pageSize` | `5`, `10`, `15`, `20` ou `all`; padrão `10` |

A busca textual usa códigos de enum e datas `YYYY-MM-DDTHH:mm:ss.SSSZ`. A UI deve converter rótulos traduzidos em enums e datas locais em RFC 3339 com fuso; o banco não infere idioma. Números/datas não são comparados como texto na ordenação: UUIDs, enums e timestamps preservam o tipo PostgreSQL. Texto segue a collation do banco, sem contrato de collation por idioma. Ausentes ficam ao final em ambas as direções; empates usam `id` crescente.

`pagination` contém `page`, `pageSize`, `totalItems`, `totalPages` e `hasNextPage`. `all` retorna o conjunto filtrado completo em uma página, sem limite oculto. Página acima da última é ajustada à última existente. Vazio retorna `items=[]`, `page=1` e `totalPages=0`. Esses parâmetros são exclusivos da listagem de contas e não alteram resultados ambientais.

## Alteração de papel, concorrência e auditoria

O papel esperado divergente retorna 409. Papel desejado já alcançado é sucesso idempotente e não revoga novas sessões. Mudança efetiva revoga todas as sessões e credenciais TOTP temporárias do destinatário na mesma transação da alteração e do evento de auditoria. A atribuição de Admin não dispensa TOTP; exige novo login. Segredo TOTP já configurado e identidades Google são preservados.

O Admin não pode remover seu próprio acesso nem o último Admin ativo com e-mail confirmado. Contas administrativas ainda sem confirmação não contam como substitutas do último Admin com acesso, inclusive na transição de estado existente (#245). Organização é bloqueada antes dos usuários, seguindo a mesma ordem do ciclo de vida; mudanças simultâneas de papel/estado não podem remover o último administrador.

Sucesso é auditado na mesma transação. Falha ou negação é registrada fora da transação revertida, conforme a ADR-004. Snapshots permitidos são nome/papel/estado, sem e-mail ou credenciais; preservam-se ator, instante, motivo e resultado. Falha da auditoria impede a mutação; não há retry automático de escrita.

## Verificação

`accounts.dto.spec.ts` cobre validação e normalização. `accounts.database.spec.ts` usa JWT real, Nest completo e PostgreSQL isolado pelo fixture de qualidade: cobre criação/ativação, hash, autorização, isolamento entre organizações, duplicidade concorrente, busca/filtros, ordenação, todas as quantidades, `all`, ausência, concorrência, último Admin e rollback de conta/sessões/auditoria.

Reprodução e credenciais demonstrativas de banco descartável estão em [test/README.md](../../../test/README.md). Execute `npm test -- --runInBand accounts account-lifecycle` e `npm run test:cov -- --runInBand`, com `TEST_DATABASE_URL` definido. O quality gate do SonarQube Cloud continua obrigatório antes do merge.

## Recuperação de senha

US-20 (#160) adiciona recuperação por e-mail para contas `ACTIVE`, verificadas e com senha local. Consulte o contrato e a outbox em [README](../README.md). Contas SSO sem senha, desativadas ou não verificadas recebem a mesma resposta pública sem novo token. Tokens duram uma hora, são de uso único e apenas seu hash fica em `auth_tokens`. A conclusão altera o hash existente e revoga sessões de refresh dentro da transação, sem remover TOTP nem invalidar JWTs já emitidos. O placeholder `/recover-password` não processa o token.
