# Unit Test Instructions — 迭代 3：视觉升级

## 框架与配置

沿用现有 Vitest 配置（`environment: 'node'`），不新增依赖。

## 运行本次工作的测试

```bash
npx vitest run tests/visual.test.js tests/ui.test.js
```

回归测试（必须保持通过）：

```bash
npx vitest run tests/collision.test.js tests/gameState.test.js tests/difficulty.test.js tests/resize.test.js tests/input.test.js tests/pause.test.js tests/bestScore.test.js tests/theme.test.js
```

## 测试清单

| 测试 | 文件 | 覆盖 |
|---|---|---|
| T16 障碍主环与高光环的弧长 = 2π − gapSize，旋转 = gapCenter + gapSize/2 | visual.test.js | FR25 / AC20 |
| T17 `isPerfect` 边界（含 0/2π 跨界）、连击累加与归零、重开归零 | visual.test.js | FR28 / AC21 |
| T18 `dynamicFov` 单调、上限 +8°、不超过 MAX_VFOV | visual.test.js | FR26 / AC22 |
| T19 `shouldEnableBloom` 参数与设备判断；`BloomGovernor` 慢帧只关闭一次 | visual.test.js | FR30 / AC23 |
| T20 菜单动画、FOV、震动、Bloom 开关期间 `game.snapshot()` 不变 | visual.test.js | NFR9 / AC24 |
| UI：Perfect xN 文本、得分弹跳 class | ui.test.js | FR28 |

每个测试文件覆盖正常路径和至少两个边界情况。

## 模拟与桩

Renderer 沿用注入 stub WebGLRenderer 的方式；在 Node 中关闭 Bloom（不创建 EffectComposer）。
