#!/usr/bin/env node
// 대본·데이터 점검(그림을 새로 그리지 않고 지킬 수 있는 것들). node tools/lint.js  → 오류가 있으면 종료 코드 1.
// 실행기(vn.js)의 parse 규칙을 그대로 따라 story/*.js 를 읽는다. 오류(E)는 실제로 깨지는 것, 경고(W)는 확인해 볼 것.
// 보는 것: JS 문법 · 문항(있는지·이야기 전체 한 번만) · @bg/@cutin 그림 · @show/[이름|표정] 인물·표정 그림 · 이름표 ·
//          라벨·점프·선택지·@if·@top 대상 · @bgm 곡 · @board 판서 · @photo 사진 · 묵/사연 의상 · 외전 @ending 금지 ·
//          화면 글의 만드는 쪽 말 · data/stands.js 최신 · CAST 스탠딩 파일.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const rel = p => path.join(ROOT, p);
const errs = [], warns = [];
const E = (w, m) => errs.push(`${w}  ${m}`), W = (w, m) => warns.push(`${w}  ${m}`);

// ── 1. JS 문법
const jsFiles = ['vn.js', 'core.js', 'quiz.js', 'bgm.js', 'sfx.js', 'minigame.js',
  ...fs.readdirSync(rel('story')).filter(f => f.endsWith('.js')).map(f => 'story/' + f),
  ...fs.readdirSync(rel('data')).filter(f => f.endsWith('.js')).map(f => 'data/' + f)];
for (const f of jsFiles) { try { cp.execFileSync(process.execPath, ['--check', rel(f)], { stdio: 'pipe' }); } catch (e) { E(f, '문법 오류: ' + String(e.stderr).split('\n').slice(0, 4).join(' / ')); } }

// ── 2. 실행기 표(CAST·ALIAS …)를 vn.js에서 꺼낸다(대괄호·중괄호 짝 맞추기)
const VN = fs.readFileSync(rel('vn.js'), 'utf8');
function grab(name) {
  const i = VN.indexOf(`const ${name}=`); if (i < 0) return null;
  let j = VN.indexOf('=', i) + 1, depth = 0, str = null;
  for (let k = j; k < VN.length; k++) {
    const c = VN[k];
    if (str) { if (c === '\\') { k++; continue; } if (c === str) str = null; continue; }
    if (c === "'" || c === '"' || c === '`') { str = c; continue; }
    if ('{[('.includes(c)) depth++; else if ('}])'.includes(c)) depth--;
    else if ((c === ';' || c === '\n') && depth === 0) return VN.slice(j, k);
  }
}
const ctx = vm.createContext({ orpHanbok: () => false });
const T = n => { const s = grab(n); return s == null ? null : vm.runInContext(`(${s})`, ctx); };
const CAST = T('CAST'), ALIAS = T('ALIAS'), MOB_BY_NAME = T('MOB_BY_NAME') || {}, CUTIN = T('CUTIN') || {}, CUTIN_ALL = T('CUTIN_ALL') || {};
const HOME_IDS = (VN.match(/const HOME_IDS='([^']+)'/) || [, ''])[1].split(' ');
const COSTUME = T('COSTUME') || {}; HOME_IDS.forEach(id => { (COSTUME[id] || (COSTUME[id] = new Set())).add('home'); });
for (const m of VN.matchAll(/COSTUME\.(\w+)\.add\('(\w+)'\)/g)) (COSTUME[m[1]] || (COSTUME[m[1]] = new Set())).add(m[2]);
const COSTUME_EXPR = T('COSTUME_EXPR') || {};
const NAMES = new Set(Object.values(CAST).map(c => c.name));

// ── 3. 데이터
const W_ = {}; const load = f => vm.runInNewContext(fs.readFileSync(rel(f), 'utf8'), { window: W_, console });
['data/qs.js', 'data/predicted.js', 'data/muk-skins.js', 'data/sayeon-skins.js', 'data/heritage.js', 'data/figures.js', 'data/profiles.js', 'data/stands.js'].forEach(f => { try { load(f); } catch (e) { E(f, '읽기 실패 ' + e.message); } });
fs.readdirSync(rel('data/core-notes')).forEach(f => load('data/core-notes/' + f));
const QKEYS = new Set((W_.QS || []).map(q => `${q.r}-${q.n}`));
const NOTES = new Set((W_.CORE_NOTES || []).map(n => n.id));
const ASSETS = new Set(fs.readdirSync(rel('assets')).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5)));
const NAI_PENDING = new Set(); try { const nai = JSON.parse(fs.readFileSync(rel('tools/nai-assets.json'), 'utf8')); for (const it of nai.items || []) if (it.id) NAI_PENDING.add(it.id); } catch (_) {}
const BGMS = new Set(fs.readdirSync(rel('assets/bgm')).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)));
const FIGNAMES = new Set(); for (const v of Object.values(W_.QUESTION_FIGURES || {})) for (const c of v.choices || []) if (c.nameStatus === 'identified') FIGNAMES.add(c.name);
const photoOk = n => { const H = W_.HERITAGE || {}; if (H[n] || FIGNAMES.has(n)) return true; for (const k of [...FIGNAMES, ...Object.keys(H)]) if (k.includes(n) || n.includes(k)) return true; return false; };

// ── 4. 대본 읽기(vn.js parse와 같은 규칙)
const chapters = [];
const VNstub = { chapter: (id, title, sub, src, opt) => chapters.push({ id, title, sub, src, file: cur, side: id.startsWith('sp_') }) };
let cur = '';
for (const f of fs.readdirSync(rel('story')).filter(f => f.endsWith('.js')).sort()) { cur = 'story/' + f; try { vm.runInNewContext(fs.readFileSync(rel(cur), 'utf8'), { VN: VNstub, window: {} }); } catch (e) { E(cur, '불러오기 실패 ' + e.message); } }
function parse(c) {
  const ops = []; let choice = null, styleOff = false;
  c.src.split('\n').forEach((raw, n) => {
    const line = raw.trim(), at = `${c.file}:${n + 2}`;   // 파일의 첫 줄이 VN.chapter(…`
    if (/^\/\/ 문체 예외 시작/.test(line)) styleOff = true; if (/^\/\/ 문체 예외 끝/.test(line)) styleOff = false;
    if (!line || line.startsWith('//')) { choice = null; return; }
    if (line.startsWith('>') && choice) { const m = line.match(/^>\s*(.+?)\s*->\s*(\S+)(?:\s*\{(.+)\})?$/); if (!m) return E(at, '선택지 형식'); choice.opts.push({ label: m[2], set: m[3] || '', at }); return; }
    choice = null;
    if (line.startsWith('@')) {
      const [cmd, ...rest] = line.slice(1).split(/\s+/), arg = rest.join(' ');
      if (cmd === 'choice') { choice = { t: 'choice', opts: [], at }; ops.push(choice); }
      else if (cmd === 'show') { const [who, expr = 'neutral'] = rest; ops.push({ t: 'show', who: ALIAS[who] || who, expr, at }); }
      else if (cmd === 'if') { const m = arg.match(/^(\w+)\s*(>=|<=|==|>|<)?\s*(-?\d+)?\s*->\s*(\S+)$/); if (!m) E(at, '@if 형식'); else ops.push({ t: 'if', label: m[4], at }); }
      else if (cmd === 'top') { const m = arg.match(/^(.+?)\s*->\s*(\S+)$/); if (!m) E(at, '@top 형식'); else ops.push({ t: 'top', flags: m[1].trim().split(/\s+/), prefix: m[2], at }); }
      else ops.push({ t: cmd, arg, at });
      return;
    }
    const m = line.match(/^\[([^\]|]+)(?:\|(\w+))?\]\s*(.*)$/);
    if (m) ops.push({ t: 'say', name: m[1].trim(), who: ALIAS[m[1].trim()] || m[1].trim(), expr: m[2] || '', text: m[3], at });
    else ops.push({ t: 'narr', text: line, at, styleOff });
  });
  return ops;
}

// ── 5. 점검
const SPECIAL_SPEAKERS = new Set(['먹물', '댓글', '나', '??', '???', '악귀', '책 속 목소리']);   // 실루엣 없이 말하는 자리(먹물 계정·팬 댓글·1인칭·보이지 않는 목소리)
const META = /히로인|CG\b|엔딩|컷인|히든|러브코미디|배틀 규칙|주인님 지정|[0-9]단계|이 장의|이번 장|(?<![제0-9])[0-9]{1,2}장(?=[에의은이엔을까부때,·\s)]|$)/;   // 「3장에서 본」 같은 장 번호 회상도 만드는 쪽 말
const standFile = (who, expr) => { const s = CAST[who]?.stand || {}; return s[expr] || null; };
const quizSeen = new Map();
for (const c of chapters) {
  const ops = parse(c), labels = new Map();
  ops.forEach(o => { if (o.t === 'label') { if (labels.has(o.arg)) E(o.at, `라벨 중복: ${o.arg}`); labels.set(o.arg, o.at); } });
  const need = (lab, at) => { if (!labels.has(lab)) E(at, `없는 라벨로 이동: ${lab}`); };
  for (const o of ops) {
    switch (o.t) {
      case 'jump': need(o.arg.trim(), o.at); break;
      case 'if': need(o.label, o.at); break;
      case 'choice': if (!o.opts.length) E(o.at, '선택지가 비었다'); o.opts.forEach(x => { need(x.label, x.at); if (x.set && !/^(\s*\w+\s*[+\-=]\s*-?\d+\s*,?)+$/.test(x.set)) W(x.at, `선택지 플래그 형식 {${x.set}}`); }); break;
      case 'top': o.flags.forEach(f => need(o.prefix + f, o.at)); break;
      case 'quiz': for (const k of o.arg.split(/\s+/).filter(Boolean)) { if (!QKEYS.has(k)) E(o.at, `없는 문항 ${k}`); if (quizSeen.has(k)) E(o.at, `문항 ${k} 두 번 출제(먼저: ${quizSeen.get(k)})`); else quizSeen.set(k, o.at); } break;
      case 'bg': { const [a, b] = o.arg.split('|').map(x => x.trim()); if (a === 'off') break;
        if (!ASSETS.has(a)) { if (b && ASSETS.has(b)) W(o.at, `아직 없는 그림 ${a} → 대체 ${b}`); else E(o.at, `없는 배경 ${a}${b ? ' (대체 ' + b + '도 없음)' : ''}`); } break; }
      case 'cutin': { const a = o.arg.trim(); if (a === 'off') break; const ks = CUTIN_ALL[a] || (CUTIN[a] ? [CUTIN[a]()] : [a]); ks.forEach(k => { if (!ASSETS.has(k)) E(o.at, `없는 컷인 그림 ${k}`); }); break; }
      case 'bgm': { const a = o.arg.trim(); if (!['auto', 'off', ''].includes(a) && !BGMS.has(a)) E(o.at, `없는 곡 ${a}`); break; }
      case 'board': o.arg.split(/\s+/).filter(Boolean).forEach(id => { if (!NOTES.has(id)) E(o.at, `없는 판서 ${id}`); }); break;
      case 'photo': { const n = o.arg.split('|')[0].trim(); if (n !== 'off' && !photoOk(n)) E(o.at, `사진을 찾을 수 없음: ${n}`); break; }
      case 'battle': { const sk = /^muk\b/.test(o.arg) ? (o.arg.match(/(?:^|\s)skin=(\S+)/) || [])[1] : null, ak = (o.arg.match(/askin=(\S+)/) || [])[1];
        if (sk && !(W_.MUK_SKINS || {})[sk]) E(o.at, `없는 묵 의상 ${sk}`); if (ak && !(W_.SAYEON_SKINS || {})[ak]) E(o.at, `없는 사연 의상 ${ak}`); break; }
      case 'ending': if (c.side) E(o.at, '외전에는 @ending을 쓰지 않는다(엔딩 수가 바뀜)'); break;
      case 'show': { if (!CAST[o.who]) { E(o.at, `CAST에 없는 인물 @show ${o.who}`); break; }
        const [c0, e0] = o.expr.includes('+') ? o.expr.split('+') : [null, o.expr];
        if (c0 && !COSTUME[o.who]?.has(c0)) E(o.at, `${o.who}에게 없는 옷 ${c0}`);
        if (!c0 && !COSTUME[o.who]?.has(e0) && !standFile(o.who, e0) && e0 !== 'neutral') W(o.at, `${o.who}에게 없는 표정 ${e0}(기본 그림으로 나옴)`);
        if (c0 === 'home' && e0 === 'pregnant' && !ASSETS.has(`st_${o.who}_home_pregnant`)) { if (NAI_PENDING.has(`st_${o.who}_home_pregnant`)) W(o.at, `생성 대기 그림 st_${o.who}_home_pregnant`); else E(o.at, `없는 그림 st_${o.who}_home_pregnant`); }
        break; }
      case 'say': {
        if (!CAST[o.who] && !NAMES.has(o.name) && !MOB_BY_NAME[o.name] && !SPECIAL_SPEAKERS.has(o.name)) W(o.at, `모브 원형이 없는 이름표 [${o.name}](실루엣 없이 말함)`);
        if (o.expr && CAST[o.who] && !standFile(o.who, o.expr) && !COSTUME_EXPR[o.who]?.has(o.expr) && !/^(d|g)\d$/.test(o.expr)) W(o.at, `[${o.name}|${o.expr}] — ${o.who}에게 없는 표정(무시됨)`);
        if (META.test(o.text)) W(o.at, `화면 글에 만드는 쪽 말: ${o.text.slice(0, 40)}`); break; }
      case 'narr': if (!c.side && !o.styleOff) { const plain = o.text.replace(/「[^」]*」|"[^"]*"/g, '').trim(), ss = plain.split(/(?<=[.!?…])\s+/).filter(Boolean), shortN = ss.filter(x => x.replace(/[「」『』…\s]/g, '').length <= 7).length;
          if (ss.length >= 3 && shortN >= 2) W(o.at, `서술 문체: 짧은 문장 연타 — ${o.text.slice(0, 40)}`);
          if (/(둘|셋|넷) 다, /.test(o.text) || /(\S+)이다\. \1\./.test(o.text)) W(o.at, `서술 문체: 대구·되풀이 정리문 — ${o.text.slice(0, 40)}`);
          if (/^노래가 흐른다\.|^먹물이 번진다\. 그런데 이번엔/.test(o.text)) W(o.at, `서술 문체: 장마다 돌려쓰는 틀 — ${o.text.slice(0, 40)}`); }
        if (/\s@(sfx|bg|bgm|show|hide|fx|cutin|wait|day)\b/.test(o.text)) E(o.at, `연출 명령이 서술 줄에 붙어 글자로 찍힘: ${o.text.slice(-30)}`);
        if (META.test(o.text)) W(o.at, `화면 글에 만드는 쪽 말: ${o.text.slice(0, 40)}`); break;
    }
  }
}
// 장 사이 이동(@jump 가 다른 장 라벨이면 위에서 오류가 나므로, 그건 vn.js finishChapter(next)로만 한다)

// ── 6. CAST 스탠딩 파일, stands.js 최신, NAI 프롬프트 규칙(tools/nai-rules.json) 점검
for (const [id, c] of Object.entries(CAST)) for (const [e, f] of Object.entries(c.stand || {})) if (f) { const stem = f.replace(/\.webp$/, ''); if (!ASSETS.has(stem)) { if (NAI_PENDING.has(stem)) W('vn.js CAST', `${id}.${e} → 생성 대기 그림 ${f}`); else E('vn.js CAST', `${id}.${e} → 없는 그림 ${f}`); } }
try { const before = fs.readFileSync(rel('data/stands.js'), 'utf8'); const out = cp.execFileSync('python3', ['-c', `
import re,json,sys
from pathlib import Path
R=Path(sys.argv[1]);ids=sorted(set(re.findall(r"\\{id:'([a-z_]+)'",(R/'data/profiles.js').read_text())),key=len,reverse=True);o={}
for f in sorted((R/'assets').glob('st_*.webp')):
  n=f.stem
  for i in ids:
    if n==f'st_{i}' or n.startswith(f'st_{i}_'):o.setdefault(i,[]).append(n);break
print(json.dumps(o,ensure_ascii=False,separators=(',',':')))`, ROOT]).toString().trim();
  if (!before.includes(out)) E('data/stands.js', '스탠딩 목록이 오래됨 → python3 tools/stand_index.py'); } catch (e) { W('data/stands.js', '점검 못 함 ' + e.message); }
try {
  const rules = JSON.parse(fs.readFileSync(rel('tools/nai-rules.json'), 'utf8'));
  const naiLog = JSON.parse(fs.readFileSync(rel('tools/nai-log.json'), 'utf8'));
  const naiAssets = JSON.parse(fs.readFileSync(rel('tools/nai-assets.json'), 'utf8'));
  const bmap = rules.character_breast_map || {};
  const badRe = (rules.forbidden_patterns || []).map(p => new RegExp(p, 'i'));
  const aliasRe = Object.keys(rules.tag_replacements || {}).map(k => [k, new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')]);
  const tierOf = b => b <= 78 ? 'flat chest' : b <= 82 ? 'small breasts' : b <= 88 ? 'medium breasts' : b <= 93 ? 'large breasts' : 'huge breasts';
  for (const p of W_.PROFILES || []) {
    if (!p.bwh || !bmap[p.id]) continue;
    const b = parseInt(p.bwh.split('·')[0].trim(), 10);
    if (!isNaN(b) && bmap[p.id] !== tierOf(b)) E('tools/nai-rules.json', `${p.id} 바스트(${b}) 구간은 '${tierOf(b)}'이어야 하는데 '${bmap[p.id]}'로 적힘`);
  }
  const checkPrompt = (where, txt, cast) => {
    if (!txt) return;
    const posOnly = txt.replace(/-?\d+(?:\.\d+)?::[^:]+::/g, '');
    for (const r of badRe) { const m = posOnly.match(r); if (m) E(where, `금지된 나이·비표준 프롬프트 '${m[0]}' (tools/nai-rules.json)`); }
    for (const [k, r] of aliasRe) if (r.test(posOnly)) E(where, `단부루 비표준 태그 '${k}' → '${rules.tag_replacements[k]}'로 바꿀 것`);
    if (cast && bmap[cast]) {
      const tiers = posOnly.match(/\b(flat chest|small breasts|medium breasts|large breasts|huge breasts)\b/g) || [];
      if (!tiers.includes(bmap[cast])) E(where, `${cast} 가슴 크기 태그 '${bmap[cast]}' 누락`);
      const wrong = tiers.find(t => t !== bmap[cast]);
      if (wrong) E(where, `${cast} 가슴 크기 태그 충돌: '${wrong}' (기준: '${bmap[cast]}')`);
    }
  };
  for (const [cid, entry] of Object.entries(naiLog)) {
    if (typeof entry === 'string') {
      checkPrompt(`tools/nai-log.json (${cid})`, entry, cid);
    } else if (entry && typeof entry === 'object') {
      checkPrompt(`tools/nai-log.json (${cid}.looks)`, entry.looks, cid);
      if (bmap[cid] && entry.breast_tier !== bmap[cid]) E(`tools/nai-log.json (${cid})`, `breast_tier '${entry.breast_tier}' !== '${bmap[cid]}'`);
      if (!entry.seed) W(`tools/nai-log.json (${cid})`, '고유 seed 누락');
      for (const [ok, op] of Object.entries(entry.outfits || {})) checkPrompt(`tools/nai-log.json (${cid}.outfits.${ok})`, op, null);
    }
  }
  for (const it of naiAssets.items || []) {
    checkPrompt(`tools/nai-assets.json (${it.id})`, it.prompt, typeof it.cast === 'string' ? it.cast : null);
    for (const [ci, c] of (it.chars || []).entries()) checkPrompt(`tools/nai-assets.json (${it.id}#char${ci + 1})`, c.prompt, typeof c.cast === 'string' ? c.cast : null);
  }
} catch (e) { W('tools/nai-rules.json', '프롬프트 규칙 점검 실패: ' + e.message); }

// ── 7. 결과
const showW = process.argv.includes('-w') || process.argv.includes('--warn');
console.log(`대본 ${chapters.length}편 · 문항 ${quizSeen.size} / 기출·예상 ${QKEYS.size} · 그림 ${ASSETS.size}`);
const notUsed = [...QKEYS].filter(k => !k.startsWith('81-') && !quizSeen.has(k)); if (notUsed.length) W('기출', `이야기에 안 나온 기출 ${notUsed.length}개: ${notUsed.slice(0, 12).join(' ')}`);
if (errs.length) { console.log(`\n오류 ${errs.length}`); errs.forEach(x => console.log('  E ' + x)); }
const wsum = {}; warns.forEach(w => { const k = w.replace(/^.*?  /, '').replace(/[:\s].*$/, ''); wsum[k] = (wsum[k] || 0) + 1; });
console.log(`\n경고 ${warns.length}` + (showW ? '' : '  (자세히: node tools/lint.js -w)'));
if (showW) warns.forEach(x => console.log('  W ' + x)); else if (warns.length) console.log('  ' + Object.entries(wsum).map(([k, v]) => `${k} ×${v}`).join(' · '));
process.exit(errs.length ? 1 : 0);
