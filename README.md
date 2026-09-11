# KWON HYEONG LEE — Portfolio

패션 매거진의 에디토리얼 레이아웃 문법을 차용한 개발자 포트폴리오 정적 사이트.
빌드 스텝이 없다. `index.html` 을 브라우저에서 열면 그대로 동작하고, GitHub Pages에도 저장소 루트가 그대로 배포된다.

---

## 구조

```
/
├─ index.html                 메인 (HERO · WORK · LAB · WRITING · CREDENTIALS · CONTACT)
├─ work/
│  ├─ project-a.html          Artifact Medical AI 상세
│  └─ project-b.html          SpeakFlow 상세
├─ assets/
│  ├─ css/
│  │  ├─ reset.css            최소 리셋 + prefers-reduced-motion 대응
│  │  ├─ tokens.css           CSS 변수 (색 · 레이아웃 · 타이포 스케일 · 모션)
│  │  └─ style.css            실제 스타일
│  ├─ js/main.js              헤더 · 오버레이 · 네비 · 캐러셀 · 리빌 · TOP · 메일 복사
│  └─ images/
│     ├─ og-1200x630.png      Open Graph 이미지
│     └─ placeholder/         비율별 SVG 자리표시 이미지
├─ .nojekyll                  GitHub Pages의 Jekyll 처리를 끈다
└─ .github/workflows/deploy-pages.yml
```

의존성이 없으므로 `npm install` 도 빌드 명령도 필요하지 않다.
로컬에서 볼 때는 `index.html` 을 더블클릭하거나, 원하면 `python3 -m http.server` 로 띄운다.

---

## 이미지 교체

현재 모든 이미지는 회색 SVG 자리표시다. 아래 경로에 실제 파일을 넣고
`index.html` · `work/*.html` 의 `src` 를 바꾸면 된다. `width` / `height` 속성은 레이아웃 이동을 막으므로 반드시 함께 수정한다.

| 위치 | 넣을 경로 | 권장 규격 | 비율 |
|---|---|---|---|
| 히어로 | `assets/images/hero.jpg` | 1920 × 1080 | 16:9 |
| WORK 카드 | `assets/images/work/*.jpg` | 1200 × 800 | 3:2 |
| LAB 카드 | `assets/images/lab/*.jpg` | 940 × 588 | 16:10 |
| WRITING 썸네일 | `assets/images/writing/*.jpg` | 800 × 800 | 1:1 |
| CREDENTIALS | `assets/images/cred/*.jpg` | 700 × 1050 | 2:3 |
| 상세 아키텍처 | `assets/images/work/*.png` | 1600 × 900 | 16:9 |
| Open Graph | `assets/images/og-1200x630.png` | 1200 × 630 | 1.91:1 |

히어로는 JPG 500KB 이하를 권장한다. 히어로만 `fetchpriority="high"` 이고 나머지는 전부 `loading="lazy"` 다.

---

## 콘텐츠 수정

**섹션별 위치는 전부 `index.html` 안에 있다.** 주석으로 구획이 나뉘어 있다.

- **WORK** — `.work__grid` 안의 `<a class="card">` 두 개. 링크는 `work/project-a.html`, `work/project-b.html`.
- **LAB** — `.lab__track` 안의 카드. 6~10개를 권장한다. 마지막 카드가 화면 오른쪽에서 잘려 보여야 "더 있다"는 신호가 된다.
- **WRITING** — `.writing__grid` 안의 카드. 태그는 최대 2개까지만 노출한다.
- **CREDENTIALS** — 대표 카드 3개와 그 아래 `dl.cred__list` 목록.
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

## 확인이 필요한 내용

아래 항목은 공개 저장소와 블로그에서 가져온 값이다. 실제와 다르면 수정한다.

- WORK 두 프로젝트의 **역할·팀 규모·기간**
- CREDENTIALS의 **수상 연월**과 자격증 항목 (현재 자격증 없이 수상·활동만 들어가 있다)
- LinkedIn 프로필과 이력서 PDF는 링크가 없어 넣지 않았다.
  추가하려면 `index.html` 의 `.contact__links` 와 오버레이의 `.gnb__links` 두 곳에 같이 넣는다.
  동작하지 않는 링크는 두지 않는다.

---

## 배포

`main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml` 이 저장소 루트를 그대로 GitHub Pages에 올린다.
빌드 과정이 없으므로 워크플로가 실패할 여지가 거의 없다.
저장소 설정에서 Pages의 소스를 **GitHub Actions** 로 두어야 한다.

---

## 레이아웃 메모

프롬프트 수치를 그대로 따르되, 실제 문자열 폭 때문에 아래 세 가지는 조정했다.

- **콘텐츠 폭 1030px** 은 패딩을 제외한 값이다. `.container` 의 `max-width` 는 `1030px + 좌우 거터` 로 잡았다.
- **LAB 트랙**만 컨테이너 밖으로 빼서 오른쪽 거터를 주지 않았다. 그래야 235px 카드 네 장이 정확히 1030px을 채우면서 다섯 번째 카드가 화면 끝에서 잘린다.
- **CREDENTIALS 제목 컬럼**은 `235px` 고정이 아니라 `minmax(235px, max-content)` 다. `CREDENTIALS` 라는 단어가 48px에서 235px보다 넓어 카드와 겹쳤다.
- **600px 미만 헤더**에서는 가운데 로고와 우측 CONTACT·햄버거가 겹쳐서, 절대 배치를 풀고 둘째 줄 오른쪽으로 내렸다.

---

## 디자인 규칙

지키면 사이트가 흐트러지지 않는다.

- 색은 흑 · 백 · 회색만 쓴다. 포인트 컬러를 넣지 않는다.
- 둥근 모서리를 쓰지 않는다. 원형 소셜 아이콘만 예외다.
- 카드 hover는 제목 밑줄만이다. 이미지 확대, 그림자, 색 반전을 넣지 않는다.
- 폰트 크기는 `tokens.css` 의 스케일 변수에서 가져온다. 섹션마다 즉흥적으로 지정하지 않는다.
- 색상값을 하드코딩하지 않는다. 전부 `var(--c-*)` 를 쓴다.
- 동작하지 않는 UI를 두지 않는다. 서버가 없으므로 문의 폼 대신 `mailto` 를 쓴다.
- 모바일에서 가로 스크롤이 생기면 `overflow-x: hidden` 으로 덮지 말고 원인을 고친다.
