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
