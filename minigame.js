'use strict';
// 미니게임 모드(2026.11): 연표 꿰기 · 누구일까요 · 짝 맞추기, 그리고 엔딩 뒤 「아내 대결」.
// 아내 대결은 묵 배틀처럼 맞힐 때마다 의상이 한 단계씩 풀린다(CG cg_wife_<id>_b0~b3). 기록은 records.wife[id] = 본 최고 단계.
// 화면은 「연표 아케이드」: 밤하늘 남색 + 금빛 연표 줄, 오르페이아 문장. 숫자키 1~4 고르기, Enter 다음.
window.MiniGame=(()=>{
 const E=()=>window.MG_EVENTS||[],PE=()=>window.MG_PEOPLE||[],W=()=>window.MG_WIFE||{};
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const yr=y=>y<0?`BC ${-y}`:`${y}`;
 const sfx=n=>{try{SFX.play(n);}catch{}};
 const wifeOpen=()=>(records.endings||[]).length>0;
 const heroes=()=>(window.PROFILES||[]).filter(p=>W()[p.id]);
 const face=id=>asset(`st_${id}_smile.webp`);
 let dlg,onClose,keyFn=null;
 // ── 틀: 위 HUD + 본문.
 function frame({title,sub='MINI GAME',back,prog,score}){
  dlg=$('#vnLog');dlg.className='mgx-dlg';
  const bar=prog?`<div class="mgx-prog">${prog.marks.map((m,i)=>`<i class="${m===1?'ok':m===0?'ng':i===prog.cur?'cur':''}"></i>`).join('')}</div>`:'<div></div>';
  dlg.innerHTML=`<div class="mgx"><header class="mgx-hud">${back?'<button class="mgx-ico" data-back title="뒤로">‹</button>':'<span class="mgx-ico ghost"></span>'}<div class="mgx-title"><small>${esc(sub)}</small><b>${esc(title)}</b></div>${bar}<div class="mgx-score">${score||''}</div><button class="mgx-ico" data-close title="닫기">✕</button></header><main class="mgx-main"></main><div class="mgx-flash" hidden></div></div>`;
  dlg.querySelector('[data-close]').onclick=()=>{dlg.close();dlg.className='';keyFn=null;onClose?.();};
  if(back)dlg.querySelector('[data-back]').onclick=back;
  keyFn=null;
  if(!dlg.open)dlg.showModal();
  return dlg.querySelector('.mgx-main');
 }
 document.addEventListener('keydown',e=>{if(!dlg?.open||!dlg.classList.contains('mgx-dlg')||!keyFn)return;if(keyFn(e)){e.preventDefault();e.stopPropagation();}},true);
 function flash(ok){const f=dlg.querySelector('.mgx-flash');f.hidden=false;f.className='mgx-flash '+(ok?'ok':'ng');f.textContent=ok?'정답!':'땡!';setTimeout(()=>{f.hidden=true;},650);}
 const nextBtn=(foot,done,ok)=>{foot.insertAdjacentHTML('beforeend','<button class="mgx-next" data-next>다음 <kbd>Enter</kbd></button>');const go=()=>{keyFn=null;done(ok);};foot.querySelector('[data-next]').onclick=go;keyFn=e=>{if(e.key==='Enter'){go();return true;}};};
 // ── 문제 세 가지. area에 그리고, 끝나면 done(맞음?).
 function qOrder(area,done){
  const ev=[...E()].sort((a,b)=>a[0]-b[0]);const st=Math.floor(Math.random()*Math.max(1,ev.length-9));
  const set=shuffle(ev.slice(st,st+9)).slice(0,4);const ans=[...set].sort((a,b)=>a[0]-b[0]);const picked=[];
  area.innerHTML=`<p class="mgx-q">일어난 <em>순서대로</em> 눌러 연표를 꿰어요</p>
  <ol class="mgx-rail">${set.map((_,i)=>`<li data-slot="${i}"><span>${i+1}</span><b></b><i></i></li>`).join('')}</ol>
  <div class="mgx-cards">${set.map((e,i)=>`<button data-i="${i}"><kbd>${i+1}</kbd>${esc(e[1])}</button>`).join('')}</div><div class="mgx-foot"><button class="mgx-ghost" data-reset>다시 고르기</button></div>`;
  const btns=[...area.querySelectorAll('[data-i]')],slots=[...area.querySelectorAll('[data-slot]')];
  const paint=()=>{slots.forEach((s,k)=>{s.classList.toggle('filled',!!picked[k]);s.querySelector('b').textContent=picked[k]?.[1]||'';});btns.forEach(b=>b.classList.toggle('used',picked.includes(set[+b.dataset.i])));};
  const check=()=>{const ok=picked.every((e,k)=>e===ans[k]);
   slots.forEach((s,k)=>{s.querySelector('i').textContent=yr(picked[k][0]);s.classList.add(picked[k]===ans[k]?'ok':'ng');});
   btns.forEach(b=>b.disabled=true);flash(ok);sfx(ok?'correct':'wrong');
   const foot=area.querySelector('.mgx-foot');foot.innerHTML=ok?'<p class="mgx-res ok">연표가 이어졌어요!</p>':`<p class="mgx-res ng">바른 순서 ${ans.map(e=>`<span>${yr(e[0])} ${esc(e[1])}</span>`).join('<b>→</b>')}</p>`;nextBtn(foot,done,ok);};
  const choose=i=>{const e=set[i];if(!e||picked.includes(e)||picked.length>=set.length)return;picked.push(e);sfx('select');paint();if(picked.length===set.length)check();};
  btns.forEach(b=>b.onclick=()=>choose(+b.dataset.i));
  area.querySelector('[data-reset]').onclick=()=>{picked.length=0;paint();};
  keyFn=e=>{if(/^[1-4]$/.test(e.key)){choose(+e.key-1);return true;}};
 }
 function qWho(area,done){
  const p=pick(PE());const same=shuffle(PE().filter(x=>x!==p&&x[1]===p[1]));const other=shuffle(PE().filter(x=>x!==p&&x[1]!==p[1]));
  const opts=shuffle([p,...same.slice(0,2),...other].slice(0,4));let over=false;
  area.innerHTML=`<p class="mgx-q">이 사람은 <em>누구</em>일까요?</p><figure class="mgx-quote"><span class="mgx-chip">${esc(p[1])}</span><blockquote>${esc(p[2])}</blockquote></figure><div class="mgx-opts">${opts.map((o,i)=>`<button data-o="${i}"><kbd>${i+1}</kbd>${esc(o[0])}</button>`).join('')}</div><div class="mgx-foot"></div>`;
  const choose=i=>{if(over||!opts[i])return;over=true;const o=opts[i],ok=o===p;
   area.querySelectorAll('[data-o]').forEach(x=>{x.disabled=true;if(opts[+x.dataset.o]===p)x.classList.add('ok');else if(+x.dataset.o===i)x.classList.add('ng');});
   flash(ok);sfx(ok?'correct':'wrong');const foot=area.querySelector('.mgx-foot');
   foot.innerHTML=ok?`<p class="mgx-res ok">${esc(p[0])}, 정답!</p>`:`<p class="mgx-res ng">정답은 <b>${esc(p[0])}</b>. 고른 ${esc(o[0])}은(는) 「${esc(o[2])}」</p>`;nextBtn(foot,done,ok);};
  area.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>choose(+b.dataset.o));
  keyFn=e=>{if(/^[1-4]$/.test(e.key)){choose(+e.key-1);return true;}};
 }
 function qPairs(area,done){
  const ps=shuffle(PE()).slice(0,4),right=shuffle(ps);let sel=null,miss=0,got=0;
  area.innerHTML=`<p class="mgx-q">단서와 인물을 <em>짝</em>지어요 <small>단서를 고르고 이름을 누르세요 · 헛짚기 ${'<i class="mgx-heart"></i>'.repeat(2)}</small></p><div class="mgx-pairs"><div>${ps.map((p,i)=>`<button data-l="${i}">${esc(p[2])}</button>`).join('')}</div><div>${right.map((p,i)=>`<button data-r="${i}">${esc(p[0])}</button>`).join('')}</div></div><div class="mgx-foot"></div>`;
  const L=[...area.querySelectorAll('[data-l]')],R=[...area.querySelectorAll('[data-r]')],hearts=[...area.querySelectorAll('.mgx-heart')];
  L.forEach(b=>b.onclick=()=>{if(b.disabled)return;L.forEach(x=>x.classList.remove('on'));b.classList.add('on');sel=ps[+b.dataset.l];sfx('select');});
  R.forEach(b=>b.onclick=()=>{if(!sel||b.disabled)return;const p=right[+b.dataset.r];
   if(p===sel){got++;b.disabled=true;b.classList.add('ok');const lb=L[ps.indexOf(sel)];lb.disabled=true;lb.classList.remove('on');lb.classList.add('ok');sel=null;sfx('correct');
    if(got===ps.length){const ok=miss<=1;flash(ok);const foot=area.querySelector('.mgx-foot');foot.innerHTML=`<p class="mgx-res ${ok?'ok':'ng'}">${ok?'네 쌍 모두 짝지었어요!':`다 맞췄지만 ${miss}번 헛짚었어요.`}</p>`;nextBtn(foot,done,ok);}}
   else{miss++;if(hearts[miss-1])hearts[miss-1].classList.add('lost');b.classList.add('ng');setTimeout(()=>b.classList.remove('ng'),450);sfx('wrong');}});
 }
 const KINDS={order:['연표 꿰기',qOrder,'📜'],who:['누구일까요',qWho,'🔔'],pairs:['짝 맞추기',qPairs,'🧩']};
 const rank=n=>n>=10?'S':n>=8?'A':n>=6?'B':n>=4?'C':'D';
 // ── 혼자 하기: 10문제.
 function solo(kind){
  const [name,fn]=KINDS[kind];const marks=Array(10).fill(null);let n=0,ok=0,streak=0,best=(records.mgBest||{})[kind]||0;
  const next=()=>{
   if(n>=10){const b=records.mgBest||(records.mgBest={});const nb=ok>(b[kind]||0);if(nb){b[kind]=ok;save();}
    const a=frame({title:name,sub:'RESULT',back:lobby});const r=rank(ok);
    a.innerHTML=`<div class="mgx-result"><div class="mgx-rank r-${r}"><small>RANK</small><b>${r}</b></div><div class="mgx-rtext"><h3>${ok} <small>/ 10</small></h3>${nb?'<p class="mgx-new">NEW RECORD</p>':''}<p>${ok>=9?'완벽해요, 주인님! 연표가 하나도 안 번졌어요.':ok>=6?'좋아요. 틀린 건 기출 풀기에서 한 번 더 봐요.':'괜찮아요. 이유와 함께 다시 보면 금방 붙어요.'}</p><p class="mgx-dim">최고 기록 ${Math.max(best,ok)} / 10</p><div class="mgx-row"><button class="mgx-next" data-again>한 판 더</button><button class="mgx-ghost" data-lobby>목록으로</button></div></div><img class="mgx-orp" src="${asset(ok>=6?'st_orpheia_smile.webp':'st_orpheia_worry.webp')}" alt=""></div>`;
    a.querySelector('[data-again]').onclick=()=>solo(kind);a.querySelector('[data-lobby]').onclick=()=>lobby();sfx(ok>=6?'vb_finish':'vb_end');return;}
   const a=frame({title:name,back:lobby,prog:{marks,cur:n},score:`정답 <b>${ok}</b>${streak>1?` <span class="mgx-combo">${streak} COMBO</span>`:''}`});
   fn(a,r=>{marks[n]=r?1:0;n++;if(r){ok++;streak++;}else streak=0;next();});};
  next();
 }
 // ── 아내 대결.
 const STEP=2,ROUNDS=10;
 function battle(id){
  const p=(window.PROFILES||[]).find(x=>x.id===id),L=W()[id];const marks=Array(ROUNDS).fill(null);let n=0,ok=0,stage=0,line=L.start;
  const stageView=()=>`<figure class="mgx-cgbox"><img class="mgx-cg" src="${asset(`cg_wife_${id}_b${stage}.webp`)}" onerror="this.onerror=null;this.classList.add('stand');this.src='${face(id)}'" alt=""><div class="mgx-pips">${[1,2,3].map(i=>`<i class="${stage>=i?'on':''}"></i>`).join('')}</div><figcaption><span class="mgx-name">${esc(p.name)}</span>${esc(line)}</figcaption></figure>`;
  const draw=()=>{const a=frame({title:p.name,sub:'WIFE BATTLE',back:wives,prog:{marks,cur:n},score:`<span class="mgx-stage">STAGE ${stage}/3</span>`});a.innerHTML=`<div class="mgx-battle">${stageView()}<div class="mgx-side"></div></div>`;return a.querySelector('.mgx-side');};
  const finish=()=>{const w=records.wife||(records.wife={});if(stage>(w[id]||0)){w[id]=stage;save();}line=stage>=3?L.b3:'……오늘은 여기까지예요. 다음엔 지지 않을 거예요.';
   const s=draw();s.innerHTML=`<div class="mgx-result compact"><div class="mgx-rank r-${stage>=3?'S':stage>=2?'A':stage>=1?'B':'D'}"><small>${stage>=3?'완승':'STAGE'}</small><b>${stage>=3?'★':stage}</b></div><div class="mgx-rtext"><h3>${ok} <small>/ ${ROUNDS}</small></h3><div class="mgx-row"><button class="mgx-next" data-again>다시 대결</button><button class="mgx-ghost" data-wives>아내 목록</button></div></div></div>`;
   s.querySelector('[data-again]').onclick=()=>battle(id);s.querySelector('[data-wives]').onclick=()=>wives();sfx(stage>=3?'vb_ko':'vb_end');};
  const round=()=>{if(n>=ROUNDS||stage>=3)return finish();const side=draw();const kind=pick(Object.keys(KINDS));
   KINDS[kind][1](side,r=>{marks[n]=r?1:0;n++;if(r){ok++;const s=Math.min(3,Math.floor(ok/STEP));if(s>stage){stage=s;line=L['b'+s];sfx('vb_rip');}else{line='……아직이에요. 아직 한 겹 남았어요.';sfx('vb_combo');}}else{line=L.miss;sfx('vb_ink');}round();});};
  sfx('vb_start');round();
 }
 function wives(){
  const w=records.wife||{};const a=frame({title:'아내 대결',sub:'WIFE BATTLE',back:lobby,score:`완승 <b>${Object.values(w).filter(x=>x>=3).length}</b> / ${heroes().length}`});
  a.innerHTML=`<p class="mgx-dim center">두 문제를 맞힐 때마다 상대의 옷이 한 겹씩 풀려요.</p><div class="mgx-wives">${heroes().map(p=>`<button data-w="${p.id}" class="${(w[p.id]||0)>=3?'clear':''}"><span><img loading="lazy" src="${face(p.id)}" alt=""></span><b>${esc(p.name)}</b><em>${[1,2,3].map(i=>`<i class="${(w[p.id]||0)>=i?'on':''}"></i>`).join('')}</em></button>`).join('')}</div>`;
  a.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>pickWife(b.dataset.w));
 }
 function pickWife(id){
  const p=(window.PROFILES||[]).find(x=>x.id===id),m=(records.wife||{})[id]||0;let v=m;
  const show=()=>{const a=frame({title:p.name,sub:'WIFE BATTLE',back:wives});
   a.innerHTML=`<div class="mgx-battle"><figure class="mgx-cgbox"><img class="mgx-cg" src="${asset(`cg_wife_${id}_b${v}.webp`)}" onerror="this.onerror=null;this.classList.add('stand');this.src='${face(id)}'" alt=""><div class="mgx-pips">${[1,2,3].map(i=>`<i class="${v>=i?'on':''}"></i>`).join('')}</div><figcaption><span class="mgx-name">${esc(p.name)}</span>${esc(v?W()[id]['b'+v]:W()[id].start)}</figcaption></figure>
   <div class="mgx-side"><p class="mgx-chip">${esc(p.sub)}</p><h3 class="mgx-h">${esc(p.name)}</h3><p class="mgx-dim">${esc(p.era)}</p>${m?`<div class="mgx-row"><button class="mgx-ghost" data-v="-1">◀</button><span class="mgx-dim">본 단계 ${v} / ${m}</span><button class="mgx-ghost" data-v="1">▶</button></div>`:'<p class="mgx-dim">아직 본 단계가 없어요.</p>'}<div class="mgx-row"><button class="mgx-next" data-go>대결 시작</button></div></div></div>`;
   a.querySelector('[data-go]').onclick=()=>battle(id);
   a.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{v=Math.max(0,Math.min(m,v+ +b.dataset.v));show();});};
  show();
 }
 function lobby(){
  const b=records.mgBest||{},w=records.wife||{};const a=frame({title:'연표 아케이드',sub:'MINI GAME'});
  const tile=(k,ic,t,d,img,badge,lock)=>`<button class="mgx-tile${lock?' lock':''}" ${lock?'disabled':`data-k="${k}"`} style="--img:url('${asset(img)}')"><span class="mgx-ic">${ic}</span><b>${t}</b><small>${d}</small>${badge?`<em>${badge}</em>`:''}</button>`;
  a.innerHTML=`<div class="mgx-lobby"><section class="mgx-hero"><div><small>ORPHEIA ARCADE</small><h3>오늘은 <em>한 판</em>만 해요, 주인님</h3><p>연표가 다시 번지지 않게 조금씩 꿰어 둬요. 헷갈린 건 「기출 풀기」에서 한 번 더 보면 돼요.</p></div><img src="${asset('st_orpheia_excited.webp')}" alt=""></section>
  <div class="mgx-tiles">
   ${tile('order','📜','연표 꿰기','가까운 시대 사건 넷을 일어난 순서대로','bg_timeline_dive.webp',`BEST ${b.order||0}/10`)}
   ${tile('who','🔔','누구일까요','단서 한 줄로 인물 맞히기','cg_ch09_ullim_voices.webp',`BEST ${b.who||0}/10`)}
   ${tile('pairs','🧩','짝 맞추기','단서 넷 ↔ 이름 넷','cg_ch04_campfire.webp',`BEST ${b.pairs||0}/10`)}
   ${wifeOpen()?tile('wife','💍','아내 대결','맞힐 때마다 상대의 옷이 한 단계씩','cg_end_harem.webp',`완승 ${Object.values(w).filter(x=>x>=3).length}/${heroes().length}`):tile('','🔒','？？？','엔딩을 하나 보면 열려요','bg_studio_night.webp','',true)}
  </div></div>`;
  a.querySelectorAll('[data-k]').forEach(x=>x.onclick=()=>x.dataset.k==='wife'?wives():solo(x.dataset.k));
 }
 return {open(cb){onClose=cb;lobby();}};
})();
