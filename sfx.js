'use strict';
// Sound effects synthesised with the Web Audio API — no files. SFX.play(name) from code or "@sfx name" in scripts.
const SFX=(()=>{
 const KEY='orpheia-sfx-v1';
 let set={volume:.6,muted:false};
 try{Object.assign(set,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{}
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(set));}catch{}};
 let ctx=null,master=null,noiseBuf=null;
 function init(){
  if(ctx)return ctx.state==='suspended'?ctx.resume():null;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  ctx=new AC();master=ctx.createGain();master.gain.value=set.muted?0:set.volume;master.connect(ctx.destination);
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 }
 for(const ev of ['pointerdown','keydown'])document.addEventListener(ev,init,{capture:true});
 // Building blocks: a shaped tone and a filtered noise burst.
 function tone(f,t0,dur,{type='sine',vol=.3,to=null,attack=.005,release=null}={}){
  const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+t0;
  o.type=type;o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+(release??dur));
  o.connect(g).connect(master);o.start(t);o.stop(t+(release??dur)+.05);
 }
 function noise(t0,dur,{vol=.2,freq=1800,q=.8,type='bandpass',sweep=null}={}){
  const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(),t=ctx.currentTime+t0;
  s.buffer=noiseBuf;f.type=type;f.frequency.setValueAtTime(freq,t);if(sweep)f.frequency.exponentialRampToValueAtTime(sweep,t+dur);f.Q.value=q;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f).connect(g).connect(master);s.start(t,Math.random()*.5);s.stop(t+dur+.05);
 }
 const SOUNDS={
  // UI
  select:()=>tone(1320,0,.06,{type:'triangle',vol:.12}),
  confirm:()=>{tone(880,0,.08,{type:'triangle',vol:.16});tone(1320,.06,.12,{type:'triangle',vol:.14});},
  save:()=>{[1047,1319,1568].forEach((f,i)=>tone(f,i*.07,.25,{type:'sine',vol:.14}));},
  card:()=>{noise(0,.6,{vol:.12,freq:400,sweep:2400,q:.6});tone(220,0,.6,{type:'sine',vol:.08,to:440});},
  // Story
  alarm:()=>{for(let i=0;i<3;i++){tone(988,i*.42,.18,{type:'square',vol:.09});tone(740,i*.42+.2,.18,{type:'square',vol:.09});}},
  stamp:()=>{tone(90,0,.25,{type:'sine',vol:.5,to:45});noise(0,.12,{vol:.35,freq:600,type:'lowpass'});},
  phone:()=>{tone(400,0,.12,{type:'sine',vol:.25,to:1400});tone(1760,.11,.1,{type:'sine',vol:.12});},
  flash:()=>{[2093,2637,3136,3951].forEach((f,i)=>tone(f,i*.04,.4,{type:'sine',vol:.05}));},
  // Radio and dispatch
  radio:()=>{noise(0,.18,{vol:.18,freq:2200,q:1.2});tone(1450,.16,.09,{type:'sine',vol:.12});},
  transmit:()=>{tone(1200,0,.07,{type:'square',vol:.06});tone(1600,.08,.07,{type:'square',vol:.06});},
  correct:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,i*.08,.35,{type:'triangle',vol:.13}));},
  wrong:()=>{tone(196,0,.45,{type:'sawtooth',vol:.12,to:130});tone(185,.02,.45,{type:'sawtooth',vol:.08,to:123});},
  rewind:()=>{tone(300,0,.7,{type:'sine',vol:.18,to:1800});noise(0,.7,{vol:.12,freq:3000,sweep:300,q:1});[1568,1319,1047].forEach((f,i)=>tone(f,.5+i*.06,.2,{type:'sine',vol:.08}));},
  clear:()=>{[523,659,784,1047,1319].forEach((f,i)=>tone(f,i*.09,.5,{type:'triangle',vol:.12}));tone(1568,.5,.9,{type:'sine',vol:.08});},
  // 묵 배틀
  vb_start:()=>{tone(55,0,1.4,{type:'sine',vol:.55,to:40});noise(0,.9,{vol:.3,freq:180,type:'lowpass'});[110,165,220].forEach(f=>tone(f,0,1.6,{type:'sawtooth',vol:.04}));noise(.15,1.1,{vol:.12,freq:400,sweep:6000,q:.7});[0,.18,.36].forEach((t,i)=>{tone(70,t+.9,.22,{type:'sine',vol:.5,to:40});noise(t+.9,.12,{vol:.25,freq:300,type:'lowpass'});});},
  vb_go:()=>{noise(0,.25,{vol:.25,freq:900,sweep:5000,q:1.2});tone(660,0,.12,{type:'square',vol:.07});tone(990,.08,.2,{type:'square',vol:.07});},
  vb_break:()=>{noise(0,.18,{vol:.45,freq:7000,sweep:1200,q:1.5,type:'bandpass'});tone(90,0,.35,{type:'sine',vol:.6,to:40});[2637,3520,4186].forEach((f,i)=>tone(f,.03+i*.01,.6,{type:'triangle',vol:.05}));},
  vb_rip:()=>{for(let i=0;i<7;i++)noise(i*.035,.05,{vol:.25-i*.02,freq:2500+i*300,q:3,type:'bandpass'});noise(.25,.2,{vol:.1,freq:5000,type:'highpass'});},
  vb_finish:()=>{tone(45,0,1.2,{type:'sine',vol:.7,to:30});noise(0,.5,{vol:.5,freq:250,type:'lowpass'});noise(0,.3,{vol:.4,freq:8000,sweep:900,q:1.2});[523,784,1047,1568,2093].forEach((f,i)=>tone(f,.35+i*.07,1.2,{type:'triangle',vol:.06}));},
  vb_ink:()=>{tone(150,0,.3,{type:'sine',vol:.35,to:60});noise(0,.25,{vol:.3,freq:500,type:'lowpass'});for(let i=0;i<5;i++)tone(300+Math.random()*500,.1+i*.06,.08,{type:'sine',vol:.08,to:900});tone(233,.15,.5,{type:'sawtooth',vol:.05,to:110});},
  vb_combo:()=>{[1175,1568,2093].forEach((f,i)=>tone(f,i*.05,.18,{type:'square',vol:.05}));},
  vb_purify:()=>{[1047,1319,1568,2093,2637].forEach((f,i)=>tone(f,i*.12,1.6,{type:'sine',vol:.06}));noise(0,1.4,{vol:.04,freq:6000,type:'highpass'});},
  vb_bell:()=>{[220,330,440].forEach((f,i)=>tone(f,0,3.2,{type:'sine',vol:.12/(i+1)}));tone(659,.02,2.6,{type:'sine',vol:.03});},
  vb_ko:()=>{tone(50,0,1.4,{type:'sine',vol:.6,to:35});[392,523,659,784,1047].forEach((f,i)=>tone(f,.2+i*.1,1.4,{type:'triangle',vol:.08}));tone(1568,.8,2,{type:'sine',vol:.05});},
  vb_glitch:()=>{for(let i=0;i<9;i++){tone(200+Math.random()*1800,i*.045,.04,{type:'square',vol:.07});}noise(0,.5,{vol:.2,freq:3500,q:4,sweep:600});tone(880,.42,.25,{type:'square',vol:.06,to:110});tone(60,0,.3,{type:'sawtooth',vol:.15,to:30});},
  vb_end:()=>{[392,494,587].forEach((f,i)=>tone(f,i*.1,.6,{type:'triangle',vol:.09}));},
 };
 // Text blips ("뽁뽁뽁"): each speaker has a voice pitch; spaces and punctuation stay silent,
 // narration is softer; only every other character sounds so fast text does not turn into a buzz.
 const VOICE={orpheia:[880,'triangle'],harin:[700,'square'],instructor:[330,'triangle'],jian:[560,'sine'],sangcheol:[440,'square'],other:[520,'triangle'],narration:[620,'sine',.035]};
 let blipN=0,lastBlip=0;
 function blip(who,ch){
  if(set.muted||set.blip===false||!ctx||ctx.state!=='running')return;
  if(!ch||/[\s.,!?…~·\-—"“”'()「」\[\]]/.test(ch))return;
  const now=performance.now();if(now-lastBlip<38||(blipN++%2))return;lastBlip=now;
  const [f,type,vol=.07]=VOICE[who]||VOICE.other;
  tone(f*(.94+Math.random()*.12),0,.045,{type,vol,attack:.002});
 }
 function setBlip(on){set.blip=on;persist();}
 function play(name){if(set.muted||!ctx||ctx.state!=='running'||!SOUNDS[name])return;try{SOUNDS[name]();}catch{}}
 function setVolume(v){set.volume=v;persist();if(master)master.gain.value=set.muted?0:v;}
 function setMuted(m){set.muted=m;persist();if(master)master.gain.value=m?0:set.volume;}
 return {blip,setBlip,play,setVolume,setMuted,settings:()=>({...set}),names:Object.keys(SOUNDS)};
})();
