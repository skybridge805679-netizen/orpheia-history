'use strict';
// 기출 문제 화면. 이야기 속(@quiz)과 타이틀의 「기출 풀기」가 같은 화면을 쓴다.
//  · 맞히면 정답 근거와 기억할 점, 틀리면 그 보기의 실제 주인을 보여 주고 되감아 다시 고르게 한다(첫 시도만 점수).
//  · 데이터: data/qs.js(QS), data/explanations.js(QUESTION_EXPLANATIONS), data/figures.js(QUESTION_FIGURES).
const Quiz=(()=>{
 const N='①②③④⑤';
 const EX=()=>window.QUESTION_EXPLANATIONS||{},FIG=()=>window.QUESTION_FIGURES||{};
 const LINES={
  solo:['이번엔 노트 없이 실력으로요. 막히면 아래 단추로 단서 노트를 펼쳐도 돼요♪','자료를 먼저 꼼꼼히 읽어 봐요. 단서는 늘 자료 안에 있어요.','주인님 실력 볼 차례예요. 저는 옆에서 조용히 응원할게요!'],
  open:['주인님, 풀기 전에 아래 단서 노트부터 같이 봐요. 알고 풀면 안 까먹어요!','이 자료에서 볼 곳은 아래에 적어 뒀어요. 읽고 나서 골라 봐요♪','실제 기출이에요. 단서 노트 한 번 읽고 가면 충분히 풀 수 있어요!'],
  right:['정답이에요♪ 역시 주인님!','맞았어요! 단서를 제대로 잡으셨네요.','완벽해요. 이 감각 그대로요.'],
  wrong:['앗… 되감을게요. 이 보기는 다른 주인이 있어요.','괜찮아요, 함정이었어요. 다시 골라 봐요.','아쉬워요! 아래 설명을 보고 한 번 더요.'],
 };
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 let R=null;
 const key=q=>q.r+'-'+q.n;
 const lastRound=()=>Math.max(...QS.filter(q=>!q.pred).map(q=>q.r));
 function stats(){const t=QS.length,seen=QS.filter(q=>records.quiz[key(q)]).length,right=QS.filter(q=>records.quiz[key(q)]?.last).length;return {total:t,seen,right};}
 // 고르는 규칙: 안 푼 문항 → 최근에 틀린 문항 → 나머지 순으로 섞어서 뽑는다.
 // 자작문제 모의고사: 기출 회당 평균 시대 비중(docs/출제-분석.md)대로 자작문제(오르페이아가 만든 문제, 키 자작-N)에서 50문항을 시험지 순서로 뽑는다.
 const MOCK_QUOTA={'선사':1,'초기국가':1,'삼국':4,'남북국':4,'고려':7,'조선전기':4,'조선후기':5,'근대':7,'일제강점기':9,'현대':5,'통합':3};
 function mockList(){const out=[];for(const [e,n] of Object.entries(MOCK_QUOTA))out.push(...QS.filter(q=>q.pred&&q.era===e).sort((a,b)=>(b.w||0)-(a.w||0)||a.n-b.n).slice(0,n).sort((a,b)=>a.n-b.n));return out;}
 function choose(pool,n){
  const w=q=>{const r=records.quiz[key(q)];return !r?0:!r.last?1:2;};
  const sh=pool.map(q=>[w(q)+Math.random()*.9,q]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  return sh.slice(0,n);
 }
 function select(arg){
  const toks=String(arg||'').trim().split(/\s+/).filter(Boolean),keys=toks.filter(t=>/^(\d+|자작)-\d+$/.test(t)),opt=Object.fromEntries(toks.filter(t=>t.includes('=')).map(t=>t.split('=')));
  if(keys.length)return keys.map(k=>QBY[k]).filter(Boolean);
  let pool=QS;
  if(opt.era)pool=pool.filter(q=>opt.era.split(',').includes(q.era));
  if(opt.topic)pool=pool.filter(q=>q.topic.includes(opt.topic));
  if(opt.round)pool=pool.filter(q=>q.r===+opt.round);
  if(opt.round)return pool.sort((a,b)=>a.n-b.n).slice(0,+opt.n||50);
  return choose(pool,+opt.n||1);
 }
 // ── 실행
 function run(arg,{host,onDone,title,onAnswer,bgm}){
  const list=Array.isArray(arg)?arg:select(arg);
  if(!list.length){onDone({first:0,total:0});return;}
  close();BGM.play(bgm||'bgm_exam');
  R={list,i:0,first:0,tried:new Set(),done:false,host,onDone,title,onAnswer};
  const el=document.createElement('section');el.className='qz';el.setAttribute('aria-label','기출 문제');host.appendChild(el);R.el=el;
  render();
 }
 function figure(q){
  const f=FIG()[key(q)];
  if(!f)return `<div class="qz-ctx">${esc(q.ctx)}</div>`;
  return `<figure class="qz-fig"><img src="${esc(figSrc(f.src))}" width="${f.width}" height="${f.height}" alt="${q.pred?'자작문제':`제${q.r}회`} ${q.n}번 자료" loading="eager"><figcaption><details><summary>자료를 글로 읽기</summary><p>${esc(q.ctx)}</p></details></figcaption></figure>`;
 }
 function choiceHtml(q){
  const f=FIG()[key(q)],pics=f?.imageChoices&&f.choices;
  return q.ch.map((c,i)=>{const n=i+1,tried=R.tried.has(n),ok=R.done&&n===q.a;
   const body=pics?`<img src="${esc(figSrc(pics[i].src))}" alt="보기 ${n}">${R.done||tried?`<span class="qz-pic-name">${esc(pics[i].name)}</span>`:''}`:esc(c);
   return `<button class="qz-ch${tried?' tried':''}${ok?' ok':''}${pics?' pic':''}" data-c="${n}" ${tried||R.done?'disabled':''}><span class="qz-n">${N[i]}</span><span class="qz-t">${body}</span></button>`;}).join('');
 }
 function say(kind,text){return `<div class="qz-orpheia ${kind}"><img src="${asset('ui/face_'+({right:'smile',wrong:'worry',open:'neutral'}[kind]||'neutral')+'.webp')}" alt=""><p><b>오르페이아</b>${esc(text)}</p></div>`;}
 // 풀기 전 단서 노트: 자료가 가리키는 것(clues) + 구별해 둘 점(takeaway). 보기 번호를 짚는 문장·근거 기출 꼬리는 뺀다(정답 번호는 풀고 나서).
 function preNote(ex){
  const take=String(ex.takeaway||'').replace(/\s*\(근거 기출:[^)]*\)/,'').split(/(?<=[.。])\s+/).filter(x=>x&&!/[①②③④⑤]|선택지|보기 중/.test(x)).join(' ');
  const cl=(ex.clues||[]).join(' ');
  if(!cl&&!take)return '';
  // 단서 노트 켜기/끄기(records.preNote, 기본 켬). 끈 상태에선 이 문항만 펼쳐 볼 수 있는 단추만 둔다.
  if(records.preNote===false&&!R.showPre)return `<div class="qz-pre-off"><button class="quiet" data-pre="show">📜 단서 노트 보기</button><button class="quiet" data-pre="on">항상 켜기</button></div>`;
  return `<div class="qz-exp pre"><h3>📜 풀기 전에, 단서 노트<button class="qz-pre-btn" data-pre="off" title="다음 문제부터 단서 노트를 접어 둡니다">끄기</button></h3>${cl?`<p class="qz-clue"><b>자료 읽기</b> ${esc(cl)}</p>`:''}${take?`<p class="qz-take"><b>알고 풀기</b> ${esc(take)}</p>`:''}</div>`;
 }
 function render(){
  const q=R.list[R.i],ex=EX()[key(q)]||{},last=R.wrongPick;
  let note='';
  if(R.done){note=`<div class="qz-exp ok"><h3>✓ 정답 ${N[q.a-1]}</h3>${(ex.clues||[]).length?`<p class="qz-clue"><b>단서</b> ${esc(ex.clues.join(' '))}</p>`:''}<p>${esc(ex.reason||q.exp)}</p>${ex.takeaway?`<p class="qz-take"><b>기억할 점</b> ${esc(ex.takeaway)}</p>`:''}<details><summary>보기 다섯 개 해설</summary><ol>${(ex.choices||[]).map((c,i)=>`<li class="${i+1===q.a?'ok':''}">${N[i]} ${esc(c)}</li>`).join('')}</ol></details></div>`;}
  else if(last){note=`<div class="qz-exp bad"><h3>✕ ${N[last-1]}은(는) 아니에요</h3><p>${esc((ex.choices||[])[last-1]||'이 보기는 조건에 맞지 않아요.')}</p></div>`+preNote(ex);}
  else note=preNote(ex);
  const ori=R.done?say('right',R.firstOk?pick(LINES.right):'이번엔 맞혔어요. 첫 시도 점수는 다음에 꼭 가져가요!'):last?say('wrong',R.line||(R.line=pick(LINES.wrong))):say('open',R.open||(R.open=records.preNote===false?pick(LINES.solo):q.pred?pick(['제가 다음 회차를 예상해서 만든 문제예요. 아래 단서 노트 보고 기출처럼 풀면 돼요!',...LINES.open.filter(l=>!l.startsWith('실제 기출'))]):pick(LINES.open)));
  R.el.innerHTML=`<div class="qz-panel"><header class="qz-head"><span class="qz-no">${q.n}.</span><span class="chip">${esc(q.era)}</span>${R.done?`<span class="chip gold">${esc(q.topic)}</span>`:''}<span class="qz-meta">${q.pred?'<b class="qz-pred">자작문제</b>':`제${q.r}회`} · ${q.p}점 · ${R.i+1}/${R.list.length}</span>${R.title?`<span class="qz-meta">${esc(R.title)}</span>`:''}<button class="quiet qz-exit" data-exit>그만</button></header>
   <div class="qz-body"><div class="qz-left"><h2 class="qz-q">${esc(q.q)}</h2>${figure(q)}</div><div class="qz-right"><div class="qz-choices">${choiceHtml(q)}</div>${ori}${note}${R.done?`<button class="primary qz-next" data-next>${R.i+1<R.list.length?'다음 문제 ▶':'결과 보기 ▶'}</button>`:''}</div></div></div>`;
  R.el.querySelectorAll('[data-c]').forEach(b=>b.onclick=e=>{e.stopPropagation();answer(+b.dataset.c);});
  R.el.querySelector('[data-next]')?.addEventListener('click',e=>{e.stopPropagation();next();});
  R.el.querySelector('[data-hint]')?.addEventListener('click',e=>{e.stopPropagation();R.hint=true;render();});
  R.el.querySelectorAll('[data-pre]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const k=b.dataset.pre;if(k==='show')R.showPre=true;else{records.preNote=k==='on';save();R.showPre=false;}render();}));
  R.el.querySelector('[data-exit]').onclick=e=>{e.stopPropagation();if(confirm('문제를 그만 풀까요? 지금까지의 결과로 넘어갑니다.'))finish();};
  R.el.querySelector('.qz-right').scrollTop=0;
  const fi=R.el.querySelector('.qz-fig img');if(fi){fi.title='눌러서 크게 보기';fi.onclick=()=>{const z=document.createElement('div');z.className='qz-zoom';z.innerHTML=`<img src="${fi.getAttribute('src')}" alt=""><span>닫기 ✕</span>`;z.onclick=()=>z.remove();document.body.appendChild(z);};}
 }
 function answer(c){
  if(!R||R.done)return;const q=R.list[R.i],first=R.tried.size===0;
  if(c===q.a){R.done=true;R.firstOk=first;if(first)R.first++;logAnswer(key(q),true,first);SFX.play('correct');render();R.el.querySelector('.qz-next')?.focus();R.onAnswer?.(true,first,R.first,R.list.length);return;}
  if(first){logAnswer(key(q),false,true);R.onAnswer?.(false,true,R.first,R.list.length);}
  R.tried.add(c);R.wrongPick=c;R.line=null;SFX.play('wrong');setTimeout(()=>SFX.play('rewind'),260);
  R.el.classList.remove('rewinding');void R.el.offsetWidth;R.el.classList.add('rewinding');render();
 }
 function next(){
  if(R.i+1<R.list.length){R.i++;R.tried=new Set();R.done=false;R.wrongPick=0;R.hint=false;R.showPre=false;R.open=null;R.line=null;render();return;}
  finish();
 }
 function finish(){
  const res={first:R.first,total:R.list.length},el=R.el;SFX.play('clear');
  el.innerHTML=`<div class="qz-panel qz-result"><small>RESULT</small><h2>첫 시도 정답 ${res.first} / ${res.total}</h2><p>${res.first===res.total?'전부 맞혔어요! 주인님 최고예요♪':res.first*2>=res.total?'좋아요. 틀린 문제는 다음에 먼저 나와요.':'괜찮아요. 오늘 본 단서는 다음에 꼭 기억날 거예요.'}</p><button class="primary" data-back>계속 ▶</button></div>`;
  const done=R.onDone;el.querySelector('[data-back]').onclick=e=>{e.stopPropagation();close();done(res);};
 }
 function close(){if(R?.el)R.el.remove();R=null;}
 // ── 타이틀의 「기출 풀기」 로비.
 function lobby(back){
  BGM.play('bgm_daily');document.body.classList.add('vn-mode');
  const rounds=[...new Set(QS.filter(q=>!q.pred).map(q=>q.r))].sort((a,b)=>b-a),eras=['선사','초기국가','삼국','남북국','고려','조선전기','조선후기','근대','일제강점기','현대','통합'].filter(e=>QS.some(q=>q.era===e)),st=stats();
  const acc=f=>{const qs=QS.filter(f),r=qs.filter(q=>records.quiz[key(q)]?.last).length;return `${r}/${qs.length}`;};
  $('#main').innerHTML=`<section class="qz-lobby"><img class="qz-lobby-bg" src="${asset('bg_study_cafe.webp')}" alt=""><div class="qz-lobby-body"><header><small>PRACTICE · 기출 풀기</small><h2>어디부터 풀까요, 주인님?</h2><p>풀어 본 문항 ${st.seen}/${st.total} · 최근 정답 ${st.right}</p><button class="quiet" data-back>← 타이틀</button></header>
   <h3>시대별 10문항 <span>(안 푼 문항 → 최근에 틀린 문항 순)</span></h3><div class="qz-grid">${eras.map(e=>`<button data-era="${esc(e)}"><b>${esc(e)}</b><span>최근 정답 ${acc(q=>q.era===e)}</span></button>`).join('')}</div>
   <h3>오르페이아 자작문제</h3><div class="qz-grid"><button data-mock><b>자작문제 모의고사</b><span>기출 시대 비중대로 50문항 · 최근 정답 ${(()=>{const l=mockList();return l.filter(q=>records.quiz[key(q)]?.last).length+'/'+l.length})()}</span></button></div>
   <h3>회차 전체 50문항</h3><div class="qz-grid">${rounds.map(r=>`<button data-round="${r}"><b>제${r}회</b><span>최근 정답 ${acc(q=>q.r===r)}</span></button>`).join('')}</div>
   <h3>틀린 문제만</h3><div class="qz-grid"><button data-wrong><b>최근에 틀린 문항</b><span>${QS.filter(q=>records.quiz[key(q)]&&!records.quiz[key(q)].last).length}문항</span></button></div></div></section>`;
  const host=$('.qz-lobby'),again=()=>lobby(back);
  host.querySelector('[data-back]').onclick=back;
  host.querySelectorAll('[data-era]').forEach(b=>b.onclick=()=>run(`era=${b.dataset.era} n=10`,{host,onDone:again,title:b.dataset.era}));
  host.querySelector('[data-mock]').onclick=()=>run(mockList(),{host,onDone:again,title:'자작문제 모의고사'});
  host.querySelectorAll('[data-round]').forEach(b=>b.onclick=()=>run(`round=${b.dataset.round}`,{host,onDone:again,title:`제${b.dataset.round}회`}));
  host.querySelector('[data-wrong]').onclick=()=>{const l=QS.filter(q=>records.quiz[key(q)]&&!records.quiz[key(q)].last);if(!l.length)return toast('최근에 틀린 문항이 없어요♪');run(l.slice(0,20),{host,onDone:again,title:'오답 다시'});};
 }
 document.addEventListener('keydown',e=>{if(!R||document.querySelector('dialog[open]'))return;if(/^[1-5]$/.test(e.key)&&!R.done){e.preventDefault();const b=R.el.querySelector(`[data-c="${e.key}"]`);if(b&&!b.disabled)answer(+e.key);}else if((e.key==='Enter'||e.key===' ')&&R.done){e.preventDefault();R.el.querySelector('[data-next],[data-back]')?.click();}});
 return {run,lobby,close,stats,lastRound,active:()=>!!R};
})();
