# Verification — Space Fold《空间折叠》交付验收报告

> 规则：只有实际运行过的检查才标 PASS。"浏览器实测"指 Claude 桌面应用的内置浏览器（Chromium 内核），通过 `npm run dev -- --host 0.0.0.0` 访问 `http://localhost:5173`。
> 移动端结论来自该浏览器的移动视口模拟（375×812 / 812×375），**不是真机**。
> 验证日期：2026-10-16

## 1. 命令检查

| 检查 | 结果 | 实际输出 |
|---|---|---|
| `npm install` | PASS | 安装成功 |
| `npm run test` | PASS | `Test Files 8 passed (8)` · `Tests 74 passed (74)` |
| `npm run build` | PASS | `dist/assets/index-*.js 497.86 kB │ gzip: 127.66 kB` · `✓ built` |
| `npm run dev -- --host 0.0.0.0` | PASS | 服务器在 5173 端口启动，浏览器可访问 |
| `npm audit --omit=dev` | PASS | `found 0 vulnerabilities` |

## 2. 必测自动化用例（提示第十一节）

| # | 用例 | 结果 | 测试方式 |
|---|---|---|---|
| 1 | 球位于缺口中心正常通过 | PASS | collision.test.js · T1 |
| 2 | 缺口边缘按球半径角宽 `asin(r/R)` 判定（含"只判中心会误判通过"的反例） | PASS | collision.test.js · T2 |
| 3 | 跨 0/2π、负角、>2π 判断正确 | PASS | collision.test.js · T3 |
| 4 | 同一障碍不会重复计分（含大步长不漏判） | PASS | gameState.test.js · T4 |
| 5 | 失败后重新开始完全重置 | PASS | gameState.test.js · T5 |
| 6 | Resize 不修改世界状态 | PASS | resize.test.js · T6（stub WebGLRenderer） |
| 7 | 输入取消后无残留按键或滑动 | PASS | input.test.js · T7 |
| 8 | 暂停恢复后无大幅逻辑跳跃 | PASS | pause.test.js · T8 |

附加用例：T9 非法状态转换（PASS）、T10 难度单调有界与旋转障碍同判定（PASS）、T11 存储降级（PASS）、UI/音效（PASS）。

## 3. 验收标准（requirements.md §5）

| AC | 内容 | 结果 | 测试方式 |
|---|---|---|---|
| AC1–AC3 | 碰撞判定 | PASS | 自动化 T1–T3 |
| AC4 | 只计分一次 | PASS | 自动化 T4 |
| AC5 | 重开完全重置 | PASS | 自动化 T5 + 浏览器点击"再来一局"：PLAYING、0 分、θ=4.712、无已判定障碍、距离 0 |
| AC6 | Resize 不改世界 | PASS | 自动化 T6 + 浏览器视口 375×812 ↔ 812×375：`JSON.stringify(game.snapshot())` 前后相同 |
| AC7 | 输入取消无残留 | PASS | 自动化 T7 + 浏览器派发 PointerEvent：cancel 后 5 次移动，θ 不变 |
| AC8 | 隐藏 10 s 无跳跃 | PASS | 自动化 T8 + 浏览器模拟 visibilitychange（见 §5） |
| AC9 | 非法转换被拒 | PASS | 自动化 T9 |
| AC10 | 难度单调、旋转同判定 | PASS | 自动化 T10 |
| AC11 | 存储异常降级 | PASS | 自动化 T11 |
| AC12 | 桌面完整可玩一局 | PASS | 浏览器：空格开始 → 穿越得分 → 撞击闪屏 → 结算 → 再来一局 |
| AC13 | 手机滑动可控、转屏不重置 | PASS（模拟）/ NOT TESTED（真机） | 移动视口 + PointerEvent(pointerType=touch)；真机未测 |

## 4. 桌面端验收

| 项 | 结果 | 说明 |
|---|---|---|
| 3D 隧道、能量球、霓虹缺口圆环渲染 | PASS | 截图确认 |
| 空格开始 / 继续 / 重开 | PASS | 实测中发现合成按键缺少 `e.code` 导致失效，已修复为 `e.key` 兜底并补测试 |
| A / D、← / → 键盘移动 | NOT TESTED（浏览器） | 自动化工具的按键是瞬时按下抬起，无法模拟按住；逻辑由 T7 覆盖 |
| 鼠标按住拖动 | PASS（逻辑）/ NOT TESTED（真实鼠标） | 派发 `PointerEvent(pointerType=mouse/touch)` 生效（100 px → 0.737 rad）；工具的拖拽没有产生 move 事件 |
| 撞击闪屏 → 结算（最终得分、最高分） | PASS | 截图确认；撞击时球确实落在环体上（视觉 = 判定） |
| 最高分持久化 | PASS | 刷新后"最高 15"仍在 |
| `?debug` FPS | PASS | `FPS 120 · 8.3 ms · DPR 1.50`（桌面开发机） |
| 控制台错误 | PASS | 无错误 |
| 音效 | NOT TESTED | 自动化环境无法听测；Sfx 逻辑由 ui.test.js 覆盖 |
| 旋转障碍 / 空间扭曲视觉 | NOT TESTED（目视） | 逻辑由 difficulty.test.js 的自动驾驶跑到扭曲阶段验证 |

## 5. 横竖屏切换（P0 关键要求）

| 要求 | 结果 | 证据 |
|---|---|---|
| 不重建游戏实例 | PASS | `main.js` 只创建一个 `Game`；`window.__spaceFold.game` 在切换前后是同一对象 |
| 分数、难度、角度、障碍位置、状态保持 | PASS | 竖屏 375×812 时暂停并取快照 → 切到横屏 812×375 → 快照逐字节相同 |
| 相机 aspect / 投影 / renderer 尺寸更新 | PASS | aspect 0.462 → 2.165；fov 104.9° → 70.0°；canvas 562×1218 → 1218×562（DPR 1.5） |
| UI 自适应、safe-area | PASS（模拟） | 两个方向截图中面板、HUD 均完整可见；`env(safe-area-inset-*)` 在模拟器中为 0，刘海屏未测 |
| 不改物理坐标与运动半径 | PASS | 自动化 T6 + 浏览器快照比对 |
| 触控被取消时清空输入 | PASS | 自动化 T7 + 浏览器 pointercancel 实测 |
| 页面隐藏安全暂停、恢复后继续 | PASS（模拟） | 覆盖 `document.visibilityState='hidden'` 并派发事件：立即 PAUSED，2 s 内障碍 z 不变；恢复后显示暂停面板，继续后 0.1 s 推进 1.4 单位（= 速度 14 × 0.1 s） |
| 切换后继续游戏无跳变 | PASS | 横屏继续 0.3 s：障碍 −36.6 → −32.4 |
| 不 reload、不锁方向 | PASS | 代码审查：无 `location.reload`、无 `screen.orientation.lock` |
| 真机横竖屏旋转 | NOT TESTED | 需要现场用手机访问局域网地址验证 |

## 6. 手机端验收

| 项 | 结果 | 说明 |
|---|---|---|
| 移动视口布局（竖 / 横） | PASS（模拟） | 截图确认 |
| 触屏相对滑动 | PASS（模拟） | `PointerEvent(pointerType='touch')` 派发 |
| 多指只跟踪第一根 | PASS | 自动化 T7 |
| 真机触屏手感、iOS Safari / Android Chrome | NOT TESTED | 无真机 |
| 中端手机 60 FPS | NOT TESTED | 未测量，不作宣称 |

## 7. 非功能需求

| NFR | 结果 | 方式 |
|---|---|---|
| NFR1 性能约束（固定步长、dt 上限、DPR 上限与降级、对象池、无阴影/后处理） | PASS | 自动化 + 代码审查 + 桌面实测 |
| NFR2 单一代码库 | PASS | 代码审查：无平台分支的游戏实现 |
| NFR3 逻辑可测 | PASS | Vitest 在 Node 中运行 |
| NFR4 构建与局域网运行 | PASS | 命令输出 |
| NFR5 可用性（44px 按钮、safe-area、禁止滚动/缩放） | PASS（模拟）/ NOT TESTED（真机） | CSS 审查 + 视口截图 |
| NFR6 无后端、无外部请求 | PASS | 代码审查 + `npm audit` |

## 8. 已知问题与风险

1. **未在真机测试**：触屏手感、iOS Safari 的地址栏伸缩与转屏、刘海屏 safe-area 都需要现场验证。现场演示前请用手机打开 Network 地址试玩一局并转一次屏。
2. **手机帧率未测量**。若卡顿，DPR 会自动从 1.5 降到 1.0；可在 URL 后加 `?debug` 查看。
3. 判定只在障碍中心平面进行，"擦边"时视觉与判定可能有极细微差异（设计文档 §2.5）。
4. 浏览器面板在后台时 rAF 被节流，游戏会按设计自动暂停。这是正确行为，不是缺陷。
5. P2（FR18：额外障碍类型、更多美术）按时间盒未实现。

## 9. Operations：生产构建冒烟测试

| 检查 | 结果 | 方式 |
|---|---|---|
| `npm run build` 产物可被静态服务器提供 | PASS | `npx vite preview --port 4173`：`/` 200，`assets/index-*.js` 200（497 933 B），`assets/index-*.css` 200 |
| 生产构建中游戏可启动 | PASS | 内置浏览器打开 `http://localhost:4173/`：PLAYING，6 个障碍，canvas 存在，控制台无错误 |
| 局域网开发服务器 | PASS | `npm run dev -- --host 0.0.0.0` 监听 0.0.0.0:5173；本机局域网地址 172.24.50.162 |
| 手机通过局域网实际访问 | NOT TESTED | 需在现场用手机打开 `http://<电脑局域网 IP>:5173/` |

AI-DLC Operation 阶段的部署流水线、部署执行、可观测性配置三项都以"无部署目标"为由跳过（express 流程规则：没有真实部署目标时不得凭空设计）。部署方式见 README.md。

## 9.5 迭代 2：AWS 主题（流程记录 261016-aws-theme）

| 验收项 | 结果 | 测试方式 |
|---|---|---|
| AC14 AWS 配色，源码无首版品红/青色 | PASS | T12 源码扫描 + 浏览器截图 |
| AC15 Bolt 小橙身体半径 = 碰撞半径，装饰不超宽 | PASS | T13 |
| AC16 服务名确定性轮换 | PASS | T14 + 浏览器：第 5 分弹出 `+1 CloudFront` |
| AC17 每 5 分切换 Region | PASS | T15 + 浏览器：HUD 切到 `us-west-2` 并弹出提示 |
| AC18 开始页 / 游戏中 / 结算页 AWS 元素 | PASS | 浏览器截图与 DOM 检查 |
| AC19 回归：全部测试与构建 | PASS | `npm run test` 87/87，`npm run build` 成功 |
| 手机上的 AWS 主题观感 | NOT TESTED | 需在真机查看 |

## 9.6 迭代 3：视觉升级 + 幽灵巫师 Boo（流程记录 261016-visual-upgrade）

| 验收项 | 结果 | 测试方式 |
|---|---|---|
| AC20 立体障碍弧长与缺口一致 | PASS | T16 |
| AC21 Perfect 判定与连击 | PASS | T17 |
| AC22 动态 FOV 上限 | PASS | T18 |
| AC23 Bloom 启用决策与自动关闭 | PASS | T19 + 浏览器：桌面 Bloom on，触屏视口 Bloom off |
| AC24 视觉层不改世界状态 | PASS | T20 |
| AC25 新视觉在浏览器中正常、控制台无错误 | PASS | 截图（桌面、375×812、812×375）+ 主角特写渲染 |
| AC26 回归：全部测试与构建 | PASS | `npm run test` 108/108，`npm run build` 成功 |
| FR20 修订：主角幽灵巫师 Boo，宽度不超过碰撞半径 | PASS | T13 + 特写渲染 |
| 真机帧率与 Bloom 观感 | NOT TESTED | 需在真机查看 |

## 10. 总结

- 自动化：74 / 74 PASS，构建 PASS，依赖漏洞 0。
- 浏览器实测：桌面完整一局、横竖屏世界状态保持、切后台暂停、重开重置均 PASS。
- NOT TESTED：真机触屏与转屏、手机帧率、音效听感、真实鼠标/键盘按住操作、手机局域网访问。
