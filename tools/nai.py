#!/usr/bin/env python3
"""NovelAI 이미지 생성(에셋용). 클라우드 세션에서는 네트워크 프록시가 Authorization 헤더를 넣고,
내 PC에서 돌릴 때는 환경 변수 NAI_TOKEN(pst-로 시작하는 Persistent API Token)을 쓴다.

python3 tools/nai.py OUT.png "장면 프롬프트" [--w 832 --h 1216 --seed N --model MODEL]
화풍·품질·네거티브는 tools/nai-style.json 에서 읽는다."""
import argparse, io, json, os, random, subprocess, sys, zipfile
from pathlib import Path

STYLE = json.loads((Path(__file__).with_name("nai-style.json")).read_text(encoding="utf-8"))

def generate(prompt, w, h, seed, model):
    full = f"{STYLE['style']}, {prompt}"
    neg = STYLE["negative"]
    params = {
        "params_version": 3, "width": w, "height": h, "scale": STYLE["scale"], "sampler": STYLE["sampler"],
        "steps": STYLE["steps"], "n_samples": 1, "seed": seed, "ucPreset": 3, "qualityToggle": STYLE.get("quality", True),
        "noise_schedule": "karras", "negative_prompt": neg,
        "v4_prompt": {"caption": {"base_caption": full, "char_captions": []}, "use_coords": False, "use_order": True},
        "v4_negative_prompt": {"caption": {"base_caption": neg, "char_captions": []}, "legacy_uc": False},
    }
    body = json.dumps({"input": full, "model": model, "action": "generate", "parameters": params})
    r = subprocess.run(["curl", "-sS", "-X", "POST", "https://image.novelai.net/ai/generate-image",
                        "-H", "Content-Type: application/json", "--data-binary", "@-", "-w", "\n%{http_code}"]
                       + (["-H", "Authorization: Bearer " + os.environ["NAI_TOKEN"]] if os.environ.get("NAI_TOKEN") else []),
                       input=body.encode(), capture_output=True, timeout=240)
    data, _, code = r.stdout.rpartition(b"\n")
    if code != b"200":
        sys.exit(f"HTTP {code.decode()}: {data[:400].decode(errors='replace')}")
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        return z.read(z.namelist()[0])

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("out"); ap.add_argument("prompt")
    ap.add_argument("--w", type=int, default=832); ap.add_argument("--h", type=int, default=1216)
    ap.add_argument("--seed", type=int, default=None); ap.add_argument("--model", default=STYLE["model"])
    a = ap.parse_args()
    seed = a.seed if a.seed is not None else random.randint(1, 2**32 - 1)
    png = generate(a.prompt, a.w, a.h, seed, a.model)
    Path(a.out).write_bytes(png)
    print(f"{a.out} seed={seed}")
