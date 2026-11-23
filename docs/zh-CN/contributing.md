# 参与贡献

本部分面向开发和运维，介绍本地环境、契约和检查。学习产品操作请阅读使用指南。

## 验证标准 {#workflow}

Epic、用户故事和任务通过可验证的标准与代码引用组织产品。Issue、拉取请求和提交连接需求、实现与测试；版本化文档汇集架构、契约、运维和证据。

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## 检查 {#quality}

CI验证文档构建、前端lint/测试/构建、后端lint/typecheck/PostgreSQL测试/覆盖率/构建/迁移及真实浏览器集成流程。`TEST_DATABASE_URL`须指向隔离PostgreSQL；缺失时Jest跳过数据库套件，浏览器集成失败。合入`develop`的SonarQube要求新增覆盖率≥80%、重复率≤3%、评级A、hotspot全部审查。

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
npm run test:integration --prefix frontend
```

## 技术文档 {#documentation}

界面将指标与时间段、单位、覆盖率和计算方法关联，并保留筛选与导航上下文。加载、空结果、故障和陈旧数据均有明确处理。键盘操作、可见焦点、颜色之外的文字、移动设备、主题和12种语言构成完整的使用体验。

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## 相关阅读 {#related}

[质量与验收](./product/quality) · [产品待办](./roadmap)

[交付计划与证据](./plano-de-entregas)
