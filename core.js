'use strict';
// 공용 도우미. 오르페이아(Orphiey) 철도 ADV의 app.js에서 이야기 엔진이 쓰던 것만 남겼다.
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset=name=>`assets/${name}`;
// 기출 자료 그림은 학습 사이트(GitHub Pages)에서 불러온다. 같은 폴더 구성으로 로컬에 두면 그쪽을 쓴다.
const IMG_BASE=window.IMG_BASE||'https://skybridge805679-netizen.github.io/korean-history-study/site/';
const figSrc=src=>/^(https?:|data:|assets\/)/.test(src)?src:IMG_BASE+src;
const KEY='orpheia-history-v1';
let records={textSpeed:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:28,quiz:{}};
try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw&&typeof raw==='object')records={...records,...raw};}catch{}
function save(){try{localStorage.setItem(KEY,JSON.stringify(records));}catch{}}
function toast(t){const n=$('#toast');n.textContent=t;n.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>n.style.display='none',2600);}
// 문항별 기록: 푼 횟수, 첫 시도 정답, 최근 정답 여부.
function logAnswer(key,ok,first){const r=records.quiz[key]||(records.quiz[key]={t:0,c:0,last:false});r.t++;if(ok&&first)r.c++;r.last=ok&&first;save();}
const QBY=Object.fromEntries((window.QS||[]).map(q=>[q.r+'-'+q.n,q]));
