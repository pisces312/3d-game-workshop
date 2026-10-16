# Cross-Unit Traceability — 迭代 2

## 需求 → 实现 → 测试

| REQ | 实现 | 自动化测试 | 浏览器实测 |
|---|---|---|---|
| FR19 | src/theme.js、main.css、各实体 | T12 | 通过 |
| FR20 | src/entities/Mascot.js、Player.js | T13 | 通过 |
| FR21 | theme.serviceForScore、UIManager.servicePop | T14、ui.test | 通过 |
| FR22 | theme.regionForScore / regionChanged、main.js | T15、ui.test | 通过 |
| FR23 | index.html | ui.test | 通过 |
| NFR7 | Mascot（只改 scale）、复用的 #service-pop 节点 | 代码审查 | — |
