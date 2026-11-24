'use strict';
// 미니게임 모드(2026.11): 연표 꿰기 · 누구일까요 · 짝 맞추기 · 이 유물은? · 먼저일까?(60초), 그리고 엔딩 뒤 「아내 대결」.
// 2026.11 보강: 시대 고르기(records.mgEra), 결과 화면의 「헷갈린 것」 복습, 랭크별 오르페이아 CG(cg_mg_rank_*),
//   모드별 그림(cg_mg_<모드>, 아직 안 뽑혔으면 예전 그림), 아내 대결 완승 CG(cg_wife_<id>_win, 대사 MG_WIFE[id].win).
// 아내 대결은 묵 배틀처럼 맞힐 때마다 의상이 한 단계씩 풀린다(CG cg_wife_<id>_b0~b3). 기록은 records.wife[id] = 본 최고 단계(3이면 완승 CG도 열림).
// 화면은 「연표 아케이드」: 밤하늘 남색 + 금빛 연표 줄, 오르페이아 문장. 숫자키 1~4 고르기, Enter 다음.
window.MiniGame=(()=>{
 const E=()=>window.MG_EVENTS||[],PE=()=>window.MG_PEOPLE||[],W=()=>window.MG_WIFE||{},RL=()=>window.MG_RELICS||{},ERAS=()=>window.MG_ERAS||[];
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const yr=y=>y<0?`BC ${-y}`:`${y}`;
 const sfx=n=>{try{SFX.play(n);}catch{}};
 const wifeOpen=()=>(records.endings||[]).length>0;
 const heroes=()=>(window.PROFILES||[]).filter(p=>W()[p.id]);
 const face=id=>asset(`st_${id}_smile.webp`);
 // ── 시대 고르기: 사건은 연도로, 인물은 시대 칸으로, 유물은 시대로 거른다.
 const ERA={all:['전체 시대',-1e4,1e4],anc:['고대',-1e4,935],gor:['고려',918,1392],jos:['조선',1392,1862],mod:['근현대',1863,1e4]};
 const PGROUP={'고구려':'anc','백제':'anc','신라':'anc','발해':'anc','통일 신라':'anc','신라 하대':'anc','후삼국':'anc','고려':'gor','조선 전기':'jos','조선':'jos','조선 후기':'jos','조선 말':'mod','근대':'mod','일제 강점기':'mod','현대':'mod'};
 const RGROUP=e=>({'고려':'gor','조선 전기':'jos','조선 후기':'jos','근대':'mod','일제 강점기':'mod'})[e]||'anc';
 let era='all';
 const evs=()=>{const[,a,b]=ERA[era];const l=E().filter(e=>e[0]>=a&&e[0]<=b);return l.length>=12?l:E();};
 const peo=()=>{const l=era==='all'?PE():PE().filter(p=>PGROUP[p[1]]===era);return l.length>=8?l:PE();};
 const rel=()=>{const H=window.HERITAGE||{};const l=Object.entries(RL()).filter(([k,e])=>H[k]&&(era==='all'||RGROUP(e)===era));return l.length>=4?l:Object.entries(RL()).filter(([k])=>H[k]);};
 const bestKey=k=>era==='all'?k:`${k}@${era}`;
 // 한 판 안에서는 같은 문제를 되도록 다시 내지 않는다.
 let seen=new Set();
 const fresh=(arr,key)=>{const l=arr.filter(x=>!seen.has(key(x)));const x=pick(l.length?l:arr);seen.add(key(x));return x;};
 let dlg,onClose,keyFn=null,timer=null;
 const stopTimer=()=>{if(timer){clearInterval(timer);timer=null;}};
 // ── 틀: 위 HUD + 본문. art = 본문 뒤에 은은히 까는 그림.
 function frame({title,sub='MINI GAME',back,prog,score,art}){
  stopTimer();
  dlg=$('#vnLog');dlg.className='mgx-dlg';
  const bar=prog?`<div class="mgx-prog">${prog.marks.map((m,i)=>`<i class="${m===1?'ok':m===0?'ng':i===prog.cur?'cur':''}"></i>`).join('')}</div>`:'<div></div>';
  dlg.innerHTML=`<div class="mgx">${art?`<div class="mgx-art" style="background-image:url('${asset(art[0])}'),url('${asset(art[1])}')"></div>`:''}<header class="mgx-hud">${back?'<button class="mgx-ico" data-back title="뒤로">‹</button>':'<span class="mgx-ico ghost"></span>'}<div class="mgx-title"><small>${esc(sub)}</small><b>${esc(title)}</b></div>${bar}<div class="mgx-score">${score||''}</div><button class="mgx-ico" data-close title="닫기">✕</button></header><main class="mgx-main"></main><div class="mgx-flash" hidden></div></div>`;
  dlg.querySelector('[data-close]').onclick=()=>{stopTimer();dlg.close();dlg.className='';keyFn=null;onClose?.();};
  if(back)dlg.querySelector('[data-back]').onclick=()=>{stopTimer();back();};
  keyFn=null;
  if(!dlg.open)dlg.showModal();
  return dlg.querySelector('.mgx-main');
 }
 // 미니게임이 열려 있는 동안은 키를 본편 단축키로 넘기지 않는다(쓰지 않는 숫자키가 본편으로 새어 창이 닫히던 문제). Esc는 ✕와 같게.
 document.addEventListener('keydown',e=>{if(!dlg?.open||!dlg.classList.contains('mgx-dlg'))return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();dlg.querySelector('[data-close]')?.click();return;}
  if(e.key==='Tab')return;e.stopPropagation();if(keyFn&&keyFn(e))e.preventDefault();},true);
 function flash(ok,txt){const f=dlg.querySelector('.mgx-flash');f.hidden=false;f.className='mgx-flash '+(ok?'ok':'ng');f.textContent=txt||(ok?'정답!':'땡!');setTimeout(()=>{f.hidden=true;},650);}
 const nextBtn=(foot,go0)=>{foot.insertAdjacentHTML('beforeend','<button class="mgx-next" data-next>다음 <kbd>Enter</kbd></button>');const go=()=>{keyFn=null;go0();};foot.querySelector('[data-next]').onclick=go;keyFn=e=>{if(e.key==='Enter'){go();return true;}};};
 // ── 문제 네 가지. area에 그리고, 끝나면 done(맞음?, 틀렸을 때 복습용 한 줄).
 function qOrder(area,done){
  const ev=[...evs()].sort((a,b)=>a[0]-b[0]);
  // 같은 해 사건이 둘 이상 들어가지 않게 고른다(순서를 가릴 수 없으므로).
  let set;for(let t=0;t<30;t++){const st=Math.floor(Math.random()*Math.max(1,ev.length-9));set=shuffle(ev.slice(st,st+9)).slice(0,4);if(new Set(set.map(e=>e[0])).size===4)break;}
  const ans=[...set].sort((a,b)=>a[0]-b[0]);const picked=[];
  area.innerHTML=`<p class="mgx-q">일어난 <em>순서대로</em> 눌러 연표를 꿰어요</p>
  <ol class="mgx-rail">${set.map((_,i)=>`<li data-slot="${i}"><span>${i+1}</span><b></b><i></i></li>`).join('')}</ol>
  <div class="mgx-cards">${set.map((e,i)=>`<button data-i="${i}"><kbd>${i+1}</kbd>${esc(e[1])}</button>`).join('')}</div><div class="mgx-foot"><button class="mgx-ghost" data-reset>다시 고르기</button></div>`;
  const btns=[...area.querySelectorAll('[data-i]')],slots=[...area.querySelectorAll('[data-slot]')];
  const paint=()=>{slots.forEach((s,k)=>{s.classList.toggle('filled',!!picked[k]);s.querySelector('b').textContent=picked[k]?.[1]||'';});btns.forEach(b=>b.classList.toggle('used',picked.includes(set[+b.dataset.i])));};
  const check=()=>{const ok=picked.every((e,k)=>e[0]===ans[k][0]);
   slots.forEach((s,k)=>{s.querySelector('i').textContent=yr(picked[k][0]);s.classList.add(picked[k][0]===ans[k][0]?'ok':'ng');});
   btns.forEach(b=>b.disabled=true);flash(ok);sfx(ok?'correct':'wrong');
   const line=ans.map(e=>`${yr(e[0])} ${e[1]}`).join(' → ');
   const foot=area.querySelector('.mgx-foot');foot.innerHTML=ok?'<p class="mgx-res ok">연표가 이어졌어요!</p>':`<p class="mgx-res ng">바른 순서 ${ans.map(e=>`<span>${yr(e[0])} ${esc(e[1])}</span>`).join('<b>→</b>')}</p>`;nextBtn(foot,()=>done(ok,line));};
  const choose=i=>{const e=set[i];if(!e||picked.includes(e)||picked.length>=set.length)return;picked.push(e);sfx('select');paint();if(picked.length===set.length)check();};
  btns.forEach(b=>b.onclick=()=>choose(+b.dataset.i));
  area.querySelector('[data-reset]').onclick=()=>{picked.length=0;paint();};
  keyFn=e=>{if(/^[1-4]$/.test(e.key)){choose(+e.key-1);return true;}};
 }
 function qWho(area,done){
  const p=fresh(peo(),x=>'p'+x[0]);const same=shuffle(PE().filter(x=>x!==p&&x[1]===p[1]));const other=shuffle(PE().filter(x=>x!==p&&x[1]!==p[1]&&PGROUP[x[1]]===PGROUP[p[1]])).concat(shuffle(PE().filter(x=>PGROUP[x[1]]!==PGROUP[p[1]])));
  const opts=shuffle([p,...same.slice(0,2),...other].slice(0,4));let over=false;
  area.innerHTML=`<p class="mgx-q">이 사람은 <em>누구</em>일까요?</p><figure class="mgx-quote"><span class="mgx-chip">${esc(p[1])}</span><blockquote>${esc(p[2])}</blockquote></figure><div class="mgx-opts">${opts.map((o,i)=>`<button data-o="${i}"><kbd>${i+1}</kbd>${esc(o[0])}</button>`).join('')}</div><div class="mgx-foot"></div>`;
  const choose=i=>{if(over||!opts[i])return;over=true;const o=opts[i],ok=o===p;
   area.querySelectorAll('[data-o]').forEach(x=>{x.disabled=true;if(opts[+x.dataset.o]===p)x.classList.add('ok');else if(+x.dataset.o===i)x.classList.add('ng');});
   flash(ok);sfx(ok?'correct':'wrong');const foot=area.querySelector('.mgx-foot');
   foot.innerHTML=ok?`<p class="mgx-res ok">${esc(p[0])}, 정답!</p>`:`<p class="mgx-res ng">정답은 <b>${esc(p[0])}</b>. 고른 ${esc(o[0])}은(는) 「${esc(o[2])}」</p>`;nextBtn(foot,()=>done(ok,`「${p[2]}」 → ${p[0]}`));};
  area.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>choose(+b.dataset.o));
  keyFn=e=>{if(/^[1-4]$/.test(e.key)){choose(+e.key-1);return true;}};
 }
 function qPairs(area,done){
  const ps=shuffle(peo()).slice(0,4),right=shuffle(ps);let sel=null,miss=0,got=0;const slip=new Set();
  area.innerHTML=`<p class="mgx-q">단서와 인물을 <em>짝</em>지어요 <small>단서를 고르고 이름을 누르세요 · 헛짚기 ${'<i class="mgx-heart"></i>'.repeat(2)}</small></p><div class="mgx-pairs"><div>${ps.map((p,i)=>`<button data-l="${i}">${esc(p[2])}</button>`).join('')}</div><div>${right.map((p,i)=>`<button data-r="${i}">${esc(p[0])}</button>`).join('')}</div></div><div class="mgx-foot"></div>`;
  const L=[...area.querySelectorAll('[data-l]')],R=[...area.querySelectorAll('[data-r]')],hearts=[...area.querySelectorAll('.mgx-heart')];
  L.forEach(b=>b.onclick=()=>{if(b.disabled)return;L.forEach(x=>x.classList.remove('on'));b.classList.add('on');sel=ps[+b.dataset.l];sfx('select');});
  R.forEach(b=>b.onclick=()=>{if(!sel||b.disabled)return;const p=right[+b.dataset.r];
   if(p===sel){got++;b.disabled=true;b.classList.add('ok');const lb=L[ps.indexOf(sel)];lb.disabled=true;lb.classList.remove('on');lb.classList.add('ok');sel=null;sfx('correct');
    if(got===ps.length){const ok=miss<=1;flash(ok);const foot=area.querySelector('.mgx-foot');foot.innerHTML=`<p class="mgx-res ${ok?'ok':'ng'}">${ok?'네 쌍 모두 짝지었어요!':`다 맞췄지만 ${miss}번 헛짚었어요.`}</p>`;
     nextBtn(foot,()=>done(ok,ps.filter(x=>slip.has(x)).map(x=>`「${x[2]}」 → ${x[0]}`).join(' / ')));}}
   else{miss++;slip.add(sel);if(hearts[miss-1])hearts[miss-1].classList.add('lost');b.classList.add('ng');setTimeout(()=>b.classList.remove('ng'),450);sfx('wrong');}});
 }
 // 이 유물은?: 사진 → 시대. 이름 속 나라 이름은 가린다.
 function qRelic(area,done){
  const H=window.HERITAGE||{};const [name,ans]=fresh(rel(),x=>'r'+x[0]);const h=H[name];
  const all=ERAS(),ai=all.indexOf(ans);const near=shuffle(all.filter((e,i)=>e!==ans&&Math.abs(i-ai)<=3));const far=shuffle(all.filter(e=>e!==ans&&!near.includes(e)));
  const opts=shuffle([ans,...near,...far].slice(0,4));let over=false;
  const masked=name.replace(/고구려|백제|신라|발해|고려|조선|가야|대한민국/g,'○○');
  area.innerHTML=`<p class="mgx-q">이 문화재는 <em>어느 시대</em>의 것일까요?</p><figure class="mgx-relic"><img src="${esc(figSrc(h.src))}" alt="" loading="eager"><figcaption>${esc(masked)}</figcaption></figure><div class="mgx-opts">${opts.map((o,i)=>`<button data-o="${i}"><kbd>${i+1}</kbd>${esc(o)}</button>`).join('')}</div><div class="mgx-foot"></div>`;
  const choose=i=>{if(over||!opts[i])return;over=true;const ok=opts[i]===ans;
   area.querySelectorAll('[data-o]').forEach(x=>{x.disabled=true;if(opts[+x.dataset.o]===ans)x.classList.add('ok');else if(+x.dataset.o===i)x.classList.add('ng');});
   area.querySelector('.mgx-relic figcaption').textContent=name;
   flash(ok);sfx(ok?'correct':'wrong');const foot=area.querySelector('.mgx-foot');
   foot.innerHTML=`<p class="mgx-res ${ok?'ok':'ng'}">${ok?'':'정답은 '}<b>${esc(ans)}</b>${ok?', 정답!':'.'} <span>${esc(h.desc)}</span><small class="mgx-credit">사진 ${esc(h.credit)}</small></p>`;nextBtn(foot,()=>done(ok,`${name} → ${ans} (${h.desc})`));};
  area.querySelectorAll('[data-o]').forEach(b=>b.onclick=()=>choose(+b.dataset.o));
  keyFn=e=>{if(/^[1-4]$/.test(e.key)){choose(+e.key-1);return true;}};
 }
 const KINDS={order:['연표 꿰기',qOrder,'📜','cg_mg_order.webp','bg_timeline_dive.webp'],who:['누구일까요',qWho,'🔔','cg_mg_who.webp','cg_ch09_ullim_voices.webp'],
  pairs:['짝 맞추기',qPairs,'🧩','cg_mg_pairs.webp','cg_ch04_campfire.webp'],relic:['이 유물은?',qRelic,'🏺','cg_mg_relic.webp','bg_museum_hall.webp']};
 const rank=n=>n>=10?'S':n>=8?'A':n>=6?'B':n>=4?'C':'D';
 const RANK_CG={S:'cg_mg_rank_s.webp',A:'cg_mg_rank_a.webp',B:'cg_mg_rank_b.webp',C:'cg_mg_rank_c.webp',D:'cg_mg_rank_c.webp'};
 const RANK_ST={S:'st_orpheia_excited.webp',A:'st_orpheia_smile.webp',B:'st_orpheia_smile.webp',C:'st_orpheia_worry.webp',D:'st_orpheia_worry.webp'};
 const RANK_LINE={S:'완벽해요, 주인님! 연표가 한 군데도 안 번졌어요. ……상으로 오늘 밤 차는 제가 끓일게요.',A:'거의 다 붙었어요! 헷갈린 것만 아래에서 한 번 더 보고 가요.',
  B:'좋아요. 반 넘게 단단해졌어요. 헷갈린 건 「기출 풀기」에서 한 번 더 봐요.',C:'괜찮아요. 이유와 함께 다시 보면 금방 붙어요. 차 한 잔 하고 한 판 더 해요.',D:'오늘은 몸풀기였던 걸로 해요. 아래 것만 같이 읽고 가요, 주인님.'};
 // 결과: 왼쪽 오르페이아 CG, 오른쪽 점수·복습.
 function result({title,score,max,best,nb,r,notes,again,unit='/ '+max}){
  const a=frame({title,sub:'RESULT',back:lobby});
  a.innerHTML=`<div class="mgx-result2"><figure class="mgx-rcg"><img class="mgx-rimg" src="${asset(RANK_CG[r])}" onerror="this.onerror=null;this.classList.add('stand');this.src='${asset(RANK_ST[r])}'" alt=""><figcaption><span class="mgx-name">오르페이아</span>${esc(RANK_LINE[r])}</figcaption></figure>
  <div class="mgx-rside"><div class="mgx-rhead"><div class="mgx-rank r-${r}"><small>RANK</small><b>${r}</b></div><div class="mgx-rtext"><h3>${score} <small>${esc(unit)}</small></h3>${nb?'<p class="mgx-new">NEW RECORD</p>':''}<p class="mgx-dim">최고 기록 ${best} · ${esc(ERA[era][0])}</p></div></div>
  ${notes.length?`<div class="mgx-review"><h4>헷갈린 것 <small>${notes.length}</small></h4><ol>${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ol></div>`:'<p class="mgx-res ok">헷갈린 것 없음!</p>'}
  <div class="mgx-row"><button class="mgx-next" data-again>한 판 더 <kbd>Enter</kbd></button><button class="mgx-ghost" data-lobby>목록으로</button></div></div></div>`;
  a.querySelector('[data-again]').onclick=again;a.querySelector('[data-lobby]').onclick=()=>lobby();
  keyFn=e=>{if(e.key==='Enter'){keyFn=null;again();return true;}};
  sfx(r==='S'||r==='A'||r==='B'?'vb_finish':'vb_end');
 }
 // ── 혼자 하기: 10문제.
 function solo(kind){
  const [name,fn,,art,art0]=KINDS[kind];const marks=Array(10).fill(null);const notes=[];let n=0,ok=0,streak=0,maxStreak=0;seen=new Set();
  const bk=bestKey(kind),best=(records.mgBest||{})[bk]||0;
  const next=()=>{
   if(n>=10){const b=records.mgBest||(records.mgBest={});const nb=ok>(b[bk]||0);if(nb){b[bk]=ok;save();}
    return result({title:name,score:ok,max:10,best:Math.max(best,ok),nb,r:rank(ok),notes,again:()=>solo(kind)});}
   const a=frame({title:name,back:lobby,prog:{marks,cur:n},art:[art,art0],score:`<span class="mgx-era">${esc(ERA[era][0])}</span> 정답 <b>${ok}</b>${streak>1?` <span class="mgx-combo">${streak} COMBO</span>`:''}`});
   fn(a,(r,note)=>{marks[n]=r?1:0;n++;if(r){ok++;streak++;maxStreak=Math.max(maxStreak,streak);if(streak===3||streak===5||streak===10)sfx('vb_combo');}else{streak=0;if(note)notes.push(note);}next();});};
  next();
 }
 // ── 먼저일까?: 60초 동안 두 사건의 앞뒤를 O/X로. 틀리면 3초 깎임.
 const SPEED_SEC=60,SPEED_PEN=3;
 const srank=n=>n>=22?'S':n>=16?'A':n>=11?'B':n>=6?'C':'D';
 function speed(){
  const bk=bestKey('speed'),best=(records.mgBest||{})[bk]||0;const notes=[];let ok=0,ng=0,left=SPEED_SEC,cur=null,lock=false,combo=0;seen=new Set();
  const ev=[...evs()].sort((a,b)=>a[0]-b[0]);
  const a=frame({title:'먼저일까?',back:lobby,art:['cg_mg_ox.webp','bg_timeline_dive.webp'],score:''});
  const hud=dlg.querySelector('.mgx-score');
  const paintHud=()=>{hud.innerHTML=`<span class="mgx-era">${esc(ERA[era][0])}</span> <span class="mgx-clock${left<=10?' low':''}">⏱ ${Math.max(0,Math.ceil(left))}</span> 정답 <b>${ok}</b>${combo>2?` <span class="mgx-combo">${combo} COMBO</span>`:''}`;};
  const make=()=>{let x,y;for(let t=0;t<40;t++){const i=Math.floor(Math.random()*ev.length);const j=Math.max(0,Math.min(ev.length-1,i+(Math.random()<.5?-1:1)*(1+Math.floor(Math.random()*8))));x=ev[i];y=ev[j];if(x[0]!==y[0]&&!seen.has(x[1]+y[1]))break;}
   seen.add(x[1]+y[1]);return Math.random()<.5?[x,y]:[y,x];};
  const show=()=>{cur=make();lock=false;const [x,y]=cur;
   a.innerHTML=`<p class="mgx-q"><em>왼쪽</em>이 <em>오른쪽</em>보다 먼저 일어났을까요?</p><div class="mgx-vs"><div class="mgx-ev"><b>${esc(x[1])}</b><i></i></div><span class="mgx-arrow">→</span><div class="mgx-ev"><b>${esc(y[1])}</b><i></i></div></div>
   <div class="mgx-ox"><button data-ox="1" class="o"><span>O</span><kbd>←</kbd>먼저예요</button><button data-ox="0" class="x"><span>X</span><kbd>→</kbd>나중이에요</button></div><p class="mgx-dim center">틀리면 ${SPEED_PEN}초가 깎여요 · 키보드 ← O / → X</p>`;
   a.querySelectorAll('[data-ox]').forEach(b=>b.onclick=()=>answer(b.dataset.ox==='1'));};
  const answer=say=>{if(lock||left<=0)return;lock=true;const [x,y]=cur;const truth=x[0]<y[0];const good=say===truth;
   const evs2=a.querySelectorAll('.mgx-ev i');evs2[0].textContent=yr(x[0]);evs2[1].textContent=yr(y[0]);a.querySelector('.mgx-vs').classList.add(good?'ok':'ng');
   if(good){ok++;combo++;sfx(combo%5===0?'vb_combo':'correct');}else{ng++;combo=0;left-=SPEED_PEN;sfx('wrong');notes.push(`${yr(x[0])} ${x[1]} / ${yr(y[0])} ${y[1]}`);flash(false,`-${SPEED_PEN}초`);}
   paintHud();setTimeout(()=>{if(left>0)show();},good?380:900);};
  keyFn=e=>{if(e.key==='ArrowLeft'||e.key==='o'||e.key==='O'||e.key==='1'){answer(true);return true;}if(e.key==='ArrowRight'||e.key==='x'||e.key==='X'||e.key==='2'){answer(false);return true;}};
  const end=()=>{stopTimer();keyFn=null;const b=records.mgBest||(records.mgBest={});const nb=ok>(b[bk]||0);if(nb){b[bk]=ok;save();}
   result({title:'먼저일까?',score:ok,max:ok+ng,best:Math.max(best,ok),nb,r:srank(ok),notes:notes.slice(-10),again:speed,unit:`맞힘 · 틀림 ${ng}`});};
  paintHud();show();sfx('vb_start');
  const t0=Date.now();let last=t0;
  timer=setInterval(()=>{const now=Date.now();left-=(now-last)/1000;last=now;paintHud();if(left<=0)end();},200);
 }
 // ── 아내 대결.
 const STEP=2,ROUNDS=10,BATTLE_KINDS=['order','who','pairs','relic'];
 const wifeCg=(id,v)=>v===4?`cg_wife_${id}_win.webp`:`cg_wife_${id}_b${v}.webp`;
 const cgBox=(id,v,p,line)=>`<figure class="mgx-cgbox${v===4?' win':''}"><img class="mgx-cg" src="${asset(wifeCg(id,v))}" onerror="this.onerror=null;${v===4?`this.src='${asset(`cg_wife_${id}_b3.webp`)}'`:`this.classList.add('stand');this.src='${face(id)}'`}" alt=""><div class="mgx-pips">${[1,2,3].map(i=>`<i class="${v>=i?'on':''}"></i>`).join('')}${v===4?'<b class="mgx-heartpip">♥</b>':''}</div><figcaption><span class="mgx-name">${esc(p.name)}</span>${esc(line)}</figcaption></figure>`;
 function battle(id){
  const p=(window.PROFILES||[]).find(x=>x.id===id),L=W()[id];const marks=Array(ROUNDS).fill(null);let n=0,ok=0,stage=0,line=L.start;seen=new Set();
  const prevEra=era;era='all';
  const draw=(v=stage)=>{const a=frame({title:p.name,sub:'WIFE BATTLE',back:()=>{era=prevEra;wives();},prog:{marks,cur:n},score:`<span class="mgx-stage">STAGE ${stage}/3</span>`});a.innerHTML=`<div class="mgx-battle">${cgBox(id,v,p,line)}<div class="mgx-side"></div></div>`;return a.querySelector('.mgx-side');};
  const finish=()=>{era=prevEra;const w=records.wife||(records.wife={});const first=stage>=3&&(w[id]||0)<3;if(stage>(w[id]||0)){w[id]=stage;save();}
   const won=stage>=3;line=won?L.b3:'……오늘은 여기까지예요. 다음엔 지지 않을 거예요.';
   const s=draw();s.innerHTML=`<div class="mgx-result compact"><div class="mgx-rank r-${won?'S':stage>=2?'A':stage>=1?'B':'D'}"><small>${won?'완승':'STAGE'}</small><b>${won?'★':stage}</b></div><div class="mgx-rtext"><h3>${ok} <small>/ ${n}</small></h3>${first?'<p class="mgx-new">완승 그림 열림</p>':''}<div class="mgx-row">${won?'<button class="mgx-next" data-win>그 뒤 이야기 ♥</button>':''}<button class="${won?'mgx-ghost':'mgx-next'}" data-again>다시 대결</button><button class="mgx-ghost" data-wives>아내 목록</button></div></div></div>`;
   s.querySelector('[data-again]').onclick=()=>battle(id);s.querySelector('[data-wives]').onclick=()=>wives();
   if(won){const showWin=()=>{line=L.win||L.b3;const s2=draw(4);s2.innerHTML=`<div class="mgx-result compact"><div class="mgx-rank r-S"><small>완승</small><b>♥</b></div><div class="mgx-rtext"><h3>${ok} <small>/ ${n}</small></h3><div class="mgx-row"><button class="mgx-next" data-again>다시 대결</button><button class="mgx-ghost" data-wives>아내 목록</button></div></div></div>`;
     s2.querySelector('[data-again]').onclick=()=>battle(id);s2.querySelector('[data-wives]').onclick=()=>wives();sfx('vb_bell');};
    s.querySelector('[data-win]').onclick=showWin;keyFn=e=>{if(e.key==='Enter'){keyFn=null;showWin();return true;}};}
   sfx(won?'vb_ko':'vb_end');};
  const round=()=>{if(n>=ROUNDS||stage>=3)return finish();const side=draw();const kind=pick(BATTLE_KINDS);
   KINDS[kind][1](side,r=>{marks[n]=r?1:0;n++;if(r){ok++;const s=Math.min(3,Math.floor(ok/STEP));if(s>stage){stage=s;line=L['b'+s];sfx('vb_rip');}else{line='……아직이에요. 아직 한 겹 남았어요.';sfx('vb_combo');}}else{line=L.miss;sfx('vb_ink');}round();});};
  sfx('vb_start');round();
 }
 function wives(){
  const w=records.wife||{};const a=frame({title:'아내 대결',sub:'WIFE BATTLE',back:lobby,score:`완승 <b>${Object.values(w).filter(x=>x>=3).length}</b> / ${heroes().length}`});
  a.innerHTML=`<p class="mgx-dim center">두 문제를 맞힐 때마다 상대의 옷이 한 겹씩 풀려요. 완승하면 그 뒤 이야기가 열려요.</p><div class="mgx-wives">${heroes().map(p=>`<button data-w="${p.id}" class="${(w[p.id]||0)>=3?'clear':''}"><span><img loading="lazy" src="${face(p.id)}" alt=""></span><b>${esc(p.name)}</b><em>${[1,2,3].map(i=>`<i class="${(w[p.id]||0)>=i?'on':''}"></i>`).join('')}${(w[p.id]||0)>=3?'<b>♥</b>':''}</em></button>`).join('')}</div>`;
  a.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>pickWife(b.dataset.w));
 }
 function pickWife(id){
  const p=(window.PROFILES||[]).find(x=>x.id===id),m=(records.wife||{})[id]||0,top=m>=3?4:m;let v=top;
  const lineOf=v=>v===4?(W()[id].win||W()[id].b3):v?W()[id]['b'+v]:W()[id].start;
  const show=()=>{const a=frame({title:p.name,sub:'WIFE BATTLE',back:wives});
   a.innerHTML=`<div class="mgx-battle">${cgBox(id,v,p,lineOf(v))}
   <div class="mgx-side"><p class="mgx-chip">${esc(p.sub)}</p><h3 class="mgx-h">${esc(p.name)}</h3><p class="mgx-dim">${esc(p.era)}</p>${m?`<div class="mgx-row"><button class="mgx-ghost" data-v="-1">◀</button><span class="mgx-dim">${v===4?'그 뒤 이야기':`본 단계 ${v} / ${m}`}</span><button class="mgx-ghost" data-v="1">▶</button></div>`:'<p class="mgx-dim">아직 본 단계가 없어요.</p>'}<div class="mgx-row"><button class="mgx-next" data-go>대결 시작</button></div></div></div>`;
   a.querySelector('[data-go]').onclick=()=>battle(id);
   a.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{v=Math.max(0,Math.min(top,v+ +b.dataset.v));show();});
   keyFn=e=>{if(!m)return;if(e.key==='ArrowLeft'){v=Math.max(0,v-1);show();return true;}if(e.key==='ArrowRight'){v=Math.min(top,v+1);show();return true;}};};
  show();
 }
 function lobby(){
  era=ERA[records.mgEra]?records.mgEra:'all';
  const b=records.mgBest||{},w=records.wife||{};const a=frame({title:'연표 아케이드',sub:'MINI GAME'});
  const bb=k=>b[bestKey(k)]||0;
  const tile=(k,ic,t,d,imgs,badge,lock)=>`<button class="mgx-tile${lock?' lock':''}" ${lock?'disabled':`data-k="${k}"`} style="background-image:linear-gradient(180deg,#0b122400 20%,#0b1224f0 85%),${imgs.map(i=>`url('${asset(i)}')`).join(',')}"><span class="mgx-ic">${ic}</span><b>${t}</b><small>${d}</small>${badge?`<em>${badge}</em>`:''}</button>`;
  a.innerHTML=`<div class="mgx-lobby"><section class="mgx-hero" style="--hero:url('${asset('cg_mg_lobby.webp')}')"><img hidden src="${asset('cg_mg_lobby.webp')}" onload="this.closest('.mgx-hero').classList.add('art')" alt=""><div><small>ORPHEIA ARCADE</small><h3>오늘은 <em>한 판</em>만 해요, 주인님</h3><p>연표가 다시 번지지 않게 조금씩 꿰어 둬요. 헷갈린 건 끝나고 같이 한 번 더 봐요.</p></div><img class="mgx-hero-st" src="${asset('st_orpheia_excited.webp')}" alt=""></section>
  <nav class="mgx-eras"><span>시대</span>${Object.entries(ERA).map(([k,[t]])=>`<button data-era="${k}" class="${k===era?'on':''}">${t}</button>`).join('')}</nav>
  <div class="mgx-tiles">
   ${tile('order','📜','연표 꿰기','가까운 시대 사건 넷을 일어난 순서대로',[KINDS.order[3],KINDS.order[4]],`BEST ${bb('order')}/10`)}
   ${tile('who','🔔','누구일까요','단서 한 줄로 인물 맞히기',[KINDS.who[3],KINDS.who[4]],`BEST ${bb('who')}/10`)}
   ${tile('pairs','🧩','짝 맞추기','단서 넷 ↔ 이름 넷',[KINDS.pairs[3],KINDS.pairs[4]],`BEST ${bb('pairs')}/10`)}
   ${tile('relic','🏺','이 유물은?','문화재 사진을 보고 시대 맞히기',[KINDS.relic[3],KINDS.relic[4]],`BEST ${bb('relic')}/10`)}
   ${tile('speed','⏱️','먼저일까?',`${SPEED_SEC}초 동안 두 사건의 앞뒤를 O/X로`,['cg_mg_ox.webp','bg_timeline_dive.webp'],`BEST ${bb('speed')}`)}
   ${wifeOpen()?tile('wife','💍','아내 대결','맞힐 때마다 상대의 옷이 한 단계씩',['cg_end_harem.webp'],`완승 ${Object.values(w).filter(x=>x>=3).length}/${heroes().length}`):tile('','🔒','？？？','엔딩을 하나 보면 열려요',['bg_studio_night.webp'],'',true)}
  </div></div>`;
  a.querySelectorAll('[data-k]').forEach(x=>x.onclick=()=>x.dataset.k==='wife'?wives():x.dataset.k==='speed'?speed():solo(x.dataset.k));
  a.querySelectorAll('[data-era]').forEach(x=>x.onclick=()=>{records.mgEra=x.dataset.era;save();sfx('select');lobby();});
 }
 return {open(cb){onClose=cb;lobby();}};
})();
