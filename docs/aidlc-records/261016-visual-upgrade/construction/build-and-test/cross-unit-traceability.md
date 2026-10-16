# Cross-Unit Traceability — 迭代 3

## 需求 → 实现 → 测试

| REQ | 实现 | 自动化测试 | 浏览器实测 |
|---|---|---|---|
| FR24 | Tunnel.js 内壁 shader | T20（渲染不改状态） | 通过 |
| FR25 | Obstacle.js 主环 + 高光环 | T16 | 通过 |
| FR26 | SpeedLines.js、Renderer 动态 FOV | T18 | 通过 |
| FR27 | Renderer 菜单展示、CSS 面板 | T20 | 通过（竖屏/横屏） |
| FR28 | VisualFx.isPerfect、UIManager.perfect | T17、ui.test | — |
| FR29 | Particles.shatter、闪屏 | visual.test（碎片池） | — |
| FR30 | PostFx、BloomGovernor | T19、T20 | 桌面开启 / 触屏关闭 |
| FR20（修订） | Mascot.js 幽灵巫师 Boo | T13 | 通过 |
| NFR8 / NFR9 | 池化、只读世界 | visual.test | — |
