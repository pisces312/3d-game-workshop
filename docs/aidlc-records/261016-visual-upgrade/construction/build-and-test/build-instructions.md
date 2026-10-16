# Build Instructions — 迭代 3

## 依赖与环境

与此前相同，没有新增依赖；Bloom 使用 three 自带的 postprocessing 模块。

## 构建与预览

```bash
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

## 运行时参数

- `?bloom=on` / `?bloom=off`：强制开启或关闭 Bloom。
- `?debug`：显示帧率、帧时间、DPR 和 Bloom 状态。
