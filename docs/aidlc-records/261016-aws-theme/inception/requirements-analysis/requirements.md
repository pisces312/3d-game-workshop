# Requirements — 迭代 2：AWS 主题（流程记录 `261016-aws-theme`）

## Intent 分析

首版《空间折叠》已交付。本次比赛由 AWS 主办、以 AI-DLC 为主题，用户希望游戏更有 AWS 辨识度：
更多橙色，主角换成 AWS 风格的吉祥物，加入 AWS 元素。

来源 `[desc2]`：用户在首个版本交付后提出。已与用户确认的方向是"配色 + 原创吉祥物 + 服务元素"。

## 决策与边界

- 不使用 AWS / Amazon 官方 Logo、"微笑箭头"或官方吉祥物形象（注册商标），吉祥物为 Three.js 程序化原创形象。
- 不制作冒充官方的"广告"；AWS 元素以**如实提及服务名**的方式出现。
- 不改变玩法、碰撞规则、难度曲线与横竖屏行为；首版 FR1–FR17 与全部测试保持通过。

## 功能需求

| REQ | 需求 | 优先级 | 来源 |
|---|---|---|---|
| FR19 | 全局配色改为 AWS 风格：主色橙 `#FF9900`，背景深墨蓝（`#232F3E` 系），辅色亮蓝；HUD、按钮、面板、隧道、障碍、粒子统一取自 `src/theme.js` 调色板。 | P0 | [desc2] |
| FR20 | 主角替换为原创橙色吉祥物"Bolt 小橙"：橙色球体身体（半径严格等于 `BALL_RADIUS`）、一对白色眼睛、指向隧道轴心的短天线与发光天线头；面部朝向摄像机，屏幕上方向随相机滚转保持正立。装饰不得在圆周方向超出身体角宽，确保视觉与碰撞判定一致。 | P0 | [desc2] |
| FR21 | 每次穿越障碍，在屏幕下方弹出 `+1 <AWS 服务名>` 浮动提示（如 Lambda、S3、DynamoDB），服务名按得分确定性轮换。 | P1 | [desc2] |
| FR22 | 关卡按 AWS Region 命名：每 5 分进入下一个 Region（us-east-1 → us-west-2 → eu-west-1 → ap-northeast-1 → ap-southeast-1 → …循环），HUD 显示当前 Region，进入新 Region 时弹出提示；结算页显示到达的 Region。 | P1 | [desc2] |
| FR23 | 开始页副标题 "AWS Edition · Built with AI-DLC"，结算页底部标注 "Built with AI-DLC · 可部署到 Amazon S3 + CloudFront"。 | P1 | [desc2] |

## 非功能需求

| REQ | 需求 |
|---|---|
| NFR7 | 主题改动不新增每帧对象分配；服务提示复用固定 DOM 节点。 |

## 验收标准

| AC | REQ | 标准 | 测试 |
|---|---|---|---|
| AC14 | FR19 | `src/` 中渲染与 CSS 不再出现首版的品红 `#ff2bd6` 与青色 `#7ffcff`；主色为 `#FF9900`。 | T12 自动（源码扫描）+ 浏览器截图 |
| AC15 | FR20 | 吉祥物身体半径 = `BALL_RADIUS`；所有装饰相对身体中心在切向（屏幕水平）的最大偏移 ≤ `BALL_RADIUS`。 | T13 自动 |
| AC16 | FR21 | 给定得分 s，服务名为 `SERVICES[(s−1) mod n]`；同一分数结果确定。 | T14 自动 |
| AC17 | FR22 | `regionForScore(0..4)` = us-east-1，`(5..9)` = us-west-2，超过列表长度后循环；分数跨越 5 的倍数时触发一次 Region 切换提示。 | T15 自动 |
| AC18 | FR19–FR23 | 浏览器中开始页、游戏中、结算页呈现 AWS 配色、吉祥物、服务提示与 Region。 | 浏览器手动 |
| AC19 | 回归 | 首版 74 个测试全部通过；`npm run build` 通过。 | `npm run test` / `npm run build` |

## 约束与假设

- 技术栈不变（Three.js + Vite + 原生 CSS），不引入图片或字体资源。
- 假设评委认可"AWS 风格"而非官方授权素材。

## 范围外

部署到 S3 + CloudFront（用户本次未选）、官方 Logo / 吉祥物、广告投放。
