# Requirements Analysis

## Functional requirements

| ID | Requirement | Priority | Story | Design / implementation | Verification |
| --- | --- | --- | --- | --- | --- |
| FR-01 | 玩家可输入昵称并创建房间，获得可分享的房间码。 | Must | US-01 | 房间模型；`create` | V-01 |
| FR-02 | 玩家可使用房间码加入尚未开始且未满员的房间。 | Must | US-02 | 加入校验；`join` | V-02 |
| FR-03 | 仅房主可开始游戏；房主离开后须转移房主身份。 | Must | US-03 | 房间生命周期；`start`/disconnect | V-03 |
| FR-04 | 同一房间成员须使用相同种子生成关卡并同步当前关卡。 | Must | US-04 | `levelSeed`、`levelIdx` | V-04 |
| FR-05 | 玩家移动、朝向、跳跃与可见性应实时广播给其他成员。 | Must | US-05 | `state` / `playerState` | V-05 |
| FR-06 | 游戏应提供三个可配置的过河关卡、生命、限时和得分。 | Must | US-06 | `CONFIG`、本地游戏循环 | V-06 |
| FR-07 | 玩家完成关卡时应记录名次，待全部成员完成后推进或结束。 | Must | US-07 | `complete`、`finishOrder` | V-07 |
| FR-08 | 游戏应支持键盘、屏幕按钮和触屏手势。 | Should | US-08 | 输入控制器 | V-08 |
| FR-09 | 服务必须在 `PORT`（默认 3000）暴露页面与 WebSocket 服务。 | Must | US-09 | HTTP 路由与升级 | V-09 |

## Non-functional requirements

| ID | Requirement |
| --- | --- |
| NFR-01 | 服务在 Node.js 18+ 上无需安装运行时 npm 依赖即可启动。 |
| NFR-02 | 每房间最多 8 人；名字最多 16 字符；非法客户端状态须做基础约束。 |
| NFR-03 | 客户端每 75 ms 至多上报一次状态，远端显示须平滑。 |
| NFR-04 | 游戏应在现代、启用 WebGL 的桌面与移动浏览器上可用。 |

## Acceptance conditions

FR-01 至 FR-09 的 V-01 至 V-09 全部通过，且人工完成双会话的联机验收后，方可将 Verification 状态改为 complete。