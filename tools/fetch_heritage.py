#!/usr/bin/env python3
"""tools/heritage-list.json 의 문화재마다 한국어 위키백과 대표 사진을 받아 assets/heritage/<번호>.webp 로 저장하고
data/heritage.js(이름 → 파일·출처)를 만든다. 이미 받은 것은 건너뛴다. 받은 사진이 그 문화재가 맞는지는 사람이 확인한다."""
import json, time, io, urllib.request, urllib.error, urllib.parse, re, sys
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
LIST = json.loads((ROOT / "tools/heritage-list.json").read_text())
OUT = ROOT / "assets/heritage"; OUT.mkdir(exist_ok=True)
DB = ROOT / "data/heritage.js"
UA = {"User-Agent": "OrpheiaHistoryStudy/1.0 (personal study game; images credited)"}
old = {}
if DB.exists():
    t = DB.read_text(); old = json.loads(t[t.index("{"):t.rindex("}") + 1])
def get(url, tries=4):
    for k in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or k == tries - 1: raise
            time.sleep(30 * (k + 1))
db = dict(old)
for i, (name, title) in enumerate(k for k in LIST.items() if not k[0].startswith("_")):
    if name in db and (ROOT / "assets" / db[name]["src"]).exists():
        continue
    try:
        s = json.loads(get("https://ko.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title.replace(" ", "_"))))
        img = (s.get("thumbnail") or s.get("originalimage") or {}).get("source")
        if not img:
            print("사진 없음", name); continue
        img = img.split("?")[0]
        fname = urllib.parse.unquote(img.rsplit("/", 1)[-1])
        # 위키미디어가 권하는 표준 썸네일 폭(960px)으로 받는다
        img = re.sub(r"/(\d+)px-", "/960px-", img)
        fname = re.sub(r"^\d+px-", "", fname)
        raw = get(img)
        im = Image.open(io.BytesIO(raw)).convert("RGB"); im.thumbnail((1000, 1000))
        slug = f"h{len(db)+1:03d}.webp"
        im.save(OUT / slug, "WEBP", quality=86)
        db[name] = {"src": f"heritage/{slug}", "credit": f"위키미디어 공용 · {fname}", "page": s.get("content_urls", {}).get("desktop", {}).get("page", "")}
        print("ok", name, fname)
    except Exception as e:
        print("실패", name, e)
    time.sleep(8)
DB.write_text("// 문화재 사진(기출 보기 사진에 없는 것). tools/fetch_heritage.py 가 만든다. 출처는 credit.\nwindow.HERITAGE = " + json.dumps(db, ensure_ascii=False, indent=1) + ";\n")
print(len(db))
