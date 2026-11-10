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

首次在网站访问分为两步：打开 `/setup-admin` 邀请，输入姓名和邮箱，然后打开 `/confirm-email` 确认链接以创建密码。接着登录并设置管理员必需的身份验证应用。无效、过期或已使用的链接会提示如何申请新链接；令牌会从 URL 中移除，仅保留在页面内存中。刷新页面后，请重新打开原始邮件链接。SMTP 必须投递到真实邮箱；`.test` 地址仅为示例。在 Azure 上，运维人员在已配置的后端控制台运行 `npm run organizations:create-invitation:prod` 发出首次邀请，受邀者在网站完成注册。`APP_BASE_URL` 必须指向已发布的前端。`frontend/public/staticwebapp.config.json` 支持直接访问托管路由。

管理员可在**用户** (`/administration/users`) 中查看组织账号并发送Google邀请。点击**关联我的Google账号**可填入自己的信息，确认发送后，使用相同邮箱的Google账号打开邮件链接。仅邮箱相同不会自动关联身份。新账号在接受邀请后显示，待处理邀请不计入账号列表。重新发送会撤销先前的邀请。现有账号保留姓名、角色和密码，管理员仍需TOTP。测试部署从GitHub变量读取 `VITE_GOOGLE_SSO_ENABLED`，仅在配置后端凭据和URL后才设置为 `true`。`GOOGLE_CALLBACK_URL` 为公开API地址加 `/auth/sso/google/callback`，`SSO_RETURN_URL` 为公开前端地址加 `/sso/callback`。

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
