# Build and Test Record

## Build model

项目没有编译或打包步骤：浏览器直接加载 HTML，Node 直接执行 `server.js`。因此最小构建验证是：

```bash
node --check server.js
npm start
```

## Recorded checks

| Check | Command / method | Result |
| --- | --- | --- |
| 服务端语法 | `node --check server.js` | Passed |
| 文档空白 | `git diff --check` | Passed |
| HTTP 冒烟 | `PORT=8080 npm start` 后请求 `http://localhost:8080/` | Passed |
| 默认端口 | `npm start` | Blocked locally：端口 3000 被已有本机进程占用 |
| 双浏览器房间验收 | 两个隔离浏览器会话 | Pending manual execution |

端口被占用属于本机环境冲突，不是已验证的代码缺陷；使用 `PORT` 覆盖端口可正常启动。