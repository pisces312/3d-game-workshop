# Domain Design

## Core entities

| Entity | Key fields | Responsibility |
| --- | --- | --- |
| Room | `code`, `hostId`, `phase`, `levelIdx`, `levelSeed`, `finishOrder`, `players` | 协调房间成员、关卡和阶段。 |
| Player | `id`, `name`, `color`, `state`, `completed`, `rank`, `socket` | 保存会话身份、展示数据和当前游戏状态。 |
| PlayerState | `x`, `y`, `z`, `dir`, `jumping`, `visible`, `levelIdx` | 供其他客户端渲染的最小状态快照。 |
| Level | `name`, `lanes`, `speed`, `plankLength`, `gap`, `timeLimit`, `timeOfDay` | 客户端生成关卡的配置。 |

## Room state machine

```text
lobby --(host:start)--> playing --(all completed, more levels)--> playing
                           └--(all completed, final level)--> complete
```

加入只允许在 `lobby`；`start` 只接受房主；`state` 和 `complete` 只接受在 `playing` 阶段的房间成员。空房间删除，房主离开则迁移到剩余成员。

## Client/server responsibility

| 责任 | Client | Server |
| --- | --- | --- |
| 输入、物理、碰撞、得分、特效 | 主责 | 不处理 |
| 场景/木筏生成 | 用服务端种子确定性生成 | 生成并分发种子 |
| 身份与成员名单 | 展示 | 生成 ID、维护名单 |
| 关卡与排名 | 展示、上报完成 | 验证阶段、排序、推进 |
| 反作弊 | 不保证 | 仅基础字段限制 |