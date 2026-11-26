#!/usr/bin/env python3
"""story/*.js 의 `// [NAI_NSFW_CG: id] 설명` 마커에서 NAI 초벌 주문(tools/nai-assets.json 항목)을 만든다.
초벌: 모델 nai-diffusion-4-5-full(Anlas 사정). 나중에 nai5로 뽑은 그림으로 교체.
성인(프로필 18세 이상)으로 설정된 인물만 만든다. 미성년 설정 인물·나이가 모호한 존재(묵·사연·오르페이아)는 제외한다."""
import json, re, glob, zlib
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
MODEL = "nai-diffusion-4-5-full"
SKIP = {"dallae","irang","eunsil","ara","gaon","haerang","maru","seori","danbi","bomnae","moa","hyejin","goyo","muk","sayeon","orpheia","nuri"}
AGE_RE = re.compile(r"열\s?(네|다섯|여섯|일곱)|1[4-7]\s?살")
LOOKS = json.loads((ROOT/"tools/nai-log.json").read_text(encoding="utf-8"))
OUTFIT = {  # 시대 단서 한두 개(초벌이라 가볍게)
 "눈":"snow","밤":"night","촛불":"candlelight","비":"rain","여관":"inn room","책상":"desk","풀밭":"grass field","다락":"attic",
 "목욕":"bathhouse, steam","욕조":"bathtub","부엌":"kitchen","주방":"kitchen","한옥":"traditional korean room, hanok","이불":"futon",
 "침대":"bed","침실":"bedroom","바닷":"beach","배 위":"on boat","예배당":"church","카페":"cafe","강":"river"}
POSE = [  # (키워드, 공통 태그, 여자 태그, 남자 태그)
 ("배면기승위","reverse cowgirl position, girl on top, from behind, vaginal","reverse cowgirl, straddling, ass focus","lying on back"),
 ("대면좌위","face-to-face, sitting on lap, straddling, vaginal, hugging","straddling, arms around his neck, open mouth","sitting, hugging her"),
 ("기승위","cowgirl position, girl on top, vaginal","straddling, riding, hands on his chest","lying on back"),
 ("후배위","doggystyle, from behind, vaginal, all fours","all fours, looking back, ass up","kneeling behind her, gripping her hips"),
 ("정상위","missionary, vaginal, legs spread","lying on back, legs spread, legs around his waist","on top of her"),
 ("파이즈리","paizuri, breasts squeezed together","squeezing her own breasts","sitting"),
 ("펠라|구강|입과 혀|딥스로트|이라마","fellatio, oral","kneeling, penis in mouth, saliva","standing"),
 ("서서|입식|벽에","standing sex, against wall, vaginal","one leg lifted, clinging to him","standing, holding her"),
]
def cast_of(i):
    m = re.match(r"cg_(?:ch\d+|sp\d+|end|ep)_([a-z_]+?)_(?:h\d|d\d|\w+)$", i)
    return m.group(1) if m else None
items=[]; skipped=[]
for f in sorted(glob.glob(str(ROOT/"story/*.js"))):
    for mt in re.finditer(r"//\s*\[NAI_NSFW_CG:\s*(\w+)\]\s*(.+)", Path(f).read_text(encoding="utf-8")):
        i, d = mt.group(1), mt.group(2)
        c = cast_of(i)
        if i.startswith("cg_muk_") or c is None or c not in LOOKS or c in SKIP or AGE_RE.search(d):
            skipped.append(i); continue
        common, girl, boy = "sex, hetero, nude, 1girl, 1boy, nsfw, explicit", "girl, nude, blush, sweat", "boy, faceless male, shaded face, nude"
        for kw, c1, g1, b1 in POSE:
            if re.search(kw, d):
                common += ", " + c1; girl += ", " + g1; boy += ", " + b1; break
        else:
            common += ", vaginal, missionary"; girl += ", lying on back"; boy += ", on top of her"
        if re.search("모유|젖을 물|수유|젖이", d): girl += ", lactation, breast milk"
        if re.search("풍만|젖무덤|묵직", d): girl += ", large breasts"
        elif re.search("작|봉긋", d): girl += ", small breasts"
        if re.search("사정|씨앗|정액", d): common += ", cum in pussy, cum"
        if re.search("울|눈물", d): girl += ", tears"
        if re.search("임신|배가 부", d): girl += ", pregnant"
        env = [v for k,v in OUTFIT.items() if k in d][:3]
        seed = zlib.crc32(i.encode()) % 4000000000 + 1
        items.append({"id": i, "size": "bg", "seed": seed, "model": MODEL,
          "prompt": common + (", " + ", ".join(env) if env else "") + ", no readable text",
          "chars": [{"cast": c, "prompt": girl, "x": 0.42, "y": 0.5},
                    {"cast": "sangcheol", "prompt": boy, "uc": "visible eyes", "x": 0.58, "y": 0.5}]})
p = ROOT/"tools/nai-assets.json"
data = json.loads(p.read_text(encoding="utf-8"))
have = {x["id"] for x in data["items"]}
new = [x for x in items if x["id"] not in have]
data["items"] += new
p.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print("추가", len(new), "제외", len(skipped)); print("제외 목록:", " ".join(skipped))
