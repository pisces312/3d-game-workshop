# Test Results — Space Fold

执行时间：2026-10-16 14:20（UTC+8）

## 构建

`npm run build` → 成功，`dist/assets/index-BmkYRNZB.js 497.86 kB │ gzip: 127.66 kB`，`✓ built in 433ms`。

## 单元测试

- 计划中的范围命令 `npx vitest run tests/collision.test.js … tests/bestScore.test.js`：`Test Files 7 passed (7)`，`Tests 65 passed (65)`。
- 全量 `npm run test`（另含 ui.test.js）：`Test Files 8 passed (8)`，`Tests 74 passed (74)`，失败 0，跳过 0。
- 覆盖率：express 流程不设下限，未收集。

## 依赖审计

`npm audit --omit=dev` → found 0 vulnerabilities。

## 浏览器实测（内置浏览器，Chromium 内核，http://localhost:5173）

| 检查 | 结果 |
|---|---|
| 开始界面、教程渲染，无控制台错误 | 通过 |
| 空格开始（修复 `e.key` 兜底后） | 通过 |
| 撞击 → 闪屏 → 结算面板 | 通过 |
| PointerEvent 拖动 100 px → 0.737 rad；pointercancel 后移动无效 | 通过 |
| 375×812 → 812×375：世界快照相同，aspect 0.462 → 2.165，fov 104.9° → 70° | 通过 |
| 恢复后障碍 −36.6 → −32.4（0.3 s），无跳变 | 通过 |
| 模拟 visibilitychange hidden：立即暂停，2 s 内不动；恢复后 0.1 s 推进 1.4 | 通过 |
| 点击"再来一局"：PLAYING，0 分，θ=4.712，无已判定障碍，距离 0 | 通过 |
| `?debug`：FPS 120 · 8.3 ms · DPR 1.50 | 已记录 |

## 失败详情

无失败项。
