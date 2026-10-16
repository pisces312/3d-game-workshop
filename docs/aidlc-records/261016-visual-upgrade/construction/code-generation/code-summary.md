# Code Summary — 迭代 3：视觉升级

## 文件

新增：
- `src/systems/VisualFx.js`
- `src/core/PostFx.js`
- `src/entities/SpeedLines.js`
- `tests/visual.test.js`

修改：
- 逻辑：`src/core/Game.js`
- 渲染：`src/core/Renderer.js`、`src/entities/Tunnel.js`、`Obstacle.js`、`Particles.js`、`Player.js`、`Mascot.js`
- UI 与入口：`src/ui/UIManager.js`、`src/main.js`、`index.html`、`src/styles/main.css`
- 测试与文档：`tests/ui.test.js`、`tests/theme.test.js`、`README.md`、`aidlc/progress.md`

## 关键实现

- **隧道**：内壁使用 ShaderMaterial，光带向镜头流动，扭曲阶段变为橙色；260 颗空间尘埃循环复用。
- **障碍**：主环管半径 0.42，用 matcap 着色；高亮环管半径 0.1。两者弧长都等于 2π − gapSize。
- **速度感**：动态 FOV 最多 +8°；穿越时有 +3° 的镜头冲击；速度线最多 120 段，池化复用。
- **菜单**：READY / GAME_OVER 时镜头环绕，主角放大展示。PAUSED 不做环绕，避免继续游戏时视角错位。
- **反馈**：Perfect 判定（|Δθ| ≤ gapSize/4）和连击、得分弹跳、服务提示飞入、撞击碎片（≤ 40）、色差闪屏、更强的震动。
- **Bloom**：只在非触屏设备或 `?bloom=on` 时启用；平均帧时间超过 20 ms 持续 2 s 自动关闭一次，优先于 DPR 降级。

## 应用户要求的修改：主角替换为"幽灵巫师 Boo"（修订 FR20）

用户在本阶段提供参考图，并选择"幽灵 + 橙色辉光"方案。由技术负责人实现：

- `Mascot.js` 用 Three.js 程序化建模：
  - 灰白幽灵身体，头部半径 = `BALL_RADIUS`，下摆波浪飘动；
  - 椭圆黑眼睛，会眨眼；
  - 紫色巫师帽：弯折帽尖、浅紫帽带、金色方扣、金色月亮和星星；
  - 外围保留 AWS 橙色光晕。
- 与参考图的差异：帽檐半径 0.33，收窄到不超过碰撞半径 0.34，保证画面轮廓与判定一致。
- 浏览器实测中发现纯白身体在 Bloom 下过曝，已调整：
  - 身体颜色改为冷调灰白 `#B3BBD4`；
  - 光晕不透明度 0.22 → 0.1；
  - 帽子上移，眼睛放大。
- 测试：T13 中"天线朝轴心"的断言改为"帽子朝轴心"，宽度断言不变，仍覆盖全部装饰。
- 界面、README、ui.test 中的角色名统一改为"幽灵巫师 Boo"。

## 测试

10 个文件、108 个测试全部通过；构建成功。

## 偏差与问题

- 开发者在部分文件编辑中使用了 python3、heredoc 或 `sed -i`，违反了"只用文件工具写文件"的约定。这些文件的结果已通过全部测试，并经技术负责人复核。
- T18 测试为模拟高速，直接修改了 `game.difficulty`（只读探测，不调用 update）。
