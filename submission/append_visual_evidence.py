from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

root = Path(__file__).resolve().parent
source = root / '项目报告书_云栖电子禅堂.docx'
output = root / '项目报告书_云栖电子禅堂_截图补充版.docx'
gallery = root / 'asset-gallery'
reviews = root.parent / 'assets/scene-pack/reviews'
video = root / 'video-work'
doc = Document(source)

def picture(path, caption, width=15.3):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.keep_with_next = True
    p.add_run().add_picture(str(path), width=Cm(width))
    p = doc.add_paragraph(caption)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(8)
    for run in p.runs:
        run.font.size = Pt(9)

def page(title, intro, figures):
    doc.add_page_break()
    doc.add_heading(title, level=1)
    if intro:
        doc.add_paragraph(intro)
    for path, caption, width in figures:
        picture(path, caption, width)

page('附录一 山门资产迭代', '完整门楼候选与门楼、院墙的集成效果。两张图的取景距离不同，主要用于展示迭代阶段与实际衔接，不能作严格同视角对照。', [
    (reviews/'gate-wall-lux3d-complete-1.png', '完整门楼候选：门体与门楼统一，侧墙连接仍需适配。', 14),
    (reviews/'gate-sidewall-integrated-proof.png', '场景集成：门楼与左右院墙衔接，门下台基收窄。', 14)])
page('附录二 场景效果', '以下为项目留存的运行截图和演示视频关键帧。', [
    (reviews/'pond-lotus-cleanup-proof.png', '云庭：石桥、池塘及莲花；清理桥边遮挡物后的验收画面。', 7),
    (reviews/'continuous-walk-hall-proof.png', '连续行走进入大殿后的画面。', 7)])
page('附录三 大殿与壁画', '', [
    (video/'final-hall.png', '演示视频关键帧：大殿、角色、香炉与佛像。', 15),
    (root.parent/'assets/scene-pack/textures/hall-mythic-mural-v1.png', '大殿原创壁画贴图；单独展示原始图像。', 15)])
page('附录四 仪式交互', '以下为演示视频中的静态关键帧，动作和声音效果需结合视频观察。', [
    (video/'qa-050.png', '合掌：角色与大殿场景。', 13.5),
    (video/'qa-057.png', '礼拜：角色前倾动作。', 13.5)])
page('仪式交互 道具与静坐', '', [
    (video/'qa-084.png', '念珠：三维道具预览与计数。', 12.5),
    (video/'qa-101.png', '木鱼：三维道具预览与敲击入口。', 12.5),
    (video/'qa-113.png', '静坐计时界面。', 12.5)])

groups = [
 ('附录五 角色与核心资产', [('01-char-001-final.png','CHAR-001 小和尚：绑骨模型，以 T-Pose 展示。'),('02-prop-011-buddha.png','PROP-011 黄铜佛像：大殿主视觉资产。')]),
 ('建筑资产 山门与屋顶', [('03-arch-012-roof-final.png','ARCH-012 大殿闭合屋顶，通过版。'),('04-arch-016-gate-integrated.png','ARCH-016 一体化木山门。')]),
 ('建筑资产 回廊', [('05-arch-004-corridor-final.png','ARCH-004 直回廊：重生成后的开放端头版本。'),('06-arch-005-corner-corridor.png','ARCH-005 转角回廊：俯视展示 L 形布局。')]),
 ('建筑资产 围墙与侧门', [('07-arch-006-wall.png','ARCH-006 院墙模块。'),('08-arch-008-side-gate.png','ARCH-008 庭院侧门模块。')]),
 ('建筑与环境 石桥和山石', [('09-arch-010-stone-bridge.png','ARCH-010 石拱桥。'),('10-env-001-rock.png','ENV-001 山石组合。')]),
 ('自然环境 竹林与迎风松', [('11-env-003-bamboo.png','ENV-003 高竹组合。'),('12-env-006-pine-final.png','ENV-006 迎风松重试版。')]),
 ('自然环境与仪式道具', [('13-env-010-lotus.png','ENV-010 莲花组合。'),('14-prop-012-prayer-beads.png','PROP-012 实体念珠。')]),
 ('仪式道具 木鱼与灯笼', [('15-prop-013-wooden-fish.png','PROP-013 实体木鱼。'),('16-prop-014-lantern.png','PROP-014 山门檐下灯笼。')]),
 ('附录六 被淘汰候选 回廊与屋顶', [('17-rejected-arch-004-closed-end.png','ARCH-004 首轮：一端被墙封闭，无法满足连续拼接。'),('18-rejected-arch-012-hipped-roof.png','ARCH-012 首轮：屋顶形制未满足目标，后重生成。')]),
 ('被淘汰候选 石门与松树', [('19-rejected-arch-015-stone-gate.png','ARCH-015 石门候选：用户选择沿用古木门方案。'),('20-rejected-env-006-white-pine.png','ENV-006 首轮：松针颜色偏白，重生成后采用更深的色调。')]),
]
for i, (title, figures) in enumerate(groups):
    intro = '单体图由项目留存的 GLB 在资产验收台重新渲染，展示模型和生成候选；并非生成当时的历史截图。左上角为模型文件名和原始包围盒。' if i == 0 else ''
    page(title, intro, [(gallery/name, caption, 14) for name, caption in figures])

doc.save(output)
print(output)
