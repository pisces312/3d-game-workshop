# Code Generation Plan — Space Fold《空间折叠》

## Summary

- Builds: Three.js + Vite 3D 隧道小游戏（纯逻辑核心 + 渲染 + 统一输入 + UI/反馈），按 4 个 Bolt 交付
- Touches: 项目根 `package.json`、`vite.config.js`、`index.html`、`src/**`、`tests/**`、`README.md`、`aidlc/progress.md`
- Tests: 约 25 个 Vitest 单元测试（11 组 T1–T11，Node 环境），外加 `npm run build`

## 输入

- 需求：`aidlc/requirements.md`（= 记录目录 `inception/requirements-analysis/requirements.md`），FR1–FR18、NFR1–NFR6、AC1–AC13
- 设计：`aidlc/design.md`；单元与 Bolt：`aidlc/units.md`；意图：`aidlc/intent.md`
- express 流程为零 Unit 工作：一次实现迭代，内部按 Bolt 1→4 推进

## 实施步骤

### Bolt 1 — 最小可玩 3D 核心循环（FR1–FR5, FR7, NFR1, NFR3）

- [x] Step 1：项目骨架与生产配置——根目录 `package.json`（`dev`/`build`/`preview`/`test` 脚本，依赖 `three`，开发依赖 `vite`、`vitest`）、`vite.config.js`（`server.host` 可被 `--host` 覆盖，`base: './'`）、`index.html`、`src/styles/main.css`。（US1, US2）
- [x] Step 2：测试运行器——`vitest.config.js`（`environment: 'node'`，`include: ['tests/**/*.test.js']`），记录单元级命令。（NFR3）
- [x] Step 3：业务逻辑实现——`src/config.js`（全部常量）、`systems/CollisionSystem.js`（normalizeAngle / angleDiff / ballAngularHalfWidth / passesGap）、`core/GameState.js`（状态与转换表）、`core/FixedStepper.js`、`systems/SpawnSystem.js`（对象池，固定缺口）、`core/Game.js`（update/start/pause/resume/restart/reset/snapshot/事件）。（FR2–FR5, FR7, FR8, FR12）
- [x] Step 4：业务逻辑测试——`tests/collision.test.js`（T1–T3）、`tests/gameState.test.js`（T4、T5、T9），运行通过。（AC1–AC5, AC9）
- [x] Step 5：前端渲染实现——`core/Renderer.js`（可注入 WebGLRenderer、setAnimationLoop、对象池同步）、`core/Viewport.js`、`entities/Tunnel.js`、`entities/Player.js`、`entities/Obstacle.js`；`src/main.js` 组装主循环；键盘临时可玩。（FR1, US1）
- [x] Step 6：`npm run build` 通过；更新 `aidlc/progress.md` 记录 Bolt 1 通过/失败/未验证项。

### Bolt 2 — 完整机制与难度（FR6, FR8, FR14）

- [x] Step 7：`systems/DifficultySystem.js`（速度/缺口/间距/旋转/扭曲阶段，带上下限），SpawnSystem 接入难度与可达性约束 `maxShift`，旋转缺口障碍（只改 gapCenter，复用 passesGap）。（FR6, FR14, US5）
- [x] Step 8：难度与旋转测试——`tests/difficulty.test.js`（T10），补充重开完全重置断言（T5）。运行通过；更新 progress.md。（AC5, AC10）

### Bolt 3 — 统一输入与屏幕适配（FR9–FR12）

- [x] Step 9：`core/InputManager.js`（Pointer Events + pointerId + 相对位移 + 键盘 axis + 动作回调 + reset/cancel/blur 清理，可注入 target）；main.js 接入 resize 管线（ResizeObserver + resize + orientationchange + visualViewport，rAF 合并）与 visibilitychange/blur 自动暂停 + stepper.reset。（FR9–FR12, US2, US3, US6）
- [x] Step 10：适配测试——`tests/resize.test.js`（T6，stub WebGLRenderer）、`tests/input.test.js`（T7）、`tests/pause.test.js`（T8）。运行通过；更新 progress.md。（AC6–AC8）

### Bolt 4 — 反馈、UI、性能与测试（FR13, FR15–FR17, NFR1, NFR5）

- [x] Step 11：`ui/UIManager.js`（READY 教程 / HUD / PAUSED / GAME_OVER 覆盖层、暂停与静音按钮、闪屏）、`storage/BestScore.js`（localStorage + 内存降级）、`audio/Sfx.js`（WebAudio 合成）、尾迹与穿越粒子、扭曲阶段摄像机摆动与隧道变色、DPR 自动降级、`?debug` FPS 显示；CSS safe-area / dvh / 44px 触控。（FR13, FR15–FR17, NFR1, NFR5）
- [x] Step 12：存储降级测试——`tests/bestScore.test.js`（T11）；全量 `npm run test` 与 `npm run build` 通过。（AC11）
- [x] Step 13：环境与构建配置——`.gitignore` 补充 `node_modules/`、`dist/`；确认 `npm run dev -- --host 0.0.0.0` 启动。（NFR4）
- [x] Step 14：文档与追溯——`README.md`（运行、部署、操作、结构、已知问题）、`aidlc/progress.md` Bolt 4 记录。（NFR4）

## 故事 → 步骤追溯

| 故事 | 步骤 |
|---|---|
| US1 桌面游玩 | 1, 3, 5, 9, 11 |
| US2 手机游玩 | 1, 9, 11 |
| US3 转屏不丢进度 | 9, 10 |
| US4 失败后重开 | 3, 4, 8, 11 |
| US5 难度与惊喜 | 7, 8, 11 |
| US6 切后台暂停 | 3, 9, 10 |

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "express",
  "test_strategy": "minimal",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    }
  ],
  "obligations": {
    "strategy": "minimal",
    "strategy_volume": [
      "One verifiable test per requirement at the narrowest effective level.",
      "At least one happy-path unit test per component.",
      "Unit tests are the default; a bugfix/security scope floor may require an integration or E2E regression when that is the narrowest level that reproduces the defect."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:6cb23162168334768ff8f29699669845616670119c9eb58bf9bb05af6fefd3de",
  "contract_sha256": "sha256:283a836cf0757ed2efa4b5dd3135f3986eb59880b3017f4ba87a685cfebedfdb"
}
```

不适用的层：数据模型/数据库、仓储、API（纯前端无后端）；"Repository / data access" 对应 `BestScore` 本地存储，在 Step 11–12 实现并测试。
