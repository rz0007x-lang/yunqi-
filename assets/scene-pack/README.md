# 云栖模块化场景资源包

## 入口

- `manifest.json`：全部资产的唯一 ID、尺寸、优先级和状态。
- `prompts/lux3d-prompt-library.md`：统一视觉前后缀和分资产提示词。
- `generation-batches/batch-01-architecture.json`：第一批五个建筑任务。
- `../../docs/epics/case-level-environment/visual-bible.md`：颜色、材质、比例和禁止项。
- `../../docs/epics/case-level-environment/map-layout.md`：连续寺院地图。

## 目录约定

正式资产完成后放到：

```text
assets/scene-pack/
├── source/<asset-id>/        # 原始 GLB、ZIP、生成记录
├── runtime/<asset-id>/       # 压缩后的正式 GLB 与 KTX2
├── previews/<asset-id>/      # 本地验收页和缩略图
├── prompts/                  # 提示词
└── generation-batches/       # 按批次执行的任务
```

运行时文件使用 `<asset-id>-<slug>-lodN.glb`，例如：

```text
arch-004-corridor-straight-lod0.glb
arch-004-corridor-straight-lod1.glb
arch-004-corridor-straight-lod2.glb
```

生成任务成功不代表资产完成；只有 `manifest.json` 中状态为 `accepted` 或 `integrated` 的资产才能进入正式场景。
