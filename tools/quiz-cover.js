// 장별로 문제 정답 낱말이 문제 앞 대사에 나왔는지 거칠게 재기: V=1 node tools/quiz-cover.js story/ch04-*.js
const fs=require('fs');global.window={};
eval(fs.readFileSync('data/qs.js','utf8'));eval(fs.readFileSync('data/explanations.js','utf8'));
const QS=window.QS;
const files=process.argv.slice(2);
const strip=w=>w.replace(/(으로|에서|에게|하였다|하였어요|했다|되었다|이다|였다|을|를|이|가|은|는|의|에|와|과|로|도|를|하여|한)$/,'');
for(const f of files){const t=fs.readFileSync(f,'utf8');const lines=t.split('\n');let start=0;let tot=0,cnt=0;const out=[];
 lines.forEach((l,i)=>{const m=l.match(/^@quiz\s+(.*)/);if(!m)return;const before=lines.slice(start,i).join('\n');
  for(const k of m[1].trim().split(/\s+/)){const [r,n]=k.split('-').map(Number);const q=QS.find(x=>x.r===r&&x.n===n);if(!q){continue;}
   const ans=q.ch[q.a-1];const words=ans.replace(/[.,()·『』「」]/g,' ').split(/\s+/).map(strip).filter(w=>w.length>=2&&!/^(있었|있었다|설치|하였|하였다|두었다|만들었다|사용|위하여|통해|대한|국가|시기)/.test(w));
   const hit=words.filter(w=>before.includes(w));const sc=words.length?hit.length/words.length:1;tot+=sc;cnt++;
   out.push(`${sc<0.5?'✗':sc<0.8?'△':'○'} ${k} ${Math.round(sc*100)}% | ${ans} | miss:${words.filter(w=>!before.includes(w)).join(',')}`);}
  start=i;});
 console.log(`=== ${f} avg ${Math.round(100*tot/cnt)}% (${cnt}q)`);if(process.env.V)console.log(out.join('\n'));}
