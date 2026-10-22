# ADR-001: TOTP obrigatório para administradores

- **Status:** aceito
- **Data:** 2026-10-22
- **Escopo:** #316

## Contexto

O login local existente emite sessão após validar senha. Admins precisam de segundo fator. O primeiro Admin é criado pelo convite ao representante da organização e precisa cadastrar o autenticador antes de acessar operações administrativas. O segredo TOTP precisa continuar confidencial se o banco for exposto.

## Decisão

- Exigir GreenER TOTP de `ADMIN`; `ANALYST` e `VISITOR` seguem sem requisito nesta task. Até política aprovada em #317, Admin também precisa GreenER TOTP após SSO.
- Usar RFC 6238 com 6 dígitos, HMAC-SHA1 e passo de 30 segundos. Aceitar ±1 passo e rejeitar replay por contador.
- Senha correta de Admin sem autenticador cria credencial temporária exclusiva para setup, sem sessão normal. Admin configurado recebe desafio TOTP sem JWT de acesso. Credenciais iniciais duram 5 minutos; setup pendente dura 10 minutos.
- Setup só é ativado após código válido. Troca exige senha recente e TOTP atual; o autenticador ativo continua válido até confirmar o novo. Admin não pode desativar TOTP enquanto mantém o papel.
- Permitir até cinco erros por desafio e cinco desafios por conta em quinze minutos, com atraso progressivo sem bloqueio permanente.
- Cifrar segredo com AES-256-GCM usando chave externa versionada. Configuração aceita versões anteriores para leitura e usa a versão ativa para novas gravações.
- Recuperação é executada pelo suporte após validação independente da autoridade atual da organização. Atualiza contato oficial, redefine TOTP, revoga sessões e grava auditoria. O contato não precisa ser conta GreenER; não há códigos de recuperação ou fluxo de autoatendimento.
- Manter Argon2id em 19456 KiB, duas iterações e paralelismo um; usar salt individual do Argon2. Pepper HMAC-SHA256 tem versão explícita, aceita versões anteriores e provoca rehash com a versão atual após login válido. Remover pepper comprometido exige reset das contas ainda dependentes dele.

## Consequências

- Sessões devem armazenar a confirmação de segundo fator e o guard precisa consultar papel e estado atuais. Sessões sem TOTP não se tornam administrativas por alteração posterior de papel.
- TOTP não é resistente a phishing; não declarar essa propriedade ou certificação de compliance apenas por adotar TOTP.
- Recuperação é uma operação de suporte fora da API de usuário e usa identidade do operador e motivo para auditoria.
- #91 segue dona da autorização geral, #245 de bloqueio/desativação e revogação, #119 da auditoria compartilhada, #317 do protocolo SSO/política MFA de IdP e #318 da UI.
