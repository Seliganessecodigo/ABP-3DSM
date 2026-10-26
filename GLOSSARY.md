# GreenER

## SSO

**Login SSO**:
Autenticação no GreenER por um provedor de identidade confiável. O provedor confirma a identidade; organização, papel, estado e autorização continuam definidos pelo GreenER.

**Identidade externa**:
Identificador estável emitido por um provedor, representado pelo par issuer e subject. O e-mail não é chave de vínculo.

**Convite SSO**:
Autorização de uso único criada por Admin ativo para vincular uma identidade SSO a uma conta GreenER existente ou provisionar uma conta nova com papel explícito.

**Código de handoff**:
Código temporário de uso único que o callback entrega à UI. A UI troca o código por uma sessão GreenER usando o verificador PKCE; tokens de sessão não aparecem na URL.

Vocabulário do produto para alinhar conceitos entre autenticação, organizações e permissões.

## Autenticação

**Administrador**:
Pessoa usuária com papel `ADMIN` em uma organização GreenER.

**Segundo fator (2FA)**:
Etapa adicional de autenticação que exige comprovação além da senha. Nesta decisão de produto, o papel Administrador exige TOTP.

**Autenticador TOTP**:
Aplicativo ou dispositivo que gera códigos temporários de uso único a partir de um segredo compartilhado e do horário atual.

**Cadastro do autenticador TOTP**:
Vínculo inicial entre uma conta GreenER elegível e um autenticador compatível, ativado somente depois que a pessoa confirma um código válido.

**Desafio TOTP**:
Etapa temporária após o primeiro fator de autenticação, na qual a pessoa comprova posse do autenticador antes de receber uma sessão GreenER com acesso normal. O primeiro fator pode ser senha local ou identidade SSO.

**Representante da organização**:
Contato autorizado pela organização para receber o convite inicial do primeiro Administrador e validar recuperações de autenticador. Essa indicação não cria uma conta GreenER e pode ser substituída pelo suporte após validação independente da nova autoridade e registro de auditoria.
