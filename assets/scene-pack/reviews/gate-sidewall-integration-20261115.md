# 山门侧门式嵌墙验收

日期：2026-11-15  
版本：`gate-sidewall-integrated-1`  
结论：通过

## 修改方案

- 参考现有侧门的构造关系，将主山门作为围墙中的完整门楼，而不是在门楼两侧追加短连接器。
- 移除场景中的 ARCH-017 左右连接件；ARCH-006 直墙改为左右各三段，中心分别为 X=-5.25/-9.25/-13.25 与 X=5.25/9.25/13.25，直接嵌入 ARCH-016 两侧。
- 从 ARCH-016 固定建筑中拆出 `gate-floor-platform` 节点，运行时仅将其 X 向缩放为 0.69，使门下台基止于门柱附近，不再向左右围墙延伸。
- 保留 `gate-door-left` 与 `gate-door-right` 节点及原有开合动画。

## 资产与运行时

- 拆分源：`assets/scene-pack/source/ARCH-016/ARCH-016-platform-split.glb`
- 运行时：`assets/scene-pack/runtime/lod1/ARCH-016/ARCH-016.glb`
- 拆分后固定建筑 101,191 triangles，台基 8,381 triangles；LOD1 共 95,353 triangles。
- 本次使用已有资产本地拆分与重排，未消耗新的 Lux3D 额度。

## 浏览器验收

- 山门正面：左右墙檐、墙身与门楼侧柱连续，未出现独立短墙、漏缝或墙体切入门洞。
- 云庭背面：围墙直接接到门楼两侧，台基终止于门柱范围内，没有左右伸出的木质地板。
- 开门与连续通行正常；角色从山门进入云庭后可回看门楼背面。
- 控制台无 warning 或 error。
