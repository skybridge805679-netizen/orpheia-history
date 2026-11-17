#!/usr/bin/env python3
"""학습 사이트(korean-history-study)의 기출 데이터를 게임용 data/ 로 복사한다.

python3 tools/sync-data.py ../korean-history-study
문항(QS)·해설·자료 그림 목록·핵심노트를 가져온다. 그림 파일 자체는 복사하지 않고
학습 사이트의 GitHub Pages 주소에서 불러온다(data/config.js 의 IMG_BASE)."""
import json, shutil, sys
from pathlib import Path

src = Path(sys.argv[1] if len(sys.argv) > 1 else "../korean-history-study") / "site"
out = Path(__file__).resolve().parents[1] / "data"
out.mkdir(exist_ok=True)
html = (src / "index.html").read_text(encoding="utf-8")
i = html.index("const QS=") + len("const QS=")
qs = json.JSONDecoder().raw_decode(html[i:])[0]
keep = ["n", "q", "ctx", "ch", "era", "topic", "exp", "r", "a", "p"]
qs = [{k: q[k] for k in keep if k in q} for q in qs]
(out / "qs.js").write_text("window.QS=" + json.dumps(qs, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
shutil.copy(src / "question-explanations.js", out / "explanations.js")
shutil.copy(src / "question-figures.js", out / "figures.js")
nd = out / "core-notes"
nd.mkdir(exist_ok=True)
for f in sorted((src / "core-notes").glob("*.js")):
    shutil.copy(f, nd / f.name)
print(f"문항 {len(qs)}개, 회차 {sorted({q['r'] for q in qs})}")
