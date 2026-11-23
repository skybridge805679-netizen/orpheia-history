#!/usr/bin/env python3
"""기출 70~80회 550문항 정밀 분석 → docs/출제-분석-심화.md (데이터 표). 해석·요약은 docs/출제-분석-심화.md 맨 위에 손으로 적는다.
다시 돌리면 표 부분(<!-- AUTO --> 아래)만 새로 쓴다.
분석 축: 시험지 번호별 시대 지도, 배점, 발문 유형(부정형 포함), 묻는 대상, 자료 형식, 정답 번호, 오답 재활용(다른 문항 정답 문장을 오답으로 쓰는 패턴), 단골 보기 문장, 회차별 추세, 연대 판단형 문항, 주제 반복 주기."""
import json, subprocess, collections, re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
def load(expr):
    return json.loads(subprocess.run(["node","-e",expr],cwd=ROOT,capture_output=True,text=True).stdout)
Q=[q for q in load("global.window={};require('./data/qs.js');console.log(JSON.stringify(window.QS))") if not q.get('pred')]
EX=load("global.window={};require('./data/explanations.js');console.log(JSON.stringify(window.QUESTION_EXPLANATIONS))")
R=sorted({q['r'] for q in Q}); NR=len(R)
ERA=['선사','초기국가','삼국','남북국','고려','조선전기','조선후기','근대','일제강점기','현대','통합']
key=lambda q:f"{q['r']}-{q['n']}"
pct=lambda a,b:f"{a*100/b:.0f}%" if b else "-"

# ---------- 분류기 ----------
def stem_type(s,ch):
    pic=all(re.fullmatch(r'[①-⑤]?\s*[①-⑤]?번? ?사진|.{0,3}번 사진',c.strip()) or c.strip().endswith('번 사진') for c in ch)
    if pic: return '사진 고르기(문화유산)'
    if '순서대로' in s: return '순서 나열'
    if '사이' in s: return '(가)·(나) 사이 시기'
    if '연표' in s: return '연표 칸 고르기'
    if re.search(r'이후|이전|결과|영향|배경',s): return '전후·인과(이후/배경/영향)'
    if '탐구' in s: return '탐구 활동·주제'
    if '들어갈' in s: return '빈칸(가)에 들어갈 내용'
    if '볼 수 있는' in s or '모습' in s: return '그 시기에 볼 수 있는 모습'
    if '재위' in s or '시기에 있었던' in s or '중에 있었던' in s or '정부 시기' in s or '기간에 있었던' in s: return '그 시기에 있었던 사실'
    if '답변' in s or '대답' in s: return '교사 질문·학생 답변'
    if '대응' in s or '정책' in s or '통일 노력' in s: return '대응·정책 고르기'
    return '대상 설명 고르기'
NEG=lambda s:('않은' in s or '아닌' in s)
def target(s):
    if '교사의 질문' in s: return '교사 질문에 답하기'
    if s.startswith('다음') or s.startswith('밑줄') is False and '다음 ' in s[:6]:
        m=re.match(r"다음 ([가-힣·]+?)(에|이|가|을|를|의| )",s)
        if m: return f"다음 {m.group(1)}"
    m=re.search(r"밑줄 그은 '([^']+)'",s)
    if m:
        w=m.group(1); w=re.sub(r'^(이|그|이 |그 )','',w).strip() or w
        return f"밑줄: {w}"
    m=re.search(r"\(가\)(?:~\([나-마]\))?,?\s*(?:\(나\))?\s*([가-힣·]+(?: [가-힣]+)?)?\s*(?:에 대한|의 |에 들어갈|이 |가 |을 |를 |에서 |에 볼|시기|중에)",s)
    if m and m.group(1):
        w=m.group(1).strip()
        return '(가)·(나) 사이 시기' if w.startswith('사이') else f"(가) {w}"
    if '들어갈' in s: return '(가) 빈칸 내용'
    return '(가) 자체(대상명 없음)'
FMT=[('사료 인용(출처 표기)',r'-\s*『[^』]+』\s*-|－『|『[^』]+』\s*-|』 -'),
     ('사진·그림 자료',r'\[사진|\[그림|사진:|그림:'),
     ('지도',r'\[지도|지도:'),
     ('연표',r'\[연표|연표:|–\(가\)–|\(가\)\s*\d{3,4}'),
     ('대화·가상 대화',r'\[대화|\[가상 대화|"[^"]+"\s*/\s*"|교사:|학생:|진행자:|앵커:|전문가:|선생님:'),
     ('SNS·AI 대화창·웹 콘텐츠',r'SNS|인공 지능|챗봇|메타버스|웹 드라마|웹드라마|유튜브|카드 뉴스|#'),
     ('신문·뉴스·기사',r'신문|뉴스|기사|호외|보도'),
     ('답사·탐구·수업 활동',r'답사|탐구|수업|발표|모둠|보고서|학습지|단원 마무리'),
     ('전시·강좌·안내문',r'전시|강좌|특별전|박물관|안내|기획|축제|행사'),
     ('연보·인물 소개',r'연보|이달의|인물 카드|역사 인물')]
def formats(ctx):
    f=[n for n,p in FMT if re.search(p,ctx)]
    if not f: f=['사료·설명문(형식 표시 없음)']
    return f
def norm(t):
    t=re.sub(r'[\s.,·「」『』()\'"‘’“”]','',t)
    t=re.sub(r'(하였다|하였어요|했다|되었다|되었어요|였다|이다|하다|하는|하였습니다|되었습니다|합니다|입니다|해요|어요|았다|었다)$','',t)
    return t

# ---------- 집계 ----------
by_n=collections.defaultdict(collections.Counter); topic_n=collections.defaultdict(collections.Counter); pts_n=collections.defaultdict(collections.Counter)
for q in Q:
    by_n[q['n']][q['era']]+=1; topic_n[q['n']][q['topic']]+=1; pts_n[q['n']][q['p']]+=1
st=collections.Counter(); st_neg=collections.Counter(); st_era=collections.defaultdict(collections.Counter); st_round=collections.defaultdict(collections.Counter)
neg_round=collections.Counter(); tgt=collections.Counter(); fmt=collections.Counter(); fmt_era=collections.defaultdict(collections.Counter); fmt_round=collections.defaultdict(collections.Counter)
ans=collections.Counter(); ans_round=collections.defaultdict(collections.Counter); pts_era=collections.defaultdict(collections.Counter)
for q in Q:
    t=stem_type(q['q'],q['ch']); st[t]+=1; st_era[q['era']][t]+=1; st_round[q['r']][t]+=1
    if NEG(q['q']): st_neg[t]+=1; neg_round[q['r']]+=1
    tgt[target(q['q'])]+=1
    for f in formats(q.get('ctx','')): fmt[f]+=1; fmt_era[q['era']][f]+=1; fmt_round[q['r']][f]+=1
    ans[q['a']]+=1; ans_round[q['r']][q['a']]+=1; pts_era[q['era']][q['p']]+=1
# 정답 문장 사전 → 오답 재활용
correct={}
for q in Q:
    c=q['ch'][q['a']-1]
    if '사진' in c: continue
    correct.setdefault(norm(c),[]).append(q)
reuse=0; reuse_total=0; reuse_era=collections.defaultdict(collections.Counter); reuse_same=0
choice_freq=collections.Counter(); choice_text={}
for q in Q:
    for i,c in enumerate(q['ch']):
        if '사진' in c or re.fullmatch(r'\(.\).*',c.strip()) and len(c)<12: continue
        n=norm(c); choice_freq[n]+=1; choice_text.setdefault(n,c)
        if i+1==q['a']: continue
        reuse_total+=1
        src=[s for s in correct.get(n,[]) if key(s)!=key(q)]
        if src:
            reuse+=1; e=src[0]['era']; reuse_era[q['era']][e]+=1
            if e==q['era']: reuse_same+=1
# 단골 보기 (3회 이상)
COMBO=lambda t:bool(re.fullmatch(r'[\(\)가-마\s\-ㄱ-ㄹ,]+',choice_text[t]))
top_choices=[(n,c) for n,c in choice_freq.most_common() if c>=3 and not COMBO(n)][:60]
combo_q=[q for q in Q if all(re.fullmatch(r'[\(\)가-마\s\-ㄱ-ㄹ,]+',c.strip()) for c in q['ch'])]
# 연대 판단형
chrono={'순서 나열','(가)·(나) 사이 시기','연표 칸 고르기','전후·인과(이후/배경/영향)'}
chrono_era=collections.Counter(q['era'] for q in Q if stem_type(q['q'],q['ch']) in chrono)
era_cnt=collections.Counter(q['era'] for q in Q)
# 주제 반복 주기
topics=collections.defaultdict(list)
for q in Q: topics[(q['era'],q['topic'])].append(q['r'])

# ---------- 출력 ----------
o=["<!-- AUTO: tools/analyze_deep.py가 만든 표. 이 아래는 다시 돌리면 새로 써진다. -->","",f"분석 문항 {len(Q)}개 (제{R[0]}~{R[-1]}회, 회당 50문항). 사진 보기 문항은 오답 재활용 분석에서 뺐다.",""]
o+=["## 1. 시험지 번호별 시대 지도","","번호마다 11회 동안 나온 시대와 가장 많이 나온 주제. 같은 번호는 거의 같은 시대가 나온다(시대 순 배치).","","| 번호 | 시대(횟수) | 단골 주제 | 배점 |","|---|---|---|---|"]
for n in range(1,51):
    eras=' · '.join(f"{e} {c}" for e,c in by_n[n].most_common())
    tps=', '.join(t for t,_ in topic_n[n].most_common(3))
    pp='/'.join(f"{p}점×{c}" for p,c in sorted(pts_n[n].items()))
    o.append(f"| {n} | {eras} | {tps} | {pp} |")
o+=["","## 2. 시대별 배점","","| 시대 | 문항 | 1점 | 2점 | 3점 | 평균 배점 |","|---|---|---|---|---|---|"]
for e in ERA:
    c=pts_era[e]; tot=sum(c.values())
    if tot: o.append(f"| {e} | {tot} | {c[1]} | {c[2]} | {c[3]} | {sum(k*v for k,v in c.items())/tot:.2f} |")
o+=["","## 3. 발문 유형","",f"부정형(옳지 않은·적절하지 않은) 발문: {sum(st_neg.values())}문항({pct(sum(st_neg.values()),len(Q))}), 회당 평균 {sum(st_neg.values())/NR:.1f}개.","","| 유형 | 문항 | 비율 | 그중 부정형 |","|---|---|---|---|"]
for t,c in st.most_common(): o.append(f"| {t} | {c} | {pct(c,len(Q))} | {st_neg[t]} |")
o+=["","### 시대별 발문 유형 (시대 안 비율)","","| 시대 | "+" | ".join(t for t,_ in st.most_common())+" |","|---|"+"---|"*len(st)]
for e in ERA:
    tot=sum(st_era[e].values())
    if tot: o.append(f"| {e} | "+" | ".join(pct(st_era[e][t],tot) for t,_ in st.most_common())+" |")
o+=["","## 4. 묻는 대상 (발문 속 명사, 3문항 이상)","","| 대상 | 문항 | 비율 |","|---|---|---|"]+[f"| {t} | {c} | {pct(c,len(Q))} |" for t,c in tgt.most_common() if c>=3]+["",f"(나머지 {sum(c for t,c in tgt.items() if c<3)}문항은 대상 명사가 2회 이하로 흩어짐)"]
o+=["","## 5. 자료(제시문) 형식","","한 문항이 여러 형식을 겸하면 각각 센다.","","| 형식 | 문항 | 비율 |","|---|---|---|"]+[f"| {t} | {c} | {pct(c,len(Q))} |" for t,c in fmt.most_common()]
o+=["","### 시대별 자료 형식 (시대 안 비율)","","| 시대 | "+" | ".join(t for t,_ in fmt.most_common())+" |","|---|"+"---|"*len(fmt)]
for e in ERA:
    tot=era_cnt[e]
    o.append(f"| {e} | "+" | ".join(pct(fmt_era[e][t],tot) for t,_ in fmt.most_common())+" |")
o+=["","## 6. 정답 번호","","| 번호 | 문항 | 비율 |","|---|---|---|"]+[f"| {a} | {ans[a]} | {pct(ans[a],len(Q))} |" for a in range(1,6)]
o+=["","| 회차 | ①| ② | ③ | ④ | ⑤ |","|---|---|---|---|---|---|"]+[f"| {r} | "+" | ".join(str(ans_round[r][a]) for a in range(1,6))+" |" for r in R]
o+=["","## 7. 오답 구성: 다른 문항의 정답 문장을 오답으로 재활용",""]
o+=[f"오답 보기 {reuse_total}개 중 {reuse}개({pct(reuse,reuse_total)})가 70~80회 어딘가에서 **정답으로 나온 문장과 같다**. 그중 같은 시대 정답의 재활용은 {reuse_same}개({pct(reuse_same,reuse)}).","","행 = 문제의 시대, 열 = 오답으로 끌어온 정답 문장의 원래 시대.","","| 문제 시대 | "+" | ".join(ERA)+" |","|---|"+"---|"*len(ERA)]
for e in ERA:
    if sum(reuse_era[e].values()): o.append(f"| {e} | "+" | ".join(str(reuse_era[e][x] or '') for x in ERA)+" |")
o+=["","## 8. 단골 보기 문장 (정답·오답 합쳐 3번 이상)","","| 횟수 | 정답으로 | 보기 문장 | 정답일 때 시대 |","|---|---|---|---|"]
for n,c in top_choices:
    src=correct.get(n,[])
    o.append(f"| {c} | {len(src)} | {choice_text[n]} | {', '.join(sorted({s['era'] for s in src})) or '-'} |")
o+=["",f"순서 배열·ㄱㄴㄷㄹ 조합 보기는 표에서 뺐다(조합형 문항 {len(combo_q)}개: "+' '.join(key(q) for q in combo_q)+")."]
o+=["","## 9. 연대 판단형 문항 (순서·사이·연표·전후)","","| 시대 | 연대 판단형 | 시대 전체 | 비율 |","|---|---|---|---|"]
for e in ERA:
    if era_cnt[e]: o.append(f"| {e} | {chrono_era[e]} | {era_cnt[e]} | {pct(chrono_era[e],era_cnt[e])} |")
o+=["","## 10. 회차별 추세","","| 회차 | "+" | ".join(ERA)+" | 부정형 | 사진 고르기 | 연대 판단형 |","|---|"+"---|"*(len(ERA)+3)]
for r in R:
    ec=collections.Counter(q['era'] for q in Q if q['r']==r)
    ch=sum(st_round[r][t] for t in chrono)
    o.append(f"| {r} | "+" | ".join(str(ec[e]) for e in ERA)+f" | {neg_round[r]} | {st_round[r]['사진 고르기(문화유산)']} | {ch} |")
o+=["","## 11. 주제 반복 주기와 공백","","11회 중 출제 회 수, 마지막 출제, 연속 공백. ★ = 4회 이상 나왔는데 최근 3회(78~80) 공백.","","| 시대 | 주제 | 횟수 | 출제 회차 | 마지막 | 최대 공백 |","|---|---|---|---|---|---|"]
rows=[]
for (e,t),rs in topics.items():
    s=sorted(set(rs)); gaps=[b-a for a,b in zip(s,s[1:])]+[R[-1]-s[-1]]
    star='★' if len(s)>=4 and s[-1]<R[-1]-2 else ''
    rows.append((ERA.index(e),-len(rs),e,t,len(rs),s,max(gaps) if gaps else 0,star))
for _,_,e,t,c,s,g,star in sorted(rows):
    if c>=3: o.append(f"| {e} | {t} {star} | {c} | {' '.join(map(str,s))} | {s[-1]} | {g} |")

# 정답 술어 패턴
PRED=[('설치·설립·조직',r'(설치|설립|조직|결성|창설|두었|세웠|창건|건립)'),('편찬·저술·간행',r'(편찬|저술|간행|지었|작성|발간|집필|창간)'),('시행·실시·제정',r'(시행|실시|제정|반포|공포|추진|도입|채택|발행|주조|발급)'),('전투·항쟁·격퇴',r'(격퇴|물리|항전|전투|대첩|격파|저지|봉기|일으|점령|함락|전사)'),('조약·외교·교류',r'(조약|체결|수교|사신|교류|파견|동맹|협정|회담|선언)'),('폐지·축소·박탈',r'(폐지|폐간|해산|박탈|약화|축출|제거|숙청|금지)'),('주장·사상·운동',r'(주장|제시|강조|전개|운동|비판|건의|제창)'),('생활·사회 모습',r'(생활|사용|거주|유행|모습|볼 수|살았|제작|만들)')]
pred=collections.Counter(); pred_era=collections.defaultdict(collections.Counter)
for q in Q:
    c=q['ch'][q['a']-1]
    if '사진' in c: continue
    hit=next((n for n,p in PRED if re.search(p,c)),'기타')
    pred[hit]+=1; pred_era[q['era']][hit]+=1
o+=["","## 12. 정답 문장이 주로 말하는 것 (정답 보기의 술어)","","| 술어 묶음 | 정답 수 | 비율 |","|---|---|---|"]
tp=sum(pred.values())
for n,c in pred.most_common(): o.append(f"| {n} | {c} | {pct(c,tp)} |")
o+=["","| 시대 | "+" | ".join(n for n,_ in pred.most_common())+" |","|---|"+"---|"*len(pred)]
for e in ERA:
    tot=sum(pred_era[e].values())
    if tot: o.append(f"| {e} | "+" | ".join(pct(pred_era[e][n],tot) for n,_ in pred.most_common())+" |")
# 단서어
STOP=set('단서 시대 가리킨다 나라 국가 정책 시기 자료 내용 사건 이다 이며 있다 것은 것이 의미 해당 조선 고려 신라 백제 고구려 통일 이후 이전 때의 당시 한다 한 이 그 등 및 왕은 왕의 왕이 사이 연도 기준 정답 보기 구분 함께 대한 위해 통해 문항 묻는다 찾는다 고른다 선택지 무엇 제시 주는 있는 하는 했다 되었다'.split())
clue=collections.defaultdict(collections.Counter)
for q in Q:
    e=EX.get(key(q),{})
    for t in e.get('clues',[]):
        for w in re.findall(r'[가-힣]{2,8}',t):
            w=re.sub(r'(은|는|이|가|을|를|의|와|과|로|으로|에서|에게|이다|이며|에|도)$','',w)
            if len(w)>=2 and w not in STOP: clue[q['era']][w]+=1
o+=["","## 13. 시대별 단골 단서어 (해설 '단서' 문장에서 많이 나온 낱말)","","| 시대 | 단서어 (횟수) |","|---|---|"]
for e in ERA:
    o.append(f"| {e} | "+", ".join(f"{w}({c})" for w,c in clue[e].most_common(25) if c>=2)+" |")

out=ROOT/"docs/출제-분석-심화.md"
head=""
if out.exists():
    old=out.read_text(encoding='utf-8')
    if '<!-- AUTO' in old: head=old.split('<!-- AUTO')[0]
if not head: head="# 기출 70~80회 정밀 분석 (출제 경향·문제 유형 패턴)\n\n"
out.write_text(head+"\n".join(o)+"\n",encoding='utf-8')
print(f"wrote {out} ({len(o)} lines)")
