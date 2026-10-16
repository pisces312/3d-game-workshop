# CI Pipeline Plan

## Current state

仓库当前没有 CI 配置、锁文件、自动化测试或 lint 脚本。对 MVP 的最小质量门禁应为：

```bash
node --check server.js
git diff --check
```

## Proposed pipeline (not implemented)

1. 在 Node.js 18 和当前 LTS 版本执行服务端语法检查。
2. 检查 Markdown/JSON 格式与相对链接。
3. 以随机空闲端口启动服务器，验证 `/` 返回 200。
4. 以 WebSocket 客户端验证创建、加入、房主限制、状态转发和关卡推进。
5. 对 `sheep-river-3d_4.html` 做浏览器 smoke test，覆盖 WebGL 初始化与基本输入。

## Gate policy

任何协议、关卡数量或人数限制改动必须同时更新客户端、服务端、架构文档和此意图的需求追溯；验证至少覆盖双会话联机场景。