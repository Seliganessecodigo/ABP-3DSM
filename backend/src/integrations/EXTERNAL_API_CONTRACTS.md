# Contratos das APIs externas

Referência para quem implementar os adapters do GreenER. O contrato publicado pela API externa prevalece na integração: validar o payload recebido, mapear somente campos documentados e não fabricar valores.

## Origem e atualização desta referência

Especificações OpenAPI consultadas em 2026-10-06:

| Serviço | Documentação | OpenAPI | Versão declarada |
| --- | --- | --- | --- |
| Agregador de métricas | <https://metrics.unilaunch.org/docs> | <https://metrics.unilaunch.org/openapi.json> | 0.1.0 |
| Intensidade de carbono | <https://carbon.unilaunch.org/docs> | <https://carbon.unilaunch.org/openapi.json> | 0.1.0 |

Antes de mudar DTOs ou adapters, compare o OpenAPI publicado com esta referência e registre a versão/data da alteração. As URLs /openapi.json são a fonte para schemas completos e exemplos atuais.

Nenhuma das duas especificações declara esquema de autenticação. Isso significa que a documentação não especifica autenticação; não é garantia de que o ambiente nunca exigirá credenciais. Timeout, rate limit, paginação e política de retry também não estão descritos.

## Agregador de métricas

Base URL: <https://metrics.unilaunch.org>

| Método e rota | Contrato documentado |
| --- | --- |
| GET /health | Saúde do serviço; inclui service, status e uptime_seconds. |
| GET /services | Array dos serviços atualmente presentes no registro. A API informa que serviços removidos deixam de aparecer. Não documenta paginação. |
| GET /services/{id} | Detalhe do serviço atualmente registrado; 404 se não estiver listado. |
| GET /metrics/{service_id} | Coleta métricas. O ID deve vir de GET /services. Retorna collection_interval_seconds e metrics. |

Cada item de serviço requer id, name, location e metrics_path. location requer region_code, country, region, latitude e longitude; city é nullable. A lista não documenta um campo de estado operacional, apesar de existir um schema ServiceStatus separado no OpenAPI.

O objeto metrics requer:

| Campo | Tipo e unidade documentados |
| --- | --- |
| cpu_percent | número, percentual de 0 a 100 |
| memory_gb | número, GB |
| disk_gb | número, GB |
| network_gb | número, GB |

collection_interval_seconds é o intervalo de coleta informado pela origem. A resposta de métricas não inclui timestamp da observação. O adapter deve gravar o horário de recebimento como timestamp de coleta do GreenER, sem apresentá-lo como horário de origem.

### Ausência, remoção e falhas

- Uma resposta 200 completa e válida de GET /services representa o registro atual. Um serviço previamente conhecido que não aparece nessa resposta deixou de estar presente no registro da origem; registrar essa ausência/remoção observada e preservar todo o histórico.
- Erro HTTP, timeout, JSON inválido ou item que não valida contra o schema não é uma lista completa válida e não pode remover serviços.
- GET /metrics/{service_id} documenta 404 para serviço removido ou métricas inexistentes. Portanto, 404 nessa rota não distingue remoção de falta de métricas e, sozinho, não deve remover a aplicação.
- GET /metrics/{service_id} documenta 500 quando o serviço está listado mas indisponível ou quando o exportador está indisponível. Preservar a última observação válida e classificar a coleta atual como falha/stale; não gravar zero.
- Erros documentados usam error e message. Não depender de mensagens textuais para a regra de remoção; usar status HTTP e o snapshot completo de /services.

## Serviço de intensidade de carbono

Base URL: <https://carbon.unilaunch.org>

| Método e rota | Contrato documentado |
| --- | --- |
| GET /health | Saúde do serviço (service, status). |
| GET /regions | { regions, total }, com regiões e seus fatores. |
| GET /regions/{code} | Metadados de uma região identificada pelo código do agregador; 404 se não registrada. |
| GET /regions/{code}/carbon-intensity | Fator e participação renovável estimada da região. |
| GET /carbon-intensity/{code} | Alias da rota de intensidade acima. |

Uma região inclui code, country, region, latitude, longitude, carbon_intensity_gco2e_per_kwh e renewable_share_percent. city pode ser null.

- carbon_intensity_gco2e_per_kwh é gramas de CO₂ equivalente por kWh.
- renewable_share_percent é percentual estimado de fontes renováveis.
- 404 significa que o código regional não está registrado; não usar fator substituto.

A resposta publicada não fornece versão do fator, data de vigência, fonte bibliográfica ou timestamp de atualização. O GreenER deve preservar um snapshot imutável do valor recebido, a versão do contrato OpenAPI e o horário em que consultou a API. Esse horário registra a consulta do GreenER, não a vigência oficial do fator. Não inventar vigência nem atribuir fonte bibliográfica que a API não informa.

## Regras de integração do GreenER

1. Consumir essas APIs somente no backend, por adapters isolados dos repositories de persistência.
2. Validar respostas contra os schemas publicados antes de normalizar ou persistir.
3. Tratar os campos obrigatórios como obrigatórios: em particular, localização e coordenadas no agregador. city é opcional/nulável. Não completar coordenadas, região, unidade ou fator por inferência.
4. Distinguir timestamp de recebimento do GreenER de timestamp de origem; as respostas documentadas não trazem o segundo.
5. Preservar última observação válida durante falha, manter a aplicação no catálogo quando a coleta de métricas falhar e guardar motivo/status explícito em vez de gravar zero.
6. Como a origem não informa vigência dos fatores, não usar o timestamp de consulta como se fosse vigência oficial. A versão interna deve identificar o snapshot recebido e permanecer ligada às coletas que o utilizaram.
7. Não inferir autenticação, limite de chamadas, timeout ou retry a partir da ausência desses campos no OpenAPI. Confirmar requisitos operacionais com o responsável pela API antes de fixar esses parâmetros.
