# Recuperação de senha — #160

Continuação do commit `84c9896`, de Victor, na branch `feat/160-recuperar-senha-token-temporario`, conciliada com `develop`.

O backend implementa solicitação genérica, token temporário de uso único, outbox cifrada e redefinição transacional com auditoria e revogação de refresh tokens. A tela herdada permanece um placeholder, conforme a [spec](../../../docs/specs/backend-us20-password-recovery-160.md); formulários funcionais não fazem parte desta entrega.

- [Desktop, 1440 px](placeholder-1440.png)
- [Mobile, 390 px](placeholder-390.png)

As imagens são produzidas por `frontend/e2e/password-recovery.spec.ts`, que também verifica navegação por teclado, ausência de formulário/chamadas de recuperação e ausência de rolagem horizontal. Traduções são verificadas por `frontend/e2e/translations.spec.ts` nos doze idiomas.

Os testes HTTP/PostgreSQL estão em `backend/src/modules/authentication/authentication.e2e.spec.ts`; reprodução em [backend/test/README.md](../../../backend/test/README.md). A homologação do PO deve ser registrada antes de encerrar a issue; esta evidência não representa aprovação do produto.
