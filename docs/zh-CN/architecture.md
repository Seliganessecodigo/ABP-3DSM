# 架构

本部分面向开发和运维，介绍本地环境、契约和检查。学习产品操作请阅读使用指南。

## 技术文档 {#components}

React 19/TypeScript/Vite展示数据；NestJS/TypeORM/PostgreSQL 18负责集成与持久化。仅后端访问辅助来源。controller处理传输，service协调用例，adapter校验来源，repository持久化。全局认证/角色guard与`PublicRoute`公开例外。偏好按用户隔离；共享审计在`backend/src/shared/audit/`，成功写入与变更同事务。

```text
frontend/  React 19 · TypeScript · Vite
backend/   NestJS · TypeScript · TypeORM
PostgreSQL 18
frontend → GreenER API → auxiliary APIs
```

## 登录账户 {#security}

仪表板和环境查询公开。`/login`使用邮箱/密码或已启用的Google。Admin包括Google登录后均需设置/确认六位TOTP；Analyst/Visitor不因此获得管理权限。前端会话仅在内存中，刷新后需重登。后端校验JWT、会话、当前角色与账户状态；认证缺失/无效为401，角色不足为403。新路由默认保护。

同组织Admin可提交`expectedStatus`及原因，将账户改为`ACTIVE`、`BLOCKED`或`DEACTIVATED`。封禁/停用撤销所有会话；重新激活必须重新登录。保护自身账户及最后一位活跃Admin。预期状态冲突409，已达目标为幂等成功。共享审计将成功与变更同事务写入，拒绝在回滚事务之外写入，明确操作者且不含秘密。该路由不提供完整角色管理或密码恢复。

## 期间与历史 {#data}

`from`、`to`要求带明确时区的RFC 3339。`[from,to)`规范为UTC。序列支持`hour`、`day`、`month`、`year`，上限10,000点，超出拒绝。保存值按重叠比例分摊；最新`collectedAt`优先，再按ID字典升序，获胜观测不支持指标时不回退旧值。

来源指标没有测量时间；区间由接收时间减`collection_interval_seconds`得出。因子查询时间不证明有效期，未发布来源和有效性保持未知。能源、因子、排放存8位小数，覆盖率4位，无中间舍入。保留独立覆盖率及原始快照。

## 相关阅读 {#related}

[API参考](./reference/api) · [开始使用](./getting-started)

[ADR](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/adr) · [Design](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/design) · [Specs](https://github.com/Seliganessecodigo/ABP-3DSM/tree/develop/docs/specs)
