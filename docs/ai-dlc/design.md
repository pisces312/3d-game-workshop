# 重力叠叠乐：设计

## 场景

- Three.js PerspectiveCamera 提供第三人称斜向视角。
- Cylinder 基座、发光环、网格地面和粒子星空组成空间舞台。
- HemisphereLight、DirectionalLight、PointLight 组合出霓虹夜景和实时阴影。
- HTML HUD 负责层数、最高分、状态和开始/结束面板。

## 游戏状态

```text
ready → playing → dropping → playing
                         └→ over
```

- `ready`：等待开始。
- `playing`：当前方块沿 X 或 Z 轴往返移动。
- `dropping`：点击后应用重力，直到触达目标高度。
- `over`：重叠不足，停止生成方块并展示结果。

## 落点算法

1. 当前层与上一层在 X、Z 两个方向分别计算区间交集。
2. 任一方向的交集小于 `minimumOverlap`，判定为失败。
3. 有效时把当前方块中心移动到交集中心，并把宽度/深度裁切为交集大小。
4. 层数增加，摄像机目标高度平滑上移，再生成下一块。

## 体验设计

- 方块颜色循环使用薄荷绿、紫色、琥珀、珊瑚和蓝色。
- 移动速度随层数轻微提升，保持简单规则下的挑战曲线。
- 桌面端支持 Space，移动端使用 pointerdown，所有输入都复用同一个落块动作。
