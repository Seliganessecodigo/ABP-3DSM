# API参考

本参考用于GreenER API集成。完整类型、可选字段及限制位于环境`/openapi.json`，Swagger在`/docs`。目录和历史读取持久化数据，预览和碳路由可能查询碳强度来源。

## 公开查询 {#public}

| HTTP | URI | 访问 |
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

## 期间与历史 {#queries}

`from`、`to`要求带明确时区的RFC 3339。`[from,to)`规范为UTC。序列支持`hour`、`day`、`month`、`year`，上限10,000点，超出拒绝。保存值按重叠比例分摊；最新`collectedAt`优先，再按ID字典升序，获胜观测不支持指标时不回退旧值。

| URI | 参数 |
| --- | --- |
| `/applications/{id}/analysis` | `from`, `to` |
| `/applications/{id}/analysis/series` | `from`, `to`, `granularity` |
| `/applications/{id}/analysis/series/contributions` | `from`, `to`, `granularity`, `bucketStart`, `page`, `pageSize` (5/10/15/20/all) |
| `/analysis/summary` | `from`, `to`; `states`, `regionCodes`, `applicationIds` |
| `/monitoring/incidents` | `applicationId`, `source`, `integration`, `status` (OPEN/RECOVERING/RESOLVED), `page=1`, `limit=20` |

来源指标没有测量时间；区间由接收时间减`collection_interval_seconds`得出。因子查询时间不证明有效期，未发布来源和有效性保持未知。能源、因子、排放存8位小数，覆盖率4位，无中间舍入。保留独立覆盖率及原始快照。

## 登录账户 {#login}

仪表板和环境查询公开。`/login`使用邮箱/密码或已启用的Google。Admin包括Google登录后均需设置/确认六位TOTP；Analyst/Visitor不因此获得管理权限。前端会话仅在内存中，刷新后需重登。后端校验JWT、会话、当前角色与账户状态；认证缺失/无效为401，角色不足为403。新路由默认保护。

| HTTP | URI | 访问 |
| --- | --- | --- |
| POST | `/auth/login` | `email + password` |
| GET | `/auth/sso/google` | `PKCE` |
| GET | `/auth/sso/google/callback` | `state + cookie` |
| POST | `/auth/sso/handoff/exchange` | `code + PKCE` |
| POST | `/auth/totp/setup` | `setupToken` |
| POST | `/auth/totp/setup/confirm` | `setupToken + TOTP` |
| POST | `/auth/totp/challenge` | `challengeToken + TOTP` |
| POST | `/auth/sessions/refresh` | `refreshToken` |
| POST | `/auth/invitations/accept` | `token` |
| POST | `/auth/email/confirm` | `token + password` |
| POST | `/auth/email/confirmation/resend` | `organization + email` |

## 受保护操作 {#protected}

| HTTP | URI | 访问 |
| --- | --- | --- |
| GET | `/auth/me` | `JWT` |
| POST | `/auth/sessions/logout` | `JWT` |
| POST | `/auth/totp/replacement` | `JWT + password + TOTP` |
| POST | `/auth/totp/replacement/confirm` | `JWT + confirmationToken + TOTP` |
| GET | `/me/preferences` | `JWT` |
| PUT | `/me/preferences/{tab}` | `JWT` |
| POST | `/auth/sso/invitations` | `JWT + ADMIN` |
| DELETE | `/auth/sso/identities/{userId}` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/status` | `JWT + ADMIN` |
| GET | `/auth/users` | `JWT + ADMIN` |
| POST | `/auth/users` | `JWT + ADMIN` |
| PATCH | `/auth/users/{userId}/role` | `JWT + ADMIN` |

同组织Admin可提交`expectedStatus`及原因，将账户改为`ACTIVE`、`BLOCKED`或`DEACTIVATED`。封禁/停用撤销所有会话；重新激活必须重新登录。保护自身账户及最后一位活跃Admin。预期状态冲突409，已达目标为幂等成功。共享审计将成功与变更同事务写入，拒绝在回滚事务之外写入，明确操作者且不含秘密。该路由不提供完整角色管理或密码恢复。

```json
{ "status": "BLOCKED", "expectedStatus": "ACTIVE", "reason": "Example" }
```

## 通过 API 管理账户 {#accounts}

只有同一组织中处于有效状态的 Admin 可以查询、创建账户或更改角色。创建时提交 `name`、`email`、`role` 和 `reason`，不接收密码，也不自动验证邮箱。账户持有人通过现有邮箱确认流程设置密码，确认邮件需另行请求发送。管理界面和密码找回仍属于独立交付项。

列表先应用搜索和筛选，再排序和分页。默认每页10条，可选5、10、15、20条，以及返回全部筛选结果的 `all`。翻译后的标签应转换为枚举代码，本地日期应转换为带时区偏移的 RFC 3339。缺失值在升序和降序中均排在最后，相同值按标识符排序。

更改角色需要 `expectedRole` 和 `reason`。更改会撤销会话和临时 TOTP 凭据，保留审计记录，并禁止移除自己的访问权限或最后一个邮箱已确认的有效 Admin。未确认邮箱的账户不能替代该管理员。赋予 Admin 角色后仍须完成 TOTP 验证。

## 比较重算预览 {#preview}

在`/administration/calculations`选择应用和日期，比较原始值与预览。结束日期包含完整UTC日；API接收`[from,to)`。公开预览使用当前模型及历史地区的当前因子，不保存结果。上限30天、10,000条观测。响应有`original`、`preview`、`warnings`、`status`（`available`、`empty`、`partial`）。因子故障保留可算能源，CO₂e不可用。百分比要求单位/覆盖率一致且参考值为正。

```json
{ "from": "2026-10-01T00:00:00Z", "to": "2026-10-08T00:00:00Z" }
```

```text
{ status: "available" | "empty" | "partial", original, preview, warnings }
```

## 个性化分析 {#preferences}

`/methodology`有能源、排放、覆盖率和分析四个标签页，包含示例和个人偏好。任何已登录角色只能保存自身标签页；乐观版本冲突返回409。显示阈值不更改全局配置、计算或外部通知。保存期间/粒度仅填充详情URL中缺失的选项。历史方法保留在`/services/:id/methodology`，可带选中的`collectionId`。

```text
GET /me/preferences → { energy, emissions, coverage, analysis }
null | { value, revision, updatedAt }
PUT /me/preferences/{tab} ← { expectedRevision, value }
expectedRevision: 0 → create
threshold ≥ 0; finite number; thresholdPercent: 0–100
unknown fields / partial bodies / numeric strings → 400
```

| tab | value |
| --- | --- |
| energy | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kWh"}` |
| emissions | `{threshold, alertsEnabled, scope: "application", referencePeriod: "month", unit: "kgCO2e"}` |
| coverage | `{thresholdPercent, alertsEnabled}`; 0–100 |
| analysis | `{periodDays: 7 / 30, granularity: "hour" / "day"}` |

## 错误处理 {#errors}

按HTTP状态和结构化代码处理错误，不将消息作为翻译契约。`null`是缺失而非零。空列表是有效响应，不是查询失败。请结合操作理解代码。

| HTTP | 代码 |
| --- | --- |
| 400 | `INVALID_ANALYSIS_PERIOD` |
| 404 | `APPLICATION_NOT_FOUND / COLLECTION_NOT_FOUND` |
| 503 | `CATALOG_UNAVAILABLE / APPLICATION_EVIDENCE_UNAVAILABLE / APPLICATION_ANALYSIS_UNAVAILABLE` |
| 400 | `RECALCULATION_PREVIEW_PERIOD_LIMIT_EXCEEDED / RECALCULATION_PREVIEW_OBSERVATION_LIMIT_EXCEEDED` |
| 503 | `APPLICATION_RECALCULATION_PREVIEW_UNAVAILABLE` |
| 400 / 409 / 503 | `INVALID_PREFERENCE / PREFERENCE_CONFLICT / PREFERENCES_UNAVAILABLE` |

## HTTP契约 {#contracts}

[AUTHORIZATION_MATRIX.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [EXTERNAL_API_CONTRACTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md) · [preferences/README.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md)

## 相关阅读 {#related}

[运维与诊断](../operations) · [方法与数据](../product/methodology)
