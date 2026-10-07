# modules

Módulos NestJS organizados por domínio GreenER. Cada módulo reúne as rotas/controllers, serviços de aplicação, DTOs, regras de domínio e integrações próprias do domínio, mantendo dependências explícitas.

## Catálogo de aplicações

As rotas públicas `GET /applications` e `GET /applications/{id}` leem somente o catálogo persistido. A primeira retorna uma coleção (vazia quando não há aplicações); a segunda retorna 404 para ID inexistente e 400 para ID vazio. Falha de consulta retorna 503 com `CATALOG_UNAVAILABLE`.

O DTO expõe ID, nome, estado GreenER, horários disponíveis e localização normalizada (`regionCode`, `country`, `region`, `city`, `latitude`, `longitude`). `city` pode ser nula. Registros históricos sem localização completa continuam na lista com `location: null`; a coluna legada de texto não é apresentada como localização válida. As rotas não consultam a API auxiliar nem calculam energia ou CO₂e.

O contrato OpenAPI 1.0.0 está em `GET /openapi.json` e a interface de documentação em `GET /docs`. A migration de localização mantém os campos novos nulos para registros legados; o adapter de integração deve preencher todos os campos obrigatórios ao cadastrar ou atualizar aplicações válidas.

`DiscoveryService.discover(cycleId)` consulta `/services` antes de abrir a transação. Para cada ID ainda desconhecido, grava aplicação e evento `discovered` com ator `system`, horário observado pelo GreenER e referência ao ciclo. A gravação usa conflito ignorado no ID para manter idempotência entre ciclos simultâneos; só um cadastro realmente inserido gera evento. Falha ou snapshot inválido da origem não abre transação. `metrics_path` é persistido, mas não integra o DTO público. A migration `DiscoverApplications1791350000000` acrescenta a referência de ciclo e remove limites de comprimento de ID/nome que não constam no contrato externo. Mudanças em aplicações já conhecidas ficam para a task #171.
