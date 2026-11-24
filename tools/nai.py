#!/usr/bin/env python3
"""NovelAI 이미지 생성(에셋용). 클라우드 세션에서는 네트워크 프록시가 Authorization 헤더를 넣고,
내 PC에서 돌릴 때는 환경 변수 NAI_TOKEN(pst-로 시작하는 Persistent API Token)을 쓴다.

python3 tools/nai.py OUT.png "장면 프롬프트" [--w 832 --h 1216 --seed N --model MODEL]
화풍·품질·네거티브는 tools/nai-style.json 에서 읽는다."""
import argparse, io, json, os, random, subprocess, sys, time, zipfile
from pathlib import Path

STYLE = json.loads((Path(__file__).with_name("nai-style.json")).read_text(encoding="utf-8"))

def generate(prompt, w, h, seed, model, init=None, strength=0.6, noise=0.1, negative="", chars=None, style=None, fit="stretch"):
    """chars: [{"prompt": 인물 프롬프트, "uc": 인물 네거티브, "x": 0.1~0.9, "y": 0.1~0.9}] — NAI 멀티 캐릭터 프롬프트.
    인물마다 따로 적어서 머리색·옷이 서로 섞이지 않게 하고, x·y(5×5 격자)로 화면 위치를 정한다.
    동작은 source#/target#/mutual# 태그(예: source#carrying, target#carrying)로 누가 누구에게 하는지 적는다."""
    chars = chars or []
    full = f"{style or STYLE['style']}, {prompt}"
    neg = STYLE["negative"] + (", " + negative if negative else "")
    params = {
        "params_version": 3, "width": w, "height": h, "scale": STYLE["scale"], "sampler": STYLE["sampler"],
        "steps": STYLE["steps"], "n_samples": 1, "seed": seed, "ucPreset": 3, "qualityToggle": STYLE.get("quality", True),
        "noise_schedule": "karras", "negative_prompt": neg,
        "v4_prompt": {"caption": {"base_caption": full, "char_captions": [
            {"char_caption": c["prompt"], "centers": [{"x": c.get("x", 0.5), "y": c.get("y", 0.5)}]} for c in chars]},
            "use_coords": any("x" in c for c in chars), "use_order": True},
        "v4_negative_prompt": {"caption": {"base_caption": neg, "char_captions": [
            {"char_caption": c.get("uc", ""), "centers": [{"x": c.get("x", 0.5), "y": c.get("y", 0.5)}]} for c in chars]},
            "legacy_uc": False},
    }
    if chars:
        params["characterPrompts"] = [{"prompt": c["prompt"], "uc": c.get("uc", ""),
                                       "center": {"x": c.get("x", 0.5), "y": c.get("y", 0.5)}, "enabled": True} for c in chars]
    action = "generate"
    if init:  # i2i: 기존 그림을 바탕으로 다시 그린다(strength가 클수록 많이 바뀜)
        import base64
        from PIL import Image
        src = Image.open(init).convert("RGBA")
        if fit == "pad":  # 비율이 다른 바탕(세로 스탠딩 → 가로 그림): 늘이지 않고 가운데 두고 둘레는 밤빛으로 채운다
            r = min(w / src.width, h / src.height); src = src.resize((round(src.width * r), round(src.height * r)))
            canvas = Image.new("RGBA", (w, h), (24, 20, 40, 255)); canvas.alpha_composite(src, ((w - src.width) // 2, (h - src.height) // 2)); src = canvas
        else:
            src = src.resize((w, h))
        buf = io.BytesIO(); src.save(buf, "PNG")
        params.update({"image": base64.b64encode(buf.getvalue()).decode(), "strength": strength, "noise": noise, "extra_noise_seed": seed})
        action = "img2img"
    body = json.dumps({"input": full, "model": model, "action": action, "parameters": params})
    # 같은 계정으로 다른 생성(웹·다른 PC)이 돌고 있으면 429 "Concurrent generation is locked" — 기다렸다 다시 한다.
    for attempt in range(12):
        r = subprocess.run(["curl", "-sS", "-X", "POST", "https://image.novelai.net/ai/generate-image",
                            "-H", "Content-Type: application/json", "--data-binary", "@-", "-w", "\n%{http_code}"]
                           + (["-H", "Authorization: Bearer " + os.environ["NAI_TOKEN"]] if os.environ.get("NAI_TOKEN") else []),
                           input=body.encode(), capture_output=True, timeout=240)
        data, _, code = r.stdout.rpartition(b"\n")
        if code != b"429":
            break
        time.sleep(min(10 * (attempt + 1), 60))
    if code != b"200":
        sys.exit(f"HTTP {code.decode()}: {data[:400].decode(errors='replace')}")
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            return z.read(z.namelist()[0])
    except zipfile.BadZipFile:
        # 200인데 zip이 아닌 응답(검열·일시 오류) — 이 한 장만 실패로 넘긴다
        sys.exit(f"zip 아닌 응답: {data[:300].decode(errors='replace')}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out"); ap.add_argument("prompt")
    ap.add_argument("--w", type=int, default=832); ap.add_argument("--h", type=int, default=1216)
    ap.add_argument("--seed", type=int, default=None); ap.add_argument("--model", default=STYLE["model"])
    ap.add_argument("--init", default=None, help="i2i 바탕 그림"); ap.add_argument("--strength", type=float, default=0.6)
    a = ap.parse_args()
    seed = a.seed if a.seed is not None else random.randint(1, 2**32 - 1)
    png = generate(a.prompt, a.w, a.h, seed, a.model, init=a.init, strength=a.strength)
    Path(a.out).write_bytes(png)
    print(f"{a.out} seed={seed}")
