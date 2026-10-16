# Code Summary — 迭代 2：AWS 主题

## 文件

- 新增：`src/theme.js`、`src/entities/Mascot.js`、`tests/theme.test.js`
- 修改：
  - 渲染：`src/entities/Player.js`、`Obstacle.js`、`Tunnel.js`、`Particles.js`、`src/core/Renderer.js`
  - UI：`src/main.js`、`src/ui/UIManager.js`、`index.html`、`src/styles/main.css`
  - 测试与文档：`tests/ui.test.js`、`README.md`、`aidlc/progress.md`

## 关键决策

- 调色板集中在 `theme.js`：橙 `#FF9900`、墨蓝 `#232F3E`、背景 `#0B1320`、亮蓝 `#3EB8E5`。
- Bolt 小橙为原创程序化形象：
  - 身体半径 = `BALL_RADIUS`，装饰在切向最远约 0.185，小于 0.34，视觉宽度与碰撞宽度一致。
  - 与摄像机同步滚转，屏幕上始终正立，天线指向隧道中心。
- 服务名按得分确定性轮换；每 5 分切换一个 Region。
- 没有使用官方 Logo、吉祥物，也没有广告式文案。

## 测试

9 个文件、87 个测试全部通过：首版 74 个，新增 13 个。构建通过。

## 与计划的偏差

- T13 容差由 1e-9 放宽到 1e-6，原因是 Three.js 顶点使用 Float32，包围盒有约 1e-8 的精度误差。
- 得分 15 时 Region 提示与"空间扭曲！"提示会叠加，后一条覆盖前一条。

## 浏览器实测（技术负责人）

- 开始页、HUD、吉祥物均为 AWS 配色。
- 第 5 分弹出 `+1 CloudFront`，HUD 切到 `us-west-2`，并提示"进入 Region us-west-2"。
- 结算页显示"到达 Region us-west-2"与 AI-DLC 标注。
