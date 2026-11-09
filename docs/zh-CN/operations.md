# 运维与诊断

描述现有机制，不构成生产SLA。安装见[开始使用](./getting-started)，契约见[API](./reference/api)。

## 配置

| 配置 | 用途 |
| --- | --- |
| FRONTEND_PORT / API_PORT / POSTGRES_PORT | Compose发布的端口。 |
| DATABASE_URL | 主机/云后端使用；Compose内部指向`postgres`服务。 |
| METRICS_AGGREGATOR_URL / CARBON_INTENSITY_URL | 后端专用数据源。 |
| CORS_ORIGIN | 实际使用的前端允许来源。 |
| VITE_API_URL | 前端构建时嵌入或开发环境提供的API地址。 |
| MONITORING_SCHEDULE_INTERVAL_SECONDS | 后端调度周期，默认60秒。 |
| MONITORING_METRICS_CONCURRENCY | 每进程并发，初始默认2，并非上游配额。 |

两个监控参数必须为正整数。Compose不会自动将这两个`.env`键传入容器，覆盖时需显式环境映射。示例凭据仅用于本地。

## 检查环境

~~~sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
~~~

手动发现可重复，不应造成身份重复。调度在首个间隔后开始，防重叠仅限单进程，不跨副本。UI轮询与采集独立。

`/health`成功不代表目录已填充、上游可访问或环境指标可计算。还应检查`/applications`、证据及周期日志。

## 按症状诊断

| 症状 | 检查 |
| --- | --- |
| 容器无法启动 | Docker、端口、变量、migration日志。 |
| UI打开但目录失败 | 构建API URL、CORS、API、数据库。 |
| 目录为空 | 初始发现与聚合器；空并非HTTP错误。 |
| 保留旧数据 | 观测时间、本次失败、周期摘要。 |
| Pipeline失败而API可访问 | 区分质量、打包、部署、smoke阶段；部署后其他阶段仍可能失败。 |

## 发布及恢复

Staging从`develop`运行并依赖CI，API（Azure App Service）与前端（Static Web Apps）是独立job。API部署后执行smoke test。重新运行前记录run、SHA、阶段和诊断。

Pages使用VitePress与`DOCS_BASE=/ABP-3DSM/`，本地构建成功不能证明发布结束。现有workflow未证明自动数据库恢复。回滚或破坏性migration前检查兼容性和可恢复备份。保留期及恢复演练仍是[待决依赖](./product/decisions)。`npm run dev:down`保留卷；删除卷会删除本地数据库。

## 运维与诊断 — JWT / Google / SMTP

使用Node.js 24+、npm、Docker Compose v2。复制`.env.example`为`.env`，运行`npm run dev`。Compose先迁移并尝试发现，来源故障不阻止API启动。邀请/确认需要SMTP。首位Admin通过`backend/`的`organizations:create-invitation`创建，设置`ORGANIZATION_NAME`、`ORGANIZATION_SLUG`、`ORGANIZATION_REPRESENTATIVE_EMAIL`。没有通用生产Admin账户。

```text
AUTH_JWT_SECRET
AUTH_PASSWORD_PEPPER / AUTH_PASSWORD_PEPPER_VERSION / AUTH_PASSWORD_PEPPER_KEYS
AUTH_TOTP_ENCRYPTION_KEY_VERSION / AUTH_TOTP_ENCRYPTION_KEYS
APP_BASE_URL
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/sso/google/callback
SSO_RETURN_URL=http://localhost:5173/sso/callback
VITE_GOOGLE_SSO_ENABLED=true
SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_FROM
SMTP_USER / SMTP_PASSWORD
```

仪表板和环境查询公开。`/login`使用邮箱/密码或已启用的Google。Admin包括Google登录后均需设置/确认六位TOTP；Analyst/Visitor不因此获得管理权限。前端会话仅在内存中，刷新后需重登。后端校验JWT、会话、当前角色与账户状态；认证缺失/无效为401，角色不足为403。新路由默认保护。

同组织Admin可提交`expectedStatus`及原因，将账户改为`ACTIVE`、`BLOCKED`或`DEACTIVATED`。封禁/停用撤销所有会话；重新激活必须重新登录。保护自身账户及最后一位活跃Admin。预期状态冲突409，已达目标为幂等成功。共享审计将成功与变更同事务写入，拒绝在回滚事务之外写入，明确操作者且不含秘密。该路由不提供完整角色管理或密码恢复。

[OpenAPI / HTTP](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/authentication/AUTHORIZATION_MATRIX.md) · [Preferences](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/modules/preferences/README.md) · [Integration tests](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/test/README.md) · [External API contracts](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/backend/src/integrations/EXTERNAL_API_CONTRACTS.md)


在Google Cloud登记与`GOOGLE_CALLBACK_URL`完全一致的URI。`VITE_GOOGLE_SSO_ENABLED=true`仅启用按钮，不配置后端或创建账户；绑定需要邀请。`GOOGLE_CLIENT_SECRET`、JWT、pepper、TOTP密钥仅由后端保密管理，使用独立值并保留读取所需旧版本。邀请/确认需要SMTP。支持人员独立确认组织权限后执行`authentication:recover-admin-totp`，撤销会话并记录审计。
