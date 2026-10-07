# integrations

Implementação e operação: [IMPLEMENTATION.md](IMPLEMENTATION.md). Decisão de persistência: [ADR-CARBON-FACTOR-SNAPSHOTS.md](ADR-CARBON-FACTOR-SNAPSHOTS.md).

Adapters/providers para comunicação do backend com serviços externos, como o Agregador de Métricas e o Serviço de Intensidade de Carbono. Validam e normalizam contratos externos; não contêm persistência de domínio.

Consulte [EXTERNAL_API_CONTRACTS.md](EXTERNAL_API_CONTRACTS.md) para endpoints, schemas, unidades, erros e regras de integração atualmente documentados. Repositories em database/repositories/ continuam responsáveis pela persistência.
