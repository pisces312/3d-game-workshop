# Build Instructions — 迭代 2：AWS 主题

## 依赖与环境

与首版相同，没有新增依赖，也没有环境变量。

## 构建

```bash
npm install
npm run build
```

## 构建验证

构建输出 `✓ built in …`，产物在 `dist/`。

## 开发与局域网访问

```bash
npm run dev -- --host 0.0.0.0
```
