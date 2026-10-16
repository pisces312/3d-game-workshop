# Unit Test Instructions — Space Fold《空间折叠》

## 框架与配置

- 运行器：Vitest（开发依赖），配置文件 `vitest.config.js`：`environment: 'node'`，`include: ['tests/**/*.test.js']`。
- 被测模块均为纯 ES Module，不依赖 DOM/WebGL；`Renderer` 通过注入 stub WebGLRenderer 测试 resize；`InputManager` 通过 Node 原生 `EventTarget` 派发合成事件测试。

## 运行本次工作的测试（按文件精确指定）

```bash
npx vitest run tests/collision.test.js tests/gameState.test.js tests/difficulty.test.js tests/resize.test.js tests/input.test.js tests/pause.test.js tests/bestScore.test.js
```

单个分组：

```bash
npx vitest run tests/collision.test.js
```

## 测试清单（Minimal 策略：每条需求至少一个可验证测试）

| 测试 | 文件 | 覆盖 |
|---|---|---|
| T1 缺口中心通过 | collision.test.js | FR4 / AC1 |
| T2 边缘按球半径角宽判定（含仅判中心会误判的反例） | collision.test.js | FR4 / AC2 |
| T3 跨 0/2π、负角、>2π | collision.test.js | FR4 / AC3 |
| T4 同一障碍只计分一次 | gameState.test.js | FR5 / AC4 |
| T5 失败后重开完全重置 | gameState.test.js | FR8 / AC5 |
| T6 Resize 不修改世界状态 | resize.test.js | FR11 / AC6 |
| T7 输入取消无残留 | input.test.js | FR10, FR12 / AC7 |
| T8 暂停恢复无大幅逻辑跳跃 | pause.test.js | FR12, NFR1 / AC8 |
| T9 非法状态转换被拒绝 | gameState.test.js | FR7 / AC9 |
| T10 难度单调有界、旋转障碍同判定 | difficulty.test.js | FR6, FR14 / AC10 |
| T11 localStorage 异常降级 | bestScore.test.js | FR13 / AC11 |

每个测试文件覆盖正常路径和至少两个边界或错误情况。

## 覆盖率目标

express 流程没有行覆盖率下限；以上 T1–T11 必须全部通过。

## 模拟与桩

- 随机数：`Game` 接受注入的 `rng`（测试用固定序列/种子），保证障碍可复现。
- 存储：`BestScore` 接受注入的 storage；测试用抛异常的对象模拟隐私模式。
- WebGL：`Renderer` 接受 `{ glRenderer }` 注入，stub 只实现 `setPixelRatio`、`setSize`、`render`、`setAnimationLoop`、`domElement`。

## 测试数据

不需要外部数据；障碍通过 `game.obstacles` 直接构造或由固定种子生成。
