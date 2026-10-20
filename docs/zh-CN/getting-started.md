# 开始使用

## 环境要求

- Docker Desktop，并通过 `docker compose` 命令使用 Docker Compose v2。
- Node.js 24 或更高版本，以及用于执行根目录脚本的 npm。

## 启动环境

克隆仓库并进入项目目录：

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

根据示例文件创建本地配置：

```powershell
Copy-Item .env.example .env
```

macOS 或 Linux：

```sh
cp .env.example .env
```

启动前端、API 和 PostgreSQL：

```sh
npm run dev
```

Compose 会在容器中安装依赖。API 启动前会运行待执行的迁移。API 启动时会尝试发现应用；如果聚合器不可用，API 会记录错误并继续启动。

## 本地地址

| 服务 | 地址 |
| --- | --- |
| 前端 | `http://localhost:5173` |
| API | `http://localhost:3000` |
| OpenAPI | `http://localhost:3000/docs` |
| API 健康检查 | `http://localhost:3000/health` |
| PostgreSQL | localhost:5432 |

## 常用命令

| 命令 | 操作 |
| --- | --- |
| `npm run dev:detached` | 在后台启动服务 |
| `npm run dev:logs` | 持续查看服务日志 |
| `npm run dev:down` | 停止容器并保留数据卷 |
| `docker compose up --build` | 重新构建镜像 |

无需重启 API 即可重新执行发现：`docker compose exec api npm run applications:discover`。

## 常见问题

- 如果找不到 Docker，请启动 Docker Desktop 并检查 `docker compose version`。
- 如果端口已被占用，请修改 `.env` 中的 `FRONTEND_PORT`、`API_PORT` 或 `POSTGRES_PORT`。
- 如果 API 未通过健康检查，请查看 `npm run dev:logs`。API 依赖 PostgreSQL，并在启动时运行迁移。
- `.env.example` 中的值仅供本地开发使用。请勿共享真实凭据或提交 `.env` 文件。
