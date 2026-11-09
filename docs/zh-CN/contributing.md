# 参与贡献

## 工作流程

1. 修改代码前先查看 issue 和验收标准。
2. 从 `develop` 创建分支，并将变更限制在任务范围内。
3. 向 `develop` 提交 pull request，使用 Conventional Commit 标题并引用相关 issue。
4. 说明设计决策、限制、实际执行的检查；界面变更应附上视觉证据。

## 检查

CI 会运行前端和后端的 lint、测试与构建，并执行 SonarQube Cloud 质量门禁。完成 PR 前修复新增问题。注明本地未执行的检查；不要声称通过了未实际观察的检查。

## 界面变更

每个页面应与自己的样式、hooks 和翻译放在一起。前端支持 `pt-BR`、`en-US`、`es-ES`、`fr-FR`、`de-DE`、`it-IT`、`ja-JP` 和 `zh-CN`, `ko-KR`, `ru-RU`, `hi-IN`, `id-ID`。新增的用户可见文本必须提供完整的十二种语言版本，英语为回退语言。

## 集成或领域变更

请在 issue 和技术文档中确认契约与决策。不要自行编造端点、schema、单位、环境因子或重试策略。持久化 schema 变更需要迁移；契约变更需要同步更新 OpenAPI 和文档。

## 文档网站

发布内容以 Markdown 形式保存在 `docs/`。请同步更新全部十二种语言的对应页面，并运行 `npm run docs:build` 验证网站。

## Git

分支有issue时为`type/number-description`，否则`type/description`，使用小写、无重音kebab-case。提交与PR标题为`type(scope): description`，描述用葡萄牙语、动词开头、无句号。包括`Refs #N`、决定/限制及实际检查结果。完整标准见[AGENTS.md](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/AGENTS.md)。

[质量与验收](./product/quality) · [决策与依赖](./product/decisions)

## CI

CI验证文档构建、前端lint/测试/构建、后端lint/typecheck/PostgreSQL测试/覆盖率/构建/迁移及真实浏览器集成流程。`TEST_DATABASE_URL`须指向隔离PostgreSQL；缺失时Jest跳过数据库套件，浏览器集成失败。合入`develop`的SonarQube要求新增覆盖率≥80%、重复率≤3%、评级A、hotspot全部审查。自动测试不代替可用性评估或产品验收。

```sh
npm ci --prefix docs
npm run docs:build
npm ci --prefix frontend
npm run lint --prefix frontend
npm test --prefix frontend
npm run build --prefix frontend
npm ci --prefix backend
npm run lint --prefix backend
npm run typecheck --prefix backend
npm test --prefix backend -- --runInBand
npm run test:cov --prefix backend -- --runInBand
npm run build --prefix backend
# Isolated PostgreSQL: TEST_DATABASE_URL
npm run test:integration --prefix frontend
```
