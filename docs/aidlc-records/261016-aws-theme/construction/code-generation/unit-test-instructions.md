# Unit Test Instructions — 迭代 2：AWS 主题

## 框架与配置

沿用现有 Vitest 配置（`vitest.config.js`，`environment: 'node'`，`include: ['tests/**/*.test.js']`），无需新增依赖。

## 运行本次工作的测试

```bash
npx vitest run tests/theme.test.js tests/ui.test.js
```

回归（首版测试必须保持通过）：

```bash
npx vitest run tests/collision.test.js tests/gameState.test.js tests/difficulty.test.js tests/resize.test.js tests/input.test.js tests/pause.test.js tests/bestScore.test.js
```

## 测试清单

| 测试 | 文件 | 覆盖 |
|---|---|---|
| T12 源码不再含首版品红 `#ff2bd6` / 青色 `#7ffcff`，主色为 `#FF9900` | theme.test.js | FR19 / AC14 |
| T13 吉祥物身体半径 = BALL_RADIUS，装饰切向偏移 ≤ BALL_RADIUS | theme.test.js | FR20 / AC15 |
| T14 `serviceForScore` 确定性轮换、边界（0、负数、NaN） | theme.test.js | FR21 / AC16 |
| T15 `regionForScore` 边界与循环；`regionChanged` 只在跨越 5 的倍数时为真 | theme.test.js | FR22 / AC17 |
| UI：服务提示文本、HUD Region、结算 Region 与标注 | ui.test.js | FR21–FR23 / AC18 |

每个测试文件覆盖正常路径和至少两个边界情况。

## 覆盖率目标

express 流程没有行覆盖率下限。

## 模拟与桩

UI 测试沿用 ui.test.js 现有的 DOM 桩方式；Mascot 在 Node 中直接用 three 构建并读取几何包围盒。

## 测试数据

无外部数据。
