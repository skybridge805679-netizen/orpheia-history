#!/usr/bin/env python3
"""tools/nai-assets.json 의 에셋을 한꺼번에 생성한다(이미 있는 파일은 건너뜀).

NAI_TOKEN=pst-... python3 tools/nai_batch.py            # 전부
NAI_TOKEN=pst-... python3 tools/nai_batch.py bg_lecture_room cg_ch01_dolmen   # 골라서
원본 PNG는 assets/gen/, 게임용 WebP는 assets/ 에 둔다(Pillow가 없으면 PNG만)."""
import json, random, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from nai import generate, STYLE

ROOT = Path(__file__).resolve().parents[1]
SIZES = {"bg": (1216, 832), "stand": (832, 1216), "square": (1024, 1024)}
items = json.loads((ROOT / "tools/nai-assets.json").read_text(encoding="utf-8"))["items"]
pick = set(sys.argv[1:])
gen = ROOT / "assets/gen"; gen.mkdir(parents=True, exist_ok=True)
for it in items:
    if pick and it["id"] not in pick:
        continue
    png = gen / f"{it['id']}.png"
    if png.exists() and not pick:
        print("건너뜀", png.name); continue
    w, h = SIZES[it.get("size", "bg")]
    seed = it.get("seed") or random.randint(1, 2**32 - 1)
    prompt = it["prompt"] + (", transparent background" if it.get("transparent") else "")
    png.write_bytes(generate(prompt, w, h, seed, it.get("model", STYLE["model"])))
    print("생성", png.name, "seed", seed)
    try:
        from PIL import Image
        im = Image.open(png)
        if it.get("transparent"):
            alpha = im.mode == "RGBA" and im.getchannel("A").getextrema()[0] < 255
            print("  투명 배경:", "있음" if alpha else "없음(배경 지우기 필요)")
            im.convert("RGBA").save(ROOT / f"assets/{it['id']}.webp", "WEBP", quality=88, method=5)
        else:
            im.convert("RGB").save(ROOT / f"assets/{it['id']}.webp", "WEBP", quality=85, method=5)
    except ImportError:
        pass
    time.sleep(2)
