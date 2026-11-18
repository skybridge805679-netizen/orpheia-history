#!/usr/bin/env python3
"""NAI 에셋을 waifu2x(ncnn-vulkan)로 2배 키운다. GitHub Actions에서 돈다(.github/workflows/upscale.yml, nai-assets.yml).

  W2X=/path/to/waifu2x-ncnn-vulkan-dir python3 tools/upscale.py [--minutes 40] [id ...]

- 대상: assets/{bg,cg,st,sd,chr,orpheia,title}_*.webp 중 아직 안 키운 것(긴 변이 1300px 이하).
  그림을 새로 뽑거나 textfix로 고치면 원래 크기로 돌아오므로 다음 실행에서 다시 키워진다.
- 방금 생성한 원본 PNG(assets/gen/<id>.png)가 있으면 그것을, 없으면 WebP를 원본으로 쓴다.
- 투명 배경 그림은 색은 waifu2x, 알파는 Lanczos로 키워 합친다.
- --minutes 를 넘기면 거기서 멈춘다(나머지는 다음 실행에서)."""
import os, subprocess, sys, tempfile, time
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PREFIX = ("bg_", "cg_", "st_", "sd_", "chr_", "orpheia_", "title_")
W2X = Path(os.environ.get("W2X", ROOT / "waifu2x"))
MODEL = os.environ.get("W2X_MODEL", "models-cunet")
args = sys.argv[1:]
budget = 40.0
if "--minutes" in args:
    i = args.index("--minutes"); budget = float(args[i + 1]); del args[i:i + 2]
count_only = "--count" in args
args = [a for a in args if a != "--count"]
pick = set(args)

def todo():
    out = []
    for f in sorted((ROOT / "assets").glob("*.webp")):
        if not f.name.startswith(PREFIX) or (pick and f.stem not in pick):
            continue
        with Image.open(f) as im:
            if max(im.size) <= 1300:
                out.append(f)
    gen = ROOT / "assets/gen"  # 방금 생성한 것부터
    out.sort(key=lambda f: not (gen / f"{f.stem}.png").exists())
    return out

def run(src, dst):
    subprocess.run([str(W2X / "waifu2x-ncnn-vulkan"), "-i", str(src), "-o", str(dst), "-n", "1", "-s", "2",
                    "-m", str(W2X / MODEL), "-f", "png"], check=True, capture_output=True, timeout=1800)

def main():
    if count_only:
        print(len(todo())); return
    t0 = time.time(); files = todo(); done = 0
    print("키울 그림", len(files))
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        for f in files:
            if (time.time() - t0) / 60 > budget:
                print("시간 예산 끝, 남은 것", len(files) - done); break
            png = ROOT / "assets/gen" / f"{f.stem}.png"
            im = Image.open(png if png.exists() else f)
            alpha = im.getchannel("A") if im.mode in ("RGBA", "LA") and im.getchannel("A").getextrema()[0] < 255 else None
            src, dst = tmp / "in.png", tmp / "out.png"
            im.convert("RGB").save(src)
            s = time.time()
            try:
                run(src, dst)
            except Exception as e:
                print("실패", f.name, e); continue
            big = Image.open(dst).convert("RGB")
            if alpha is not None:
                big = big.convert("RGBA"); big.putalpha(alpha.resize(big.size, Image.LANCZOS))
                big.save(f, "WEBP", quality=88, method=5)
            else:
                big.save(f, "WEBP", quality=85, method=5)
            done += 1
            print(f"키움 {f.name} {im.size}→{big.size} {time.time() - s:.0f}s")
    print("끝", done, "장")

if __name__ == "__main__":
    main()
