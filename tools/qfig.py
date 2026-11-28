"""예상 문제 자료 그림(HTML 템플릿 → Playwright 렌더 → WebP). tools/predicted.py 가 부른다."""
import html, json, re, subprocess, tempfile, os
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "tools/fonts"
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
    webp = re.sub(r"\.(png|jpe?g)$", ".webp", src, flags=re.I)  # 기출 그림 사본(assets/kh/)은 WebP
    for p in (ROOT / "assets" / src, ROOT / "assets/kh" / src, ROOT / "assets/kh" / webp):
        if p.exists(): return p.as_uri()
    if os.environ.get("NORENDER"): return ""  # 그림을 다시 그리지 않을 때는 사진이 없어도 된다
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
.frame{{display:flex;gap:18px;align-items:center;width:932px}}.frame .mat{{flex:1 1 auto;min-width:0}}.frame .mat>*:last-child{{margin-bottom:0}}
.frame .pres{{flex:0 0 290px;display:flex;flex-direction:column;gap:14px}}.frame .pres img{{width:290px;display:block;border:1px solid #bbb;border-radius:6px}}
.frame .pbub{{position:relative;background:#fff;border:2px solid #333;border-radius:18px;padding:12px 16px;font-size:20px;line-height:1.6;box-shadow:2px 3px 0 #0002}}
.frame .pbub .who{{display:block;font-weight:bold;color:#1d5c55;font-size:17px;margin:0 0 2px}}
.frame .pbub:after{{content:'';position:absolute;width:18px;height:18px;background:#fff;border-right:2px solid #333;border-bottom:2px solid #333;bottom:-11px;left:120px;transform:rotate(45deg)}}
.modum h4,.sheet h4,.tamgu h4,.dap h4,.lec h4,.fld h4{{margin:0 0 12px;font:bold 23px B,serif}}
.modum{{border:2px solid #6f9a5c;border-radius:12px;padding:16px 18px;background:#f6faf1}}.modum .row{{display:flex;gap:14px;align-items:flex-start;border:1.5px solid #9dbd8c;border-radius:10px;padding:10px 14px;margin-top:10px;background:#fff;font-size:19px;line-height:1.7}}
.modum .lab{{flex:0 0 78px;background:#5c8a4a;color:#fff;border-radius:8px;text-align:center;font-weight:bold;padding:4px 0}}.modum .row b{{display:block}}
.qa .t{{background:#e8f1fb;border:2px solid #4a74a8;border-radius:14px;padding:12px 16px;font-size:20px;line-height:1.7;margin-bottom:12px}}.qa .t b{{color:#2c5288;margin-right:6px}}
.qa .s{{display:flex;gap:12px;align-items:flex-start;margin:9px 0;font-size:19px;line-height:1.7}}.qa .s b{{flex:0 0 60px;text-align:center;background:#ffe2a3;border:2px solid #d9a441;border-radius:20px;padding:2px 0}}.qa .s span{{background:#fff;border:1.5px solid #bbb;border-radius:12px;padding:6px 12px;flex:1}}
.sheet{{border:2px solid #555;background:#fffdf5;padding:16px 20px}}.sheet .top{{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #555;padding-bottom:6px;margin-bottom:12px}}.sheet .top h4{{margin:0}}.sheet .top span{{font-size:15px}}
.tamgu{{border:2px solid #8a6db3;border-radius:12px;padding:0 0 14px;background:#faf7ff;overflow:hidden}}.tamgu .rib{{background:#8a6db3;color:#fff;font:bold 18px D,sans-serif;padding:7px 16px;margin-bottom:12px}}.tamgu h4,.tamgu table{{margin-left:16px;margin-right:16px;width:calc(100% - 32px)}}
.tamgu th,.sheet th,.fld th{{width:120px}}
.dap{{border:2px solid #b07a3c;border-radius:12px;padding:16px 18px;background:#fff8ef}}.dap th{{background:#f3dfc4}}
.poster{{background:linear-gradient(#22344c,#3d5877);color:#fff;border-radius:12px;padding:22px 26px;text-align:center}}.poster small{{display:block;font-size:16px;opacity:.85;letter-spacing:.1em}}.poster h3{{font:bold 32px B,serif;margin:8px 0 6px}}.poster .sub{{font-size:19px;margin-bottom:14px}}
.poster .blank{{color:#1d1a16}}.poster ul{{text-align:left;background:#ffffff1a;border-radius:10px;padding:12px 16px 12px 36px;margin:0 0 12px;font-size:19px;line-height:1.8}}.poster .foot{{font-size:16px;opacity:.9}}
.lec{{border:2px solid #3f7f8c;border-radius:12px;padding:16px 18px;background:#f1fafb}}.lec th{{background:#cfe7ea}}.lec .foot{{font-size:16px;margin-top:8px;text-align:right}}
.fld{{border:2px solid #777;border-radius:10px;padding:16px 18px;background:#fff}}.fld th{{background:#e9ecef}}
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
    from playwright.sync_api import sync_playwright
    from PIL import Image
    size = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        p = b.new_page(viewport={"width": 1000, "height": 800}, device_scale_factor=1.5)
        for k in figs:
            p.goto((tmp / f"{k}.html").as_uri())
            p.wait_for_timeout(150)
            el = p.query_selector("#f")
            bb = el.bounding_box()
            el.screenshot(path=str(tmp / f"{k}.png"))
            size[k] = [round(bb["width"]), round(bb["height"])]
            Image.open(tmp / f"{k}.png").convert("RGB").save(ROOT / f"assets/qfig/{k}.webp", "WEBP", quality=88, method=5)
        b.close()
    return size
