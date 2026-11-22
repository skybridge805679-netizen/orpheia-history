"""예상 문제 자료 그림(HTML 템플릿 → Playwright 렌더 → WebP). tools/predicted.py 가 부른다."""
import html, json, subprocess, tempfile, os
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "tools/fonts"
SITE = ROOT.parent / "korean-history-study/site"
E = html.escape

_H=None
def heritage_src(name):
    """heritage.js 의 이름 → src 경로"""
    global _H
    if _H is None:
        t=(ROOT/"data/heritage.js").read_text(encoding="utf-8"); _H=json.loads(t[t.index("{"):t.rindex("}")+1])
    if name not in _H: raise KeyError(f"heritage.js 에 없는 문화유산: {name}")
    return _H[name]["src"]
def photo(src):
    """heritage 경로 또는 heritage.js 이름 → file:// 주소"""
    if "/" not in src: src=heritage_src(src)  # heritage.js 이름이면 경로로, "choice-art/…" 같은 학습 사이트 경로는 그대로
    for base in (ROOT / "assets", SITE):
        p = base / src
        if p.exists(): return p.as_uri()
    raise FileNotFoundError(src)

CSS = f"""
@font-face{{font-family:B;src:url({(FONTS/'GowunBatang-Bold.ttf').as_uri()})}}
@font-face{{font-family:D;src:url({(FONTS/'GowunDodum-Regular.ttf').as_uri()})}}
@font-face{{font-family:H;src:url({(FONTS/'NotoSerifKR.ttf').as_uri()})}}
*{{box-sizing:border-box}}body{{margin:0;background:#fff;font-family:D,sans-serif;color:#1d1a16}}
#f{{width:960px;padding:14px;display:inline-block}}
.saryo{{background:#eef3dc;border:2px solid #9fbd75;padding:22px 28px;font:21px/1.95 B,H,serif;margin-bottom:12px;white-space:pre-wrap}}
.saryo .src{{text-align:right;font-size:18px;margin-top:6px}}
.lab{{display:inline-block;font:bold 20px B,serif;margin-right:6px}}
.blank{{display:inline-block;min-width:68px;border:2px solid #333;padding:0 10px;text-align:center;font-family:B,serif;background:#fff;line-height:1.4}}
.win{{border:2px solid #8a8a8a;border-radius:6px;overflow:hidden;background:#fff}}
.win .bar{{background:#eceff3;padding:8px 12px;font-size:14px;color:#666;display:flex;gap:10px;align-items:center;border-bottom:1px solid #ccc}}
.win .bar i{{width:12px;height:12px;border-radius:50%;background:#d0d4da;display:inline-block}}
.win .url{{flex:1;background:#fff;border:1px solid #ccc;border-radius:12px;height:22px}}
.win .in{{padding:18px 22px}}
.head{{background:#e4e3f5;padding:14px 18px;border-radius:4px;font-size:19px;line-height:1.7;margin-bottom:12px}}
.head b{{font-size:21px;display:block;margin-bottom:4px}}
table{{border-collapse:collapse;width:100%;font-size:19px}}td,th{{border:1px solid #9a9a9a;padding:10px 12px;vertical-align:middle;line-height:1.6}}
th{{background:#f1e3ee;font-weight:bold}}
.ai .u{{margin-left:auto;background:#e8f1f7;border-radius:16px;padding:10px 16px;width:max-content;max-width:70%;font-size:19px;margin-bottom:12px}}
.ai .a{{background:#f6ece0;border-radius:12px;padding:16px 20px;font-size:19px;line-height:1.75;display:flex;gap:14px}}
.ai .bot{{flex:0 0 46px;height:34px;border-radius:9px;background:#2f8ea8;position:relative}}
.ai .bot:before,.ai .bot:after{{content:'';position:absolute;top:11px;width:10px;height:10px;border-radius:50%;background:#fff}}.ai .bot:before{{left:9px}}.ai .bot:after{{right:9px}}
.ai img.ph{{display:block;margin:0 0 12px auto;max-height:190px;border-radius:10px;border:6px solid #e3f0f5}}
.news{{border:3px double #222;padding:16px 22px;background:#fbf8f0}}
.news .mast{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #222;padding-bottom:6px;margin-bottom:12px}}
.news .mast b{{font:bold 34px B,serif}}.news .mast span{{font-size:15px}}
.news h3{{font:bold 25px B,serif;margin:4px 0 10px}}.news p{{font:19px/1.8 B,serif;margin:0;column-count:2;column-gap:28px}}
.news.one p{{column-count:1}}
.tl{{position:relative;padding:70px 20px 40px}}
.tl .line{{position:absolute;left:20px;right:20px;top:118px;height:4px;background:#333}}
.tl .row{{display:flex;justify-content:space-between;position:relative}}
.tl .ev{{text-align:center;width:150px;font-size:17px;line-height:1.4}}.tl .ev b{{display:block;font-size:19px}}
.tl .ev .dot{{width:16px;height:16px;border-radius:50%;background:#333;margin:12px auto 0}}
.tl .slot{{align-self:flex-end;margin-bottom:-26px;font:bold 21px B,serif;background:#fff;border:2px solid #333;padding:2px 10px}}
.plan table{{table-layout:fixed}}.plan th:nth-child(1){{width:90px}}.plan th:nth-child(2){{width:230px}}.plan th:nth-child(3){{width:190px}}
.plan .ph{{height:118px;width:170px;object-fit:cover;border:1px solid #999;display:block;margin:auto}}
.tl2{{margin:14px 6px 6px;font-size:17px}}.tlr{{display:grid;align-items:center;text-align:center}}
.tlc b{{display:block;font-size:19px}}.tlc span{{display:block;line-height:1.35;padding:0 2px;word-break:keep-all;font-size:15px}}
.tlr.line{{position:relative;height:30px}}.tlr.line:before{{content:'';position:absolute;left:0;right:0;top:13px;height:4px;background:#333}}
.tlc .d{{display:block;width:16px;height:16px;border-radius:50%;background:#333;margin:0 auto;position:relative}}
.tlc em{{font:bold 21px B,serif;font-style:normal;border:2px solid #333;padding:2px 10px;background:#fff;display:inline-block}}
.scene{{position:relative;width:932px;padding-top:var(--band,150px)}}.scene img.bg{{width:100%;display:block;border:1px solid #bbb}}
.bub{{position:absolute;background:#fff;border:2px solid #333;border-radius:18px;padding:12px 16px;font-size:18px;line-height:1.6;box-shadow:2px 3px 0 #0002}}
.bub:after{{content:'';position:absolute;width:18px;height:18px;background:#fff;border-right:2px solid #333;border-bottom:2px solid #333;bottom:-11px;transform:rotate(45deg)}}
.bub.l:after{{left:34px}}.bub.r:after{{right:34px}}
.bub .who{{font-weight:bold;color:#1d5c55;margin-right:6px}}
.verdict{{border:2px solid #222;padding:18px 24px;background:#fff;font:20px/1.9 B,serif}}.verdict h4{{text-align:center;font-size:26px;margin:0 0 8px;letter-spacing:.5em}}
.card{{border-radius:14px;padding:20px 24px;background:linear-gradient(#fdf3d9,#f6e3b4);border:2px solid #c9a25a}}.card h4{{margin:0 0 10px;font:bold 24px B,serif}}
.card ul{{margin:0;padding-left:22px;font-size:19px;line-height:1.85}}
.cap{{font-size:15px;color:#555;text-align:center;margin-top:6px}}
.photos{{display:flex;gap:12px;justify-content:center}}.photos figure{{margin:0;text-align:center;font-size:16px}}.photos img{{height:200px;max-width:300px;object-fit:cover;border:1px solid #999}}
.frame{{display:flex;gap:18px;align-items:flex-end;width:932px}}.frame .mat{{flex:1 1 auto;min-width:0}}.frame .mat>*:last-child{{margin-bottom:0}}
.frame .pres{{flex:0 0 290px;display:flex;flex-direction:column;gap:14px}}.frame .pres img{{width:290px;display:block;border:1px solid #bbb;border-radius:6px}}
.frame .pbub{{position:relative;background:#fff;border:2px solid #333;border-radius:18px;padding:12px 16px;font-size:18px;line-height:1.6;box-shadow:2px 3px 0 #0002}}
.frame .pbub:after{{content:'';position:absolute;width:18px;height:18px;background:#fff;border-right:2px solid #333;border-bottom:2px solid #333;bottom:-11px;left:120px;transform:rotate(45deg)}}
.bub .lab{{display:inline-block;font-weight:bold;color:#fff;background:#1d5c55;border-radius:6px;padding:0 8px;margin-right:6px}}
"""

def saryo(texts, src=None):
    out = ""
    for lab, t in texts:
        out += f'<div class="saryo">{f"<span class=lab>{E(lab)}</span>" if lab else ""}{t}{f"<div class=src>─ {E(src)} ─</div>" if src and lab==texts[-1][0] else ""}</div>'
    return out

def render(figs):
    """figs: {key: html} → assets/qfig/<key>.webp, 반환 {key:(w,h)}"""
    tmp = Path(tempfile.mkdtemp())
    for k, h in figs.items():
        (tmp / f"{k}.html").write_text(f"<!doctype html><meta charset=utf-8><style>{CSS}</style><div id=f>{h}</div>", encoding="utf-8")
    js = tmp / "r.js"
    js.write_text("""const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1000,height:800},deviceScaleFactor:1.5});const out={};
for(const f of fs.readdirSync(process.argv[2]).filter(f=>f.endsWith('.html'))){await p.goto('file://'+path.join(process.argv[2],f));await p.waitForTimeout(150);
 const el=await p.$('#f');const bb=await el.boundingBox();await el.screenshot({path:path.join(process.argv[2],f.replace('.html','.png'))});out[f.replace('.html','')]=[Math.round(bb.width),Math.round(bb.height)];}
fs.writeFileSync(path.join(process.argv[2],'size.json'),JSON.stringify(out));await b.close();})();""")
    subprocess.run(["node", str(js), str(tmp)], check=True)
    from PIL import Image
    size = json.loads((tmp / "size.json").read_text())
    for k in figs:
        Image.open(tmp / f"{k}.png").convert("RGB").save(ROOT / f"assets/qfig/{k}.webp", "WEBP", quality=88, method=5)
    return size
