// 문제 지문(ctx)·보기(오답 포함)의 낱말이 그 문제 앞 대사(장 처음부터)에 나왔는지 거칠게 재기.
// node tools/choice-cover.js story/ch04-*.js   (V=1 이면 문항별, V=2 면 놓친 보기까지)
const fs=require('fs');global.window={};
for(const f of ['data/qs.js','data/explanations.js','data/predicted.js'])eval(fs.readFileSync(f,'utf8'));
const QS=window.QS;
const strip=w=>w.replace(/(으로|에서|에게|하였다|하였어요|했다|되었다|이었다|이다|였다|을|를|이|가|은|는|의|에|와|과|로|도|하여|한|들)$/,'');
const STOP=/^(있었|있었다|설치|하였|하였다|두었다|만들었다|사용|위하여|통해|대한|국가|시기|처음|크게|다음|자료|사실|모습|이후|이전|활동|설명|옳은|것은|나라|지방|중심|주장|실시|시행|편찬|결성|발표|조직|일으켰다|세웠다|물리쳤다|운동|사건|정부|단체|있다|벌였다|이끌었다)/;
const words=s=>[...new Set(String(s).replace(/<[^>]+>/g,' ').replace(/[.,()·『』「」\[\]"'?!:~/]/g,' ').split(/\s+/).map(strip).filter(w=>w.length>=2&&!STOP.test(w)&&!/^[0-9]+$/.test(w)&&!/^\(?[가-마]\)?$/.test(w)))];
const cov=(ws,t)=>ws.length?ws.filter(w=>t.includes(w)).length/ws.length:1;
let G={c:0,w:0,wn:0};
const ORDER=(fs.readFileSync('index.html','utf8').match(/story\/ch[^"]*\.js/g)||[]);
const prevText=f=>{const i=ORDER.indexOf(f);return i<0?'':ORDER.slice(0,i).map(x=>fs.readFileSync(x,'utf8')).join('\n')};
for(const f of process.argv.slice(2)){const lines=fs.readFileSync(f,'utf8').split('\n');const PREV=process.env.SELF?'':prevText(f);let C=0,Cn=0,W=0,Wn=0;const out=[];
 lines.forEach((l,i)=>{const m=l.match(/^@quiz\s+(.*)/);if(!m)return;const before=PREV+'\n'+lines.slice(0,i).filter(x=>!x.startsWith('//')).join('\n');
  for(const k of m[1].trim().split(/\s+/)){const [r,n]=k.split('-').map(Number);const q=QS.find(x=>x.r===r&&x.n===n);if(!q)continue;
   const c=cov(words(q.ctx),before);C+=c;Cn++;
   const miss=[];q.ch.forEach((o,j)=>{if(j===q.a-1)return;if(/^\(?[가-마]\)/.test(o))return;const s=cov(words(o),before);W+=s>=0.5?1:0;Wn++;if(s<0.5)miss.push(o);});
   out.push(`${k} ctx ${Math.round(c*100)}% | 오답 놓침 ${miss.length}`+(process.env.V==2&&miss.length?'\n    - '+miss.join('\n    - '):''));}});
 G.c+=C;G.w+=W;G.wn+=Wn;
 console.log(`=== ${f.replace('story/','')} 지문 ${Math.round(100*C/Cn)}% · 오답 보기 ${W}/${Wn} (${Math.round(100*W/Wn)}%)`);if(process.env.V)console.log(out.join('\n'));}
