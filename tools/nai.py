#!/usr/bin/env python3
"""NovelAI 이미지 생성(에셋용). 클라우드 세션에서는 네트워크 프록시가 Authorization 헤더를 넣고,
내 PC에서 돌릴 때는 환경 변수 NAI_TOKEN(pst-로 시작하는 Persistent API Token)을 쓴다.

python3 tools/nai.py OUT.png "장면 프롬프트" [--w 832 --h 1216 --seed N --model MODEL]
화풍·품질·네거티브는 tools/nai-style.json 에서 읽는다."""
import argparse, io, json, os, random, subprocess, sys, time, zipfile
from pathlib import Path

STYLE = json.loads((Path(__file__).with_name("nai-style.json")).read_text(encoding="utf-8"))

def generate(prompt, w, h, seed, model, init=None, strength=0.6, noise=0.1):
    full = f"{STYLE['style']}, {prompt}"
    neg = STYLE["negative"]
    params = {
        "params_version": 3, "width": w, "height": h, "scale": STYLE["scale"], "sampler": STYLE["sampler"],
        "steps": STYLE["steps"], "n_samples": 1, "seed": seed, "ucPreset": 3, "qualityToggle": STYLE.get("quality", True),
        "noise_schedule": "karras", "negative_prompt": neg,
        "v4_prompt": {"caption": {"base_caption": full, "char_captions": []}, "use_coords": False, "use_order": True},
        "v4_negative_prompt": {"caption": {"base_caption": neg, "char_captions": []}, "legacy_uc": False},
    }
    action = "generate"
    if init:  # i2i: 기존 그림을 바탕으로 다시 그린다(strength가 클수록 많이 바뀜)
        import base64
        params.update({"image": base64.b64encode(Path(init).read_bytes()).decode(), "strength": strength, "noise": noise, "extra_noise_seed": seed})
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
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        return z.read(z.namelist()[0])

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
