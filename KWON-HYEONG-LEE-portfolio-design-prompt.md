# KWON HYEONG LEE — 에디토리얼 포트폴리오 사이트 제작 프롬프트

> Claude Code에 그대로 붙여넣어 쓰는 지시서다.
> `<<< ... >>>` 로 표시된 부분만 본인 내용으로 채우면 된다.
> 초기 구축은 **§1 ~ §14**, 이후 수정 작업은 **§15 템플릿**을 사용한다.

---

## 0. 이 문서의 근거

Vogue Korea(vogue.co.kr) 메인 페이지를 직접 열어 스크롤·인터랙션·DOM 실측한 값을 기반으로 작성했다. 추정이 아니라 계측값이므로, 아래 수치는 그대로 구현하면 된다.

| 항목 | 실측값 |
|---|---|
| 본문 폰트 | `Pretendard Variable` (오픈소스, 그대로 사용 가능) |
| 제목/네비 폰트 | `VogueAvantGarde` = **ITC Avant Garde Gothic** 커스텀 (유료 → 대체 필요) |
| 로고 폰트 | Didone 계열 커스텀 Didot (유료 → 대체 필요) |
| 콘텐츠 컬럼 폭 | 1030px, 카드 간격 30px |
| 섹션 제목 | 48px / weight 700 / uppercase |
| 헤더 | `position: fixed`, 높이 219px, **아래로 스크롤 시 숨김 · 위로 스크롤 시 복귀** |
| 햄버거 메뉴 | 전체화면 검정 오버레이, 메뉴 60px / weight 700 / letter-spacing 6px / `#888` |
| 밴드 배경색 | `#F1F1F1` |
| 카드 hover | **제목에 밑줄만** 생김 (이미지 확대 없음) |

**법적 주의 — 반드시 지킬 것**
- Vogue의 워드마크·로고·사진·유료 폰트 파일은 **절대 복제하지 않는다.**
- 우리가 가져오는 것은 *레이아웃 문법과 편집 리듬*이지 브랜드 자산이 아니다.
- 폰트는 전부 OFL 라이선스 무료 대체 폰트를 쓴다 (§3).

---

## 1. 과제 정의

개발자 개인 포트폴리오 **정적 사이트**를 만든다. 패션 매거진(Vogue Korea)의 에디토리얼 레이아웃 문법을 그대로 차용하되, 콘텐츠는 전부 개발 포트폴리오다.

- 사이트 주인: **KWON HYEONG LEE** (백엔드 / 클라우드 지향 개발자)
- 톤: 흰 배경, 검정 텍스트, 사진 중심, 장식 최소, 여백 과감
- 목적: 채용 담당자가 3분 안에 "무엇을 만들었고 무엇을 아는 사람인지" 파악

---

## 2. 기술 스택 및 제약

**반드시 지킬 제약**

- 순수 **HTML + CSS + Vanilla JS**. 빌드 스텝 없음. `npm install` 없음.
- CSS 프레임워크(Tailwind, Bootstrap) **사용 금지**. 직접 작성한다.
- JS 라이브러리(jQuery, GSAP, Swiper 등) **사용 금지**. IntersectionObserver / scroll-snap 등 표준 API로 해결한다.
- 외부 리소스는 **폰트 CDN만** 허용.
- `index.html` 을 브라우저에서 더블클릭해도 동작해야 한다 (file:// 프로토콜에서 깨지지 않도록 절대경로 `/` 사용 금지, 상대경로 사용).
- GitHub Pages에 그대로 배포 가능해야 한다.

**이유**: 포트폴리오 사이트 자체가 결과물이므로, 의존성 없이 코드만으로 완성도를 보여주는 편이 유리하다. 나중에 Astro/11ty로 옮기더라도 HTML·CSS가 그대로 이식된다.

**파일 구조**

```
/
├─ index.html
├─ work/
│  ├─ project-a.html          # 메인 프로젝트 1 상세
│  └─ project-b.html          # 메인 프로젝트 2 상세
├─ assets/
│  ├─ css/
│  │  ├─ reset.css
│  │  ├─ tokens.css           # CSS 변수만 모아둔 파일
│  │  └─ style.css            # 실제 스타일
│  ├─ js/
│  │  └─ main.js              # 헤더·오버레이·스크롤·캐러셀·리빌 전부
│  └─ images/
│     ├─ hero.jpg             # 사용자가 교체할 자리
│     ├─ work/
│     ├─ writing/
│     └─ placeholder/         # SVG 플레이스홀더
└─ README.md                  # 이미지 교체 규격 · 콘텐츠 수정 방법
```

---

## 3. 폰트 전략 (중요)

Vogue의 실제 폰트는 유료라 쓸 수 없다. 아래 무료 대체 폰트를 **CSS 변수 한 줄로 교체 가능하게** 설계한다.

| 역할 | Vogue 원본 | 사용할 무료 대체 | 비고 |
|---|---|---|---|
| 로고 워드마크 | 커스텀 Didot | **Bodoni Moda** (Google Fonts, 가변 opsz) | `font-optical-sizing: auto` 로 큰 사이즈에서 헤어라인이 얇아진다 — Vogue 로고 느낌의 핵심 |
| 섹션 제목 · 네비 · 버튼 | ITC Avant Garde Gothic | **Jost** (1순위) / **Poppins** (2순위) | 둘 다 기하학적 산세리프. 육안 비교 후 결정 |
| 본문 · 한글 전체 | Pretendard Variable | **Pretendard Variable 그대로** | OFL 오픈소스, Vogue Korea와 동일 |

```html
<!-- <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Jost:wght@400;500;600;700&display=swap">
<link rel="stylesheet" crossorigin
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
```

```css
:root{
  /* 이 세 줄만 바꾸면 사이트 전체 서체가 바뀐다 */
  --font-logo:    "Bodoni Moda", "Playfair Display", "Times New Roman", serif;
  --font-display: "Jost", "Poppins", "Pretendard Variable", sans-serif;
  --font-body:    "Pretendard Variable", Pretendard, -apple-system, sans-serif;
}
```

- 로고에는 `font-optical-sizing: auto;` 를 **반드시** 넣는다. 이게 없으면 Didone 특유의 얇은 세로획이 안 나온다.
- `--font-display` 는 라틴 대문자 전용이다. 한글이 섞이면 자동으로 Pretendard로 폴백되도록 스택 마지막에 Pretendard를 둔다.
- 나중에 ITC Avant Garde Gothic을 정식 구매하거나 OFL 클론(TeX Gyre Adventor 등)을 찾으면 `--font-display` 한 줄만 교체한다.

---

## 4. 디자인 토큰 (`tokens.css`)

```css
:root{
  /* Color */
  --c-bg:        #FFFFFF;
  --c-ink:       #000000;
  --c-band:      #F1F1F1;   /* 회색 밴드 (Vogue 실측값) */
  --c-meta:      #767676;   /* 날짜 / by 작성자 */
  --c-muted:     #888888;   /* 오버레이 메뉴 비활성 텍스트 */
  --c-line:      #E5E5E5;
  --c-invert:    #FFFFFF;

  /* Layout */
  --container:   1030px;    /* Vogue 실측 콘텐츠 폭 */
  --gutter:      clamp(20px, 4vw, 48px);
  --gap:         30px;      /* 카드 간격 실측값 */
  --header-h:    219px;     /* 데스크톱 */
  --header-h-sm: 120px;     /* 모바일 */

  /* Section rhythm */
  --sec-pt:      clamp(64px, 9vw, 120px);
  --sec-pb:      clamp(64px, 9vw, 120px);

  /* Motion */
  --ease:        cubic-bezier(.22,.61,.36,1);
  --dur:         .3s;
}
```

**타이포 스케일 (전부 실측 기반)**

| 용도 | size | weight | letter-spacing | line-height |
|---|---|---|---|---|
| 로고 1행 (이름) | `clamp(28px, 4.2vw, 58px)` | 400 | `.02em` | 1.0 |
| 로고 2행 (부제) | `clamp(13px, 1.4vw, 22px)` | 500 | `.34em` | 1.0 |
| 헤더 네비 | 16px | 700 | `.1em` (1.6px) | 1.0 |
| 섹션 제목 | `clamp(32px, 4.2vw, 48px)` | 700 | `-.01em` | 1.0 |
| 히어로 타이틀 | `clamp(26px, 3.8vw, 48px)` | 500 | `-.02em` | 1.2 |
| 대형 카드 제목 | `clamp(22px, 2.4vw, 32px)` | 600 | `-.002em` | 1.37 |
| 소형 카드 제목 | 20px | 600 | `-.002em` | 1.37 |
| 카테고리 라벨 | 14px | 500 | `0` | 1.4 |
| 메타(날짜·태그) | 14px | 400 | `0` | 1.4 |
| 오버레이 메뉴 | `clamp(38px, 6vw, 60px)` | 700 | `.1em` (6px) | 1.0 |

---

## 5. 전역 레이아웃

### 5-1. 헤더 (`<header class="site-header">`)

Vogue 구조를 그대로 따른다. 3층 구조, 전체 폭, 흰 배경.

```
┌──────────────────────────────────────────────────────────┐
│                    KWON HYEONG LEE                 [CONTACT] ☰ │   ← 1행
│                       PORTFOLIO                              │   ← 2행(로고 부제)
│                                                              │
│      WORK    LAB    WRITING    CREDENTIALS    CONTACT        │   ← 3행(네비)
└──────────────────────────────────────────────────────────┘
```

- 로고 블록은 **가운데 정렬**, `CONTACT` 버튼과 햄버거는 **오른쪽 절대 배치**.
- 로고 2행 구조 = Vogue의 `VOGUE / KOREA` 락업을 그대로 대응시킨 것.
  - 1행: `KWON HYEONG LEE` — `--font-logo`, Didone
  - 2행: `PORTFOLIO` — `--font-display`, 자간 넓게
  - 로고 클릭 시 최상단으로 스무스 스크롤
- **CONTACT 버튼**: `background:#000; color:#fff; border-radius:0; height:36px; padding:0 14px; font: 600 16px var(--font-display);`
  클릭하면 `#contact` 섹션으로 스무스 스크롤. (Vogue의 "구독하기" 버튼을 그대로 치환)
- **네비 5개** — 각 섹션으로 스무스 스크롤:

| 네비 라벨 | 이동 대상 | Vogue 원본 위치 |
|---|---|---|
| `WORK` | `#work` | FASHION |
| `LAB` | `#lab` | BEAUTY |
| `WRITING` | `#writing` | LIVING |
| `CREDENTIALS` | `#credentials` | CULTURE |
| `CONTACT` | `#contact` | VIDEO |

> 라벨 문구는 취향이므로 `main.js` 상단 배열 하나로 관리해 쉽게 바꿀 수 있게 한다.

**헤더 스크롤 동작 (Vogue 실측 그대로)**

```
scrollY 증가(아래로) + scrollY > headerHeight  →  transform: translateY(-100%)
scrollY 감소(위로)                              →  transform: translateY(0)
scrollY === 0                                  →  translateY(0), 그림자/보더 제거
scrollY > 0                                    →  하단에 1px #E5E5E5 보더
transition: transform .3s var(--ease)
```
- `requestAnimationFrame` 으로 스로틀링한다. 스크롤 이벤트마다 직접 DOM을 만지지 않는다.
- 모바일에서는 네비 3행을 감추고 로고 + CONTACT + 햄버거만 남긴다 (`--header-h-sm`).

**네비 활성 상태**
- `IntersectionObserver` (`rootMargin: '-50% 0px -50% 0px'`) 로 현재 뷰포트 중앙에 있는 섹션을 감지해 해당 네비에 `.is-active` 부여.
- 활성 표시는 밑줄 1px 또는 `opacity: 1` vs `.5` 중 하나만 — 색을 바꾸지 않는다.

**스무스 스크롤 오프셋**
- 헤더가 fixed이므로 `scroll-margin-top: var(--header-h)` 를 각 `<section>`에 준다. JS로 좌표 계산하지 않는다.
- `html { scroll-behavior: smooth; }` 를 쓰되, `@media (prefers-reduced-motion: reduce)` 에서는 `auto`로 되돌린다.

### 5-2. 햄버거 전체화면 오버레이 (`.gnb`)

Vogue 실측 구조를 그대로 재현한다.

```
┌───────────────────────────────────────────────────────────┐
│  KWON HYEONG LEE                                       ✕  │
│  PORTFOLIO                                                │
│                                                           │
│   WORK                         [ SEARCH ______________🔍 ]│
│   LAB                                                     │
│   WRITING                       GitHub                    │
│   CREDENTIALS                   Velog / Blog              │
│   CONTACT                       Resume (PDF)              │
│                                 ─────────────────────     │
│        (거대한 고스트 워터마크 "KH")   Based in Seoul       │
│                                 ◯ ◯ ◯   (소셜 아이콘)      │
└───────────────────────────────────────────────────────────┘
```

구현 스펙:
- `position: fixed; inset: 0; background: #000; z-index: 9999;`
- 열림/닫힘은 `opacity` + `visibility` 트랜지션 `0.3s`. `display:none` 토글 금지 (애니메이션이 끊긴다).
- 메뉴 항목: `--font-display`, `clamp(38px,6vw,60px)`, weight 700, `letter-spacing:.1em`, 색 `#888888` → hover/focus 시 `#FFFFFF` (`transition: color .2s`).
- **배경 고스트 워터마크**: `KH` 를 `--font-logo`로 `font-size: 60vh`, `color: rgba(255,255,255,.06)`, 화면 하단에 걸치도록 `position:absolute; bottom:-15%;`, `pointer-events:none`, `user-select:none`.
- 오른쪽 컬럼: 검색창(선택 — 정적 사이트라 실제 검색이 없다면 **넣지 말 것**), 외부 링크 목록, 1px 구분선, `Based in Seoul` 문구, 원형 소셜 아이콘(GitHub / LinkedIn / Velog) 인라인 SVG.
- **접근성 필수**:
  - 햄버거 버튼에 `aria-expanded`, `aria-controls="gnb"`, `aria-label="메뉴 열기"`
  - 열릴 때 `document.body.style.overflow='hidden'` (스크롤 락), 닫을 때 복구
  - `Escape` 키로 닫기
  - 포커스 트랩: 열리면 첫 링크로 포커스 이동, Tab이 오버레이 밖으로 나가지 않게
  - 닫으면 햄버거 버튼으로 포커스 복귀
- 메뉴 항목 클릭 → 오버레이 닫힘 → 해당 섹션으로 스크롤 (닫힘 애니메이션 끝난 뒤 스크롤)

### 5-3. TOP 버튼

- 우측 하단 고정. `↑` 화살표 SVG + `TOP` 텍스트 (12px, `--font-display`, `letter-spacing:.1em`).
- `scrollY > 600` 일 때만 `opacity:1`, 그 외 `opacity:0; pointer-events:none`.
- 클릭 시 최상단 스무스 스크롤.

---

## 6. 섹션별 상세 스펙

### § HERO — 첫 화면 (`#hero`)

Vogue 메인 비주얼과 동일한 문법.

- 전체 폭(full-bleed), 높이 `min(calc(100svh - var(--header-h)), 720px)`, 최소 `420px`.
- 이미지: `object-fit: cover; object-position: center;`
- 하단 40%에 그라디언트 오버레이: `linear-gradient(to top, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 55%)`
- 텍스트는 **하단에서 위로 약 22% 지점, 가운데 정렬**, 전부 흰색:
  ```
  BACKEND ENGINEER  |  2026
  Seoul 기반, 서버와 클라우드를 만듭니다
  ```
  - 1행(eyebrow): 15px, `--font-display`, `letter-spacing:.06em`, 구분자는 `|` 문자 + 좌우 8px 여백
  - 2행(타이틀): `clamp(26px,3.8vw,48px)`, weight 500, `--font-body`(한글이므로)
- **목업 처리**: 사용자가 이미지를 직접 넣을 예정이므로 `assets/images/hero.jpg` 를 참조하되, 파일이 없을 때를 대비해 부모 요소에 `background:#E8E8E8` 를 깔고, `assets/images/placeholder/hero-1920x1080.svg` (회색 바탕 + 중앙에 `HERO 1920 × 1080` 텍스트)를 생성해 기본값으로 넣는다.
- 교체 규격을 `README.md` 에 명시: **1920 × 1080px 이상, JPG, 500KB 이하 권장**

### § WORK — 메인 프로젝트 2개 (`#work`)

Vogue의 `TODAY'S STORIES` 자리. 단, 카드 2개를 **크게** 배치한다.

```
SELECTED WORK
┌─────────────────────┐  ┌─────────────────────┐
│                     │  │                     │
│     이미지 3:2       │  │     이미지 3:2       │
│                     │  │                     │
└─────────────────────┘  └─────────────────────┘
Spring Boot · AWS         React · Node.js
POP-IT                    LootMap
단기 상업공간 임대 마켓플레이스   던전 드랍 아이템 검색 서비스
2026.03 —  |  팀 5명       2025.11 — 2026.02  |  개인
```

- 섹션 제목: `SELECTED WORK`, 48px / 700 / uppercase, 아래 여백 15px 후 그리드
- 그리드: `grid-template-columns: 1fr 1fr; gap: 40px;`
- 카드 이미지 비율: **3:2** (`aspect-ratio: 3/2; object-fit: cover;`)
- 카드 내부 순서 (Vogue 카드 해부 구조 그대로):
  1. 이미지
  2. 카테고리 라벨 — 기술 스택을 `·` 로 연결 (14px, weight 500, 검정)
  3. 제목 — 프로젝트명 (대형 카드 제목 스케일)
  4. 한 줄 설명 (16px, `--c-meta`)
  5. 메타 — `기간 | 역할` (14px, `--c-meta`, 구분자 `|` 좌우 8px)
- **카드 전체가 링크**다. `<a>` 로 감싸고 `display:block`.
- **hover**: 제목에만 `text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 1px;` — 이미지 확대·그림자·색 변화 전부 금지. (Vogue 실측 동작)
- 클릭 시 `work/project-a.html`, `work/project-b.html` 로 이동.
- 이미지 규격: **1200 × 800px**

`<<< 채워넣기: 메인 프로젝트 2개의 이름 / 한 줄 설명 / 기술 스택 / 기간 / 역할 >>>`

### § LAB — 토이 프로젝트 가로 캐러셀 (`#lab`)

Vogue의 `BEST STORIES` 자리. 가로 스크롤 캐러셀 + 좌우 화살표.

```
SIDE PROJECTS                                        ←   →
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌──┈
│ img │ │ img │ │ img │ │ img │ │ im┈
└─────┘ └─────┘ └─────┘ └─────┘ └──┈
Redis     Docker    Python    Spring
제목       제목       제목      제목
2026.02   2026.01   2025.12   2025.11
```

- 섹션 제목 왼쪽, **화살표 버튼 2개는 같은 줄 오른쪽 끝**에 배치 (Vogue와 동일).
  화살표는 원형 배경 없이 얇은 선 아이콘 + 양옆 24px 라인.
- 카드 폭 고정 `235px`, gap `30px`, 이미지 비율 **16:10**.
- 트랙: `display:flex; overflow-x:auto; scroll-snap-type: x mandatory;` 각 카드 `scroll-snap-align:start;`
  - 스크롤바 숨김: `scrollbar-width:none; &::-webkit-scrollbar{display:none}`
  - 화살표 클릭 = `track.scrollBy({left: ±(235+30)*2, behavior:'smooth'})`
  - 트랙 양 끝에 도달하면 해당 화살표 `opacity:.3; pointer-events:none`
- **회색 밴드 디테일 (Vogue의 인상적인 부분)**: 섹션 하단에 `--c-band` 풀블리드 밴드를 깔되, **밴드의 윗변이 카드 이미지 하단보다 35px 위에서 시작**한다. 이미지가 밴드를 살짝 덮는 형태가 되어 레이어감이 생긴다.
  - 구현: 섹션을 `position:relative`, 밴드는 `::before` 로 `position:absolute; left:50%; transform:translateX(-50%); width:100vw; top:<이미지 하단-35px>; bottom:0; background:var(--c-band); z-index:-1;`
- 카드 수: 6~10개 권장. 마지막 카드가 화면 오른쪽에서 **잘려 보이도록** 해 "더 있다"는 신호를 준다.
- 링크: 상세 페이지가 없으면 GitHub 저장소로 `target="_blank" rel="noopener"`.
- 이미지 규격: **940 × 588px**

`<<< 채워넣기: 토이 프로젝트 6~10개의 이름 / 기술 태그 / 날짜 / 링크 >>>`

### § WRITING — 기술 블로그 (`#writing`)

Vogue의 `MUST READ` 자리. 4열 그리드.

```
WRITING
┌────┐ ┌────┐ ┌────┐ ┌────┐
│ 1:1│ │ 1:1│ │ 1:1│ │ 1:1│
└────┘ └────┘ └────┘ └────┘
Spring        Redis        AWS         Kubernetes
글 제목이       글 제목이      글 제목이     글 제목이
두 줄까지       두 줄까지      두 줄까지     두 줄까지
2026.09.11    2026.09.08   2026.08.30  2026.08.21
```

- 그리드: `repeat(4, 1fr); gap: 30px;`
- 이미지 비율 **1:1** (정사각형). Vogue 실측값이다.
- 카드 내부 순서 — **사용자 요구사항 그대로**:
  1. 썸네일 이미지
  2. **카테고리 태그** (14px, weight 500, 검정) — 글 작성 시 붙인 태그를 그대로 사용 (`Spring`, `Redis`, `AWS`, `Kubernetes`, `Spring Boot`, `JPA` 등)
  3. **제목** (20px, weight 600, 최대 3줄 후 `-webkit-line-clamp:3`)
  4. **날짜** (14px, `--c-meta`, `YYYY.MM.DD` 형식)
- 태그가 2개 이상이면 `·` 로 연결하되 최대 2개까지만 노출한다.
- 카드 클릭 → 실제 블로그 글 URL로 새 탭 이동 (Velog/Tistory/GitHub Pages 등).
- 섹션 제목 오른쪽 끝에 `MORE ›` 링크 (블로그 메인으로). 14px, weight 700, `--font-display`.
- 이미지 규격: **800 × 800px**

`<<< 채워넣기: 글 4~8개의 태그 / 제목 / 날짜 / URL >>>`

### § CREDENTIALS — 자격증 · 수상 (`#credentials`)

Vogue의 `PEOPLE NOW` 자리. **왼쪽 제목 + 오른쪽 세로형 카드 3개**, 전체가 회색 밴드 위에 놓인다.

```
┌─ 풀블리드 #F1F1F1 밴드 ──────────────────────────────────┐
│                                                          │
│  CREDENTIALS   ┌──────┐ ┌──────┐ ┌──────┐                │
│  NOW           │      │ │      │ │      │                │
│                │ 2:3  │ │ 2:3  │ │ 2:3  │                │
│  자격증 · 수상 ·  │      │ │      │ │      │                │
│  활동 이력      │ 자격증 │ │ 수상  │ │ 활동  │  ← 하단 오버레이 │
│                │ 정보처리│ │ 해커톤 │ │ UMC  │                │
│                └──────┘ └──────┘ └──────┘                │
└──────────────────────────────────────────────────────────┘
```

- 밴드: `width:100vw` 풀블리드, `background: var(--c-band)`, 상하 패딩 `clamp(56px,7vw,96px)`
- 레이아웃: `grid-template-columns: 235px 1fr; gap: 65px;`
- 왼쪽 제목 블록:
  - `CREDENTIALS` / `NOW` 를 **두 줄로 강제 개행** (Vogue의 `PEOPLE / NOW` 대응), 48px / 700 / line-height 1.0
  - 그 아래 부제 16px `--c-meta`: `지금까지 쌓아온 자격증과 이력`
- 오른쪽 카드 3개: `grid-template-columns: repeat(3, 1fr); gap: 30px;`
  - 이미지 비율 **2:3 세로형**
  - 이미지 위에 `linear-gradient(to top, rgba(0,0,0,.6), transparent 55%)` 오버레이
  - 텍스트는 카드 **하단 안쪽 20px**에 흰색으로 얹는다:
    - 1행: 분류 라벨 (14px) — `자격증` / `수상` / `활동`
    - 2행: 내용 (20px, weight 600, 최대 3줄)
- 자격증 인증서 이미지가 없다면 **단색 배경 + 로고/아이콘 SVG**로 카드를 구성해도 된다. 사진이 없다고 비워두지 않는다.
- 항목이 3개보다 많으면 카드 아래에 텍스트 리스트를 2열로 추가한다 (`취득일 — 항목명` 형태, 14px).
- 이미지 규격: **700 × 1050px**

`<<< 채워넣기: 자격증/수상 3개(대표) + 나머지 목록 >>>`

### § CONTACT — 최하단 (`#contact`)

헤더의 `CONTACT` 버튼과 네비 `CONTACT` 가 도착하는 지점. **검정 배경**으로 Vogue 푸터를 계승한다.

```
┌─ 검정 배경 ─────────────────────────────────────────────┐
│                                                         │
│                  KWON HYEONG LEE                        │
│                     PORTFOLIO                           │
│                                                         │
│              kwnnh0124@dgu.ac.kr                        │
│          [ 메일 보내기 ]   [ 주소 복사 ]                   │
│                                                         │
│      GitHub  |  Velog  |  LinkedIn  |  Resume (PDF)     │
│                                                         │
│              ◯ ◯ ◯  (소셜 아이콘)                        │
│                                                         │
│   © 2026 KWON HYEONG LEE. ALL RIGHTS RESERVED.          │
└─────────────────────────────────────────────────────────┘
```

- 전부 가운데 정렬, 흰 텍스트.
- 로고 락업을 푸터에서 **한 번 더** 반복한다 (Vogue 동일 패턴). 크기는 헤더의 약 70%.
- **이메일 표시**: `--font-display`, `clamp(20px,2.6vw,32px)`, 흰색. 클릭 가능한 `<a href="mailto:...">`.
- **버튼 2개**:
  - `메일 보내기` — 흰 배경 / 검정 글씨, `border-radius:0`, height 44px
    `href="mailto:<<<이메일>>>?subject=포트폴리오%20문의&body=..."`
  - `주소 복사` — 투명 배경 / 흰 1px 테두리 / 흰 글씨
    `navigator.clipboard.writeText()` 로 복사, 성공 시 버튼 텍스트를 1.5초간 `복사됨`으로 바꿨다 되돌린다. `clipboard` API 실패 시 `document.execCommand('copy')` 폴백.
- **폼은 기본적으로 넣지 않는다.** 정적 사이트에는 서버가 없어 폼이 동작하지 않으므로, 동작하지 않는 UI를 두는 것보다 `mailto` 가 정직하다.
  - 폼을 굳이 원하면 **Formspree / Web3Forms** 무료 엔드포인트를 `action` 에 넣는 방식만 허용하고, `README.md` 에 연동 방법을 적는다. 이 경우 이름/이메일/메시지 3개 필드, 전송 중 버튼 비활성화, 성공·실패 메시지 인라인 표시를 반드시 구현한다.
- 구분선 `|` 로 연결된 링크 행 (14px, 흰색, `letter-spacing:.02em`)
- 저작권 행: 12px, `letter-spacing:.08em`, uppercase, `rgba(255,255,255,.6)`

`<<< 채워넣기: 이메일 주소 / GitHub URL / Velog URL / LinkedIn URL / 이력서 PDF 경로 >>>`

---

## 7. 프로젝트 상세 페이지 (`work/project-a.html`)

메인 카드 클릭 시 이동하는 페이지. 헤더/오버레이/푸터는 `index.html`과 **완전히 동일한 마크업**을 복사해 쓴다 (빌드 스텝이 없으므로 중복을 감수한다. 대신 CSS/JS는 공유).

구조:

1. **히어로** — 프로젝트 대표 이미지 풀블리드 (높이 `clamp(360px,52vh,560px)`), 하단 그라디언트 + 프로젝트명 오버레이
2. **개요 블록** — 2열 그리드
   - 왼쪽: 한 문단 요약 (18px, line-height 1.8)
   - 오른쪽: 정의 리스트 — `기간 / 역할 / 팀 규모 / 기술 스택 / 배포 / 링크(GitHub, 데모)`
3. **문제 → 해결 → 결과** — 3개의 소제목 블록. 소제목은 `--font-display` 24px / 700 / uppercase
4. **아키텍처** — 다이어그램 이미지 1장 (없으면 플레이스홀더) + 캡션 14px `--c-meta`
5. **핵심 구현 3~5개** — 각각 `제목 / 2~3문장 설명 / 코드 블록(선택)`
   - 코드 블록: `background:#F8F8F8; border-left:2px solid #000; padding:20px; font: 13px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace; overflow-x:auto;`
   - 하이라이팅 라이브러리 쓰지 않는다. 흑백 코드가 이 사이트 톤에 맞는다.
6. **회고 / 배운 점** — 3~5개 불릿
7. **이전/다음 프로젝트 네비게이션** — 좌우 링크
8. 푸터(=`#contact` 섹션과 동일)

상세 페이지의 본문 최대 폭은 `720px` 로 좁힌다 (읽기 편한 길이). 이미지·코드 블록만 `1030px` 까지 넓힐 수 있다.

---

## 8. 인터랙션 · 모션 스펙

모든 모션은 **절제**한다. Vogue는 화려한 애니메이션이 없고, 그게 고급스러움의 근원이다.

| # | 동작 | 스펙 |
|---|---|---|
| 1 | 헤더 숨김/복귀 | `translateY` `.3s var(--ease)`, rAF 스로틀 |
| 2 | 네비 스무스 스크롤 | `scroll-behavior:smooth` + `scroll-margin-top` |
| 3 | 네비 활성 표시 | IntersectionObserver, `rootMargin:'-50% 0px -50% 0px'` |
| 4 | 햄버거 오버레이 | opacity+visibility `.3s`, 스크롤 락, ESC, 포커스 트랩 |
| 5 | 카드 hover | 제목 밑줄만. `.15s` |
| 6 | 섹션 진입 리빌 | `opacity:0→1`, `translateY(24px→0)`, `.6s var(--ease)`, 자식 stagger `60ms` |
| 7 | 캐러셀 | `scrollBy` + scroll-snap, 끝 도달 시 화살표 비활성 |
| 8 | TOP 버튼 | `scrollY>600` 에서 fade-in |
| 9 | 이미지 로딩 | 전부 `loading="lazy"` (히어로 제외 — 히어로는 `fetchpriority="high"`) |

**`prefers-reduced-motion: reduce` 대응 필수**

```css
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{
    animation-duration:.01ms!important;
    transition-duration:.01ms!important;
    scroll-behavior:auto!important;
  }
}
```
리빌 애니메이션도 이 경우 JS에서 곧바로 `.is-visible` 을 붙여 버린다.

---

## 9. 반응형

| 브레이크포인트 | 변경 |
|---|---|
| `≥1280px` | 기준 레이아웃 |
| `1024–1279px` | WRITING 4열 → 3열 |
| `768–1023px` | WORK 2열 유지(간격 24px), WRITING 3열 → 2열, CREDENTIALS 제목/카드 세로 적층, 헤더 네비 행 숨김 |
| `480–767px` | 전부 1열, LAB·CREDENTIALS는 가로 스크롤로 전환, 헤더 높이 `--header-h-sm`, 로고 축소 |
| `<480px` | 좌우 거터 20px 고정, 히어로 텍스트 하단 정렬, 버튼 full-width |

- 모바일에서 좌우 스크롤이 **절대** 생기면 안 된다. `overflow-x:hidden` 으로 덮지 말고 원인(풀블리드 `100vw` + 스크롤바)을 `width:100%` + 음수 마진 방식으로 해결한다.
- 터치 디바이스에는 hover가 없으므로 `@media (hover:hover)` 안에서만 hover 스타일을 정의한다.

---

## 10. 이미지 플레이스홀더 규칙

사용자가 나중에 실제 이미지를 넣을 예정이므로, **레이아웃이 먼저 완성되도록** SVG 플레이스홀더를 생성한다.

- `assets/images/placeholder/` 아래에 비율별 SVG 생성:
  `hero-16x9.svg`, `work-3x2.svg`, `lab-16x10.svg`, `writing-1x1.svg`, `cred-2x3.svg`
- 각 SVG 내용: `#E8E8E8` 바탕, 중앙에 `#9A9A9A` 로 `1200 × 800` 같은 **권장 픽셀 규격 텍스트**
- `<img>` 에는 반드시 `width`/`height` 속성을 명시해 CLS(레이아웃 이동)를 막는다.
- `README.md` 에 교체 표를 만든다:

| 위치 | 경로 | 권장 규격 | 비율 |
|---|---|---|---|
| 히어로 | `assets/images/hero.jpg` | 1920×1080 | 16:9 |
| WORK 카드 | `assets/images/work/*.jpg` | 1200×800 | 3:2 |
| LAB 카드 | `assets/images/lab/*.jpg` | 940×588 | 16:10 |
| WRITING 썸네일 | `assets/images/writing/*.jpg` | 800×800 | 1:1 |
| CREDENTIALS | `assets/images/cred/*.jpg` | 700×1050 | 2:3 |

---

## 11. 접근성 · SEO · 성능

**접근성**
- `<header> <nav> <main> <section> <footer>` 시맨틱 태그 사용
- 각 `<section>` 에 `aria-labelledby` 로 섹션 제목 `<h2>` 연결
- 최상단에 skip link (`본문 바로가기`), 포커스 시에만 노출
- 모든 `<img>` 에 의미 있는 `alt` (장식용이면 `alt=""`)
- `:focus-visible` 스타일 필수 — `outline: 2px solid #000; outline-offset: 2px;` (검정 배경 위에서는 흰색)
- 색 대비: `#767676` on `#FFF` = 4.54:1 (통과), `#888888` on `#000` = 5.93:1 (통과)

**SEO**
- `<title>`: `KWON HYEONG LEE — Backend / Cloud Engineer Portfolio`
- `<meta name="description">`, `lang="ko"`
- Open Graph: `og:title`, `og:description`, `og:image`(1200×630), `og:type=website`, `og:url`
- `twitter:card = summary_large_image`
- JSON-LD `Person` 스키마 (name, jobTitle, url, sameAs[GitHub, LinkedIn], alumniOf)
- 상세 페이지마다 고유한 `<title>`, `description`, OG 이미지

**성능**
- 히어로 이미지: `<link rel="preload" as="image">` + `fetchpriority="high"`
- 나머지 이미지: `loading="lazy" decoding="async"`
- CSS·JS는 각각 1개 파일. 인라인 `<style>` `<script>` 금지 (JSON-LD 제외)
- Lighthouse 목표: Performance ≥ 95, Accessibility = 100, Best Practices ≥ 95, SEO = 100

---

## 12. 코드 작성 규칙

- CSS 클래스 네이밍: **BEM 변형** — `.card`, `.card__title`, `.card--feature`
- CSS 순서: reset → tokens → base → layout → components → sections → utilities → media queries
- 하드코딩 색상값 금지. 전부 `var(--c-*)` 사용
- 매직 넘버에는 주석으로 근거 명시 (`/* Vogue 실측 카드 간격 */`)
- JS는 IIFE 또는 `type="module"` 로 전역 오염 방지
- JS 각 기능은 독립 함수로 분리: `initHeader()`, `initOverlay()`, `initNav()`, `initCarousel()`, `initReveal()`, `initTopButton()`, `initCopyEmail()`
- 해당 DOM이 없으면 조용히 return (상세 페이지에서 캐러셀 초기화가 깨지지 않도록)
- `console.log` 남기지 않는다

---

## 13. 작업 순서 (이 순서대로 진행할 것)

1. 파일 구조 + `reset.css` + `tokens.css` 생성, 폰트 로딩 확인
2. 헤더(로고 락업 + CONTACT 버튼 + 네비) 마크업 & 스타일 — **여기서 로고 타이포가 Vogue 느낌이 나는지 먼저 확인받는다**
3. 햄버거 전체화면 오버레이 (접근성 포함)
4. 히어로
5. WORK 섹션
6. LAB 캐러셀 (회색 밴드 디테일 포함)
7. WRITING 그리드
8. CREDENTIALS 밴드 섹션
9. CONTACT 푸터 + 메일/복사 기능
10. 헤더 스크롤 숨김/복귀 + 네비 활성화 + 스무스 스크롤 + TOP 버튼
11. 스크롤 리빌 애니메이션
12. 반응형 (1280 → 1024 → 768 → 480 순서로 내려가며)
13. 프로젝트 상세 페이지 2개
14. 접근성/SEO/성능 점검 + `README.md` 작성

**각 단계 완료 시마다**
- 데스크톱(1440px) / 태블릿(768px) / 모바일(390px) 3개 뷰포트에서 스크린샷을 찍어 확인한다
- 가로 스크롤바가 생기지 않았는지 확인한다
- 커밋 메시지는 `feat: add hero section` 형태의 Conventional Commits 로 작성한다

---

## 14. 하지 말 것 (안티패턴)

- ❌ Vogue의 로고·사진·폰트 파일을 복제하거나 다운로드해서 넣기
- ❌ CSS 프레임워크, UI 라이브러리, 애니메이션 라이브러리 도입
- ❌ 카드 hover에 이미지 확대(`scale`), 그림자, 색 반전 추가 — 원본에 없다
- ❌ 둥근 모서리(`border-radius`) — 이 디자인은 전부 직각이다. 소셜 아이콘 원형만 예외
- ❌ 회색·파랑 등 포인트 컬러 추가 — 흑/백/회색 3색만 쓴다
- ❌ 섹션마다 다른 폰트 크기 즉흥 지정 — §4 스케일 표를 따른다
- ❌ 동작하지 않는 UI(검색창, 서버 없는 폼) 배치
- ❌ `overflow-x:hidden` 으로 레이아웃 문제 덮기
- ❌ 이모지 사용
- ❌ `!important` 남발

---

## 15. 이후 수정용 프롬프트 템플릿

작업이 끝난 뒤 Claude Code에 붙여 쓸 수 있는 문장들이다.

**콘텐츠 교체**
```
assets/images/work/ 에 넣은 실제 이미지 파일명으로 index.html의 WORK 섹션
카드 2개 이미지를 교체하고, 프로젝트명과 설명을 아래 내용으로 바꿔줘.
플레이스홀더 SVG 참조는 전부 제거해줘.
[프로젝트 정보 붙여넣기]
```

**섹션 추가**
```
WRITING 섹션과 CREDENTIALS 섹션 사이에 "EXPERIENCE" 섹션을 추가해줘.
기존 섹션 제목 타이포 스케일(48px/700/uppercase)과 컨테이너 폭(1030px),
카드 간격(30px)을 그대로 따르고, 좌측에 연도 우측에 내용이 오는
2열 타임라인 형태로 만들어줘. 헤더 네비에도 EXPERIENCE를 추가하고
스무스 스크롤·활성 표시가 동작하도록 연결해줘.
```

**타이포 교체**
```
--font-display 를 Jost에서 Poppins로 바꾸고,
바뀐 폰트 폭에 맞춰 섹션 제목과 오버레이 메뉴의 letter-spacing만
시각적으로 재조정해줘. 다른 값은 건드리지 마.
```

**반응형 수정**
```
390px 모바일에서 CREDENTIALS 섹션 카드가 잘려 보인다.
가로 스크롤 캐러셀로 바꾸고 카드 폭을 뷰포트의 72%로,
좌우 거터 20px를 유지하면서 첫 카드가 왼쪽 정렬되게 해줘.
```

**인터랙션 조정**
```
헤더가 아래로 스크롤할 때 너무 빨리 숨는다.
스크롤 델타가 8px 이상일 때만 상태를 바꾸도록 임계값을 추가하고,
페이지 최상단 200px 구간에서는 항상 보이게 해줘.
```

**점검 요청**
```
Lighthouse 기준으로 자체 점검하고, Accessibility 100점과
CLS 0을 달성하지 못하는 부분을 찾아서 고쳐줘.
수정 전후로 무엇이 문제였는지 한 줄씩 설명해줘.
```

---

## 부록 — 핵심 수치 빠른 참조

```
컨테이너      1030px          카드 간격       30px
헤더 높이     219 / 120px     섹션 상하 패딩   64~120px
섹션 제목     48px / 700      오버레이 메뉴    60px / 700 / ls 6px
밴드 색       #F1F1F1         메타 텍스트      #767676
전환 시간     0.3s            hover           제목 밑줄만

이미지 비율   히어로 16:9 · WORK 3:2 · LAB 16:10 · WRITING 1:1 · CREDENTIALS 2:3
```
