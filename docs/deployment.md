# 部署与运维

## 本地运行

```bash
npm start
# 或
PORT=8080 npm start
```

启动后服务监听 `PORT`（默认 `3000`），并同时提供网页和 `/ws` WebSocket 端点。项目没有构建步骤、运行时 npm 依赖、数据库或环境变量文件。

## 生产部署要求

1. 使用 Node.js 18 或更高版本，以进程管理器、容器或平台运行 `node server.js`。
2. 在反向代理中同时转发 HTTP 请求和 WebSocket Upgrade 请求。
3. 对外使用 HTTPS；客户端会在 HTTPS 页面下自动连接 `wss://<host>/ws`。
4. 放行浏览器访问 `https://cdnjs.cloudflare.com`，或将 Three.js 固定版本下载到本地并修改 HTML 引用。

以下为 Nginx 的最小示例（将端口替换为实际 `PORT`）：

```nginx
server {
  listen 443 ssl;
  server_name game.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
  }
}
```

## 部署限制

房间状态仅存在于当前 Node.js 进程内。因此：

- 进程重启、重新部署或崩溃会终止全部房间；应安排维护窗口并告知玩家。
- 负载均衡到多个实例会让玩家进入相互隔离的房间；当前版本只能运行单实例，除非添加共享状态和粘性会话。
- 服务没有 `/health` 端点；可通过请求 `/` 和执行 WebSocket 握手做外部可用性探测。

## 上线前检查

- 验证 `GET /` 返回游戏页面。
- 验证 `wss://<host>/ws` 可建立连接。
- 用两个浏览器会话创建、加入、开始并完成一局。
- 验证 HTTPS 页面未出现 mixed-content 或 CDN/CSP 错误。
- 验证反向代理允许连接长时间保持。

安全边界和后续加固建议见 [SECURITY.md](../SECURITY.md)。
