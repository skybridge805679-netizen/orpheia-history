#!/usr/bin/env node
// 전 장 자동 통독: 모든 본편 장·외전·종장 엔딩 갈래를 끝까지 눌러 보고, 막힌 곳·페이지 오류·없는 파일(404)을 모은다.
//   python3 -m http.server 8792   (다른 창에서)
//   node tools/playthrough-all.js                 # 전부
//   node tools/playthrough-all.js ch11 ch17       # 고른 장만 (종장 갈래는 ch24:hero_tsubaki 처럼)
//   옵션: --wrong(문제를 일부러 틀리며 진행) --pick=1(선택지 고르는 순서를 한 칸 밀기) --out=파일.json
// 문제는 기본으로 정답을 고른다(묵 배틀·히든 엔딩 갈래까지 가 보려고). 선택지는 만날 때마다 순서대로 돌려 가며 고른다.
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const args = process.argv.slice(2), opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
const WRONG = args.includes('--wrong'), PICK0 = +(opt('pick') || 0), OUT = opt('out');
const URL = 'http://localhost:8792/index.html';
const MAX_STEPS = 9000, STUCK = 90;

(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const pageErr = [], net = new Map(), conErr = [];
  page.on('pageerror', e => pageErr.push({ where: cur, msg: e.message }));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) conErr.push({ where: cur, msg: m.text().slice(0, 200) }); });
  page.on('response', r => { if (r.status() >= 400) { const u = decodeURIComponent(new URL(r.url()).pathname); if (!net.has(u)) net.set(u, cur); } });
  await page.addInitScript(() => { try { localStorage.setItem('orpheia-history-v1', JSON.stringify({ textSpeed: 0, endings: ['연표의 신부들'] })); } catch {} });
  await page.goto(URL); await page.waitForTimeout(1200);
  await page.mouse.click(640, 360); await page.waitForTimeout(800);   // 스플래시
  const all = await page.evaluate(() => ({ main: VN.chapters.map(c => c.id), ch24: Object.keys((VN.chapters.find(c => c.id === 'ch24') || {}).labels || {}) }));
  const sides = ['sp_aunt', 'sp_exorcist', 'sp_saebyeok'];
  let targets = args.filter(a => !a.startsWith('--'));
  if (!targets.length) targets = [...all.main, ...sides, ...all.ch24.filter(l => /^(hero_|end_)/.test(l)).map(l => 'ch24:' + l)];
  var cur = '';
  const report = [];
  let pickN = PICK0;
  for (const t of targets) {
    cur = t; const [id, label] = t.split(':');
    const t0 = Date.now();
    const res = await runOne(id, label);
    res.sec = Math.round((Date.now() - t0) / 1000); report.push({ target: t, ...res });
    console.log(`${t.padEnd(22)} ${res.end.padEnd(8)} 줄 ${String(res.steps).padStart(5)} · 문제 ${res.quizzes} · 선택 ${res.choices} · ${res.sec}s${res.note ? '  ← ' + res.note : ''}`); if (res.dbg) console.log('   ', JSON.stringify(res.dbg));
  }
  console.log(`\n페이지 오류 ${pageErr.length}`); pageErr.slice(0, 30).forEach(e => console.log(`  [${e.where}] ${e.msg}`));
  console.log(`콘솔 오류 ${conErr.length}`); conErr.slice(0, 30).forEach(e => console.log(`  [${e.where}] ${e.msg}`));
  console.log(`없는 파일(404) ${net.size}`); [...net].slice(0, 80).forEach(([u, w]) => console.log(`  [${w}] ${u}`));
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ report, pageErr, conErr, net: [...net] }, null, 1));
  await b.close();
  process.exit(pageErr.length || report.some(r => r.end === 'stuck') ? 1 : 0);

  async function runOne(id, label) {
    await page.evaluate(([id, label]) => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); const c = VN.chapters.find(c => c.id === id); VN._dev(id, label && c ? c.labels[label] : undefined); }, [id, label]);
    await page.waitForTimeout(250);
    let steps = 0, quizzes = 0, choices = 0, same = 0, lastKey = '', note = '';
    for (; steps < MAX_STEPS; steps++) {
      const st = await page.evaluate(() => {
        const s = VN._s(), card = document.querySelector('#vnCard:not([hidden])');
        return { ch: s && s.ch, pc: s && s.pc, text: (s && s.line && s.line.text || '').slice(0, 40), vn: !!document.querySelector('#vn'),
          titleBtn: !!(card && [...card.querySelectorAll('button')].some(x => /타이틀/.test(x.textContent))), dlg: document.querySelector('dialog[open]')?.id || '' };
      });
      if (!st.vn) return { end: 'title', steps, quizzes, choices };
      if (st.ch !== id) return { end: 'next', steps, quizzes, choices, note: `→ ${st.ch}` };
      if (st.titleBtn) return { end: 'end', steps, quizzes, choices };
      const key = `${st.pc}|${st.text}|${st.dlg}`;
      if (key === lastKey) { if (++same > STUCK) { if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT }); return { end: 'stuck', steps, quizzes, choices, note: `pc ${st.pc} 「${st.text}」 ${await opAt(id, st.pc)}`, dbg: await page.evaluate(() => ({ dlg: [...document.querySelectorAll('dialog[open]')].map(d => d.id + ':' + d.className), qz: document.querySelectorAll('.qz').length, at: document.elementFromPoint(640, 640)?.outerHTML.slice(0, 160) })) }; } } else { same = 0; lastKey = key; }
      // 선택지
      const ch = await page.$$('#vnChoices:not([hidden]) button');
      if (ch.length) { await ch[(pickN++) % ch.length].click({ force: true, timeout: 2000 }).catch(() => {}); choices++; await page.waitForTimeout(40); continue; }
      // 문제
      const qz = await page.$('.qz [data-c]:not([disabled])');
      if (qz && !(await page.$('.qz [data-next]'))) {
        const a = await page.evaluate(() => { const n = parseInt(document.querySelector('.qz-no')?.textContent), m = document.querySelector('.qz-meta')?.textContent || '', r = /예상/.test(m) ? 81 : parseInt((m.match(/제(\d+)회/) || [])[1]); const q = (window.QS || []).find(x => x.r === r && x.n === n); return q ? q.a : 0; });
        const pick = WRONG ? ((a % 5) + 1) : a;
        const btn = (pick && await page.$(`.qz [data-c="${pick}"]:not([disabled])`)) || qz;
        await btn.click({ force: true, timeout: 2000 }).catch(() => {}); await page.waitForTimeout(60); continue;
      }
      const qr = await page.$('.qz-result button'); if (qr) { await qr.click({ force: true, timeout: 2000 }).catch(() => {}); await page.waitForTimeout(120); continue; }
      const nx = await page.$('.qz [data-next]'); if (nx) { quizzes++; await nx.click({ force: true, timeout: 2000 }).catch(() => {}); await page.waitForTimeout(120); continue; }
      // 판서·기록부·안내 창의 닫기/다음
      const btn = await page.$('dialog[open] button:has-text("알겠어요"), button:visible:has-text("알겠어요"), dialog[open] [data-next], #vnCard:not([hidden]) button.primary:visible');
      if (btn) { await btn.click({ force: true, timeout: 2000 }).catch(() => {}); await page.waitForTimeout(80); continue; }
      if (st.dlg) { const c = await page.$('dialog[open] [data-close]'); if (c) await c.click({ force: true, timeout: 2000 }).catch(() => {}); else await page.keyboard.press('Escape'); await page.waitForTimeout(80); continue; }
      const x = await page.$('.vn-battle, .vn-next, .vn-vs, .vb-rank, .vn-hud');
      if (x) { await x.click({ force: true, timeout: 1500 }).catch(() => {}); await page.waitForTimeout(60); continue; }
      await page.mouse.click(640, 640); await page.waitForTimeout(25);
    }
    return { end: 'limit', steps, quizzes, choices };
  }
  async function opAt(id, pc) { return page.evaluate(([id, pc]) => { const c = VN.chapters.find(c => c.id === id); const o = c && c.ops[pc]; return o ? `@${o.t} ${(o.arg || o.text || '').slice(0, 40)}` : '(끝)'; }, [id, pc]); }
})();
