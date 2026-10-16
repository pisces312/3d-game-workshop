# 重力叠叠乐 · Gravity Stack

一个无需构建工具即可运行的 3D 网页小游戏：方块在空中往返移动，玩家点击、触摸或按空格键让方块落下，重叠部分越精准，塔就能叠得越高。

## 运行

项目使用 Three.js CDN，不需要安装依赖。由于浏览器的 ES Module 安全策略，建议从项目目录启动一个静态服务器：

```bash
python3 -m http.server 4173
```

然后打开 <http://localhost:4173>。

## 操作

- 点击 / 触摸游戏画面：让当前方块落下
- `Space`：让当前方块落下
- 点击“开始挑战”或“重新挑战”：开始一局

## AI-DLC 实现记录

本项目按 AWS Labs [AI-DLC Workflows](https://github.com/awslabs/aidlc-workflows) 的官方 artifact 命名和 intent record 结构整理，选择 `MVP` profile：适合可玩的第一版产品，跳过生产部署阶段。

- `aidlc/spaces/default/intents/261016-gravity-stack/`：按官方目录组织的 Intent、Ideation、Inception、Construction 和 Verification 产物
- `aidlc/.../aidlc-state.md`：工作流状态、阶段状态和 traceability 说明
- `aidlc/.../inception/requirements-analysis/requirements.md`：编号需求和非功能需求
- `aidlc/.../inception/units-generation/`：Unit of Work 及依赖图
- `aidlc/.../construction/game-client/`：功能设计、NFR、代码生成和验证文档
- `docs/ai-dlc/`：面向项目成员的中文摘要版文档

说明：当前环境没有检测到原生 `aidlc` 命令，因此这些是依据官方规范对已完成原型进行的可审阅文档回填，不包含原生引擎生成的 approval receipt。真实 workflow 的启动方式是先配置 `kiro-ide` harness，再在 Kiro IDE 中选择 `aidlc` agent。

## 技术说明

- Three.js `0.166.1`，通过 CDN import map 加载
- 原生 HTML、CSS、JavaScript，无框架和构建步骤
- 使用 `localStorage` 保存本地最高层数
- 支持桌面端键盘和移动端触摸操作
