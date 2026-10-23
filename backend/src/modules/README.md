# modules

## Autenticação SSO

`POST /auth/sso/invitations` permite ao Admin ativo da organização emitir convite com e-mail, nome e papel GreenER. `GET /auth/sso/google` inicia login global Google (`code_challenge` S256; convite opcional no parâmetro `invite`), `GET /auth/sso/google/callback` valida o retorno e redireciona à URL fixa `SSO_RETURN_URL` com um código de handoff, e `POST /auth/sso/handoff/exchange` troca o código com `code` e `codeVerifier`. O handoff dura 60 segundos, é de uso único e nunca inclui JWT na URL. Admin recebe o desafio/setup TOTP existente antes de obter sessão.

`DELETE /auth/sso/identities/{userId}` permite a Admin ativo revogar o vínculo de outra conta da mesma organização; o Admin não pode remover o próprio vínculo. Um novo convite permite vincular a identidade substituta. As variáveis `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` e `SSO_RETURN_URL` são configuradas fora do Git; a callback exata precisa ser cadastrada no Google Cloud Console. SMTP existente envia convites e o banco persiste somente o hash dos tokens.

Módulos NestJS organizados por domínio GreenER. Cada módulo reúne as rotas/controllers, serviços de aplicação, DTOs, regras de domínio e integrações próprias do domínio, mantendo dependências explícitas.

## Catálogo de aplicações

As rotas públicas `GET /applications` e `GET /applications/{id}` leem somente o catálogo persistido. A primeira retorna uma coleção (vazia quando não há aplicações); a segunda retorna 404 para ID inexistente e 400 para ID vazio. Falha de consulta retorna 503 com `CATALOG_UNAVAILABLE`.

O DTO expõe ID, nome, estado GreenER, horários disponíveis e localização normalizada (`regionCode`, `country`, `region`, `city`, `latitude`, `longitude`). `city` pode ser nula. Registros históricos sem localização completa continuam na lista com `location: null`; a coluna legada de texto não é apresentada como localização válida. As rotas não consultam a API auxiliar nem calculam energia ou CO₂e.

O estado atual inclui `reason`, `lastObservationAt`, `isStale` e `isCalculable`. `lastCheckedAt` registra a tentativa mais recente; `lastObservationAt` só avança com métricas válidas. Falha de origem mantém a última observação e marca o estado como stale. Métrica ausente ou inválida nunca gera zero. Uma aplicação fica `AVAILABLE` mesmo sem fator regional, mas `isCalculable` será falso e `reason` apontará `CARBON_FACTOR_UNAVAILABLE`. Remoção continua restrita a snapshot `/services` completo e válido, persistida com evento confirmado.

O contrato OpenAPI 1.0.0 está em `GET /openapi.json` e a interface de documentação em `GET /docs`. A migration de localização mantém os campos novos nulos para registros legados; o adapter de integração deve preencher todos os campos obrigatórios ao cadastrar ou atualizar aplicações válidas.

`MetadataSyncService.reconcile(cycleId)` compara nome e todos os campos de localização de identidades conhecidas com um snapshot `/services` completo e válido. Quando algum desses campos muda, atualiza o cadastro e anexa um evento `registration_changed` com valores anteriores e novos, horário, ciclo e ator `system` na mesma transação. Repetir os dados não cria evento. Alterações de `metrics_path` não fazem parte desta regra de evento de cadastro.

`DiscoveryService.discover(cycleId)` consulta `/services` antes de abrir a transação. Para cada ID ainda desconhecido, grava aplicação e evento `discovered` com ator `system`, horário observado pelo GreenER e referência ao ciclo. A gravação usa conflito ignorado no ID para manter idempotência entre ciclos simultâneos; só um cadastro realmente inserido gera evento. Falha ou snapshot inválido da origem não abre transação. `metrics_path` é persistido, mas não integra o DTO público. A migration `DiscoverApplications1791350000000` acrescenta a referência de ciclo e remove limites de comprimento de ID/nome que não constam no contrato externo. Mudanças em aplicações já conhecidas ficam para a task #171.

`InitialCatalogSyncRunner` cria um ciclo `startup-catalog-discovery`, executa essa descoberta e encerra o ciclo com contagens. O comando `npm run applications:discover` é executado pelo Compose depois das migrations e pode ser repetido sem duplicar aplicações ou eventos. Se o agregador falhar, o ciclo termina como `FAILED`, o erro fica nos logs e o servidor ainda inicia.

`RemovalService.reconcile(cycleId)` consulta um snapshot completo e válido de `/services` e marca como `REMOVED` as identidades conhecidas ausentes. A política aprovada confirma a primeira ausência no mesmo ciclo: o evento `removed` guarda `observedAt` e `confirmedAt` iguais ao horário de recebimento do GreenER, além de origem, ciclo e ator. Estado, `removedAt` e evento são gravados na mesma transação; repetir o snapshot não duplica a transição. `ApplicationsRepository.findForCollection()` exclui aplicações removidas das próximas coletas; coletas e eventos anteriores continuam persistidos. O agendador de coleta ainda não está implementado nesta task.

`ReturnService.reconcile(cycleId)` reativa a mesma identidade quando ela reaparece em um snapshot completo e válido. Limpa `removedAt`, registra `returned` com horário, ciclo, origem e ator na mesma transação, e volta a incluí-la na seleção de coletas. Conforme decisão do responsável, o estado passa a `UNAVAILABLE` até uma nova coleta classificar as métricas; a presença no catálogo não é apresentada como métrica válida. O serviço não cria coletas retroativas para o intervalo removido.

`CollectionsRepository.findHistoryByApplication(id)` lê as coletas persistidas da mesma identidade em ordem temporal. Remoção e retorno não alteram essas linhas; o intervalo removido não ganha pontos nem valores zero. A representação explícita da lacuna na resposta temporal será definida pela task #114, que ainda não fornece esse contrato.
