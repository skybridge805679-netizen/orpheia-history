#!/usr/bin/env python3
"""국가유산청(국가유산포털) 공개 API로 문화재 사진을 모은다. 한국 안의 컴퓨터에서 돌린다
(해외 클라우드에서는 국가유산청 서버가 HTTPS 연결을 끊는다).

  python3 tools/fetch_khs.py            # tools/khs-list.txt 의 이름 전부
  python3 tools/fetch_khs.py 첨성대     # 이름 하나만
  python3 tools/fetch_khs.py --dry      # 내려받지 않고 무엇이 검색되는지만 보기

결과: assets/heritage/khs/<번호>.webp, data/heritage-khs.json(이름 → 파일·국가유산 명칭·지정 번호·출처).
이미 받은 이름은 건너뛴다. 받은 뒤 git add/commit/push 하면 검수해서 게임에 연결한다.

API(국가유산청 공공데이터, 인증키 없음)
  목록:  https://www.khs.go.kr/cha/SearchKindOpenapiList.do?ccbaMnm1=이름&pageUnit=20
  사진:  https://www.khs.go.kr/cha/SearchImageOpenapi.do?ccbaKdcd=..&ccbaAsno=..&ccbaCtcd=..
"""
import io, json, sys, time, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/heritage/khs"
DB = ROOT / "data/heritage-khs.json"
LIST = ROOT / "tools/khs-list.txt"
BASE = "https://www.khs.go.kr/cha/"
UA = {"User-Agent": "Mozilla/5.0 (personal study game)"}


def get(url, tries=3):
    for k in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read()
        except Exception as e:
            if k == tries - 1:
                raise
            time.sleep(3 * (k + 1))


def xml(url):
    return ET.fromstring(get(url))


def txt(el, tag):
    x = el.find(tag)
    return (x.text or "").strip() if x is not None and x.text else ""


def search(name, query):
    """이름으로 검색해 가장 그럴듯한 국가유산 하나를 고른다(이름이 정확히 같거나, 검색어를 모두 포함하는 것 우선)."""
    root = xml(BASE + "SearchKindOpenapiList.do?pageUnit=30&ccbaMnm1=" + urllib.parse.quote(query))
    items = root.findall(".//item")
    if not items:
        return None
    words = query.split()
    def score(it):
        m = txt(it, "ccbaMnm1")
        s = 0
        if m.replace(" ", "") == query.replace(" ", ""): s += 100
        s += sum(10 for w in words if w in m)
        s -= len(m) * 0.1
        return s
    return max(items, key=score)


def main():
    from PIL import Image
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry" in sys.argv
    names = args or [l.strip() for l in LIST.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#")]
    OUT.mkdir(parents=True, exist_ok=True)
    db = json.loads(DB.read_text(encoding="utf-8")) if DB.exists() else {}
    for line in names:
        name, _, query = line.partition("=")
        name, query = name.strip(), (query.strip() or name.strip())
        if name in db and not args:
            continue
        try:
            it = search(name, query)
            if it is None:
                print("검색 결과 없음:", name, "(검색어:", query + ")"); continue
            kd, asno, ct = txt(it, "ccbaKdcd"), txt(it, "ccbaAsno"), txt(it, "ccbaCtcd")
            official = txt(it, "ccbaMnm1"); kind = txt(it, "ccmaName"); place = txt(it, "ccbaCtcdNm")
            imgs = xml(BASE + f"SearchImageOpenapi.do?ccbaKdcd={kd}&ccbaAsno={asno}&ccbaCtcd={ct}")
            urls = [u.text.strip() for u in imgs.iter("imageUrl") if u.text]
            descs = [d.text.strip() if d.text else "" for d in imgs.iter("ccimDesc")]
            print(("미리보기" if dry else "받기"), name, "→", official, f"({kind}, {place})", "사진", len(urls))
            if dry or not urls:
                continue
            raw = get(urls[0])
            im = Image.open(io.BytesIO(raw)).convert("RGB"); im.thumbnail((1000, 1000))
            fn = f"k{len(db) + 1:03d}.webp"; im.save(OUT / fn, "WEBP", quality=86)
            db[name] = {"src": f"heritage/khs/{fn}", "official": official, "kind": kind, "place": place,
                        "id": f"{kd}-{asno}-{ct}", "caption": descs[0] if descs else "",
                        "credit": "국가유산청 국가유산포털", "page": f"https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaKdcd={kd}&ccbaAsno={asno}&ccbaCtcd={ct}",
                        "alt": urls[1:4], "checked": False}
            DB.write_text(json.dumps(db, ensure_ascii=False, indent=1), encoding="utf-8")
        except Exception as e:
            print("실패:", name, e)
        time.sleep(1)
    print("끝:", len(db), "점 →", DB)


if __name__ == "__main__":
    main()
