#!/usr/bin/env python3
"""웹판 데이터를 PS Vita 실행기(vita/)용으로 내보낸다. docs/비타-포팅-계획.md 5절.

  python3 tools/export-vita.py [출력 폴더=vita/build-data] [글꼴 폴더=tools/fonts]

지금: 첫 화면 그림·글꼴, LiveArea 그림(sce_sys), 대본·표(game.json), 문제(quiz.json).
이후 단계에서 그림·소리 일괄 변환을 여기에 더한다. Node + playwright 가 있어야 한다.
"""
import json, shutil, subprocess, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "vita" / "build-data"
FONTS = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "tools" / "fonts"
DATA = OUT / "data"          # VPK 안의 data/ (앱에서 app0:data/)
SYS = OUT / "sce_sys"        # VPK 안의 sce_sys/ (아이콘·LiveArea)


def cover(src, w, h):
    """가운데를 기준으로 w×h를 꽉 채우게 자른다."""
    im = Image.open(src).convert("RGB")
    r = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))


def indexed(im):
    """LiveArea 그림은 8비트 팔레트 PNG여야 한다."""
    return im.convert("RGB").quantize(colors=256, method=Image.Quantize.MEDIANCUT)


def main():
    (DATA / "img").mkdir(parents=True, exist_ok=True)
    (DATA / "fonts").mkdir(parents=True, exist_ok=True)
    (SYS / "livearea" / "contents").mkdir(parents=True, exist_ok=True)

    # 글꼴(OFL): 대사는 고운돋움, 제목은 고운바탕
    for f in ("GowunDodum-Regular.ttf", "GowunBatang-Bold.ttf"):
        src = FONTS / f
        if not src.exists():
            sys.exit(f"글꼴이 없습니다: {src} (구글 폰트에서 받아 tools/fonts/ 에 두세요)")
        shutil.copy(src, DATA / "fonts" / f)

    # 첫 화면: 다이브 배경 + 문장
    cover(ROOT / "assets/bg_timeline_dive.webp", 1088, 616).save(DATA / "img/bg_title.jpg", quality=88)
    em = Image.open(ROOT / "assets/emblem_gold.webp").convert("RGBA")
    em.thumbnail((220, 220), Image.LANCZOS)
    em.save(DATA / "img/emblem.png")
    st = Image.open(ROOT / "assets/st_orpheia_smile.webp").convert("RGBA")
    st = st.resize((round(st.width * 760 / st.height), 760), Image.LANCZOS)  # 웹판처럼 크게(무릎 아래는 화면 밖)
    st.save(DATA / "img/orpheia.png")

    # LiveArea: 아이콘 128×128, 배경 840×500, 시작 버튼 280×158
    ic = Image.new("RGB", (128, 128), (18, 22, 40))
    e2 = em.copy(); e2.thumbnail((112, 112), Image.LANCZOS)
    ic.paste(e2, ((128 - e2.width) // 2, (128 - e2.height) // 2), e2)
    indexed(ic).save(SYS / "icon0.png")
    indexed(cover(ROOT / "assets/bg_timeline_dive.webp", 840, 500)).save(SYS / "livearea/contents/bg.png")
    indexed(cover(ROOT / "assets/bg_timeline_dive.webp", 280, 158)).save(SYS / "livearea/contents/startup.png")
    (SYS / "livearea/contents/template.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<livearea style="a1" format-ver="01.00" content-rev="1">\n'
        '  <livearea-background><image>bg.png</image></livearea-background>\n'
        '  <gate><startup-image>startup.png</startup-image></gate>\n'
        '</livearea>\n', encoding="utf-8")
    # 대본·표·문제: 웹판을 헤드리스로 띄워 vn.js 가 해석한 그대로 뽑는다(tools/vita-dump.cjs)
    dump = OUT / "dump.json"
    subprocess.run(["node", str(ROOT / "tools/vita-dump.cjs"), str(dump)], cwd=ROOT, check=True)
    d = json.loads(dump.read_text(encoding="utf-8"))
    game = {k: v for k, v in d.items() if k not in ("QS", "EXPLAIN", "FIGURES", "HERITAGE")}
    quiz = {"QS": d["QS"], "EXPLAIN": d["EXPLAIN"], "FIGURES": d["FIGURES"], "HERITAGE": d["HERITAGE"]}
    (DATA / "game.json").write_text(json.dumps(game, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (DATA / "quiz.json").write_text(json.dumps(quiz, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    dump.unlink()
    n = sum(1 for _ in OUT.rglob("*") if _.is_file())
    print(f"내보냄: {OUT} ({n}개 파일)")


if __name__ == "__main__":
    main()
