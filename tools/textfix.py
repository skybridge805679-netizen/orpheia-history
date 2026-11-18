#!/usr/bin/env python3
"""NAI 그림의 깨진 글자를 지우고 진짜 글자로 다시 쓴다.

  python3 tools/textfix.py            # tools/text-fix.json 전부 적용
  python3 tools/textfix.py st_yunseul_pout   # 이름에 이 글자가 든 것만

원본은 처음 한 번 tools/orig/ 에 보관하고, 언제나 원본에서 다시 만든다(여러 번 돌려도 같다).
NAI로 그림을 새로 뽑았으면 tools/orig/<id>.webp 를 지우고 다시 돌린다(좌표는 다시 잡아야 할 수 있다).

작업(ops):
  erase  : poly 안에서 pick(dark|ink|light|all) 에 걸리는 화소를 지우고 주변색으로 메운다(OpenCV inpaint).
           fill 을 주면 메우지 않고 그 색으로 칠한다(평평한 간판·라벨).
  layer  : center 를 중심으로 angle(도, 반시계) 만큼 돌린 글자판을 얹는다.
           items: {text, font, size, color, at:[dx,dy], stroke, stroke_color, pill:색, pad, vertical}
"""
import json, sys, shutil
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS, ORIG, FONTS = ROOT / "assets", ROOT / "tools" / "orig", ROOT / "tools" / "fonts"
FONT = {"dodum": "GowunDodum-Regular.ttf", "batang": "GowunBatang-Bold.ttf", "brush": "NanumBrushScript-Regular.ttf",
        "pen": "NanumPenScript-Regular.ttf", "black": "BlackHanSans-Regular.ttf", "dohyeon": "DoHyeon-Regular.ttf",
        "song": "SongMyung-Regular.ttf", "serif": "NotoSerifKR.ttf"}
FONT_URL = {"NotoSerifKR.ttf": "notoserifkr/NotoSerifKR%5Bwght%5D.ttf"}  # 나머지는 ofl/<소문자이름>/<파일>


def font(key, size):
    """글꼴이 없으면 Google Fonts 저장소에서 받아 둔다(tools/fonts 는 git 에 올리지 않음)."""
    fn = FONT[key]
    path = FONTS / fn
    if not path.exists():
        import urllib.request
        FONTS.mkdir(exist_ok=True)
        rel = FONT_URL.get(fn) or f"{fn.split('-')[0].lower()}/{fn}"
        urllib.request.urlretrieve(f"https://raw.githubusercontent.com/google/fonts/main/ofl/{rel}", path)
    return ImageFont.truetype(str(path), size)


def rgb(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4)) + ((int(c[6:8], 16),) if len(c) == 8 else (255,))


def erase(img, op):
    a = np.array(img.convert("RGB"))
    poly = np.zeros(a.shape[:2], np.uint8)
    cv2.fillPoly(poly, [np.array(op["poly"], np.int32)], 255)
    pick = op.get("pick", "ink")
    hsv = cv2.cvtColor(a, cv2.COLOR_RGB2HSV)
    if pick == "all":
        m = poly
    elif pick == "light":  # 밝은 글자(흰 서명 등)
        m = (hsv[..., 2] > op.get("vmin", 165)) & (hsv[..., 1] < op.get("smax", 90))
        m = (m.astype(np.uint8) * 255) & poly
        m = cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=op.get("grow", 2)) & poly
    else:
        dark = (a.max(axis=2) < op.get("dark", 120))
        m = dark
        if pick == "ink":  # 어두운 획 + 진한 색 글자(빨강·분홍 등)
            m = dark | ((hsv[..., 1] > op.get("sat", 120)) & (hsv[..., 2] < op.get("val", 245)) & (hsv[..., 2] > 60))
            for lo, hi in op.get("keep_hue", []):  # 이 색상 범위(H 0~180)는 남긴다(바탕색 등)
                m &= ~((hsv[..., 0] >= lo) & (hsv[..., 0] <= hi) & ~dark)
        m = (m.astype(np.uint8) * 255) & poly
        m = cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=op.get("grow", 2)) & poly
    if "fill" in op:
        a[m > 0] = rgb(op["fill"])[:3]
    else:
        a = cv2.inpaint(a, m, op.get("radius", 6), cv2.INPAINT_TELEA)
    out = Image.fromarray(a)
    if img.mode == "RGBA":
        out.putalpha(img.getchannel("A"))
    return out


def layer(img, op):
    W, H = op.get("size", [400, 300])
    L = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(L)
    for it in op["items"]:
        cx, cy = W / 2 + it.get("at", [0, 0])[0], H / 2 + it.get("at", [0, 0])[1]
        if "box" in it:  # 라벨 바탕(둥근 사각형)
            bw, bh = it["box"]
            d.rounded_rectangle((cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2), radius=it.get("radius", 6),
                                fill=None if it.get("fill") == "none" else rgb(it.get("fill", "#fbfbf7")),
                                outline=rgb(it["outline"]) if "outline" in it else None, width=it.get("width", 2))
            continue
        f = font(it.get("font", "black"), it["size"])
        txt = "\n".join(it["text"]) if it.get("vertical") else it["text"]
        sp = it.get("spacing", 0)
        bb = d.multiline_textbbox((0, 0), txt, font=f, spacing=sp, align="center", stroke_width=it.get("stroke", 0))
        tw, th = bb[2] - bb[0], bb[3] - bb[1]
        x, y = cx - tw / 2 - bb[0], cy - th / 2 - bb[1]
        if "pill" in it:
            p = it.get("pad", 6)
            d.rounded_rectangle((cx - tw / 2 - p * 1.6, cy - th / 2 - p, cx + tw / 2 + p * 1.6, cy + th / 2 + p),
                                radius=it.get("radius", p * 2), fill=rgb(it["pill"]))
        d.multiline_text((x, y), txt, font=f, fill=rgb(it.get("color", "#1d1a16")), spacing=sp, align="center",
                         stroke_width=it.get("stroke", 0), stroke_fill=rgb(it.get("stroke_color", "#ffffff")))
    if op.get("blur"):
        from PIL import ImageFilter
        L = L.filter(ImageFilter.GaussianBlur(op["blur"]))
    if op.get("opacity", 1) < 1:
        L.putalpha(L.getchannel("A").point(lambda v: int(v * op["opacity"])))
    R = L.rotate(op.get("angle", 0), resample=Image.BICUBIC, expand=True)
    cx, cy = op["center"]
    base = img.convert("RGBA")
    base.alpha_composite(R, (int(cx - R.width / 2), int(cy - R.height / 2)))
    if img.mode == "RGBA":  # 투명 스탠딩: 원래 알파 유지
        base.putalpha(img.getchannel("A"))
    return base if img.mode == "RGBA" else base.convert("RGB")


def restore(img, op, orig):
    """poly 안에서 원본의 특정 색(살색 등)을 되살린다: 글자판이 손가락을 덮었을 때."""
    a, o = np.array(img.convert("RGB")), np.array(orig.convert("RGB"))
    poly = np.zeros(a.shape[:2], np.uint8)
    cv2.fillPoly(poly, [np.array(op["poly"], np.int32)], 255)
    hsv = cv2.cvtColor(o, cv2.COLOR_RGB2HSV)
    m = np.zeros(a.shape[:2], bool)
    for lo, hi in op.get("hue", [[0, 22], [170, 180]]):
        m |= (hsv[..., 0] >= lo) & (hsv[..., 0] <= hi)
    m &= (hsv[..., 1] >= op.get("smin", 15)) & (hsv[..., 1] <= op.get("smax", 140)) & (hsv[..., 2] >= op.get("vmin", 150))
    m = cv2.morphologyEx((m.astype(np.uint8) * 255) & poly, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.GaussianBlur(m, (3, 3), 0)[..., None] / 255.0
    out = Image.fromarray((a * (1 - m) + o * m).astype(np.uint8))
    if img.mode == "RGBA":
        out.putalpha(img.getchannel("A"))
    return out


def main():
    conf = json.loads((ROOT / "tools" / "text-fix.json").read_text())
    only = sys.argv[1] if len(sys.argv) > 1 else ""
    ORIG.mkdir(exist_ok=True)
    for name, ent in conf.items():
        if name.startswith("_") or only not in name:
            continue
        src, dst = ORIG / f"{name}.webp", ASSETS / f"{name}.webp"
        if not src.exists():
            shutil.copy2(dst, src)
        img = Image.open(src)
        img = img.convert("RGBA" if img.mode in ("RGBA", "LA", "P") else "RGB")
        orig = img
        for op in ent["ops"]:
            img = restore(img, op, orig) if op["op"] == "restore" else {"erase": erase, "layer": layer}[op["op"]](img, op)
        img.save(dst, "WEBP", quality=ent.get("quality", 92), method=6)
        print("fixed", name)


if __name__ == "__main__":
    main()
