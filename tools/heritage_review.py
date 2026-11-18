#!/usr/bin/env python3
"""받은 보충 사진의 검수 결과를 data/heritage-extra.json 에 적용하고, 통과한 것을 data/heritage.js 에 합친다.
검수는 사람이 사진을 열어 보고 아래 OK/NO 에 적는다."""
import json, os, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OK = {"거북선": "복원 모형", "빗살무늬 토기": "신석기 · 서울 암사동", "반달 돌칼": "청동기 · 부여 송국리", "고인돌": "청동기 · 강화 부근리 탁자식", "선죽교": "개성 · 옛 사진"}
NO = {"비파형 동검": "비파형이 아닌 창끝 모양 동검 사진", "민무늬 토기": "토기가 아닌 궁궐 지붕 사진", "나전 칠기": "시대 확인 불가(고려 나전 칠기로 쓸 수 없음)"}
p = ROOT / "data/heritage-extra.json"; d = json.loads(p.read_text())
for k, why in NO.items():
    if k in d and not d[k].get("rejected"):
        f = ROOT / "assets" / d[k].get("src", "x")
        if f.exists(): f.unlink()
        d[k] = {"rejected": True, "why": why}
for k, desc in OK.items():
    if k in d and not d[k].get("rejected"): d[k]["checked"] = True; d[k]["desc"] = desc
p.write_text(json.dumps(d, ensure_ascii=False, indent=1))
h = ROOT / "data/heritage.js"; t = h.read_text(); db = json.loads(t[t.index("{"):t.rindex("}") + 1])
for k, v in d.items():
    if v.get("checked"):
        # 이 게임 안의 사진이라 학습 사이트 주소가 아닌 로컬 경로(local: true)
        db[k] = {"src": v["src"], "credit": v["credit"], "desc": v.get("desc", ""), "local": True}
head = t[:t.index("window.HERITAGE")]
h.write_text(head + "window.HERITAGE = " + json.dumps(db, ensure_ascii=False, indent=1) + ";\n")
print("통과", [k for k, v in d.items() if v.get("checked")])
