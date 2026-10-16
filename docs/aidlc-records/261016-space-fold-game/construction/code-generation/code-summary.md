# Code Summary — Space Fold《空间折叠》

## 创建的文件

- 配置与入口：`package.json`、`package-lock.json`、`vite.config.js`、`vitest.config.js`、`index.html`、`README.md`、`.gitignore`（追加 node_modules/、dist/）
- 逻辑（不依赖 three/DOM）：`src/config.js`、`src/core/Game.js`、`src/core/GameState.js`、`src/core/FixedStepper.js`、`src/systems/CollisionSystem.js`、`src/systems/SpawnSystem.js`、`src/systems/DifficultySystem.js`
- 渲染：`src/core/Renderer.js`、`src/core/Viewport.js`、`src/entities/Tunnel.js`、`src/entities/Player.js`、`src/entities/Obstacle.js`、`src/entities/Particles.js`
- 输入与外设：`src/core/InputManager.js`、`src/audio/Sfx.js`、`src/storage/BestScore.js`
- UI：`src/ui/UIManager.js`、`src/styles/main.css`
- 组装：`src/main.js`
- 测试：`tests/collision.test.js`、`tests/gameState.test.js`、`tests/difficulty.test.js`、`tests/resize.test.js`、`tests/input.test.js`、`tests/pause.test.js`、`tests/bestScore.test.js`、`tests/ui.test.js`、`tests/helpers.js`

## 关键实现决策

- 判定 `|angleDiff(θ, gapCenter)| + asin(r/R) ≤ gapSize/2`，gapSize 在生成时量化，几何体与判定共用同一个值。
- 基于"跨越判定平面"检测通过，配合固定步长 1/120 s 和单帧 0.1 s 上限，避免漏判与时间跳跃。
- 摄像机滚转跟随 θ，球始终在屏幕底部，操作方向不反转（ADR-1）。
- resize 只改 renderer 尺寸和相机 aspect/fov（ADR-2），世界常量不读视口。
- 生成链用悲观到达速度计算 `maxShift`，保证只用键盘也来得及对准（Bolt 2 中发现并修正）。

## 测试覆盖

8 个测试文件，74 个测试，全部通过。T1–T11 均有对应用例，另有 ui.test.js（覆盖层状态与重开保护）。

## 与计划的偏差

- 新增 `tests/ui.test.js` 与 `tests/helpers.js`（计划外，增强覆盖）。
- 浏览器实测后修复两处：按键 `e.key` 兜底（新增 1 个测试）；尾迹改为贴近球平面。
- 开发者在 Step 13 中断，Step 13–14 由技术负责人补完。
