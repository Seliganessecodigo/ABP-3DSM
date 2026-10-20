# config

Carregamento, validação e tipagem da configuração do backend, incluindo variáveis de ambiente. Segredos não devem ser armazenados nesta pasta nem versionados.

O ciclo automático de monitoramento usa `MONITORING_SCHEDULE_INTERVAL_SECONDS` (padrão `60`) e `MONITORING_METRICS_CONCURRENCY` (padrão inicial `2`). Ambos devem ser inteiros positivos; configuração inválida impede o módulo de iniciar. O limite de concorrência é por processo e configurável. A API agregadora não publica cota de chamadas; confirme esse valor com seu responsável antes de aumentar a carga em produção.
