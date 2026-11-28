// 문항 원문·보기·정답·단서 보기: node tools/quiz-dump.js 73-5 자작-53 …
const fs=require('fs');global.window={};
eval(fs.readFileSync('data/qs.js','utf8'));eval(fs.readFileSync('data/explanations.js','utf8'));
try{eval(fs.readFileSync('data/predicted.js','utf8'));}catch(e){}
const QS=window.QS; const EX=window.QUESTION_EXPLANATIONS;
const PR=window.PREDICTED||window.PRED||[];
const keys=process.argv.slice(2);
for(const k of keys){const [r0,n0]=k.split('-');const r=/^\d+$/.test(r0)?+r0:r0,n=+n0;
 let q=QS.find(x=>x.r===r&&x.n===n); if(!q&&Array.isArray(PR)) q=PR.find(x=>x.key===k||(x.r===r&&x.n===n));
 if(!q){console.log('##',k,'NOTFOUND');continue;}
 const e=EX[k]||{};
 console.log(`## ${k} [${q.era}/${q.topic}] ${q.q}\nCTX: ${(q.ctx||'').slice(0,600)}`);
 q.ch.forEach((c,i)=>console.log(`  ${i+1===q.a?'★':' '}${i+1}. ${c}`));
 console.log('CLUE:',(e.clues||[]).join(' / '));console.log('');}
