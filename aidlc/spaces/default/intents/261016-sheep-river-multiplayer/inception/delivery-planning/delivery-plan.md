# Delivery Plan

## Milestones

| Milestone | Scope | Exit evidence | Status |
| --- | --- | --- | --- |
| M1 Gameplay foundation | 3D 场景、关卡、移动、失败与计分 | 单会话可进入和完成关卡 | Implemented |
| M2 Room collaboration | 创建/加入、房主、同步、排名、关卡推进 | 两会话联机走完一局 | Manual acceptance pending |
| M3 Documentation | README、架构、部署、安全、AI-DLC 产物 | 文档链接与需求追溯完整 | Complete |
| M4 Production hardening | 认证、限流、观测、共享状态 | 风险评审和部署验收 | Out of scope |

## Verification sequence

1. 执行 Node.js 语法检查和 Git 空白检查。
2. 用非占用端口启动服务并验证 `GET /`。
3. 使用两个浏览器会话按 V-01 至 V-09 进行联机验收。
4. 人工评审安全边界与部署限制；确认不需要 M4 后关闭 MVP 意图。

## Rollback

当前交付为文档回填，不改变运行时代码。删除本意图目录即可回退文档；若后续涉及游戏代码，按版本控制回退相应提交。