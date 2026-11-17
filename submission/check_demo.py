from pathlib import Path
import subprocess, sys
import imageio_ffmpeg
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parent
work=root/('video-work-v2' if '--v2' in sys.argv else 'video-work')
ff=imageio_ffmpeg.get_ffmpeg_exe()
video=root/('云栖电子禅堂_Demo_流畅讲解版.mp4' if '--v2' in sys.argv else '云栖电子禅堂_Demo_提交版.mp4')
times=[2,14,28,43,50,57,70,84,101,113,122]
sheet=Image.new('RGB',(960,270*((len(times)+1)//2)),(15,22,24))
for i,t in enumerate(times):
    frame=work/f'qa-{t:03d}.png'
    subprocess.run([ff,'-v','error','-y','-ss',str(t),'-i',str(video),'-frames:v','1',str(frame)],check=True)
    im=Image.open(frame);im.thumbnail((480,270))
    sheet.paste(im,((i%2)*480,(i//2)*270))
    ImageDraw.Draw(sheet).text(((i%2)*480+6,(i//2)*270+6),f'{t}s',fill='white',stroke_width=2,stroke_fill='black')
sheet.save(work/'contact-sheet.jpg')
subprocess.run([ff,'-v','error','-i',str(video),'-f','null','-'],check=True)
result=subprocess.run([ff,'-hide_banner','-i',str(video),'-af','volumedetect','-vn','-f','null','-'],capture_output=True,text=True)
(work/'audio-and-format-check.txt').write_text(result.stderr)
print('\n'.join(x for x in result.stderr.splitlines() if any(k in x for k in ['Duration:','Stream #','mean_volume','max_volume'])))
