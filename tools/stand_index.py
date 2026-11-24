#!/usr/bin/env python3
"""assets/st_<id>_*.webp 를 인물별로 모아 data/stands.js(window.STANDS)를 만든다.
인물 프로필의 「모습」 칸이 이 목록을 그대로 보여 준다. 새 스탠딩을 넣으면 다시 돌린다
(NAI 생성 Actions가 커밋 직전에 돌린다). 인물 id는 data/profiles.js의 id에서 가장 길게 맞는 것으로 고른다."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
ids = re.findall(r"\{id:'([a-z_]+)'", (ROOT / "data/profiles.js").read_text(encoding="utf-8"))
ids = sorted(set(ids), key=len, reverse=True)
out = {}
for f in sorted((ROOT / "assets").glob("st_*.webp")):
    name = f.stem
    for i in ids:
        if name == f"st_{i}" or name.startswith(f"st_{i}_"):
            out.setdefault(i, []).append(name); break
js = "// tools/stand_index.py 가 만든다(손으로 고치지 않는다). 인물별 스탠딩 목록 → 프로필 「모습」.\nwindow.STANDS=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
(ROOT / "data/stands.js").write_text(js, encoding="utf-8")
print(sum(map(len, out.values())), "장 /", len(out), "명")
