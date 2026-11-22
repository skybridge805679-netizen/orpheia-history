// 웹판을 헤드리스 크롬에 띄워, 실행기가 해석한 대본·표·문제 데이터를 JSON으로 뽑는다(PS Vita 포팅용).
//   node tools/vita-dump.cjs 출력.json
// 웹판 vn.js 의 파서·표를 그대로 쓰므로 비타판과 해석이 어긋나지 않는다. tools/export-vita.py 가 부른다.
const { chromium } = require('playwright');
const { writeFileSync } = require('fs');
const { resolve } = require('path');
const { pathToFileURL } = require('url');
(async () => {
const out = process.argv[2] || 'vita-dump.json';
const b = await chromium.launch();
const p = await b.newPage();
await p.route(/^https?:/, r => r.abort());           // 학습 사이트 등 바깥 요청은 막는다
await p.goto(pathToFileURL(resolve('index.html')).href, { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => typeof VN !== 'undefined' && VN._export && VN.chapters.length > 20, null, { timeout: 30000 });
const data = await p.evaluate(() => ({
  ...VN._export(),
  QS: window.QS, EXPLAIN: window.QUESTION_EXPLANATIONS, FIGURES: window.QUESTION_FIGURES,
  HERITAGE: window.HERITAGE, MUK_SKINS: window.MUK_SKINS, SAYEON_SKINS: window.SAYEON_SKINS,
}));
await b.close();
writeFileSync(out, JSON.stringify(data));
console.log(`장 ${data.chapters.length}, op ${data.chapters.reduce((a, c) => a + c.ops.length, 0)}, 문항 ${data.QS.length} → ${out}`);
})();
