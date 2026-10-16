# Construction — Code Summary

## Implemented runtime

- `server.js` 用 Node 内置模块提供 HTTP 页面与手写 WebSocket 服务器。它维护 `rooms` 内存映射，生成房间码和关卡种子，限制人数/名字/状态字段，并处理 `create`、`join`、`start`、`state`、`complete`。
- `sheep-river-3d_4.html` 包含 HTML、CSS 和 JavaScript。它加载 Three.js r128，定义游戏配置，创建确定性关卡，处理本地移动/碰撞/分数，维护 WebSocket 客户端并渲染远端小羊。
- `package.json` 声明 Node.js `>=18`，并通过 `npm start` 运行 `node server.js`。

## Requirement traceability

| Requirement | Implementation evidence |
| --- | --- |
| FR-01 / FR-02 | `connectRoom`、`showLobby` 与服务端 `join`。 |
| FR-03 | `showRoomLobby`、服务端 `start` 检查与 `removePlayer`。 |
| FR-04 | `seed`、`levelSeed`、`buildLevel(seed)` 与房间同步。 |
| FR-05 | `sendLocalState`、`playerState`、`updateRemoteSheep`。 |
| FR-06 / FR-08 | `CONFIG`、游戏循环、键盘/指针监听器和 HUD。 |
| FR-07 | `completeRoomLevel`、服务端 `finishOrder`、阶段推进。 |
| FR-09 | `http.createServer` 和 `server.on('upgrade')`。 |

## Known construction debt

自动化测试、CI、服务端权威移动验证、持久化与水平扩容均未实现，详见 `construction/ci-pipeline/ci-pipeline.md` 与根目录 `SECURITY.md`。