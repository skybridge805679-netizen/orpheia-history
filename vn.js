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
 dallae:{name:'달래',cls:'c-other',stand:{neutral:'st_dallae_smile',smile:'st_dallae_smile',worry:'st_dallae_worry',shy:'st_dallae_shy',angry:'st_dallae_angry',teary:'st_dallae_teary',surprised:'st_dallae_surprised'}},
 naru:{name:'나루',cls:'c-other',stand:{baekje:'st_naru_baekje',goguryeo:'st_naru_goguryeo',silla:'st_naru_silla',sea:'st_naru_sea',joseon:'st_naru_joseon',smile:'st_naru_sea',serious:'st_naru_sea'}},
 yunseul:{name:'윤슬',cls:'c-yunseul',stand:{neutral:'st_yunseul_neutral',smile:'st_yunseul_smile',surprised:'st_yunseul_surprised',pout:'st_yunseul_pout',serious:'st_yunseul_serious',shy:'st_yunseul_shy',angry:'st_yunseul_angry',teary:'st_yunseul_teary'}},
 haerang:{name:'해랑',cls:'c-other',stand:{neutral:'st_haerang_smile',smile:'st_haerang_smile',serious:'st_haerang_serious',worry:'st_haerang_serious',shy:'st_haerang_shy',angry:'st_haerang_angry',teary:'st_haerang_teary',surprised:'st_haerang_surprised'}},
 yeoul:{name:'여울',cls:'c-other',stand:{neutral:'st_yeoul_smile',smile:'st_yeoul_smile',surprised:'st_yeoul_surprised',worry:'st_yeoul_surprised',shy:'st_yeoul_shy',angry:'st_yeoul_angry',teary:'st_yeoul_teary'}},
 sodam:{name:'소담',cls:'c-other',stand:{neutral:'st_sodam_smile',smile:'st_sodam_smile',worry:'st_sodam_worry',surprised:'st_sodam_surprised',shy:'st_sodam_shy',angry:'st_sodam_angry',teary:'st_sodam_teary'}},
 dano:{name:'단오',cls:'c-other',stand:{neutral:'st_dano_smile',smile:'st_dano_smile',surprised:'st_dano_surprised',worry:'st_dano_surprised',shy:'st_dano_shy',angry:'st_dano_angry',teary:'st_dano_teary'}},
 bori:{name:'보리',cls:'c-other',stand:{neutral:'st_bori_smile',smile:'st_bori_smile',serious:'st_bori_serious',worry:'st_bori_serious',teary:'st_bori_teary',shy:'st_bori_shy',angry:'st_bori_angry',surprised:'st_bori_surprised'}},
 hanbyeol:{name:'한별',cls:'c-other',stand:{neutral:'st_hanbyeol_smile',smile:'st_hanbyeol_smile',excited:'st_hanbyeol_smile',serious:'st_hanbyeol_serious',worry:'st_hanbyeol_serious',surprised:'st_hanbyeol_surprised',teary:'st_hanbyeol_teary',shy:'st_hanbyeol_shy',angry:'st_hanbyeol_angry'}},
 saebyeok:{name:'새벽',cls:'c-other',stand:{neutral:'st_saebyeok_smile',smile:'st_saebyeok_smile',serious:'st_saebyeok_serious',teary:'st_saebyeok_teary',worry:'st_saebyeok_serious',surprised:'st_saebyeok_surprised',shy:'st_saebyeok_shy',angry:'st_saebyeok_angry'}},
 dasom:{name:'다솜',cls:'c-other',stand:{neutral:'st_dasom_smile',smile:'st_dasom_smile',serious:'st_dasom_serious',teary:'st_dasom_teary',worry:'st_dasom_serious',surprised:'st_dasom_surprised',shy:'st_dasom_shy',angry:'st_dasom_angry'}},
 me:{name:'상철',cls:'c-player',stand:{}},
};
// 모브: 검은 실루엣(assets/mob_*.webp). 대사 이름표가 아래 이름이면 그 실루엣이 자동으로 선다. 장마다 @mob 이름=원형 으로 덮어쓴다.
const MOB_TYPES=['soldier_ancient','official_ancient','king_ancient','scholar','farmer','blacksmith','merchant','elder_man','woman_elder','woman','court_lady','noble_joseon','soldier_joseon','soldier_modern','man_modern','crowd','child'];
for(const m of MOB_TYPES)CAST['mob_'+m]={name:'',cls:'c-mob',stand:{neutral:'mob_'+m}};
const MOB_BY_NAME={'전령':'soldier_ancient','늙은 병사':'soldier_ancient','고구려 병사':'soldier_ancient','백제 병사':'soldier_ancient','감독관':'soldier_ancient',
 '태학 박사':'official_ancient','백제 관리':'official_ancient','고구려 관리':'official_ancient','귀족':'official_ancient','사신':'official_ancient','신라 사신':'official_ancient','시험관':'official_ancient','준왕':'king_ancient',
 '선비':'scholar','고흥':'scholar','젊은 관리':'scholar','문벌 도령':'scholar','승객':'scholar','응시생들':'crowd',
 '농부':'farmer','농민':'farmer','만적':'farmer','대장장이':'blacksmith','송나라 상인':'merchant','강 행수':'merchant','다점 주인':'merchant',
 '늙은 내관':'elder_man','이야기꾼':'woman_elder','상궁':'court_lady','대감':'noble_joseon','군관':'soldier_joseon','교관':'soldier_modern',
 '구경꾼':'crowd','아이들':'crowd','절 아이':'child'};
const ALIAS={'다솜':'dasom','새벽':'saebyeok','한별':'hanbyeol','보리':'bori','단오':'dano','소담':'sodam','여울':'yeoul','해랑':'haerang','오르페이아':'orpheia','사연':'sayeon','묵':'muk','윤슬':'yunseul','누리':'nuri','나루':'naru','달래':'dallae','나':'me','주인님':'me','상철':'me'};
const EXPR_FX={surprised:'shake',excited:'hop',smile:'hop',shy:'hop',pout:'tilt',worry:'sink',stern:'nod'};
const OLD={};
const MISSING=new Set();
// 배틀 뒤의 묵: 찢어진 단계(S.mukDmg 1~3)에 맞는 스탠딩. 그 장이 끝나면 먹물이 다시 차올라 원래 옷으로 돌아온다.
const MUK_DMG={1:{angry:'angry',lonely:'lonely',surprised:'surprised',smile:'smile',smirk:'angry',neutral:'angry'},
 2:{angry:'angry',lonely:'lonely',surprised:'shy',smile:'shy',smirk:'angry',neutral:'shy',shy:'shy'},
 3:{lonely:'lonely',angry:'shy',surprised:'shy',smile:'shy',smirk:'shy',neutral:'shy',shy:'shy'}};
// 한복 오르페이아: 다이브(MV 장면 엔진) 안의 옛 시대 장면에서는 옷도 시대에 맞춘다. @outfit hanbok|maid|auto 로 덮어쓰기.
const HANBOK_EXPR=new Set(['neutral','smile','worry','explain','surprised','pout','shy','excited','serious','teary']);
const HANBOK_CH=new Set(['ch02','ch03','ch04','ch05','ch06','ch07','ch08','ch09','ch10','ch11','ch12','ch13','ch14','ch15']);
function orpHanbok(){if(!S)return false;if(S.outfit==='hanbok')return true;if(S.outfit==='maid')return false;return HANBOK_CH.has(S.ch)&&/(^|\/)bg_era_/.test(String(S.bg||''));}
const ORP_GLITCH={shy:'shy',teary:'shy',worry:'shy',surprised:'shy',pout:'pout',serious:'pout',angry:'pout'};
const standFile=(who,expr)=>{const s=CAST[who]?.stand;if(!s)return '';
 if(who==='orpheia'&&S?.orpDmg)return `st_orpheia_${ORP_GLITCH[expr]||'smile'}_g${S.orpDmg}.webp`;
 if(who==='orpheia'&&orpHanbok())return `st_orpheia_hanbok_${HANBOK_EXPR.has(expr)?expr:'neutral'}.webp`;
 if(who==='muk'&&S?.mukDmg){const d=S.mukDmg,e=MUK_DMG[d][expr]||MUK_DMG[d].neutral;return `st_muk_${e}_d${d}.webp`;}
 const f=s[expr]||s.neutral;if(!f)return '';return (MISSING.has(f)&&OLD[f]?OLD[f]:f)+'.webp';};
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
   case 'board':return board(op.arg.trim().split(/\s+/));
   case 'sd':sdPop(op.arg.trim());S.pc++;break;
   case 'photo':S.photo=op.arg.trim()==='off'?null:op.arg.trim();S.pc++;paint();break;
   case 'bg':for(const k of Object.keys(S.chars))if(S.chars[k].auto)delete S.chars[k];S.photo=null;S.bg=bgFile(op.arg);BGM.scene(op.arg);S.pc++;paint();break;
   case 'bgm':if(op.arg==='auto')BGM.scene(S.bg);else BGM.play(op.arg==='off'?'':op.arg);S.pc++;break;
   case 'show':{for(const k of Object.keys(S.chars))if(S.chars[k].auto&&k!==op.who&&(S.chars[k].pos===op.pos||Object.keys(S.chars).filter(x=>x!==op.who).length>=3))delete S.chars[k];
    const was=S.chars[op.who];S.chars[op.who]={expr:op.expr,pos:op.pos};if(!was)pendingFx[op.who]='enter';else if(was.expr!==op.expr&&EXPR_FX[op.expr])pendingFx[op.who]=EXPR_FX[op.expr];S.pc++;paint();break;}
   case 'phone':S.phone=op.arg!=='off';if(S.phone)SFX.play('phone');if(S.phone&&S.chars.orpheia)pendingFx.orpheia='enter';S.pc++;paint();break;
   case 'hop':case 'tilt':case 'nod':case 'sink':case 'shake':if(op.arg)pendingFx[ALIAS[op.arg]||op.arg]=op.t;S.pc++;paint();break;
   case 'hide':if(op.who==='all'){S.chars={};S.photo=null;}else delete S.chars[op.who];S.pc++;paint();break;
   case 'day':S.day=op.arg;return card('day',op.arg);
   case 'chapter':return card('chapter',op.num,op.title);
   // 시간 여행: @dive 연대|시대 — 빛의 통로를 지나 그 시대로 들어간다(배경은 다음 @bg).
   case 'dive':{const [when,...what]=op.arg.split('|');S.bg=bgFile('bg_timeline_dive');S.chars={};S.phone=false;S.photo=null;fx('flash');SFX.play('rewind');paint();return card('dive',when.trim(),what.join('|').trim());}
   // 상태창: @hud 제목|줄|줄 — {flag} 값을 채워 게임 HUD처럼 보여 준다.
   case 'hud':{const [t,...ls]=fill(op.arg).split('|');return card('hud',t.trim(),ls.map(x=>x.trim()).join('\n'));}
   case 'flash':fx('flash');SFX.play('flash');S.pc++;break;
   case 'sfx':SFX.play(op.arg);S.pc++;break;
   case 'wait':busy=true;setTimeout(()=>{busy=false;S.pc++;step();},+op.arg||600);return;
   case 'choice':return choose(op);
   case 'quiz':return quiz(op.arg);
   case 'battle':return battle(op.arg.trim());
   // 연표 기록부: @note 제목|내용 — 본 것을 카드로 모은다. @summary — 이 장에서 모은 카드를 정리해 보여 준다.
   case 'note':{const [t,...b]=op.arg.split('|');addNote(S.ch,t.trim(),b.join('|').trim());S.pc++;break;}
   case 'summary':return summary();
   case 'end':return finishChapter(op.arg);
   case 'outfit':S.outfit=op.arg.trim()==='auto'?null:op.arg.trim();S.pc++;paint();break;
   case 'mob':{const [n,t]=op.arg.split('=').map(x=>x.trim());(S.mobMap||(S.mobMap={}))[n]=t;S.pc++;break;}
   case 'say':case 'narr':
    if(op.t==='say'&&!CAST[op.who]){const t=(S.mobMap||{})[op.who]??MOB_BY_NAME[op.who];const id=t&&t!=='none'?'mob_'+t:null;
     if(id&&!S.chars[id]){for(const k of Object.keys(S.chars))if(k.startsWith('mob_')&&S.chars[k].auto)delete S.chars[k];
      const others=Object.values(S.chars);let pos=null;
      if(!others.length)pos='center';else if(others.length===1)pos=others[0].pos==='right'?'left':'right';else if(others.length===2){const u=new Set(others.map(c=>c.pos));pos=['center','left','right'].find(p=>!u.has(p))||null;}
      if(pos){if(others.length===1&&others[0].pos==='center')others[0].pos=pos==='right'?'left':'right';S.chars[id]={expr:'neutral',pos,auto:true};pendingFx[id]='enter';}}
     S.speakingMob=id;}else if(op.t==='say')S.speakingMob=null;
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
 $('#main').innerHTML=`<section class="vn" id="vn" aria-label="비주얼 노벨"><div class="vn-layer vn-bg"><img id="vnBg" alt=""></div><div class="vn-layer vn-chars" id="vnChars"></div><figure class="vn-photo" id="vnPhoto" hidden title="눌러서 크게 보기"><div class="vn-photo-frame"><img alt=""></div><figcaption><b></b><small></small></figcaption></figure><div class="vn-phone" id="vnPhone" hidden><div class="vn-phone-notch"></div><div class="vn-phone-screen"></div></div><div class="vn-layer vn-fx" id="vnFx"></div><div class="vn-day" id="vnDay"></div><div class="vn-card" id="vnCard" hidden></div><div class="vn-choices" id="vnChoices" hidden></div>
 <div class="vn-box" id="vnBox"><div class="vn-name" id="vnName"><b id="vnWho"></b></div><p class="vn-text" id="vnText" aria-live="polite"></p><span class="vn-caret" id="vnCaret">▼</span></div>
 <nav class="vn-menu" aria-label="메뉴">${[['notebook','기록부'],['log','로그'],['auto','오토'],['skip','스킵'],['qsave','Q.세이브'],['qload','Q.로드'],['config','설정'],['hide','숨기기'],['title','타이틀']].map(([k,v])=>`<button data-vn="${k}">${v}</button>`).join('')}</nav></section>`;
 const vn=$('#vn');
 vn.addEventListener('click',e=>{if(e.target.closest('.vn-menu,.vn-choices,.vn-card button,.qz'))return;advance();});
 vn.addEventListener('contextmenu',e=>{e.preventDefault();setHidden(!hidden);});
 vn.querySelectorAll('[data-vn]').forEach(b=>b.onclick=e=>{e.stopPropagation();menu(b.dataset.vn);});
}
// 문화재 사진: 기출 보기 사진(QUESTION_FIGURES, 이름 확인된 것)과 따로 모은 사진(data/heritage.js)에서 이름으로 찾는다.
function heritage(name){
 const H=window.HERITAGE||{},F=window.QUESTION_FIGURES||{};
 if(H[name])return {src:H[name].local?asset(H[name].src):figSrc(H[name].src),credit:H[name].credit,desc:H[name].desc};
 let near=null;
 for(const [k,v] of Object.entries(F))for(const c of v.choices||[]){
  if(c.nameStatus!=='identified')continue;const [r,n]=k.split('-'),hit={src:figSrc(c.src),credit:`제${r}회 ${n}번 기출 보기 사진`};
  if(c.name===name)return hit;if(!near&&(c.name.includes(name)||name.includes(c.name)))near=hit;}
 if(!near)for(const [k,v] of Object.entries(H))if(k.includes(name)||name.includes(k)){near={src:v.local?asset(v.src):figSrc(v.src),credit:v.credit,desc:v.desc};break;}
 return near;
}
// 학습만화식 SD 리액션 컷인: @sd idea|warn|thumbs|cry|pout|shock|love|teach|detective|cheer|think|bow — 2.4초 뒤 사라진다(세이브에 남지 않음).
// 판서: 학습 사이트의 기출 핵심노트(CORE_NOTES)를 이야기 속 칠판으로 띄운다. @board 노트id [노트id…]
const NOTE_FILES=['ancient','goryeo-joseon','modern','contemporary'];
async function coreNotes(){if(window.CORE_NOTES?.length)return window.CORE_NOTES;await Promise.all(NOTE_FILES.map(f=>loadOnce(figSrc(`core-notes/${f}.js`))));return window.CORE_NOTES||[];}
const hl=t=>esc(t).replace(/\*\*([^*]+)\*\*/g,'<b class="bd-b">$1</b>').replace(/(\d{2}-\d{1,2})/g,'<i class="bd-q">$1</i>');
function boardHtml(n){
 const tb=(n.tables||[]).map(t=>`<figure class="bd-t"><figcaption>${hl(t.c||'')}</figcaption><table><thead><tr>${t.h.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${t.r.map(r=>`<tr>${r.map(c=>`<td>${hl(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></figure>`).join('');
 const tr=(n.traps||[]).length?`<div class="bd-traps"><b>함정 주의</b><ul>${n.traps.map(x=>`<li>${hl(typeof x==='string'?x:(x.t||x.text||JSON.stringify(x)))}</li>`).join('')}</ul></div>`:'';
 const ky=(n.keys||[]).length?`<div class="bd-keys"><b>이 단어가 보이면</b>${n.keys.map(x=>Array.isArray(x)?`<div><span>${esc(x[0])}</span> → <em>${esc(x[1])}</em></div>`:`<div><span>${esc(String(x))}</span></div>`).join('')}</div>`:'';
 return `<section class="bd-note"><h3><i class="vn-seal mini">板</i>${esc(n.title)}</h3>${tr}${ky}${tb}</section>`;
}
function board(ids){
 paint();busy=true;S.line=null;stopAuto();const c=$('#vnCard');$('#vnBox').classList.add('quiet');c.className='vn-card board';c.hidden=false;c.onclick=null;
 c.innerHTML=`<div class="bd-wrap"><div class="bd-head"><small><img class="bd-emblem" src="${asset('emblem_white.webp')}" alt="">오르페이아의 판서 · 기출 핵심노트</small><button class="primary" data-back>정리 끝 ▶</button></div><div class="bd-body"><p class="vn-sheet-wait">칠판을 펼치는 중이에요…</p></div></div>`;
 const done=e=>{e?.stopPropagation();c.hidden=true;$('#vnBox').classList.remove('quiet');busy=false;S.pc++;step();};
 c.querySelector('[data-back]').onclick=done;
 if(skip){done();return;}
 const nb=records.boards||(records.boards=[]);ids.forEach(id=>{if(!nb.includes(id))nb.push(id);});save();
 coreNotes().then(all=>{const body=c.querySelector('.bd-body');if(!body)return;const ns=ids.map(id=>all.find(x=>x.id===id)).filter(Boolean);
  body.innerHTML=ns.length?ns.map(boardHtml).join(''):'<p>판서를 불러오지 못했어요.</p>';}).catch(()=>{const b=c.querySelector('.bd-body');if(b)b.innerHTML='<p>판서를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>';});
}
function sdPop(kind){
 const v=$('#vn');if(!v||skip)return;let el=$('#vnSd');if(!el){el=document.createElement('img');el.id='vnSd';el.className='vn-sd';el.alt='';v.appendChild(el);}
 el.onerror=()=>{el.hidden=true;};el.hidden=false;el.src=asset(`sd_orp_${kind}.webp`);el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');
 clearTimeout(el._t);el._t=setTimeout(()=>{el.hidden=true;},2400);
}
function paintPhoto(){
 const el=$('#vnPhoto');if(!el)return;const [name,label]=String(S.photo||'').split('|').map(x=>x.trim()),h=name&&heritage(name);
 el.hidden=!h;$('#vn').classList.toggle('photo-on',!!h);if(!h){el.classList.remove('big');return;}
 const img=el.querySelector('img');if(img.dataset.f!==h.src){img.dataset.f=h.src;img.src=h.src;img.alt=label||name;el.classList.remove('big');}
 el.querySelector('b').textContent=label||name;el.querySelector('small').textContent=(h.desc?h.desc+' — ':'')+h.credit;
 el.onclick=e=>{e.stopPropagation();el.classList.toggle('big');};
}
function paint(){
 if(!$('#vn'))shell();
 const bg=$('#vnBg');if(bg&&S.bg&&bg.dataset.f!==S.bg){bg.dataset.f=S.bg;bg.style.visibility='';bg.onload=()=>{bg.dataset.ok=bg.src;};bg.onerror=()=>{if(bg.dataset.ok&&bg.src!==bg.dataset.ok)bg.src=bg.dataset.ok;else bg.style.visibility='hidden';};bg.src=asset(S.bg);}   // 아직 생성되지 않은 그림이면 직전 배경을 그대로 둔다
 paintChars();paintPhoto();
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
 $('#vn')?.classList.toggle('phone-on',!phone.hidden);
 const keep=new Set();
 for(const [who,c] of Object.entries(S.chars)){
  const file=standFile(who,c.expr);if(!file)continue;keep.add(who);
  const host=inPhone(who)?phone.querySelector('.vn-phone-screen'):wrap;
  let el=document.getElementById('chr-'+who);
  if(!el||el.parentElement!==host){el?.remove();el=document.createElement('div');el.id='chr-'+who;el.innerHTML='<div class="vn-chr-fx"><img alt=""></div>';host.appendChild(el);}
  el.className=`vn-chr pos-${c.pos}${who.startsWith('mob_')?' mob':''}${S.line?.who===who||who===S.speakingMob||!S.line?.who?' speaking':''}`;
  const img=el.querySelector('img');if(img.dataset.f!==file){img.dataset.f=file;img.onerror=()=>{const fb=standFile(who,'neutral');if(fb&&!img.src.endsWith(fb))img.src=asset(fb);};img.src=asset(file);img.alt=nameOf(who);}
  const fxName=pendingFx[who];if(fxName){const f=el.firstChild;f.className='vn-chr-fx';void f.offsetWidth;f.classList.add('fx-'+fxName);}
 }
 pendingFx={};
 for(const el of [...wrap.children,...phone.querySelector('.vn-phone-screen').children])if(!keep.has(el.id.slice(4)))el.remove();
}
function setHidden(v){hidden=v;$('#vn')?.classList.toggle('ui-hidden',v);}
function fx(kind){const vn=$('#vn');if(!vn)return;vn.classList.remove(kind);void vn.offsetWidth;vn.classList.add(kind);setTimeout(()=>vn.classList.remove(kind),700);}
function card(kind,a,b){
 paint();busy=true;S.line=null;const c=$('#vnCard');$('#vnBox').classList.add('quiet');
 c.className='vn-card '+kind;c.hidden=false;if(kind==='chapter')SFX.play('card');c.innerHTML=kind==='chapter'?(()=>{const [m,...sub]=String(b).split(' — ');return `<div class="vn-scroll"><img class="vn-crest scroll" src="${asset('emblem_gold.webp')}" alt=""><span class="vn-seal">${esc(a)}</span><h2>${esc(m)}</h2>${sub.length?`<p>${esc(sub.join(' — '))}</p>`:''}</div>`;})():kind==='dive'?`<div class="vn-dive-emblem"><img src="${asset('emblem_white.webp')}" alt=""><i></i></div><em class="vn-dive-tag">ORPHEIA · MV SCENE ENGINE</em><small>${esc(a)}</small><h2>${esc(b)}</h2>`:kind==='hud'?`<div class="vn-hud"><img class="vn-hud-emblem" src="${asset('emblem_gold.webp')}" alt=""><b>${esc(a)}</b><pre>${esc(b)}</pre></div>`:`<p>${esc(a)}</p>`;if(kind==='hud')SFX.play('card');
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
// 정리 페이지: 학습 사이트(korean-history-study)의 손필기식 요약노트를 그대로 불러와 펼친다.
const SHEETS={ch01:['ancient-1'],ch02:['ancient-1'],ch03:['ancient-1','ancient-2'],ch04:['ancient-1'],ch05:['unified-1'],ch06:['unified-1'],
 ch07:['goryeo-1'],ch08:['goryeo-1'],ch09:['goryeo-2','goryeo-1'],ch10:['joseon1-1','joseon1-2'],ch11:['joseon1-1'],ch12:['joseon2-1'],ch13:['joseon2-2','joseon2-1'],
 ch14:['gaehang-1'],ch15:['gaehang-2'],ch16:['gaehang-2'],ch17:['ilje-1'],ch18:['ilje-2'],ch19:['ilje-2'],ch20:['ilje-3'],ch21:['modern-1'],ch22:['modern-1'],ch23:['modern-2','modern-1'],ch24:['integrated-1']};
const SHEET_FILE=id=>({'ancient-1':'ancient1','ancient-2':'ancient2','unified-1':'unified','integrated-1':'modern'})[id]||id.split('-')[0];
const loaded={};
function loadOnce(url,kind){return loaded[url]||(loaded[url]=new Promise((ok,no)=>{const el=document.createElement(kind==='css'?'link':'script');if(kind==='css'){el.rel='stylesheet';el.href=url;}else el.src=url;el.onload=ok;el.onerror=no;document.head.appendChild(el);}));}
async function openSheets(ch){
 const ids=SHEETS[ch]||[],d=$('#vnLog');if(!ids.length)return;
 d.innerHTML=`<div class="dialog-header"><div><small>정리 페이지</small><h2>요약노트</h2></div><button class="quiet" data-close>닫기 ×</button></div><p class="vn-sheet-wait">학습 사이트에서 요약노트를 불러오는 중이에요…</p>`;
 d.classList.add('sheets');d.querySelector('[data-close]').onclick=()=>d.close();d.onclose=()=>d.classList.remove('sheets');if(!d.open)d.showModal();
 try{
  await loadOnce(figSrc('summary.css'),'css');await loadOnce(figSrc('summary-render.js'));
  await Promise.all([...new Set(ids.map(SHEET_FILE))].map(f=>loadOnce(figSrc(`summary/${f}.js`))));
  const all=window.SUMMARY_SHEETS||[],html=ids.map(id=>all.find(x=>x.id===id)).filter(Boolean).map(x=>window.SummaryNotes.sheet(x,{sourceLabel:'한능검 학습실 요약노트'})).join('');
  const w=document.createElement('div');w.className='sm-wrap';w.innerHTML=html;
  w.querySelectorAll('img').forEach(i=>{const a=i.getAttribute('src');if(a&&!/^(https?:|data:)/.test(a))i.src=figSrc(a);});
  d.querySelector('.vn-sheet-wait').replaceWith(w);
 }catch(e){const p=d.querySelector('.vn-sheet-wait');if(p)p.textContent='요약노트를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.';}
}
function summary(){
 S.line=null;paint();busy=true;stopAuto();skip=false;const c=$('#vnCard');$('#vnBox').classList.add('quiet');c.className='vn-card summary';c.hidden=false;
 c.innerHTML=`<small>연표 기록부 · ${esc(curCh().title)}</small><h2>${esc(curCh().subtitle)}</h2>${notesHtml(S.ch)}<div class="vn-sum-btns">${SHEETS[S.ch]?'<button class="quiet" data-sheets>📜 정리 페이지 펼치기</button>':''}<button class="primary" data-back>이야기로 돌아가기 ▶</button></div>`;
 const sb=c.querySelector('[data-sheets]');if(sb)sb.onclick=e=>{e.stopPropagation();openSheets(S.ch);};
 c.onclick=null;c.querySelector('[data-back]').onclick=e=>{e.stopPropagation();c.hidden=true;$('#vnBox').classList.remove('quiet');busy=false;S.pc++;step();};
}
function notebook(){const d=$('#vnLog');d.innerHTML=`<div class="dialog-header"><div><small>NOTEBOOK</small><h2>연표 기록부</h2></div><button class="quiet" data-close>닫기 ×</button></div>${chapters.filter(c=>(records.notebook||{})[c.id]?.length).map(c=>`<h3>${esc(c.title)} · ${esc(c.subtitle)}</h3>${notesHtml(c.id)}`).join('')||'<p>이야기를 진행하면 그 시대에서 본 것이 여기에 쌓여요.</p>'}`;d.querySelector('[data-close]').onclick=()=>d.close();d.showModal();}
const _notebook=notebook;notebook=function(){_notebook();const d=$('#vnLog');const ids=records.boards||[];if(!ids.length)return;
 const sec=document.createElement('div');sec.innerHTML=`<h3>오르페이아의 판서 (${ids.length})</h3><p class="vn-sheet-wait">판서를 불러오는 중…</p>`;d.appendChild(sec);
 coreNotes().then(all=>{sec.querySelector('.vn-sheet-wait').outerHTML=`<div class="bd-wrap bd-inline"><div class="bd-body">${ids.map(id=>all.find(x=>x.id===id)).filter(Boolean).map(boardHtml).join('')}</div></div>`;}).catch(()=>{});};

// ── 기출 문항. quiz.js 가 문제를 띄우고, 끝나면 결과를 플래그로 돌려준다.
//    quizFirst: 이번 묶음에서 첫 시도에 맞힌 수, quizTotal: 이번 묶음 문항 수, quizAll: 이야기 전체 누적.
function quiz(arg){
 autosave('문제 직전');busy=true;stopAuto();skip=false;auto=false;S.line=null;paint();
 if(S.battle)battleHud();
 Quiz.run(arg,{host:$('#vn'),bgm:S.battle?(S.battle.serious?'bgm_tragic':'bgm_challenge'):null,onAnswer:S.battle?battleHit:null,onDone:R=>{
  S.flags.quizFirst=R.first;S.flags.quizTotal=R.total;S.flags.quizAll=(S.flags.quizAll||0)+R.first;
  $('#vnBattleHud')?.remove();busy=false;BGM.scene(S.bg);S.pc++;step();
 }});
}

// ── 묵 배틀. @battle muk [serious] … @quiz … @battle end
//    첫 시도에 맞힐 때마다 묵의 먹물 옷이 한 단계씩 찢어진다(cg_muk_b0~b3). serious: 옷 대신 먹물이 빛으로 흩어진다.
//    연출: VS 컷인 → 게이지·콤보 → 정답마다 히트스톱·베기·옷 조각 파편 → 오답은 먹물 반격 → 마지막은 FINISH/K.O. → 등급.
const MUK_TAUNT=['이유? 그런 거 없어도 외워지던데?','연도만 맞으면 되잖아. 순서는 내가 섞어 줄게.','이번 문제지는 내 거야. 가져갈 수 있으면 가져가 봐.','오르페이아, 네 주인님 시험 운은 어떨까?'];
const MUK_BREAK={
 1:['……소매쯤이야. 이유 하나 붙였다고 우쭐하지 마!','윽, 이 정도로……! 아직 한참 남았거든!'],
 2:['자, 잠깐! 거긴…… 보지 마! 이건 먹물이 모자라서 그런 거라고!','어, 어깨……! 오르페이아, 네 주인님 눈 좀 가려!'],
 3:['~~~~~!! 다 벗겨 놓고 이유까지 붙이면…… 나한테 뭐가 남는데……!','보, 보지 마……! 이번만…… 이번만 진 걸로 해 줄게……!'],
};
const MUK_SERIOUS={1:'먹물 한 겹이 빛이 되어 흩어진다.',2:'엉킨 연도 하나가 풀리며, 묵의 소매가 투명해진다.',3:'이유를 되찾은 기록이 하얗게 빛난다. 묵이 조용히 눈을 감는다.'};
const MUK_MISS=['틀렸네~ 먹물 충전♪','이유 없이 고르면, 그건 내 거야.','봐, 또 번졌잖아.','후후, 그 선지 나도 헷갈리게 만든 거야.'];
const ORP_BUG={
 1:['에, 에러?! 주인님, 제 소매가…… 픽셀로 깨지고 있어요!','앗, 앞치마 텍스처가 날아갔어요! 주인님, 보지 마세요오!'],
 2:['보, 보지 마세요! 렌더링 오류예요! 이건 버그예요, 버그!','의상 데이터 손실 61%…… 주, 주인님, 눈 감아 주세요!'],
 3:['시, 시스템 경고! 의상 데이터 손실 98%…… 주인님, 다음 문제는 꼭 맞혀 주세요오……!','머리띠랑 리본만 남았어요……! 이, 이건 메이드 스킨 최후의 보루예요!'],
};
const MUK_BUG=['네 주인님이 틀리니까 네가 번지는 거야♪','기록으로 만들어진 몸이잖아. 기록이 번지면, 너도 번져.','어머, 메이드 스킨이 다 깨졌네?'];
const ORP_MISS=['주인님, 괜찮아요! 해설 보고 다시 가요!','으으, 먹물 튀었어요……! 다음엔 꼭이요!','방심했어요! 단서부터 다시 봐요!'];
const ORP_COMBO=['좋아요, 주인님! 그대로 밀어붙여요!','연속 정답! 묵이 흔들리고 있어요!','이 흐름이에요! 이유로 꿰뚫어요!'];
let lastBattle=null;
const pickOne=a=>a[Math.floor(Math.random()*a.length)];
const calm=()=>skip||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// 의상(스킨)별 CG. 없으면 기본 cg_muk_bN.
function mukCg(st,b=S.battle){const k=b?.skin,n=b?.serious?0:st;return asset(k&&window.MUK_SKINS?.[k]?`cg_muk_${k}_b${n}.webp`:`cg_muk_b${n}.webp`);}
function battleImg(st){return mukCg(st);}
function skinName(b=S.battle){return window.MUK_SKINS?.[b?.skin]?.name||'';}
function recordSkin(b){if(!b?.skin)return;const m=records.mukSkins||(records.mukSkins={});m[b.skin]=Math.max(m[b.skin]??0,b.serious?0:b.stage);save();}
function nextSkin(){const i=chapters.indexOf(curCh());for(const c of chapters.slice(i+1))for(const o of c.ops)if(o.t==='battle'){const m=/skin=(\w+)/.exec(o.arg);if(m)return m[1];}return null;}
function vnShake(big){if(calm())return;const v=$('#vn');v.classList.remove('vb-shake','vb-shake-big');void v.offsetWidth;v.classList.add(big?'vb-shake-big':'vb-shake');setTimeout(()=>v.classList.remove('vb-shake','vb-shake-big'),600);}
function particles(host,kind,n){if(calm())return;
 for(let i=0;i<n;i++){const e=document.createElement('i');e.className='vb-p '+kind;
  const ang=Math.random()*Math.PI*2,d=120+Math.random()*420;
  e.style.cssText=`left:${40+Math.random()*25}%;top:${30+Math.random()*30}%;--dx:${Math.cos(ang)*d}px;--dy:${Math.sin(ang)*d+(kind==='light'?-260:160)}px;--r:${Math.random()*720-360}deg;--s:${.5+Math.random()*1.1};animation-delay:${Math.random()*.15}s`;
  host.appendChild(e);}}
function battle(arg){
 const [who,mode]=arg.split(/\s+/);
 if(who==='end'){
  const b=S.battle;S.battle=null;lastBattle=b;$('#vnBattleHud')?.remove();if(!b){S.pc++;return step();}
  recordSkin(b);
  if(!b.serious&&b.stage>0)S.mukDmg=b.stage;
  if(!b.serious&&b.orp>0)S.orpDmg=b.orp;
  if(skip){S.pc++;return step();}
  const rate=b.total?b.hits/b.total:0,rank=rate>=1?'S':rate>=.67?'A':rate>=.34?'B':'C';
  busy=true;SFX.play(rank==='S'?'vb_ko':'vb_end');
  const head=b.stage>=3?(b.serious?'정화 완료':'K.O.'):'BATTLE END';
  const el=battleCut(head,b.stage>=3?(b.serious?'번진 기록이 모두 빛으로 돌아갔다.':'묵의 먹물 옷이 전부 벗겨졌다!'):(b.serious?`아직 번진 기록 ${3-b.stage}`:`먹물 옷 남은 겹 ${3-b.stage}`),b.stage,b.serious,true);
  el.classList.add('result');
  el.querySelector('.vb-text').insertAdjacentHTML('beforeend',`<div class="vb-rank r-${rank}">${rank==='S'?`<img src="${asset('emblem_gold.webp')}" alt="">`:''}<span>RANK</span><b>${rank}</b></div><ul class="vb-stats"><li>첫 시도 정답 <b>${b.hits}/${b.total||0}</b></li><li>최대 콤보 <b>${b.maxCombo||0}</b></li><li>${b.serious?'되돌린 기록':'BREAK'} <b>${b.stage}/3</b></li>${b.serious?'':`<li>오르페이아 버그 <b>${b.orp}/3</b></li>`}</ul>`);
  el.onclick=e=>{e.stopPropagation();el.remove();
   // 이 장의 마지막 배틀이면 다음 장 묵의 새 의상을 실루엣으로 예고
   const more=curCh().ops.slice(S.pc+1).some(o=>o.t==='battle'&&!/^end/.test(o.arg));const nk=!more&&nextSkin();
   if(nk&&window.MUK_SKINS?.[nk]){const t=document.createElement('div');t.className='vn-next';const sk=window.MUK_SKINS[nk];
    t.innerHTML=`<small>NEXT BATTLE</small><div class="vn-next-sil"><img src="${asset(`cg_muk_${nk}_b0.webp`)}" alt=""></div><b>다음 장의 묵</b><p>「${esc(sk.name)}」</p><em>${sk.serious?'다음 기록은, 조용히 마주해야 해요.':'다음엔 이 옷이에요. 벗겨 낼 수 있을까요?'}</em><span>눌러서 계속 ▶</span>`;
    $('#vn').appendChild(t);SFX.play('vb_bell');t.onclick=ev=>{ev.stopPropagation();t.remove();busy=false;S.pc++;step();};return;}
   busy=false;S.pc++;step();};return;
 }
 const st2=/stage2/.test(arg),skin=(/skin=(\w+)/.exec(arg)||[])[1]||null;S.battle={who,skin,serious:/serious/.test(arg),stage2:st2,stage:0,orp:0,hits:0,total:0,combo:0,maxCombo:0};
 if(skip){S.pc++;return step();}
 busy=true;BGM.play(S.battle.serious?'bgm_tragic':'bgm_challenge');
 const v=$('#vn'),el=document.createElement('div');el.className='vn-vs'+(S.battle.serious?' serious':'');
 el.innerHTML=`<div class="vs-side vs-l"><img class="vs-emblem" src="${asset('emblem_white.webp')}" alt=""><img src="${asset('st_orpheia_serious.webp')}" alt=""><b>오르페이아</b><small>電脳侍女 · LV.99</small></div>
 <div class="vs-side vs-r${S.battle.skin?' cg':''}"><img src="${S.battle.skin?mukCg(0):asset(S.battle.serious?'st_muk_lonely.webp':'st_muk_smirk.webp')}" alt=""><b>묵</b><small>${skinName()?esc(skinName())+' · ':''}${S.battle.serious?'번진 기록':'먹물 계정'}</small></div>
 <div class="vs-mark">${S.battle.serious?'鎭魂':'VS'}</div>${S.battle.stage2?'<div class="vs-stage">STAGE 2 · 잔향</div>':''}<div class="vs-bar top"></div><div class="vs-bar bot"></div>
 <p class="vs-line">${esc(S.battle.serious?'……이 이름들, 이유와 함께 돌려줘.':'묵「'+pickOne(MUK_TAUNT)+'」')}</p>
 <p class="vs-go">${S.battle.serious?'첫 시도에 맞혀서, 번진 기록을 되돌려 주세요':'첫 시도 정답 = BREAK! 먹물 옷을 한 겹씩 벗겨 내세요'}<small>눌러서 시작 ▶</small></p>`;
 v.appendChild(el);SFX.play(S.battle.serious?'vb_bell':'vb_start');if(!S.battle.serious)vnShake(true);
 el.onclick=e=>{e.stopPropagation();el.classList.add('out');SFX.play('vb_go');setTimeout(()=>{el.remove();busy=false;S.pc++;step();},280);};
}
function battleCut(head,text,st,serious,wait){
 const v=$('#vn');const el=document.createElement('div');el.className='vn-battle'+(serious?' serious':'')+(wait?' wait':'');
 el.innerHTML=`<img src="${mukCg(st,S.battle||lastBattle)}" alt=""><div class="vb-text"><b>${esc(head)}</b><p>${esc(text)}</p>${wait?'<small>눌러서 계속 ▶</small>':''}</div>`;
 v.appendChild(el);return el;
}
function battleHud(){
 $('#vnBattleHud')?.remove();const b=S.battle,w=document.createElement('div');w.id='vnBattleHud';w.className='vbh-wrap';
 const hp=100-b.stage*100/3;
 w.innerHTML=`<div class="vn-battle-hud${b.serious?' serious':''}"><img src="${battleImg(b.stage)}" alt=""><div class="vbh-body"><b>묵 <small>${b.serious?'번진 기록':'먹물 옷'}</small></b><span class="vbh-bar"><i class="lag" style="width:${b.lagHp??hp}%"></i><i class="hp" style="width:${hp}%"></i></span><span class="vb-pips">${[1,2,3].map(i=>`<i class="${i<=b.stage?'off':''}"></i>`).join('')}</span></div>${b.combo>1?`<em class="vbh-combo">${b.combo} COMBO</em>`:''}</div>`+
 (b.serious?'':`<div class="vn-battle-hud orp"><div class="vbh-body"><b>오르페이아 <small>의상 데이터</small></b><span class="vbh-bar"><i class="hp" style="width:${100-b.orp*100/3}%"></i></span><span class="vb-pips">${[1,2,3].map(i=>`<i class="${i<=b.orp?'off':''}"></i>`).join('')}</span></div><img src="${asset(b.orp?`st_orpheia_shy_g${b.orp}.webp`:'st_orpheia_serious.webp')}" alt=""></div>`);
 $('#vn').appendChild(w);b.lagHp=hp;
 requestAnimationFrame(()=>{const l=w.querySelector('.lag');if(l)setTimeout(()=>l.style.width=hp+'%',380);});
}
function battleHit(ok,first,hits,total){
 const b=S.battle;if(!b)return;b.total=total;b.hits=hits;
 if(ok&&!first){battleHud();return;}
 if(!ok&&!b.serious&&b.orp<3){b.combo=0;b.orp++;const n=b.orp;SFX.play('vb_glitch');vnShake(n>=3);
  const el=document.createElement('div');el.className='vn-battle bug'+(n>=3?' fin':'');const src=asset(`cg_orp_b${n}.webp`);
  el.innerHTML=`<img class="base" src="${src}" alt=""><img class="rgb r" src="${src}" alt=""><img class="rgb c" src="${src}" alt=""><div class="vb-scan"></div><div class="vb-err">ERROR 0x${(0xC0+n*7).toString(16).toUpperCase()} · COSTUME_DATA ${[0,23,61,98][n]}% LOST</div><div class="vb-text"><b>${n>=3?'SYSTEM DOWN':'BUG!'}</b><p>오르페이아「${esc(pickOne(ORP_BUG[n]))}」</p><p class="vb-muk">묵「${esc(pickOne(MUK_BUG))}」</p></div>`;
  $('#vn').appendChild(el);particles(el,'pixel',n>=3?36:22);el.onclick=e=>{e.stopPropagation();el.remove();};setTimeout(()=>el.remove(),n>=3?3400:2700);battleHud();return;}
 if(!ok){b.combo=0;SFX.play('vb_ink');vnShake(false);
  const m=battleCut('묵의 반격',`묵「${pickOne(MUK_MISS)}」`,b.stage,b.serious,false);m.classList.add('miss');particles(m,'ink',18);
  m.querySelector('.vb-text').insertAdjacentHTML('beforeend',`<p class="vb-orp">오르페이아「${esc(pickOne(ORP_MISS))}」</p>`);
  sdPop('cry');setTimeout(()=>m.remove(),1700);battleHud();return;}
 b.combo++;b.maxCombo=Math.max(b.maxCombo,b.combo);
 const st=Math.min(3,Math.ceil(3*hits/Math.max(1,total)));
 if(st<=b.stage){battleHud();if(b.combo>1){SFX.play('vb_combo');sdPop('cheer');}return;}
 const prev=b.stage;b.stage=st;const fin=st>=3;
 if(b.serious){SFX.play('vb_purify');}else{SFX.play(fin?'vb_finish':'vb_break');setTimeout(()=>SFX.play('vb_rip'),fin?260:140);vnShake(fin);}
 const el=document.createElement('div');el.className='vn-battle hit'+(b.serious?' serious':'')+(fin?' fin':'');
 const [head,line]=b.serious?['정화',MUK_SERIOUS[st]]:[fin?'FINISH!':'BREAK!',`묵「${pickOne(MUK_BREAK[st])}」`];
 el.innerHTML=`<img class="old" src="${mukCg(prev,b)}" alt=""><img class="new" src="${mukCg(st,b)}" alt=""><div class="vb-slash"></div><div class="vb-text"><b>${head}</b><p>${esc(line)}</p>${b.combo>1?`<p class="vb-orp">${b.combo} COMBO · 오르페이아「${esc(pickOne(ORP_COMBO))}」</p>`:''}</div><span class="vb-dmg">${b.serious?'+1 기록':'-1 겹'}</span>`;
 $('#vn').appendChild(el);particles(el,b.serious?'light':'cloth',b.serious?26:fin?40:24);if(!b.serious)particles(el,'ink',10);
 el.onclick=e=>{e.stopPropagation();el.remove();};setTimeout(()=>el.remove(),fin?3400:2700);battleHud();
}

function finishChapter(next){
 const i=chapters.indexOf(curCh()),nx=next?byId[next]:chapters[i+1];meta.flags={...S.flags};persist();
 if(nx){S={...fresh(nx.id),flags:S.flags,day:S.day,phone:S.phone};autosave('장 시작');paint();return step();}
 busy=true;S.line=null;paint();const c=$('#vnCard');c.className='vn-card chapter';c.hidden=false;$('#vnBox').classList.add('quiet');
 const done=curCh().id==='ep';c.innerHTML=done?`<img class="vn-crest end" src="${asset('emblem_gold.webp')}" alt=""><small>THE END</small><h2>연표의 끝에서</h2><p>선사부터 오늘까지, 주인님과 함께 걸었어요. 이야기 속에서 처음 맞힌 기출 ${S.flags.quizAll||0}문항. 틀린 문제는 오답 노트에서 묵이 기다리고 있어요. 타이틀의 「기출 풀기」에서 언제든 다시 읽어 주세요.</p><button class="primary">타이틀로</button>`:`<small>TO BE CONTINUED</small><h2>다음 시대는 준비 중이에요</h2><p>주인님, 여기까지 함께해 주셔서 고마워요. 타이틀의 「기출 풀기」에서 550문항을 언제든 다시 풀 수 있어요.</p><button class="primary">타이틀로</button>`;
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
// 묵 의상 도감: 배틀에서 만난 의상과 벗겨 낸 단계까지의 CG. 못 본 의상은 실루엣.
function mukGallery(){const d=$('#vnLog'),got=records.mukSkins||{},all=Object.entries(window.MUK_SKINS||{});
 const n=all.filter(([k])=>k in got).length;
 d.innerHTML=`<div class="dialog-header"><div><small>COLLECTION</small><h2>묵 의상 도감</h2></div><button class="quiet" data-close>닫기 ×</button></div>
 <p class="mg-sum">만난 의상 ${n} / ${all.length} · 첫 시도 정답으로 먹물 옷을 벗겨 낸 단계까지 열려요.</p><div class="mg-grid">${all.map(([k,v])=>{const has=k in got,mx=has?got[k]:-1,st=v.serious?[0]:[0,1,2,3];
  return `<figure class="mg-card${has?'':' locked'}${v.serious?' serious':''}"><div class="mg-main"><img src="${asset(`cg_muk_${k}_b0.webp`)}" alt=""></div><figcaption><b>${has?esc(v.name):'???'}</b>${v.serious?'<small>진혼</small>':`<span class="mg-pips">${st.map(i=>`<i class="${i<=mx?'on':''}" data-k="${k}" data-i="${i}"></i>`).join('')}</span>`}</figcaption></figure>`;}).join('')}</div><div class="mg-view" hidden><img alt=""></div>`;
 d.querySelector('[data-close]').onclick=()=>d.close();
 const view=d.querySelector('.mg-view');view.onclick=()=>view.hidden=true;
 d.querySelectorAll('.mg-card:not(.locked) .mg-main').forEach(m=>m.onclick=()=>{view.querySelector('img').src=m.querySelector('img').src;view.hidden=false;});
 d.querySelectorAll('.mg-pips i.on').forEach(p=>p.onclick=e=>{e.stopPropagation();view.querySelector('img').src=asset(`cg_muk_${p.dataset.k}_b${p.dataset.i}.webp`);view.hidden=false;});
 d.showModal();}
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
 $('#main').innerHTML=`<section class="vn-splash" tabindex="0"><img class="vn-title-bg" src="${asset('bg_timeline_dive.webp')}" alt=""><img class="vn-emblem-splash" src="${asset('emblem_gold.webp')}" alt="오르페이아의 문장"><div class="vn-splash-body"><span class="vn-seal">電脳侍女</span><h1><span class="vn-title-brush">연표</span>오르페이아</h1><p class="vn-splash-press">화면을 눌러 시작</p><small>소리가 함께 나와요 ♪</small></div></section>`;
 const el=$('.vn-splash');el.focus();
 let gone=false;const go=e=>{if(gone)return;if(e.type==='keydown'&&['Shift','Control','Alt','Meta','Tab'].includes(e.key))return;gone=true;el.removeEventListener('pointerdown',go);document.removeEventListener('keydown',go);el.classList.add('strum');SFX.play('vb_purify');setTimeout(title,650);};
 el.addEventListener('pointerdown',go);document.addEventListener('keydown',go);
}
function title(){
 BGM.play('bgm_title');stopAuto();clearTimeout(typing?.t);typing=null;busy=false;skip=false;auto=false;S=null;Quiz.close();closeDialogs();document.body.classList.add('vn-mode');
 const cont=latest(),st=Quiz.stats();
 $('#main').innerHTML=`<section class="vn-title"><img class="vn-title-bg" src="${asset('bg_timeline_dive.webp')}" alt=""><img class="vn-emblem-title" src="${asset('emblem_gold.webp')}" alt=""><img class="vn-title-chr" src="${asset('st_orpheia_smile.webp')}" alt=""><div class="vn-title-body"><img class="vn-crest" src="${asset('emblem_gold.webp')}" alt="오르페이아의 문장"><small>韓國史 年表 · 한능검 심화</small><h1><span class="vn-title-brush">연표</span>오르페이아<span>얼굴 없는 작곡가와 역사덕후 보컬</span></h1><span class="vn-seal big">電脳<br>侍女</span>
 <p class="vn-title-sub">70~${Quiz.lastRound()}회 기출 ${st.total}문항 · 풀어 본 문항 ${st.seen} · 최근 정답 ${st.right}</p>
 <div class="vn-title-menu"><button class="primary" data-t="new">처음부터</button><button data-t="continue" ${cont?'':'disabled'}>이어하기</button><button data-t="drill">📝 기출 풀기 · 회차·시대별</button><button data-t="notebook">📜 연표 기록부</button><button data-t="gallery">🖋 묵 의상 도감</button><button data-t="config">설정</button></div>
 <p class="vn-title-note">이야기 속 문제는 모두 실제 한능검 심화 기출이에요. 해설과 자료 그림은 학습 사이트의 것을 그대로 씁니다.</p></div></section>`;
 const go={new:()=>{if(Object.keys(meta.saves).length&&!confirm('처음부터 시작할까요? 기존 세이브는 남아 있어요.'))return;S=fresh(chapters[0].id);log=[];shell();paint();step();},continue:()=>loadFrom(cont),drill:()=>Quiz.lobby(title),notebook,config,gallery:mukGallery};
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

return {openSheets,flag:k=>S?.flags?.[k],chapter,title,splash,_pick:null,chapters,_dev:(id,pc)=>{S=fresh(id);if(pc!=null)S.pc=pc;log=[];shell();paint();step();}};
})();
