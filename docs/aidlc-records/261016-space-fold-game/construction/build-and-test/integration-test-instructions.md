# Integration Test Instructions

## 结论

测试策略为 Minimal，不另外生成集成测试套件。

## 已有的跨组件覆盖

以下测试已经跨越多个组件：

- `tests/resize.test.js`：Game + Renderer（注入 stub WebGLRenderer）。
- `tests/difficulty.test.js`：Game + SpawnSystem + DifficultySystem，用键盘自动驾驶跑到扭曲阶段。
- `tests/pause.test.js`：Game + FixedStepper。

浏览器端到端检查为手动执行，记录在 `aidlc/verification.md`。

## 运行

```bash
npx vitest run tests/resize.test.js tests/difficulty.test.js tests/pause.test.js
```
