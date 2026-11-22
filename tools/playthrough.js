// 장 하나 자동 통독(판서·보기·다음을 눌러 끝까지): python3 -m http.server 8792 뒤 node tools/playthrough.js ch04 1200
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8792/index.html');await p.waitForTimeout(1500);
await p.evaluate(id=>VN._dev(id),process.argv[2]);await p.waitForTimeout(500);
let quizzes=0,last='';
for(let i=0;i<Number(process.argv[3]||400);i++){
  const st=await p.evaluate(()=>{const s=VN._s();return {pc:s.pc,who:document.querySelector('.vn-name')?.textContent||'',quiz:!!document.querySelector('.quiz, .qz, #quiz, [class*=quiz]:not(.vn)')}});
  // choices
  const ch=await p.$('#vnChoices:not([hidden]) button');
  if(ch){await ch.click({force:true,timeout:2000}).catch(()=>{});await p.waitForTimeout(80);continue;}
  const vis=async sel=>{const l=p.locator(sel.split(",").map(x=>x+":visible").join(",")).first();return (await l.count())?l:null};
  let e;
  if(e=await vis('button:has-text("알겠어요")')){await e.click({force:true,timeout:2000}).catch(()=>{});await p.waitForTimeout(120);continue;}
  if(e=await vis('[data-next],[data-back]')){await e.click({force:true,timeout:2000}).catch(()=>{});await p.waitForTimeout(150);continue;}
  if(e=await vis('[data-c]')){quizzes++;for(const c of await p.$$('[data-c]')){if(await vis('[data-next]'))break;await c.click({force:true,timeout:1500}).catch(()=>{});await p.waitForTimeout(120);}continue;}
  await p.mouse.click(640,600);await p.waitForTimeout(60);
  if(i%50==0){const s=await p.evaluate(()=>VN._s().pc);if(s===last&&i>0){console.log('stuck at',s);}last=s;}
}
const s=await p.evaluate(()=>({pc:VN._s().pc,ch:VN._s().ch||VN._s().chapter}));
console.log(JSON.stringify(s),'quizClicks',quizzes);console.log('errs',errs.slice(0,8));
await p.screenshot({path:process.env.SHOT||'/tmp/claude-0/-home-user-orpheia-history/c2e0771f-edaa-50db-b87c-4c8288b468a4/scratchpad/s.png'});await b.close();})();
