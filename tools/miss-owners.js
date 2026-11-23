// choice-cover 가 놓친 오답 보기마다 기출 해설이 말하는 '주인'을 함께 보여 준다: node tools/miss-owners.js story/ch03-*.js
const fs=require('fs');global.window={};
for(const f of ['data/qs.js','data/explanations.js','data/predicted.js'])eval(fs.readFileSync(f,'utf8'));
const QS=window.QS,EX=window.QUESTION_EXPLANATIONS;
const strip=w=>w.replace(/(으로|에서|에게|하였다|하였어요|했다|되었다|이었다|이다|였다|을|를|이|가|은|는|의|에|와|과|로|도|하여|한|들)$/,'');
const STOP=/^(있었|있었다|설치|하였|하였다|두었다|만들었다|사용|위하여|통해|대한|국가|시기|처음|크게|다음|자료|사실|모습|이후|이전|활동|설명|옳은|것은|나라|지방|중심|주장|실시|시행|편찬|결성|발표|조직|일으켰다|세웠다|물리쳤다|운동|사건|정부|단체|있다|벌였다|이끌었다)/;
const words=s=>[...new Set(String(s).replace(/<[^>]+>/g,' ').replace(/[.,()·『』「」\[\]"'?!:~/]/g,' ').split(/\s+/).map(strip).filter(w=>w.length>=2&&!STOP.test(w)&&!/^[0-9]+$/.test(w)&&!/^\(?[가-마]\)?$/.test(w)))];
const cov=(ws,t)=>ws.length?ws.filter(w=>t.includes(w)).length/ws.length:1;
const ORDER=(fs.readFileSync('index.html','utf8').match(/story\/ch[^"]*\.js/g)||[]);
const prevText=f=>{const i=ORDER.indexOf(f);return i<0?'':ORDER.slice(0,i).map(x=>fs.readFileSync(x,'utf8')).join('\n')};
for(const f of process.argv.slice(2)){const lines=fs.readFileSync(f,'utf8').split('\n');const PREV=process.env.SELF?'':prevText(f);
 lines.forEach((l,i)=>{const m=l.match(/^@quiz\s+(.*)/);if(!m)return;const before=PREV+'\n'+lines.slice(0,i).filter(x=>!x.startsWith('//')).join('\n');
  for(const k of m[1].trim().split(/\s+/)){const [r,n]=k.split('-').map(Number);const q=QS.find(x=>x.r===r&&x.n===n);if(!q)continue;const e=EX[k]||{};
   const rows=[];q.ch.forEach((o,j)=>{if(j===q.a-1||/^\(?[가-마]\)|번 사진/.test(o))return;if(cov(words(o),before)<0.5)rows.push(`  - ${o}  ⇒ ${(e.choices||[])[j]||''}`)});
   if(rows.length)console.log(`[${k}] L${i+1} 정답: ${q.ch[q.a-1]}\n`+rows.join('\n'));}});}
