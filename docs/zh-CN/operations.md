# 运维与诊断

本部分面向开发和运维，介绍本地环境、契约和检查。学习产品操作请阅读使用指南。

## 配置 {#environment}

```text
FRONTEND_PORT=5173
API_PORT=3000
POSTGRES_PORT=5432
DATABASE_URL
METRICS_AGGREGATOR_URL
CARBON_INTENSITY_URL
CORS_ORIGIN
VITE_API_URL
MONITORING_SCHEDULE_INTERVAL_SECONDS=60
MONITORING_METRICS_CONCURRENCY=2
```

## 自动监控 {#monitoring}

监控在首个间隔后开始，按进程防重叠；间隔/并发须正整数。Compose不自动转发`.env`中的`MONITORING_SCHEDULE_INTERVAL_SECONDS`和`MONITORING_METRICS_CONCURRENCY`，须显式映射。`/health`只验证HTTP，不保证发现或计算；请检查目录、证据和日志。来源故障不确认移除，连续三次有效观测后恢复。

完整有效snapshot中的首次缺席确认移除。每次外部调用总期限30秒，含首次最多3次HTTP尝试，仅重试暂时故障。

## 登录账户 {#authentication}

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

在Google Cloud登记与`GOOGLE_CALLBACK_URL`完全一致的URI。`VITE_GOOGLE_SSO_ENABLED=true`仅启用按钮，不配置后端或创建账户；绑定需要邀请。`GOOGLE_CLIENT_SECRET`、JWT、pepper、TOTP密钥仅由后端保密管理，使用独立值并保留读取所需旧版本。邀请/确认需要SMTP。支持人员独立确认组织权限后执行`authentication:recover-admin-totp`，撤销会话并记录审计。

```text
ORGANIZATION_NAME
ORGANIZATION_SLUG
ORGANIZATION_REPRESENTATIVE_EMAIL
ADMIN_EMAIL
NEW_RECOVERY_REPRESENTATIVE_EMAIL
SUPPORT_OPERATOR_ID
SUPPORT_RECOVERY_REASON
```

```sh
npm run organizations:create-invitation --prefix backend
npm run authentication:recover-admin-totp --prefix backend
```

## 诊断 {#diagnosis}

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose exec api npm run applications:discover
```

## 发布与恢复 {#release}

staging从`develop`通过CI后将API发布Azure App Service，frontend发布Static Web Apps，并在API后检查endpoint。文档用GitHub Pages和`DOCS_BASE=/ABP-3DSM/`。重试前确定失败阶段，无自动DB恢复。`npm run dev:down`保留volume，删除volume会删除本地数据。

## 相关阅读 {#related}

[开始使用](./getting-started) · [API参考](./reference/api)
