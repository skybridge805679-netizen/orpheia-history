#!/usr/bin/env python3
"""story/*.js 의 `// [NAI_NSFW_CG: id] 설명` 마커 194개 전체에서 NAI 초벌 주문(tools/nai-assets.json 항목)을 만든다.
초벌: 모델 nai-diffusion-4-5-full(Anlas 사정). 나중에 nai5로 뽑은 그림으로 교체.
모든 인물(36인 히로인 + 묵·사연 배틀/종장 탈의 CG 포함)을 빠짐없이 주문한다."""
import json, re, glob, zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL = "nai-diffusion-5-full"
LOOKS = json.loads((ROOT / "tools/nai-log.json").read_text(encoding="utf-8"))

OUTFIT = {  # 시대·배경 단서
    "눈": "snow", "밤": "night", "촛불": "candlelight", "비": "rain", "여관": "inn room",
    "책상": "desk", "풀밭": "grass field", "다락": "attic", "목욕": "bathhouse, steam",
    "욕조": "bathtub", "부엌": "kitchen", "주방": "kitchen", "한옥": "traditional korean room, hanok",
    "이불": "futon", "침대": "bed", "침실": "bedroom", "바닷": "beach", "배 위": "on boat",
    "예배당": "church", "카페": "cafe", "강": "river", "경복궁": "korean palace hall, dark",
    "귀화": "blue ghost fire, candlelight"
}

POSE = [  # (키워드, 공통 태그, 여자 태그, 남자 태그)
    ("배면기승위", "reverse cowgirl position, girl on top, from behind, vaginal", "reverse cowgirl, straddling, ass focus", "lying on back"),
    ("대면좌위", "face-to-face, sitting on lap, straddling, vaginal, hugging", "straddling, arms around his neck, open mouth", "sitting, hugging her"),
    ("기승위", "cowgirl position, girl on top, vaginal", "straddling, riding, hands on his chest", "lying on back"),
    ("후배위", "doggystyle, from behind, vaginal, all fours", "all fours, looking back, ass up", "kneeling behind her, gripping her hips"),
    ("정상위", "missionary, vaginal, legs spread", "lying on back, legs spread, legs around his waist", "on top of her"),
    ("파이즈리", "paizuri, breasts squeezed together", "squeezing her own breasts", "sitting"),
    ("펠라|구강|입과 혀|딥스로트|이라마", "fellatio, oral", "kneeling, penis in mouth, saliva", "standing"),
    ("서서|입식|벽에", "standing sex, against wall, vaginal", "one leg lifted, clinging to him", "standing, holding her"),
]


def cast_of(i):
    if i.startswith("cg_muk_") or i == "cg_ep_muk_pages_break":
        return "muk"
    if i == "cg_ep_sayeon_scroll_break":
        return "sayeon"
    m = re.match(r"cg_(?:ch\d+|sp\d+|end|ep)_([a-z_]+?)_(?:h\d|d\d|\w+)$", i)
    c = m.group(1) if m else None
    if c == "saebyeok" and (
        i.startswith("cg_ch23_") or i.startswith("cg_sp03_") or
        i.startswith("cg_sp05_") or i.startswith("cg_sp06_") or i.startswith("cg_end_")
    ):
        return "saebyeok_mom"
    return c


items = []
for f in sorted(glob.glob(str(ROOT / "story/*.js"))):
    for mt in re.finditer(r"//\s*\[NAI_NSFW_CG:\s*(\w+)\]\s*(.+)", Path(f).read_text(encoding="utf-8")):
        i, d = mt.group(1), mt.group(2)
        c = cast_of(i)
        if c is None or c not in LOOKS:
            raise SystemExit(f"알 수 없는 인물 id: {i} -> {c}")
        seed = zlib.crc32(i.encode()) % 4000000000 + 1

        # 묵·사연 배틀/종장 의상 파손 CG
        if i.startswith("cg_muk_") or i.startswith("cg_ep_"):
            if "사연" in d and i.startswith("cg_muk_"):
                common = "2girls, nsfw, clothes破損, torn clothes, wardrobe malfunction, exposed breasts, nipples, blush, sweat, battle damage, no readable text"
                chars = [
                    {"cast": "muk", "prompt": "girl, completely torn clothes, nude, nipples, ribbons covering body, sitting on ground, blush, embarrassed", "x": 0.38, "y": 0.55},
                    {"cast": "sayeon", "prompt": "girl, torn clothes, open shirt, cleavage, exposed breasts, standing, blush, breathing hard", "x": 0.65, "y": 0.5},
                ]
            elif i == "cg_ep_sayeon_scroll_break":
                common = "1girl, solo, nsfw, nude, torn paper scrolls floating around, exposed breasts, nipples, blush, embarrassed, no readable text"
                chars = [{"cast": "sayeon", "prompt": "girl, nude, floating paper scroll ribbons, covering face with brush, blush, thighs together", "x": 0.5, "y": 0.5}]
            elif i == "cg_ep_muk_pages_break":
                common = "1girl, solo, nsfw, nude, torn paper pages and ink scattering into light, exposed breasts, nipples, pale skin, glowing light, no readable text"
                chars = [{"cast": "muk", "prompt": "girl, nude, small breasts, nipples, crouching, serene and emotional expression, ink dissolving", "x": 0.5, "y": 0.5}]
            elif i.endswith("_d1"):
                common = "1girl, solo, nsfw, torn clothes, battle damage, wardrobe malfunction, cleavage, exposed breasts, thighs, blush, no readable text"
                chars = [{"cast": "muk", "prompt": "girl, torn outfit, exposed cleavage and thighs, blush, lonely eyes", "x": 0.5, "y": 0.5}]
            else:
                common = "1girl, solo, nsfw, completely torn clothes, almost nude, nipples, battle damage, sitting on ground, blush, no readable text"
                chars = [{"cast": "muk", "prompt": "girl, torn shreds of cloth, nude, nipples, covering chest, blush, embarrassed", "x": 0.5, "y": 0.55}]
            items.append({
                "id": i, "size": "bg", "seed": seed, "model": MODEL,
                "prompt": common, "chars": chars
            })
            continue

        # 히로인 + 상철 H씬 CG
        common = "sex, hetero, nude, 1girl, 1boy, nsfw, explicit"
        girl = "girl, nude, blush, sweat"
        boy = "boy, faceless male, shaded face, nude"
        for kw, c1, g1, b1 in POSE:
            if re.search(kw, d):
                common += ", " + c1
                girl += ", " + g1
                boy += ", " + b1
                break
        else:
            common += ", vaginal, missionary"
            girl += ", lying on back"
            boy += ", on top of her"
        if re.search("모유|젖을 물|수유|젖이", d):
            girl += ", lactation, breast milk"
        if re.search("풍만|젖무덤|묵직", d):
            girl += ", large breasts"
        elif re.search("작|봉긋|납작", d):
            girl += ", small breasts"
        if re.search("사정|씨앗|정액", d):
            common += ", cum in pussy, cum"
        if re.search("울|눈물|오열", d):
            girl += ", tears"
        if re.search("임신|배가 부", d):
            girl += ", pregnant"
        env = [v for k, v in OUTFIT.items() if k in d][:3]
        items.append({
            "id": i, "size": "bg", "seed": seed, "model": MODEL,
            "prompt": common + (", " + ", ".join(env) if env else "") + ", no readable text",
            "chars": [
                {"cast": c, "prompt": girl, "x": 0.42, "y": 0.5},
                {"cast": "sangcheol", "prompt": boy, "uc": "visible eyes", "x": 0.58, "y": 0.5},
            ],
        })

p = ROOT / "tools/nai-assets.json"
data = json.loads(p.read_text(encoding="utf-8"))
new_by_id = {x["id"]: x for x in items}
# 기존 항목 중 이번 194개에 해당하는 항목은 새 정의로 교체하고, 없던 항목은 뒤에 추가
updated_items = []
seen = set()
for x in data["items"]:
    if x["id"] in new_by_id:
        updated_items.append(new_by_id[x["id"]])
        seen.add(x["id"])
    else:
        updated_items.append(x)
for x in items:
    if x["id"] not in seen:
        updated_items.append(x)

data["items"] = updated_items
p.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"총 NSFW CG 주문: {len(items)}장 (신규 추가 {len(items) - len(seen)}장, 기존 갱신 {len(seen)}장)")
