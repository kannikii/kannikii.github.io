#!/usr/bin/env python3
"""실사진 · 상장 스캔본 · 깃허브 리드미 스크린샷을 사이트용 이미지로 굽는다.

make-mockups.py 와 달리 Pillow 가 필요하다. 빌드 스텝이 아니라 소스가 바뀔 때만
한 번 돌리는 저작 도구다. 결과물은 저장소에 커밋하므로 사이트를 보는 쪽에는
아무 의존성도 생기지 않는다.

    python3 -m pip install pillow
    python3 tools/prepare-photos.py --src ~/Downloads

원본 사진과 PDF 는 저장소에 두지 않는다. --src 아래에서 파일 이름으로 찾는다.
사진과 스크린샷은 원본 색을 그대로 살린다. 화면을 채우는 목업 도판(SVG)만
흑백이고, 실제로 찍거나 캡처한 것은 색이 있는 편이 알아보기 쉽다.
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
    from PIL import Image, ImageOps
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

LAB = (1200, 750)        # 사이드 프로젝트 카드. 16:10
WORK = (1200, 800)       # 메인 프로젝트 카드. 3:2
HERO = (1920, 1080)      # 상세 페이지 히어로. 16:9


# --- 원본 -------------------------------------------------------------------
# 깃허브 리드미에 올라와 있는 스크린샷. 주소가 바뀌면 리드미에서 다시 가져온다.
SHOTS = {
    # kannikii/artifact-medical-ai — AI 분석 결과와 Grad-CAM 히트맵
    'artifact':  'daae55c2-ecbc-49e3-83c5-e69ef8c30efe',
    # kannikii/handcraftedboard — LEYNDELL NOTICE 워드마크
    'hcb':       '3ee1eb7f-c258-4d68-b2d0-34ff8e046c66',
    # kannikii/PS — solved.ac 프로필
    'ps':        '01c821d9-8153-460b-92ff-0c4b97d3da62',
    # kannikii/XmasTreeNote — 트리 메인 화면
    'xmas':      'af286b26-1d57-435d-873c-8a9a9c5b4f43',
}
SHOT_URL = 'https://github.com/user-attachments/assets/'

PHOTOS = {
    'popit_web':   'popit-web-main.jpg',     # POP+IT 웹 서비스 메인 화면 캡처
    'speakflow_web': 'speakflow-web-main.png',  # SpeakFlow 웹 앱 메인 화면 캡처
    'artifact_ai': 'artifact-gradcam.jpg',   # 리드미의 AI 분석 결과 · 히트맵 한 쌍
    'umc_close':   'IMG_7923.JPG',        # 대상 보드 근접
    'injeju':      'IMG_7539.jpg',        # In-Jeju Challenge 최우수상 총장상
    'smart':       'IMG_6872.JPG',        # S.M.A.R.T. 토너먼트 최우수상
}

PDFS = {
    'umc_daesang':    '동국대학교_SpringBoot_칸_이권형_대상.pdf',
    'umc_completion': '동국대학교_SpringBoot_칸_이권형_수료증.pdf',
    'oss_jangryeo':   '스픽플로우상장_이권형.pdf',
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
    """맥의 Quick Look 으로 PDF 첫 장을 PNG 로 뽑는다. 별도 설치가 필요 없다.

    sips 를 쓰지 않는다. 페이지에 /Rotate 가 걸린 PDF 를 sips 는 무시해서
    상장이 옆으로 눕고 위쪽이 잘린다. Quick Look 은 회전을 반영해 그린다.
    """
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp)
        subprocess.run(
            ['qlmanage', '-t', '-s', '2400', '-o', str(out), str(path)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        png = next(out.glob('*.png'), None)
        if png is None:
            sys.exit(f'PDF 를 그리지 못했다: {path}')
        return Image.open(png).copy()


def prep(im: Image.Image) -> Image.Image:
    """회전 정보를 반영하고 RGB 로 맞춘다. 투명한 PNG 는 흰 바탕에 올린다."""
    im = ImageOps.exif_transpose(im)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(bg, im)
    return im.convert('RGB')


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


def edge_color(im: Image.Image) -> tuple:
    """네 모서리의 평균색. 화면 캡처는 여백이 단색이라 이 값이 잘 맞는다."""
    w, h = im.size
    pts = [(1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2)]
    px = [im.getpixel(p) for p in pts]
    return tuple(sum(c[i] for c in px) // len(px) for i in range(3))


def contain(im: Image.Image, size, bg=None) -> Image.Image:
    """잘라 내지 않고 통째로 넣는다. 남는 자리는 가장자리 색으로 채운다.

    화면 캡처를 3:2 로 잘라 내면 아래쪽 캡션이 날아간다. 여백을 두는 편이
    내용을 알아보기 쉽다."""
    im = im.copy()
    im.thumbnail(size, Image.LANCZOS)
    canvas = Image.new('RGB', size, bg or edge_color(im))
    canvas.paste(im, ((size[0] - im.width) // 2, (size[1] - im.height) // 2))
    return canvas


def plate(im: Image.Image) -> Image.Image:
    """검은 2:3 판 위에 사진을 통째로 얹는다. 글자가 잘리지 않는다."""
    im = im.copy()
    im.thumbnail(PLATE_BOX, Image.LANCZOS)
    canvas = Image.new('RGB', PLATE, (0, 0, 0))
    x = (PLATE[0] - im.width) // 2
    y = (PLATE_ZONE - im.height) // 2
    canvas.paste(im, (x, y))
    return canvas


def save(im: Image.Image, rel: str, quality=82) -> None:
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    im.convert('RGB').save(path, 'JPEG', quality=quality,
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

    photo = {k: prep(Image.open(find(src, v))) for k, v in PHOTOS.items()}
    pdf = {k: prep(load_pdf(find(src, v))) for k, v in PDFS.items()}
    shot = {k: prep(load_url(SHOT_URL + v)) for k, v in SHOTS.items()}

    # --- WORK -------------------------------------------------------------
    # 카드는 분석 결과와 Grad-CAM 히트맵을 나란히 둔 한 쌍을 쓴다. 두 장이
    # 짝이라 잘라 내면 뜻이 사라진다. 여백을 두고 통째로 넣는다.
    save(contain(photo['artifact_ai'], WORK), 'work/artifact-medical-ai-3x2.jpg')
    # 히어로는 진료 화면 전체다. 원본이 커서 잘라도 또렷하다.
    save(cover(shot['artifact'], HERO, anchor=0), 'work/artifact-hero-16x9.jpg', 86)

    # POP-IT 은 서비스 메인 화면 캡처를 쓴다. 위에서부터 헤더 · 히어로 ·
    # 검색 바까지가 한눈에 들어오는 구간이다.
    web = photo['popit_web']
    save(cover(crop_frac(web, (0, 0, 1, .68)), WORK, anchor=0),
         'work/pop-it-3x2.jpg')
    save(cover(crop_frac(web, (0, 0, 1, .576)), HERO, anchor=0),
         'work/pop-it-hero-16x9.jpg', 86)

    # --- SIDE PROJECTS ----------------------------------------------------
    # 리드미에 화면이 있는 저장소만 실제 이미지를 쓴다. 나머지는 목업 SVG 다.
    # SpeakFlow 는 배포된 웹 앱 캡처다. 헤더부터 히어로, 기능 카드 세 장까지
    # 한 화면에 들어간다.
    save(cover(photo['speakflow_web'], LAB, anchor=.35), 'lab/speakflow-16x10.jpg')

    save(contain(shot['hcb'], LAB, bg=(255, 255, 255)),
         'lab/handcraftedboard-16x10.jpg')
    save(cover(crop_frac(shot['ps'], (0, 0, .75, 1)), LAB),
         'lab/problem-solving-16x10.jpg')
    save(cover(crop_frac(shot['xmas'], (0, .145, 1, .618)), LAB),
         'lab/xmas-tree-note-16x10.jpg')

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
    scan(pdf['oss_jangryeo'], 'cred/scan/oss-project.jpg')
    scan(crop_frac(photo['injeju'], (0, .045, 1, .90)), 'cred/scan/injeju.jpg')
    scan(crop_frac(photo['smart'], (0, 0, .985, 1)), 'cred/scan/smart.jpg')


if __name__ == '__main__':
    main()
