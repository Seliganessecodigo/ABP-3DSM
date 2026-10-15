# Operação e diagnóstico

Este guia descreve os mecanismos existentes, não um SLA de produção. Para instalar, use [Primeiros passos](./getting-started); para o contrato, use [Referência da API](./reference/api).

## Configuração por fronteira

| Configuração | Onde atua |
| --- | --- |
| FRONTEND_PORT / API_PORT / POSTGRES_PORT | Portas publicadas pelo Compose. |
| DATABASE_URL | Backend no host/nuvem; no Compose a URL interna usa o serviço `postgres`. |
| METRICS_AGGREGATOR_URL / CARBON_INTENSITY_URL | Fontes consultadas exclusivamente pelo backend. |
| CORS_ORIGIN | Origem autorizada do frontend; deve corresponder ao endereço utilizado. |
| VITE_API_URL | URL da API incorporada ao build do frontend ou fornecida pelo ambiente de desenvolvimento. |
| MONITORING_SCHEDULE_INTERVAL_SECONDS | Intervalo do scheduler do backend; padrão 60 segundos. |
| MONITORING_METRICS_CONCURRENCY | Concorrência por processo; padrão inicial 2, não cota publicada pela origem. |

Os dois parâmetros de monitoramento devem ser inteiros positivos. O Compose atual não encaminha automaticamente essas duas chaves do `.env` ao container; para sobrescrevê-las ali, é necessário mapeamento explícito de ambiente. O exemplo contém apenas credenciais locais, nunca credenciais de ambiente compartilhado.

## Verificar o ambiente local

~~~sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
~~~

A descoberta manual é repetível e não deve duplicar identidades. O scheduler começa após o primeiro intervalo; a proteção contra ciclos sobrepostos é por processo, não distribuída entre réplicas. Atualização da UI e coleta são relógios independentes.

`/health` responder não comprova catálogo preenchido, origem acessível ou indicador ambiental calculável. Verifique também `/applications`, evidências disponíveis e logs do ciclo.

## Diagnóstico orientado por sintoma

| Sintoma | Verificação |
| --- | --- |
| Containers não iniciam | Docker ativo, portas livres, variáveis e logs de migrations. |
| UI abre, mas catálogo falha | URL da API no build, CORS, resposta da API e acesso ao banco. |
| Catálogo responde vazio | Resultado da descoberta inicial e acesso ao agregador; vazio não é erro HTTP. |
| Dados antigos permanecem | Hora da observação, falha da tentativa atual e resumo do ciclo. |
| Pipeline falha, mas API responde | Identificar se falhou qualidade, pacote, deploy ou smoke test; uma etapa pode ter publicado antes de outra falhar. |

## Publicação e recuperação

O workflow de staging parte de `develop` e depende da CI. API e frontend possuem jobs distintos: a API é empacotada para Azure App Service, o frontend para Static Web Apps; o smoke test verifica endpoints após publicar a API. Registrar run, SHA, etapa e diagnóstico antes de repetir.

O site usa build VitePress e workflow de Pages com `DOCS_BASE=/ABP-3DSM/`. Um build local válido não prova que a publicação terminou.

Não há restauração automática de banco demonstrada por esses workflows. Antes de rollback ou migration destrutiva, verificar compatibilidade e backup recuperável. Retenção e ensaio de restauração seguem como [dependências explícitas](./product/decisions). `npm run dev:down` preserva o volume; apagar volumes remove o banco local.
