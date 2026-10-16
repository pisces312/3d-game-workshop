# Integration Test Instructions — 迭代 3

## 结论

测试策略为 Minimal，不另外生成集成测试套件。

## 已有的跨组件覆盖

`tests/visual.test.js` 通过 Renderer（注入 stub）+ Game 覆盖渲染与世界状态之间的边界。

## 运行

```bash
npx vitest run tests/visual.test.js tests/ui.test.js
```
