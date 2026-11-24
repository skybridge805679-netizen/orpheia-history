#!/usr/bin/env python3
"""tools/nai-assets.json 의 에셋을 한꺼번에 생성한다(이미 있는 파일은 건너뜀).

NAI_TOKEN=pst-... python3 tools/nai_batch.py            # 전부
NAI_TOKEN=pst-... python3 tools/nai_batch.py bg_lecture_room cg_ch01_dolmen   # 골라서
원본 PNG는 assets/gen/, 게임용 WebP는 assets/ 에 둔다(Pillow가 없으면 PNG만).

인물 외형은 tools/nai-log.json(인물id → 외형 태그)에서만 꺼내 쓴다. 주문서에는 외형을 적지 않는다.
  {"id": "st_moa_school", "size": "stand", "transparent": true, "cast": ["moa"], "prompt": "장면·옷·자세 태그"}
  여러 인물: "chars": [{"cast": "moa", "prompt": "그 인물의 옷·자세", "x": 0.3, "y": 0.5}, …]
이 도구는 nai-log.json에 아무것도 쓰지 않는다."""
import json, random, sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from nai import generate, STYLE

ROOT = Path(__file__).resolve().parents[1]
SIZES = {"bg": (1216, 832), "stand": (832, 1216), "square": (1024, 1024)}
items = json.loads((ROOT / "tools/nai-assets.json").read_text(encoding="utf-8"))["items"]
args = [a for a in sys.argv[1:] if not a.startswith("--")]
pick = set(args)
missing_only = "--missing" in sys.argv  # Actions: assets/<id>.webp 가 없는 것만(원본 PNG는 저장소에 없으므로)
LOOKS = json.loads((ROOT / "tools/nai-log.json").read_text(encoding="utf-8"))  # 인물 외형(읽기 전용)


def looks(cast):
    """인물 id(하나 또는 목록)의 외형 태그. 없는 id면 멈춘다(오타로 외형 없이 뽑히지 않게)."""
    ids = [cast] if isinstance(cast, str) else list(cast or [])
    for c in ids:
        if c not in LOOKS:
            sys.exit(f"nai-log.json에 외형이 없는 인물: {c}")
    return ", ".join(LOOKS[c] for c in ids)


def join(*parts):
    return ", ".join(p for p in parts if p)


gen = ROOT / "assets/gen"; gen.mkdir(parents=True, exist_ok=True)
failed = False
for it in items:
    if pick and it["id"] not in pick:
        continue
    png = gen / f"{it['id']}.png"
    if not pick and (png.exists() or (missing_only and (ROOT / f"assets/{it['id']}.webp").exists())):
        print("건너뜀", png.name); continue
    w, h = SIZES[it.get("size", "bg")]
    seed = it.get("seed") or random.randint(1, 2**32 - 1)
    prompt = join(looks(it.get("cast")), it.get("prompt", ""), "transparent background" if it.get("transparent") else "")
    init = it.get("init")
    chars = [dict(c, prompt=join(looks(c.get("cast")), c.get("prompt", ""))) for c in it["chars"]] if it.get("chars") else None
    try:
        try:
            png.write_bytes(generate(prompt, w, h, seed, it.get("model", STYLE["model"]),
                                     init=(ROOT / init) if init else None, strength=it.get("strength", 0.6),
                                     negative=it.get("negative", ""), chars=chars, style=it.get("style")))
        except SystemExit as e:
            if not chars:
                raise
            # 멀티 캐릭터 형식을 서버가 거절하면 인물 프롬프트를 이어 붙여 한 번 더
            print("  인물별 프롬프트 거절, 한 줄로 다시:", e)
            flat = prompt + ", " + ", ".join(c["prompt"].replace("source#", "").replace("target#", "").replace("mutual#", "") for c in chars)
            png.write_bytes(generate(flat, w, h, seed, it.get("model", STYLE["model"]),
                                     init=(ROOT / init) if init else None, strength=it.get("strength", 0.6),
                                     negative=it.get("negative", ""), style=it.get("style")))
    except SystemExit as e:  # 한 장이 실패해도 나머지는 계속
        print("실패", it["id"], e); failed = True; continue
    print("생성", png.name, "seed", seed)
    try:
        from PIL import Image
        im = Image.open(png)
        if it.get("silhouette"):
            # 모브용 검은 실루엣: 알파만 살려 먹빛 단색으로 칠하고, 선이 무르지 않게 2배로 키운다
            a = im.convert("RGBA").getchannel("A")
            a = a.point(lambda v: 0 if v < 40 else (255 if v > 200 else v))
            a = a.resize((a.width * 2, a.height * 2), Image.LANCZOS)
            sil = Image.new("RGBA", a.size, (22, 18, 28, 255)); sil.putalpha(a)
            sil.save(ROOT / f"assets/{it['id']}.webp", "WEBP", quality=90, method=5)
            print("  실루엣:", "알파 있음" if a.getextrema()[0] < 255 else "알파 없음(배경 지우기 필요)")
        elif it.get("transparent"):
            alpha = im.mode == "RGBA" and im.getchannel("A").getextrema()[0] < 255
            print("  투명 배경:", "있음" if alpha else "없음(배경 지우기 필요)")
            im.convert("RGBA").save(ROOT / f"assets/{it['id']}.webp", "WEBP", quality=88, method=5)
        else:
            im.convert("RGB").save(ROOT / f"assets/{it['id']}.webp", "WEBP", quality=85, method=5)
    except ImportError:
        pass
    time.sleep(4)
if failed:
    sys.exit("일부 에셋 생성 실패")
