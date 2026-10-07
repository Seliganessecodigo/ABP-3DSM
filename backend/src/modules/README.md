# modules

Módulos NestJS organizados por domínio GreenER. Cada módulo reúne as rotas/controllers, serviços de aplicação, DTOs, regras de domínio e integrações próprias do domínio, mantendo dependências explícitas.

## Catálogo de aplicações

As rotas públicas `GET /applications` e `GET /applications/{id}` leem somente o catálogo persistido. A primeira retorna uma coleção (vazia quando não há aplicações); a segunda retorna 404 para ID inexistente e 400 para ID vazio. Falha de consulta retorna 503 com `CATALOG_UNAVAILABLE`.

O DTO expõe ID, nome, estado GreenER, horários disponíveis e localização normalizada (`regionCode`, `country`, `region`, `city`, `latitude`, `longitude`). `city` pode ser nula. Registros históricos sem localização completa continuam na lista com `location: null`; a coluna legada de texto não é apresentada como localização válida. As rotas não consultam a API auxiliar nem calculam energia ou CO₂e.

O contrato OpenAPI 1.0.0 está em `GET /openapi.json` e a interface de documentação em `GET /docs`. A migration de localização mantém os campos novos nulos para registros legados; o adapter de integração deve preencher todos os campos obrigatórios ao cadastrar ou atualizar aplicações válidas.

`MetadataSyncService.reconcile(cycleId)` compara nome e todos os campos de localização de identidades conhecidas com um snapshot `/services` completo e válido. Quando algum desses campos muda, atualiza o cadastro e anexa um evento `registration_changed` com valores anteriores e novos, horário, ciclo e ator `system` na mesma transação. Repetir os dados não cria evento. Alterações de `metrics_path` não fazem parte desta regra de evento de cadastro.

`DiscoveryService.discover(cycleId)` consulta `/services` antes de abrir a transação. Para cada ID ainda desconhecido, grava aplicação e evento `discovered` com ator `system`, horário observado pelo GreenER e referência ao ciclo. A gravação usa conflito ignorado no ID para manter idempotência entre ciclos simultâneos; só um cadastro realmente inserido gera evento. Falha ou snapshot inválido da origem não abre transação. `metrics_path` é persistido, mas não integra o DTO público. A migration `DiscoverApplications1791350000000` acrescenta a referência de ciclo e remove limites de comprimento de ID/nome que não constam no contrato externo. Mudanças em aplicações já conhecidas ficam para a task #171.

`RemovalService.reconcile(cycleId)` consulta um snapshot completo e válido de `/services` e marca como `REMOVED` as identidades conhecidas ausentes. A política aprovada confirma a primeira ausência no mesmo ciclo: o evento `removed` guarda `observedAt` e `confirmedAt` iguais ao horário de recebimento do GreenER, além de origem, ciclo e ator. Estado, `removedAt` e evento são gravados na mesma transação; repetir o snapshot não duplica a transição. `ApplicationsRepository.findForCollection()` exclui aplicações removidas das próximas coletas; coletas e eventos anteriores continuam persistidos. O agendador de coleta ainda não está implementado nesta task.

`ReturnService.reconcile(cycleId)` reativa a mesma identidade quando ela reaparece em um snapshot completo e válido. Limpa `removedAt`, registra `returned` com horário, ciclo, origem e ator na mesma transação, e volta a incluí-la na seleção de coletas. Conforme decisão do responsável, o estado passa a `UNAVAILABLE` até uma nova coleta classificar as métricas; a presença no catálogo não é apresentada como métrica válida. O serviço não cria coletas retroativas para o intervalo removido.

`CollectionsRepository.findHistoryByApplication(id)` lê as coletas persistidas da mesma identidade em ordem temporal. Remoção e retorno não alteram essas linhas; o intervalo removido não ganha pontos nem valores zero. A representação explícita da lacuna na resposta temporal será definida pela task #114, que ainda não fornece esse contrato.
