# Ideation Approval Handoff

## Decision requested

确认以 MVP 方式交付一个单实例、无账号、合作优先的多人 3D 过河游戏，并接受客户端非权威判定与房间内存态限制。

## Approved design direction (pending human confirmation)

- 用单个 HTML 文件承载游戏 UI、Three.js 场景与客户端实时逻辑。
- 用零第三方 npm 依赖的 Node.js 服务承载 HTTP 与 WebSocket 房间协调。
- 使用服务端种子保证各客户端产生相同关卡布局。
- 每个成员完成当前关卡后才推进；最后一关完成后房间进入完成状态。

## Risks accepted for MVP

1. 房间码可被猜测或转发；没有身份验证。
2. 客户端可伪造移动和完成消息；不应作为公平竞技系统。
3. 单实例重启会中断全部房间；不能直接水平扩容。
4. CDN 或 WebGL 不可用时页面无法正常游戏。

## Next gate

进入 Inception 前，人工确认功能范围、风险接受度及三关合作玩法。