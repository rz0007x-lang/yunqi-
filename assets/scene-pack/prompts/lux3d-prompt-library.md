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

## 自然环境前缀

```text
Original natural environment asset for a quiet East Asian mountain-temple cyber-meditation world. Humid night atmosphere, warm-gray weathered rock, dark wet crevices, muted moss green and restrained natural color variation. Realistic human scale, physically plausible growth or erosion, high-quality PBR materials, production-ready game asset. The digital/cyber influence is nearly invisible and must not change the natural silhouette.
```

### ENV-007 水池边缘模块

```text
{{ENV_PREFIX}}
A reusable slightly curved temple pond-bank module exactly 4 meters long along the X axis, 2 meters deep along the Z axis and no more than 0.6 meters high. The water-facing edge is positive Z and follows one smooth shallow concave curve; the dry courtyard side is negative Z and remains mostly straight. Build the bank from fitted warm-gray weathered stone slabs with a low natural rock lip, dark damp joints and subtle moss only close to the water line. BOTH X END CUTS MUST BE FLAT, VERTICAL, IDENTICAL AND COMPLETELY CLEAR so several copies can join end-to-end without gaps, caps, rocks or vegetation blocking the seam. The upper dry strip must remain walkable and nearly level. No water surface, no stream, no bridge, no railing, no lantern, no loose rock pile, no plants, no surrounding ground plane. This is one modular bank segment, not a complete pond or landscape diorama.
{{COMMON_SUFFIX}}
```

### ENV-001 近景岩壁

```text
{{ENV_PREFIX}}
A self-contained near-field mountain rock-wall formation approximately 12 meters wide, 6 meters deep and 9 meters tall. The primary visible cliff face looks toward positive Z and has a strong asymmetric silhouette with three large overlapping geological masses, layered fractured stone, narrow shadowed cracks and a stable broad base. THE ENTIRE FRONT MUST BE A CONTINUOUS SOLID OPAQUE ROCK SURFACE: absolutely no hole, cave, arch, tunnel, doorway, window, circular void, pass-through gap or large negative space anywhere. All major rock masses must overlap or fuse so they never outline an arch. Warm-gray metamorphic rock with darker damp hairline recesses, restrained moss in protected cracks and very small traces of lichen. The upper silhouette must be irregular but structurally believable, suitable for framing a temple courtyard camera at close range. The back may be simpler but must remain closed and stable. No waterfall, river, stairs, temple, shrine, statue, tree, bamboo, separate boulders, sky backdrop or surrounding terrain slab. One isolated solid rock-wall asset only.
{{COMMON_SUFFIX}}
```

### ENV-003 高竹组合

```text
{{ENV_PREFIX}}
A complete reusable cluster of tall mountain bamboo contained within a 3 by 3 meter footprint and approximately 7 meters tall. Include 11 to 15 individual bamboo culms emerging visibly from the bottom contact plane, with varied diameter, height and gentle lean. Use muted deep-green and olive culms with readable segmented joints, a few young shoots, and layered narrow leaves concentrated mainly in the upper two-thirds. The cluster must have an asymmetric natural silhouette with one open side so it can frame a walkway without becoming a solid wall. Every stalk must be continuous from its visible root base to its top; no stalk may be cut off mid-trunk. No planter, pot, fence, rock pedestal, soil mound, square ground card, temple object or complete forest. Avoid crossed random poles and avoid oversized broad leaves.
{{COMMON_SUFFIX}}
```

### ENV-006 迎风松树

```text
{{ENV_PREFIX}}
A complete old windswept mountain pine approximately 7 meters wide, 5 meters deep and 8 meters tall. One thick weathered trunk emerges visibly from the bottom contact plane, leans gently toward negative X, then divides into several twisting horizontal branches swept mostly toward positive X by prevailing wind. Layered sparse cloud-like needle clusters create a strong asymmetrical silhouette with intentional open negative space. The bark must remain dark warm brown with readable fissures. EVERY NEEDLE CLUSTER MUST BE CLEARLY DEEP NATURAL PINE GREEN OR MUTED OLIVE GREEN, with at least two green value levels and only very small cool highlights. Absolutely no white, silver, gray, ivory, crystal, snow-covered, frosted or untextured foliage; the crown must read unmistakably as healthy green pine needles under neutral light. Subtle moss only on the lower trunk. The entire trunk and root flare must be present; nothing may be cut off at the base or crown. No planter, pot, rock pedestal, soil mound, square ground card, shrine, lantern, hanging ornament, separate tree, forest backdrop or floating branches.
{{COMMON_SUFFIX}}
```

## 道具提示词规则

- 道具使用真实人类尺度，不把小道具生成成建筑。
- 灯具可以保留独立发光面，但不要把点光源烘焙成巨大发光球。
- 牌匾和石碑不生成文字，文字由网页运行时叠加。
- 钟、鼓和木鱼需要可独立旋转或动画的主体网格。

## 道具前缀

```text
Original temple prop for a quiet East Asian mountain-temple cyber-meditation world. Traditional craft, realistic human scale, restrained weathering, humid night patina, high-quality PBR materials and a clear production-ready game silhouette. Match dark warm timber, warm-gray stone, aged bronze, muted cloth and tiny jade-green emissive accents only where explicitly requested. The object must read as an authentic functional temple furnishing rather than fantasy architecture or a souvenir.
```

### PROP-001 石灯

```text
{{PROP_PREFIX}}
A complete freestanding Japanese-influenced mountain-temple stone lantern, 0.7 meters wide, 0.7 meters deep and 1.8 meters tall. Broad stable weathered stone foot, tapered shaft, small square lamp chamber with four open windows and a restrained pagoda-like stone cap. Warm-gray granite, darker damp joints and subtle moss near the foot. Keep the lamp chamber hollow and readable so a runtime light can be placed inside. No flame, glowing ball, pedestal terrain, shrine, plants, text or second lantern.
{{COMMON_SUFFIX}}
```

### PROP-002 木制引路灯

```text
{{PROP_PREFIX}}
A slender freestanding wooden temple path lantern, 0.5 meters square and 2.1 meters tall. One dark timber post on a compact stone shoe supports a rectangular framed lantern box with translucent warm paper panels, shallow blue-green tiled cap and a tiny jade-green geometric inset below the box. The light panels may have very faint emissive material but no visible bulb or giant glow. Stable base, clean silhouette, no sign text, hanging cables, terrain, plants or second lantern.
{{COMMON_SUFFIX}}
```

### PROP-003 香炉

```text
{{PROP_PREFIX}}
A complete ceremonial incense burner approximately 1.6 meters wide, 1.1 meters deep and 1.3 meters tall. A broad aged-bronze rectangular basin with two restrained side handles, low relief cloud motifs without text, four short sturdy legs and a separate shallow ash tray visible inside. Dark oxidized bronze with rubbed warm highlights and subtle green patina. No incense sticks, smoke, fire, offerings, altar, statue, terrain or duplicate object.
{{COMMON_SUFFIX}}
```

### PROP-004 寺院钟

```text
{{PROP_PREFIX}}
A complete freestanding temple bell assembly approximately 1.8 meters wide, 1.8 meters deep and 2.2 meters tall. One large aged-bronze hanging bell with a thick readable rim and restrained horizontal bands, suspended from a compact dark timber A-frame crossbeam. The bell body must be a distinct centered mesh with clear space around it for animation. Dark bronze with subtle green patina, warm worn rim and blackened timber. No rope, striker log, pavilion, text, statue, terrain or second bell.
{{COMMON_SUFFIX}}
```

### PROP-005 仪式鼓

```text
{{PROP_PREFIX}}
A complete freestanding ritual barrel drum approximately 1.6 meters wide, 1.2 meters deep and 1.8 meters tall. One horizontal dark red-brown wooden drum with taut muted parchment heads and a restrained ring of bronze studs, supported by a sculptural but stable dark timber cradle. The drum body must remain visually separate from the stand for animation. No drumsticks, people, text, painted dragon, pavilion, terrain or second drum.
{{COMMON_SUFFIX}}
```

### PROP-006 供桌

```text
{{PROP_PREFIX}}
A low traditional temple offering table exactly 2.4 meters wide, 0.9 meters deep and 1.1 meters tall. Dark warm timber, thick rectangular top, four sturdy slightly tapered legs, simple recessed apron panels and restrained aged brass corner fittings. Empty top surface with enough clear area for runtime objects. No offerings, candles, incense, statue, text, cloth, surrounding floor or duplicate table.
{{COMMON_SUFFIX}}
```

### PROP-007 原创石碑

```text
{{PROP_PREFIX}}
An original uninscribed courtyard stone stele approximately 1.2 meters wide, 0.5 meters deep and 2.4 meters tall. A single asymmetrical vertical warm-gray stone slab with a softly broken natural top, mounted in a compact rectangular stone socket base. The front must remain mostly flat and blank for runtime lettering, with only a thin recessed jade-green circuit-like border that never forms readable symbols. Damp streaks and subtle moss near the base. No carved characters, logos, statue, terrain, plants or second slab.
{{COMMON_SUFFIX}}
```

### PROP-008 蓄水陶缸

```text
{{PROP_PREFIX}}
A complete large temple courtyard water jar approximately 1.1 meters in diameter and 1.2 meters tall. Broad rounded dark charcoal ceramic body, thick open rim, slightly narrowed foot, restrained hand-thrown irregularity and a few muted blue-green glaze runs. The interior opening must be visible and dark, suitable for a runtime water plane. No water overflow, ladle, pedestal, plants, text, terrain or second jar.
{{COMMON_SUFFIX}}
```

### PROP-009 木制区域牌

```text
{{PROP_PREFIX}}
A freestanding wooden temple wayfinding sign approximately 1.6 meters wide, 0.3 meters deep and 1.8 meters tall. Two dark timber posts on small stone shoes support one horizontal framed wooden signboard. The signboard front must be completely blank, flat and unobstructed for runtime text, with a thin muted jade-green inset line around the edge. A shallow blue-green tiled rain cap protects the board. No letters, symbols, arrows, logo, lantern, terrain, plants or duplicate sign.
{{COMMON_SUFFIX}}
```

### PROP-010 禅修坐垫

```text
{{PROP_PREFIX}}
A single low rectangular meditation cushion exactly 0.9 meters wide, 0.75 meters deep and 0.14 meters high. Dense muted rust-brown woven fabric, softly rounded corners, subtle central depression and restrained edge piping. Slight realistic compression while retaining a clean rectangular footprint. No person, floor mat, embroidery, symbols, text, tassels, glowing halo, terrain or second cushion.
{{COMMON_SUFFIX}}
```

## 验收时替换规则

`{{COMMON_PREFIX}}` 和 `{{COMMON_SUFFIX}}` 在提交 API 前必须展开成完整文本；资产 ID 不发送给模型，只写入本地任务记录。
