"""Add licensed Heart Sutra ambience only while the demo is inside the hall."""
from pathlib import Path
import subprocess
import imageio_ffmpeg

root=Path(__file__).resolve().parent
work=root/'video-work-v3'
ff=imageio_ffmpeg.get_ffmpeg_exe()
source=root/'云栖电子禅堂_Demo_流畅讲解版.mp4'
target=root/'云栖电子禅堂_Demo_大殿念诵版.mp4'
chant=work/'heart-sutra-cc0.ogg'
voice=root/'video-work-v2/narration.wav'
# The narration uses final edited-video timestamps. It controls only the added
# chanting bed; the existing soundtrack and video remain intact.
graph=(
 '[1:a]atrim=start=0:end=67,asetpts=PTS-STARTPTS,'
 'highpass=f=110,lowpass=f=4200,'
 'aecho=0.8:0.88:99|180|300:0.12|0.08|0.04,'
 'loudnorm=I=-26:TP=-8:LRA=7,aresample=48000,'
 'afade=t=in:st=0:d=3,afade=t=out:st=63:d=4,'
 'atrim=end=67,adelay=45500:all=1,apad=whole_dur=126[chant];'
 '[2:a]loudnorm=I=-19:TP=-2:LRA=9,aresample=48000[voice];'
 '[chant][voice]sidechaincompress=threshold=0.025:ratio=5:attack=40:release=650:makeup=1[bed];'
 '[0:a][bed]amix=inputs=2:duration=first:normalize=0,'
 'alimiter=limit=0.9:level=false:latency=true[a]'
)
subprocess.run([ff,'-y','-i',str(source),'-i',str(chant),'-i',str(voice),
 '-filter_complex',graph,'-map','0:v:0','-map','[a]','-c:v','copy',
 '-c:a','aac','-b:a','192k','-ar','48000','-t','126','-movflags','+faststart',str(target)],check=True)
print(target)
