# Build Instructions — Space Fold

## 依赖安装

```bash
npm install
```

Node.js 18+（已验证 Node 24.3.0 / npm 11.4.2）。运行时依赖只有 `three@^0.170.0`；开发依赖 `vite@^5.4`、`vitest@^2.1`。

## 环境

无环境变量、无密钥、无本地服务。

## 构建

```bash
npm run build
```

产物输出到 `dist/`（`index.html` + `assets/*.js|css`，相对路径 `base: './'`）。

## 构建验证

- 命令退出码 0，输出 `✓ built in …`。
- `npm run preview` 后用浏览器打开，开始界面能正常渲染。

## 开发与局域网访问

```bash
npm run dev -- --host 0.0.0.0
```

## 常见问题

- 手机打不开：确认与电脑在同一网段，并且防火墙放行 5173 端口。
- 显示"无法初始化 WebGL"：浏览器或设备不支持 WebGL，请换用较新的 Chrome / Safari / Edge。
