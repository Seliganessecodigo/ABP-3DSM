# 参与贡献

本部分面向开发和运维，介绍本地环境、契约和检查。学习产品操作请阅读使用指南。

## 验证标准 {#workflow}

范围和使用规则变更应在相应故事记录问题、预期结果和验收标准。产品评审与可用性评估记录困难、反馈和改进。数据保留、备份恢复、运营目标和外部配额仍需决策。

```text
develop → tipo/numero-descricao / tipo/descricao → PR develop
Conventional Commits: tipo(escopo): descrição
Refs #N
```

## 检查 {#quality}

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
npm run test:integration --prefix frontend
```

## 技术文档 {#documentation}

产品应能查找应用、区分零与缺失，并追踪指标的期间、单位、覆盖率和方法。查询保持导航上下文并说明加载、空、故障和旧数据。评估包括键盘、可见焦点、颜色之外的文字、移动设备及12种语言。

```sh
npm ci --prefix docs
npm run docs:check
npm run docs:build
```

## 相关阅读 {#related}

[质量与验收](./product/quality) · [产品待办](./roadmap)
