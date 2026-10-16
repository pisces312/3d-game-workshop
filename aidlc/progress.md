# Progress — Space Fold《空间折叠》

| 时间 (UTC+8) | 阶段 | 事件 |
|---|---|---|
| 2026-10-16 13:46 | Initialization | 创建 express 流程记录 `261016-space-fold-game`，确认为全新项目 |
| 2026-10-16 14:05 | Inception | 完成 intent / requirements / design / units，等待需求审批 |
| 2026-10-16 14:08 | Inception | 需求获批（Approve） |
| 2026-10-16 14:12 | Construction | Bolt 1–4 代码与测试完成；开发者在 Step 13 中断，由技术负责人补完 |
| 2026-10-16 14:18 | Construction | 代码生成获批；浏览器实测修复空格键与尾迹两处问题 |
| 2026-10-16 14:20 | Construction | 构建与测试：build 成功，74/74 测试通过，依赖漏洞 0；构建测试获批 |
| 2026-10-16 14:30 | Operation | 部署流水线、部署执行、可观测性配置因无部署目标跳过；生产构建冒烟测试通过；交付 `aidlc/verification.md` |

## Bolt 1 — 最小可玩 3D 核心循环

**完成定义**：隧道、能量球、固定缺口障碍可见；键盘可移动；撞击 → GAME_OVER；空格重开；碰撞与状态测试通过；`npm run build` 通过。

**实现文件**：`package.json`、`vite.config.js`、`vitest.config.js`、`index.html`（Bolt 1 精简版）、`src/styles/main.css`（Bolt 1 精简版）、`src/config.js`、`src/systems/CollisionSystem.js`、`src/systems/DifficultySystem.js`、`src/systems/SpawnSystem.js`（仅固定缺口 + 可达性 maxShift）、`src/core/GameState.js`、`src/core/FixedStepper.js`、`src/core/Game.js`、`src/core/Viewport.js`、`src/core/Renderer.js`、`src/entities/Tunnel.js`、`src/entities/Player.js`、`src/entities/Obstacle.js`、`src/entities/Particles.js`、`src/main.js`（临时键盘版）、`tests/helpers.js`、`tests/collision.test.js`、`tests/gameState.test.js`。

**运行的检查及结果**：

- `npm install`：成功，新增 92 个包（`npm audit` 报告 6 个开发依赖漏洞，均来自 vite 5 / vitest 2 依赖链，仅影响开发服务器，不进入产物）。
- `npx vitest run tests/collision.test.js tests/gameState.test.js`：`Test Files 2 passed (2)`，`Tests 27 passed (27)`。
- `npm run build`：成功，`dist/assets/index-*.js 485.37 kB │ gzip: 123.55 kB`。
- Node 冒烟：注入 stub WebGLRenderer 渲染 600 帧无异常，无输入时第二道障碍撞击 → GAME_OVER（符合预期）。

**通过项**：T1 缺口中心通过；T2 边缘计入球角宽 α（含"只判中心会误判通过"的反例）；T3 跨 0/2π、负角、>2π；T4 一道障碍只计分一次（含单步 0.1 s 大步长不漏判）；T9 非法转换拒绝、READY/PAUSED 不推进世界；撞击 → GAME_OVER 后 update 停止；首道障碍缺口对准玩家初始位置。

**失败项**：无。

**未验证项**：浏览器中隧道/球/障碍的实际画面与键盘操作（AC12）——尚未在浏览器运行，待技术负责人实测。

**说明 / 偏差**：

- `DifficultySystem` 在 Bolt 1 即创建，因为 `Game.update` 与生成器依赖速度/缺口/间距公式；旋转障碍与难度测试仍在 Bolt 2 完成。
- `MAX_OBSTACLES` 由 12 调整为 16：生成区间 148 单位 ÷ 最小间距 11 ≈ 14 道同时存在，12 的池子在高难度会跳过生成。
- 粒子模块 `Particles.js` 随渲染层一起写入，Bolt 4 接入穿越事件。

## Bolt 2 — 完整机制与难度

**完成定义**：难度单调递增且有上下限；旋转障碍复用同一判定函数；每道障碍只计分一次；重开完全重置；T4、T5、T9、T10 通过。

**实现文件**：`src/systems/SpawnSystem.js`（旋转缺口 `_applyRotation`、`maxShiftFor`、`crossingSpeedFor`）、`src/systems/DifficultySystem.js`（`DIFFICULTY_LIMITS`）、`tests/difficulty.test.js`。

**运行的检查及结果**：

- `npx vitest run tests/difficulty.test.js tests/gameState.test.js`：`Test Files 2 passed (2)`，`Tests 26 passed (26)`。
- 三个逻辑测试文件合计：`Test Files 3 passed (3)`，`Tests 40 passed (40)`。
- 公平性诊断（临时脚本，未入库）：只用键盘的自动驾驶在 200 个随机种子下运行。修正前：中位数 23 分、最低 13 分，131 次死亡中 5 次是"物理上来不及"的布局；修正后：200 个种子全部达到 150 分上限，0 次不可达。

**通过项**：T10 难度 s=0..200 单调（速度不降、缺口与间距不增、旋转概率不降）且在上下限内；最小缺口 0.80 > 2α + 0.5；8 分以下不出现旋转障碍、15 分进入扭曲阶段；生成的 gapSize 等于量化值；相邻缺口偏移 ≤ maxShift；旋转障碍预旋转后在判定平面到达目标；旋转障碍"生成时对准、跨越时已转开"→ 判定失败，证明判定使用跨越时刻的 gapCenter；键盘自动驾驶达到 30 分并经历旋转障碍与扭曲阶段，暂停后 restart 完全重置（T5 补充）；对象池满时返回 null 而不额外分配。

**失败项**：无（中途发现并修复的问题见下）。

**未验证项**：旋转障碍与扭曲阶段的实际视觉效果——待浏览器实测。

**说明 / 偏差**：

- 发现问题：障碍在 SPAWN_Z 生成、约 7–12 道之后才到达玩家，期间得分上升使速度变快，按生成时速度计算的 `maxShift` 偏大，少数布局不可达。修正：新增 `crossingSpeedFor(z, difficulty, score)`，按"前方每道障碍都可能 +1 分"的悲观到达速度计算 `maxShift`；旋转障碍的预旋转时间用生成速度与到达速度的平均值。

## Bolt 3 — 统一输入与屏幕适配

**完成定义**：Pointer 拖动与键盘统一；cancel / blur 清空输入；resize 只改渲染；页面隐藏自动暂停且无时间跳跃；T6、T7、T8 通过。

**实现文件**：`src/core/InputManager.js`、`src/main.js`（resize 管线：ResizeObserver + resize + orientationchange + visualViewport，合并到一次 rAF；visibilitychange / pagehide 自动暂停 + `input.reset()` + `stepper.reset()`；window blur 清空输入；拖动增量只交给本帧第一个模拟步，本帧无模拟步时保留到下一帧）、`tests/resize.test.js`、`tests/input.test.js`、`tests/pause.test.js`。

**运行的检查及结果**：

- `npx vitest run tests/resize.test.js tests/input.test.js tests/pause.test.js`：`Test Files 3 passed (3)`，`Tests 19 passed (19)`。
- `npm run build`：成功，`dist/assets/index-*.js 490.50 kB │ gzip: 125.00 kB`。

**通过项**：T6 375×812 → 812×375 → 1280×720 期间游戏快照完全相等，相机 aspect 每次更新，像素比上限 1.5，竖屏垂直 fov > 横屏；各宽高比水平视角 ≥ 62°；0 尺寸 / NaN DPR 不产生 0 或 NaN aspect；障碍网格弧长 = 2π − gapSize、旋转 = gapCenter + gapSize/2（视觉缺口 = 判定缺口）；连续 2 s 慢帧后 DPR 只降一次到 1.0。T7 拖动按短边归一的相对增量；pointercancel / lostpointercapture 后输入归零且后续 move 无效；第二根手指被忽略；pointerup 保留已发生的增量；D 键按下后 blur 轴归零；鼠标右键忽略；空格自动重复只触发一次 primary；detach 移除监听。T8 60 帧后隐藏 10 s：恢复前第一帧 0 步、障碍不动；恢复后一帧推进 ≤ speed × 0.1；未 reset 的 5 s 间隔被夹到 0.1 s、≤ 12 步；非有限/倒退时间戳被忽略。

**失败项**：无。

**未验证项**：真实浏览器中的鼠标拖动、触屏滑动手感、真机/模拟器转屏、切后台自动暂停（AC13）——待浏览器与真机实测。

## Bolt 4 — 反馈、UI、性能与测试

**完成定义**：READY / PAUSED / GAME_OVER 覆盖层与教程；最高分降级；音效；粒子、尾迹、闪屏、空间扭曲；DPR 自动降级；全量测试与构建通过；浏览器实测有记录。

**实现文件**：`src/ui/UIManager.js`、`src/storage/BestScore.js`、`src/audio/Sfx.js`、`src/entities/Particles.js`、`src/entities/Player.js`（尾迹）、`src/core/Renderer.js`（扭曲、DPR 降级）、`index.html`、`src/styles/main.css`、`tests/bestScore.test.js`、`tests/ui.test.js`、`README.md`。

**过程说明**：开发者在完成 Step 11–12 的代码与测试后，因接口认证错误中断，未能勾选步骤，也没有写 README。由技术负责人接手，补完 Step 13–14 并完成浏览器实测。

**运行的检查及结果**：

- `npm run test`：`Test Files 8 passed (8)`，`Tests 74 passed (74)`。
- `npm run build`：成功，`dist/assets/index-*.js 497.86 kB │ gzip: 127.66 kB`。
- `npm run dev -- --host 0.0.0.0`：启动成功，在内置浏览器中打开 `http://localhost:5173`。

**浏览器实测中发现并修复的问题**：

1. 空格键无效，反而触发获得焦点的按钮：部分合成或输入法按键事件的 `e.code` 为空。修复为 `keyCodeOf()` 以 `e.key` 兜底，并新增测试（input.test.js 第 11 个用例）。
2. 尾迹在竖屏下堆成粗柱：尾迹点向摄像机方向排布（最远 z≈4.9），透视放大。修复为 z 步长 0.35 → 0.06、点尺寸 1.3r → 0.9r，尾迹只保留横向轨迹。

**通过项**（浏览器实测）：开始界面与教程渲染；空格开始；隧道、能量球、霓虹缺口障碍可见；穿越计分；撞击后闪屏 + 结算（最终得分、最高分）；PointerEvent 拖动 100 px → 0.74 rad，与按短边归一的公式一致；pointercancel 后移动无效；竖屏 375×812 ↔ 横屏 812×375 世界快照逐字节相同、相机 aspect 0.462 ↔ 2.165、竖屏 fov 104.9° / 横屏 70°；继续游戏后障碍从 −36.6 平滑推进到 −32.4，没有重置；`?debug` 显示 FPS 120 · 8.3 ms · DPR 1.50（桌面开发机）。

**失败项**：无未修复项。

**未验证项**：真实手机触屏手感、真机转屏、真机切后台暂停、中端手机帧率、音效听感、扭曲阶段的长时间游玩观感。

## 迭代 2 — AWS 主题

**完成定义**：AWS 配色替换首版霓虹色（FR19）；原创吉祥物 Bolt 小橙替换能量球且视觉宽度 = 碰撞宽度（FR20）；穿越弹出服务名（FR21）；每 5 分切换 Region 并在 HUD / 结算页显示（FR22）；开始页与结算页带 AI-DLC 标注（FR23）；不新增逐帧分配（NFR7）；首版 74 个测试保持通过、构建成功（AC19）。

**实现文件**：新增 `src/theme.js`、`src/entities/Mascot.js`、`tests/theme.test.js`；修改 `src/entities/Player.js`、`Obstacle.js`、`Tunnel.js`、`Particles.js`、`src/core/Renderer.js`、`src/main.js`、`src/ui/UIManager.js`、`index.html`、`src/styles/main.css`、`tests/ui.test.js`、`README.md`。玩法、碰撞、难度、输入、缩放与计时代码未改动。

**运行的检查及结果**：
- `npx vitest run tests/theme.test.js tests/ui.test.js`：2 个文件，22 个测试全部通过。
- `npm run test`：9 个测试文件，87 个测试全部通过（首版 74 + 新增 13：theme.test.js 10 个，ui.test.js 3 个）。
- `npm run build`：构建成功（仅有 Three.js 包体 >500 kB 的既有提示）。

**通过项**：T12 源码与 index.html 不再含 `ff2bd6` / `7ffcff`，主色 `0xFF9900`；T13 吉祥物身体半径 = BALL_RADIUS，所有非光晕装饰 |x| ≤ BALL_RADIUS（容差 1e-6，Float32 顶点精度）；T14 服务名轮换与非法输入兜底；T15 Region 边界 0/4/5/9/10、8 个后循环、非法输入、`regionChanged` 4→5 为真、5→6 与 6→4 为假；UI 服务弹出文本、HUD Region、结算 Region 与标注文案。

**失败项**：无。

**未验证项**：浏览器内的视觉检查（吉祥物外观与正立朝向、眨眼/天线动画、服务弹出动画、Region 提示与扭曲提示叠加观感、整体配色、手机横竖屏布局）——由技术负责人在浏览器中验证。

## 迭代 3 — 视觉升级

**完成定义**：隧道发光内壁与空间尘埃（FR24）；加厚立体障碍 + 同弧长高亮环，视觉缺口 = 判定缺口（FR25）；动态 FOV、速度线、穿越镜头冲击（FR26）；菜单态镜头环绕与放大的 Bolt 小橙、毛玻璃透视面板、3D 标题、呼吸按钮（FR27）；得分弹跳、PERFECT xN、服务名 3D 飞入（FR28）；撞击强震、碎片、色差闪屏与画面抖动（FR29）；按设备启用 Bloom、`?bloom=on|off`、慢帧自动关闭一次（FR30）；不新增逐帧分配（NFR8）；视觉不修改 Game 状态（NFR9）；原有 87 个测试保持通过、构建成功（AC26）。

**实现文件**：新增 `src/systems/VisualFx.js`、`src/core/PostFx.js`、`src/entities/SpeedLines.js`、`tests/visual.test.js`；修改 `src/core/Game.js`（仅在 `pass` 事件附带 `perfect` / `perfectStreak`，`reset()` 归零，快照多一个 `perfectStreak` 字段）、`src/core/Renderer.js`、`src/entities/Tunnel.js`、`Obstacle.js`、`Particles.js`、`src/main.js`、`src/ui/UIManager.js`、`index.html`、`src/styles/main.css`、`tests/ui.test.js`、`README.md`。碰撞、计分、难度、输入、计时与缩放语义未改动。

**运行的检查及结果**：
- `npx vitest run tests/visual.test.js tests/ui.test.js`：2 个文件，33 个测试全部通过（visual 18、ui 15）。
- `npm run test`：10 个测试文件，108 个测试全部通过（原有 87 + 新增 21：visual.test.js 18 个，ui.test.js 3 个）。
- `npm run build`：构建成功，`dist/assets/index-*.js 532.49 kB │ gzip: 137.30 kB`（仍只有 Three.js 包体 >500 kB 的既有提示）。

**通过项**：T16 主环与高亮环 `arc` = 2π − gapSize、`rotation.z` = gapCenter + gapSize/2（模 2π），主环管半径 0.42 ≤ 0.45 且 3 + 0.42 < 3.9，未用环全部隐藏；T17 Perfect 边界 ±gapSize/4、跨 0/2π 接缝（gapCenter 0.02, θ = 2π − 0.02）、非法输入、Game 中连击 1→2→非 Perfect 归零、重开归零，得分仍逐次 +1；T18 动态 FOV 单调、最多 +8°、不超过 MAX_VFOV、Renderer 在 resize 基准 FOV 上叠加并在冲击后回落；T19 Bloom 参数矩阵、Governor 只触发一次、短暂尖峰不触发、注入的 GL 渲染器从不构建 PostFx；T20 READY 环绕、PLAYING 冲击/震动/碎片、Bloom 自动关闭期间 `game.snapshot()` 完全不变；UI：PERFECT / PERFECT x3、得分弹跳 class 只在分数变化时重新触发、撞击抖动 class 300 ms 后移除。

**失败项**：无。

**未验证项**：浏览器内的全部视觉效果（内壁光带、尘埃、速度线、FOV 冲击、菜单环绕、毛玻璃/3D 标题/按钮动画、PERFECT 与色差闪屏观感）、Bloom 实际画面与 Shader 在真机 GPU 上的编译、桌面与手机帧率、竖屏 375×812 / 横屏 812×375 的 HUD 可读性——由技术负责人在浏览器中验证。
