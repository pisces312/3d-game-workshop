# Requirements — Space Fold《空间折叠》

> AI-DLC 阶段：Inception / Requirements Analysis（express 流程，深度 Minimal，测试策略 Minimal）
> 需求编号（REQ）：功能需求 `FR{n}`、非功能需求 `NFR{n}`，为永久追溯键。
> 来源标注：`[desc]` = 用户原始任务说明的对应章节。

## 1. 意图分析

目标不是"功能清单"，而是**在 3 小时内拿出一个现场能玩、能在手机上转屏不翻车的 3D 小游戏**，
并留下需求 → 设计 → 实现 → 验证的完整 AI-DLC 记录。可玩性第一，横竖屏稳定性第二。

## 2. 用户故事

| ID | 角色 | 行为 | 价值 |
|---|---|---|---|
| US1 | 评委（桌面浏览器） | 用鼠标拖动或 A/D、方向键让能量球绕隧道移动，空格开始/重开 | 无需说明即可上手演示 |
| US2 | 评委（手机） | 手指左右滑动控制能量球 | 手机上也能流畅游玩 |
| US3 | 手机玩家 | 游戏进行中把手机从竖屏转到横屏（或反向） | 不丢分、不重开，继续玩 |
| US4 | 玩家 | 撞到障碍后看到结果并一键重开 | 快速再来一局 |
| US5 | 玩家 | 随得分增加感受到速度与难度上升、空间扭曲 | 有挑战和惊喜 |
| US6 | 玩家 | 切到别的 App 再回来 | 游戏自动暂停，回来可以继续，不会"瞬移"死亡 |

## 3. 功能需求

### P0（必须）

| REQ | 需求 | 优先级 | 来源 |
|---|---|---|---|
| FR1 | 系统应使用 Three.js 程序化渲染：深色太空背景、由圆环与纵向线段构成的 3D 隧道、发光青蓝能量球、霓虹色带缺口圆环障碍。 | P0 | [desc] 三 |
| FR2 | 能量球位置由 `x = R·cos θ, y = R·sin θ, z = PLAYER_Z` 决定，R 与 PLAYER_Z 为常量，玩家只改变 θ。 | P0 | [desc] 四 |
| FR3 | 障碍数据包含 `z, gapCenter, gapSize, speed, checked`；从远处生成、向 PLAYER_Z 移动、越过后回收。 | P0 | [desc] 四 |
| FR4 | 障碍跨越判定平面时进行通过判定：使用标准化角度差（处理 0/2π 交界），并计入球体所占角宽 `α = asin(r/R)`；通过条件 `|Δθ| + α ≤ gapSize/2`。缺口视觉与该规则一致。跨越检测基于"上一步 z < PLAYER_Z ≤ 当前 z"，不依赖帧率。 | P0 | [desc] 四 |
| FR5 | 每道障碍最多计分一次（`checked` 标志），HUD 实时显示当前得分。 | P0 | [desc] 四、七 |
| FR6 | 难度随得分递增：速度上升、缺口变窄、间距变短，均有上下限。 | P0 | [desc] 八 |
| FR7 | 状态机包含 READY、PLAYING、PAUSED、GAME_OVER，只允许定义过的转换；PAUSED 停止逻辑模拟并保留进度。 | P0 | [desc] 七 |
| FR8 | 重新开始完全重置：得分、θ、障碍、难度、计时器、输入状态、生成器。 | P0 | [desc] 七 |
| FR9 | 桌面输入：鼠标按住拖动；A/D 与 ←/→ 沿圆周移动；空格开始/重开/继续；P 或 Esc 暂停。 | P0 | [desc] 五 |
| FR10 | 触屏输入：Pointer Events（down/move/up/cancel），按 pointerId 只跟踪一根手指，使用相对位移增量；不处理模拟鼠标事件导致的重复。 | P0 | [desc] 五 |
| FR11 | 横竖屏/尺寸变化：不重建游戏实例；分数、难度、θ、障碍位置与状态不变；只更新相机 aspect/fov/投影矩阵与 renderer 尺寸；UI 用 viewport 单位与 safe-area 自适应；尺寸变化来源为 resize + ResizeObserver（+ orientationchange/visualViewport 兼容），不依赖单一来源；不锁定方向、不 reload。 | P0 | [desc] 六 |
| FR12 | 页面隐藏（visibilitychange）或窗口失焦时，PLAYING 自动进入 PAUSED；恢复时时钟重置，不产生逻辑时间跳跃；触控被浏览器取消（pointercancel / lostpointercapture / blur）时清空输入。 | P0 | [desc] 六 |

### P1（尽量交付）

| REQ | 需求 | 优先级 | 来源 |
|---|---|---|---|
| FR13 | 最高分保存在 localStorage；不可用（隐私模式/抛异常）时降级为内存，不影响游戏。GAME_OVER 显示最终得分和最高分。 | P1 | [desc] 七 |
| FR14 | 得分达到阈值后出现旋转缺口障碍；旋转只改变 `gapCenter`，仍使用 FR4 同一判定函数，网格旋转与 `gapCenter` 同步。 | P1 | [desc] 八 |
| FR15 | 视觉反馈：球体尾迹；穿越障碍的短促粒子（粒子总数有上限）；碰撞闪屏后显示结果；高分阶段摄像机轻微摆动 + 隧道变色（空间扭曲），不反转控制方向。 | P1 | [desc] 三、八 |
| FR16 | WebAudio 合成音效（穿越、撞击、开始），首次用户手势后初始化，可静音。 | P1 | [desc] 一 P1 |
| FR17 | READY 界面显示标题、桌面与手机操作教程、开始按钮。 | P1 | [desc] 七 |

### P2（时间不够即砍）

| REQ | 需求 | 优先级 |
|---|---|---|
| FR18 | 额外障碍类型（如双缺口）、更多美术与动画。 | P2 |

## 4. 非功能需求

| REQ | 需求 | 验证方式 |
|---|---|---|
| NFR1 | 性能：`renderer.setAnimationLoop` 驱动；固定步长 1/120 s，单帧 delta 上限 0.1 s，单帧最多 12 个模拟步；DPR 上限 1.5，平均帧时间 > 22 ms 持续 2 s 自动降到 1.0；几何体/材质复用、障碍对象池、粒子 ≤ 80、无实时阴影、无后处理。帧率只报告实测值（`?debug` 显示 FPS）。 | 代码审查 + 浏览器实测 |
| NFR2 | 单一代码库：桌面与手机共用同一 `Game` / `Renderer` / `InputManager`，不存在两份游戏实现。 | 代码审查 |
| NFR3 | 可测试：游戏逻辑（`Game`、碰撞、状态机、难度、生成）不依赖 three/DOM，可在 Node 中运行 Vitest。 | `npm run test` |
| NFR4 | 构建与运行：`npm install`、`npm run test`、`npm run build` 成功；`npm run dev -- --host 0.0.0.0` 可供局域网手机访问。 | 命令输出 |
| NFR5 | 可用性：触控按钮最小 44×44 CSS px；UI 避开 safe-area；文本在 320px 宽度可读；禁用页面滚动/缩放/长按选择干扰。 | 浏览器手动 |
| NFR6 | 安全：无后端、无密钥、无外部请求（Three.js 打包进产物）。 | 代码审查 |

## 5. 验收标准（Given/When/Then）

| AC | 对应 REQ | 验收标准 | 测试 |
|---|---|---|---|
| AC1 | FR4 | Given 缺口中心 gapCenter、球 θ = gapCenter，When 判定，Then 通过。 | T1 自动 |
| AC2 | FR4 | Given θ 与缺口边缘的距离恰好 `gapSize/2 − α`，Then 通过；距离 `gapSize/2 − α + ε`，Then 失败（只判中心点会误判通过）。 | T2 自动 |
| AC3 | FR4 | Given gapCenter = 0.05、θ = 2π − 0.05（跨 0/2π），Then 角度差为 0.1，通过；负角、> 2π 的角度同样正确。 | T3 自动 |
| AC4 | FR5 | Given 一道障碍已越过判定平面并计分，When 继续模拟多步，Then 得分只 +1。 | T4 自动 |
| AC5 | FR8 | Given 一局 GAME_OVER（有分数、有障碍、按键按下），When restart，Then 得分 0、θ 初始值、障碍为空、难度归零、输入清空、状态 PLAYING。 | T5 自动 |
| AC6 | FR11 | Given 游戏进行中，When 渲染层依次 resize 到 375×812、812×375、1280×720，Then 游戏快照（分数、θ、障碍 z/gapCenter、状态、难度）完全不变，且相机 aspect 随之更新。 | T6 自动 |
| AC7 | FR10, FR12 | Given 一根手指按下并拖动、键盘 D 按下，When pointercancel / blur，Then 输入轴为 0、拖动增量为 0，之后 move 事件不再产生位移。 | T7 自动 |
| AC8 | FR12, NFR1 | Given PLAYING，When 页面隐藏 10 s 后恢复，Then 进入 PAUSED，恢复后第一帧推进的逻辑时间 ≤ 0.1 s，障碍不会瞬移。 | T8 自动 |
| AC9 | FR7 | 非法状态转换（如 READY → PAUSED）被拒绝，状态不变。 | T9 自动 |
| AC10 | FR6, FR14 | 难度函数单调：分数越高速度不降、缺口不增，且在上下限内；旋转障碍出现后仍用同一判定函数。 | T10 自动 |
| AC11 | FR13 | localStorage 抛异常时最高分功能不崩溃并回退到内存。 | T11 自动 |
| AC12 | FR1, FR9, FR15, FR17 | 桌面浏览器中能看到隧道、能量球、障碍，键鼠可操作，完整一局可玩。 | 浏览器手动 |
| AC13 | FR10, FR11, NFR5 | 手机/移动端模拟视口中滑动可控，横竖屏切换不重置。 | 浏览器/真机手动 |

## 6. 约束

- 技术栈：HTML5、JS ES Modules、Three.js、Vite、原生 CSS、Vitest（仅开发依赖）。
- 禁止：React/Vue、后端/数据库、物理引擎、外部模型、付费 API、大贴图、高成本后处理、锁定方向、陀螺仪。
- 时间盒 3 小时。

## 7. 假设

- A1：评委使用近两年的 Chrome / Safari / Edge（支持 Pointer Events、ResizeObserver、WebGL1/2）。
- A2：现场可能无法提供真机，移动端验收以浏览器移动视口模拟为主，真机测试标记为 NOT TESTED 直到实际运行。
- A3：npm 可访问公共 registry 以安装 three、vite、vitest。

## 8. 范围外

账号/联网排行榜、多人、关卡编辑、后处理特效、外部美术资源、陀螺仪操控。

## 9. 待定问题

无阻塞问题。真机帧率需现场实测后记录在 `verification.md`。

## 10. 关联 Inception 文档

- 项目意图：`aidlc/intent.md`
- 设计：`aidlc/design.md`
- 单元与 Bolt：`aidlc/units.md`
