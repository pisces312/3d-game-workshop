# Implementation Units

| Unit | Source | Covers | Notes |
| --- | --- | --- | --- |
| U-01 HTTP page server | `server.js` | FR-09 | 只服务 `/` 与游戏 HTML。 |
| U-02 WebSocket transport | `server.js` | FR-01, FR-02, FR-05 | 执行握手、帧解码和 JSON 文本收发。 |
| U-03 Room coordinator | `server.js` | FR-01–FR-04, FR-07 | 内存房间、成员、房主、种子、排名和阶段。 |
| U-04 Lobby and room UI | `sheep-river-3d_4.html` | FR-01–FR-03 | 处理创建/加入、房间码和成员列表。 |
| U-05 Multiplayer client | `sheep-river-3d_4.html` | FR-04, FR-05, FR-07 | 处理 WebSocket、同步、远端小羊和等待状态。 |
| U-06 3D game engine | `sheep-river-3d_4.html` | FR-06 | 构造河道、木筏、碰撞、生命、计分和关卡循环。 |
| U-07 Input/HUD/audio | `sheep-river-3d_4.html` | FR-06, FR-08 | 键鼠触控输入、HUD 与合成音效。 |
| U-08 Delivery docs | `README.md`, `docs/`, `aidlc/` | NFR-01–NFR-04 | 运行、部署、安全与生命周期可追溯。 |