"""Local Mandarin narration, timed subtitles and final hardware-captured demo."""
from pathlib import Path
import json, subprocess, wave
import numpy as np
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parent
WORK=ROOT/'video-work-v2'
WORK.mkdir(exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe()
LINES=[
 (0.6,8.6,'云栖电子禅堂','云栖电子禅堂，是一座能在浏览器里漫游的数字静修空间。'),
 (9.5,16,'从山门出发','体验者化身小和尚，从山门出发，沿着石径进入云庭。'),
 (16.5,22.6,'从山门出发','木门缓缓打开，建筑与角色共同构成真实可操作的场景。'),
 (23.5,30,'月下云庭','在云庭，可以拖动视角，观察回廊、石桥、池水与竹林。'),
 (30.5,36.6,'月下云庭','月色、水面和灯火，让这段漫游多了一点安静的氛围。'),
 (37.5,47.6,'步入大殿','穿过庭院，进入大殿。佛像、壁画与坐垫，把生成的三维资产组织成完整空间。'),
 (48.5,54.6,'合掌','点击合掌，角色随即回应。殿内的其他来客，是本地演示角色。'),
 (55.5,63.6,'礼拜','再点击礼拜，观察角色俯身、停留和回正。仪式动作由绑骨角色承载。'),
 (64.5,70.6,'一念一珠','打开念珠，可以近距离查看这件独立的三维法器。'),
 (71,77.6,'一念一珠','每点击一次，念珠转动一格，计数同步增加，直到一百零八。'),
 (78.5,85,'一声一息','木鱼同样可以直接操作。点击敲击，木槌动作与声音一起回应。'),
 (85.5,91.6,'一声一息','这里保留了程序本身的木鱼声，让每次操作都有听得见的反馈。'),
 (92.5,99,'与此刻同坐','静坐提供一分钟、三分钟和五分钟。选择时长，就能开始计时。'),
 (99.5,105.6,'与此刻同坐','没有积分，也没有催促。这个空间，希望让人安静停留片刻。'),
 (106.5,117.6,'从 AI 资产到完整体验','项目使用群核科技的三维生成工具制作资产，再通过网页三维引擎，实现场景、角色动作与交互。'),
 (118.5,125.5,'云栖电子禅堂','云栖电子禅堂。从一件件生成资产，走向一个可以亲自进入的世界。'),
]

def run(args):subprocess.run(args,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
def duration(p):
    with wave.open(str(p)) as w:return w.getnframes()/w.getframerate()

timeline=np.zeros(126*48000,dtype=np.float32)
actual=[]
for i,(start,end,title,text) in enumerate(LINES):
    aiff=WORK/f'voice-{i:02d}{"-revised" if i==14 else ""}.aiff';wav=WORK/f'voice-{i:02d}.wav'
    if not aiff.exists():run(['say','-v','Tingting','-r','175','-o',str(aiff),text])
    run([FF,'-y','-i',str(aiff),'-ar','48000','-ac','1','-c:a','pcm_s16le',str(wav)])
    seconds=duration(wav)
    if seconds>end-start:
        rate=seconds/(end-start-.15)
        fitted=WORK/f'voice-{i:02d}-fit.wav'
        run([FF,'-y','-i',str(wav),'-af',f'atempo={rate}','-ar','48000','-ac','1',str(fitted)])
        wav=fitted;seconds=duration(wav)
    with wave.open(str(wav)) as w:samples=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
    pos=round(start*48000);timeline[pos:pos+len(samples)]+=samples
    actual.append((start,min(end,start+seconds),title,text))
    print('voice',i,round(seconds,2),flush=True)
with wave.open(str(WORK/'narration.wav'),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(48000);w.writeframes((np.clip(timeline,-1,1)*32767).astype(np.int16).tobytes())

def ts(t,ass=False):
    h=int(t//3600);m=int(t//60)%60;s=t%60
    return f'{h}:{m:02d}:{s:05.2f}' if ass else f'{h:02d}:{m:02d}:{s:06.3f}'.replace('.',',')
def display_text(text):
    return text.replace('阿 holo','Aholo').replace('Lux 三 D','Lux3D').replace('Three 点 J S','Three.js')
ass='''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Arial Unicode MS,26,&H00A6CBC6,&H00FFFFFF,&H00101417,&H00000000,0,0,0,0,100,100,1,0,1,0,0,2,60,60,81,1
Style: Speech,Arial Unicode MS,30,&H00E6E9EE,&H00FFFFFF,&H00101417,&H00000000,0,0,0,0,100,100,1,0,1,0,0,2,80,80,27,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
subs=[]
for i,(a,b,title,text) in enumerate(actual,1):
    text=display_text(text)
    # Keep the narration readable without squeezing long sentences into tiny type.
    text=text.replace('，','，',1)
    if len(text)>58:
        midpoint=len(text)//2
        candidates=[j+1 for j,c in enumerate(text) if c in '，。' and abs(j-midpoint)<15]
        split=min(candidates,key=lambda n:abs(n-midpoint)) if candidates else midpoint
        text=text[:split]+'\n'+text[split:]
    ass+=f'Dialogue: 0,{ts(a,True)},{ts(b,True)},Title,,0,0,0,,{title}\n'
    asstext=text.replace('\n',r'\N')
    ass+=f'Dialogue: 0,{ts(a,True)},{ts(b,True)},Speech,,0,0,0,,{asstext}\n'
    subs.append(f'{i}\n{ts(a)} --> {ts(b)}\n{text}')
(WORK/'narration.ass').write_text(ass)
(ROOT/'Demo讲解版字幕.srt').write_text('\n\n'.join(subs)+'\n')
(ROOT/'Demo中文讲解稿.md').write_text('# 云栖电子禅堂中文讲解稿\n\n'+'\n\n'.join(f'{ts(a)} — {title}\n\n{display_text(text)}' for a,b,title,text in LINES)+'\n\n配音：macOS Tingting 普通话合成语音。\n')
if not (WORK/'capture.json').exists():
    print('Narration ready. Run again once capture finishes.');raise SystemExit
meta=json.loads((WORK/'capture.json').read_text())
output=ROOT/'云栖电子禅堂_Demo_流畅讲解版.mp4'
offset=meta['scheduleOffset'];end=48+offset;speed=(11+offset)/11
prefix=f"[0:v]split=3[v0][v1][v2];[v0]trim=end=37,setpts=PTS-STARTPTS[x0];[v1]trim=start=37:end={end},setpts=(PTS-STARTPTS)/{speed}[x1];[v2]trim=start={end},setpts=PTS-STARTPTS[x2];[x0][x1][x2]concat=n=3:v=1:a=0[edited];[1:a]asplit=3[a0][a1][a2];[a0]atrim=end=37,asetpts=PTS-STARTPTS[y0];[a1]atrim=start=37:end={end},asetpts=PTS-STARTPTS,atempo={speed}[y1];[a2]atrim=start={end},asetpts=PTS-STARTPTS[y2];[y0][y1][y2]concat=n=3:v=0:a=1[environment];"
filters=prefix+f"[edited]pad=1920:1080:0:0:color=0x101719,subtitles={WORK/'narration.ass'}:fontsdir=/System/Library/Fonts/Supplemental,fade=t=out:st=124.5:d=1.5[v];[environment]volume=12dB[amb];[2:a]loudnorm=I=-19:TP=-2:LRA=9[voice];[amb][voice]amix=inputs=2:normalize=0,alimiter=limit=0.9:level=false,afade=t=in:d=.5,afade=t=out:st=124:d=2[a]"
filters=filters.replace('d=.5','d=0.5').replace('[edited]pad=', '[edited]scale=1280:640,mpdecimate,minterpolate=fps=30:mi_mode=mci:mc_mode=obmc:me_mode=bidir:me=hexbs:mb_size=16:search_param=8:scd_threshold=8,scale=1920:960:flags=lanczos,pad=')
subprocess.run([FF,'-y','-ss',str(meta['trimStart']),'-i',str(WORK/'runtime-raw.webm'),'-i',str(WORK/'runtime-audio.webm'),'-i',str(WORK/'narration.wav'),'-filter_complex',filters,'-map','[v]','-map','[a]','-t','126','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','192k','-movflags','+faststart',str(output)],check=True)
print(output)
