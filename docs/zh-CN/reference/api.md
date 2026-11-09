# GreenER API参考

基准：`origin/develop`，提交`c343698`，于2026年11月8日核对。环境可能运行其他版本；合并不证明已部署。 Swagger: `http://localhost:3000/docs`; schema: `/openapi.json`.

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

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)

## 查询环境分析

`GET /applications/{id}/analysis`要求`from`和`to`为带有明确时区的RFC 3339时间戳。开始时间包含在范围内，结束时间不包含在内，两者都会转换为UTC。响应包含`status`（`available`或`empty`）、时间段、能源、排放、分别计算的覆盖率以及来源信息（方法、查询过的因子和原因）。`null`表示没有可用结果；0是有效数值。

| HTTP / code | 含义 |
| --- | --- |
| 400 / INVALID_ANALYSIS_PERIOD | 时间戳无效或缺少时区，或`to`小于等于`from`。 |
| 404 / APPLICATION_NOT_FOUND | 未识别该应用。 |
| 503 / APPLICATION_ANALYSIS_UNAVAILABLE | 读取分析或持久化结果失败。 |

## 查询环境序列

`GET /applications/{id}/analysis/series`要求`from`、`to`和`granularity`（`hour`、`day`、`month`或`year`）。响应包含`points`、`events`、总量和覆盖率。bucket按UTC日历计算，只计入与查询范围重叠的部分，因此可以是不完整bucket。超过10,000个点的请求会被拒绝；服务端不会截断或自动更改粒度。

在`/history`选择应用，`applicationId`、期间和粒度保存在URL。提供已保存序列、筛选、显示时区、事件、数字分页和bucket检查。贡献记录也支持5、10、15、20或全部的交互分页。后端bucket仍按UTC分组；显示时区不重新聚合。详情叠加比较同一应用上一段等长期间。

## 查询聚合摘要

`GET /analysis/summary`: `from`, `to`; `states`, `regionCodes`, `applicationIds`; `totals`, `coverage`, `states`, `applications`, `dataAsOf`, `provenance`. 在`/dashboard`选择24小时、7、30或90天、状态和地区。查看总量、覆盖率、状态计数及柱形/环形排放组成。表格支持搜索、列筛选、能源/CO₂e排序和分页；表格筛选不改变摘要总量。打开应用查看证据。定期查询`GET /analysis/summary`，无需刷新页面。

## 查询监控事故

`GET /monitoring/incidents`接受`applicationId`、`source`、`integration`、`status`、`page`和`limit`。status可为`OPEN`、`RECOVERING`或`RESOLVED`；默认页码为1、每页20条。响应包含`items`、`total`、`page`和`limit`。当前限制和枚举值请查看OpenAPI。

## API参考 — JWT

| HTTP | URI | JWT / credential |
| --- | --- | --- |
| GET | `/health` | — |
| GET | `/applications` | — |
| GET | `/applications/{id}` | — |
| GET | `/applications/{id}/collections/latest` | — |
| GET | `/applications/{id}/collections/{collectionId}` | — |
| GET | `/applications/{id}/analysis` | — |
| GET | `/applications/{id}/analysis/series` | — |
| GET | `/applications/{id}/analysis/series/contributions` | — |
| GET | `/analysis/summary` | — |
| GET | `/monitoring/incidents` | — |
| GET | `/carbon/regions` | — |
| GET | `/carbon/regions/{code}/intensity` | — |
| POST | `/applications/{id}/analysis/recalculation-preview` | — |
| POST | `/auth/login` | email + password |
| GET | `/auth/sso/google` | PKCE |
| GET | `/auth/sso/google/callback` | state + cookie |
| POST | `/auth/sso/handoff/exchange` | code + PKCE |
| POST | `/auth/totp/setup` | setupToken |
| POST | `/auth/totp/setup/confirm` | setupToken + TOTP |
| POST | `/auth/totp/challenge` | challengeToken + TOTP |
| POST | `/auth/sessions/refresh` | refreshToken |
| POST | `/auth/invitations/accept` | token |
| POST | `/auth/email/confirm` | token + password |
| POST | `/auth/email/confirmation/resend` | organization + email |
| GET | `/auth/me` | JWT |
| POST | `/auth/sessions/logout` | JWT |
| POST | `/auth/totp/replacement` | JWT + password + TOTP |
| POST | `/auth/totp/replacement/confirm` | JWT + confirmationToken + TOTP |
| GET | `/me/preferences` | JWT |
| PUT | `/me/preferences/{tab}` | JWT |
| POST | `/auth/sso/invitations` | JWT + ADMIN |
| DELETE | `/auth/sso/identities/{userId}` | JWT + ADMIN |
| PATCH | `/auth/users/{userId}/status` | JWT + ADMIN |

仪表板和环境查询公开。`/login`使用邮箱/密码或已启用的Google。Admin包括Google登录后均需设置/确认六位TOTP；Analyst/Visitor不因此获得管理权限。前端会话仅在内存中，刷新后需重登。后端校验JWT、会话、当前角色与账户状态；认证缺失/无效为401，角色不足为403。新路由默认保护。

同组织Admin可提交`expectedStatus`及原因，将账户改为`ACTIVE`、`BLOCKED`或`DEACTIVATED`。封禁/停用撤销所有会话；重新激活必须重新登录。保护自身账户及最后一位活跃Admin。预期状态冲突409，已达目标为幂等成功。共享审计将成功与变更同事务写入，拒绝在回滚事务之外写入，明确操作者且不含秘密。该路由不提供完整角色管理或密码恢复。

## API参考 — POST /applications/{id}/analysis/recalculation-preview

在`/administration/calculations`选择应用和日期，比较原始值与预览。结束日期包含完整UTC日；API接收`[from,to)`。公开预览使用当前模型及历史地区的当前因子，不保存结果。上限30天、10,000条观测。响应有`original`、`preview`、`warnings`、`status`（`available`、`empty`、`partial`）。因子故障保留可算能源，CO₂e不可用。百分比要求单位/覆盖率一致且参考值为正。

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

## API参考 — /me/preferences

`/methodology`有能源、排放、覆盖率和分析四个标签页，包含示例和个人偏好。任何已登录角色只能保存自身标签页；乐观版本冲突返回409。显示阈值不更改全局配置、计算或外部通知。保存期间/粒度仅填充详情URL中缺失的选项。历史方法保留在`/services/:id/methodology`，可带选中的`collectionId`。

`GET /me/preferences`: `energy`, `emissions`, `coverage`, `analysis` → `null` / `{ value, revision, updatedAt }`. `PUT /me/preferences/{tab}`: `{ expectedRevision, value }`; `expectedRevision: 0` → create; `400 INVALID_PREFERENCE`, `409 PREFERENCE_CONFLICT`, `503 PREFERENCES_UNAVAILABLE`.


```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example administrative action" }
```

`PATCH /auth/users/{userId}/status`: `400`, `401`, `403`, `404`, `409`.

`POST /applications/{id}/analysis/recalculation-preview`: `400 RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED`, `400 RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED`, `503 APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE`.
