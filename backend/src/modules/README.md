# modules

Módulos NestJS organizados por domínio GreenER. Cada módulo reúne as rotas/controllers, serviços de aplicação, DTOs, regras de domínio e integrações próprias do domínio, mantendo dependências explícitas.

## Catálogo de aplicações

As rotas públicas `GET /applications` e `GET /applications/{id}` leem somente o catálogo persistido. A primeira retorna uma coleção (vazia quando não há aplicações); a segunda retorna 404 para ID inexistente e 400 para ID vazio ou maior que 128 caracteres. Falha de consulta retorna 503 com `CATALOG_UNAVAILABLE`.

O DTO expõe ID, nome, estado GreenER, horários disponíveis e localização normalizada (`regionCode`, `country`, `region`, `city`, `latitude`, `longitude`). `city` pode ser nula. Registros históricos sem localização completa continuam na lista com `location: null`; a coluna legada de texto não é apresentada como localização válida. As rotas não consultam a API auxiliar nem calculam energia ou CO₂e.

O contrato OpenAPI 1.0.0 está em `GET /openapi.json` e a interface de documentação em `GET /docs`. A migration de localização mantém os campos novos nulos para registros legados; o adapter de integração deve preencher todos os campos obrigatórios ao cadastrar ou atualizar aplicações válidas.
