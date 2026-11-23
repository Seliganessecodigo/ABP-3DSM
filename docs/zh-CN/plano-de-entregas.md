# 交付计划与证据

GreenER的交付结合了功能广度、软件工程和环境数据可追溯性。本文通过代码、测试和文档链接，展示已实现功能、评估量表27项标准的证据，以及5名成员在3个迭代中的贡献。

`2026-11-22` · `America/Sao_Paulo` · `240a2c26ecd2eb1b0adc184f4efe01799bab8a50`

## 集成产品与工程 {#engineering}

React 19与TypeScript支撑界面，NestJS通过依赖注入将API组织为模块与分层，TypeORM和PostgreSQL通过版本化迁移保存数据。经过验证的集成、事务审计和计算快照共同支撑指标一致性。

在文档所对应的基准版本中，CI通过了542项前端测试、705项后端测试和3项集成流程，以及lint、类型检查、构建、迁移和SonarQube Cloud质量门禁。网站提供12种语言，自动验证内容、契约和链接的一致性。

[CI](https://github.com/Seliganessecodigo/ABP-3DSM/actions/runs/45084453486)

## 标准与验证 {#criteria}

| 代码 | 分值 | 交付 | 验证 | 展示的证据 |
| --- | ---: | --- | --- | --- |
| GA01 | 5 | 待办事项 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 结构化待办列表 |
| GA02 | 5 | 计划与容量 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Project迭代与负责人 |
| GA03 | 5 | 验收标准 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | Issue中的验收标准 |
| GA04 | 4 | 跟踪 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 关联的PR与提交 |
| GA05 | 3 | 增量交付 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| GA06 | 4 | 评审与改进 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 技术评审记录 |
| GA07 | 3 | 完成定义 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已文档化的DoD |
| GA08 | 3 | 文档与执行 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 版本化文档 |
| GA09 | 8 | 参与 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| DW01 | 3 | 技术 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| DW02 | 5 | 集成 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| DW03 | 4 | API与后端 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| DW04 | 4 | ORM持久化 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| DW05 | 3 | 前端 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| DW06 | 3 | 身份验证 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| DW07 | 3 | 容器 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| TP01 | 4 | 职责 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| TP02 | 4 | 依赖注入 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| TP03 | 4 | 类型与可读性 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| TP04 | 4 | 单元测试 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| TP05 | 4 | 验证与故障 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| IHC01 | 3 | 用户与任务 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| IHC02 | 3 | 流程与原型 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 原型与流程文档 |
| IHC03 | 3 | 指标与状态 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| IHC04 | 2 | 响应式与反馈 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 已实现并验证 |
| IHC05 | 2 | 用户评估 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 评估协议 |
| IHC06 | 2 | 改进与复测 | [GitHub](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/matriz.md) | 界面反馈记录 |

## 迭代与参考版本 {#sprints}

| Sprint | 期间 | 集成功能 |
| --- | --- | --- |
| [Sprint 1](./sprints/sprint-1) | 2026-10-05 / 2026-10-18 | 基础、目录与采集 |
| [Sprint 2](./sprints/sprint-2) | 2026-10-19 / 2026-11-01 | 指标、界面与身份验证 |
| [Sprint 3](./sprints/sprint-3) | 2026-11-02 / 2026-11-15 | 历史、分析与运行改进 |

## 完成定义 {#done}

验收标准、数据完整性、测试、CI、文档、无障碍和评审共同构成Definition of Done。每次交付都将版本与验证证据关联。

[Definition of Done](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/definition-of-done.md)

## 参与与来源 {#sources}

5名成员均在3个迭代中有已合入的贡献。表格将Git作者与可核验的提交关联，并展示Project中的任务与负责人，使产品开发参与情况可追溯。

[GitHub Project](https://github.com/orgs/Seliganessecodigo/projects/2) · [Tasks](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/tasks.md) · [Git](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/historico.json)

## 质量证据 {#quality-evidence}

代码、自动化测试、契约和文档构成交付的验证链。详细矩阵、可用性评估协议和技术记录支持检查流程、质量标准以及项目各维度的证据。

[#489](https://github.com/Seliganessecodigo/ABP-3DSM/issues/489) · [IHC05 / IHC06](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/usabilidade.md) · [Review](https://github.com/Seliganessecodigo/ABP-3DSM/blob/develop/docs/evidence/rubrica/revisao-2026-11-22.md)
