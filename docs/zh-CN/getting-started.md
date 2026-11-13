# 开始使用

本部分面向开发和运维，介绍本地环境、契约和检查。学习产品操作请阅读使用指南。

## 配置 {#requirements}

使用Node.js 24+、npm、Docker Compose v2。复制`.env.example`为`.env`，运行`npm run dev`。Compose先迁移并尝试发现，来源故障不阻止API启动。邀请/确认需要SMTP。首位Admin通过`backend/`的`organizations:create-invitation`创建，设置`ORGANIZATION_NAME`、`ORGANIZATION_SLUG`、`ORGANIZATION_REPRESENTATIVE_EMAIL`。没有通用生产Admin账户。

## 从哪里开始 {#start}

```sh
git clone https://github.com/Seliganessecodigo/ABP-3DSM.git
cd ABP-3DSM
```

```powershell
Copy-Item .env.example .env
```

```sh
cp .env.example .env
```

```sh
npm run dev
```

| 功能 | URI |
| --- | --- |
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| PostgreSQL | `localhost:5432` |

## 配置 {#commands}

```sh
npm run dev:detached
npm run dev:logs
npm run dev:down
docker compose exec api npm run applications:discover
```

## 相关阅读 {#related}

[使用指南](./guide/monitoring) · [运维与诊断](./operations)
