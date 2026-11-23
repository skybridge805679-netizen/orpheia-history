#!/usr/bin/env python3
"""기출 70~80회 선지(보기) 분석 → docs/선지-분석.md (<!-- AUTO --> 아래 표).
오답 보기마다 해설(explanations.js의 choices)을 읽어 '그 보기는 원래 누구·언제의 일인지'를 뽑고,
문제의 정답 시대와 비교해 함정 유형을 나눈다: 같은 시대 다른 대상 / 이웃 시대 / 먼 시대 / 시기(연도) 어긋남 / 순서 배열.
또 정답과 거의 같은데 낱말 하나만 바꾼 '바꿔치기' 오답, 자주 짝지어 나오는 혼동 쌍(정답 주제 ↔ 오답 주인)을 모은다."""
import json, subprocess, collections, re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
def load(expr): return json.loads(subprocess.run(["node","-e",expr],cwd=ROOT,capture_output=True,text=True).stdout)
Q=[q for q in load("global.window={};require('./data/qs.js');console.log(JSON.stringify(window.QS))") if not q.get('pred')]
EX=load("global.window={};require('./data/explanations.js');console.log(JSON.stringify(window.QUESTION_EXPLANATIONS))")
ERA=['선사','초기국가','삼국','남북국','고려','조선전기','조선후기','근대','일제강점기','현대','통합']
EI={e:i for i,e in enumerate(ERA)}
key=lambda q:f"{q['r']}-{q['n']}"
pct=lambda a,b:f"{a*100/b:.0f}%" if b else "-"

def year_era(y):
    if y<57: return None
    if y<676: return '삼국'
    if y<936: return '남북국'
    if y<1392: return '고려'
    if y<1608: return '조선전기'
    if y<1863: return '조선후기'
    if y<1910: return '근대'
    if y<1945: return '일제강점기'
    return '현대'
# 낱말 → 시대 사전: 정답 보기·정답 해설·단서·주제에서, 한 시대에 70% 이상 몰린 낱말
tok=lambda t:[re.sub(r'(은|는|이|가|을|를|의|와|과|로|으로|에서|에게|이다|이며|에|도|때|때이다)$','',w) for w in re.findall(r'[가-힣]{2,10}',t)]
STOP=set('단서 시대 가리킨다 정책 시기 자료 내용 사건 이다 이며 있다 것은 것이 의미 해당 이후 이전 당시 한다 등 및 사이 연도 기준 정답 보기 구분 함께 대한 위해 통해 문항 고른다 선택지 제시 있는 하는 했다 되었다 설치 설치하였다 실시 시행 편찬 조직 만들었다 이루어졌다 벌였다 전개 활동 사실 자료의 나라 국가 왕은 정부 인물 단체 무렵 연결된다 관련 해당한다 아니다 맞지 않는다 다르다 시대이다 시기이다 시대의 왕의 맞다 옳다'.split())
tc=collections.defaultdict(collections.Counter)
for q in Q:
    if q['era']=='통합': continue
    e=EX.get(key(q),{})
    txt=' '.join([q['ch'][q['a']-1],q['topic'],*e.get('clues',[]),e.get('reason','')])
    for w in set(tok(txt)):
        if len(w)>=2 and w not in STOP: tc[w][q['era']]+=1
LEX={w:c.most_common(1)[0][0] for w,c in tc.items() if sum(c.values())>=2 and c.most_common(1)[0][1]/sum(c.values())>=0.7}
def owner_era(text):
    ys=[int(y) for y in re.findall(r'(?<!\d)(\d{3,4})년',text)]
    if ys: return year_era(ys[0]),'연도'
    m=re.search(r'기원전',text)
    if m: return '초기국가','연도'
    v=collections.Counter(LEX[w] for w in tok(text) if w in LEX)
    if v: return v.most_common(1)[0][0],'낱말'
    return None,None
def owner_name(text):
    m=re.search(r'(?:^|[은는가이] )((?:[가-힣]{1,8} )?[가-힣]{1,8}) 때(?:이다|의|에|인|부터|로)',text)
    if m:
        w=m.group(1).strip().split()
        r=' '.join(w[-2:]) if len(w)>1 and len(w[-1])<=2 else w[-1]
        return re.split(r'(?<=[가-힣])[은는] ',r)[-1]
    m=re.search(r'(?:은|는) ([가-힣·]{2,12})(?:의 (?:활동|정책|업적|단체|조직|기구|제도|군대|부대|저서)|(?:이|가) (?:한|세운|만든|주도한|펼친|추진한|이끈|지은|쓴))',text)
    if m: return m.group(1)
    return None
CHRONO=lambda s:bool(re.search(r'순서대로|사이|연표|이후|이전|결과|영향|배경',s))
ORDER=lambda ch:all(re.fullmatch(r'[\(\)가-마\s\-ㄱ-ㄹ,]+',c.strip()) for c in ch)
PIC=lambda ch:all('사진' in c for c in ch)
bigr=lambda t:{t[i:i+2] for i in range(len(t)-1)}
def sim(a,b):
    a=re.sub(r'[\s.,·]','',a); b=re.sub(r'[\s.,·]','',b); A,B=bigr(a),bigr(b)
    return len(A&B)/len(A|B) if A|B else 0

cat=collections.Counter(); cat_era=collections.defaultdict(collections.Counter); cat_type=collections.defaultdict(collections.Counter)
src_era=collections.defaultdict(collections.Counter); pairs=collections.Counter(); pair_ex={}
swap=[]; phrasing=collections.Counter(); unknown=[]
PHR=[('연도 이전·이후',r'이전이다|이후이다|이전의|이후의|개전 전|앞선다|뒤이다|보다 (?:앞|뒤)'),('다른 왕 때',r' 때이다| 때의 | 때 '),('다른 나라·왕조',r'(?:고구려|백제|신라|가야|발해|고려|조선|부여|동예|옥저|고조선|삼한|통일 신라|대한 제국)의 |(?:고구려|백제|신라|가야|발해|고려|조선)(?:이다| 유물| 문화유산| 탑| 불상)'),('다른 인물·단체',r'(?:의 활동|이 한|가 한|단원|회원|주도|결성|조직이다|단체이다)'),('사진·문화유산 식별',r'사진|탑이다|불상이다|유물이다|그림이다|건물이다'),('다른 지역',r'(?:지역|곳)이다|에서 일어났|에 있다'),('비슷한 개념 구분',r'구분|혼동|헷갈|아니라|다르다|아니다')]
for q in Q:
    e=EX.get(key(q),{}); chx=e.get('choices',[])
    if ORDER(q['ch']):
        for i in range(5):
            if i+1!=q['a']: cat['순서 배열(시기 순서 바꾸기)']+=1; cat_era[q['era']]['순서 배열(시기 순서 바꾸기)']+=1
        continue
    corr=q['ch'][q['a']-1]
    for i,c in enumerate(q['ch']):
        if i+1==q['a']: continue
        x=chx[i] if i<len(chx) else ''
        for n,p in PHR:
            if re.search(p,x): phrasing[n]+=1
        if PIC(q['ch']):
            k='사진(다른 시대·나라 유물)'
        elif CHRONO(q['q']) and re.search(r'이전|이후|앞선|뒤|개전 전|년으로|년이다',x):
            k='시기 어긋남(연도 앞뒤)'
        else:
            oe,how=owner_era(x)
            if oe is None: oe,how=owner_era(c)
            if oe is None or q['era']=='통합': k='판단 불가·통합'; unknown.append(key(q))
            elif oe==q['era']: k='같은 시대의 다른 대상'
            elif abs(EI[oe]-EI[q['era']])==1: k='이웃 시대'
            else: k='먼 시대'
            if oe: src_era[q['era']][oe]+=1
        cat[k]+=1; cat_era[q['era']][k]+=1
        nm=owner_name(x)
        if nm and not PIC(q['ch']):
            pr=(q['topic'],nm); pairs[pr]+=1; pair_ex.setdefault(pr,key(q))
        s=sim(c,corr)
        if s>=0.18 and not PIC(q['ch']): swap.append((s,key(q),corr,c,x))
o=["<!-- AUTO: tools/analyze_choices.py가 만든 표. 다시 돌리면 이 아래가 새로 써진다. -->",""]
tot=sum(cat.values())
o+=["## 1. 오답 보기의 함정 유형","",f"오답 보기 {tot}개. 해설이 밝힌 그 보기의 '주인'(시대·왕·단체)을 문제의 정답 시대와 비교했다.","","| 함정 유형 | 오답 수 | 비율 |","|---|---|---|"]
for k,c in cat.most_common(): o.append(f"| {k} | {c} | {pct(c,tot)} |")
ks=[k for k,_ in cat.most_common()]
o+=["","### 시대별 함정 유형 (시대 안 비율)","","| 시대 | "+" | ".join(ks)+" |","|---|"+"---|"*len(ks)]
for e in ERA:
    t=sum(cat_era[e].values())
    if t: o.append(f"| {e} | "+" | ".join(pct(cat_era[e][k],t) for k in ks)+" |")
o+=["","## 2. 오답을 어느 시대에서 끌어오나","","행 = 문제의 시대, 열 = 오답 보기의 원래 시대(해설의 연도·낱말로 추정). 대각선이 '같은 시대 함정'.","","| 문제 시대 | "+" | ".join(ERA[:-1])+" |","|---|"+"---|"*(len(ERA)-1)]
for e in ERA[:-1]:
    if sum(src_era[e].values()): o.append(f"| {e} | "+" | ".join(str(src_era[e][x] or '') for x in ERA[:-1])+" |")
o+=["","## 3. 해설이 오답을 지우는 말투","","오답 보기 해설에 나온 표현(한 해설에 여러 개면 각각 셈). 오답이 '왜 틀렸는지'의 종류다.","","| 지우는 근거 | 해설 수 |","|---|---|"]+[f"| {n} | {c} |" for n,c in phrasing.most_common()]
o+=["","## 4. 자주 짝지어 나오는 혼동 쌍 (정답 주제 ↔ 오답 보기의 주인)","","같은 쌍이 2번 이상. 「이 주제를 물을 때 이 사람·왕의 일을 오답으로 끼운다」.","","| 정답 주제 | 오답의 주인 | 횟수 | 예 |","|---|---|---|---|"]
for (t,nm),c in pairs.most_common():
    if c>=2: o.append(f"| {t} | {nm} | {c} | {pair_ex[(t,nm)]} |")
mxs=max((t[0] for t in swap),default=0)
o+=["","## 5. 정답과 같은 문장 틀을 쓴 오답 (글자 겹침이 큰 순)","",f"정답과 오답의 글자 겹침(2글자 조각 자카드)은 최대 {mxs:.2f}에 그친다. 낱말 하나만 바꾼 바꿔치기 오답은 사실상 없고, **같은 틀(○○을 설치하였다·○○을 결성하였다)에 다른 대상의 실제 사실을 넣는다.**","","| 유사도 | 문항 | 정답 | 바꿔치기 오답 | 해설 |","|---|---|---|---|---|"]
for s,k,c,w,x in sorted(swap,reverse=True)[:60]:
    o.append(f"| {s:.2f} | {k} | {c} | {w} | {x} |")

own=collections.Counter(); own_q=collections.defaultdict(set)
frame_same=0; frame_tot=0
endw=lambda t:(re.search(r'(하였다|되었다|있었다|하였어요|되었어요|있었어요|었다|였다|이다|다|요)\.?\s*$',t.strip()) or type('m',(),{'group':lambda s,i:'명사로 끝남'})()).group(1)
for q in Q:
    if ORDER(q['ch']) or PIC(q['ch']): continue
    e=EX.get(key(q),{}); chx=e.get('choices',[])
    ce=endw(q['ch'][q['a']-1]); same=sum(1 for i,c in enumerate(q['ch']) if i+1!=q['a'] and endw(c)==ce)
    frame_tot+=1; frame_same+= same>=3
    for i,c in enumerate(q['ch']):
        if i+1==q['a'] or i>=len(chx): continue
        nm=owner_name(chx[i])
        if nm: own[nm]+=1; own_q[nm].add(key(q))
o+=["","## 6. 오답으로 가장 자주 불려 나오는 '주인' (해설에 이름이 나온 왕·정부·인물)","","| 주인 | 오답으로 나온 횟수 | 문항 수 |","|---|---|---|"]
for nm,c in own.most_common(45): o.append(f"| {nm} | {c} | {len(own_q[nm])} |")
o+=["","## 7. 보기 다섯 개가 같은 꼴인가","",f"문장형 보기 문항 {frame_tot}개 중 {frame_same}개({pct(frame_same,frame_tot)})는 오답 3개 이상이 정답과 **같은 어미로 끝난다**(예: 모두 「~하였다」, 「~이 있었다」). 보기 모양으로는 정답을 가를 수 없게 만든다."]

out=ROOT/"docs/선지-분석.md"
head=""
if out.exists():
    old=out.read_text(encoding='utf-8')
    if '<!-- AUTO' in old: head=old.split('<!-- AUTO')[0]
if not head: head="# 기출 70~80회 선지 분석 (무엇을 물어 헷갈리게 하나)\n\n"
out.write_text(head+"\n".join(o)+"\n",encoding='utf-8')
print(f"wrote {out}; unknown {len(unknown)}; lex {len(LEX)}; swap {len(swap)}")
