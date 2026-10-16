# Integration Test Instructions — 迭代 2

## 结论

测试策略为 Minimal，不另外生成集成测试套件。

## 已有覆盖

- `tests/ui.test.js` 覆盖 UIManager 与 index.html 的新元素。
- 浏览器实测覆盖 main.js 中 Game 事件 → 服务提示 / Region / 结算这条链路。

## 运行

```bash
npx vitest run tests/theme.test.js tests/ui.test.js
```
