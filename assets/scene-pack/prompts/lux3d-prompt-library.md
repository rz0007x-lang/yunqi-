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
A modular covered temple corridor exactly 4 meters long, 2.6 meters deep and 3.4 meters tall. Two open ends must align perfectly so repeated copies form one continuous walkway. Timber columns at both ends, waist-high wooden railing on the outer side, pale plaster wall or optional open inner side, blue-green tiled sloping roof, warm gray stone floor. Keep the end cross-sections simple and symmetrical for seamless repetition.
{{COMMON_SUFFIX}}
```

### ARCH-005 转角回廊模块

```text
{{COMMON_PREFIX}}
A ninety-degree modular covered temple corridor corner, fitting a 4 by 4 meter footprint and matching the straight corridor module. Continuous roof, aligned stone floor, consistent timber column spacing and railing height. Both connection ends must be open, centered and identical to the straight corridor cross-section.
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
