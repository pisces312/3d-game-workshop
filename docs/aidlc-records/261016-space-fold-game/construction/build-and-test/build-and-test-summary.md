# Build and Test Summary — Space Fold

## 总体状态

- **构建**：成功。
- **测试**：74 / 74 通过。
- **审计**：0 漏洞。
- **准备度**：可构建、可测试、可部署（静态产物）。

## 测试类型清单

- 单元测试：8 个文件（T1–T11 + UI/音效）。
- 跨组件测试：resize、difficulty、pause 三个文件。
- 浏览器手动端到端检查。

测试策略为 Minimal，没有另外生成集成、性能或安全测试套件；说明文件中写明了原因和现有覆盖。

## Target Verification Matrix

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
|---|---|---|---|---|---|---|
| TC-STRATEGY-1 | code-generation-plan.md § Testing Contract / strategy_volume | 每条需求至少一个可验证测试 | FR1–FR17、NFR1/3/5 均有测试或实测；FR18 按计划延后（P2） | cross-unit-traceability.md | build-and-test | Met |
| TC-STRATEGY-2 | 同上 | 每个组件至少一个正常路径单元测试 | 逻辑、渲染、输入、UI、音效、存储均有 | test-results.md | build-and-test | Met |
| TC-SCOPE-1 | 同上 / scope_floor | 已有测试保持通过 | 74/74 通过 | `npm run test` | build-and-test | Met |
| BUILD-1 | requirements.md NFR4 | `npm run build` 成功 | 成功 | test-results.md | build-and-test | Met |
| NFR1-STEP | requirements.md NFR1 | 固定步长 1/120 s，单帧 ≤ 0.1 s / ≤ 12 步 | 一致 | pause.test.js | build-and-test | Met |
| NFR1-DPR | requirements.md NFR1 | DPR ≤ 1.5，慢帧后降到 1.0 | 一致；实测 DPR 1.50 | resize.test.js、?debug | build-and-test | Met |

真机帧率不是可度量的验收目标（NFR1 只要求"只报告实测值"），在 verification.md 中标为 NOT TESTED。

## 已知限制

- 真实手机未测试。
- 浏览器面板在后台时 rAF 被节流，自动化截图偶尔显示旧画面；DOM 状态已核实正确。
