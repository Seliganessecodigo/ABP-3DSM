# repositories

Implementações de acesso e persistência usando TypeORM/PostgreSQL. Repositories encapsulam consultas e gravações; regras de negócio permanecem nos serviços de domínio/aplicação.

`MonitoringSettingsRepository` grava o estado global e sua revisão imutável no `EntityManager` da transação do caso de uso. O serviço deve adquirir o lock antes da mudança e auditar na mesma transação. `MonitoringCyclesRepository.finish` preserva a referência à configuração registrada no início, inclusive em falha/cancelamento. Veja [controle versionado](../../modules/applications/MONITORING_CONFIGURATION.md).
