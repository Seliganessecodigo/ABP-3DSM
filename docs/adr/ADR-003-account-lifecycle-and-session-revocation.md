# ADR-003 — Estados de conta e revogação de sessões

Contas GreenER distinguem os estados ativa, bloqueada e desativada: bloqueio é uma suspensão temporária por risco, enquanto desativação indica que a conta não precisa mais de acesso; ambos negam autenticação e podem ser revertidos por reativação explícita. O legado `isActive=true` migra para ativa e `false` para desativada; sessões legadas de contas inativas são revogadas sem inventar autoria ou eventos de auditoria histórica.

Bloquear ou desativar revoga imediatamente todas as sessões da conta; reativar não restaura sessões ou tokens anteriores, exigindo novo login. Operações administrativas usam o mecanismo compartilhado de auditoria definido em #119, evitando que credenciais antigas recuperem acesso e mantendo a autoria das mudanças futuras.
