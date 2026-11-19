#!/usr/bin/env python3
"""기출 70~80회 출제 분석 → docs/출제-분석.md. 시대 비중, 주제별 출제 회차, 최근 공백, 발문 유형."""
import json, subprocess, collections
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
js=subprocess.run(["node","-e","global.window={};require('./data/qs.js');console.log(JSON.stringify(window.QS))"],cwd=ROOT,capture_output=True,text=True).stdout
Q=[q for q in json.loads(js) if not q.get('pred')]
R=sorted({q['r'] for q in Q}); last=R[-1]
ERA=['선사','초기국가','삼국','남북국','고려','조선전기','조선후기','근대','일제강점기','현대','통합']
def kind(s):
    if '순서대로' in s: return '순서 나열'
    if '사이' in s: return '(가)·(나) 사이'
    if '시기' in s and ('고른' in s or '연표' in s): return '연표 위치'
    if any(k in s for k in ['이후','결과','영향']): return '이후·결과'
    if any(k in s for k in ['문화유산','탑','사진','그림']): return '사진·문화유산'
    if '옳지 않은' in s: return '옳지 않은 것'
    return '설명·사실 고르기'
out=["# 기출 70~80회 출제 분석","",f"분석 문항 {len(Q)} (회차 {R[0]}~{last}). `python3 tools/analyze.py`로 다시 만든다.",""]
out+=["## 시대별 회당 문항 수","","| 시대 | 합계 | 회당 평균 |","|---|---|---|"]
ec=collections.Counter(q['era'] for q in Q)
for e in ERA: out.append(f"| {e} | {ec[e]} | {ec[e]/len(R):.1f} |")
out+=["","## 주제별 출제 회차 (시대 안에서 많이 나온 순)","","우선도 = 출제 회 수가 많은데 최근 2회(79·80)에 안 나온 주제를 ★로 표시.",""]
for e in ERA:
    tp=collections.defaultdict(list)
    for q in Q:
        if q['era']==e: tp[q['topic']].append(f"{q['r']}-{q['n']}")
    out+=[f"### {e}","","| 주제 | 횟수 | 출제 문항 | 최근 |","|---|---|---|---|"]
    for t,ks in sorted(tp.items(),key=lambda x:-len(x[1])):
        rs={int(k.split('-')[0]) for k in ks}; gap='★' if len(ks)>=3 and not rs&{last,last-1} else ''
        out.append(f"| {t} | {len(ks)} | {' '.join(sorted(ks))} | {max(rs)}회 {gap} |")
    out.append("")
kc=collections.Counter(kind(q['q']) for q in Q)
out+=["## 발문 유형","","| 유형 | 비율 |","|---|---|"]+[f"| {k} | {v*100/len(Q):.0f}% |" for k,v in kc.most_common()]
(ROOT/"docs/출제-분석.md").write_text("\n".join(out)+"\n",encoding="utf-8")
print("\n".join(out))
