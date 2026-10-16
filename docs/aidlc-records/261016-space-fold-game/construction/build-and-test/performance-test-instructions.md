# Performance Test Instructions

## 结论

测试策略为 Minimal，不生成负载测试。纯前端游戏没有服务端负载。

## 帧率测量

在 URL 后加 `?debug`，右下角会显示 FPS、帧时间和 DPR。

| 目标 | 方式 | 结果 |
|---|---|---|
| 桌面帧率 | 内置浏览器 `?debug` | 实测 FPS 120 · 8.3 ms · DPR 1.50 |
| 中端手机 60 FPS | 真机 `?debug` | 未测量（NOT TESTED） |

## 代码层面的性能约束

以下约束由代码与测试保证：

- 固定步长 1/120 s；单帧 dt 上限 0.1 s；单帧最多 12 步（pause.test.js）。
- DPR 上限 1.5，持续 2 s 慢帧后降到 1.0（resize.test.js）。
- 对象池容量上限（difficulty.test.js）。
