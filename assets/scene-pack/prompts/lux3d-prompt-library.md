# 云栖 Lux3D 统一提示词库 v1.0

## 通用前缀

以下英文前缀必须放在每个建筑、自然或道具提示词的开头：

```text
Original East Asian mountain-temple asset for a quiet cyber-meditation world, matching one coherent temple complex. Traditional dark warm timber, muted blue-green roof tiles, warm gray weathered stone, subtle moss and humid night patina. Realistic human scale, physically plausible construction, high-quality PBR materials, restrained detail, elegant silhouette, production-ready game asset. The digital/cyber influence is extremely subtle: only tiny jade-green emissive accents where explicitly requested, never neon architecture.
```

## 通用后缀

```text
Isolated complete asset with no environment background, no terrain beyond its own foundation, no people, no monks, no animals, no text, no logos, no religious statue, no modern concrete, no glass curtain wall, no city neon, no floating parts. Clean bottom contact plane, centered origin at the bottom, entrance or primary front faces positive Z. Closed watertight geometry where appropriate, readable silhouette from all sides, suitable for Three.js GLB export. PBR base color and metallic-roughness textures enabled.
```

## 建筑提示词

### ARCH-003 侧殿模块

```text
{{COMMON_PREFIX}}
A compact side hall, approximately 10 meters wide, 8 meters deep and 7 meters tall. Open front veranda, six dark timber columns, layered blue-green tiled roof with upturned eaves, pale plaster side walls, warm gray stone foundation and three shallow entrance steps. The interior must remain visible from the front and contain an empty floor for future props. Match the proportions and material mood of an older mountain temple rather than a palace.
{{COMMON_SUFFIX}}
```

### ARCH-004 直线回廊模块

```text
{{COMMON_PREFIX}}
A repeatable, tunnel-like covered temple walkway module. Its length along the Z axis is exactly 4 meters, its walkable width along the X axis is 2.6 meters, and its total height along the Y axis is 3.4 meters. BOTH Z END PLANES MUST BE COMPLETELY OPEN FROM FLOOR TO RAFTERS so a person can see and walk straight through the entire module. Absolutely no end wall, end panel, door, screen, railing, beam lattice or decorative obstruction may close either end. The two end cross-sections must be identical, flat and aligned so three copies placed end-to-end form one uninterrupted corridor. Use two parallel rows of dark timber columns, low wooden railings only along the two long sides, a muted blue-green tiled roof and a warm-gray stone walking floor. No plaster walls anywhere. Keep the geometry simple, symmetrical and explicitly modular rather than a standalone pavilion or room.
{{COMMON_SUFFIX}}
```

### ARCH-005 转角回廊模块

```text
{{COMMON_PREFIX}}
A ninety-degree L-shaped modular covered temple corridor corner, fitting exactly inside a 4 by 4 meter square footprint and matching the straight corridor module. One connection opening faces negative Z and the other faces positive X. BOTH CONNECTION END PLANES MUST BE COMPLETELY OPEN FROM STONE FLOOR TO RAFTERS, with no wall, panel, door, screen, railing or decorative obstruction crossing either opening. Each opening must be 2.6 meters wide, 3.4 meters tall, centered on its side, flat and geometrically identical to the straight corridor cross-section. Use one continuous right-angle stone walking floor, two parallel rows of dark timber columns following the L turn, low wooden railings only on the outer long edges, and one continuous muted blue-green tiled roof with a clean ninety-degree hip junction. A person must be able to enter from negative Z, turn left, and exit toward positive X without stepping or collision. This is a modular corridor connector, not a pavilion, room, gate or standalone shelter.
{{COMMON_SUFFIX}}
```

### ARCH-007 围墙转角模块

```text
{{COMMON_PREFIX}}
A precise ninety-degree L-shaped temple courtyard wall corner module, fitting exactly inside a 4 by 4 meter square footprint and matching the straight wall module. One wall arm extends toward negative Z and the other toward positive X; each arm is exactly 4 meters long, 0.45 meters deep and 2.6 meters tall, measured from the outside corner. Both exposed connection ends must be flat, vertical and geometrically identical to the straight wall cross-section so they join without gaps or overlap. Use a continuous warm-gray stone base, pale aged plaster middle, dark timber cap and muted blue-green tiled top with a clean mitered roof corner. Subtle moisture stains and moss only near the base. No gate, doorway, window, broken section, detached roof tile, foundation slab or surrounding ground. This is a repeatable wall connector, not a standalone decorative wall.
{{COMMON_SUFFIX}}
```

### ARCH-008 侧门模块

```text
{{COMMON_PREFIX}}
A compact secondary temple gate module, exactly 5 meters wide, 2 meters deep and 4.2 meters tall, designed to connect between courtyard wall modules. A centered rectangular walk-through opening at least 2.2 meters wide and 2.6 meters high must remain completely open from front to back, with no door leaf, screen, threshold obstacle or statue. Both left and right wall connection faces must be flat, vertical and match the straight wall cross-section at 2.6 meters tall. Use two dark timber posts, a restrained muted blue-green tiled gable roof, pale aged plaster side infill and a warm-gray stone base flush with the walking surface. Modest service entrance proportions, not a monumental main gate, pavilion or building. Front faces positive Z.
{{COMMON_SUFFIX}}
```

### ARCH-011 石阶模块

```text
{{COMMON_PREFIX}}
A modular exterior temple stair exactly 4 meters wide, 3 meters deep and 0.9 meters high. Five broad, evenly spaced warm-gray weathered stone steps rise along positive Z from ground level to a perfectly flat upper landing. The lowest and highest contact edges must be straight, horizontal and flush so the module can connect cleanly between terrain and a building foundation. Walking surface must remain broad and unobstructed for a third-person character. Subtle moss only in joints and side edges. No railings, balustrades, walls, gate, platform building, terrain mound, loose rocks or surrounding ground. This is a clean reusable stair connector, not a ceremonial monument.
{{COMMON_SUFFIX}}
```

### ARCH-006 围墙模块

```text
{{COMMON_PREFIX}}
A straight modular temple courtyard wall exactly 4 meters long, 0.45 meters deep and 2.6 meters tall. Warm gray stone base, pale aged plaster middle, dark timber cap and muted blue-green tiled top. Both ends are flat and aligned for seamless repetition. Subtle moisture stains and moss near the base, restrained wear, no broken sections.
{{COMMON_SUFFIX}}
```

### ARCH-009 竹林静坐亭

```text
{{COMMON_PREFIX}}
A small open meditation pavilion within a 6 by 6 meter footprint and about 5.5 meters tall. Eight slender timber columns, raised warm-gray stone platform, fully open sides, elegant single blue-green tiled roof, visible timber rafters, broad eaves and one shallow entrance step. Empty interior floor sized for four meditation cushions. Calm, simple and intimate rather than monumental.
{{COMMON_SUFFIX}}
```

### ARCH-010 石桥模块

```text
{{COMMON_PREFIX}}
A small pedestrian stone bridge approximately 4.5 meters wide and 7 meters long with a gentle arch rising no more than 1.1 meters. Weathered warm-gray stone slabs, low carved stone rails, subtle moss in joints, broad flat walking surface suitable for a third-person character. Both ends must meet ground level cleanly.
{{COMMON_SUFFIX}}
```

## 自然环境提示词规则

- 每个植物或岩石资产必须是一个可独立摆放的组合，而不是完整森林或完整山谷。
- 植物默认无透明卡片之外的大面积背景面。
- 同类资产至少生成两种轮廓，避免场景中明显复制。
- 高松和竹林必须从底部完整生成，不能在树干中间截断。

## 道具提示词规则

- 道具使用真实人类尺度，不把小道具生成成建筑。
- 灯具可以保留独立发光面，但不要把点光源烘焙成巨大发光球。
- 牌匾和石碑不生成文字，文字由网页运行时叠加。
- 钟、鼓和木鱼需要可独立旋转或动画的主体网格。

## 验收时替换规则

`{{COMMON_PREFIX}}` 和 `{{COMMON_SUFFIX}}` 在提交 API 前必须展开成完整文本；资产 ID 不发送给模型，只写入本地任务记录。
