# 架构

## 组件

本地环境通过 Docker Compose 启动三个服务：前端、API 和 PostgreSQL。

| 区域 | 职责 | 技术 |
| --- | --- | --- |
| `frontend/` | 界面、导航和展示 | React 19、TypeScript、Vite、i18next |
| `backend/` | API、用例和外部集成 | NestJS、TypeScript、TypeORM |
| PostgreSQL | 应用及领域数据的持久化 | PostgreSQL 18 |

前端只调用 GreenER API。只有后端会连接指标聚合器和碳强度服务。

## 代码组织

- `frontend/src/pages/` 将每个页面与其 hooks、翻译和 CSS Modules 放在一起。
- `frontend/src/features/` 负责领域契约、校验、HTTP 访问、缓存和纯业务规则。
- `backend/src/modules/` 按领域组织端点和用例。
- `backend/src/integrations/` 负责转换并校验辅助 API 的响应。
- `backend/src/database/` 包含实体、迁移和 repositories。

## 数据与可靠性

后端负责集成数据源并持久化数据，同时遵循文档中定义的契约、schema 和单位。错误、缺失值、无效响应、过期数据和有效的零值是不同状态；界面必须保留这种区分。

实现细节请参阅仓库中的[外部 API 契约](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)和[前端组织指南](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/frontend/src/README.md)。

## 相关阅读

[方法与数据](./product/methodology) · [API参考](./reference/api) · [运维与诊断](./operations)

## 架构 — c343698

React 19/TypeScript/Vite展示数据；NestJS/TypeORM/PostgreSQL 18负责集成与持久化。仅后端访问辅助来源。controller处理传输，service协调用例，adapter校验来源，repository持久化。全局认证/角色guard与`PublicRoute`公开例外。偏好按用户隔离；共享审计在`backend/src/shared/audit/`，成功写入与变更同事务。

仪表板和环境查询公开。`/login`使用邮箱/密码或已启用的Google。Admin包括Google登录后均需设置/确认六位TOTP；Analyst/Visitor不因此获得管理权限。前端会话仅在内存中，刷新后需重登。后端校验JWT、会话、当前角色与账户状态；认证缺失/无效为401，角色不足为403。新路由默认保护。

同组织Admin可提交`expectedStatus`及原因，将账户改为`ACTIVE`、`BLOCKED`或`DEACTIVATED`。封禁/停用撤销所有会话；重新激活必须重新登录。保护自身账户及最后一位活跃Admin。预期状态冲突409，已达目标为幂等成功。共享审计将成功与变更同事务写入，拒绝在回滚事务之外写入，明确操作者且不含秘密。该路由不提供完整角色管理或密码恢复。

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)
