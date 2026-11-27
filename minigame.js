'use strict';
// 미니게임 모드(2026.11): 연표 꿰기 · 누구일까요 · 짝 맞추기 · 이 유물은? · 먼저일까?(60초), 그리고 엔딩 뒤 「아내 대결」, 히든 엔딩 뒤 「떡볶이 퇴마」(혜진 슈팅).
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
 let dlg,onClose,keyFn=null,timer=null,raf=0,loopStop=null;
 const stopTimer=()=>{if(timer){clearInterval(timer);timer=null;}if(raf){cancelAnimationFrame(raf);raf=0;}loopStop?.();loopStop=null;};
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
 function result({title,score,max,best,nb,r,notes,again,unit='/ '+max,who,noteTitle='헷갈린 것'}){
  const a=frame({title,sub:'RESULT',back:lobby});
  const fig=who?`<figure class="mgx-rcg"><img class="mgx-rimg${who.fb?'':' stand'}" src="${asset(who.img)}" ${who.fb?`onerror="this.onerror=null;this.classList.add('stand');this.src='${asset(who.fb)}'"`:''} alt=""><figcaption><span class="mgx-name">${esc(who.name)}</span>${esc(who.line)}</figcaption></figure>`
   :`<figure class="mgx-rcg"><img class="mgx-rimg" src="${asset(RANK_CG[r])}" onerror="this.onerror=null;this.classList.add('stand');this.src='${asset(RANK_ST[r])}'" alt=""><figcaption><span class="mgx-name">오르페이아</span>${esc(RANK_LINE[r])}</figcaption></figure>`;
  a.innerHTML=`<div class="mgx-result2">${fig}
  <div class="mgx-rside"><div class="mgx-rhead"><div class="mgx-rank r-${r}"><small>RANK</small><b>${r}</b></div><div class="mgx-rtext"><h3>${score} <small>${esc(unit)}</small></h3>${nb?'<p class="mgx-new">NEW RECORD</p>':''}<p class="mgx-dim">최고 기록 ${best} · ${esc(ERA[era][0])}</p></div></div>
  ${notes.length?`<div class="mgx-review"><h4>${esc(noteTitle)} <small>${notes.length}</small></h4><ol>${notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ol></div>`:'<p class="mgx-res ok">헷갈린 것 없음!</p>'}
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
 // ── 떡볶이 퇴마(혜진): 세로 슈팅. 오르페이아가 만든 퇴마 연습 게임인데, 부적 탄창에 혜진의 야식 주문 기록이 섞여 부적 대신 떡볶이가 나간다.
 //   마우스(또는 ←↑→↓·WASD)로 움직이고 떡볶이는 저절로 나간다. Shift = 천천히(판정 점 보임), X·우클릭 = 삶은 달걀 「성불하세요!」(화면 정리), P = 멈춤.
 //   치즈 = 관통, 소시지 = 세 갈래, 삶은 달걀 = 폭탄 하나 더. 80초쯤 버티면 야근 악귀가 나온다. 기록 records.mgBest.tteok.
 const tteokOpen=()=>(records.endings||[]).includes('연표의 신부들');
 const TK={
  start:['……잠깐만, 내 경면주사 부적이 왜 시뻘건 국물이야?! 이거 엽떡이잖아!!','아 몰라! 고춧가루 캡사이신도 양기(陽氣)니까 눈에 뵈는 잡귀는 다 태워 버리겠지!'],
  sys:'부적 탄창에 혜진 님의 배달 앱 야식 주문 기록이 혼선되었어요. 패치하는 동안은 그냥 매운맛으로 성불시키세요♪',
  cheese:['모차렐라 치즈 두 번 추가!! 이건 귀신도 못 참지!','치즈가 쭉쭉 늘어나서 뒤에 숨은 잡귀까지 한 줄로 꿰뚫어!'],
  sausage:['비엔나소시지 토핑까지?! 오늘 밤 골목 회식이네!','세 갈래 탄막 발사! 이게 바로 신명고 무악과 특제 세트 메뉴다!'],
  egg:['삶은 달걀은 아껴 뒀다가 매운 국물 비벼 먹어야 하는데…','특제 삶은 달걀 폭탄 추가! 급할 땐 X키로 성불시켜 버려!'],
  hit1:['꺄악?! 아 진짜, 내 한복 교복 소매 터졌잖아!! 세탁비 누가 물어 줄 거야!','국물이랑 먹물이 동시에 튀었어!! 이 동정 깃 다림질하느라 삼십 분 걸렸단 말이야!'],
  hit2:['히익?! 조, 조끼 단추랑 옷고름까지 뜯어지면 어떡해!! 속옷 보인단 말이야, 이 변태 잡귀들아!!','잠깐만, 치마 옆트임이 허벅지까지 찢어졌어!! 밤바람 들어온다고, 그만 좀 쏴!!'],
  hit3:['으아아앙!! 교복 다 찢어져서 가릴 데도 없단 말이야!! 할머니 신당으로 도망갈래애!!','하, 하얀 속바지랑 브래지어만 남았잖아……! 오늘 밤 골목 방범 CCTV 다 부숴 버릴 거야……!'],
  bomb:['특제 매운맛 먹고 다들 저승으로 칼퇴근하세요──!!','내 금요일 밤 레이드 방해하지 말고 싹 다 성불하라고오!!'],
  boss:'……나왔다, 만년 과장급 야근 악귀. 이 시간까지 퇴근 못 한 한은 알겠는데, 내 퇴근길은 막지 마!',
  bossLow:'거의 다 잡았어! 빨간 도장 찍힌 결재 서류 그만 좀 집어 던져, 이 악귀야!!',
  win:'후우, 야간 퇴마 완료! ……내 교복 찢어진 건 할머니한테 뭐라고 둘러대지? 일단 남은 떡볶이부터 먹고 생각하자.',
  lose:'으으…… 교복은 걸레짝이 되고 떡볶이 국물 범벅이고…… 오늘은 그냥 집 가서 이불 뒤집어쓰고 엽떡이나 시켜 먹을래…….',
 };
 const TK_RES={S:'완벽한 무피격 칼퇴근! 떡볶이 한 사발로 골목 잡귀를 쓸어버리다니 나 진짜 신명고 수석 아니야? 할머니한텐 비밀이야.',
  A:'꽤 선방했다! 교복 소매가 조금 뜯어지긴 했지만, 이 정도면 세탁소 수선 맡기면 감쪽같겠지.',
  B:'후우, 아슬아슬했어. 치마랑 저고리 고름이 뜯어져서 가슴팍이 다 시려…… 모차렐라 치즈 토핑을 더 챙겼어야 했는데.',
  C:'으으, 먹물 탄에 맞아서 교복이 반쯤 걸레짝이 됐잖아……! 다음엔 쌀떡 말고 쫄깃한 밀떡으로 쏴서 다 갚아 줄 거야.',
  D:'히잉…… 교복은 속옷만 남고 다 찢어지고, 떡볶이 국물까지 뒤집어썼어…… 슬냥이 언니한테 오늘 레이드 못 간다고 톡 해야지…….'};
 const KILL_TXT=['맵다!','캡사이신…!','쿨피스…!','성불…!','칼퇴근…!'];
 function tteok(){
  const a=frame({title:'떡볶이 퇴마',sub:'MINI GAME · 혜진',back:lobby,score:''});
  const hud=dlg.querySelector('.mgx-score');
  a.classList.add('mgx-main-shmup');
  a.innerHTML=`<div class="mgx-shmup"><aside class="mgx-sh-who"><img src="${asset('st_hyejin_smile.webp')}" alt=""><p class="mgx-sh-say"><b class="mgx-sh-nm">혜진</b><span data-say></span></p><p class="mgx-sh-sys" data-sys></p></aside>
   <div class="mgx-sh-stage"><canvas width="480" height="640"></canvas><div class="mgx-sh-over" data-over hidden></div></div>
   <aside class="mgx-sh-panel">
    <div class="sp-score"><small>HI-SCORE</small><b data-hi></b><small>SCORE</small><b class="now" data-sc>0</b></div>
    <dl class="sp-stat"><dt>목숨</dt><dd data-life></dd><dt>교복</dt><dd data-cloth>멀쩡함</dd><dt>달걀</dt><dd data-egg></dd><dt>스침</dt><dd data-graze>0</dd></dl>
    <div class="sp-block"><h5>토핑</h5><div data-top></div></div>
    <div class="sp-block"><h5 data-stl>야근 악귀까지</h5><div class="sp-bar"><u data-stage></u></div></div>
    <div class="sp-keys"><p><kbd>마우스</kbd><kbd>←↑→↓</kbd> 이동 · 떡볶이 자동 발사</p><p><kbd>Shift</kbd> 천천히, 판정 점</p><p><kbd>X</kbd><kbd>우클릭</kbd> 삶은 달걀 「성불하세요!」</p><p><kbd>P</kbd> 멈춤 · 탄에 맞을 때마다 교복이 찢어져요</p></div>
   </aside></div>`;
  const cv=a.querySelector('canvas'),g=cv.getContext('2d'),W=480,H=640;
  const sayEl=a.querySelector('[data-say]'),sysEl=a.querySelector('[data-sys]'),who=a.querySelector('.mgx-sh-who img'),over=a.querySelector('[data-over]');
  const img=n=>{const i=new Image();i.src=asset(n);return i;};
  const IM={me:img('st_hyejin_serious.webp'),hurt:img('st_hyejin_surprised.webp'),d1:img('st_hyejin_d1.webp'),d2:img('st_hyejin_d2.webp'),d3:img('st_hyejin_d3.webp'),man:img('mob_man_modern.webp')};
  // 도트 그림(tk_*). 아직 없으면 캔버스로 그린다.
  const SP={};for(const n of ['hyejin','hyejin_hurt','tteok','item_cheese','item_sausage','item_egg','wisp','sheet','man','boss','paper','bg_alley'])SP[n]=img(`tk_${n}.webp`);
  const ok=i=>i&&i.complete&&i.naturalWidth>0;
  const blit=(im,x,y,h,ax=.5,ay=.5)=>{const w=h*im.naturalWidth/im.naturalHeight;g.drawImage(im,x-w*ax,y-h*ay,w,h);};
  g.imageSmoothingEnabled=false;
  let sayT=0,dmg=0,ripT=0;
  const faceSrc=face=>dmg>=3?asset('st_hyejin_d3.webp'):dmg===2?asset('st_hyejin_d2.webp'):dmg===1?asset('st_hyejin_d1.webp'):asset(`st_hyejin_${face}.webp`);
  const say=(t,face='smile',force)=>{if(!force&&sayT>0)return;sayEl.textContent=Array.isArray(t)?pick(t):t;who.src=faceSrc(face);sayT=2.4;};
  // 상태
  const P={x:W/2,y:H-80,inv:0,lives:3,bombs:2,cheese:0,sausage:0,fire:0};
  let shots=[],foes=[],ebul=[],items=[],fx=[],texts=[],t=0,spawn=1.2,score=0,kills=0,hits=0,boss=null,bossDone=false,ended=false,paused=false,flashT=0,mouse=null,lastHud=0,graze=0,spellT=0,spellName='';
  const keys={};
  const best=(records.mgBest||{}).tteok||0;
  const dist2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
  // 입력
  keyFn=e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=true;
   if(k==='x'){bomb();}if(k==='p'){paused=!paused;}return ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','x','p','Shift',' '].includes(k);};
  const up=e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=false;};
  document.addEventListener('keyup',up);
  const toCanvas=e=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};};
  cv.addEventListener('pointermove',e=>{mouse=toCanvas(e);});
  cv.addEventListener('pointerleave',()=>{mouse=null;});
  cv.addEventListener('contextmenu',e=>{e.preventDefault();bomb();});
  loopStop=()=>{document.removeEventListener('keyup',up);};
  // 적
  const addFoe=type=>{const x=30+Math.random()*(W-60);
   if(type==='wisp')foes.push({type,x,y:-20,hp:1,r:11,ph:Math.random()*6,pts:100});
   else if(type==='sheet')foes.push({type,x,y:-30,hp:3,r:17,ph:Math.random()*6,cd:1+Math.random(),pts:300});
   else foes.push({type:'man',x,y:-50,hp:10,r:22,stopY:110+Math.random()*110,cd:1,life:0,pts:800});};
  const aim=(f,sp,off=0)=>{const ang=Math.atan2(P.y-f.y,P.x-f.x)+off;ebul.push({x:f.x,y:f.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r:5});};
  const ring=(f,n,sp,rot=0)=>{for(let i=0;i<n;i++){const ang=rot+i*Math.PI*2/n;ebul.push({x:f.x,y:f.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r:5});}};
  const drop=f=>{const c=f.type==='wisp'?.04:f.type==='sheet'?.15:f.type==='man'?.5:0;if(Math.random()<c)items.push({x:f.x,y:f.y,kind:pick(['cheese','cheese','sausage','sausage','egg'])});};
  const kill=f=>{score+=f.pts;kills++;texts.push({x:f.x,y:f.y,txt:pick(KILL_TXT),t:0});for(let i=0;i<8;i++)fx.push({x:f.x,y:f.y,vx:(Math.random()-.5)*160,vy:(Math.random()-.5)*160,t:0});drop(f);};
  // 보스 공격(이름 카드): 0~2를 6.5초씩 돌고, 체력이 30% 아래로 떨어지면 마지막 공격으로 바뀐다.
  const SPELLS=['야근 수당 미지급','퇴근 5분 전 회의','결재 서류 폭풍','무한 결재 루프'];
  const shot=(b,ang,sp,r=5)=>ebul.push({x:b.x,y:b.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,r});
  const paper=()=>ebul.push({x:30+Math.random()*(W-60),y:-10,vx:(Math.random()-.5)*30,vy:150+Math.random()*80,r:7,paper:true,rot:Math.random()*6});
  const SPELL_FN=[
   b=>{b.cd=.09;b.spin+=.31;shot(b,b.spin,135);shot(b,b.spin+Math.PI,135);},
   b=>{b.cd=.75;ring(b,22,115,Math.random()*6);for(const o of[-.15,0,.15])aim(b,215,o);},
   b=>{b.cd=.1;paper();b.n=(b.n||0)+1;if(b.n%9===0)for(const o of[-.3,0,.3])aim(b,180,o);},
   b=>{b.cd=.07;b.spin+=.23;for(let k=0;k<3;k++)shot(b,b.spin+k*Math.PI*2/3,125);b.n=(b.n||0)+1;if(b.n%25===0)ring(b,18,95,b.spin);},
  ];
  function bomb(){if(ended||paused||P.bombs<=0)return;P.bombs--;ebul=[];flashT=.6;P.inv=Math.max(P.inv,1.5);say(TK.bomb,'angry',true);sfx('vb_purify');
   for(const f of foes){f.hp-=15;if(f.hp<=0)kill(f);}foes=foes.filter(f=>f.hp>0);if(boss){boss.hp-=25;}}
  function hurt(){if(P.inv>0||ended)return;P.lives--;hits++;dmg=Math.min(3,hits);ripT=1.1;P.inv=2;ebul=[];sfx('vb_rip');
   for(let i=0;i<14;i++)fx.push({x:P.x+(Math.random()-.5)*24,y:P.y+(Math.random()-.5)*24,vx:(Math.random()-.5)*220,vy:(Math.random()-.5)*220,t:0,cloth:true});
   texts.push({x:P.x,y:P.y-20,txt:dmg===1?'찌익─! 교복 손상!':dmg===2?'파앗─! 옷고름 파열!':'콰아앙─! 교복 대파!!',t:0});
   say(TK['hit'+dmg],'surprised',true);paintHud();if(P.lives<=0)finish(false);}
  // 그리기 도우미
  const tteokShape=(x,y,big)=>{const w=big?9:7,h=big?24:20;g.save();g.translate(x,y);g.fillStyle='#d8341f';g.beginPath();g.roundRect(-w/2,-h/2,w,h,w/2);g.fill();
   g.fillStyle='#ff8a5c';g.fillRect(-w/2+2,-h/2+4,2,h-9);g.fillStyle='#fff4d6';g.fillRect(1,-3,1.6,1.6);g.fillRect(-1,4,1.6,1.6);g.restore();};
  const SPF={wisp:['wisp',36],sheet:['sheet',48],man:['man',74],boss:['boss',200]};
  const drawFoe=f=>{const sp=SP[SPF[f.type][0]];if(ok(sp)){g.save();if(f.type==='boss'){g.shadowColor='#ff3b6b';g.shadowBlur=18;}blit(sp,f.x,f.y,SPF[f.type][1]);g.restore();return;}g.save();
   if(f.type==='wisp'){const gr=g.createRadialGradient(f.x,f.y,2,f.x,f.y,f.r+8);gr.addColorStop(0,'#e8fbff');gr.addColorStop(.4,'#5cc8ff');gr.addColorStop(1,'#1b3cff00');g.fillStyle=gr;g.beginPath();g.arc(f.x,f.y,f.r+8,0,7);g.fill();}
   else if(f.type==='sheet'){g.globalAlpha=.9;g.fillStyle='#e9e4f2';g.beginPath();g.arc(f.x,f.y-4,f.r,Math.PI,0);g.lineTo(f.x+f.r,f.y+f.r);
    for(let i=4;i>=0;i--)g.lineTo(f.x-f.r+i*f.r/2,f.y+f.r+(i%2?-5:0)+Math.sin(t*8+i)*2);g.closePath();g.fill();g.fillStyle='#1a1026';g.beginPath();g.arc(f.x-6,f.y-5,3,0,7);g.arc(f.x+6,f.y-5,3,0,7);g.fill();}
   else{const w=f.type==='boss'?150:46,h=w*1.5;g.shadowColor=f.type==='boss'?'#ff3b6b':'#7cf';g.shadowBlur=18;if(IM.man.complete&&IM.man.naturalWidth)g.drawImage(IM.man,f.x-w/2,f.y-h*.45,w,h);else{g.fillStyle='#160f1f';g.fillRect(f.x-w/3,f.y-h*.4,w*.66,h*.8);}
    g.shadowBlur=8;g.shadowColor='#f33';g.fillStyle='#ff4d4d';const ey=f.y-h*.33,ex=w*.06;g.beginPath();g.arc(f.x-ex,ey,f.type==='boss'?4:2,0,7);g.arc(f.x+ex,ey,f.type==='boss'?4:2,0,7);g.fill();}
   g.restore();};
  const ITEM={cheese:['#ffd84a','치즈'],sausage:['#c9573a','소시지'],egg:['#fff7e6','달걀']};
  // 한 프레임
  let last=performance.now();
  const step=ts=>{raf=requestAnimationFrame(step);const dt=Math.min(.05,(ts-last)/1000);last=ts;
   if(!paused){if(!ended)update(dt);else{t+=dt;for(const p of fx){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}fx=fx.filter(p=>p.t<.6);for(const x of texts){x.t+=dt;x.y-=30*dt;}texts=texts.filter(x=>x.t<.9);}}draw();};
  function update(dt){t+=dt;sayT-=dt;ripT-=dt;P.inv-=dt;P.cheese-=dt;P.sausage-=dt;flashT-=dt;
   // 움직임
   const slow=keys.Shift?.45:1,sp=330*slow;let mx=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),my=(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0);
   if(mx||my){const l=Math.hypot(mx,my);P.x+=mx/l*sp*dt;P.y+=my/l*sp*dt;}else if(mouse){const dx=mouse.x-P.x,dy=mouse.y-P.y,l=Math.hypot(dx,dy);if(l>1){const m=Math.min(l,sp*1.4*dt);P.x+=dx/l*m;P.y+=dy/l*m;}}
   P.x=Math.max(14,Math.min(W-14,P.x));P.y=Math.max(30,Math.min(H-20,P.y));
   // 발사
   P.fire-=dt;if(P.fire<=0){P.fire=.11;const big=P.cheese>0,mk=(vx)=>shots.push({x:P.x,y:P.y-26,vx,vy:-620,pierce:big,hit:big?new Set():null});mk(0);if(P.sausage>0){mk(-150);mk(150);}}
   // 출현
   if(!boss&&!bossDone){spawn-=dt;if(t>=80){if(!foes.length){boss={type:'boss',x:W/2,y:-120,hp:300,max:300,r:46,cd:1.5,pat:-1,patT:99,spin:0,pts:10000};say(TK.boss,'serious',true);sfx('vb_start');}}
    else if(spawn<=0){spawn=Math.max(.32,1.15-t*.011);const r=Math.random();addFoe(t<18?'wisp':t<40?(r<.65?'wisp':'sheet'):(r<.45?'wisp':r<.82?'sheet':'man'));if(t>30&&Math.random()<.3)addFoe('wisp');}}
   // 적 움직임·공격
   for(const f of foes){f.ph=(f.ph||0)+dt;
    if(f.type==='wisp'){f.y+=95*dt;f.x+=Math.sin(f.ph*3)*70*dt;}
    else if(f.type==='sheet'){f.y+=55*dt;f.x+=Math.sin(f.ph*1.6)*55*dt;f.cd-=dt;if(f.cd<=0&&f.y>0&&f.y<H*.6){f.cd=2;aim(f,150);}}
    else{f.life+=dt;if(f.life<7)f.y+=(f.stopY-f.y)*Math.min(1,dt*2);else f.y+=200*dt;f.cd-=dt;if(f.cd<=0&&f.life<7&&f.life>.8){f.cd=1.4;aim(f,170,-.25);aim(f,170,0);aim(f,170,.25);}}}
   foes=foes.filter(f=>f.y<H+60&&f.x>-60&&f.x<W+60);
   if(boss){const b=boss;if(b.y<130)b.y+=70*dt;else{b.x=W/2+Math.sin(t*.7)*120;b.patT+=dt;
     const want=b.hp<b.max*.3?3:(b.patT>6.5||b.pat<0)?(b.pat+1)%3:b.pat;
     if(want!==b.pat&&!(b.pat===3)){if(b.pat>=0)for(const e of ebul){score+=20;fx.push({x:e.x,y:e.y,vx:0,vy:-60,t:.2});}ebul=[];b.pat=want;b.patT=0;b.cd=.8;spellName=SPELLS[want];spellT=2.4;sfx('vb_break');}
     b.cd-=dt;if(b.cd<=0)SPELL_FN[b.pat](b);}
    if(b.hp<b.max*.3&&!b.low){b.low=true;say(TK.bossLow,'angry',true);}
    if(b.hp<=0){kill(b);for(let i=0;i<40;i++)fx.push({x:b.x+(Math.random()-.5)*80,y:b.y+(Math.random()-.5)*80,vx:(Math.random()-.5)*300,vy:(Math.random()-.5)*300,t:0});boss=null;bossDone=true;ebul=[];sfx('vb_ko');say(TK.win,'smile',true);ended=true;setTimeout(()=>finish(true),1600);}}
   // 떡 맞히기
   for(const s of shots){s.x+=s.vx*dt;s.y+=s.vy*dt;const targets=boss?[...foes,boss]:foes;
    for(const f of targets){if(s.dead||f.hp<=0)continue;if(s.hit&&s.hit.has(f))continue;if(dist2(s,f)<(f.r+6)**2){f.hp--;score+=10;if(s.pierce)s.hit.add(f);else s.dead=true;if(f.hp<=0&&f!==boss)kill(f);}}}
   foes=foes.filter(f=>f.hp>0);shots=shots.filter(s=>!s.dead&&s.y>-30&&s.x>-20&&s.x<W+20);
   // 적 탄
   for(const e of ebul){e.x+=e.vx*dt;e.y+=e.vy*dt;if(e.paper)e.rot+=dt*4;if(P.inv>0)continue;const d=dist2(e,P);if(d<(e.r+3)**2){hurt();break;}
    if(!e.gz&&d<(e.r+18)**2){e.gz=1;graze++;score+=50;fx.push({x:(e.x+P.x)/2,y:(e.y+P.y)/2,vx:(Math.random()-.5)*90,vy:-80,t:.1});}}
   spellT-=dt;
   ebul=ebul.filter(e=>e.y<H+20&&e.y>-30&&e.x>-20&&e.x<W+20);
   for(const f of foes)if(P.inv<=0&&dist2(f,P)<(f.r+4)**2){hurt();break;}
   if(boss&&P.inv<=0&&dist2(boss,P)<(boss.r+4)**2)hurt();
   // 토핑
   for(const it of items){it.y+=80*dt;if(dist2(it,P)<24**2){it.got=true;sfx('correct');
    if(it.kind==='cheese'){P.cheese=8;say(TK.cheese,'smile',true);}else if(it.kind==='sausage'){P.sausage=8;say(TK.sausage,'smile',true);}else{P.bombs=Math.min(5,P.bombs+1);say(TK.egg,'smile',true);}score+=200;}}
   items=items.filter(i=>!i.got&&i.y<H+20);
   for(const p of fx){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}fx=fx.filter(p=>p.t<.6);
   for(const x of texts){x.t+=dt;x.y-=30*dt;}texts=texts.filter(x=>x.t<.9);
   if(sayT<-3)say(pick([['오늘 신명고 부적학 숙제도 있는데…'],['슬냥이 언니네 길드 레이드 벌써 출발했겠다…'],['이 귀한 엽떡을 잡귀한테 쏘다니 아깝다, 진짜.'],['이거 끝나면 모차렐라 치즈 두 번 추가해서 시켜 먹어야지.']]));
   if(now()-lastHud>120){lastHud=now();paintHud();}}
  const now=()=>performance.now();
  const pane=k=>a.querySelector(`[data-${k}]`);const hiEl=pane('hi');hiEl.textContent=best.toLocaleString();
  const TOP=[['cheese','치즈','#ffd84a','꿰뚫는 떡'],['sausage','소시지','#ff8a66','세 갈래']];
  const CLOTH_TXT=['멀쩡함','찢어짐 1','찢어짐 2','완전 대파'];
  const paintHud=()=>{hud.innerHTML='';pane('sc').textContent=score.toLocaleString();if(score>best)hiEl.textContent=score.toLocaleString();
   pane('life').innerHTML='<b>'+'♥'.repeat(Math.max(0,P.lives))+'</b><i>'+'♥'.repeat(Math.max(0,3-P.lives))+'</i>';
   pane('cloth').innerHTML=`<b style="color:${dmg>=3?'#ff4d6d':dmg===2?'#ff9e66':dmg===1?'#ffd84a':'#a8e6cf'}">${CLOTH_TXT[dmg]}</b>`;
   pane('egg').innerHTML=Array.from({length:5},(_,k)=>`<img class="${k<P.bombs?'':'off'}" src="${asset('tk_item_egg.webp')}" alt="">`).join('');
   pane('graze').textContent=graze;
   const on=TOP.filter(([k])=>P[k]>0);pane('top').innerHTML=on.length?on.map(([k,n,c,d])=>`<p><b style="color:${c}">${n}</b> ${d}<span class="sp-bar small"><u style="width:${Math.max(0,P[k]/8*100)}%;background:${c}"></u></span></p>`).join(''):'<p class="dim">없음</p>';
   pane('stl').textContent=boss?`야근 악귀${spellName?` · 「${spellName}」`:''}`:bossDone?'퇴근 완료':'야근 악귀까지';
   pane('stage').style.width=(boss?Math.max(0,boss.hp/boss.max*100):bossDone?0:Math.min(100,t/80*100))+'%';pane('stage').classList.toggle('boss',!!boss);};
  function draw(){
   // 밤 골목: 남색 하늘 + 흐르는 가로등 빛 + 아스팔트 줄
   if(ok(SP.bg_alley)){const bh=W*SP.bg_alley.naturalHeight/SP.bg_alley.naturalWidth,off=(t*45)%(bh*2);
    for(let k=-1;k<2;k++){const Y=off+k*bh*2;g.drawImage(SP.bg_alley,0,Y-bh,W,bh);g.save();g.translate(0,Y-bh);g.scale(1,-1);g.drawImage(SP.bg_alley,0,0,W,bh);g.restore();}
    g.fillStyle='#0b0f2466';g.fillRect(0,0,W,H);
    for(let k=0;k<3;k++){const y=((t*90+k*260)%780)-60,x=k%2?60:W-60;const lg=g.createRadialGradient(x,y,4,x,y,110);lg.addColorStop(0,'#ffd99a33');lg.addColorStop(1,'#ffd99a00');g.fillStyle=lg;g.beginPath();g.arc(x,y,110,0,7);g.fill();}}
   else{const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#0b0f24');gr.addColorStop(1,'#1c1230');g.fillStyle=gr;g.fillRect(0,0,W,H);
   g.strokeStyle='#ffffff10';g.lineWidth=2;for(let i=0;i<9;i++){const y=((t*120+i*80)%720)-40;g.beginPath();g.moveTo(W/2,y);g.lineTo(W/2,y+30);g.stroke();}
   for(let i=0;i<3;i++){const y=((t*60+i*260)%780)-60,x=i%2?40:W-40;const lg=g.createRadialGradient(x,y,4,x,y,90);lg.addColorStop(0,'#ffd99a55');lg.addColorStop(1,'#ffd99a00');g.fillStyle=lg;g.beginPath();g.arc(x,y,90,0,7);g.fill();}}
   // 토핑
   for(const it of items){const [c,n]=ITEM[it.kind];const si=SP['item_'+it.kind];if(ok(si)){blit(si,it.x,it.y,28);g.save();g.fillStyle='#fff';g.font='bold 11px sans-serif';g.textAlign='center';g.fillText(n,it.x,it.y+26);g.restore();continue;}g.save();g.fillStyle=c;g.strokeStyle='#0008';g.lineWidth=2;g.beginPath();
    if(it.kind==='egg')g.ellipse(it.x,it.y,9,12,0,0,7);else if(it.kind==='cheese'){g.moveTo(it.x-11,it.y+8);g.lineTo(it.x+11,it.y+8);g.lineTo(it.x+11,it.y-6);g.closePath();}else g.roundRect(it.x-13,it.y-5,26,10,5);
    g.fill();g.stroke();g.fillStyle='#fff';g.font='bold 11px sans-serif';g.textAlign='center';g.fillText(n,it.x,it.y+24);g.restore();}
   for(const f of foes)drawFoe(f);
   if(boss){drawFoe(boss);g.fillStyle='#0009';g.fillRect(20,14,W-40,10);g.fillStyle='#ff4d6d';g.fillRect(20,14,(W-40)*Math.max(0,boss.hp)/boss.max,10);g.fillStyle='#fff';g.font='bold 12px sans-serif';g.textAlign='left';g.fillText('야근 악귀',22,40);if(spellName){g.textAlign='right';g.fillStyle='#ffd6e0';g.font='bold 13px serif';g.fillText(`「${spellName}」`,W-22,40);}}
   if(spellT>0&&spellName){const a=Math.min(1,spellT,2.4-spellT+.2);g.save();g.globalAlpha=Math.max(0,a);g.fillStyle='#0009';g.fillRect(0,H*.42,W,54);g.fillStyle='#ff4d6d';g.fillRect(0,H*.42,W,2);g.fillRect(0,H*.42+52,W,2);g.fillStyle='#fff';g.textAlign='center';g.font='bold 24px serif';g.fillText(`「${spellName}」`,W/2,H*.42+35);g.restore();}
   // 떡
   for(const s of shots){if(ok(SP.tteok))blit(SP.tteok,s.x,s.y,s.pierce?30:26);else tteokShape(s.x,s.y,s.pierce);if(s.pierce){g.fillStyle='#ffe066';g.fillRect(s.x-2,s.y-12,4,6);}}
   // 적 탄(먹물 구슬·결재 서류)
   for(const e of ebul){g.save();if(e.paper&&ok(SP.paper)){g.translate(e.x,e.y);g.rotate(e.rot);blit(SP.paper,0,0,22);}else if(e.paper){g.translate(e.x,e.y);g.rotate(e.rot);g.fillStyle='#f3efe4';g.fillRect(-7,-9,14,18);g.fillStyle='#c33';g.fillRect(-4,-5,8,2);}
    else{g.shadowColor='#b05cff';g.shadowBlur=10;g.fillStyle='#2a0d3a';g.beginPath();g.arc(e.x,e.y,e.r,0,7);g.fill();g.strokeStyle='#d6a8ff';g.lineWidth=1.5;g.stroke();}g.restore();}
   // 혜진
   if(!(P.inv>0&&Math.floor(P.inv*12)%2)){const pix=(P.inv>1||dmg>=2)?SP.hyejin_hurt:SP.hyejin;if(ok(pix)){const bob=Math.sin(t*4)*3;g.strokeStyle='#ffffff55';g.lineWidth=1.5;for(let k=0;k<3;k++){const wx=P.x-14+k*14,wy=P.y+30+((t*260+k*23)%40);g.beginPath();g.moveTo(wx,wy);g.lineTo(wx,wy+12);g.stroke();}blit(pix,P.x,P.y+bob,96,.5,.62);}else{const im=dmg>=1&&ok(IM['d'+dmg])?IM['d'+dmg]:P.inv>1?IM.hurt:IM.me;const h=96,w=h*0.684;if(im.complete&&im.naturalWidth)g.drawImage(im,P.x-w/2,P.y-h*.62,w,h);else{g.fillStyle='#fff';g.fillRect(P.x-8,P.y-20,16,40);}}}
   if(keys.Shift){g.fillStyle='#fff';g.strokeStyle='#f33';g.lineWidth=2;g.beginPath();g.arc(P.x,P.y,4,0,7);g.fill();g.stroke();}
   for(const p of fx){g.fillStyle=p.cloth?`rgba(245,240,255,${1-p.t/.6})`:`rgba(255,${120+Math.random()*80|0},80,${1-p.t/.6})`;g.fillRect(p.x,p.y,p.cloth?5:3,p.cloth?5:3);}
   if(ripT>0&&dmg>=1){const im=IM['d'+dmg];g.save();g.globalAlpha=Math.min(.92,ripT*1.2);g.fillStyle='rgba(40,8,24,0.45)';g.fillRect(0,0,W,H);if(ok(im))blit(im,W/2,H*.54,420,.5,.5);g.fillStyle='#ff4d6d';g.font='bold 26px serif';g.textAlign='center';g.fillText(dmg===1?'교복 손상 (1/3)':dmg===2?'교복 파열 (2/3)':'교복 완전 대파!! (3/3)',W/2,H*.16);g.restore();}
   g.textAlign='center';g.font='bold 15px sans-serif';for(const x of texts){g.fillStyle=`rgba(255,230,160,${1-x.t/.9})`;g.fillText(x.txt,x.x,x.y);}
   if(flashT>0){g.fillStyle=`rgba(255,250,235,${flashT})`;g.fillRect(0,0,W,H);g.fillStyle=`rgba(200,40,30,${flashT*1.5})`;g.font='bold 40px serif';g.fillText('성불하세요!',W/2,H/2);}
   if(paused){g.fillStyle='#000a';g.fillRect(0,0,W,H);g.fillStyle='#fff';g.font='bold 28px sans-serif';g.fillText('잠깐 멈춤 · P',W/2,H/2);}
  }
  let done=false;function finish(won){if(done)return;done=true;ended=true;const sc=score+(won?P.lives*2000+P.bombs*500:0);
   const r=won&&sc>=40000?'S':sc>=25000?'A':sc>=15000?'B':sc>=7000?'C':'D';
   if(!won){say(TK.lose,'pout',true);}
   setTimeout(()=>{stopTimer();keyFn=null;const b=records.mgBest||(records.mgBest={});const nb=sc>(b.tteok||0);if(nb){b.tteok=sc;save();}
    const resImg=!won||dmg>=3?'cg_sp_ex_hit3.webp':dmg===2?'cg_sp_ex_hit2.webp':dmg===1?'cg_sp_ex_hit1.webp':r==='S'||r==='A'?'tk_win.webp':r==='D'?'tk_lose.webp':'tk_win.webp';
    const resFb=dmg>=1?`st_hyejin_d${dmg}.webp`:`st_hyejin_${r==='S'||r==='A'?'smile':r==='B'?'neutral':'pout'}.webp`;
    result({title:'떡볶이 퇴마',score:sc.toLocaleString(),max:0,best:Math.max(best,sc).toLocaleString(),nb,r,unit:'점',again:tteok,noteTitle:'오늘 밤 근무 기록',
     who:{name:'혜진',img:resImg,fb:resFb,line:TK_RES[r]},
     notes:[`쓰러뜨린 잡귀 ${kills}`,won?`야근 악귀 퇴근시킴 (남은 하트 ${P.lives} × 2,000 · 달걀 ${P.bombs} × 500)`:'야근 악귀는 아직 사무실에 있어요',`아슬아슬하게 스친 탄 ${graze}`,`맞은 횟수 ${hits} (교복 상태: ${CLOTH_TXT[dmg]})`]});},won?200:1400);}
  say(TK.start,'surprised',true);sysEl.innerHTML=`<b>ORPHEIA</b> ${esc(TK.sys)}`;paintHud();sfx('vb_start');
  raf=requestAnimationFrame(step);
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
   ${tteokOpen()?tile('tteok','🌶️','떡볶이 퇴마','혜진의 부적이 전부 떡볶이로 나가요',['cg_mg_tteok.webp','cg_sp_ex_tteok.webp'],`BEST ${(b.tteok||0).toLocaleString()}`):tile('','🔒','？？？','어느 골목의 무당과 만나면 열려요',['bg_studio_night.webp'],'',true)}
   ${wifeOpen()?tile('wife','💍','아내 대결','맞힐 때마다 상대의 옷이 한 단계씩',['cg_end_harem.webp'],`완승 ${Object.values(w).filter(x=>x>=3).length}/${heroes().length}`):tile('','🔒','？？？','엔딩을 하나 보면 열려요',['bg_studio_night.webp'],'',true)}
  </div></div>`;
  a.querySelectorAll('[data-k]').forEach(x=>x.onclick=()=>x.dataset.k==='wife'?wives():x.dataset.k==='speed'?speed():x.dataset.k==='tteok'?tteok():solo(x.dataset.k));
  a.querySelectorAll('[data-era]').forEach(x=>x.onclick=()=>{records.mgEra=x.dataset.era;save();sfx('select');lobby();});
 }
 return {open(cb){onClose=cb;lobby();}};
})();
