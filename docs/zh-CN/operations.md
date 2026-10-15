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
