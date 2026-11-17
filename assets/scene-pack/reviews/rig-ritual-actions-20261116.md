# 小和尚四项仪式骨骼动画

日期：2026-11-16  
版本：`rig-ritual-actions-3`

## 动作映射

| 点击项 | 骨骼动画 | 身体表现 | 法器联动 |
| --- | --- | --- | --- |
| 合掌 | `Ritual_Gassho` | 双臂收拢、前臂内旋、双手合于胸前、轻微低头 | 无 |
| 礼拜 | `Ritual_Temple_Bow` | 先合掌，再由脊柱三段前倾并低头，最后回正 | 无 |
| 念珠 | `Ritual_Prayer_Beads` | 双手托于胸腹之间，右腕与拇指、食指连续拨珠 | 转动念珠模型并累计 108 念 |
| 木鱼 | `Ritual_Wooden_Fish` | 左手收稳，右肩、前臂和手腕完成两次克制敲击 | 木鱼槌与声音同步 |

合掌时间轴：0–0.42 秒抬手合掌，0.42–2.42 秒保持完整姿势，2.42–3.15 秒自然放下；稳定保持时间为整 2 秒。

## 技术方案

- 继续使用 Lux3D `CHAR-001` 的 52-joint Mixamo 骨架，不重新建模或绑骨。
- AHOLO 预设重定向动作库没有上述四项佛教仪式动作，因此没有使用不匹配的通用交互或攻击动作。
- 四项动作使用 `QuaternionKeyframeTrack` 组成正式 `AnimationClip`，由角色自己的 `AnimationMixer` 播放。
- 采用 additive blend，可叠加在待机或坐姿循环上；每段首尾为零偏移，动作结束后自然回到基础状态。
- 触发动作时终止行走和路径目标，避免人物边走边礼拜或敲木鱼。
- 程序化角色兜底也补齐念珠动作，模型加载失败时交互不失效。

## 校验

- 已验证 52 joints 和 SkinnedMesh 存在。
- 已用 Three.js 0.181.1 验证 `geometry_0.bones[mixamorig:LeftArm].quaternion` 轨道可正确绑定并驱动骨骼。
- 诊断信息新增 `rigBoneCount` 与 `rigActions`，用于浏览器确认实际加载的是绑骨角色与四项动作。

## 运行时骨骼名修复

- 第一版轨道按 GLB 原始节点名 `mixamorig:LeftArm` 建立，但 Three.js `GLTFLoader` 会通过 `PropertyBinding.sanitizeNodeName` 将冒号删除，运行时实际名称为 `mixamorigLeftArm`，导致按钮触发但关键帧没有绑定到骨骼。
- 第二版先遍历实际加载后的 Skeleton，将 `mixamorigLeftArm`、`mixamorigRightForeArm` 等名称反向映射为动作骨骼，再用真实名称创建轨道。
- 轨道创建时若缺少任一所需骨骼会直接抛出明确错误，不再静默播放空动作。
- 诊断信息新增 `rigTrackTargets`，可确认页面实际使用的是 `geometry_0.bones[mixamorigLeftArm].quaternion` 一类运行时目标。
- 第一人称模式点击仪式动作时会自动回到第三人称跟随，避免角色因第一人称隐藏而看不到自身动作。
- 桌面端念珠与木鱼实物弹窗移至画面右侧，并降低遮罩不透明度，让角色身体动作与实物交互能够同时看到。
