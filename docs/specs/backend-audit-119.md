# Especificação — mecanismo compartilhado de auditoria (#119)

## Estado

Desenho e seams de TDD confirmados pelo responsável da tarefa.

## Objetivo

Oferecer uma interface reutilizável e segura para registrar eventos de auditoria na persistência existente, mantendo autoria e histórico sem expor credenciais ou segredos.

## Escopo

- Implementar o contrato compartilhado de gravação e conectá-lo ao repository de auditoria existente.
- Migrar os escritores existentes em autenticação, SSO, TOTP e preferências para o contrato comum.
- Disponibilizar o contrato para os casos de uso de contas, configuração e controle de monitoramento dependentes de #119.
- Alterar o schema aditivamente para persistir o tipo e a identificação do ator em campos explícitos.
- Manter a consulta administrativa fora deste escopo; ela pertence a #167.

## Contrato do evento

Eventos novos registram instante, resultado, código estável de ação, código de tipo de entidade, identificação da entidade, snapshots antes/depois quando aplicáveis e motivo quando exigido.

Os resultados são `success`, `denied` e `failed`. Ações e tipos de entidade são códigos estáveis e opacos definidos por cada consumidor; o mecanismo compartilhado não mantém um catálogo central nem traduz esses códigos.

O ator é um dos seguintes:

- `user`: ID estável e rótulo de exibição seguro congelado no evento, quando disponível. O e-mail e credenciais não são rótulos seguros.
- `system`: identificador estável do componente que iniciou a ação.
- `unauthenticated`: tentativa sem principal autenticado. Um identificador submetido na requisição não é tratado como identidade confirmada.
- `operator`: identificador externo estável de quem executou recuperação privilegiada de TOTP, sem vínculo com uma conta GreenER.

O schema mantém a referência atual ao usuário e acrescenta campos explícitos para tipo e demais identificadores/rótulos do ator. Eventos legados não recebem tipo nem autoria inferidos por backfill.

## Segurança e snapshots

- Senhas, tokens, segredos e conteúdo sensível não chegam ao repository.
- Antes/depois são projeções explícitas. O caso de uso declara os campos permitidos ao gravador; campos fora dessa allowlist ou com nomes sensíveis causam erro explícito, não remoção silenciosa.
- `denied` e `failed` não registram snapshots antes/depois.
- Códigos de motivo de ações administrativas humanas são obrigatórios e validados pelo caso de uso. O serviço compartilhado armazena o código sem inventar ou centralizar o catálogo.
- Motivo administrativo não é exigido para eventos de sistema nem para eventos de autenticação.
- A recuperação privilegiada de TOTP operada externamente preserva o motivo livre (validado pelo caso de uso) que já existe nesse fluxo; esta é uma exceção específica ao uso de códigos.

## Atomicidade e falhas

- Em `success`, mutação de domínio e evento de auditoria participam da transação do caso de uso e confirmam ou revertem juntos.
- Em `denied` ou `failed`, o evento é persistido fora da transação da operação que foi revertida, sem representar mutação não confirmada.
- Erro ao persistir a auditoria é propagado explicitamente; não pode ser convertido em sucesso.
- Append-only é garantido pelo contrato de aplicação/repository, que oferece gravação sem operações de atualização ou exclusão. Esta tarefa não adiciona bloqueio de update/delete no banco.

## Critérios verificáveis

1. Um evento válido e persistido pode ser recuperado com os campos aprovados e o resultado solicitado.
2. Campos não permitidos e dados sensíveis são impedidos antes da chamada ao repository.
3. Eventos de atores `system`, `operator` e `unauthenticated` preservam suas identidades sem atribuição falsa a usuário.
4. Falha de autorização ou de regra pode ser registrada como `denied` ou `failed`, com snapshots nulos.
5. Falha da gravação de auditoria é observável e nunca produz resposta de sucesso.
6. Sucesso confirma/reverte mutação e auditoria atomicamente; falha/negação continua registrada após o rollback da transação da operação.
7. Desativar uma conta não apaga a autoria dos eventos existentes; os registros históricos não são reescritos.
8. Escritores de autenticação, SSO e TOTP usam a mesma interface e preservam suas semânticas de evento sem motivo administrativo fictício.

## Dependências e fora de escopo

- #113 fornece schema e repository de persistência.
- #158, #245, #95 e #168 consomem a interface em seus casos de uso.
- #167 implementa consulta administrativa e não deve duplicar o mecanismo de gravação.
- Catálogos de motivo e allowlists de snapshots pertencem aos casos de uso que produzem cada evento; não se inventam campos nem políticas ausentes.
- Esta entrega não define retenção, paginação ou autorização da consulta de auditoria.

## Verificação planejada

Cobrir o contrato público nos seams aprovados, incluindo sucesso, mascaramento/allowlist, atores, negação/falha, persistência, falha do repository, atomicidade/rollback e autoria preservada. A execução backend e cobertura LCOV seguem os requisitos de `AGENTS.md`; nenhuma verificação é declarada até ser executada.
