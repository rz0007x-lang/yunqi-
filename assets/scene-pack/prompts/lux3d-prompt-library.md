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

### ARCH-012 主殿闭合屋顶

```text
{{COMMON_PREFIX}}
One complete standalone traditional East Asian two-slope gable roof module, exactly 16.8 meters wide along X, 18.4 meters long along Z and approximately 3.0 meters high from the lowest eave to the ridge. It must have EXACTLY TWO long rectangular roof planes: one continuous left slope and one continuous right slope. It must have EXACTLY ONE straight central ridge running continuously along the Z axis from the front gable to the rear gable. BOTH left and right roof slopes must be fully present, symmetric, watertight and continuously tiled from this single central ridge down to their outer X-side eaves. This asset specifically repairs a hall whose entire right roof slope is missing, so no half roof, open side, cutaway, exploded section or transparent surface is acceptable.

Use dense overlapping muted blue-green ceramic roof tiles with individually readable rows, dark warm timber fascia, thick layered eaves, closed ridge caps and restrained upward-curving corners. The front and rear gable-end verge lines must be complete and symmetrical. The underside must include a coherent dark timber rafter and purlin grid spanning both slopes so the roof reads as structurally finished when viewed from inside the hall. All tiles, ridge pieces, fascia boards and rafters must connect into one physically plausible roof assembly. Subtle humid-night patina, small moss traces in tile seams and mild edge wear only; no holes, daylight gaps, missing rows or floating ornaments.

STRICT ROOF TYPOLOGY: simple longitudinal gable roof only. NO hipped roof, hip-and-gable roof, pyramidal roof, pavilion roof, four-slope roof, cross-gable roof, cross ridge, ridge along X, diagonal hip ridge, four quadrants, central peak or square canopy. In top view there must be only two continuous rectangular tile fields divided by one Z-axis ridge.

ROOF ONLY. No columns, walls, doors, windows, floor, foundation, stairs, room, temple building, lanterns, statue, people, text, logo, terrain or background. The lowest eave contact plane must be level and centered at the origin, with the front gable facing positive Z. Clean reusable overlay module, closed geometry, high-quality PBR tiles and timber, production-ready Three.js GLB.
{{COMMON_SUFFIX}}
```

### ARCH-013 山门单扇木门

```text
{{COMMON_PREFIX}}
A single functional traditional temple gate door leaf, exactly 2.25 meters wide, 0.18 meters thick and 3.8 meters tall, designed to be duplicated and mirrored into a symmetrical two-leaf closable main gate. One rigid rectangular dark warm timber leaf with thick vertical stiles, five horizontal rails, recessed plank panels, a complete reinforced hinge-side edge and a straight meeting edge. Add restrained aged-bronze round studs in an orderly grid and two compact bronze hinge straps fixed only to the hinge-side edge. The bottom and top edges must be straight, level and fully finished. Realistic joinery, readable plank grain, humid-night patina, worn bronze highlights and subtle darkening near the bottom.

DOOR LEAF ONLY. No gate frame, columns, wall, roof, threshold, floor, steps, handles crossing the center seam, second door leaf, environment or building. The front face looks toward positive Z. The hinge-side vertical edge must be on negative X so the runtime can place a pivot along that edge and swing the leaf open. Closed solid geometry, no window, lattice opening, broken plank or transparent panel. One connected production-ready movable door leaf with clean PBR timber and aged-bronze materials.
{{COMMON_SUFFIX}}
```

### ARCH-014 古庙山门单扇木门

```text
{{COMMON_PREFIX}}
One monumental single door leaf for a centuries-old secluded mountain temple, exactly 2.25 meters wide, 0.22 meters thick and 3.8 meters tall. It will be duplicated and mirrored into a two-leaf closable main gate, so the leaf must be rigid, rectangular, flat at the top and bottom, and structurally complete on every side. Use massive hand-hewn old-growth timber with deep readable grain, slightly uneven traditional plank widths, thick mortise-and-tenon perimeter stiles and three broad interior rails. The primary finish is very dark desaturated vermilion lacquer worn thin by decades of rain and touch, revealing warm brown wood at edges and lower panels. Add restrained blackened wrought-iron hinge straps on the negative-X hinge edge, hand-forged square nails, and one heavy aged-bronze ring knocker on a simple round backplate placed toward the positive-X meeting edge. The lower third has believable humid stains, tiny lacquer chips and subtle moss traces, but remains strong and maintained rather than ruined.

The design must feel like an authentic quiet ancient monastery gate, sober and heavy rather than an imperial palace door. Use deep recessed plank panels and simple traditional framing; no repeated gold stud grid, no bright red new paint, no glossy lacquer, no ornate dragon, no guardian face, no carved deity, no window, no lattice opening, no paper panel and no modern hardware. When mirrored, the positive-X meeting edge must remain perfectly straight and gap-free, and the two ring knockers must read as a balanced pair. The front face looks toward positive Z and the hinge-side vertical edge is negative X.

DOOR LEAF ONLY. No gate frame, columns, wall, roof, threshold, floor, steps, second leaf, environment, text, logo, people, statue, lantern or floating parts. Clean bottom contact plane, closed solid geometry, production-ready movable PBR door leaf for Three.js.
{{COMMON_SUFFIX}}
```

### ARCH-015 山中古庙石门单扇

```text
{{COMMON_PREFIX}}
One monumental functional stone door leaf for the main gate of the same secluded mountain temple complex, exactly 2.25 meters wide, 0.28 meters thick and 3.8 meters tall. It will be duplicated and mirrored into a symmetrical two-leaf closable gate, so create one rigid rectangular leaf with a perfectly straight positive-X meeting edge, a complete negative-X pivot edge, level top and bottom, and finished geometry on front, back and all four sides.

The entire door leaf is built from heavy warm-gray stone with a subtle muted green cast, matching the existing temple steps, courtyard paving, pond banks and arched stone bridge. Use three large fitted stone panels held inside a thick carved stone perimeter frame, shallow recessed borders, restrained hand-chiseled tool marks, small mineral color variation, dark humid joints, softly worn corners and very limited moss only in the lowest recesses. The stone must feel ancient, dense and load-bearing, with PBR roughness around 0.82 to 0.94: never white marble, polished granite, modern tile, concrete, plaster or painted wood. Add one simple aged-bronze ring pull on a compact circular backplate near the positive-X meeting edge and two restrained dark-bronze pivot collars on the negative-X side. Hardware must be secondary to the stone and naturally oxidized.

The design is sober, quiet and monastic rather than imperial or fantasy. No gold stud grid, dragon, guardian face, deity, lotus statue, text, rune, glowing symbol, window, lattice, paper panel, timber frame, visible wooden board, modern hinge, metal sci-fi panel or ornamental palace carving. No cracks large enough to look broken, no missing corner and no ruin damage. The mirrored pair must meet cleanly in the center and still read as two movable stone leaves.

STONE DOOR LEAF ONLY. No gate frame, columns, wall, roof, threshold, foundation slab, floor, steps, pedestal, second leaf, terrain, background, people, statue, lantern, plants or floating parts. Do not generate any base underneath the door. Front faces positive Z. Clean bottom contact edge, closed solid geometry, production-ready PBR stone asset for Three.js.
{{COMMON_SUFFIX}}
```

### ARCH-016 古庙一体式山门建筑

```text
{{COMMON_PREFIX}}
One complete monumental main-gate building for an old secluded mountain temple, designed as one coherent architectural composition with its closed double doors fully integrated into the timber structure. Overall target dimensions are 10.4 meters wide along X, 4.6 meters deep along Z and approximately 8.0 meters tall along Y. The front faces positive Z.

ARCHITECTURE: a broad warm-gray weathered stone base with no protruding platform, four massive dark warm-brown timber posts, a thick mortise-and-tenon lintel and beam frame, restrained old dougong brackets, pale aged plaster side bays, and one complete muted blue-green ceramic tiled gable roof. The roof has two continuous slopes, one central ridge running front-to-back, deep layered eaves, visible dark rafters and restrained upturned corners. Materials must match the existing temple complex: old timber with rough hand-rubbed grain, gray-green tiles, warm gray stone, humid stains and very limited moss near the bottom. Sober mountain-monastery proportions, not an imperial palace.

INTEGRATED DOUBLE DOORS: centered in the timber frame is a 4.5 meter wide by approximately 3.9 meter tall closed two-leaf gate. Each leaf is approximately 2.25 meters wide and must look purpose-built for this exact opening, sitting flush inside the same jambs and lintel with no pasted-on or floating appearance. Use the same centuries-old dark desaturated reddish-brown timber as the gate body, three deep recessed plank panels per leaf, thick perimeter stiles aligned with the surrounding frame, blackened wrought-iron hinge straps attached naturally to the outer jambs, and a balanced pair of aged-bronze ring knockers near the center seam. The two leaves must have a perfectly straight readable center seam, matching height, matching panel rhythm and physically plausible hinge axes. No modern frame around the doors and no material mismatch between doors and building.

PART-SEPARATION REQUIREMENT: although the asset is one complete assembled gate building, preserve three clearly separable connected components with clean physical gaps: (1) stationary gate building including roof, columns, side bays, jambs and lintel; (2) complete left door leaf; (3) complete right door leaf. The door leaves must not fuse, intersect or share bridge geometry with the stationary frame, floor, threshold or each other. Each leaf must be watertight and movable after semantic part splitting.

One complete gate building only. No stairs, approach road, courtyard floor, surrounding wall extensions, terrain slab, lanterns, statues, guardian figures, signs, text, logos, people, plants or second building. No bright new red paint, gold stud grid, dragon relief, neon, glass, modern metal door, detached door panel, open doorway, missing roof side or floating ornament. Clean flat bottom contact plane, closed production-ready PBR geometry for Three.js.
{{COMMON_SUFFIX}}
```

### ARCH-006 围墙模块

```text
{{COMMON_PREFIX}}
A straight modular temple courtyard wall exactly 4 meters long, 0.45 meters deep and 2.6 meters tall. Warm gray stone base, pale aged plaster middle, dark timber cap and muted blue-green tiled top. Both ends are flat and aligned for seamless repetition. Subtle moisture stains and moss near the base, restrained wear, no broken sections.
{{COMMON_SUFFIX}}
```

### ARCH-017 山门围墙短连接器

```text
{{COMMON_PREFIX}}
A short straight transition connector for the courtyard wall beside the monumental main gate of the same old secluded mountain temple. Exact target dimensions: 1.2 meters long along X, 0.60 meters deep along Z and 2.6 meters tall along Y. Front faces positive Z. This is a compact architectural connector, not a full wall run and not a gate building.

The connector must reproduce the exact architectural cross-section of the accepted straight courtyard wall: one continuous low warm-gray weathered stone base, a pale aged plaster middle wall with subtle humid discoloration, one dark desaturated warm-brown timber cap, and one complete muted blue-green ceramic tiled top with restrained shallow eaves on both positive-Z and negative-Z sides. The tile top, timber cap, plaster body and stone base must each run continuously from the negative-X end plane to the positive-X end plane without tapering, missing layers or floating pieces.

BOTH X ENDS MUST BE FLAT, VERTICAL, PARALLEL AND GEOMETRICALLY IDENTICAL. Every material layer must terminate flush on both end planes so one end can overlap slightly into the timber-and-plaster side bay of the existing gate and the other can overlap slightly into the existing ARCH-006 straight wall. Keep the silhouette sober, low and monastic, matching weathered dark timber, warm gray stone, pale old plaster and gray-green roof tiles already used by the temple. Use realistic PBR roughness, subtle moisture staining and very limited moss only near the base.

ONE CONNECTOR MODULE ONLY. No gate door, gate frame, large column, freestanding post, staircase, floor slab, terrain, long surrounding wall, corner turn, doorway, window, railing, lantern, sign, text, logo, people, plants, statue, broken section, detached roof tile or floating ornament. Do not add a foundation platform wider than the wall body. Clean flat bottom contact plane, closed watertight production-ready geometry for Three.js.
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

### ENV-010 池塘莲花组合

```text
{{ENV_PREFIX}}
A compact floating lotus cluster for the existing temple pond, approximately 1.6 meters wide along X, 1.2 meters deep along Z and no more than 0.45 meters tall above the water line. Create one natural asymmetrical composition containing one fully opened pale warm-pink lotus flower, one half-open flower, one upright closed bud, six to eight broad healthy lotus leaves in varied sizes and angles, and a few short curved stems descending just below the water line. The open flower must have layered individually modeled petals and a readable yellow seedpod center. Leaves should be muted deep jade green with subtle radial veins, slightly curled edges, realistic thickness, restrained wet sheen and a few natural imperfections.

All visible leaves and flowers must form one compact reusable cluster with a nearly flat water-contact plane at Y=0. The lowest short stems may extend no more than 0.12 meters below that plane. Use realistic botanical proportions and high-quality PBR materials suitable for a close third-person view. Keep the silhouette calm, sparse and elegant rather than a dense bouquet.

ONE LOTUS CLUSTER ONLY. No pond, no water surface or transparent water plane, no soil mound, no flower pot, no vase, no stone base, no wooden platform, no bridge, no fish, no insects, no lantern, no text, no logo, no people and no surrounding terrain. Do not add a rectangular support or floating display base. Production-ready closed geometry for Three.js.
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

### PROP-012 实体念珠

```text
{{PROP_PREFIX}}
One complete authentic Buddhist prayer-bead mala arranged as a relaxed oval loop on a flat surface, approximately 0.48 meters long, 0.34 meters wide and 0.055 meters high. Use exactly 108 small individually readable dark sandalwood beads threaded closely on one continuous cord, plus one slightly larger mother bead and a short restrained dark-umber silk tassel. Beads must be round but subtly hand-worn rather than perfectly plastic, with visible wood grain, small natural color variation and soft contact shadows between neighboring beads. The loop must lie naturally with mild irregularity and physical cord tension, suitable for placement on a low ritual table and for a subtle runtime rotation animation.

One isolated complete mala only. No hand, person, wrist, statue, bowl, box, table, floor, text, symbols, glowing halo, jewelry metal, giant beads, extra necklace or background. No floating beads, broken cord, fused solid ring or flat painted texture. Clean bottom contact plane, all beads and tassel physically connected, high-quality PBR wood and woven-fiber materials, production-ready Three.js GLB.
{{COMMON_SUFFIX}}
```

### PROP-013 实体木鱼

```text
{{PROP_PREFIX}}
One authentic medium temple wooden fish percussion instrument, approximately 0.58 meters wide, 0.42 meters deep and 0.38 meters tall, resting securely on one compact muted-rust circular brocade cushion. The wooden fish body is a single hollow carved dark reddish-brown hardwood form with the traditional rounded fish silhouette, a deep horizontal sounding slit, a clearly carved mouth, restrained scale and cloud relief, thick believable walls and a readable hollow interior at the slit. Use hand-rubbed lacquer with varied roughness, worn warm highlights on struck edges and visible carved wood grain. The cushion has believable woven fabric, piping and compression under the instrument.

Instrument and cushion only. No mallet, hand, monk, table, floor, temple room, text, logo, painted eyes, cartoon face, glowing parts, plastic surface, second instrument or background. The front faces positive Z and the bottom of the cushion is a clean flat contact plane. Closed physically plausible geometry with a strong functional silhouette, high-quality PBR lacquered wood and fabric, production-ready Three.js GLB.
{{COMMON_SUFFIX}}
```

### PROP-014 山门檐下灯笼

```text
{{PROP_PREFIX}}
One complete authentic hanging lantern for the front eave of an aged East Asian mountain-temple gate, approximately 0.44 meters wide, 0.44 meters deep and 0.78 meters tall excluding the hanging cord. Use a restrained hexagonal dark-red lacquered timber frame with slim aged-brass corner fittings, a shallow blue-green patinated metal top cap, a small lower finial and six warm ivory rice-paper panels. The paper must be translucent and softly warm when lit from a runtime point light, but must not contain a visible bulb, flame, baked bloom or solid glowing ball. Include one short centered dark woven hanging loop integrated into the top cap. Subtle rain wear, soot-darkened upper edges, rubbed brass highlights and realistic PBR roughness variation should match an old humid mountain temple at night. Strong readable silhouette from front, side and below; all frame members and paper panels remain physically connected.

Exactly one isolated hanging lantern only. No wall bracket, long chain, ceiling beam, temple building, floor, terrain, text, characters, tassel curtain, people, plants, second lantern, festival ornament, neon strip, giant glow, bright red plastic, glossy toy surface or background. Front faces positive Z, vertical axis is Y and the lantern is centered at the origin. Closed production-ready Three.js GLB with clean topology and high-quality PBR base-color and metallic-roughness textures.
{{COMMON_SUFFIX}}
```

## 验收时替换规则

`{{COMMON_PREFIX}}` 和 `{{COMMON_SUFFIX}}` 在提交 API 前必须展开成完整文本；资产 ID 不发送给模型，只写入本地任务记录。

## 角色品质升级

## 主殿英雄资产

### PROP-011 主殿佛像

```text
An original monumental seated Buddha statue created as the single ceremonial focal point of a quiet cyber-meditation hall. Respectful, serene and timeless rather than theatrical, kitsch or theme-park decoration. Approximately 2.9 meters wide, 1.75 meters deep and 4.1 meters tall including its pedestal, sized to stand on a 5.4 meter wide altar platform beneath a 6.7 meter roof. Calm symmetrical face with gently lowered eyes, clearly modeled eyelids, nose, lips and ears; natural cranial proportions and a restrained ushnisha silhouette. Both hands rest clearly in a stable meditation mudra above the crossed legs. Layered monastic robes wrap the shoulders, torso and seated legs with deep believable gravity folds, rolled cloth edges and readable thickness from front, side and back. The body must feel anatomically supported beneath the cloth, with no melted limbs, fused hands or hollow mask face.

Use aged dark bronze as the primary PBR material, with subtle warm-gold rubbed highlights on the face, hands and high robe folds, restrained green patina in recesses, and a softly weathered lotus pedestal in matching bronze over a dark warm-gray stone plinth. Add only a few extremely thin recessed jade-green emissive lines following selected lotus seams and lower robe folds; they must read as quiet embedded data traces, not neon armor. Strong elegant silhouette, production-quality sculptural detail, realistic metal roughness variation and ambient-occlusion depth, readable under warm altar light and cool moonlight.

Exactly one complete isolated statue with its lotus pedestal and low stone plinth. Front faces positive Z and the bottom is a clean flat contact plane centered at the origin. No temple, room, floor, background, altar table, incense, candles, offerings, monks, people, animals, text, symbols, logos, halo ring, floating parts, extra heads, extra arms, weapons, staff, jewelry overload, bright polished gold, glossy plastic, porcelain, marble-white skin or city neon. Do not copy a named real-world temple statue or a specific branded design. Closed watertight geometry, clean silhouette from all sides, high-quality PBR base-color and metallic-roughness textures, production-ready Three.js GLB.
```

### CHAR-001 小和尚基础角色

```text
An original full-body stylized young East Asian novice monk character for a quiet mountain-temple meditation world. High-quality feature-animation character design rather than a toy, mascot, primitive doll or game icon. Use a standard humanoid rig-compatible body at about 1.55 meters tall and roughly 5.5 heads high; the character can be scaled smaller later in the game. Keep a youthful gentle shaved head, short neck, narrow relaxed shoulders, compact torso, naturally proportioned hands and bare feet. Calm gentle face with subtle eyelids, small realistic ears, a restrained nose and mouth, warm natural skin with soft subsurface-like shading, no plastic shine and no exaggerated smile. Layered traditional robe construction: a fitted desaturated ochre-brown inner robe clearly following the torso and separated legs, plus a muted warm-umber outer kasaya crossing diagonally over the torso and ending close to the waist. Believable fabric thickness, stitched hems, soft gravity-driven folds and slight tonal wear at the lower edge. No glowing body, no jade skin and no cyber armor; only one tiny dark-jade cloth knot at the waist may echo the world palette.

STRICT AUTO-RIG ELIGIBILITY IS THE HIGHEST PRIORITY. Neutral symmetric T-pose, standing upright and facing positive Z. Both arms extend sideways at 85 to 90 degrees from the torso, elbows nearly straight, wrists neutral, palms facing down, all five fingers readable. There must be clear empty air under both armpits and between both arms and the robe. The outer kasaya may drape over the chest and back but MUST NOT form any cloth bridge, cape triangle or web connecting an arm to the torso. Feet shoulder-width apart and flat on one clean ground plane. Both leg silhouettes, knees and ankles must remain individually readable; no robe surface may bridge across both legs below the crotch. Symmetrical base body with standard human shoulder, elbow, wrist, hip, knee and ankle positions, clean deformation-friendly limb silhouettes, closed watertight geometry and no floating cloth pieces. High-quality PBR skin and woven-cloth materials, production-ready Three.js GLB, readable from front, side and back.

Exactly one isolated character. No pedestal, floor, environment, temple, halo, staff, beads, bowl, hat, shoes, text, logo, second person, extra arms, fused fingers, mitten hands, oversized baby head, spherical primitive body, glossy vinyl, porcelain, wax, stone or metallic skin. Do not use a poncho, cape, blanket, wing-like sleeve or one-piece skirt that hides the standard humanoid limb topology.
```
