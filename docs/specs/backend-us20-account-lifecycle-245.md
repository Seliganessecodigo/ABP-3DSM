# Spec — Ciclo de vida de contas e revogação de sessões (#245)

## Problem Statement

Administradores precisam suspender temporariamente ou encerrar o acesso de uma conta sem apagar a conta, a autoria de ações anteriores ou o histórico de auditoria. Hoje, a conta tem somente um indicador ativo/inativo, que não distingue bloqueio de desativação; sessões existentes também precisam ser invalidadas de modo previsível para que uma conta reativada não volte a usar credenciais antigas.

## Solution

Oferecer operações administrativas autenticadas para bloquear, reativar e desativar contas, com estados e transições explícitos. Somente um Admin ativo pode realizá-las. Cada mudança exige motivo, preserva a conta e sua autoria, registra auditoria de forma atômica e revoga imediatamente todas as sessões ao bloquear ou desativar. A reativação requer um novo login.

## User Stories

1. Como Admin ativo, quero bloquear temporariamente uma conta, para suspender seu acesso durante uma investigação ou outra necessidade temporária.
2. Como Admin ativo, quero desativar uma conta que não precisa mais de acesso, para impedir novos usos sem apagar seus registros.
3. Como Admin ativo, quero reativar uma conta bloqueada, para permitir que ela volte a iniciar uma sessão quando a suspensão temporária terminar.
4. Como Admin ativo, quero reativar uma conta desativada, para restaurar o acesso quando a conta voltar a ser necessária.
5. Como Admin ativo, quero mudar uma conta diretamente de bloqueada para desativada, para não reabrir o acesso como etapa intermediária.
6. Como Admin ativo, quero mudar uma conta diretamente de desativada para bloqueada, para representar uma suspensão temporária sem reativar a conta.
7. Como pessoa usuária de conta bloqueada ou desativada, quero que uma tentativa de iniciar sessão seja recusada, para que o estado administrativo realmente impeça acesso.
8. Como pessoa usuária com sessão aberta, quero perder autorização imediatamente quando minha conta for bloqueada ou desativada, para que tokens e sessões existentes não contornem a decisão administrativa.
9. Como pessoa usuária de conta reativada, quero precisar iniciar uma nova sessão, para que tokens e sessões anteriores não sejam restaurados.
10. Como Admin ativo, quero que repetir uma operação que já corresponde ao estado atual resulte em sucesso sem mutação, para que retries não criem mudanças artificiais.
11. Como pessoa responsável pela auditoria, quero que uma repetição sem mudança seja registrada como tal, para distinguir uma tentativa idempotente de uma transição efetiva.
12. Como Admin ativo, quero fornecer um motivo não vazio em cada operação, para que as mudanças de acesso tenham contexto auditável.
13. Como pessoa responsável pela auditoria, quero que cada transição registre ator, instante, estado anterior, estado posterior, motivo e resultado, para preservar a autoria e explicar a mudança.
14. Como pessoa responsável pela auditoria, quero que uma tentativa de domínio negada seja registrada como `denied` sem alterar a conta, para manter evidência das proteções administrativas.
15. Como pessoa responsável pela conta, quero que uma falha ao persistir a mudança ou sua auditoria preserve o estado e as sessões anteriores, para evitar uma operação parcialmente aplicada.
16. Como Admin ativo, quero que uma operação sobre minha própria conta seja recusada quando remover meu acesso administrativo, para evitar autoperdê-lo acidentalmente.
17. Como Admin ativo, quero que o sistema impeça bloquear ou desativar o último Admin ativo da organização, para manter uma pessoa capaz de administrar as contas.
18. Como pessoa sem JWT, Analyst ou Visitor, quero receber uma recusa do backend ao tentar administrar contas, para que controles de interface não sejam a única barreira de autorização.
19. Como equipe de manutenção, quero que contas legadas com `isActive=true` migrem para ativa e com `isActive=false` para desativada, para preservar a negação de acesso sem inferir se a causa antiga foi risco ou saída.
20. Como pessoa responsável pelo histórico, quero que a migração de contas legadas não invente ator, motivo ou evento administrativo, para que dados históricos não apresentem autoria falsa.
21. Como consumidor administrativo da API, quero distinguir entrada ou operação fora do contrato de conflito com estado concorrente, para tratar erros inválidos como 400 e conflitos de estado real como 409.
22. Como equipe de frontend que consome #161, quero contratos de operações, validação, autorização e resultados claros, para refletir o estado da conta somente após sucesso do backend.

## Implementation Decisions

- Usar três estados de domínio distintos: ativa, bloqueada e desativada. Bloqueio representa suspensão temporária, por exemplo durante uma investigação de risco; desativação representa que a conta não precisa mais de acesso. Ambos negam autenticação e são reversíveis por reativação explícita.
- Permitir transições diretas entre bloqueada e desativada. A reativação retorna qualquer um desses estados ao estado ativo. Não há transição efetiva de um estado para si mesmo: repetir a operação é sucesso idempotente, sem mutação, mas com resultado auditável de “sem mudança”.
- Somente Admin ativo pode executar as operações. Ausência de JWT e papéis Analyst/Visitor são recusados segundo as políticas existentes de autenticação/autorização, sem mutação. A autorização é aplicada no backend.
- Exigir motivo não vazio em cada operação. Recusar bloquear ou desativar a própria conta do Admin atuante. Recusar bloquear ou desativar o último Admin ativo da mesma organização.
- Ao bloquear ou desativar, revogar imediatamente todas as sessões existentes da conta. A reativação não restaura sessões nem tokens anteriores; é necessário iniciar nova sessão. Não alterar duração ou expiração de token como parte desta entrega.
- Preservar a conta, a identidade e a autoria de ações anteriores; não executar hard delete. Toda transição efetiva registra ator, instante, antes/depois, motivo e resultado pelo mecanismo compartilhado de auditoria de #119.
- Registrar tentativas de domínio negadas pelas proteções administrativas como `denied`, sem mutação. Repetições idempotentes devem ser auditadas como “sem mudança”. Os valores finais do contrato para esses resultados devem seguir a interface definida por #119; não criar vocabulário de auditoria paralelo.
- A atualização de estado, revogação de sessões e evento de auditoria de uma transição efetiva são atômicos. Falha de persistência ou auditoria preserva o estado e as sessões anteriores; não registrar sucesso se a operação falhar.
- Entradas/ações/estados fora do contrato retornam 400. Conflitos reais de estado concorrente ou stale retornam 409 sem mutação. Repetir uma operação já satisfeita não é conflito. Falhas de autenticação/autorização seguem os contratos existentes de #90/#91.
- Expandir o modelo persistido para representar os três estados e migrar `isActive=true` para ativa e `isActive=false` para desativada. Não criar eventos de auditoria por conta na migração, nem inventar ator ou causa histórica.
- Atualizar o contrato/OpenAPI do backend para as operações e resultados consumidos por #161, documentando autenticação, autorização, motivo obrigatório, transições, idempotência e erros. Não definir rotas ou campos além do necessário para o contrato e dos padrões existentes.
- Enviar estado desejado, `expectedStatus` e motivo na alteração de estado. Se o estado atual já for o desejado, responder sucesso sem mudança mesmo que o retry tenha uma pré-condição antiga; caso contrário, `expectedStatus` divergente do estado atual retorna 409.
- Reutilizar autenticação/autorização de #90/#91, gestão de contas e papéis de #158 e o mecanismo de auditoria de #119. A implementação de #245 depende da interface compartilhada de #119; não a duplicar nem absorver sua implementação nesta entrega.
- Respeitar a decisão registrada em ADR-003 sobre estados, migração legada e revogação de sessões.

## Testing Decisions

- Usar TDD: escrever primeiro testes de comportamento para as transições e os limites, implementar até passarem e refatorar sem alterar o contrato observado.
- Usar como seam principal testes de integração HTTP contra o backend com banco isolado. Os testes observam respostas, autorização, estado persistido, sessões e eventos de auditoria, sem depender de chamadas internas, nomes de métodos ou organização de classes.
- Cobrir cada transição permitida, as mudanças diretas entre bloqueada e desativada, reativação e repetição idempotente; verificar estado e resultado de auditoria.
- Cobrir início de sessão para conta bloqueada/desativada, acesso com sessão já emitida após bloqueio/desativação, revogação de todas as sessões e impossibilidade de reuso após reativação.
- Cobrir motivo ausente/vazio, JWT ausente, papéis sem permissão, autoproteção e tentativa de remover o último Admin ativo, verificando que nenhuma recusa causa mutação parcial.
- Cobrir falha ao persistir estado, revogar sessões e/ou auditar, demonstrando atomicidade e preservação do estado anterior. Validar também autoria e histórico existentes após as operações.
- Cobrir migração das contas ativas e inativas, preservação da negação de acesso para as inativas e ausência de eventos históricos artificiais.
- Cobrir valores fora do contrato (400), pré-condição `expectedStatus` obsoleta (409) e retry do estado já satisfeito (sucesso idempotente), distinguindo os três resultados.
- Acrescentar testes unitários somente para regras que não possam ser verificadas de forma clara pelo seam de integração, sem tornar detalhes de implementação o objeto dos testes.
- Usar como referência os testes E2E de autenticação, que já verificam conta inativa e sessões abertas, e os testes de banco de preferências, que verificam recusa de acesso para conta inativa.
- Executar a suíte backend pertinente, testes de integração com banco isolado e `test:cov`; conferir o LCOV para o código de produção afetado, verificações de lint, typecheck e build conforme aplicável. Não declarar aprovações do gate Sonar sem resultado observado.

## Out of Scope

- Recuperação de senha, que pertence a #160.
- Listagem, criação de contas e atribuição de papéis, que pertencem a #158.
- Interface administrativa, que pertence a #161.
- Definição ou alteração da matriz geral de papéis e endpoints, fora da autorização necessária para estas operações.
- Duração/expiração de tokens, bootstrap de Admin, política de senha e outros itens de #90.
- Exclusão física de contas, limpeza de autoria ou alteração de registros históricos.
- Regras de duração automática do bloqueio, desbloqueio por tempo, motivo opcional ou novos gatilhos automáticos de bloqueio.
- Implementação de um mecanismo de auditoria concorrente ao de #119.
- Geração de eventos históricos fictícios para classificar contas existentes.

## Further Notes

- A implementação desta spec fica bloqueada até #119 fornecer a interface compartilhada de auditoria requerida; preparar contrato e testes não autoriza duplicar esse mecanismo.
- A spec detalha decisões acordadas para #245 e complementa seus critérios originais. A proteção contra autoproteção e contra remoção do último Admin ativo foi explicitamente aprovada para esta entrega.
- O seam principal de teste HTTP + banco isolado foi aprovado antes da redação desta spec.
- Nenhuma alteração foi feita no GitHub; esta spec é um documento local do repositório.
