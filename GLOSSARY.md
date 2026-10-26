# GreenER glossary

## Incident

A persisted record that a specific monitoring source or application integration has failed and has not yet met the recovery rule. An incident belongs to one identity and one integration; closing it does not close another incident.

## Integration

A GreenER connection to an external service for a defined operation, such as listing registered services, collecting application metrics, or reading a regional carbon factor.

## Incident identity

The source scope and integration that determine which failures share one incident. The service catalog operation has a global identity; metrics and carbon-factor operations have identities per application and integration.

## Valid observation

An external response that passes the documented contract and is successfully processed and persisted by GreenER. A valid response alone does not count as recovery when its required persistence fails.

## Recovery sequence

The number of consecutive valid observations for the same incident identity and integration. A failed observation resets only that integration's sequence. The approved monitoring rule requires three consecutive valid observations in distinct cycles to close an incident.

## Stale observation

Previously valid data that remains available but is older than the latest monitoring attempt. A failure or missing value is not represented as zero.

**Environmental temporal coverage**:
The fraction of the requested period supported by usable results, calculated independently for energy and CO₂e across the selected application scope. It describes time coverage, not the number or share of applications.
_Avoid_: Application coverage, data share

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
