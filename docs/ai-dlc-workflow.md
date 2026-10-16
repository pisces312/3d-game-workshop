# AI-DLC 与 Kiro IDE 工作流（可选）

本仓库可选采用 [AWS AI-DLC Workflows](https://github.com/awslabs/aidlc-workflows) 管理较大的功能、缺陷修复和发布工作。AI-DLC 将需求、设计、实现、验证与审批串联为可审计的交付流程；它不改变本项目的运行方式，也不是运行游戏的前置条件。

## 在 Kiro IDE 中初始化

先按 AI-DLC 官方 README 安装 `aidlc`，再在项目根目录执行：

```bash
aidlc config --harness kiro-ide
aidlc doctor
```

`aidlc doctor` 用于确认项目运行时和配置可用。Kiro IDE 的模型访问由 Kiro 提供，无需在此项目中重复保存模型供应商凭据。

## 建议的交付节奏

| 变更规模 | 建议产物 |
| --- | --- |
| 文案、小型 UI 或局部 bug | 问题描述、修改说明、手工验证记录 |
| 新玩法、协议或关卡机制 | 需求、设计、任务拆分、实现与多玩家验证证据 |
| 部署、安全或数据相关变更 | 架构/风险评估、回滚方案、上线检查和审批记录 |

对本项目，协议、房间状态机和关卡数量属于跨文件契约；使用 AI-DLC 时应将它们记录为需求与设计约束，并在实现阶段核对 `server.js`、`sheep-river-3d_4.html` 和项目文档的一致性。

## 相关链接

- [AI-DLC Workflows 项目与安装说明](https://github.com/awslabs/aidlc-workflows)
- [AI-DLC 文档入口](https://github.com/awslabs/aidlc-workflows/tree/main/docs)
- [本项目架构与协议](architecture.md)

本文对 AI-DLC 官方说明进行了概括和改写，以符合内容许可要求。
