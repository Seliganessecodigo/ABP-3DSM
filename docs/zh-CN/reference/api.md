# GreenER API参考

路由已与2026年10月23日`develop`代码核对（commit `1633ca2`）。本地Swagger：`http://localhost:3000/docs`，schema：`/openapi.json`。完整DTO请查看目标环境OpenAPI。

## 已有读取路由

| 方法与路由 | 结果 |
| --- | --- |
| GET /health | 服务HTTP健康响应。 |
| GET /applications | 持久化目录数组；`[]`有效。 |
| GET /applications/{id} | 应用、状态、时间及位置。 |
| GET /applications/{id}/collections/latest | 最近有效观测及运行上下文。 |
| GET /applications/{id}/collections/{collectionId} | 指定应用的观测，collectionId为UUID。 |
| GET /applications/{id}/analysis?from=…&to=… | 查询应用在指定时间段内已持久化的环境结果。 |
| GET /applications/{id}/analysis/series?from=…&to=…&granularity=… | 查询应用环境时间序列。 |
| GET /applications/{id}/analysis/series/contributions?… | 查询序列bucket的贡献与排除项，支持分页。 |
| GET /analysis/summary?from=…&to=… | 查询可按条件筛选的聚合环境摘要。 |
| GET /monitoring/incidents | 查询带筛选和分页的集成事故记录。 |
| GET /openapi.json | 机器可读契约。 |

读取使用已持久化数据；环境查询聚合已保存结果，不重算历史。序列使用UTC粒度，并保留缺口和事件。目录搜索和分页由前端执行。

## 本地查询

~~~sh
curl --fail-with-body http://localhost:3000/health
curl --fail-with-body http://localhost:3000/applications
~~~

使用目录返回的ID并对路径段URL编码，不假设连续ID或应用ID为UUID。DTO包含`id`、`name`、`state`、`reason`、`lastObservationAt`、`isStale`、`isCalculable`、`firstSeenAt`、`lastCheckedAt`、`removedAt`、`updatedAt`和`location`。详情页使用运行字段说明状态、新鲜度和可计算性；字段类型与可空性请查看OpenAPI。城市可以null；旧记录位置不完整时可为`location: null`。

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

## 查询环境分析

`GET /applications/{id}/analysis`要求`from`和`to`为带有明确时区的RFC 3339时间戳。开始时间包含在范围内，结束时间不包含在内，两者都会转换为UTC。响应包含`status`（`available`或`empty`）、时间段、能源、排放、分别计算的覆盖率以及来源信息（方法、查询过的因子和原因）。`null`表示没有可用结果；0是有效数值。

| HTTP / code | 含义 |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | 时间戳无效或缺少时区，或`to`小于等于`from`。 |
| 404 / APPLICATION_NOT_FOUND | 未识别该应用。 |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | 读取分析或持久化结果失败。 |

按应用的摘要和序列已集成在详情页。页面也会查询bucket贡献；当前前端只请求第一页，交互分页仍待交付。

## 查询环境序列

`GET /applications/{id}/analysis/series`要求`from`、`to`和`granularity`（`hour`、`day`、`month`或`year`）。响应包含`points`、`events`、总量和覆盖率。bucket按UTC日历计算，只计入与查询范围重叠的部分，因此可以是不完整bucket。超过10,000个点的请求会被拒绝；服务端不会截断或自动更改粒度。

`GET /applications/{id}/analysis/series/contributions`还要求`bucketStart`；`page`默认1，`pageSize`默认10。允许`5`、`10`、`15`、`20`和`all`；`all`仅在第一页有效。响应包含贡献、排除项及保存的方法和因子快照。

## 查询聚合摘要

`GET /analysis/summary`要求`from`和`to`。可重复的可选筛选项为`states`、`regionCodes`和`applicationIds`。响应包含总量、覆盖率、按状态统计、应用列表、`dataAsOf`和来源信息。API已提供该接口，但界面尚无独立的聚合仪表板。

## 查询监控事故

`GET /monitoring/incidents`接受`applicationId`、`source`、`integration`、`status`、`page`和`limit`。status可为`OPEN`、`RECOVERING`或`RESOLVED`；默认页码为1、每页20条。响应包含`items`、`total`、`page`和`limit`。当前限制和枚举值请查看OpenAPI。
