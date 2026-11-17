"""Encode the captured runtime picture and audio, with a separate subtitle band."""
from pathlib import Path
import json, subprocess
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent
WORK = ROOT / 'video-work'
segments = [
 (0, 9, '云栖电子禅堂', 'AI 3D 可漫游静修空间'),
 (9, 23, '从山门出发', '跟随小和尚穿过开启的木门，走入云庭'),
 (23, 37, '月下云庭', '拖动视角，观察建筑、池水与竹林'),
 (37, 48, '步入大殿', '真实行走片段已加速 · 建筑、角色与法器组成完整空间'),
 (48, 55, '合掌', '绑骨角色响应真实操作 · 殿内来客为本地演示角色'),
 (55, 64, '礼拜', '从站姿俯身，再回到当下'),
 (64, 78, '一念一珠', '点击转动真实 3D 念珠，记录此刻的次数'),
 (78, 92, '一声一息', '敲击木鱼，听见程序实时生成的声音'),
 (92, 106, '与此刻同坐', '选择静坐时长，开始一段安静的计时'),
 (106, 118, '从 AI 资产到完整体验', 'Aholo Lux3D 生成资产 · Three.js 实时运行'),
 (118, 126, '云栖电子禅堂', '不必说什么，安静停留片刻'),
]
capture_meta=json.loads((WORK/'capture.json').read_text())
if capture_meta.get('scheduleOffset',0)<0.1:
    segments[3]=(37,48,'步入大殿','建筑、角色与法器，共同组成可体验的空间')

def stamp(t, ass=False):
    h, rem = divmod(t, 3600); m, s = divmod(rem, 60)
    return f'{h}:{m:02d}:{s:02d}.00' if ass else f'{h:02d}:{m:02d}:{s:02d},000'

ass = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Arial Unicode MS,34,&H00E6E9EE,&H00FFFFFF,&H00101417,&H00000000,0,0,0,0,100,100,2,0,1,0,0,2,40,40,65,1
Style: Body,Arial Unicode MS,26,&H00B6C1C6,&H00FFFFFF,&H00101417,&H00000000,0,0,0,0,100,100,1,0,1,0,0,2,40,40,23,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
for a,b,title,body in segments:
    for style,text in [('Title',title),('Body',body)]:
        ass += f'Dialogue: 0,{stamp(a,True)},{stamp(b,True)},{style},,0,0,0,,{text}\n'
(WORK/'captions.ass').write_text(ass)
(ROOT/'Demo成片字幕.srt').write_text('\n\n'.join(f'{i}\n{stamp(a)} --> {stamp(b)}\n{title}\n{body}' for i,(a,b,title,body) in enumerate(segments,1))+'\n')
meta=json.loads((WORK/'capture.json').read_text())
output=ROOT/'云栖电子禅堂_Demo_提交版.mp4'
offset=meta.get('scheduleOffset',0)
end=48+offset
speed=(11+offset)/11
tempo=[]
while speed>2:tempo.append('atempo=2');speed/=2
tempo.append(f'atempo={speed}')
filters=f"[0:v]split=3[v0][v1][v2];[v0]trim=end=37,setpts=PTS-STARTPTS[x0];[v1]trim=start=37:end={end},setpts=(PTS-STARTPTS)/{(11+offset)/11}[x1];[v2]trim=start={end},setpts=PTS-STARTPTS[x2];[x0][x1][x2]concat=n=3:v=1:a=0,pad=1920:1080:0:0:color=0x101719,subtitles={WORK/'captions.ass'}:fontsdir=/System/Library/Fonts/Supplemental[v];[1:a]asplit=3[a0][a1][a2];[a0]atrim=end=37,asetpts=PTS-STARTPTS[y0];[a1]atrim=start=37:end={end},asetpts=PTS-STARTPTS,{','.join(tempo)}[y1];[a2]atrim=start={end},asetpts=PTS-STARTPTS[y2];[y0][y1][y2]concat=n=3:v=0:a=1,afade=t=in:d=1,afade=t=out:st=123:d=3[a]"
cmd=[imageio_ffmpeg.get_ffmpeg_exe(),'-y','-ss',str(meta['trimStart']),'-i',str(WORK/'runtime-raw.webm'),'-i',str(WORK/'runtime-audio.webm'),'-filter_complex',filters,'-t','126','-map','[v]','-map','[a]','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','192k','-movflags','+faststart',str(output)]
cmd[cmd.index('-filter_complex')+1]=filters.replace('afade=t=in:d=1','volume=16dB,alimiter=limit=0.9:level=false,afade=t=in:d=1')
subprocess.run(cmd,check=True)
print(output)
