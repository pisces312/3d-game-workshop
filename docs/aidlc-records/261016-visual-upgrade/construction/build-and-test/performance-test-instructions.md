# Performance Test Instructions — 迭代 3

## 测量方式

在 URL 后加 `?debug` 读取帧率，分别测：

- 默认（桌面 Bloom 开启）
- `?bloom=off`
- 手机

## 已测数据

| 环境 | 结果 |
|---|---|
| 桌面开发机，Bloom on | 114 FPS · 8.7 ms |
| 手机视口模拟，Bloom off | 120 FPS（开发机数据，不代表真机） |
| 真机 | 未测 |

## 自动降级

1. Bloom：平均帧时间超过 20 ms 持续 2 s 后关闭。
2. DPR：平均帧时间超过 22 ms 持续 2 s 后，从 1.5 降到 1.0。

两级依次触发，先关 Bloom，再降分辨率。
