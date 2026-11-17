# ARCH-016 古庙一体式带门山门建筑

- 当前状态：已生成、门扇拆分、LOD、接入并通过浏览器验收
- Lux3D 任务：`7999095`
- 源模型：`assets/scene-pack/source/ARCH-016/ARCH-016.glb`
- 可开合拆分源：`assets/scene-pack/source/ARCH-016/ARCH-016-split.glb`
- 可开合与台基拆分源：`assets/scene-pack/source/ARCH-016/ARCH-016-platform-split.glb`
- 运行时 LOD1：`assets/scene-pack/runtime/lod1/ARCH-016/ARCH-016.glb`
- 运行时 LOD2：`assets/scene-pack/runtime/lod2/ARCH-016/ARCH-016.glb`

## 生成与结构

- 原始模型为同一次生成得到的完整建筑：青灰瓦屋顶、斗拱、旧木柱、门框、双扇木门和石台基共用统一造型与材质语言。
- 原始 GLB：15,426,420 bytes，116,292 triangles，包围盒 5.419 × 5.5 × 3.798。
- 云端部件拆分因额度不足未创建任务；改用本地连通组件与门洞空间识别，未重新生成材质，也未拼接第二套门资产。
- 本地拆分：固定建筑 109,572 triangles，左门 3,321 triangles，右门 3,399 triangles；源空间门轴 X=-1.299 / 1.351。
- 节点：`gate-building-fixed`、`gate-door-left`、`gate-door-right`、`gate-floor-platform`；左右门扇围绕外侧门轴开合，门下台基可独立调整宽度。

## 运行时

- 场景尺寸归一化为 10.4 × 7.6 × 4.8 m，中心 Z=25.2 m，底部 Y=0.06 m。
- LOD1：2,282,912 bytes，95,357 triangles，Meshopt 几何与 WebP 纹理。
- LOD2：975,632 bytes，60,467 triangles，Meshopt 几何与 WebP 纹理。
- 山门视角门扇闭合；切换云庭或大殿时门扇打开。
- `gate-floor-platform` 的 X 向缩放为 0.69，使台基收在门柱范围内，不再伸入左右围墙。

## 浏览器验收

- 闭合正面中，屋顶、斗拱、柱身、门框和双扇门构成一个完整古庙山门，未再出现独立门板后贴感。
- `gateDoors=true`；闭合态 `gateDoorOpen=0`，云庭态 `gateDoorOpen=1`。
- 门体、门环和门框材质连续，石台基与现有石阶对齐；无旧版开放壳体和独立 `ARCH-014` 门扇叠加。
- 两侧 ARCH-006 围墙按侧门式方案直接嵌入山门侧身；不再使用独立短连接器，正面及院内背面均无漏缝。
