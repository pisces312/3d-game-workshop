# Performance Test Instructions — 迭代 2

## 结论

测试策略为 Minimal，不生成负载测试。

## 本次改动对性能的影响

- 吉祥物增加了少量网格（眼睛、瞳孔、天线）。
- 眨眼和脉动只修改 scale，不在每帧分配对象（NFR7）。
- 服务提示复用同一个 DOM 节点。

## 帧率测量

在 URL 后加 `?debug` 查看帧率。手机端帧率仍未测量。
