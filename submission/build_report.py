from pathlib import Path
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "submission" / "项目报告书_云栖电子禅堂.docx"
REVIEWS = ROOT / "assets" / "scene-pack" / "reviews"
TEXTURES = ROOT / "assets" / "scene-pack" / "textures"

NAVY = "18332C"
JADE = "3C7967"
PALE = "E9F0ED"
WARM = "F3EFE7"
INK = RGBColor(31, 42, 38)
MUTED = RGBColor(92, 105, 99)
BODY_FONT = "Hiragino Sans GB"


def apply_font(run, name=BODY_FONT):
    run.font.name = name
    r_fonts = run._element.get_or_add_rPr().get_or_add_rFonts()
    for key in ("ascii", "hAnsi", "eastAsia", "cs"):
        r_fonts.set(qn(f"w:{key}"), name)


def clear_paragraph_borders(paragraph):
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is not None:
        p_pr.remove(p_bdr)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=110, start=130, bottom=110, end=130):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for name, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{name}"))
        if node is None:
            node = OxmlElement(f"w:{name}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_cell_text(cell, text, bold=False, color=INK, size=9.2):
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.08
    run = p.add_run(text)
    run.bold = bold
    apply_font(run)
    run.font.size = Pt(size)
    run.font.color.rgb = color
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    set_cell_margins(cell)


def add_page_number(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = "PAGE"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    run._r.extend([begin, instr, end])


def add_caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)
    r = p.add_run(text)
    r.font.size = Pt(8.5)
    r.font.color.rgb = MUTED
    r.italic = True
    return p


def add_picture(doc, path, width, caption=None):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(0)
    p.add_run().add_picture(str(path), width=width)
    if caption:
        add_caption(doc, caption)


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.space_after = Pt(4)
        p.add_run(item)


def add_numbered(doc, items):
    for index, item in enumerate(items, 1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Cm(0.15)
        p.paragraph_format.first_line_indent = Cm(-0.15)
        p.paragraph_format.space_after = Pt(4)
        p.add_run(f"{index}.  {item}")


def add_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.style = "Table Grid"
    set_repeat_table_header(table.rows[0])
    for i, header in enumerate(headers):
        set_cell_text(table.rows[0].cells[i], header, True, RGBColor(255, 255, 255), 9)
        set_cell_shading(table.rows[0].cells[i], NAVY)
        if widths:
            table.rows[0].cells[i].width = widths[i]
    for row_index, row in enumerate(rows):
        cells = table.add_row().cells
        for i, value in enumerate(row):
            set_cell_text(cells[i], str(value), False, INK, 8.8)
            if row_index % 2 == 1:
                set_cell_shading(cells[i], "F5F7F6")
            if widths:
                cells[i].width = widths[i]
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def add_section_title(doc, title, kicker=None):
    if kicker:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(kicker.upper())
        r.font.size = Pt(8)
        r.font.bold = True
        r.font.color.rgb = RGBColor(60, 121, 103)
        r.font.letter_spacing = Pt(1)
    doc.add_heading(title, level=1)


doc = Document()
section = doc.sections[0]
section.page_width = Cm(21)
section.page_height = Cm(29.7)
section.top_margin = Cm(1.65)
section.bottom_margin = Cm(1.55)
section.left_margin = Cm(1.8)
section.right_margin = Cm(1.8)
section.header_distance = Cm(0.6)
section.footer_distance = Cm(0.6)

styles = doc.styles
normal = styles["Normal"]
normal.font.name = BODY_FONT
normal._element.rPr.rFonts.set(qn("w:ascii"), BODY_FONT)
normal._element.rPr.rFonts.set(qn("w:hAnsi"), BODY_FONT)
normal._element.rPr.rFonts.set(qn("w:eastAsia"), BODY_FONT)
normal.font.size = Pt(10.2)
normal.font.color.rgb = INK
normal.paragraph_format.line_spacing = 1.25
normal.paragraph_format.space_after = Pt(6)

for style_name, size, color, before, after in (
    ("Title", 30, INK, 0, 8),
    ("Subtitle", 12, MUTED, 0, 8),
    ("Heading 1", 21, INK, 4, 9),
    ("Heading 2", 13.5, RGBColor(45, 83, 71), 9, 5),
    ("Heading 3", 11, INK, 7, 3),
):
    style = styles[style_name]
    style.font.name = BODY_FONT
    style._element.rPr.rFonts.set(qn("w:ascii"), BODY_FONT)
    style._element.rPr.rFonts.set(qn("w:hAnsi"), BODY_FONT)
    style._element.rPr.rFonts.set(qn("w:eastAsia"), BODY_FONT)
    style.font.size = Pt(size)
    style.font.color.rgb = color
    style.paragraph_format.space_before = Pt(before)
    style.paragraph_format.space_after = Pt(after)
    style.paragraph_format.keep_with_next = True

title_p_pr = styles["Title"]._element.get_or_add_pPr()
title_border = title_p_pr.find(qn("w:pBdr"))
if title_border is not None:
    title_p_pr.remove(title_border)

for list_name in ("List Bullet", "List Number"):
    styles[list_name].font.name = BODY_FONT
    styles[list_name]._element.rPr.rFonts.set(qn("w:ascii"), BODY_FONT)
    styles[list_name]._element.rPr.rFonts.set(qn("w:hAnsi"), BODY_FONT)
    styles[list_name]._element.rPr.rFonts.set(qn("w:eastAsia"), BODY_FONT)
    styles[list_name].font.size = Pt(10)

header = section.header.paragraphs[0]
header.text = "AHOLO 3D 黑客松  ·  项目报告书"
header.style = styles["Normal"]
header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
header.runs[0].font.size = Pt(7.5)
header.runs[0].font.color.rgb = INK
footer = section.footer.paragraphs[0]
footer.add_run("云栖电子禅堂  |  ").font.size = Pt(8)
add_page_number(footer)

doc.core_properties.title = "云栖电子禅堂项目报告书"
doc.core_properties.subject = "Aholo 3D 黑客松参赛材料"
doc.core_properties.author = "参赛团队待填写"

# Cover
p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(14)
p.paragraph_format.space_after = Pt(4)
r = p.add_run("AHOLO 3D HACKATHON")
r.font.size = Pt(9)
r.font.bold = True
r.font.color.rgb = RGBColor(60, 121, 103)
r.font.letter_spacing = Pt(1.5)

p = doc.add_paragraph(style="Title")
p.add_run("云栖电子禅堂项目报告书")
clear_paragraph_borders(p)
p = doc.add_paragraph(style="Subtitle")
p.add_run("基于 Aholo Lux3D 的 AI 3D 可漫游静修空间")

add_picture(doc, REVIEWS / "gate-sidewall-integrated-proof.png", Inches(6.55), "作品当前实机画面：山门、围墙、角色与交互界面")

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(8)
p.paragraph_format.space_after = Pt(10)
r = p.add_run("用生成式 3D 资产搭建一座可以走进去、坐下来并完成东方仪式动作的网页寺院。")
r.font.size = Pt(12)
r.font.color.rgb = RGBColor(45, 83, 71)

meta = add_table(
    doc,
    ["项目", "内容"],
    [
        ["参赛者或团队", "待填写"],
        ["技术路径", "Aholo Lux3D · Three.js · WebGL · GLB/PBR · Web Audio"],
        ["作品形态", "浏览器实时 3D 体验"],
        ["报告日期", "2026 年 11 月 17 日"],
    ],
    [Cm(4.0), Cm(12.4)],
)

doc.add_page_break()

# 1
add_section_title(doc, "项目概览", "01  Overview")
doc.add_paragraph(
    "云栖电子禅堂是一座由生成式 3D 资产与实时网页渲染共同搭建的东方数字寺院。体验者化身小和尚，从山门外沿石径进入云庭，再走进大殿，在月影、雾气与钟声中完成合掌、礼拜、念珠、木鱼和静坐。作品把单件 AI 3D 生成结果组织成一条可走、可看、可操作的完整体验。"
)

add_table(
    doc,
    ["维度", "当前成果", "体验价值"],
    [
        ["空间", "山门、云庭、大殿连续可走", "用身体移动建立真实空间感"],
        ["角色", "52 关节绑骨小和尚", "动作不是按钮反馈，而是角色身体行为"],
        ["仪式", "合掌、礼拜、念珠、木鱼、静坐", "让停留具有节奏与目的"],
        ["氛围", "夜景、灯笼、雾气、香烟、水面、月影、环境音", "形成安静而可感知的山寺环境"],
        ["氛围", "15 名环境来客与本地多标签页状态同步", "单人访问仍有现场感，并验证状态接口"],
    ],
    [Cm(2.5), Cm(6.1), Cm(7.8)],
)

doc.add_heading("完成度快照", level=2)
add_bullets(doc, [
    "资产清单共 41 项，其中 27 项已集成、6 项已验收、3 项已被新版替代、5 项仍在规划。",
    "资产覆盖 16 项建筑、10 项环境、10 项道具、4 项核心道具和 1 项角色。",
    "角色具备 5 个基础动作，并额外使用 4 条专用仪式 AnimationClip；合掌中段保持 2 秒。",
    "当前 Demo 为静态网页，可直接部署；生产级跨设备多人房间尚未接入。",
])

doc.add_page_break()

# 2
add_section_title(doc, "创意来源与设计目标", "02  Concept")
doc.add_heading("为什么做电子寺院", level=2)
doc.add_paragraph(
    "在线 3D 空间常以游戏任务、聊天和竞争为中心。本项目选择相反的体验方向：匿名、少语言、低压力、可停留。寺院并非被还原成宗教模拟器，而是被转译为一组可被数字空间承载的行为——进入、行走、合掌、礼拜、敲击、计数和静坐。"
)
doc.add_heading("参考与原创边界", level=2)
doc.add_paragraph(
    "项目从韩国 Sansa 在线寺庙的“匿名角色、固定坐垫、无聊天共处、少量仪式动作”中获得产品启发，但没有复制其品牌、代码、模型、纹理、音频或文案。视觉资产、场景结构、交互实现和技术管线均为本项目重新设计。"
)
doc.add_heading("三项设计原则", level=2)
add_numbered(doc, [
    "连续空间优先。山门、云庭和大殿是同一活动空间，核心路线不依赖页面切换。",
    "身体反馈优先。点击仪式按钮后，角色本体必须做出可见动作，并与道具、声音和计数一致。",
    "氛围优先于任务。夜色、灯光、水面、雾气与环境声共同服务于停留，不用密集任务占据注意力。",
])

doc.add_heading("体验路径", level=2)
flow = doc.add_paragraph()
flow.alignment = WD_ALIGN_PARAGRAPH.CENTER
for index, label in enumerate(("山门外", "穿过山门", "云庭环视", "进入大殿", "完成仪式", "坐垫静坐")):
    run = flow.add_run(label)
    run.bold = True
    run.font.size = Pt(10.5)
    run.font.color.rgb = RGBColor(45, 83, 71)
    if index < 5:
        ar = flow.add_run("   →   ")
        ar.font.color.rgb = MUTED

doc.add_paragraph(
    "体验者通过鼠标点击地面引导角色移动，拖动完成环视，滚轮调整距离；在关键区域切换跟随、环绕和高位视角。路线把“看一个 3D 场景”变成“在场景里完成一段安静行为”。"
)

doc.add_page_break()

# 3
add_section_title(doc, "生成式 3D 资产管线", "03  Asset Pipeline")
doc.add_paragraph(
    "Lux3D 不是一次生成即完成的素材库，而是项目的资产迭代引擎。每件资产先明确功能、尺度、材质和连接约束，再生成候选、检查拓扑与视觉问题、制作运行时 LOD，最后进入场景对位和回归验证。"
)

pipeline = [
    ("01", "功能规格", "定义资产在体验中的作用、尺寸、开合或动作要求"),
    ("02", "Lux3D 生成", "使用文字或参考图生成 PBR GLB 候选"),
    ("03", "人工验收", "检查形体、材质、遮挡、接口与风格一致性"),
    ("04", "运行时处理", "归一化、压缩、LOD、必要的拆分或绑骨"),
    ("05", "场景集成", "调整坐标、碰撞、灯光、相机和交互触发"),
    ("06", "回归验证", "逐场景检查移动路线、视线、动作和加载"),
]
add_table(doc, ["阶段", "产出", "关键检查"], [[a, b, c] for a, b, c in pipeline], [Cm(2.0), Cm(4.1), Cm(10.3)])

doc.add_heading("关键资产迭代", level=2)
add_table(
    doc,
    ["对象", "早期问题", "调整方式", "当前结果"],
    [
        ["山门与围墙", "门体像独立摆件，左右连接断裂", "重生成完整门楼并以侧墙模块补齐接口", "门、门楼与院墙形成连续建筑"],
        ["小和尚", "首版外观可用但不适合动作", "重生成 T-Pose 角色并自动绑骨", "52 关节，可播放基础与仪式动作"],
        ["大殿与佛像", "屋顶未闭合，佛像被横木遮挡", "替换建筑/佛像并调整梁架与视线", "黄铜佛像、壁画和坐垫完整可见"],
        ["念珠与木鱼", "程序化几何缺乏实物感", "生成独立 PBR 道具并在点击后弹出", "可旋转、计数、敲击并同步动作"],
        ["池塘与桥", "多余平台、石块和静态水面", "清理杂物，加入莲花、流动和月影", "云庭水景成为夜间视觉焦点"],
    ],
    [Cm(3.0), Cm(4.1), Cm(5.0), Cm(4.3)],
)

# 4
add_section_title(doc, "关键资产对比", "04  Iteration Proof")
doc.add_paragraph("山门是整个体验的第一印象，也是连接连续空间最困难的建筑模块。下图记录了从“完整门楼候选”到“门楼与左右院墙实际集成”的过程。")
add_picture(doc, REVIEWS / "gate-wall-lux3d-complete-1.png", Inches(6.45), "迭代阶段：Lux3D 完整山门候选，门体与门楼已统一，但侧墙连接尚待场景适配")
add_picture(doc, REVIEWS / "gate-sidewall-integrated-proof.png", Inches(6.45), "集成结果：门下地板不再向两侧延伸，门楼与左右院墙在同一建筑基线上衔接")

doc.add_page_break()

# 5
add_section_title(doc, "场景与氛围效果", "05  World & Atmosphere")
doc.add_paragraph(
    "场景采用黑夜而非白天，是为了让灯笼、月影、水面和大殿暖光形成清晰层次。山间雾气使用低透明体积层与远景叠加，池塘水面通过着色器扰动和反射高光表现流动，寺院香烟以细窄粒子束控制密度，避免遮挡佛像。"
)

table = doc.add_table(rows=1, cols=2)
table.alignment = WD_TABLE_ALIGNMENT.CENTER
table.autofit = False
left, right = table.rows[0].cells
for cell in (left, right):
    set_cell_margins(cell, 80, 80, 80, 80)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP
left_p = left.paragraphs[0]
left_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
left_p.add_run().add_picture(str(REVIEWS / "pond-lotus-cleanup-proof.png"), width=Inches(2.75))
left.add_paragraph("云庭：石桥、莲花、池塘、竹林与夜色水景").alignment = WD_ALIGN_PARAGRAPH.CENTER
right_p = right.paragraphs[0]
right_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
right_p.add_run().add_picture(str(REVIEWS / "continuous-walk-hall-proof.png"), width=Inches(2.75))
right.add_paragraph("大殿：黄铜佛像、坐垫、壁画与在座小和尚").alignment = WD_ALIGN_PARAGRAPH.CENTER

doc.add_heading("光影层级", level=2)
add_bullets(doc, [
    "山门：两盏檐下灯笼作为局部暖光，保证木门和角色轮廓可辨。",
    "云庭：冷色月光负责山体、竹林和水面，暖色建筑光负责路径引导。",
    "大殿：佛像与壁画获得独立照明，香炉移至入口附近，前方不再堆叠木头或灯具。",
    "镜头：限制穿模和过度遮挡，允许云庭 360 度环视，并维持角色下半身完整可见。",
])

doc.add_page_break()

# 6
add_section_title(doc, "角色、动作与仪式交互", "06  Character & Rituals")
doc.add_heading("从模型到身体动作", level=2)
doc.add_paragraph(
    "小和尚角色采用 Lux3D 生成资产，并完成 Mixamo 命名的 52 关节骨架。基础动作负责待机、行走、奔跑、坐下等移动状态；仪式动作使用 QuaternionKeyframeTrack 组成独立 AnimationClip，再由同一 AnimationMixer 以 additive 方式叠加到站姿或坐姿。"
)

add_table(
    doc,
    ["交互", "角色动作", "物件或声音反馈", "节奏"],
    [
        ["合掌", "双臂抬起，前臂内收，掌心在胸前合拢", "轻提示音", "进入姿势后保持 2 秒再回正"],
        ["礼拜", "上身前倾，头颈下沉，手臂配合", "动作完成提示", "完整播放后回到基础状态"],
        ["念珠", "双手在胸前托珠并进行拨珠节奏", "PBR 念珠、单珠转动、108 计数", "每次操作增加一次计数"],
        ["木鱼", "持槌手臂抬起并落下", "PBR 木鱼、敲击动画与木鱼声", "动作与声音同步"],
        ["静坐", "移动至空坐垫并切换坐姿", "1/3/5 分钟计时与环境音", "允许提前结束并起身"],
    ],
    [Cm(2.1), Cm(5.3), Cm(5.5), Cm(3.5)],
)

doc.add_heading("交互一致性", level=2)
doc.add_paragraph(
    "按钮、身体、道具和声音必须指向同一件事。早期版本只弹出道具，用户无法看到身体动作；当前版本先触发角色 AnimationClip，再打开念珠或木鱼的 3D 预览，避免“界面有反馈、角色没有反馈”的割裂。"
)

doc.add_page_break()

# 7
add_section_title(doc, "实时网页实现", "07  Technical Implementation")
add_table(
    doc,
    ["层级", "实现", "作用"],
    [
        ["资产层", "Lux3D GLB、PBR 材质、LOD1/LOD2、Meshopt", "兼顾生成质量与浏览器加载"],
        ["场景层", "Three.js、灯光、雾、粒子、水面着色器、碰撞与遮挡检测", "建立连续寺院世界和夜景氛围"],
        ["角色层", "SkinnedMesh、AnimationMixer、基础动作与 additive 仪式 Clip", "统一移动、坐姿和仪式动作"],
        ["交互层", "点击寻路、拖动环视、滚轮缩放、视角模式切换", "让非游戏用户也能直接上手"],
        ["声音层", "Web Audio 程序化环境音、钟声、木鱼和念珠反馈", "减少外部音频依赖并同步仪式节奏"],
        ["共处层", "BroadcastChannel 状态适配器", "验证同源多标签页的移动、座位和动作同步"],
    ],
    [Cm(2.5), Cm(7.2), Cm(6.7)],
)

doc.add_heading("连续空间的实现重点", level=2)
add_numbered(doc, [
    "使用一套世界坐标承载山门、云庭和大殿，不在场景间重新初始化角色。",
    "点击地面后计算目标点并驱动角色行走，门扇在接近时开启。",
    "相机跟随角色位置，在门楼、树木和梁架附近执行遮挡修正。",
    "远景与近景资产使用不同 LOD，保留建筑轮廓同时控制运行时负载。",
    "场景状态与 UI 仪式状态分离，动作、计数和预览可以独立恢复。",
])

doc.add_heading("生产多人改造路径", level=2)
doc.add_paragraph(
    "当前适配器接口已经抽象出 move、seat、action 和 leave 等状态。下一阶段将 BroadcastChannel 替换为 WebSocket 房间服务，由服务端完成座位原子占用、心跳回收、断线恢复和房间快照；远端角色仅同步目标位置、动作名和时间戳。"
)

doc.add_page_break()

# 8
add_section_title(doc, "验证、边界与后续计划", "08  Validation")
doc.add_heading("已验证", level=2)
add_bullets(doc, [
    "山门、左右围墙与地面接口在当前场景中完成集成。",
    "从门外到云庭再到大殿可在同一运行时连续行走。",
    "云庭支持鼠标环视和缩放，大殿入口处理了相机遮挡。",
    "角色 SkinnedMesh 与 52 关节骨架存在，4 条仪式 AnimationClip 可由 AnimationMixer 播放。",
    "念珠和木鱼使用独立 3D 资产，并具有预览、操作、计数或声音反馈。",
])

doc.add_heading("尚未完成或仍需赛前确认", level=2)
add_table(
    doc,
    ["事项", "当前状态", "提交前处理"],
    [
        ["公开 Demo", "现有站点仅所有者可访问", "切换公开权限，部署本地最新版，并用无登录浏览器验证"],
        ["真实运行视频", "分镜与字幕已准备", "录制 90 秒至 2 分钟真实操作并上传公开链接"],
        ["跨设备多人", "仅同源浏览器多标签页演示", "不作为本次已完成功能宣传；后续接 WebSocket"],
        ["手机实机帧率", "此前为推进资产暂时跳过", "至少在一台 iPhone 和一台 Android 上记录首屏与稳定帧率"],
        ["链接发布", "魔搭与小红书文案已准备", "公开发布后把有效链接回填官网"],
    ],
    [Cm(3.2), Cm(5.1), Cm(8.1)],
)

doc.add_heading("评审可关注的价值", level=2)
add_bullets(doc, [
    "生成式 3D 不只用于单件模型展示，而是被组织为可行走、可交互、可迭代的完整空间。",
    "角色动作、PBR 道具、环境声和连续路线共同构成体验闭环。",
    "项目明确区分了“环境来客”“本地同步演示”和“生产真实多人”，便于客观评估当前成果。",
    "静态网页形态降低体验门槛，也为后续多人房间和内容扩展保留清晰接口。",
])

doc.add_page_break()

# 9
add_section_title(doc, "成果链接与提交信息", "09  Submission")
doc.add_heading("推荐选题名称", level=2)
doc.add_paragraph("云栖电子禅堂：AI 3D 可漫游静修空间")

doc.add_heading("选题简介", level=2)
doc.add_paragraph(
    "云栖电子禅堂是一座由 Aholo Lux3D 生成资产、在浏览器中实时运行的东方数字静修空间。体验者化身小和尚，从山门穿过云庭进入大殿，在连续可漫游的夜景中完成合掌、礼拜、108 念珠、木鱼和静坐。项目以 Three.js 整合 PBR 建筑、绑骨角色、骨骼动画、动态水面、月影与环境音，把单件 AI 3D 生成结果组织成一条可走、可看、可操作的完整体验。"
)

add_table(
    doc,
    ["材料", "状态或链接"],
    [
        ["在线 Demo", "https://yunqi-cyber-temple-1114.praiseworthymaxim4.chatgpt.site（提交前切换公开并重新部署）"],
        ["Demo 视频", "待录制并上传后填写"],
        ["魔搭社区", "待发布后填写"],
        ["小红书", "待发布后填写，必须包含 #Aholo黑客松"],
        ["项目源代码", "云栖电子禅堂_源代码_20261117.zip，或公开 Git 仓库链接"],
    ],
    [Cm(3.3), Cm(13.1)],
)

doc.add_heading("提交包内容", level=2)
add_bullets(doc, [
    "项目报告书 Word 与 PDF。",
    "官网选题名称、简介、技术标签与提交检查。",
    "Demo 视频分镜、字幕稿和录制前检查表。",
    "小红书发布文案与建议配图顺序。",
    "魔搭社区项目说明与运行方式。",
    "精简源代码压缩包，保留运行时资产与关键生成过程记录。",
])

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(18)
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("云栖电子禅堂")
r.font.size = Pt(18)
r.font.bold = True
r.font.color.rgb = RGBColor(45, 83, 71)
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run("进入一座山门，完成一次安静的数字停留。")
r.font.size = Pt(10)
r.font.color.rgb = MUTED

OUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUT)
print(OUT)
