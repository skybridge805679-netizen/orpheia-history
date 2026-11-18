'use strict';
// 이야기 엔진: 타이틀, 대본 실행, 세이브·로드, 로그, 오토·스킵.
// 오르페이아(Orphiey) 철도 ADV의 vn.js를 한국사 학습용으로 옮겼다. 대본 문법은 같다.
// 각 장은 story/*.js 에서 VN.chapter(id, 제목, 부제, 대본)으로 등록한다.
// 대본에서 기출을 부르는 명령: @quiz 80-15 80-37  /  @quiz era=고려 n=3  (quiz.js)
const VN=(()=>{
const META_KEY='orpheia-history-vn-v1',LOG_MAX=300;
let meta={saves:{},read:{},flags:{},settings:{auto:1600}};
try{const raw=JSON.parse(localStorage.getItem(META_KEY)||'null');if(raw&&typeof raw==='object')meta={...meta,...raw,settings:{...meta.settings,...raw.settings}};}catch{}
const persist=()=>{try{localStorage.setItem(META_KEY,JSON.stringify(meta));}catch{toast('이 브라우저에서는 세이브가 제한됩니다.');}};

// ── 등장인물. 스탠딩은 NovelAI로 새로 만든 st_* 그림(tools/nai-assets.json).
const CAST={
 orpheia:{name:'오르페이아',cls:'c-orpheia',stand:{neutral:'st_orpheia_neutral',smile:'st_orpheia_smile',excited:'st_orpheia_excited',worry:'st_orpheia_worry',explain:'st_orpheia_explain',surprised:'st_orpheia_surprised',pout:'st_orpheia_pout',shy:'st_orpheia_shy',serious:'st_orpheia_serious',teary:'st_orpheia_teary'},
  face:{neutral:'neutral',smile:'smile',excited:'smile',worry:'worry',explain:'serious',surprised:'serious',pout:'worry',shy:'relief',serious:'serious',teary:'worry'}},
 sayeon:{name:'사연',cls:'c-sayeon',stand:{neutral:'st_sayeon_neutral',smile:'st_sayeon_smile',serious:'st_sayeon_serious',surprised:'st_sayeon_surprised',worry:'st_sayeon_worry',writing:'st_sayeon_writing',neolithic:'st_sayeon_neolithic',buyeo:'st_sayeon_buyeo',baekje:'st_sayeon_baekje',hwarang:'st_sayeon_hwarang',goryeo:'st_sayeon_goryeo',joseon:'st_sayeon_joseon'}},
 muk:{name:'묵',cls:'c-muk',stand:{neutral:'st_muk_neutral',smirk:'st_muk_smirk',angry:'st_muk_angry',surprised:'st_muk_surprised',lonely:'st_muk_lonely',smile:'st_muk_smile'}},
 nuri:{name:'누리',cls:'c-other',stand:{paleo:'st_nuri_paleo',neo:'st_nuri_neo',bronze:'st_nuri_bronze'}},
 dallae:{name:'달래',cls:'c-other',stand:{smile:'st_dallae_smile',worry:'st_dallae_worry'}},
 naru:{name:'나루',cls:'c-other',stand:{baekje:'st_naru_baekje',goguryeo:'st_naru_goguryeo',silla:'st_naru_silla',sea:'st_naru_sea',joseon:'st_naru_joseon',smile:'st_naru_sea',serious:'st_naru_sea'}},
 yunseul:{name:'윤슬',cls:'c-yunseul',stand:{neutral:'st_yunseul_neutral',smile:'st_yunseul_smile',surprised:'st_yunseul_surprised',pout:'st_yunseul_pout',serious:'st_yunseul_serious'}},
 haerang:{name:'해랑',cls:'c-other',stand:{neutral:'st_haerang_smile',smile:'st_haerang_smile',serious:'st_haerang_serious',worry:'st_haerang_serious'}},
 yeoul:{name:'여울',cls:'c-other',stand:{neutral:'st_yeoul_smile',smile:'st_yeoul_smile',surprised:'st_yeoul_surprised',worry:'st_yeoul_surprised',shy:'st_yeoul_shy',angry:'st_yeoul_angry',teary:'st_yeoul_shy'}},
 sodam:{name:'소담',cls:'c-other',stand:{neutral:'st_sodam_smile',smile:'st_sodam_smile',worry:'st_sodam_worry',surprised:'st_sodam_worry'}},
 dano:{name:'단오',cls:'c-other',stand:{neutral:'st_dano_smile',smile:'st_dano_smile',surprised:'st_dano_surprised',worry:'st_dano_surprised'}},
 bori:{name:'보리',cls:'c-other',stand:{neutral:'st_bori_smile',smile:'st_bori_smile',serious:'st_bori_serious',worry:'st_bori_serious',teary:'st_bori_serious'}},
 hanbyeol:{name:'한별',cls:'c-other',stand:{neutral:'st_hanbyeol_smile',smile:'st_hanbyeol_smile',excited:'st_hanbyeol_smile',serious:'st_hanbyeol_serious',worry:'st_hanbyeol_serious',surprised:'st_hanbyeol_serious',teary:'st_hanbyeol_serious'}},
 saebyeok:{name:'새벽',cls:'c-other',stand:{neutral:'st_saebyeok_smile',smile:'st_saebyeok_smile',serious:'st_saebyeok_serious',teary:'st_saebyeok_serious',worry:'st_saebyeok_serious',surprised:'st_saebyeok_serious'}},
 dasom:{name:'다솜',cls:'c-other',stand:{neutral:'st_dasom_smile',smile:'st_dasom_smile',serious:'st_dasom_serious',teary:'st_dasom_serious',worry:'st_dasom_serious',surprised:'st_dasom_smile'}},
 me:{name:'상철',cls:'c-player',stand:{}},
};
const ALIAS={'다솜':'dasom','새벽':'saebyeok','한별':'hanbyeol','보리':'bori','단오':'dano','소담':'sodam','여울':'yeoul','해랑':'haerang','오르페이아':'orpheia','사연':'sayeon','묵':'muk','윤슬':'yunseul','누리':'nuri','나루':'naru','달래':'dallae','나':'me','주인님':'me','상철':'me'};
const EXPR_FX={surprised:'shake',excited:'hop',smile:'hop',shy:'hop',pout:'tilt',worry:'sink',stern:'nod'};
const OLD={};
const MISSING=new Set();
const standFile=(who,expr)=>{const s=CAST[who]?.stand;if(!s)return '';const f=s[expr]||s.neutral;if(!f)return '';return (MISSING.has(f)&&OLD[f]?OLD[f]:f)+'.webp';};
// 새 그림이 아직 없으면 옛 그림으로 바꾼다.
for(const f of Object.keys(OLD)){const i=new Image();i.onerror=()=>MISSING.add(f);i.src=asset(f+'.webp');}
const bgFile=f=>f.replace(/\.(png|webp)$/,'')+'.webp';

// ── 대본 해석. "@명령 인자", "[이름|표정] 대사", "> 선택지 -> 라벨 {flag+1}", "// 주석", 나머지는 서술.
const chapters=[],byId={};
function chapter(id,title,subtitle,src){const ops=parse(src,id);const ch={id,title,subtitle,ops,labels:{}};ops.forEach((o,i)=>{if(o.t==='label')ch.labels[o.arg]=i;});chapters.push(ch);byId[id]=ch;}
function parse(src,id){
 const ops=[];let choice=null;
 for(const [n,raw] of src.split('\n').entries()){
  const line=raw.trim();
  if(!line||line.startsWith('//')){choice=null;continue;}
  if(line.startsWith('>')&&choice){const m=line.match(/^>\s*(.+?)\s*->\s*(\S+)(?:\s*\{(.+)\})?$/);if(!m)throw new Error(`${id}:${n+1} 선택지 형식`);choice.opts.push({text:m[1],label:m[2],set:m[3]||''});continue;}
  choice=null;
  if(line.startsWith('@')){
   const [cmd,...rest]=line.slice(1).split(/\s+/),arg=rest.join(' ');
   if(cmd==='choice'){choice={t:'choice',opts:[]};ops.push(choice);}
   else if(cmd==='show'){const [who,expr='neutral',pos='center']=rest;ops.push({t:'show',who:ALIAS[who]||who,expr,pos});}
   else if(cmd==='hide')ops.push({t:'hide',who:ALIAS[rest[0]]||rest[0]||'all'});
   else if(cmd==='chapter'){const [num,...title]=arg.split('|');ops.push({t:'chapter',num:num.trim(),title:title.join('|').trim()});}
   else if(cmd==='if'){const m=arg.match(/^(\w+)\s*(>=|<=|==|>|<)?\s*(-?\d+)?\s*->\s*(\S+)$/);if(!m)throw new Error(`${id}:${n+1} @if 형식`);ops.push({t:'if',flag:m[1],op:m[2]||'>=',val:m[3]==null?1:+m[3],label:m[4]});}
   else if(cmd==='set'||cmd==='add'){const [flag,val='1']=rest;ops.push({t:cmd,flag,val:+val});}
   else ops.push({t:cmd,arg});
   continue;
  }
  const m=line.match(/^\[([^\]|]+)(?:\|(\w+))?\]\s*(.*)$/);
  if(m){const who=ALIAS[m[1].trim()]||m[1].trim();ops.push({t:'say',who,expr:m[2]||'',text:m[3]});}
  else ops.push({t:'narr',text:line});
 }
 return ops;
}

// ── 상태와 실행기.
let pendingFx={},S=null,typing=null,autoTimer=null,auto=false,skip=false,hidden=false,log=[],busy=false;
const fresh=ch=>({ch,pc:0,bg:'',chars:{},day:'',line:null,phone:false,flags:{...meta.flags}});
const curCh=()=>byId[S.ch];
function isRead(pc){return (meta.read[S.ch]||[]).includes(pc);}
function markRead(pc){const a=meta.read[S.ch]||(meta.read[S.ch]=[]);if(!a.includes(pc)){a.push(pc);if(a.length%10===0)persist();}}
function evalSet(spec){for(const part of spec.split(/[,\s]+/).filter(Boolean)){const m=part.match(/^(\w+)([+-]=?|=)(-?\d+)$/);if(!m)continue;const [,f,op,v]=m;S.flags[f]=op==='='?+v:(S.flags[f]||0)+(op.startsWith('-')?-v:+v);}}
function step(){
 stopAuto();
 while(S&&!busy){
  const ch=curCh(),op=ch.ops[S.pc];
  if(!op)return finishChapter();
  switch(op.t){
   case 'label':S.pc++;break;
   case 'jump':S.pc=ch.labels[op.arg]??S.pc+1;break;
   case 'if':{const v=S.flags[op.flag]||0,ok={'>=':v>=op.val,'<=':v<=op.val,'==':v===op.val,'>':v>op.val,'<':v<op.val}[op.op];S.pc=ok?ch.labels[op.label]:S.pc+1;break;}
   case 'set':S.flags[op.flag]=op.val;S.pc++;break;
   case 'add':S.flags[op.flag]=(S.flags[op.flag]||0)+op.val;S.pc++;break;
   case 'bg':S.bg=bgFile(op.arg);BGM.scene(op.arg);S.pc++;paint();break;
   case 'bgm':if(op.arg==='auto')BGM.scene(S.bg);else BGM.play(op.arg==='off'?'':op.arg);S.pc++;break;
   case 'show':{const was=S.chars[op.who];S.chars[op.who]={expr:op.expr,pos:op.pos};if(!was)pendingFx[op.who]='enter';else if(was.expr!==op.expr&&EXPR_FX[op.expr])pendingFx[op.who]=EXPR_FX[op.expr];S.pc++;paint();break;}
   case 'phone':S.phone=op.arg!=='off';if(S.phone)SFX.play('phone');if(S.phone&&S.chars.orpheia)pendingFx.orpheia='enter';S.pc++;paint();break;
   case 'hop':case 'tilt':case 'nod':case 'sink':case 'shake':if(op.arg)pendingFx[ALIAS[op.arg]||op.arg]=op.t;S.pc++;paint();break;
   case 'hide':if(op.who==='all')S.chars={};else delete S.chars[op.who];S.pc++;paint();break;
   case 'day':S.day=op.arg;return card('day',op.arg);
   case 'chapter':return card('chapter',op.num,op.title);
   // 시간 여행: @dive 연대|시대 — 빛의 통로를 지나 그 시대로 들어간다(배경은 다음 @bg).
   case 'dive':{const [when,...what]=op.arg.split('|');S.bg=bgFile('bg_timeline_dive');S.chars={};S.phone=false;fx('flash');SFX.play('rewind');paint();return card('dive',when.trim(),what.join('|').trim());}
   // 상태창: @hud 제목|줄|줄 — {flag} 값을 채워 게임 HUD처럼 보여 준다.
   case 'hud':{const [t,...ls]=fill(op.arg).split('|');return card('hud',t.trim(),ls.map(x=>x.trim()).join('\n'));}
   case 'flash':fx('flash');SFX.play('flash');S.pc++;break;
   case 'sfx':SFX.play(op.arg);S.pc++;break;
   case 'wait':busy=true;setTimeout(()=>{busy=false;S.pc++;step();},+op.arg||600);return;
   case 'choice':return choose(op);
   case 'quiz':return quiz(op.arg);
   // 연표 기록부: @note 제목|내용 — 본 것을 카드로 모은다. @summary — 이 장에서 모은 카드를 정리해 보여 준다.
   case 'note':{const [t,...b]=op.arg.split('|');addNote(S.ch,t.trim(),b.join('|').trim());S.pc++;break;}
   case 'summary':return summary();
   case 'end':return finishChapter(op.arg);
   case 'say':case 'narr':
    if(op.t==='say'&&op.expr&&S.chars[op.who]){if(S.chars[op.who].expr!==op.expr&&EXPR_FX[op.expr])pendingFx[op.who]=EXPR_FX[op.expr];S.chars[op.who].expr=op.expr;}
    S.line={who:op.who||'',text:fill(op.text),expr:op.expr||S.chars[op.who]?.expr||'neutral'};
    log.push({who:nameOf(S.line.who),text:S.line.text});if(log.length>LOG_MAX)log.shift();
    if(skip&&!isRead(S.pc))skip=false;
    markRead(S.pc);paint();return type();
   default:S.pc++;
  }
 }
}
// 대사 안의 {quizFirst} 같은 표시는 현재 값으로 바꾼다.
const fill=t=>t.replace(/\{(\w+)\}/g,(_,k)=>S.flags[k]??0);
function nameOf(who){return CAST[who]?.name??who;}
function advance(){
 if(!S||busy)return;
 if(hidden){setHidden(false);return;}
 if(typing){finishType();return;}
 if(S.line){S.line=null;S.pc++;step();}
}

// ── 한 글자씩 찍기.
function type(){
 const node=$('#vnText');if(!node)return;
 const text=S.line.text,speed=skip?0:records.textSpeed;
 clearTimeout(typing?.t);
 if(!speed){node.textContent=text;typing=null;return afterLine();}
 let i=0;typing={t:null};
 const voice=S.line.who?(CAST[S.line.who]?S.line.who:'other'):'narration';
 const tick=()=>{i++;node.textContent=text.slice(0,i);SFX.blip(voice,text[i-1]);if(i>=text.length){typing=null;afterLine();return;}const c=text[i-1];typing.t=setTimeout(tick,speed+(/[.!?。…]/.test(c)?160:/[,，]/.test(c)?70:0));};
 tick();
}
function finishType(){clearTimeout(typing?.t);typing=null;const n=$('#vnText');if(n&&S.line)n.textContent=S.line.text;afterLine();}
function afterLine(){$('#vnCaret')?.classList.add('ready');if(skip)autoTimer=setTimeout(advance,40);else if(auto)autoTimer=setTimeout(advance,meta.settings.auto+S.line.text.length*25);}
function stopAuto(){clearTimeout(autoTimer);}

// ── 그리기.
function shell(){
 document.body.classList.add('vn-mode');
 $('#main').innerHTML=`<section class="vn" id="vn" aria-label="비주얼 노벨"><div class="vn-layer vn-bg"><img id="vnBg" alt=""></div><div class="vn-layer vn-chars" id="vnChars"></div><div class="vn-phone" id="vnPhone" hidden><div class="vn-phone-notch"></div><div class="vn-phone-screen"></div></div><div class="vn-layer vn-fx" id="vnFx"></div><div class="vn-day" id="vnDay"></div><div class="vn-card" id="vnCard" hidden></div><div class="vn-choices" id="vnChoices" hidden></div>
 <div class="vn-box" id="vnBox"><div class="vn-name" id="vnName"><b id="vnWho"></b></div><p class="vn-text" id="vnText" aria-live="polite"></p><span class="vn-caret" id="vnCaret">▼</span></div>
 <nav class="vn-menu" aria-label="메뉴">${[['notebook','기록부'],['log','로그'],['auto','오토'],['skip','스킵'],['qsave','Q.세이브'],['qload','Q.로드'],['config','설정'],['hide','숨기기'],['title','타이틀']].map(([k,v])=>`<button data-vn="${k}">${v}</button>`).join('')}</nav></section>`;
 const vn=$('#vn');
 vn.addEventListener('click',e=>{if(e.target.closest('.vn-menu,.vn-choices,.vn-card button,.qz'))return;advance();});
 vn.addEventListener('contextmenu',e=>{e.preventDefault();setHidden(!hidden);});
 vn.querySelectorAll('[data-vn]').forEach(b=>b.onclick=e=>{e.stopPropagation();menu(b.dataset.vn);});
}
function paint(){
 if(!$('#vn'))shell();
 const bg=$('#vnBg');if(bg&&S.bg&&bg.dataset.f!==S.bg){bg.dataset.f=S.bg;bg.style.visibility='';bg.onerror=()=>{bg.style.visibility='hidden';};bg.src=asset(S.bg);}
 paintChars();
 $('#vnDay').textContent=S.day;
 const l=S.line,box=$('#vnBox');
 box.className='vn-box'+(l?.who?' '+(CAST[l.who]?.cls||'c-other'):' is-narr');
 $('#vnWho').textContent=l?.who?nameOf(l.who):'';$('#vnName').hidden=!l?.who;
 $('#vnText').textContent='';$('#vnCaret').classList.remove('ready');
 $('#vn').querySelector('[data-vn="auto"]').classList.toggle('on',auto);$('#vn').querySelector('[data-vn="skip"]').classList.toggle('on',skip);
}
function paintChars(){
 const wrap=$('#vnChars'),phone=$('#vnPhone');if(!wrap)return;
 const inPhone=who=>S.phone&&who==='orpheia';
 // CG 장면에서는 스탠딩·휴대폰을 숨기고 CG 한 장으로만 보여 준다(상태는 그대로 두고 CG가 끝나면 다시 나온다).
 // 사람이 안 나오는 풍경형 CG는 배경처럼 쓴다(스탠딩을 얹는다).
 const STAGE=/(^|\/)cg_(ch01_dolmen|ch02_baekje|ch03_palace_night|ch04_goryeo_port|ink_spread|comment_flame)\b/;
 const bgName=String(S.bg||''),cg=/(^|\/)cg_/.test(bgName)&&!STAGE.test(bgName);
 wrap.hidden=cg;phone.hidden=cg||!(S.phone&&S.chars.orpheia);
 const keep=new Set();
 for(const [who,c] of Object.entries(S.chars)){
  const file=standFile(who,c.expr);if(!file)continue;keep.add(who);
  const host=inPhone(who)?phone.querySelector('.vn-phone-screen'):wrap;
  let el=document.getElementById('chr-'+who);
  if(!el||el.parentElement!==host){el?.remove();el=document.createElement('div');el.id='chr-'+who;el.innerHTML='<div class="vn-chr-fx"><img alt=""></div>';host.appendChild(el);}
  el.className=`vn-chr pos-${c.pos}${S.line?.who===who||!S.line?.who?' speaking':''}`;
  const img=el.querySelector('img');if(img.dataset.f!==file){img.dataset.f=file;img.src=asset(file);img.alt=nameOf(who);}
  const fxName=pendingFx[who];if(fxName){const f=el.firstChild;f.className='vn-chr-fx';void f.offsetWidth;f.classList.add('fx-'+fxName);}
 }
 pendingFx={};
 for(const el of [...wrap.children,...phone.querySelector('.vn-phone-screen').children])if(!keep.has(el.id.slice(4)))el.remove();
}
function setHidden(v){hidden=v;$('#vn')?.classList.toggle('ui-hidden',v);}
function fx(kind){const vn=$('#vn');if(!vn)return;vn.classList.remove(kind);void vn.offsetWidth;vn.classList.add(kind);setTimeout(()=>vn.classList.remove(kind),700);}
function card(kind,a,b){
 paint();busy=true;S.line=null;const c=$('#vnCard');$('#vnBox').classList.add('quiet');
 c.className='vn-card '+kind;c.hidden=false;if(kind==='chapter')SFX.play('card');c.innerHTML=kind==='chapter'?(()=>{const [m,...sub]=String(b).split(' — ');return `<div class="vn-scroll"><span class="vn-seal">${esc(a)}</span><h2>${esc(m)}</h2>${sub.length?`<p>${esc(sub.join(' — '))}</p>`:''}</div>`;})():kind==='dive'?`<small>${esc(a)}</small><h2>${esc(b)}</h2>`:kind==='hud'?`<div class="vn-hud"><b>${esc(a)}</b><pre>${esc(b)}</pre></div>`:`<p>${esc(a)}</p>`;if(kind==='hud')SFX.play('card');
 const done=()=>{if(c.hidden)return;c.hidden=true;$('#vnBox')?.classList.remove('quiet');busy=false;S.pc++;step();};
 c.onclick=e=>{e.stopPropagation();done();};setTimeout(done,skip?150:kind==='hud'?4200:kind==='chapter'||kind==='dive'?2600:1700);
}
function choose(op){
 S.line=null;paint();stopAuto();skip=false;const box=$('#vnChoices');box.hidden=false;$('#vnBox').classList.add('quiet');
 box.innerHTML=op.opts.map((o,i)=>`<button data-i="${i}"><span>${i+1}</span>${esc(o.text)}</button>`).join('');
 SFX.play('select');
 const pick=i=>{const o=op.opts[i];if(!o)return;SFX.play('confirm');box.hidden=true;box.innerHTML='';$('#vnBox').classList.remove('quiet');log.push({who:'▶ 선택',text:o.text});if(o.set)evalSet(o.set);S.pc=curCh().labels[o.label]??S.pc+1;VN._pick=null;step();};
 box.querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();pick(+b.dataset.i);});
 VN._pick=pick;
}

// ── 연표 기록부.
function addNote(ch,title,body){const nb=records.notebook||(records.notebook={}),list=nb[ch]||(nb[ch]=[]);if(!list.some(n=>n.t===title))list.push({t:title,b:body});save();
 const f=$('#vnFx');if(!f)return;const el=document.createElement('div');el.className='vn-note-pop';el.innerHTML=`<small><i class="vn-seal mini">記</i>연표 기록부</small><b>${esc(title)}</b>`;f.appendChild(el);SFX.play('save');setTimeout(()=>el.remove(),2600);}
function notesHtml(ch){const list=(records.notebook||{})[ch]||[];return list.length?`<div class="vn-notes">${list.map(n=>`<div class="vn-notecard"><b>${esc(n.t)}</b><p>${esc(n.b)}</p></div>`).join('')}</div>`:'<p>아직 모은 기록이 없어요.</p>';}
function summary(){
 S.line=null;paint();busy=true;stopAuto();skip=false;const c=$('#vnCard');$('#vnBox').classList.add('quiet');c.className='vn-card summary';c.hidden=false;
 c.innerHTML=`<small>연표 기록부 · ${esc(curCh().title)}</small><h2>${esc(curCh().subtitle)}</h2>${notesHtml(S.ch)}<button class="primary">이야기로 돌아가기 ▶</button>`;
 c.onclick=null;c.querySelector('button').onclick=e=>{e.stopPropagation();c.hidden=true;$('#vnBox').classList.remove('quiet');busy=false;S.pc++;step();};
}
function notebook(){const d=$('#vnLog');d.innerHTML=`<div class="dialog-header"><div><small>NOTEBOOK</small><h2>연표 기록부</h2></div><button class="quiet" data-close>닫기 ×</button></div>${chapters.filter(c=>(records.notebook||{})[c.id]?.length).map(c=>`<h3>${esc(c.title)} · ${esc(c.subtitle)}</h3>${notesHtml(c.id)}`).join('')||'<p>이야기를 진행하면 그 시대에서 본 것이 여기에 쌓여요.</p>'}`;d.querySelector('[data-close]').onclick=()=>d.close();d.showModal();}

// ── 기출 문항. quiz.js 가 문제를 띄우고, 끝나면 결과를 플래그로 돌려준다.
//    quizFirst: 이번 묶음에서 첫 시도에 맞힌 수, quizTotal: 이번 묶음 문항 수, quizAll: 이야기 전체 누적.
function quiz(arg){
 autosave('문제 직전');busy=true;stopAuto();skip=false;auto=false;S.line=null;paint();
 Quiz.run(arg,{host:$('#vn'),onDone:R=>{
  S.flags.quizFirst=R.first;S.flags.quizTotal=R.total;S.flags.quizAll=(S.flags.quizAll||0)+R.first;
  busy=false;BGM.scene(S.bg);S.pc++;step();
 }});
}

function finishChapter(next){
 const i=chapters.indexOf(curCh()),nx=next?byId[next]:chapters[i+1];meta.flags={...S.flags};persist();
 if(nx){S={...fresh(nx.id),flags:S.flags,day:S.day,phone:S.phone};autosave('장 시작');paint();return step();}
 busy=true;S.line=null;paint();const c=$('#vnCard');c.className='vn-card chapter';c.hidden=false;$('#vnBox').classList.add('quiet');
 const done=curCh().id==='ep';c.innerHTML=done?`<small>THE END</small><h2>연표의 끝에서</h2><p>선사부터 오늘까지, 주인님과 함께 걸었어요. 이야기 속에서 처음 맞힌 기출 ${S.flags.quizAll||0}문항. 틀린 문제는 오답 노트에서 묵이 기다리고 있어요. 타이틀의 「기출 풀기」에서 언제든 다시 읽어 주세요.</p><button class="primary">타이틀로</button>`:`<small>TO BE CONTINUED</small><h2>다음 시대는 준비 중이에요</h2><p>주인님, 여기까지 함께해 주셔서 고마워요. 타이틀의 「기출 풀기」에서 550문항을 언제든 다시 풀 수 있어요.</p><button class="primary">타이틀로</button>`;
 c.querySelector('button').onclick=e=>{e.stopPropagation();busy=false;title();};
}

// ── 세이브·로드(오토·퀵).
function snapshot(label){return {state:JSON.parse(JSON.stringify(S)),log:log.slice(-60),time:Date.now(),label:label||'',chapter:`${curCh().title} · ${curCh().subtitle}`};}
function autosave(label){if(!S)return;meta.saves.auto=snapshot(label);persist();}
function saveTo(slot){if(!S||!S.line){toast('대사가 보일 때 저장할 수 있어요.');return;}meta.saves[slot]=snapshot();persist();SFX.play('save');toast('퀵 세이브 완료');}
function loadFrom(slot){const s=meta.saves[slot];if(!s||!byId[s.state.ch]){toast('불러올 기록이 없어요.');return;}
 Quiz.close();S=JSON.parse(JSON.stringify(s.state));log=s.log||[];BGM.scene(S.bg);busy=false;skip=false;auto=false;setHidden(false);closeDialogs();shell();
 const line=S.line;S.line=null;paint();if(line){S.line=line;paint();type();}else step();}
function latest(){return Object.entries(meta.saves).sort((a,b)=>b[1].time-a[1].time)[0]?.[0];}
function openLog(){if(!S)return;const d=$('#vnLog');d.innerHTML=`<div class="dialog-header"><div><small>BACKLOG</small><h2>지난 대사</h2></div><button class="quiet" data-close>닫기 ×</button></div><div class="vn-log">${log.map(l=>`<p>${l.who?`<b>${esc(l.who)}</b>`:''}${esc(l.text)}</p>`).join('')||'<p>아직 기록이 없어요.</p>'}</div>`;d.querySelector('[data-close]').onclick=()=>d.close();d.showModal();const box=d.querySelector('.vn-log');box.scrollTop=box.scrollHeight;}
function config(){const d=$('#vnConfig'),st=meta.settings;
 d.innerHTML=`<div class="dialog-header"><div><small>CONFIG</small><h2>설정</h2></div><button class="quiet" data-close>닫기 ×</button></div><div class="vn-config">
 <label>대사 속도<select id="cfgText">${[[45,'여유롭게'],[28,'보통'],[16,'빠르게'],[0,'즉시 표시']].map(([v,n])=>`<option value="${v}" ${records.textSpeed===v?'selected':''}>${n}</option>`).join('')}</select></label>
 <label>오토 대기<select id="cfgAuto">${[[2600,'느리게'],[1600,'보통'],[800,'빠르게']].map(([v,n])=>`<option value="${v}" ${st.auto===v?'selected':''}>${n}</option>`).join('')}</select></label>
 <label>음악 볼륨<input type="range" id="cfgBgm" min="0" max="100" value="${Math.round(BGM.settings().volume*100)}"></label>
 <label>효과음 볼륨<input type="range" id="cfgSfx" min="0" max="100" value="${Math.round(SFX.settings().volume*100)}"></label>
 <label class="check"><input type="checkbox" id="cfgMute" ${BGM.settings().muted?'checked':''}> 음악 끄기</label>
 <label class="check"><input type="checkbox" id="cfgBlip" ${SFX.settings().blip!==false?'checked':''}> 대사 타이핑 소리</label>
 <button class="quiet" id="cfgReset">이야기 진행 기록 초기화</button></div>`;
 d.querySelector('[data-close]').onclick=()=>d.close();
 $('#cfgText').onchange=e=>{records.textSpeed=+e.target.value;save();};$('#cfgAuto').onchange=e=>{st.auto=+e.target.value;persist();};$('#cfgBgm').oninput=e=>BGM.setVolume(+e.target.value/100);$('#cfgMute').onchange=e=>BGM.setMuted(e.target.checked);$('#cfgSfx').oninput=e=>SFX.setVolume(+e.target.value/100);$('#cfgBlip').onchange=e=>SFX.setBlip(e.target.checked);
 $('#cfgReset').onclick=()=>{if(!confirm('세이브·읽음 기록을 지울까요? 문항 풀이 기록은 남습니다.'))return;meta={saves:{},read:{},flags:{},settings:st};persist();d.close();title();};
 d.showModal();
}
function closeDialogs(){for(const d of document.querySelectorAll('dialog[open]'))d.close();}
function menu(k){
 if(k==='log')return openLog();
 if(k==='notebook')return notebook();
 if(k==='auto'){auto=!auto;skip=false;paint();if(auto&&!typing&&S.line)afterLine();return;}
 if(k==='skip'){skip=!skip;auto=false;paint();if(skip){if(typing)finishType();else if(S.line)afterLine();}return;}
 if(k==='qsave')return saveTo('quick');
 if(k==='qload')return loadFrom('quick');
 if(k==='config')return config();
 if(k==='hide')return setHidden(true);
 if(k==='title'){if(confirm('타이틀로 돌아갈까요? 오토 세이브 시점까지는 남아 있어요.'))title();}
}

// ── 타이틀.
// 시작 화면: 브라우저는 사용자가 한 번 누르기 전엔 소리를 막는다. 여기서 한 번 눌러야 타이틀 BGM이 바로 나온다.
function splash(){
 document.body.classList.add('vn-mode');
 $('#main').innerHTML=`<section class="vn-splash" tabindex="0"><img class="vn-title-bg" src="${asset('bg_timeline_dive.webp')}" alt=""><div class="vn-splash-body"><span class="vn-seal">電脳侍女</span><h1><span class="vn-title-brush">연표</span>오르페이아</h1><p class="vn-splash-press">화면을 눌러 시작</p><small>소리가 함께 나와요 ♪</small></div></section>`;
 const el=$('.vn-splash');el.focus();
 let gone=false;const go=e=>{if(gone)return;if(e.type==='keydown'&&['Shift','Control','Alt','Meta','Tab'].includes(e.key))return;gone=true;el.removeEventListener('pointerdown',go);document.removeEventListener('keydown',go);title();};
 el.addEventListener('pointerdown',go);document.addEventListener('keydown',go);
}
function title(){
 BGM.play('bgm_title');stopAuto();clearTimeout(typing?.t);typing=null;busy=false;skip=false;auto=false;S=null;Quiz.close();closeDialogs();document.body.classList.add('vn-mode');
 const cont=latest(),st=Quiz.stats();
 $('#main').innerHTML=`<section class="vn-title"><img class="vn-title-bg" src="${asset('bg_timeline_dive.webp')}" alt=""><img class="vn-title-chr" src="${asset('st_orpheia_smile.webp')}" alt=""><div class="vn-title-body"><small>韓國史 年表 · 한능검 심화</small><h1><span class="vn-title-brush">연표</span>오르페이아<span>얼굴 없는 작곡가와 역사덕후 보컬</span></h1><span class="vn-seal big">電脳<br>侍女</span>
 <p class="vn-title-sub">70~${Quiz.lastRound()}회 기출 ${st.total}문항 · 풀어 본 문항 ${st.seen} · 최근 정답 ${st.right}</p>
 <div class="vn-title-menu"><button class="primary" data-t="new">처음부터</button><button data-t="continue" ${cont?'':'disabled'}>이어하기</button><button data-t="drill">📝 기출 풀기 · 회차·시대별</button><button data-t="notebook">📜 연표 기록부</button><button data-t="config">설정</button></div>
 <p class="vn-title-note">이야기 속 문제는 모두 실제 한능검 심화 기출이에요. 해설과 자료 그림은 학습 사이트의 것을 그대로 씁니다.</p></div></section>`;
 const go={new:()=>{if(Object.keys(meta.saves).length&&!confirm('처음부터 시작할까요? 기존 세이브는 남아 있어요.'))return;S=fresh(chapters[0].id);log=[];shell();paint();step();},continue:()=>loadFrom(cont),drill:()=>Quiz.lobby(title),notebook,config};
 document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>go[b.dataset.t]());
}

// ── 키보드(이야기 화면에서만).
document.addEventListener('keydown',e=>{
 if(!$('#vn')||document.querySelector('dialog[open]')||Quiz.active())return;
 const box=$('#vnChoices');
 if(box&&!box.hidden&&/^[1-9]$/.test(e.key)){e.preventDefault();VN._pick?.(+e.key-1);return;}
 if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)advance();}
 else if(e.key==='Control'&&!e.repeat){skip=true;paint();if(typing)finishType();else if(S?.line)afterLine();}
 else if(e.key==='a'||e.key==='A')menu('auto');
 else if(e.key==='h'||e.key==='H')setHidden(!hidden);
 else if(e.key==='l'||e.key==='L')openLog();
});
document.addEventListener('keyup',e=>{if(e.key==='Control'&&skip){skip=false;if($('#vn'))paint();}});

return {flag:k=>S?.flags?.[k],chapter,title,splash,_pick:null,chapters,_dev:id=>{S=fresh(id);log=[];shell();paint();step();}};
})();
