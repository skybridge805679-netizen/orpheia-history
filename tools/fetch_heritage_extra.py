#!/usr/bin/env python3
"""학습 사이트 사진(77점)에 없는 문화재를 한국어 위키백과 대표 사진으로 보충한다.
저작자·라이선스는 위키미디어 공용 imageinfo 에서 읽어 data/heritage-extra.json 에 남긴다.
받은 사진은 반드시 열어 보고 맞는 것만 남긴다(맞지 않으면 json 에서 지우고 사진도 지운다)."""
import json, time, io, re, urllib.request, urllib.parse, urllib.error, html
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/heritage"; OUT.mkdir(exist_ok=True)
DB = ROOT / "data/heritage-extra.json"
UA = {"User-Agent": "OrpheiaHistoryStudy/1.0 (personal study game; credits kept)"}
T = {"거북선":"거북선","빗살무늬 토기":"빗살무늬토기","반달 돌칼":"반달돌칼","비파형 동검":"비파형동검","고인돌":"강화 부근리 지석묘",
 "민무늬 토기":"민무늬토기","세형 동검":"세형동검","이불병좌상":"이불병좌상","발해 석등":"발해 석등","정혜 공주 묘":"정혜공주묘",
 "나전 칠기":"나전칠기","선죽교":"선죽교","청화 백자":"청화백자","도산 서원":"도산서원","청주 용두사지 철당간":"청주 용두사지 철당간",
 "화순 쌍봉사 철감선사탑":"화순 쌍봉사 철감선사탑","주먹도끼":"연천 전곡리 유적","덩이쇠":"덩이쇠",
 # 2026.11.23 주인님 노트(심화 요약)에 나온 문화재 보충
 "산수무늬 벽돌":"부여 외리 문양전 일괄","황룡사 구층 목탑":"황룡사 구층목탑","감은사지 삼층 석탑":"경주 감은사지 동·서 삼층석탑",
 "상원사 동종":"평창 상원사 동종","발해 영광탑":"영광탑","발해 이불병좌상":"이불병좌상","부석사 소조여래좌상":"영주 부석사 소조여래좌상",
 "고사관수도":"고사관수도","초충도":"초충도","곤여만국전도":"곤여만국전도"}
db = json.loads(DB.read_text()) if DB.exists() else {}
def get(url, tries=5):
    for k in range(tries):
        try: return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or k == tries - 1: raise
            time.sleep(40 * (k + 1))
strip = lambda s: html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()
for i, (name, title) in enumerate(T.items()):
    if name in db: continue
    try:
        s = json.loads(get("https://ko.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title.replace(" ", "_"))))
        src = (s.get("originalimage") or s.get("thumbnail") or {}).get("source", "")
        if not src: print("사진 없음", name); continue
        fname = urllib.parse.unquote(src.split("?")[0].rsplit("/", 1)[-1]); fname = re.sub(r"^\d+px-", "", fname)
        time.sleep(6)
        info = json.loads(get("https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata|url&iiurlwidth=960&titles=" + urllib.parse.quote("File:" + fname)))
        pg = next(iter(info["query"]["pages"].values())); ii = (pg.get("imageinfo") or [{}])[0]; md = ii.get("extmetadata", {})
        lic = strip(md.get("LicenseShortName", {}).get("value")); art = strip(md.get("Artist", {}).get("value"))[:60]
        url = ii.get("thumburl") or ii.get("url")
        if not url: print("공용에 없음", name, fname); continue
        time.sleep(6)
        im = Image.open(io.BytesIO(get(url))).convert("RGB"); im.thumbnail((960, 960))
        slug = "x%02d.webp" % (len(db) + 1); im.save(OUT / slug, "WEBP", quality=85)
        db[name] = {"src": "heritage/" + slug, "credit": f"{art} · {lic} · 위키미디어 공용".strip(" ·"), "file": fname, "checked": False}
        DB.write_text(json.dumps(db, ensure_ascii=False, indent=1)); print("ok", name, fname, lic)
    except Exception as e:
        print("실패", name, e)
    time.sleep(10)
print("끝", len(db))
