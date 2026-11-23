'use strict';
// 미니게임 모드(2026.11): 연표 꿰기 · 누구일까요 · 짝 맞추기, 그리고 엔딩 뒤 「아내 대결」.
// 아내 대결은 묵 배틀처럼 맞힐 때마다 의상이 한 단계씩 풀린다(CG cg_wife_<id>_b0~b3). 기록은 records.wife[id] = 본 최고 단계.
window.MiniGame=(()=>{
 const E=()=>window.MG_EVENTS||[],PE=()=>window.MG_PEOPLE||[],W=()=>window.MG_WIFE||{};
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const yr=y=>y<0?`기원전 ${-y}`:`${y}`;
 const sfx=n=>{try{SFX.play(n);}catch{}};
 const wifeOpen=()=>(records.endings||[]).length>0;
 const heroes=()=>(window.PROFILES||[]).filter(p=>/히로인|기방/.test(p.group)&&W()[p.id]);
 let dlg,onClose;
 function frame(title,sub,body){
  dlg=$('#vnLog');dlg.className='sheets gallery mg';
  dlg.innerHTML=`<div class="dialog-header"><div><small>${esc(sub)}</small><h2>${esc(title)}</h2></div><button class="quiet" data-close>닫기 ×</button></div><div class="gl-body mg-body">${body}</div>`;
  dlg.querySelector('[data-close]').onclick=()=>{dlg.close();dlg.className='';onClose?.();};
  if(!dlg.open)dlg.showModal();
  return dlg.querySelector('.mg-body');
 }
 // ── 문제 세 가지. 각각 area(요소)에 그리고, 끝나면 done(맞음?) 을 부른다.
 function qOrder(area,done){
  const ev=[...E()].sort((a,b)=>a[0]-b[0]);const st=Math.floor(Math.random()*Math.max(1,ev.length-9));
  const set=shuffle(ev.slice(st,st+9)).slice(0,4);const ans=[...set].sort((a,b)=>a[0]-b[0]);const picked=[];
  area.innerHTML=`<p class="mg-q">일어난 순서대로 눌러 연표를 꿰어요.</p><div class="mg-order">${set.map((e,i)=>`<button data-i="${i}"><i></i>${esc(e[1])}</button>`).join('')}</div><div class="mg-foot"><button class="quiet" data-reset>다시 고르기</button></div>`;
  const btns=[...area.querySelectorAll('[data-i]')];
  const check=()=>{const ok=picked.every((e,k)=>e[0]===ans[k][0]);
   btns.forEach(b=>{const e=set[+b.dataset.i];b.disabled=true;b.querySelector('i').textContent=yr(e[0]);b.classList.add(ans.indexOf(e)===picked.indexOf(e)?'ok':'ng');});
   area.querySelector('.mg-foot').innerHTML=`<p class="mg-res ${ok?'ok':'ng'}">${ok?'연표가 이어졌어요!':'순서가 엉켰어요. 정답: '+ans.map(e=>`${yr(e[0])} ${esc(e[1])}`).join(' → ')}</p><button class="primary" data-next>다음 ▶</button>`;
   sfx(ok?'correct':'wrong');area.querySelector('[data-next]').onclick=()=>done(ok);};
  btns.forEach(b=>b.onclick=()=>{const e=set[+b.dataset.i];if(picked.includes(e))return;picked.push(e);b.classList.add('on');b.querySelector('i').textContent=picked.length;sfx('select');if(picked.length===set.length)check();});
  area.querySelector('[data-reset]').onclick=()=>{picked.length=0;btns.forEach(b=>{b.classList.remove('on');b.querySelector('i').textContent='';});};
 }
 function qWho(area,done){
  const p=pick(PE());const same=shuffle(PE().filter(x=>x!==p&&x[1]===p[1]));const other=shuffle(PE().filter(x=>x!==p&&x[1]!==p[1]));
  const opts=shuffle([p,...same.slice(0,2),...other].slice(0,4));
  area.innerHTML=`<p class="mg-q">누구일까요? <small>(${esc(p[1])})</small></p><blockquote class="mg-clue">${esc(p[2])}</blockquote><div class="mg-opts">${opts.map((o,i)=>`<button data-o="${i}">${esc(o[0])}</button>`).join('')}</div><div class="mg-foot"></div>`;
  area.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>{const o=opts[+b.dataset.o],ok=o===p;
   area.querySelectorAll('[data-o]').forEach(x=>{x.disabled=true;if(opts[+x.dataset.o]===p)x.classList.add('ok');});if(!ok)b.classList.add('ng');
   sfx(ok?'correct':'wrong');area.querySelector('.mg-foot').innerHTML=`<p class="mg-res ${ok?'ok':'ng'}">${ok?'정답!':`정답은 ${esc(p[0])}. ${esc(o[0])}은(는) 「${esc(o[2])}」`}</p><button class="primary" data-next>다음 ▶</button>`;
   area.querySelector('[data-next]').onclick=()=>done(ok);});
 }
 function qPairs(area,done){
  const ps=shuffle(PE()).slice(0,4),right=shuffle(ps);let sel=null,miss=0,got=0;
  area.innerHTML=`<p class="mg-q">단서와 인물을 짝지어요. 단서를 먼저 고르고, 이름을 누르세요.</p><div class="mg-pairs"><div>${ps.map((p,i)=>`<button data-l="${i}">${esc(p[2])}</button>`).join('')}</div><div>${right.map((p,i)=>`<button data-r="${i}">${esc(p[0])}</button>`).join('')}</div></div><div class="mg-foot"></div>`;
  const L=[...area.querySelectorAll('[data-l]')],R=[...area.querySelectorAll('[data-r]')];
  L.forEach(b=>b.onclick=()=>{if(b.disabled)return;L.forEach(x=>x.classList.remove('on'));b.classList.add('on');sel=ps[+b.dataset.l];sfx('select');});
  R.forEach(b=>b.onclick=()=>{if(!sel||b.disabled)return;const p=right[+b.dataset.r];
   if(p===sel){got++;b.disabled=true;b.classList.add('ok');const lb=L[ps.indexOf(sel)];lb.disabled=true;lb.classList.remove('on');lb.classList.add('ok');sel=null;sfx('correct');
    if(got===ps.length){const ok=miss<=1;area.querySelector('.mg-foot').innerHTML=`<p class="mg-res ${ok?'ok':'ng'}">${ok?'다 맞췄어요!':`다 맞췄지만 ${miss}번 헛짚었어요.`}</p><button class="primary" data-next>다음 ▶</button>`;area.querySelector('[data-next]').onclick=()=>done(ok);}}
   else{miss++;b.classList.add('ng');setTimeout(()=>b.classList.remove('ng'),400);sfx('wrong');}});
 }
 const KINDS={order:['연표 꿰기',qOrder],who:['누구일까요',qWho],pairs:['짝 맞추기',qPairs]};
 // ── 혼자 하기: 10문제 연속.
 function solo(kind){
  const [name,fn]=KINDS[kind];let n=0,ok=0,streak=0,best=(records.mgBest||{})[kind]||0;
  const next=()=>{if(n>=10){const b=records.mgBest||(records.mgBest={});if(ok>(b[kind]||0)){b[kind]=ok;save();}
    const a=frame(name,'MINI GAME','');a.innerHTML=`<div class="mg-result"><img src="${asset('st_orpheia_smile.webp')}" alt=""><div><h3>${ok} / 10</h3><p>${ok>=9?'완벽해요, 주인님! 연표가 하나도 안 번졌어요.':ok>=6?'좋아요. 틀린 건 기출 풀기에서 한 번 더 봐요.':'괜찮아요. 이유와 함께 다시 보면 금방 붙어요.'}</p><p><small>최고 기록 ${Math.max(best,ok)} / 10</small></p><button class="primary" data-again>한 번 더</button> <button data-lobby>미니게임 목록</button></div></div>`;
    a.querySelector('[data-again]').onclick=()=>solo(kind);a.querySelector('[data-lobby]').onclick=()=>lobby();return;}
   n++;const a=frame(name,`MINI GAME · ${n} / 10 · 정답 ${ok} · 연속 ${streak}`,'<div class="mg-stage"></div>');
   fn(a.querySelector('.mg-stage'),r=>{if(r){ok++;streak++;}else streak=0;next();});};
  next();
 }
 // ── 아내 대결.
 const STEP=2,ROUNDS=10;
 function battle(id){
  const p=(window.PROFILES||[]).find(x=>x.id===id),L=W()[id];let n=0,ok=0,stage=0;
  const cg=s=>asset(`cg_wife_${id}_b${s}.webp`);
  const draw=(line)=>{const a=frame(`아내 대결 · ${p.name}`,`WIFE BATTLE · ${n} / ${ROUNDS} · 정답 ${ok}`,`<div class="mg-battle"><figure><img class="mg-cg" src="${cg(stage)}" onerror="this.onerror=null;this.src='${asset((CAST_FACE(id)))}'" alt=""><figcaption><b>${esc(p.name)}</b> ${esc(line)}</figcaption><div class="mg-pips">${[1,2,3].map(i=>`<i class="${stage>=i?'on':''}"></i>`).join('')}</div></figure><div class="mg-stage"></div></div>`);return a.querySelector('.mg-stage');};
  const finish=()=>{const w=records.wife||(records.wife={});if(stage>(w[id]||0)){w[id]=stage;save();}
   const a=draw(stage>=3?L.b3:'……오늘은 여기까지예요. 다음엔 지지 않을 거예요.');
   a.innerHTML=`<div class="mg-result"><div><h3>${stage>=3?'완승!':`${stage} / 3 단계`}</h3><p>정답 ${ok} / ${ROUNDS}. ${STEP}문제 맞힐 때마다 한 단계씩 풀려요.</p><button class="primary" data-again>다시 대결</button> <button data-wives>아내 목록</button></div></div>`;
   a.querySelector('[data-again]').onclick=()=>battle(id);a.querySelector('[data-wives]').onclick=()=>wives();};
  const round=(line)=>{if(n>=ROUNDS||stage>=3)return finish();n++;const area=draw(line);const kind=pick(Object.keys(KINDS));
   KINDS[kind][1](area,r=>{if(r){ok++;const s=Math.min(3,Math.floor(ok/STEP));if(s>stage){stage=s;sfx('vb_rip');return round(L['b'+s]);}sfx('vb_combo');return round('……아직이에요.');}sfx('vb_ink');round(L.miss);});};
  round(L.start);
 }
 const CAST_FACE=id=>`st_${id}_smile.webp`;
 function wives(){
  const w=records.wife||{};const a=frame('아내 대결','WIFE BATTLE','');
  a.innerHTML=`<p class="mg-sum">문제를 ${STEP}개 맞힐 때마다 상대의 옷이 한 단계씩 풀려요(묵 배틀과 같은 규칙). 본 단계는 여기서 다시 볼 수 있어요.</p><div class="pf-grid">${heroes().map(p=>`<button class="pf-card" data-w="${p.id}"><span class="pf-face"><img loading="lazy" src="${asset(CAST_FACE(p.id))}" alt=""></span><b>${esc(p.name)}</b><small>${'★'.repeat(w[p.id]||0)}${'☆'.repeat(3-(w[p.id]||0))}</small></button>`).join('')}</div><div class="mg-foot"><button data-lobby>◀ 미니게임 목록</button></div>`;
  a.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>pickWife(b.dataset.w));a.querySelector('[data-lobby]').onclick=()=>lobby();
 }
 function pickWife(id){
  const p=(window.PROFILES||[]).find(x=>x.id===id),m=(records.wife||{})[id]||0;const a=frame(`아내 대결 · ${p.name}`,'WIFE BATTLE','');let v=m;
  const show=()=>{a.innerHTML=`<div class="mg-battle"><figure><img class="mg-cg" src="${asset(`cg_wife_${id}_b${v}.webp`)}" alt=""><figcaption><b>${esc(p.name)}</b> ${esc(v?W()[id]['b'+v]:W()[id].start)}</figcaption><div class="mg-pips">${[1,2,3].map(i=>`<i class="${v>=i?'on':''}"></i>`).join('')}</div></figure><div class="mg-stage"><p class="mg-sum">${esc(p.sub)}</p>${m?`<p><button data-v="-1">◀</button> 단계 ${v} / ${m} <button data-v="1">▶</button></p>`:''}<button class="primary" data-go>대결 시작</button> <button data-wives>아내 목록</button></div></div>`;
   a.querySelector('[data-go]').onclick=()=>battle(id);a.querySelector('[data-wives]').onclick=()=>wives();
   a.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{v=Math.max(0,Math.min(m,v+ +b.dataset.v));show();});};
  show();
 }
 function lobby(){
  const b=records.mgBest||{};const a=frame('미니게임','MINI GAME','');
  a.innerHTML=`<p class="mg-sum">이야기 밖에서 가볍게 한 판. 문제는 기출 단골 사실로만 만들었어요.</p><div class="mg-menu">
   <button data-k="order"><b>📜 연표 꿰기</b><small>가까운 시대 사건 넷을 일어난 순서대로 꿴다. 순서 배열 문제 연습.</small><i>최고 ${b.order||0}/10</i></button>
   <button data-k="who"><b>🔔 누구일까요</b><small>단서 한 줄로 인물을 고른다. 승려·왕·학자·독립운동가.</small><i>최고 ${b.who||0}/10</i></button>
   <button data-k="pairs"><b>🧩 짝 맞추기</b><small>단서 넷과 이름 넷을 짝짓는다.</small><i>최고 ${b.pairs||0}/10</i></button>
   ${wifeOpen()?`<button data-k="wife" class="mg-wife"><b>💍 아내 대결</b><small>엔딩 뒤 열림. 맞힐 때마다 상대의 옷이 한 단계씩.</small><i>완승 ${Object.values(records.wife||{}).filter(x=>x>=3).length}/${heroes().length}</i></button>`:`<button disabled class="mg-wife"><b>🔒 ？？？</b><small>엔딩을 하나 보면 열려요.</small></button>`}
  </div>`;
  a.querySelectorAll('[data-k]').forEach(x=>x.onclick=()=>x.dataset.k==='wife'?wives():solo(x.dataset.k));
 }
 return {open(cb){onClose=cb;lobby();}};
})();
