# KWON HYEONG LEE — Portfolio

패션 매거진의 에디토리얼 레이아웃 문법을 차용한 개발자 포트폴리오 정적 사이트.
빌드 스텝이 없다. `index.html` 을 브라우저에서 열면 그대로 동작하고, GitHub Pages에도 저장소 루트가 그대로 배포된다.

---

## 구조

```
/
├─ index.html                 메인 (HERO · WORK · LAB · WRITING · CREDENTIALS · CONTACT)
├─ admin.html                 관리자 모드 (색인 제외 · 토큰으로 직접 커밋)
├─ work/
│  ├─ pop-it.html             POP-IT 상세
│  ├─ artifact-medical-ai.html  Artifact Medical AI 상세
│  └─ speakflow.html          SpeakFlow 상세 (사이드 프로젝트)
├─ assets/
│  ├─ css/
│  │  ├─ reset.css            최소 리셋 + prefers-reduced-motion 대응
│  │  ├─ tokens.css           CSS 변수 (색 · 레이아웃 · 타이포 스케일 · 모션)
│  │  ├─ style.css            실제 스타일
│  │  └─ admin.css            관리자 모드 전용 (사이트 토큰을 그대로 쓴다)
│  ├─ js/
│  │  ├─ main.js              헤더 · 오버레이 · 네비 · 캐러셀 · 리빌 · TOP · 메일 복사 · 상장 보기
│  │  └─ admin.js             관리자 모드 (GitHub Contents API · DOM 편집 · 커밋)
│  ├─ favicon.svg             파비콘 (흰 바탕 · L 타이포)
│  ├─ apple-touch-icon.png    iOS 홈 화면 아이콘 180 × 180
│  └─ images/
│     ├─ og-1200x630.png      Open Graph 이미지
│     ├─ hero-16x9.svg        히어로 목업
│     ├─ work/                WORK 카드 화면 캡처 · 상세 히어로 · 아키텍처 목업
│     ├─ lab/                 LAB 카드용 이미지 (실제 캡처 4장 + 목업 5장, 현재 7장 노출)
│     ├─ writing/             WRITING 썸네일 목업 3장
│     └─ cred/                수상 사진 3장 + scan/ 상장 원본 4장
├─ tools/
│  ├─ make-mockups.py         목업 SVG 생성 (표준 라이브러리만)
│  └─ prepare-photos.py       실사진 · 상장 스캔본 가공 (Pillow 필요)
├─ favicon.ico                구형 브라우저용 파비콘 (16 · 32 · 48)
├─ .nojekyll                  GitHub Pages의 Jekyll 처리를 끈다
└─ .github/workflows/deploy-pages.yml
```

의존성이 없으므로 `npm install` 도 빌드 명령도 필요하지 않다.
로컬에서 볼 때는 `index.html` 을 더블클릭하거나, 원하면 `python3 -m http.server` 로 띄운다.

---

## 이미지

이미지는 두 종류다. 개발 화면을 옮긴 **SVG 목업**과, 실제 사진 · 화면 캡처 ·
상장 스캔본을 구운 **JPEG**이다.

**둘 다 칼라다.** 목업은 어두운 에디터 바탕에 구문 강조를 얹은 코드 화면이라 실제 캡처와
나란히 놓아도 어긋나지 않는다. 사진과 캡처는 원본 색을 그대로 살린다. 서비스 화면과
상패는 색이 있어야 무엇인지 알아볼 수 있기 때문이다. 구성도만 본문 사이에 끼는 그림이라
밝은 바탕에 계층별 강조색을 쓴다.

사이트 자체의 색(글자 · 배경 · 선)은 여전히 흑 · 백 · 회색만 쓴다. 둥근 모서리와
이모지를 쓰지 않는 규칙도 그대로다.

| 위치 | 파일 | 규격 | 내용 |
|---|---|---|---|
| 히어로 | `assets/images/hero-16x9.svg` | 1920 × 1080 | IDE 전체 화면 (탐색기 · 탭 · 에디터 · 터미널) |
| WORK 카드 | `assets/images/work/*-3x2.jpg` | 1200 × 800 | 데모데이 부스 사진 · 리드미 스크린샷 |
| 상세 히어로 | `assets/images/work/*-hero-16x9.{jpg,svg}` | 1920 × 1080 | 스크린샷 또는 IDE 목업 |
| 상세 아키텍처 | `assets/images/work/*-arch-16x9.svg` | 1600 × 900 | 계층 구성도 |
| LAB 카드 (목업) | `assets/images/lab/*-16x10.svg` | 940 × 588 | 에디터 · 터미널 · diff |
| LAB 카드 (캡처) | `assets/images/lab/*-16x10.jpg` | 1200 × 750 | 배포된 웹 앱 · 리드미에 화면이 있는 저장소 |
| WRITING 썸네일 | `assets/images/writing/*-1x1.svg` | 800 × 800 | 글 첫 화면 (데스크톱 한 줄 = 3장) |
| CREDENTIALS 카드 | `assets/images/cred/*-2x3.jpg` | 700 × 1050 | 검은 판에 얹은 상패 · 상장 사진 |
| 상장 원본 | `assets/images/cred/scan/*.jpg` | 긴 변 1600 | 카드를 누르면 뜨는 전체 보기 |
| Open Graph | `assets/images/og-1200x630.png` | 1200 × 630 | 1.91:1 |

히어로 위에는 흰 제목이 얹히므로 `.hero::after` 로 아래쪽을 눌러 글자를 읽히게 한다.
목업이 칼라 코드 화면이라 단색일 때보다 뒤가 복잡해서 그라데이션을 더 깊게 잡았다.
같은 이유로 `.hero__img` 와 `.detail-hero img` 는 위를 기준으로 잘라(`object-position`)
목업 창의 상단 바가 보이게 하고, 768px 미만에서는 왼쪽 기준으로 바꿔 파일 트리가 남게 한다.

SpeakFlow 상세 히어로만 목업을 쓴다. 실제 서비스 캡처를 깔면 앱 자체의 제목과 사이트
제목이 겹친다. 서비스 캡처는 LAB 카드 쪽에 있다.

### 다시 만들기

```
python3 tools/make-mockups.py                      # 목업 SVG
python3 -m pip install pillow
python3 tools/prepare-photos.py --src ~/Downloads  # 사진 · 상장
```

`make-mockups.py` 는 표준 라이브러리만 쓰므로 설치할 것이 없다. 문구 · 코드 줄 · 수치는
스크립트 하단의 호출부에서 바꾼다.

`prepare-photos.py` 는 Pillow가 필요하고, 원본 사진과 PDF를 `--src` 아래에서 **파일 이름으로**
찾는다. 원본은 저장소에 두지 않는다. 스크립트 상단의 `PHOTOS` · `PDFS` 에 이름이 적혀 있다.
PDF는 맥의 Quick Look(`qlmanage -t`)으로 첫 장만 PNG로 뽑는다. `sips` 는 쓰지 않는다.
페이지에 `/Rotate` 가 걸린 상장 PDF 를 `sips` 가 무시해서 옆으로 눕고 위쪽이 잘린다.

| 키 | 원본 파일 이름 | 쓰이는 곳 |
|---|---|---|
| `popit_web` | `popit-web-main.jpg` | POP-IT 카드 · 상세 히어로 |
| `speakflow_web` | `speakflow-web-main.png` | SpeakFlow LAB 카드 (배포된 웹 앱 메인) |
| `artifact_ai` | `artifact-gradcam.jpg` | Artifact 카드 (분석 결과 · Grad-CAM 한 쌍) |
| `umc_close` | `IMG_7923.JPG` | UMC 10th 대상 카드 |
| `injeju` | `IMG_7539.jpg` | In-Jeju Challenge 카드 · 상장 원본 |
| `smart` | `IMG_6872.JPG` | WITHUS S.M.A.R.T 카드 · 상장 원본 |
| `umc_daesang` | `동국대학교_SpringBoot_칸_이권형_대상.pdf` | UMC 10th 대상 상장 원본 |
| `umc_completion` | `동국대학교_SpringBoot_칸_이권형_수료증.pdf` | UMC 10th 수료증 원본 |
| `oss_jangryeo` | `스픽플로우상장_이권형.pdf` | 오픈소스프로젝트 경진대회 장려상 원본 |

`SHOTS` 에 적힌 네 개는 깃허브 리드미에 올라와 있는 스크린샷이라 실행할 때마다 내려받는다.
리드미 이미지가 있는 저장소만 실제 화면을 쓰고(handcraftedboard · Problem Solving ·
XmasTreeNote), 없는 저장소는 목업 SVG 를 그대로 둔다.

두 가지 맞춤 방식이 있다. `cover()` 는 규격을 꽉 채우도록 잘라 내고, `contain()` 은
자르지 않고 통째로 넣은 뒤 남는 자리를 가장자리 색으로 채운다. 캡션이나 짝이 되는 그림이
잘리면 뜻이 사라지는 경우에 `contain()` 을 쓴다.

상장 사진은 비율이 제각각이라 2:3으로 자르면 한글이 잘린다. 그래서 검은 2:3 판 위에 사진을
통째로 얹고(`plate()`) 아래 3분의 1을 캡션 자리로 비워 둔다. 카드 실제 폭이 200px 안팎이라
이 여백이 없으면 캡션이 사진 위로 올라온다.

실제 스크린샷이나 사진으로 바꾸고 싶으면 같은 경로에 같은 비율의 파일을 넣고
`index.html` · `work/*.html` 의 `src` 를 바꾼다. `width` / `height` 속성은
레이아웃 이동을 막으므로 반드시 함께 수정한다.
히어로만 `fetchpriority="high"` 이고 나머지는 전부 `loading="lazy"` 다.

### 파비콘

흰 바탕에 검은 **L** 한 글자다. 로고와 같은 디도네 계열이지만 웹폰트를 쓰지 않고
`assets/favicon.svg` 안에 사각형 네 개로 직접 그렸다. 폰트 CDN이 늦거나 막혀도
탭 아이콘이 빈 채로 남지 않는다. 세 페이지 모두 `<head>` 에서 ICO · SVG ·
apple-touch-icon 세 줄로 참조한다.

모양을 바꾸면 `favicon.ico` 와 `assets/apple-touch-icon.png` 도 같은 SVG에서 다시 굽는다.

---

## 콘텐츠 수정

**섹션별 위치는 전부 `index.html` 안에 있다.** 주석으로 구획이 나뉘어 있다.

- **WORK** — `.work__grid` 안의 `<a class="card">` 두 개. 링크는 `work/pop-it.html`, `work/artifact-medical-ai.html`.
- **SIDE PROJECTS** — `.lab__track` 첫 카드만 상세 페이지(`work/speakflow.html`)로 가고 나머지는 GitHub로 간다.
- **LAB** — `.lab__track` 안의 카드. 6~10개를 권장한다. 마지막 카드가 화면 오른쪽에서 잘려 보여야 "더 있다"는 신호가 된다.
  `assets/images/lab/` 에는 지금 화면에 없는 그림도 남아 있다. 관리자 모드에서 카드를 다시 넣을 때 고르라고 둔 것이다.
- **WRITING** — `.writing__grid` 안의 카드. 태그는 최대 2개까지만 노출한다.
  데스크톱에서 한 줄에 3개가 들어가므로 **3개만 둔다.** 4번째를 넣으면 두 번째 줄이 생긴다.
  지금은 세 장 모두 Notion 공개 페이지다. velog 글을 섞어도 된다. 링크 도메인은 썸네일
  하단에도 적혀 있으므로 글을 바꾸면 `tools/make-mockups.py` 의 `build_writing()` 에서
  `source` 도 같이 바꾼다.
- **CREDENTIALS** — 수상 카드 3개와 그 아래 `dl.cred__list` 목록.
  카드는 `<a>` 가 아니라 `<button data-lightbox="…">` 다. 누르면 상장 원본이 전체 화면으로 뜬다.
  속성 네 개로 내용을 정한다. `data-lightbox` (원본 경로), `data-lightbox-alt`,
  `data-lightbox-caption`, 그리고 선택인 `data-lightbox-href` · `data-lightbox-href-text`
  (프로젝트 저장소 링크). 같은 속성을 목록 안의 작은 `.cred__scan` 버튼에도 쓴다.
  JS가 없으면 라이트박스는 `hidden` 인 채로 남고 버튼은 아무 일도 하지 않는다.
- **CONTACT** — 이메일 주소는 세 군데에 있다. `.contact__mail`, `메일 보내기` 버튼의 `mailto:`, `주소 복사` 버튼의 `data-copy-email`.

**네비 라벨**은 `assets/js/main.js` 최상단의 `NAV` 배열 한 곳에서 관리한다.
HTML에도 같은 내용이 들어 있어 JS 없이도 링크가 동작하고, 로드 시 배열 값이 라벨과 링크를 덮어쓴다.
섹션을 추가하려면 `index.html` 에 `id` 를 가진 `<section>` 을 만들고 `NAV` 배열에 항목을 더하면 활성 표시와 스크롤이 함께 연결된다.

**서체**는 `assets/css/tokens.css` 의 세 줄만 바꾸면 사이트 전체가 바뀐다.

```css
--font-logo:    "Bodoni Moda", …;   /* 로고 워드마크 */
--font-display: "Jost", …;          /* 섹션 제목 · 네비 · 버튼 (라틴 대문자 전용) */
--font-body:    "Pretendard Variable", …;  /* 본문 · 한글 전체 */
```

`--font-display` 스택 마지막에 Pretendard가 있어 한글이 섞이면 자동으로 폴백된다. 순서를 바꾸지 않는다.

---

## 관리자 모드

`admin.html` 을 열면 브라우저에서 바로 내용을 고치고 저장소에 커밋할 수 있다.
**공개 사이트에는 아무 영향이 없다.** 방문자가 받는 것은 지금과 똑같은 정적 HTML 이고,
JS 가 꺼져 있어도, `file://` 로 열어도 그대로 보인다.

### 어떻게 동작하나

데이터를 JSON 으로 빼지 않았다. JSON 을 두면 화면을 그릴 때 `fetch()` 가 필요한데,
`file://` 에서는 막히고 JS 없이도 보여야 한다는 조건과도 어긋난다. 대신 관리자 쪽에서

1. GitHub Contents API 로 해당 HTML 을 내려받고,
2. `DOMParser` 로 읽어 카드 · 텍스트 · 이미지를 고친 다음,
3. 다시 문자열로 만들어 같은 경로에 커밋한다.

즉 손으로 HTML 을 고치는 일을 화면에서 대신 해 주는 도구다. 결과물은 여전히 평범한 HTML 이다.

### 토큰

깃허브의 **fine-grained personal access token** 을 쓴다. 만들 때

- **Repository access** — 이 저장소 하나만 고른다.
- **Permissions** — `Contents: Read and write` 하나면 된다.
- 만료일을 짧게 잡고, 필요하면 다시 만든다.

토큰은 이 브라우저의 `localStorage` 에만 남고 깃허브 API 외에는 어디로도 가지 않는다.
`기억하기` 를 끄면 탭을 닫을 때 사라진다. 남의 기기에서는 켜지 않는다.
`admin.html` 은 `<meta name="robots" content="noindex, nofollow">` 라 검색에 잡히지 않지만
주소를 아는 사람은 열 수 있다. 토큰이 없으면 아무것도 못 하므로 **토큰이 곧 자물쇠**다.

### 할 수 있는 일

편집 대상은 `index.html` 과 `work/` 아래 상세 페이지 세 개다.

- **카드** — WORK · SIDE PROJECTS · WRITING · CREDENTIALS 네 묶음. 순서 바꾸기(↑ ↓),
  삭제, 태그 · 제목 · 설명 · 메타 · 링크 수정, 썸네일 교체.
- **텍스트** — 카드 밖의 모든 문단 · 제목 · 목록 · 코드 블록. 상세 페이지에 써 둔
  본문을 여기서 고친다.
- **이미지** — 저장소에 이미 있는 그림 중에서 고르거나, 파일을 올려 쓴다.
  올린 파일은 기본값으로 `assets/images/uploads/` 아래에 커밋된다.
  고른 뒤 `width` · `height` 속성을 실제 크기로 함께 고쳐 레이아웃 이동을 막는다.

저장 전에 `미리보기` 로 바뀐 화면을 확인할 수 있고, `되돌리기` 는 마지막으로 불러온
상태로 되돌린다. 커밋 메시지는 직접 적는다.

### 블로그 글 불러오기

링크를 넣으면 주소의 슬러그를 풀어 제목 자리에 채우고 오늘 날짜를 넣는다.
**글 내용을 실제로 가져오지는 않는다.** velog 가 다른 출처의 요청을 허용하지 않아
(CORS) 브라우저에서는 본문을 읽을 수 없다. 자동으로 채우려면 RSS 를 읽는
GitHub Actions 작업을 따로 두어야 한다. 지금은 제목과 설명을 직접 고치면 된다.

### 저장할 때 생기는 정규화

브라우저가 HTML 을 읽었다가 다시 쓰면 표기가 조금 바뀐다. `<path …/>` 가
`<path …></path>` 로, `data-nav` 같은 속성이 `data-nav=""` 로, `&lsaquo;` 같은
이름 문자가 실제 글자로 바뀌는 식이다. **보이는 결과는 달라지지 않는다.**
첫 저장에서 이 차이가 한꺼번에 나오지 않도록 저장소의 네 파일을 미리 같은 형태로 맞춰 두었다.
그래서 관리자 모드로 저장하면 실제로 고친 줄만 커밋에 남는다.

---

## 확인이 필요한 내용

아래 항목은 공개 저장소와 블로그에서 가져온 값이다. 실제와 다르면 수정한다.

- WORK 두 프로젝트의 **역할·팀 규모·기간**
- CREDENTIALS의 **수상 월**. 연도는 GitHub 프로필 기준이고 월은 확인하지 못했다.
- LinkedIn 프로필, 이력서 PDF, Programmers 프로필, Discord는 공개 URL이 없어 링크로 넣지 않았다.
  Discord는 `.contact__handle` 에 계정명만 텍스트로 둔다.
  추가하려면 `index.html` 의 `.contact__links` 와 오버레이의 `.gnb__links` 두 곳에 같이 넣는다.
  동작하지 않는 링크는 두지 않는다.

---

## 배포

`main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml` 이 저장소 루트를 그대로 GitHub Pages에 올린다.
빌드 과정이 없으므로 워크플로가 실패할 여지가 거의 없다.
저장소 설정에서 Pages의 소스를 **GitHub Actions** 로 두어야 한다.

---

## 레이아웃 메모

프롬프트 수치를 그대로 따르되, 실제 문자열 폭 때문에 아래 네 가지는 조정했다.

- **콘텐츠 폭 1030px** 은 패딩을 제외한 값이다. `.container` 의 `max-width` 는 `1030px + 좌우 거터` 로 잡았다.
- **LAB 트랙**만 컨테이너 밖으로 빼서 오른쪽 거터를 주지 않았다. 그래야 235px 카드 네 장이 정확히 1030px을 채우면서 다섯 번째 카드가 화면 끝에서 잘린다.
- **CREDENTIALS 제목 컬럼**은 `235px` 고정이 아니라 `minmax(235px, max-content)` 다. `CREDENTIALS` 라는 단어가 48px에서 235px보다 넓어 카드와 겹쳤다.
- **600px 미만 헤더**에서는 가운데 로고와 우측 CONTACT·햄버거가 겹쳐서, 절대 배치를 풀고 둘째 줄 오른쪽으로 내렸다.

---

## 환경별 대응

맥 · 윈도우 · 모바일에서 같은 모양이 나오도록 아래를 맞춰 두었다. 지우면 특정 환경에서만 깨진다.

- **서체 폴백** — 윈도우에는 `-apple-system` 도 Apple SD Gothic Neo도 없다. 폰트 CDN이 막힌 망에서도
  한글이 나오도록 `--font-body` · `--font-display` 스택 끝에 `Segoe UI` → `Malgun Gothic` → `Noto Sans KR` 을 둔다.
- **`100svh` 폴백** — 히어로 높이와 `body` 의 최소 높이는 `100vh` 를 먼저 쓰고 `100svh` 로 덮어쓴다.
  구형 브라우저는 앞줄을, 모바일 사파리·크롬은 뒷줄을 읽는다. 순서를 바꾸지 않는다.
- **한글 줄바꿈** — `body` 에 `word-break: keep-all` 과 `overflow-wrap: break-word` 를 건다.
  어절 중간이 끊기지 않으면서 URL 같은 긴 문자열은 컨테이너를 밀어내지 않는다.
  코드 블록만 `word-break: normal` 로 되돌려 가로 스크롤을 쓴다.
- **가로 스크롤 트랙** — LAB 트랙과 768px 미만의 CREDENTIALS 카드에 `-webkit-overflow-scrolling: touch`
  (iOS 관성 스크롤)와 `overscroll-behavior-x: contain` (트랙 끝에서 페이지가 따라 움직이는 것 차단)을 준다.
- **폰트 크기 자동 확대 차단** — `reset.css` 의 `text-size-adjust: 100%` 가 iOS 가로 전환 시
  본문만 커지는 현상을 막는다.

---

## 디자인 규칙

지키면 사이트가 흐트러지지 않는다.

- 사이트의 색(글자 · 배경 · 선)은 흑 · 백 · 회색만 쓴다. UI 에 포인트 컬러를 넣지 않는다.
  색은 이미지 안에만 있다 — 사진 · 화면 캡처는 원본 그대로, 목업 SVG 는 에디터의 구문 색이다.
- 둥근 모서리를 쓰지 않는다. 원형 소셜 아이콘만 예외다.
- 카드 hover는 제목 밑줄만이다. 이미지 확대, 그림자, 색 반전을 넣지 않는다.
- 폰트 크기는 `tokens.css` 의 스케일 변수에서 가져온다. 섹션마다 즉흥적으로 지정하지 않는다.
- 색상값을 하드코딩하지 않는다. 전부 `var(--c-*)` 를 쓴다.
- 동작하지 않는 UI를 두지 않는다. 서버가 없으므로 문의 폼 대신 `mailto` 를 쓴다.
- 모바일에서 가로 스크롤이 생기면 `overflow-x: hidden` 으로 덮지 말고 원인을 고친다.
