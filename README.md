# 小羊过河（多人合作版）

一个无需构建工具的 3D 浏览器小游戏：玩家控制小羊借助漂浮木筏穿过河流，并通过房间码与最多 7 名伙伴协作完成全部关卡。

## 功能

- Three.js 渲染的 3D 河流、木筏、昼夜氛围与程序化场景
- 三个难度递增的关卡、生命值、倒计时与计分
- 键盘、触屏手势和屏幕方向键控制
- 基于原生 WebSocket 的实时房间协作（最多 8 人）
- 无 npm 运行时依赖；仅需 Node.js 和现代浏览器

## 快速开始

**前置条件：**Node.js 18 或更高版本，以及支持 WebGL 的现代浏览器。

```bash
npm start
```

打开 [http://localhost:3000](http://localhost:3000)。如需指定端口：

```bash
PORT=8080 npm start
```

> 不要直接双击打开 `sheep-river-3d_4.html`。多人房间需要由 `server.js` 提供 HTTP 和 WebSocket 服务。

## 如何游玩

1. 输入名字，选择“创建房间”或填写房间码后“加入房间”。
2. 房主将房间码发送给伙伴，并点击“开始过河”。
3. 所有玩家完成当前关卡后，房间自动进入下一关；完成第 3 关即获胜。

| 操作 | 桌面端 | 移动端 |
| --- | --- | --- |
| 转向 | `W/A/S/D` 或方向键 | 在画面上向对应方向滑动，或点方向键 |
| 跳跃 | `Space` | 轻点画面或“跳跃”按钮 |
| 重开/退出房间 | 右上角重开按钮 | 右上角重开按钮 |

## 配置

服务器通过 `PORT` 环境变量监听端口，默认 `3000`。游戏配置位于 `sheep-river-3d_4.html` 顶部的 `CONFIG`：

- `lives`：初始生命数；`riverWidth`：可活动河面宽度。
- `jumpTime`、`inputCooldown`、`landTolerance`：跳跃与落点手感。
- `scorePerRow`、`levelBonus`、`timeBonusPerSec`：计分规则。
- `levels`：关卡数量、河道数、木筏速度/长度/间隔、限时、光照时段和安全沙洲。
- `atmosphere`：晨雾、正午、黄昏的光照和水面配色。

若新增或删除关卡，必须同时调整 `server.js` 中关卡结束条件（当前为 `room.levelIdx >= 2`），使其与 `CONFIG.levels` 长度一致。房间容量（8）与名字上限（16）也分别在客户端 `MULTIPLAYER` 和服务端常量中定义，应保持同步。

## 文档

- [架构与 WebSocket 协议](docs/architecture.md)
- [部署与运维](docs/deployment.md)
- [贡献与手工验证](CONTRIBUTING.md)
- [安全说明](SECURITY.md)
- [AI-DLC / Kiro IDE 工作流](docs/ai-dlc-workflow.md)

## 项目结构

```text
server.js                 Node.js HTTP/WebSocket 房间服务
sheep-river-3d_4.html     页面、样式、Three.js 场景和客户端逻辑
package.json              启动脚本与 Node.js 版本要求
docs/                     项目与交付文档
```

## 许可

项目包含 [Apache License 2.0](LICENSE)。发布前请确认许可证附录中的版权归属信息已替换为实际主体。Three.js 由浏览器从 cdnjs 按 `r128` 加载；生产环境应评估 CDN 可用性和第三方许可证要求。
