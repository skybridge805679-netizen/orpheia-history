#!/usr/bin/env python3
"""받은 보충 사진의 검수 결과를 data/heritage-extra.json 에 적용하고, 통과한 것을 data/heritage.js 에 합친다.
검수는 사람이 사진을 열어 보고 아래 OK/NO 에 적는다."""
import json, os, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OK = {"거북선": "복원 모형", "빗살무늬 토기": "신석기 · 서울 암사동", "반달 돌칼": "청동기 · 부여 송국리", "고인돌": "청동기 · 강화 부근리 탁자식", "선죽교": "개성 · 옛 사진", "청화 백자": "조선 후기", "화순 쌍봉사 철감선사탑": "신라 하대 승탑", "연천 전곡리 유적": "구석기 · 주먹도끼 출토지"}
NO = {"비파형 동검": "비파형이 아닌 창끝 모양 동검 사진", "민무늬 토기": "토기가 아닌 궁궐 지붕 사진", "나전 칠기": "시대 확인 불가(고려 나전 칠기로 쓸 수 없음)", "도산 서원": "실물이 아닌 축소 모형"}
# 학습 사이트에서 가져온 사진 중 이름과 다른 것(2026.11 전수 검수). 다시 합쳐도 빠지게 한다.
BAD = {"감은사지 동·서 삼층 석탑": "석탑이 아닌 동탑 사리장엄구(사리함)", "감은사지 삼층 석탑": "석탑이 아닌 동탑 사리장엄구(사리함)",
       "탈춤(하회별신굿탈)": "하회탈이 아닌 병산탈", "3·1 독립 선언서": "선언서 실물이 아닌 영문 안내판"}
p = ROOT / "data/heritage-extra.json"; d = json.loads(p.read_text())
for k, why in NO.items():
    if k in d and not d[k].get("rejected"):
        f = ROOT / "assets" / d[k].get("src", "x")
        if f.exists(): f.unlink()
        d[k] = {"rejected": True, "why": why}
if "주먹도끼" in d and not d["주먹도끼"].get("rejected"):
    d["연천 전곡리 유적"] = d.pop("주먹도끼")
for k, desc in OK.items():
    if k in d and not d[k].get("rejected"): d[k]["checked"] = True; d[k]["desc"] = desc
if "주먹도끼" in d and not d["주먹도끼"].get("rejected"):
    d["연천 전곡리 유적"] = d.pop("주먹도끼")  # 받은 사진은 유물이 아니라 유적 전경
p.write_text(json.dumps(d, ensure_ascii=False, indent=1))
h = ROOT / "data/heritage.js"; t = h.read_text(); db = json.loads(t[t.index("{"):t.rindex("}") + 1])
for k, v in d.items():
    if v.get("checked"):
        # 이 게임 안의 사진이라 학습 사이트 주소가 아닌 로컬 경로(local: true)
        db[k] = {"src": v["src"], "credit": v["credit"], "desc": v.get("desc", ""), "local": True}
for k in list(BAD) + list(NO):
    if not (k in d and d[k].get("checked")):  # 학습 사이트의 틀린 사진만 뺀다. 새로 검수한 로컬 사진은 둔다
        db.pop(k, None)
head = t[:t.index("window.HERITAGE")]
h.write_text(head + "window.HERITAGE = " + json.dumps(db, ensure_ascii=False, indent=1) + ";\n")
print("통과", [k for k, v in d.items() if v.get("checked")])
