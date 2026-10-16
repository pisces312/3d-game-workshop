# Space Fold《空间折叠》

## AWS 主题（迭代 2 · AWS Edition）

- **配色**：主色橙 `#FF9900`、墨色 `#232F3E`、深色背景 `#0B1320`、亮蓝辅色 `#3EB8E5`、白色文字；统一定义在 `src/theme.js`（`PALETTE` / `CSS_PALETTE`），CSS 变量与之对应。固定障碍为橙色、旋转障碍为亮蓝，隧道线条为蓝灰、扭曲阶段渐变为橙色。
- **主角幽灵巫师 Boo**（迭代 3 应用户要求替换原来的 Bolt 小橙）：`src/entities/Mascot.js` 程序化生成——白色幽灵（头部半径 = 碰撞半径，下摆波浪飘动）、椭圆黑眼睛会眨，戴紫色巫师帽（弯折帽尖、浅紫帽带、金色方扣、金色月亮与星星），外围保留 AWS 橙色光晕。帽子指向隧道中心并随相机滚转保持正立；帽檐特意收窄到不超过碰撞宽度，看到的轮廓就是判定范围。
- **服务提示**：每穿过一道环，底部弹出 `+1 <服务名>`（Lambda、S3、DynamoDB……共 18 个，按得分确定性轮换）。
- **Region 关卡**：每 5 分进入一个新 Region（us-east-1 → us-west-2 → … → sa-east-1，8 个后循环），HUD 显示当前 Region，切换时提示"进入 Region …"，结算页显示到达的 Region。
- **商标说明**：幽灵巫师 Boo 为程序化建模的原创形象；未使用任何 AWS / Amazon 官方 Logo、标志性图形或官方吉祥物，也没有广告内容。AWS 仅以真实服务名、Region 名称以及"Built with AI-DLC · 可部署到 Amazon S3 + CloudFront"的事实性说明出现。

## 视觉效果（迭代 3）

- **立体隧道**：在线框隧道外层加了一层发光内壁（自定义 Shader），有向镜头流动的柔和光带与淡淡的六边形网格闪烁；进入扭曲阶段时光带变为橙色并带螺旋。隧道中还有几百颗缓慢飘向镜头的空间尘埃。
- **立体障碍**：圆环加粗并用程序化 matcap 着色（不需要灯光和阴影），前缘叠加一条同弧长的高亮细环。主环和高亮环的弧长都严格等于 `2π − 缺口`，**看到的缺口就是判定的缺口**。
- **速度感**：速度越快视野越宽（最多 +8°），隧道壁附近出现随速度增多、变长的速度线；每次穿越有短暂的镜头冲击。
- **3D 菜单**：开始页与结算页时镜头缓慢环绕，幽灵巫师 Boo 放大并轻轻转动；毛玻璃透视面板、3D 立体标题、呼吸辉光按钮。
- **HUD 动效**：得分弹跳；贴近缺口中心穿过时显示 `PERFECT`，连续时显示 `PERFECT x3` 等（只是提示，不影响得分）；服务名从下方 3D 飞入。
- **撞击反馈**：镜头强震、橙白碎片四散、红/青色差闪屏与短暂画面抖动。
- **Bloom 辉光**：桌面默认开启，手机/触屏默认关闭；可用 URL 参数强制：`?bloom=on` / `?bloom=off`。若平均帧时间持续 2 秒超过 20 ms，Bloom 会自动关闭一次（优先于降低分辨率）。
- **调试**：`?debug` 左下角显示 `FPS · ms · DPR · Bloom on/off`。
- **手机说明**：所有特效都不使用阴影和额外灯光，速度线和粒子都是固定数量的对象池；系统开启"减少动态效果"时会关闭装饰性动画。中低端手机如仍卡顿，保持默认（Bloom 关闭）即可。

一款 Three.js 3D 网页小游戏：控制发光能量球沿无限延伸的圆形隧道**圆周**移动，对准霓虹圆环障碍的缺口穿过去。
同一套代码适配桌面键鼠与手机触屏，横竖屏切换不中断、不重置、不丢分。

技术栈：HTML5 · JavaScript ES Modules · Three.js 0.170 · Vite 5 · 原生 CSS · Vitest 2（仅测试）。无后端、无外部资源。

## 运行方法

需要 Node.js 18+（已在 Node 24 / npm 11 下验证）。

```bash
npm install
npm run dev -- --host 0.0.0.0
```

终端会打印 `Local` 与 `Network` 地址。手机与电脑连同一局域网，用手机浏览器打开 `Network` 地址（如 `http://192.168.x.x:5173/`）即可游玩。
在地址后加 `?debug` 可显示实时 FPS / 帧时间 / DPR。

## 测试与构建

```bash
npm run test     # Vitest，Node 环境，8 个测试文件
npm run build    # 产物输出到 dist/
npm run preview  # 本地预览构建产物
```

## 部署说明

`npm run build` 生成的 `dist/` 是纯静态文件（`vite.config.js` 中 `base: './'`，使用相对路径），可直接放到任意静态托管：
Nginx / Apache 目录、GitHub Pages、Netlify、Vercel、对象存储静态网站等，无需服务端逻辑。
注意：手机浏览器需通过 HTTP(S) 访问页面，不要用 `file://` 直接打开 `dist/index.html`。

## 操作说明

| 平台 | 移动能量球 | 开始 / 重开 / 继续 | 暂停 |
|---|---|---|---|
| 桌面 | 按住鼠标左右拖动，或 `A` / `D`，或 `←` / `→` | `空格` 或点击按钮 | `P` / `Esc` 或右上角 ⏸ |
| 手机 | 手指在屏幕上左右滑动（相对滑动，不需要按在球上） | 点击按钮 | 右上角 ⏸ |

- 摄像机始终跟随能量球，球固定显示在屏幕下方："向右拖 / 按 D = 球向右"，高分阶段的空间扭曲不会反转操作。
- 8 分后出现**橙色旋转缺口**障碍；15 分后进入**空间扭曲**阶段（隧道变色、镜头轻微摆动）。
- 切到后台或锁屏会自动暂停，回来后点"继续"即可；最高分保存在本地（隐私模式下仅在本次会话内有效）。
- 右上角 🔊 可静音。

## 项目结构

```
index.html              页面骨架、HUD 与覆盖层
src/main.js             组装：唯一的 Game / Renderer / Input / UI 实例、主循环、resize 与可见性管线
src/config.js           全部常量
src/core/Game.js        纯逻辑：世界状态、障碍、计分、状态机驱动（不依赖 three / DOM）
src/core/GameState.js   READY / PLAYING / PAUSED / GAME_OVER 状态与合法转换
src/core/FixedStepper.js 固定步长 1/120 s，单帧 ≤ 0.1 s
src/core/InputManager.js Pointer Events + 键盘统一输入
src/core/Renderer.js    Three.js 场景、相机、resize（只改渲染层）
src/core/Viewport.js    视口 → 相机 fov（竖屏保证水平视角）
src/systems/            CollisionSystem（角度判定）、SpawnSystem（对象池生成）、DifficultySystem
src/entities/           Tunnel、Player（含尾迹）、Obstacle、Particles
src/ui/UIManager.js     HUD、覆盖层、闪屏、提示
src/audio/Sfx.js        WebAudio 合成音效
src/storage/BestScore.js localStorage 最高分（异常时内存降级）
src/styles/main.css     dvh + safe-area 自适应布局
tests/                  Vitest 测试（T1–T11）
aidlc/                  AI-DLC 全流程文档
```

## AI-DLC 文档

| 文档 | 内容 |
|---|---|
| [aidlc/intent.md](aidlc/intent.md) | 目标、范围、约束、非目标 |
| [aidlc/requirements.md](aidlc/requirements.md) | 用户故事、FR/NFR 需求编号、验收标准 |
| [aidlc/design.md](aidlc/design.md) | 架构、碰撞推导、状态机、输入与横竖屏方案 |
| [aidlc/units.md](aidlc/units.md) | 交付单元、Bolt 计划、需求→任务→测试追溯 |
| [aidlc/progress.md](aidlc/progress.md) | 各 Bolt 实施记录（通过 / 失败 / 未验证） |
| [aidlc/verification.md](aidlc/verification.md) | 验收报告（PASS / FAIL / NOT TESTED 及测试方式） |

AI-DLC 流程记录（状态与各阶段产物）在 `docs/aidlc-records/`：`261016-space-fold-game`（首版）、`261016-aws-theme`（AWS 主题迭代）与 `261016-visual-upgrade`（视觉升级与幽灵巫师 Boo）。
这些流程在 Claude Code 中运行；文档里引用的 `aidlc/spaces/default/intents/<记录名>/` 路径对应本仓库的 `docs/aidlc-records/<记录名>/`。审计日志未包含在仓库中。

## 已知问题

- 通过判定只在障碍中心平面进行（球与环在 z 向的厚度窗口约 0.66 单位，最低速时约 47 ms），极端情况下"擦边"视觉可能与判定有细微差异。
- 未在真实手机上实测；移动端结论来自浏览器移动视口模拟（详见 verification.md）。
- 帧率仅在桌面开发机上实测（约 120 FPS）；中端手机能否稳定 60 FPS 尚未测量。
- 首次加载 JS 约 128 KB（gzip），主要是 Three.js 本体。
- 浏览器自动化工具合成的按键事件可能不带 `code`，已增加 `key` 兜底。
