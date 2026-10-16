# Code Generation Plan — 迭代 3：视觉升级

## Summary

- Builds: 立体隧道与障碍、速度感、3D 菜单、HUD 动效、撞击反馈、按设备开启的 Bloom
- Touches: 新增 `src/systems/VisualFx.js`（纯函数）、`src/core/PostFx.js`、`src/entities/SpeedLines.js`、`tests/visual.test.js`；修改 Tunnel/Obstacle/Particles/Player/Renderer、main.js、UIManager、index.html、main.css
- Tests: 新增约 15 个 Vitest 单元测试（T16–T20），现有 87 个保持通过

## 输入

- 需求：`aidlc/spaces/default/intents/261016-visual-upgrade/inception/requirements-analysis/requirements.md`（FR24–FR30、NFR8–NFR9、AC20–AC26）
- 已有代码：`src/`；设计见 `aidlc/design.md`

## 实施步骤

- [x] Step 1：确认现有 Vitest 配置，记录范围命令。（AC26）
- [x] Step 2：业务逻辑——新增 `src/systems/VisualFx.js`（纯函数）：`isPerfect`、`nextPerfectStreak`、`dynamicFov`、`shouldEnableBloom`、`BloomGovernor`（慢帧自动关闭一次）。Game 在 `pass` 事件中附带 `perfect` 标志与 `perfectStreak`，重开时归零；不修改碰撞与计分规则。（FR26, FR28, FR30）
- [x] Step 3：业务逻辑测试——`tests/visual.test.js`：T17 Perfect 判定与连击、T18 动态 FOV、T19 Bloom 决策。（AC21–AC23）
- [x] Step 4：前端渲染——Tunnel 发光内壁 shader（流动光带、扭曲变色）；Obstacle 加厚主环 + 同弧长高光环；`SpeedLines.js`（池化 ≤ 120 段）与空间尘埃；Renderer 动态 FOV、穿越镜头冲击、撞击强震；菜单态镜头环绕与 Bolt 小橙展示（只读世界状态）；Particles 撞击碎裂爆发；`PostFx.js` 封装 EffectComposer + UnrealBloomPass，按决策启用并支持自动关闭。（FR24–FR27, FR29, FR30, NFR8, NFR9）
- [x] Step 5：前端渲染测试——T16 障碍主环与高光环弧长和旋转；T20 菜单动画、FOV、震动、Bloom 开关期间 `game.snapshot()` 不变（stub 渲染器）。（AC20, AC24）
- [x] Step 6：前端 UI——index.html / UIManager / main.css：毛玻璃透视面板、3D 立体标题、呼吸辉光按钮、得分弹跳、Perfect xN 提示、服务提示飞入、色差闪屏；main.js 接入。（FR27–FR29）
- [x] Step 7：UI 测试——更新 `tests/ui.test.js`：Perfect 提示与连击文本、得分弹跳 class；运行全量测试。（AC21, AC26）
- [x] Step 8：构建——`npm run build` 通过。（AC26）
- [x] Step 9：文档与追溯——README 增加视觉说明与 `?bloom=` 参数；`aidlc/progress.md` 追加"迭代 3"记录。

## 需求 → 步骤追溯

| 需求 | 步骤 |
|---|---|
| FR24 隧道内壁 | 4 |
| FR25 立体障碍 | 4, 5 |
| FR26 速度感 | 2, 3, 4 |
| FR27 3D 菜单 | 4, 6 |
| FR28 HUD 动效 | 2, 3, 6, 7 |
| FR29 撞击反馈 | 4, 6 |
| FR30 Bloom | 2, 3, 4 |

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "express",
  "test_strategy": "minimal",
  "project_type": "brownfield",
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
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
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
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
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
  "input_sha256": "sha256:c8f84e35190e007d9863fad236154d0269ab9bf633fc2a3ff106ed965ba4a9b9",
  "contract_sha256": "sha256:bb76c1b22f8307be6e5780d50cabab891684449d5b164bd0e825e9e4e5c61e5b"
}
```

不适用的层：数据模型/数据库、仓储、API（纯前端无后端）。
