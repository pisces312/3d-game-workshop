# Code Generation Plan — 迭代 2：AWS 主题

## Summary

- Builds: AWS 配色、原创橙色吉祥物"Bolt 小橙"、穿越服务名提示、Region 关卡、AI-DLC 标注
- Touches: 新增 `src/theme.js`、`src/entities/Mascot.js`、`tests/theme.test.js`；修改 Player/Obstacle/Tunnel/Particles/Renderer、main.js、UIManager、index.html、main.css、README
- Tests: 新增约 12 个 Vitest 单元测试（T12–T15），首版 74 个测试保持通过

## 输入

- 需求：`aidlc/spaces/default/intents/261016-aws-theme/inception/requirements-analysis/requirements.md`（FR19–FR23、NFR7、AC14–AC19）
- 已有代码：首个流程 `261016-space-fold-game` 产出的 `src/`，设计见 `aidlc/design.md`

## 实施步骤

- [x] Step 1：确认现有 Vitest 配置可运行，记录范围命令。（AC19）
- [x] Step 2：业务逻辑——新增 `src/theme.js`：`PALETTE`（含 `orange: 0xFF9900`、`ink: 0x232F3E`、深色背景、亮蓝辅色、白色）、`CSS_PALETTE`、`SERVICES` 列表、`serviceForScore(s)`、`REGIONS` 列表、`REGION_EVERY = 5`、`regionForScore(s)`、`regionChanged(prevScore, score)`。（FR19, FR21, FR22）
- [x] Step 3：业务逻辑测试——`tests/theme.test.js`：T14 服务名确定性轮换、T15 Region 边界与循环及切换检测、T12 源码扫描不再含首版品红/青色。（AC14, AC16, AC17）
- [x] Step 4：前端渲染——新增 `src/entities/Mascot.js`（橙色身体半径 = BALL_RADIUS、白眼睛、朝轴心的天线与发光头、随相机滚转正立），Player 改用 Mascot 并把尾迹改为橙色；Obstacle（固定 = 橙色，旋转 = 亮蓝）、Tunnel（深墨蓝/蓝灰线条，扭曲阶段转橙）、Particles、Renderer 背景与雾均取自 `PALETTE`。（FR19, FR20）
- [x] Step 5：前端渲染测试——`tests/theme.test.js` 追加 T13：Mascot 身体半径 = BALL_RADIUS，装饰切向最大偏移 ≤ BALL_RADIUS。（AC15）
- [x] Step 6：前端 UI——index.html 与 UIManager：开始页副标题 "AWS Edition · Built with AI-DLC" 与吉祥物介绍；HUD 显示当前 Region；穿越弹出 `+1 <服务名>`（复用固定 DOM 节点）；进入新 Region 时提示；结算页显示到达的 Region 与 "Built with AI-DLC · 可部署到 Amazon S3 + CloudFront"；main.css 变量改为 AWS 调色板。main.js 接入。（FR21, FR22, FR23, NFR7）
- [x] Step 7：UI 测试——更新/新增 `tests/ui.test.js` 用例：服务提示文本、Region 显示、结算 Region 与标注。运行全量测试。（AC16–AC18）
- [x] Step 8：构建——`npm run build` 通过。（AC19）
- [x] Step 9：文档与追溯——README 增加 AWS 主题说明；`aidlc/progress.md` 追加"迭代 2"记录。

## 故事 → 步骤追溯

| 需求 | 步骤 |
|---|---|
| FR19 配色 | 2, 3, 4, 6 |
| FR20 吉祥物 | 4, 5 |
| FR21 服务提示 | 2, 3, 6, 7 |
| FR22 Region | 2, 3, 6, 7 |
| FR23 标注 | 6, 7 |

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
