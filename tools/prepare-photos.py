#!/usr/bin/env python3
"""실사진 · 상장 스캔본 · 깃허브 리드미 스크린샷을 사이트용 이미지로 굽는다.

make-mockups.py 와 달리 Pillow 가 필요하다. 빌드 스텝이 아니라 소스가 바뀔 때만
한 번 돌리는 저작 도구다. 결과물은 저장소에 커밋하므로 사이트를 보는 쪽에는
아무 의존성도 생기지 않는다.

    python3 -m pip install pillow
    python3 tools/prepare-photos.py --src ~/Downloads

원본 사진과 PDF 는 저장소에 두지 않는다. --src 아래에서 파일 이름으로 찾는다.
사이트 전체가 흑 · 백 · 회색이므로 모든 결과물을 그레이스케일로 바꾼다.
"""

import argparse
import io
import os
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

try:
    from PIL import Image, ImageEnhance, ImageOps
except ImportError:
    sys.exit('Pillow 가 필요하다:  python3 -m pip install pillow')

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'images'

# 카드 도판의 규격. 사진 비율이 제각각이라 2:3 으로 자르면 글자가 잘린다.
# 검은 판 위에 사진을 얹고 아래쪽을 캡션 자리로 비워 두는 편이 안전하다.
PLATE = (700, 1050)
PLATE_BOX = (620, 620)   # 사진이 들어갈 최대 크기
PLATE_ZONE = 670         # 이 높이 안에서 세로 가운데 정렬한다. 아래는 캡션 자리
                         # 카드 실제 폭이 200px 안팎이라 캡션이 두 줄로 접힌다.
                         # 아래 3분의 1을 비워 두지 않으면 글자가 사진 위로 올라온다.


# --- 원본 -------------------------------------------------------------------
# 깃허브 리드미에 올라와 있는 스크린샷. 주소가 바뀌면 리드미에서 다시 가져온다.
ARTIFACT_SHOT = ('https://github.com/user-attachments/assets/'
                 'daae55c2-ecbc-49e3-83c5-e69ef8c30efe')

PHOTOS = {
    'umc_board':   'IMG_7925.jpg',   # POP+IT 부스 배너와 대상 보드
    'umc_close':   'IMG_7923.JPG',   # 대상 보드 근접
    'injeju':      'IMG_7539.jpg',   # In-Jeju Challenge 최우수상 총장상
    'smart':       'IMG_6872.JPG',   # S.M.A.R.T. 토너먼트 최우수상
}

PDFS = {
    'umc_daesang':    '동국대학교_SpringBoot_칸_이권형_대상.pdf',
    'umc_completion': '동국대학교_SpringBoot_칸_이권형_수료증.pdf',
}


def find(src: Path, name: str) -> Path:
    """--src 아래에서 파일 이름으로 원본을 찾는다."""
    hit = next((p for p in src.rglob(name)), None)
    if hit is None:
        sys.exit(f'원본을 찾지 못했다: {name}  (--src {src})')
    return hit


def load_url(url: str) -> Image.Image:
    req = urllib.request.Request(url, headers={'User-Agent': 'prepare-photos'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return Image.open(io.BytesIO(r.read()))


def load_pdf(path: Path) -> Image.Image:
    """맥의 sips 로 PDF 첫 장을 PNG 로 뽑는다. 별도 설치가 필요 없다."""
    with tempfile.TemporaryDirectory() as tmp:
        png = Path(tmp) / 'page.png'
        subprocess.run(
            ['sips', '-s', 'format', 'png', '--resampleWidth', '2000',
             str(path), '--out', str(png)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return Image.open(png).copy()


def mono(im: Image.Image) -> Image.Image:
    """그레이스케일로 바꾸고 대비를 아주 조금만 올린다.
    많이 올리면 밝은 상패에서 글자 주변이 하얗게 날아간다."""
    im = ImageOps.exif_transpose(im).convert('L')
    return ImageEnhance.Contrast(im).enhance(1.08)


def crop_frac(im: Image.Image, box) -> Image.Image:
    """(left, top, right, bottom) 를 0~1 비율로 받아 자른다."""
    w, h = im.size
    l, t, r, b = box
    return im.crop((int(w * l), int(h * t), int(w * r), int(h * b)))


def cover(im: Image.Image, size, anchor=0.5) -> Image.Image:
    """size 를 꽉 채우도록 자른다. anchor 0 이면 위(또는 왼쪽) 기준이다."""
    tw, th = size
    w, h = im.size
    scale = max(tw / w, th / h)
    nw, nh = round(w * scale), round(h * scale)
    im = im.resize((nw, nh), Image.LANCZOS)
    x = int((nw - tw) * .5)
    y = int((nh - th) * anchor)
    return im.crop((x, y, x + tw, y + th))


def plate(im: Image.Image) -> Image.Image:
    """검은 2:3 판 위에 사진을 통째로 얹는다. 글자가 잘리지 않는다."""
    im = im.copy()
    im.thumbnail(PLATE_BOX, Image.LANCZOS)
    canvas = Image.new('L', PLATE, 0)
    x = (PLATE[0] - im.width) // 2
    y = (PLATE_ZONE - im.height) // 2
    canvas.paste(im, (x, y))
    return canvas


def save(im: Image.Image, rel: str, quality=82) -> None:
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    im.convert('L').save(path, 'JPEG', quality=quality,
                         optimize=True, progressive=True)
    kb = path.stat().st_size / 1024
    print(f'{rel:44s} {im.size[0]:>5} × {im.size[1]:<5} {kb:6.0f} KB')


def scan(im: Image.Image, rel: str, width=1600) -> None:
    """클릭하면 뜨는 원본 보기용. 글자를 읽을 수 있을 만큼만 크게 둔다."""
    im = im.copy()
    im.thumbnail((width, width), Image.LANCZOS)
    save(im, rel, quality=78)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default='~/Downloads',
                    help='원본 사진과 PDF 가 들어 있는 폴더 (하위까지 찾는다)')
    args = ap.parse_args()
    src = Path(os.path.expanduser(args.src))

    photo = {k: mono(Image.open(find(src, v))) for k, v in PHOTOS.items()}
    pdf = {k: mono(load_pdf(find(src, v))) for k, v in PDFS.items()}

    # --- WORK -------------------------------------------------------------
    # Artifact 는 리드미에 진료 화면 스크린샷이 있다. 위를 기준으로 잘라
    # 상단 탭 바를 남긴다.
    shot = mono(load_url(ARTIFACT_SHOT))
    save(cover(shot, (1200, 800), anchor=0), 'work/artifact-medical-ai-3x2.jpg')
    save(cover(shot, (1920, 1080), anchor=0), 'work/artifact-hero-16x9.jpg', 86)

    # POP-IT 은 리드미에 화면 캡처가 없다. 데모데이 부스 사진의 배너 쪽을 쓴다.
    booth = crop_frac(photo['umc_board'], (0, .017, 1, .336))
    save(cover(booth, (1200, 800)), 'work/pop-it-3x2.jpg')

    # --- CREDENTIALS 카드 --------------------------------------------------
    save(plate(crop_frac(photo['umc_close'], (.114, .079, 1, .943))),
         'cred/umc-award-2x3.jpg')
    save(plate(crop_frac(photo['injeju'], (0, .045, 1, .90))),
         'cred/injeju-award-2x3.jpg')
    save(plate(crop_frac(photo['smart'], (0, 0, .985, 1))),
         'cred/smart-award-2x3.jpg')

    # --- 클릭하면 뜨는 원본 -------------------------------------------------
    scan(pdf['umc_daesang'], 'cred/scan/umc-daesang.jpg')
    scan(pdf['umc_completion'], 'cred/scan/umc-completion.jpg')
    scan(crop_frac(photo['injeju'], (0, .045, 1, .90)), 'cred/scan/injeju.jpg')
    scan(crop_frac(photo['smart'], (0, 0, .985, 1)), 'cred/scan/smart.jpg')


if __name__ == '__main__':
    main()
