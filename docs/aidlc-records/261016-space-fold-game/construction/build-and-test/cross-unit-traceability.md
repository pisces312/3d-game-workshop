# Cross-Unit Traceability — Space Fold

express 流程为零 Unit 工作；下表是需求 → 实现 → 测试的完整对应关系。

| REQ | 实现 | 自动化测试 | 浏览器实测 |
|---|---|---|---|
| FR1 | Renderer、entities/* | resize.test（网格弧与缺口一致） | 通过 |
| FR2 | Game.playerPosition | gameState.test | 通过 |
| FR3 | SpawnSystem | difficulty.test | 通过 |
| FR4 | CollisionSystem | collision.test（T1–T3） | 撞击画面一致 |
| FR5 | Game | gameState.test（T4） | 通过 |
| FR6 | DifficultySystem | difficulty.test（T10） | 未长时间游玩 |
| FR7 | GameState | gameState.test（T9） | 通过 |
| FR8 | Game.restart | gameState.test（T5） | 通过 |
| FR9 | InputManager | input.test（T7） | 空格通过 |
| FR10 | InputManager | input.test（T7） | PointerEvent 通过 |
| FR11 | Renderer.resize、main.js | resize.test（T6） | 通过 |
| FR12 | FixedStepper、main.js | pause.test（T8） | 通过 |
| FR13 | BestScore | bestScore.test（T11） | 显示通过 |
| FR14 | SpawnSystem | difficulty.test | 未目视 |
| FR15 | Particles、Player、Renderer | resize.test（DPR 降级） | 尾迹修复后通过 |
| FR16 | Sfx | ui.test | 未听测 |
| FR17 | UIManager | ui.test | 通过 |
| FR18 | — | — | 延后（P2） |
