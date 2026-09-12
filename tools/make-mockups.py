# -*- coding: utf-8 -*-
"""개발 스크린샷 느낌의 목업 SVG를 만든다.

어두운 에디터 바탕에 구문 색을 얹은 칼라 화면이다. 사진과 실제 캡처가 원래
색으로 들어가므로 목업도 같은 기준을 따른다. 둥근 모서리와 이모지는 쓰지 않는다.
빌드 스텝이 아니다. 이미지를 다시 만들고 싶을 때만 손으로 실행한다.

    python3 tools/make-mockups.py
"""

import html
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'images')

# --- 팔레트 ----------------------------------------------------------------
# 기본은 어두운 에디터 테마다. 구성도만 밝은 바탕을 쓴다 (본문 사이에 끼는
# 그림이라 화면 캡처와 성격이 다르다).
PAPER, CHROME, LINE, SIDE = '#1E1E1E', '#323233', '#3C3C3C', '#252526'
INK, T2, T3, T4 = '#D4D4D4', '#B4B4B4', '#8A8A8A', '#5A5A5A'
TERM, TERM_T, TERM_D, BAND = '#181818', '#CCCCCC', '#8A8A8A', '#252526'
ACT, ROWHL, TERM_TOP, TERM_P = '#333333', '#37373D', '#3C3C3C', '#E6E6E6'
DOTS = ('#FF5F57', '#FEBC2E', '#28C840')     # 창 단추 세 개

# 구문 색 — 어두운 에디터 테마 계열
C_KW, C_STR, C_CMT = '#569CD6', '#CE9178', '#6A9955'
C_NUM, C_FN, C_TYPE, C_ANNO = '#B5CEA8', '#DCDCAA', '#4EC9B0', '#DCDCAA'
C_OK, C_WARN, C_ADD, C_DEL = '#23D18B', '#D7BA7D', '#2EA043', '#F85149'

LIGHT = dict(
    PAPER='#FFFFFF', CHROME='#ECECEC', LINE='#DCDCDC', SIDE='#F6F6F6',
    INK='#1F2430', T2='#5A6473', T3='#8A92A0', T4='#C3C9D2', BAND='#F2F5FA',
)

# 구성도 계층별 강조색 — 화면 캡처와 달리 밝은 바탕 위에서 쓴다.
TIER_LINE = ('#2563EB', '#0F9D58', '#B45309')
TIER_FILL = ('#EDF3FF', '#ECF7F0', '#FBF3E8')


class palette:
    """블록 안에서만 팔레트 전역값을 바꾼다. 헬퍼가 호출 시점에 읽는다."""

    def __init__(self, p):
        self.p = p

    def __enter__(self):
        g = globals()
        self.old = {k: g[k] for k in self.p}
        g.update(self.p)

    def __exit__(self, *a):
        globals().update(self.old)
        return False

MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
SANS = 'Helvetica Neue, Helvetica, Arial, sans-serif'

KEYWORDS = set("""
public private protected class void return if else for while do new import from
def const let var function await async package int long float double bool boolean
string str struct static final enum switch case break continue try catch throw
export default interface extends implements using namespace include define
select insert update delete where join group order by and or not null true false
""".split())

TOKEN = re.compile(r'(//[^\n]*|#[^\n]*|--[^\n]*|"[^"]*"|\'[^\']*\'|@\w+|\w+|\s+|.)')

# 터미널 출력에서 색을 줄 상태 단어. 나머지는 흐린 회색으로 둔다.
STATUS = re.compile(r'(BUILD SUCCESSFUL|SUCCESS|INFO|DONE|ready|PASS|OK'
                    r'|ERROR|FAIL|WARN)')


def esc(s):
    return html.escape(s, quote=False)


def rect(x, y, w, h, fill, op=None):
    o = ' opacity="%s"' % op if op is not None else ''
    return '<rect x="%g" y="%g" width="%g" height="%g" fill="%s"%s/>' % (x, y, w, h, fill, o)


def text(x, y, s, size, fill, family=MONO, weight=400, anchor='start', ls=0):
    return ('<text x="%g" y="%g" font-family="%s" font-size="%g" font-weight="%s" '
            'fill="%s" text-anchor="%s" letter-spacing="%g" xml:space="preserve">%s</text>'
            % (x, y, family, size, weight, fill, anchor, ls, esc(s)))


def code(x, y, s, size, base=None, kw=None, cmt=None):
    """한 줄을 토큰별로 칠해 에디터의 구문 강조처럼 보이게 한다."""
    base, kw, cmt = base or INK, kw or C_KW, cmt or C_CMT
    toks = TOKEN.findall(s)
    out = []
    for i, tok in enumerate(toks):
        if tok.isspace():
            out.append('<tspan xml:space="preserve">%s</tspan>' % esc(tok))
            continue
        nxt = next((t for t in toks[i + 1:] if not t.isspace()), '')
        bold = False
        if tok.startswith(('//', '#', '--')):
            fill = cmt
        elif tok[0] in '"\'':
            fill = C_STR
        elif tok.startswith('@'):
            fill = C_ANNO
        elif tok[0].isdigit():
            fill = C_NUM
        elif tok.lower() in KEYWORDS:
            fill, bold = kw, True
        elif nxt == '(':
            fill = C_FN
        elif tok[0].isalpha() and tok[0].isascii() and tok[0].isupper():
            fill = C_TYPE
        else:
            fill = base
        out.append('<tspan fill="%s"%s>%s</tspan>'
                   % (fill, ' font-weight="600"' if bold else '', esc(tok)))
    return ('<text x="%g" y="%g" font-family="%s" font-size="%g" fill="%s" '
            'xml:space="preserve">%s</text>' % (x, y, MONO, size, base, ''.join(out)))


def clip(cid, x, y, w, h, content):
    """긴 코드 줄이 창 밖으로 새지 않게 잘라낸다."""
    return ('<defs><clipPath id="%s"><rect x="%g" y="%g" width="%g" height="%g"/></clipPath></defs>'
            '<g clip-path="url(#%s)">%s</g>' % (cid, x, y, w, h, cid, ''.join(content)))


def svg(path, w, h, title, body):
    doc = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" '
           'role="img">\n<title>%s</title>\n%s\n</svg>\n'
           % (w, h, w, h, esc(title), '\n'.join(body)))
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as fp:
        fp.write(doc)
    return path


def chrome_bar(w, bar_h, label, dot=14, fs=None):
    """창 상단 바. 단추는 원 대신 정사각형이다 (둥근 모서리를 쓰지 않는다)."""
    fs = fs or bar_h * 0.44
    y = (bar_h - dot) / 2.0
    out = [rect(0, 0, w, bar_h, CHROME), rect(0, bar_h - 1, w, 1, LINE)]
    for i in range(3):
        out.append(rect(dot * 1.6 + i * dot * 1.9, y, dot, dot, DOTS[i]))
    out.append(text(dot * 1.6 + 3 * dot * 1.9 + dot * 1.4, bar_h / 2.0 + fs * 0.36,
                    label, fs, T3))
    return out


def gutter(x, y, w, h, rows, lh, fs, start=1):
    out = [rect(x, y, w, h, SIDE), rect(x + w - 1, y, 1, h, LINE)]
    for i in range(rows):
        out.append(text(x + w - 12, y + lh * (i + 1) - lh * 0.28, str(start + i),
                        fs, T4, anchor='end'))
    return out


# ===========================================================================
#  템플릿
# ===========================================================================

def editor(path, w, h, title, lines, fs, lh, bar=None, gw=None,
           tail=None, tail_label='BUILD SUCCESSFUL'):
    """에디터 창 — 상단 바 · 줄번호 거터 · 코드."""
    bar = bar or int(h * 0.108)
    gw = gw or int(w * 0.062)
    body = [rect(0, 0, w, h, PAPER)] + chrome_bar(w, bar, title)
    area = h - bar - (tail or 0)
    rows = int(area // lh)
    body += gutter(0, bar, gw, area, rows, lh, fs * 0.78)
    body.append(clip('ed', gw, bar, w - gw, area,
                     [code(gw + fs * 0.9, bar + lh * (i + 1) - lh * 0.28, ln, fs)
                      for i, ln in enumerate(lines[:rows])]))
    if tail:
        y = h - tail
        body += [rect(0, y, w, tail, TERM), rect(0, y, w, 1, LINE)]
        body.append(term_line(fs * 1.2, y + tail / 2.0 + fs * 0.36, tail_label, fs * 0.9, TERM_D))
    return svg(path, w, h, title, body)


def term_line(x, y, s, size, base):
    """터미널 한 줄 — 프롬프트와 상태 단어에만 색을 준다."""
    if s.startswith('$'):
        return ('<text x="%g" y="%g" font-family="%s" font-size="%g" xml:space="preserve">'
                '<tspan fill="%s" font-weight="600">$</tspan><tspan fill="%s">%s</tspan>'
                '</text>' % (x, y, MONO, size, C_OK, TERM_P, esc(s[1:])))
    out = []
    for i, part in enumerate(STATUS.split(s)):
        if not part:
            continue
        if i % 2:
            fill = C_DEL if part in ('ERROR', 'FAIL') else (
                C_WARN if part == 'WARN' else C_OK)
            out.append('<tspan fill="%s" font-weight="600">%s</tspan>' % (fill, esc(part)))
        else:
            out.append('<tspan xml:space="preserve">%s</tspan>' % esc(part))
    return ('<text x="%g" y="%g" font-family="%s" font-size="%g" fill="%s" '
            'xml:space="preserve">%s</text>' % (x, y, MONO, size, base, ''.join(out)))


def terminal(path, w, h, title, lines, fs, lh):
    """다크 터미널 — 프롬프트가 있는 실행 로그."""
    bar = int(h * 0.108)
    body = [rect(0, 0, w, h, TERM),
            rect(0, 0, w, bar, CHROME), rect(0, bar - 1, w, 1, LINE)]
    d = bar * 0.28
    for i in range(3):
        body.append(rect(d * 1.6 + i * d * 1.9, (bar - d) / 2.0, d, d, DOTS[i]))
    body.append(text(d * 1.6 + 3 * d * 1.9 + d * 1.4, bar / 2.0 + fs * 0.36, title, fs * 0.92, T3))
    y = bar + lh
    for ln in lines:
        if y > h - lh * 0.2:
            break
        body.append(term_line(fs * 1.2, y, ln, fs,
                              TERM_D if ln.startswith('  ') else TERM_T))
        y += lh
    body.append(rect(fs * 1.2, y - fs * 0.82, fs * 0.62, fs * 0.94, C_OK, op='.8'))
    return svg(path, w, h, title, [body[0]] + [clip('tm', 0, 0, w, h, body[1:])])


def diffview(path, w, h, title, lines, fs, lh):
    """diff 화면 — 추가는 초록, 삭제는 빨강 띠로 구분한다."""
    bar = int(h * 0.108)
    body = [rect(0, 0, w, h, PAPER)] + chrome_bar(w, bar, title)
    y = bar
    for sign, ln in lines:
        if y + lh > h:
            break
        if sign == '+':
            body += [rect(0, y, w, lh, '#16301F'), rect(0, y, 6, lh, C_ADD)]
        elif sign == '-':
            body += [rect(0, y, w, lh, '#31201F'), rect(0, y, 6, lh, C_DEL)]
        body.append(text(fs * 0.6, y + lh - lh * 0.28, sign, fs,
                         C_ADD if sign == '+' else (C_DEL if sign == '-' else T4),
                         weight=600))
        body.append(clip('df%d' % y, 0, y, w, lh,
                         [code(fs * 1.9, y + lh - lh * 0.28, ln, fs,
                               base=INK if sign != ' ' else T2)]))
        y += lh
    return svg(path, w, h, title, body)


def markdown(path, w, h, tag, heading, lines, fs, lh, source='velog.io/@kannikii'):
    """정사각 마크다운 미리보기 — WRITING 썸네일. 에디터와 같은 어두운 바탕."""
    bar = int(h * 0.085)
    pad = w * 0.085
    body = [rect(0, 0, w, h, PAPER)] + chrome_bar(w, bar, tag, dot=int(bar * 0.3))
    y = bar + h * 0.11
    body.append(text(pad, y, '#', fs * 1.5, C_KW, weight=600))
    for i, seg in enumerate(heading):
        body.append(text(pad + fs * 2.0, y + i * fs * 1.75, seg, fs * 1.5, INK,
                         family=SANS, weight=700))
    y += (len(heading) - 1) * fs * 1.75 + h * 0.085
    body.append(rect(pad, y, w * 0.18, 3, C_KW))
    y += h * 0.055
    for kind, txt in lines:
        if y > h - lh:
            break
        if kind == 'code':
            body += [rect(pad, y - lh * 0.78, w - pad * 2, lh * 1.08, BAND),
                     rect(pad, y - lh * 0.78, 4, lh * 1.08, C_KW)]
            body.append(clip('md%d' % int(y), pad, y - lh, w - pad * 2, lh * 1.4,
                             [code(pad + fs * 0.9, y, txt, fs * 0.88)]))
        elif kind == 'li':
            body += [rect(pad, y - fs * 0.34, fs * 0.34, fs * 0.34, C_TYPE)]
            body.append(text(pad + fs * 1.1, y, txt, fs, T2, family=SANS))
        else:
            body.append(text(pad, y, txt, fs, T2, family=SANS))
        y += lh
    body += [rect(pad, h - h * 0.135, w - pad * 2, 1, LINE),
             text(pad, h - h * 0.075, source, fs * 0.82, T3),
             text(w - pad, h - h * 0.075, 'READ', fs * 0.82, C_TYPE, anchor='end', ls=fs * 0.12)]
    return svg(path, w, h, heading[0], body)


def archdiagram(path, w, h, title, tiers, footnote, fs):
    """아키텍처 구성도 — 계층별 상자와 연결선.

    본문 사이에 끼는 그림이라 화면 캡처와 달리 밝은 바탕을 쓰고, 계층마다
    다른 강조색을 준다. 상자는 (이름, 설명, 아래 계층에서 연결할 인덱스들) 이다.
    """
    with palette(LIGHT):
        body = [rect(0, 0, w, h, PAPER), rect(0, 0, w, h * 0.012, INK),
                text(w * 0.05, h * 0.115, title, fs * 1.15, INK, family=SANS, weight=700),
                rect(w * 0.05, h * 0.145, w * 0.06, 3, INK)]
        top, bottom = h * 0.24, h * 0.9
        rows = len(tiers)
        rh = (bottom - top) / rows
        geo = []
        for r, (label, boxes) in enumerate(tiers):
            hue, tint = TIER_LINE[r % 3], TIER_FILL[r % 3]
            y = top + r * rh
            body.append(text(w * 0.05, y + fs * 0.9, label, fs * 0.78, hue, ls=fs * 0.12))
            bx0, bw_all, gap = w * 0.22, w * 0.73, w * 0.022
            n = len(boxes)
            bw = (bw_all - gap * (n - 1)) / n
            bh = rh * 0.5
            row = []
            for i, (name, sub, _) in enumerate(boxes):
                x = bx0 + i * (bw + gap)
                body += [rect(x, y, bw, bh, tint),
                         '<rect x="%g" y="%g" width="%g" height="%g" fill="none" stroke="%s" stroke-width="2"/>'
                         % (x, y, bw, bh, hue)]
                body.append(text(x + bw / 2, y + bh * 0.44, name, fs * 0.95, INK,
                                 family=SANS, weight=700, anchor='middle'))
                body.append(text(x + bw / 2, y + bh * 0.74, sub, fs * 0.72, T2, anchor='middle'))
                row.append((x + bw / 2, y, y + bh))
            geo.append(row)
        for r in range(rows - 1):
            hue = TIER_LINE[r % 3]
            for i, (_, _, targets) in enumerate(tiers[r][1]):
                cx, _, cb = geo[r][i]
                for t in targets:
                    nx, ty, _ = geo[r + 1][t]
                    mid = (cb + ty) / 2
                    body.append('<path d="M%g %g L%g %g L%g %g L%g %g" fill="none" stroke="%s" stroke-width="2"/>'
                                % (cx, cb, cx, mid, nx, mid, nx, ty - 12, hue))
                    body.append('<path d="M%g %g l-7 -12 l14 0 z" fill="%s"/>' % (nx, ty, hue))
        body.append(text(w * 0.05, h * 0.955, footnote, fs * 0.78, T3, ls=fs * 0.08))
        return svg(path, w, h, title, body)


def ide(path, w, h, project, tree, tabs, left, right, term_lines, fs, lh):
    """히어로용 넓은 IDE 화면 — 파일 트리 · 탭 두 장 · 하단 터미널.

    아래쪽은 CSS 그라데이션이 덮으므로 어두운 터미널을 깔아 자연스럽게 잇는다.
    """
    bar, tabh = int(h * 0.052), int(h * 0.048)
    act, side = w * 0.032, w * 0.175
    termh = h * 0.3
    body = [rect(0, 0, w, h, PAPER)] + chrome_bar(w, bar, project, dot=int(bar * 0.3))
    # 액티비티 바 · 파일 트리
    body += [rect(0, bar, act, h - bar, ACT), rect(act, bar, side, h - bar, SIDE),
             rect(act + side - 1, bar, 1, h - bar, LINE)]
    for i in range(5):
        iy = bar + h * 0.04 + i * h * 0.062
        if i == 0:
            body.append(rect(0, iy - h * 0.012, 2, act * 0.28 + h * 0.024, C_KW))
        body.append(rect(act * 0.3, iy, act * 0.4, act * 0.28, INK if i == 0 else T4))
    body.append(text(act + fs * 1.1, bar + h * 0.052, 'EXPLORER', fs * 0.78, T3, ls=fs * 0.14))
    ty = bar + h * 0.095
    for depth, name, active in tree:
        body.append(rect(act, ty - lh * 0.7, side, lh, ROWHL) if active else '')
        body.append(text(act + fs * 1.1 + depth * fs * 1.1, ty, name, fs * 0.92,
                         INK if active else T2))
        ty += lh
    # 탭
    ex = act + side
    ew = w - ex
    body += [rect(ex, bar, ew, tabh, CHROME), rect(ex, bar + tabh - 1, ew, 1, LINE)]
    tx = ex
    for i, t in enumerate(tabs):
        tw = fs * (len(t) * 0.62 + 3.4)
        if i == 0:
            body += [rect(tx, bar, tw, tabh, PAPER), rect(tx, bar, tw, 3, C_KW)]
        body.append(text(tx + fs * 1.4, bar + tabh * 0.64, t, fs * 0.88, INK if i == 0 else T3))
        body.append(rect(tx + tw, bar, 1, tabh, LINE))
        tx += tw
    # 코드 두 칸
    top = bar + tabh
    ph = h - top - termh
    half = ew / 2.0
    rows = int(ph // lh)
    body += gutter(ex, top, fs * 3.0, ph, rows, lh, fs * 0.78)
    body.append(clip('pl', ex, top, half - fs * 0.8, ph,
                     [code(ex + fs * 4.0, top + lh * (i + 1) - lh * 0.28, ln, fs)
                      for i, ln in enumerate(left[:rows])]))
    body.append(rect(ex + half, top, 1, ph, LINE))
    body += gutter(ex + half, top, fs * 3.0, ph, rows, lh, fs * 0.78)
    body.append(clip('pr', ex + half, top, half, ph,
                     [code(ex + half + fs * 4.0, top + lh * (i + 1) - lh * 0.28, ln, fs)
                      for i, ln in enumerate(right[:rows])]))
    # 터미널
    ty0 = h - termh
    body += [rect(0, ty0, w, termh, TERM), rect(0, ty0, w, 1, TERM_TOP)]
    body.append(text(fs * 1.6, ty0 + fs * 2.0, 'TERMINAL', fs * 0.78, TERM_D, ls=fs * 0.14))
    yy = ty0 + fs * 4.0
    for ln in term_lines:
        if yy > h - lh * 0.4:
            break
        body.append(term_line(fs * 1.6, yy, ln, fs * 0.95,
                              TERM_D if ln.startswith('  ') else TERM_T))
        yy += lh
    return svg(path, w, h, project, [b for b in body if b])


# ===========================================================================
#  실제 이미지
# ===========================================================================

def build():
    made = []

    # --- HERO -------------------------------------------------------------
    # 위에 흰 제목이 얹히므로 어두운 화면이어야 읽힌다.
    made.append(ide('hero-16x9.svg', 1920, 1080, 'artifact-medical-ai — Spring Boot',
        tree=[(0, 'src/main/java', False), (1, 'controller', False),
              (2, 'DiagnosisController', True), (1, 'service', False),
              (2, 'PrescriptionService', False), (1, 'domain', False),
              (2, 'Diagnosis.java', False), (0, 'docker-compose.yml', False),
              (0, 'build.gradle', False), (0, 'README.md', False)],
        tabs=['DiagnosisController.java', 'PrescriptionService.java', 'schema.sql'],
        left=[
            '@RestController',
            '@RequestMapping("/api/v1/diagnoses")',
            'public class DiagnosisController {',
            '',
            '    private final DiagnosisService service;',
            '',
            '    @PostMapping',
            '    public ResponseEntity<DiagnosisResponse> create(',
            '            @Valid @RequestBody DiagnosisRequest request) {',
            '        var result = service.analyze(request);',
            '        return ResponseEntity.ok(DiagnosisResponse.from(result));',
            '    }',
            '',
            '    @GetMapping("/{id}")',
            '    public DiagnosisResponse findOne(@PathVariable Long id) {',
            '        return service.findById(id);',
            '    }',
            '}',
        ],
        right=[
            '-- KCD 상병코드 적재',
            'CREATE TABLE kcd_code (',
            '    id        BIGINT PRIMARY KEY AUTO_INCREMENT,',
            '    code      VARCHAR(16)  NOT NULL,',
            '    name_ko   VARCHAR(255) NOT NULL,',
            '    name_en   VARCHAR(255),',
            '    UNIQUE KEY uk_kcd_code (code)',
            ');',
            '',
            'CREATE INDEX idx_kcd_name ON kcd_code (name_ko);',
            '',
            'SELECT code, name_ko FROM kcd_code',
            ' WHERE name_ko LIKE :keyword',
            ' ORDER BY code',
            ' LIMIT 20;',
            '',
            '-- 24,000 rows loaded',
        ],
        term_lines=[
            '$ docker compose up -d --build',
            '  [+] Running 4/4  api  ai  db  web',
            '$ ./gradlew test',
            '  BUILD SUCCESSFUL in 12s',
        ], fs=21, lh=30))

    # --- WORK 상세 히어로 · 구성도 ----------------------------------------
    # 상세 히어로 위에는 큰 제목이 얹힌다. 실제 서비스 캡처를 깔면 앱 제목과
    # 겹치므로 여기는 목업을 쓴다. 서비스 캡처는 LAB 카드 쪽이다.
    made.append(terminal('work/speakflow-hero-16x9.svg', 1920, 1080,
        'speakflow — uvicorn', [
            '$ uvicorn app.main:app --reload --port 8000',
            '  INFO  Will watch for changes in these directories',
            '  INFO  Uvicorn running on http://127.0.0.1:8000',
            '  INFO  Application startup complete.',
            '',
            '$ python -m app.pipeline --sample demo.wav',
            '  [1/4] audio    : 44.1kHz  00:03:12  loaded',
            '  [2/4] speech   : 312 wpm  filler 7',
            '  [3/4] vision   : eye-contact 82%  gesture 41',
            '  [4/4] scoring  : overall 84.6',
            '',
            '  feedback written to reports/demo.json',
            '',
            '$ npm run dev',
            '  VITE ready in 412 ms  ->  http://localhost:5173',
            '',
            '$ ',
        ], fs=24, lh=38))

    made.append(archdiagram('work/artifact-arch-16x9.svg', 1600, 900,
        'Artifact Medical AI — 시스템 구성', [
            ('CLIENT', [('Web', 'React', [0]), ('Admin', 'React', [0])]),
            ('API', [('API Server', 'Spring Boot', [0, 1, 2]), ('AI Server', 'FastAPI', [1])]),
            ('DATA', [('MySQL', '진료 · 코드', []), ('S3', '병변 이미지', []), ('Redis', '세션', [])]),
        ], 'docker compose · 4개 서비스 · KCD 24,113건 / 처방코드 490,552건', fs=26))

    made.append(archdiagram('work/speakflow-arch-16x9.svg', 1600, 900,
        'SpeakFlow — 시스템 구성', [
            ('CLIENT', [('Web', 'React', [0]), ('Recorder', 'MediaStream', [0, 1])]),
            ('API', [('API Server', 'FastAPI', [0]), ('Analyzer', 'Whisper · MediaPipe', [0, 1])]),
            ('DATA', [('Firestore', '리포트', []), ('Storage', '녹화 파일', [])]),
        ], '음성 · 내용 · 영상 3개 파이프라인을 병렬로 돌려 하나의 리포트로 합친다', fs=26))


    made.append(archdiagram('work/pop-it-arch-16x9.svg', 1600, 900,
        'POP-IT — 시스템 구성', [
            ('CLIENT', [('Web', 'React · TypeScript', [0]), ('Host', '공간 등록', [0])]),
            ('API', [('API Server', 'Spring Boot 4.1', [0, 1, 2]), ('Escrow', '예약 · 정산', [0])]),
            ('DATA', [('MySQL', '공간 · 예약 · 계약', []), ('S3', '공간 이미지', []),
                      ('EC2', '배포', [])]),
        ], '12명 팀 · 백엔드 5명 · 사용자 / 약관 도메인 담당', fs=26))

    return made


def build_lab():
    """LAB 카드 — 에디터 · 터미널 · diff 를 섞어 화면이 단조롭지 않게 한다.

    SpeakFlow · HandcraftedBoard · PS · XmasTreeNote 는 실제 캡처를 쓰므로
    여기서 만들지 않는다.
    """
    W, H, FS, LH = 940, 588, 32, 44
    made = []

    made.append(editor('lab/regex-to-dfa-16x10.svg', W, H, 'SubsetConstruction.java', [
        '// NFA 12 states -> DFA 4 states',
        'Set<State> move(Set<State> from, char c) {',
        '    Set<State> next = new HashSet<>();',
        '    for (State s : from) {',
        '        next.addAll(s.edges(c));',
        '    }',
        '    return closure(next);',
        '}',
    ], fs=FS, lh=LH, tail=int(H * 0.14),
        tail_label='  (a|b)*abb  accept: abb aabb babb   PASS 24/24'))

    made.append(editor('lab/umc-10th-spring-boot-16x10.svg', W, H, 'Mission.java', [
        '@Entity',
        '@Getter',
        'public class Mission extends BaseEntity {',
        '',
        '    @Id @GeneratedValue',
        '    private Long id;',
        '',
        '    @ManyToOne(fetch = FetchType.LAZY)',
        '    private Store store;',
        '}',
    ], fs=FS, lh=LH))

    made.append(terminal('lab/macro-processor-16x10.svg', W, H, 'make — macro processor', [
        '$ make && ./macro sample.asm',
        '  pass 1  : 42 macros defined',
        '  pass 2  : 318 lines expanded',
        '  output  : sample.expanded.asm',
        '',
        '$ diff -q expected.asm sample.expanded.asm',
        '$ ',
    ], fs=34, lh=52))

    made.append(editor('lab/sicxe-assembler-16x10.svg', W, H, 'listing.lst', [
        '0000  COPY    START   0',
        '0000  FIRST   STL     RETADR    17202D',
        '0003          LDB     #LENGTH   69202D',
        '0006          BASE    LENGTH',
        '0006  CLOOP   +JSUB   RDREC     4B101036',
        '000A          LDA     LENGTH    032026',
        '000D          COMP    #0        290000',
        '0010          JEQ     ENDFIL    332007',
        '0013  ENDFIL  LDA     EOF       032010',
    ], fs=FS, lh=LH))

    made.append(diffview('lab/oss-project-16x10.svg', W, H, 'parser.py — 3 files changed', [
        (' ', 'def parse(tokens):'),
        ('-', '    result = []'),
        ('+', '    result: list[Node] = []'),
        (' ', '    for token in tokens:'),
        ('-', '        if token.type == "WORD":'),
        ('+', '        if token.type is TokenType.WORD:'),
        ('+', '            result.append(Node(token))'),
        (' ', '        else:'),
        ('-', '            pass'),
        ('+', '            raise ParseError(token)'),
        (' ', '    return result'),
    ], fs=FS, lh=LH))
    return made


def build_writing():
    """WRITING 썸네일 — 데스크톱에서 한 줄에 들어가는 세 장만 만든다."""
    W = 800
    FS, LH = 30, 44
    posts = [
        ('jwt-session-security', 'Auth · 보안', ['JWT 토큰 vs', '세션 및 보안'],
         [('p', '쿠키에서 세션으로, 세션에서'), ('p', '토큰으로 넘어온 이유를 정리했다.'),
          ('code', 'Authorization: Bearer <access-token>'),
          ('li', 'CSRF · 세션 하이재킹'), ('li', 'HMAC vs RSA 서명'), ('li', 'Refresh Token 회전')],
         'notion.so'),
        ('repository-design', 'Spring Boot · JPA', ['도메인별 API 명세부터', '다시 쓴 레포지토리', '설계 기록'],
         [('p', '도메인 경계를 먼저 긋고 나서야'), ('p', '레포지토리 시그니처가 정리됐다.'),
          ('code', 'Optional<Post> findBySlug(String slug);'),
          ('li', '도메인별 패키지 분리'), ('li', 'N+1 제거'), ('li', '슬러그 기반 조회')],
         'velog.io/@kannikii'),
        ('springboot-study', 'Spring Boot · 설계', ['스프링부트', '학습용 프로젝트'],
         [('p', '게시판 하나를 처음부터 다시 만들며'), ('p', '계층 구조를 손에 익혔다.'),
          ('code', '@Transactional(readOnly = true)'),
          ('li', '계층 분리'), ('li', '테스트 코드'), ('li', '예외 처리 일원화')],
         'velog.io/@kannikii'),
    ]
    return [markdown('writing/%s-1x1.svg' % slug, W, W, tag, head, body, FS, LH, source=src)
            for slug, tag, head, body, src in posts]


if __name__ == '__main__':
    files = build() + build_lab() + build_writing()
    for f in files:
        print(f)
    print('%d files' % len(files))
