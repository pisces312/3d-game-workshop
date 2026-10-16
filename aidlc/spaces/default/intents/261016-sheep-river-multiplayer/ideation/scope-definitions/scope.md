# Scope Definition

## In scope

- 3D 河流、木筏、小羊、三种光照氛围和三关难度配置。
- 单页游戏 UI、生命、倒计时、分数、音效与移动端输入。
- 创建/加入房间、最多 8 人名单、房主启动、状态转发、排名与关卡同步。
- Node.js HTTP 服务与 `/ws` WebSocket 端点。
- 本意图下的需求、设计、实现和验证记录。

## Out of scope

- 数据库、登录、支付、分析、后台管理、云基础设施。
- 服务端物理判定、持久化积分、防作弊或公开排行榜。
- CI 自动发布和生产运行告警。

## Constraints and assumptions

| 项目 | 约束 |
| --- | --- |
| 运行时 | Node.js 18+；现代 WebGL 浏览器 |
| 容量 | 每个房间最多 8 人 |
| 状态 | 仅保存在单进程内存，进程重启即清除 |
| 协议 | JSON 文本 WebSocket 帧；客户端根据 HTTP/HTTPS 自动选择 ws/wss |
| 资产 | Three.js r128 从 cdnjs 加载 |
| 安全 | 房间码用于协作定位，不构成认证或访问控制 |