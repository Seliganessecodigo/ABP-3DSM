# GreenER API参考

路由已与2026年10月15日`develop`代码核对。本地Swagger：`http://localhost:3000/docs`，schema：`/openapi.json`。完整DTO请查看目标环境OpenAPI。

## 已有读取路由

| 方法与路由 | 结果 |
| --- | --- |
| GET /health | 服务HTTP健康响应。 |
| GET /applications | 持久化目录数组；`[]`有效。 |
| GET /applications/{id} | 应用、状态、时间及位置。 |
| GET /applications/{id}/collections/latest | 最近有效观测及运行上下文。 |
| GET /applications/{id}/collections/{collectionId} | 指定应用的观测，collectionId为UUID。 |
| GET /openapi.json | 机器可读契约。 |

读取不触发采集或环境计算。当前搜索与分页由前端执行；路由未定义服务端分页参数。

## 本地查询

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

使用目录返回的ID并对路径段URL编码，不假设连续ID或应用ID为UUID。DTO包含`id`、`name`、`state`、`firstSeenAt`、`lastCheckedAt`、`removedAt`、`location`。后端另有原因、新鲜度及可计算性，UI尚未消费所有字段。城市可以null；旧记录位置不完整时可为`location: null`。

## 错误

| HTTP / 代码 | 含义 |
| --- | --- |
| 400 / INVALID_APPLICATION_ID | 按路由规则为空或无效的ID；采集UUID无效也返回400。 |
| 404 / APPLICATION_NOT_FOUND | 应用未知。 |
| 404 / COLLECTION_NOT_FOUND | 该应用没有指定观测。 |
| 503 / CATALOG_UNAVAILABLE | 目录读取失败。 |
| 503 / APPLICATION_EVIDENCE_UNAVAILABLE | 证据读取失败。 |

按结构化代码和HTTP处理，错误文案不是翻译契约。不要将失败替换为空数组或零指标。

## 集成边界

仅后端调用辅助来源，参见[版本化契约](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)。此页不发布未来能源、认证或管理endpoint。JWT管理是[EP06](../backlog/ep06)要求，并非假设已经可用。URL、CORS与诊断见[运维](../operations)，区间解释见[方法](../product/methodology)。
