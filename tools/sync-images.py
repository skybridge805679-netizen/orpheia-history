#!/usr/bin/env python3
"""학습 사이트(korean-history-study)의 기출 그림을 게임 저장소로 복사한다.

python3 tools/sync-images.py ../korean-history-study
data/figures.js·data/heritage.js 가 가리키는 그림(question-materials, scene-art …)을
assets/kh/<같은 경로>.webp 로 옮긴다. PNG·JPG는 WebP로 바꾸고 긴 변을 MAXW로 줄인다.
core.js 의 figSrc 가 data/kh-local.js 목록에 있는 경로는 이 사본을, 없으면 학습 사이트 주소를 쓴다.
이미 있는 사본은 원본이 더 새로울 때만 다시 만든다."""
import json, re, sys, subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SITE = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT.parent / "korean-history-study") / "site"
OUT = ROOT / "assets" / "kh"
MAXW = 1600
Q = 84

def srcs():
    js = subprocess.run(["node", "-e", """
global.window={};const fs=require('fs');
for(const f of ['figures.js','predicted-figures.js','heritage.js'])eval(fs.readFileSync('data/'+f,'utf8'));
const s=new Set(),F=window.QUESTION_FIGURES||{},H=window.HERITAGE||{};
for(const v of Object.values(F)){if(v.src)s.add(v.src);for(const c of v.choices||[])if(c.src)s.add(c.src);}
for(const v of Object.values(H))if(!v.local&&v.src)s.add(v.src);
console.log(JSON.stringify([...s]));"""], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return [x for x in json.loads(js) if not re.match(r"^(https?:|data:|assets/)", x)]

def local_name(p):
    if p.lower().endswith(".svg"): return p
    return re.sub(r"\.(png|jpe?g|webp)$", ".webp", p, flags=re.I)

done, missing, before, after = [], [], 0, 0
for s in sorted(set(x.split("?")[0] for x in srcs())):
    f = SITE / s
    if not f.exists():
        missing.append(s); continue
    o = OUT / local_name(s)
    o.parent.mkdir(parents=True, exist_ok=True)
    if f.suffix.lower() == ".svg":
        o = OUT / s
        if not o.exists() or o.stat().st_mtime < f.stat().st_mtime: o.write_bytes(f.read_bytes())
    elif not o.exists() or o.stat().st_mtime < f.stat().st_mtime:
        im = Image.open(f)
        im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
        if max(im.size) > MAXW:
            r = MAXW / max(im.size); im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
        im.save(o, "WEBP", quality=Q, method=6)
    before += f.stat().st_size; after += o.stat().st_size
    done.append(s)
(ROOT / "data" / "kh-local.js").write_text(
    "// tools/sync-images.py 가 만든다. assets/kh/ 에 사본이 있는 학습 사이트 그림 경로.\nwindow.KH_LOCAL=new Set("
    + json.dumps(done, ensure_ascii=False) + ");\n", encoding="utf-8")
print(f"복사 {len(done)}개 ({before/1048576:.1f}MB → {after/1048576:.1f}MB), 원본 없음 {len(missing)}개: {missing[:10]}")
