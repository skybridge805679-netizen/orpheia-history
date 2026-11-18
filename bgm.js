'use strict';
// Background music: tracks live in assets/bgm/<name>.mp3 (prompts in docs/suno/BGM.md, songs in docs/suno/노래-*.md).
// Scenes pick a track from their background; quizzes switch to the exam theme;
// a script can override with "@bgm name" until the next background change.
const BGM=(()=>{
 const KEY='orpheia-bgm-v1';
 const SONGS=['song_ch01','song_ch02','song_ch03','song_ch04','song_ch05','song_ch06','song_ch07','song_ch08','song_ch09','song_ch10','song_ch11','song_ch12','song_ch13','song_ch14','song_ch15','song_ch16','song_ch17','song_ch18','song_ch19','song_ch20','song_ch21','song_ch22','song_ch23','song_ep'];
 const TRACKS=['bgm_title','bgm_daily','bgm_night_shift','bgm_outing','bgm_orpheia','bgm_exam','bgm_result','bgm_challenge','bgm_comedy','bgm_romance','bgm_tragic','bgm_yunseul','bgm_ending',...SONGS];
 // 배경 이름 규칙: 표에 없으면 접두어로 고른다(새 장을 써도 BGM 표를 고칠 필요가 없게).
 const TRAGIC=/ugeumchi|jeju_43|gwangju_1980|heungnam|samjeondo|gyeongbokgung_ruin|okhoru|jungmyeongjeon|harbin|kokumin_school|bupyeong|tomak|namhansanseong|jinju_1862|pyeongyang_fall|hwangsan|myeonghakso/;
 const ROMANCE=/kiln|drying|cinema|farewell|yakgwa|dano_wink/;
 const byRule=n=>{
  if(/^cg_mv_(ch\d\d)/.test(n))return 'song_'+n.match(/^cg_mv_(ch\d\d)/)[1];
  if(n==='cg_yunseul_recording')return 'song_ch09';
  if(n==='cg_ep_release'||n==='cg_ep_all')return 'bgm_ending';
  if(/ink_spread|comment_flame/.test(n))return 'bgm_challenge';
  if(/studio/.test(n))return 'bgm_night_shift';
  if(/yunseul/.test(n))return 'bgm_yunseul';
  if(/orpheia|dive_hand|timeline_dive/.test(n))return 'bgm_orpheia';
  if(TRAGIC.test(n))return 'bgm_tragic';
  if(ROMANCE.test(n))return 'bgm_romance';
  if(/^cg_(ch\d\d|yeoul)_/.test(n))return 'bgm_comedy';
  if(/^bg_era_/.test(n))return 'bgm_outing';
  return '';
 };
 const SCENE={
  bg_study_room:'bgm_night_shift',bg_training_room:'bgm_daily',bg_training_room_night:'bgm_night_shift',bg_center_lobby:'bgm_daily',bg_cafeteria:'bgm_daily',bg_break_room:'bgm_night_shift',
  bg_cherry_street:'bgm_outing',bg_riverside_day:'bgm_outing',bg_snow_street:'bgm_outing',bg_spring_cherry:'bgm_orpheia',
  bg_exam_hall:'bgm_exam',bg_exam_room:'bgm_exam',bg_my_room_night:'bgm_night_shift',bg_lecture_room:'bgm_daily',bg_study_cafe:'bgm_night_shift',bg_street_evening:'bgm_outing',bg_museum_hall:'bgm_orpheia',
  cg_ch01_dolmen:'bgm_orpheia',cg_ch02_baekje:'bgm_orpheia',cg_ch03_palace_night:'bgm_orpheia',cg_ch04_goryeo_port:'bgm_orpheia',
 };
 let set={volume:.5,muted:false};
 try{Object.assign(set,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{}
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(set));}catch{}};
 const ready=new Set(),src=n=>asset(`bgm/${n}.mp3`);
 // 파일 확인: HEAD가 404면 없음. HEAD를 막는 서버(405·403 등)나 네트워크 오류면 Range GET으로 한 번 더 보고, 그래도 판단이 안 되면 있다고 보고 재생을 시도한다(실패하면 그때 제외).
 const exists=async n=>{
  if(location.protocol==='file:')return true;
  try{const h=await fetch(src(n),{method:'HEAD'});if(h.ok)return true;if(h.status===404)return false;}catch{}
  try{const c=new AbortController(),g=await fetch(src(n),{headers:{Range:'bytes=0-0'},signal:c.signal});c.abort();return g.ok||g.status===206;}catch{return true;}
 };
 const probed=Promise.all(TRACKS.map(n=>exists(n).then(ok=>{if(ok)ready.add(n);})));
 const decks=[new Audio(),new Audio()];decks.forEach(a=>{a.loop=true;a.preload='none';a.volume=0;});
 let front=0,cur='',wanted='',unlocked=false;
 // 덱마다 페이드는 하나만 돈다: 새 페이드가 시작되면 그 덱의 이전 페이드(와 끝난 뒤의 pause)는 취소된다.
 // (곡이 0.7초 안에 연달아 바뀔 때, 앞 곡 페이드아웃의 pause가 방금 시작한 새 곡을 멈추던 문제를 막는다.)
 function fade(a,to,ms,done){const id=a._f=(a._f||0)+1,from=a.volume,t0=performance.now();const step=t=>{if(a._f!==id)return;const k=Math.min(1,(t-t0)/ms);a.volume=Math.max(0,Math.min(1,from+(to-from)*k));if(k<1)requestAnimationFrame(step);else done?.();};requestAnimationFrame(step);}
 const level=()=>set.muted?0:set.volume;
 function play(name){
  wanted=name||'';
  if(!unlocked||wanted===cur)return;
  const old=decks[front];cur=wanted;
  fade(old,0,700,()=>{if(old!==decks[front])old.pause();});
  if(!cur||!ready.has(cur))return;
  front^=1;const a=decks[front];a._f=(a._f||0)+1;a.src=src(cur);a.currentTime=0;a.volume=0;   // a._f 증가: 이 덱에서 돌던 이전 페이드를 끊는다
  a.play().then(()=>fade(a,level(),900)).catch(e=>{console.warn('bgm',name,e.name);if(e.name==='NotSupportedError')ready.delete(name);if(e.name==='NotAllowedError'){unlocked=false;arm();}if(cur===name)cur='';});
 }
 const scene=bg=>{const n=String(bg||'').replace(/\.(png|webp)$/,'');let t=SCENE[n]||byRule(n)||'bgm_daily';if(t.startsWith('song_')&&!ready.has(t))t='bgm_result';play(t);};
 // Browsers only allow audio after a user gesture.
 const unlock=()=>{if(unlocked)return;unlocked=true;probed.then(()=>{const w=wanted;cur='';play(w);});};
 // Shift·Ctrl 같은 키나 Esc는 브라우저가 「사용자 조작」으로 안 쳐 줘서 재생이 거부될 수 있다(NotAllowedError). 그러면 다시 잠그고 다음 클릭·키 입력 때 재시도한다.
 const arm=()=>{for(const ev of ['pointerdown','keydown'])document.addEventListener(ev,unlock,{once:true,capture:true});};
 arm();
 probed.then(()=>{if(unlocked){const w=wanted;cur='';play(w);}});
 function setVolume(v){set.volume=v;persist();decks[front].volume=level();}
 function setMuted(m){set.muted=m;persist();decks[front].volume=level();}
 const status=()=>({found:ready.size,total:TRACKS.length,current:cur,unlocked});
 return {current:()=>cur,play,scene,setVolume,setMuted,settings:()=>({...set}),tracks:TRACKS,ready,status,whenReady:()=>probed};
})();
