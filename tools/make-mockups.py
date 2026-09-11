# -*- coding: utf-8 -*-
"""개발 스크린샷 느낌의 목업 SVG를 만든다.

사이트 규칙을 그대로 따른다 — 흑·백·회색만, 둥근 모서리 없음, 이모지 없음.
빌드 스텝이 아니다. 이미지를 다시 만들고 싶을 때만 손으로 실행한다.

    python3 tools/make-mockups.py
"""

import html
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'images')

# --- 팔레트 ----------------------------------------------------------------
# 기본은 밝은 테마. 히어로만 DARK로 바꿔 쓴다 — 그 위에 흰 제목이 얹히기 때문이다.
PAPER, CHROME, LINE, SIDE = '#FFFFFF', '#ECECEC', '#DCDCDC', '#F6F6F6'
DOT, INK, T2, T3, T4 = '#C2C2C2', '#2B2B2B', '#6E6E6E', '#9E9E9E', '#CBCBCB'
TERM, TERM_T, TERM_D, BAND = '#161616', '#BDBDBD', '#7A7A7A', '#F1F1F1'
ACT, ROWHL, TERM_TOP, TERM_P = '#E4E4E4', '#E6E6E6', '#2E2E2E', '#FFFFFF'

DARK = dict(
    PAPER='#141414', CHROME='#1E1E1E', LINE='#2E2E2E', SIDE='#181818',
    DOT='#4A4A4A', INK='#F2F2F2', T2='#B0B0B0', T3='#787878', T4='#4C4C4C',
    TERM='#0A0A0A', TERM_T='#B0B0B0', TERM_D='#6E6E6E', BAND='#1E1E1E',
    ACT='#101010', ROWHL='#292929', TERM_TOP='#2E2E2E', TERM_P='#FFFFFF',
)


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
    """한 줄을 토큰별 명암으로 칠해 코드처럼 보이게 한다."""
    base, kw, cmt = base or T2, kw or INK, cmt or T3
    out = []
    for tok in TOKEN.findall(s):
        if tok.isspace():
            out.append('<tspan xml:space="preserve">%s</tspan>' % esc(tok))
        elif tok.startswith(('//', '#', '--')):
            out.append('<tspan fill="%s">%s</tspan>' % (cmt, esc(tok)))
        elif tok[0] in '"\'':
            out.append('<tspan fill="%s">%s</tspan>' % (cmt, esc(tok)))
        elif tok.startswith('@') or tok.lower() in KEYWORDS:
            out.append('<tspan fill="%s" font-weight="600">%s</tspan>' % (kw, esc(tok)))
        else:
            out.append('<tspan>%s</tspan>' % esc(tok))
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
    """창 상단 바. 점은 원 대신 정사각형이다 (둥근 모서리를 쓰지 않는다)."""
    fs = fs or bar_h * 0.44
    y = (bar_h - dot) / 2.0
    out = [rect(0, 0, w, bar_h, CHROME), rect(0, bar_h - 1, w, 1, LINE)]
    for i in range(3):
        out.append(rect(dot * 1.6 + i * dot * 1.9, y, dot, dot, DOT))
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

def editor(path, w, h, title, lines, fs, lh, bar=None, gw=None, tail=None):
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
        body.append(text(fs * 1.2, y + tail / 2.0 + fs * 0.36, 'BUILD SUCCESSFUL', fs * 0.9, TERM_T))
    return svg(path, w, h, title, body)


def terminal(path, w, h, title, lines, fs, lh):
    """다크 터미널 — 프롬프트가 있는 실행 로그."""
    bar = int(h * 0.108)
    body = [rect(0, 0, w, h, TERM),
            rect(0, 0, w, bar, '#242424'), rect(0, bar - 1, w, 1, '#333333')]
    d = bar * 0.28
    for i in range(3):
        body.append(rect(d * 1.6 + i * d * 1.9, (bar - d) / 2.0, d, d, '#4A4A4A'))
    body.append(text(d * 1.6 + 3 * d * 1.9 + d * 1.4, bar / 2.0 + fs * 0.36, title, fs * 0.92, TERM_D))
    y = bar + lh
    for ln in lines:
        if y > h - lh * 0.2:
            break
        if ln.startswith('$'):
            body.append(text(fs * 1.2, y, ln, fs, '#FFFFFF'))
        elif ln.startswith('  '):
            body.append(text(fs * 1.2, y, ln, fs, TERM_D))
        else:
            body.append(text(fs * 1.2, y, ln, fs, TERM_T))
        y += lh
    body.append(rect(fs * 1.2, y - fs * 0.82, fs * 0.62, fs * 0.94, '#FFFFFF', op='.75'))
    return svg(path, w, h, title, [body[0]] + [clip('tm', 0, 0, w, h, body[1:])])


def diffview(path, w, h, title, lines, fs, lh):
    """diff 화면 — 색 대신 왼쪽 막대의 명암으로 +/- 를 구분한다."""
    bar = int(h * 0.108)
    body = [rect(0, 0, w, h, PAPER)] + chrome_bar(w, bar, title)
    y = bar
    for sign, ln in lines:
        if y + lh > h:
            break
        if sign == '+':
            body += [rect(0, y, w, lh, BAND), rect(0, y, 6, lh, INK)]
        elif sign == '-':
            body += [rect(0, y, w, lh, '#FAFAFA'), rect(0, y, 6, lh, T4)]
        body.append(text(fs * 0.6, y + lh - lh * 0.28, sign, fs,
                         INK if sign == '+' else T4, weight=600))
        body.append(clip('df%d' % y, 0, y, w, lh,
                         [code(fs * 1.9, y + lh - lh * 0.28, ln, fs,
                               base=T2 if sign != '-' else T3)]))
        y += lh
    return svg(path, w, h, title, body)


def statechart(path, w, h, title, states, edges, accept, caption, fs):
    """정규식 -> DFA 상태 다이어그램. 상태는 원 대신 정사각형이다."""
    bar = int(h * 0.108)
    body = [rect(0, 0, w, h, PAPER)] + chrome_bar(w, bar, title)
    box = h * 0.215
    pos = {}
    for name, (cx, cy) in states.items():
        x, y = cx * w, bar + cy * (h - bar)
        pos[name] = (x, y)
        body += [rect(x - box / 2, y - box / 2, box, box, PAPER),
                 '<rect x="%g" y="%g" width="%g" height="%g" fill="none" stroke="%s" stroke-width="2.5"/>'
                 % (x - box / 2, y - box / 2, box, box, INK)]
        if name in accept:
            body.append('<rect x="%g" y="%g" width="%g" height="%g" fill="none" stroke="%s" stroke-width="2"/>'
                        % (x - box / 2 + 8, y - box / 2 + 8, box - 16, box - 16, INK))
        body.append(text(x, y + fs * 0.36, name, fs, INK, anchor='middle', weight=600))
    # 시작 화살표
    sx0, sy0 = pos[list(states)[0]]
    body += ['<path d="M%g %g L%g %g" stroke="%s" stroke-width="2"/>'
             % (sx0 - box * 1.15, sy0, sx0 - box / 2, sy0, T2),
             '<path d="M%g %g l-12 -6 l0 12 z" fill="%s"/>' % (sx0 - box / 2, sy0, T2),
             text(sx0 - box * 1.15, sy0 - fs * 0.6, 'start', fs * 0.8, T3)]
    for a, b, label in edges:
        (x1, y1), (x2, y2) = pos[a], pos[b]
        if a == b:
            top = y1 - box * 1.05
            body.append('<path d="M%g %g L%g %g L%g %g L%g %g" fill="none" stroke="%s" stroke-width="2"/>'
                        % (x1 - box * .3, y1 - box / 2, x1 - box * .3, top,
                           x1 + box * .3, top, x1 + box * .3, y1 - box / 2, T2))
            body.append('<path d="M%g %g l-6 -12 l12 0 z" fill="%s"/>' % (x1 + box * .3, y1 - box / 2, T2))
            body.append(text(x1, top - fs * 0.45, label, fs * 0.85, T2, anchor='middle'))
            continue
        sx, ex = x1 + box / 2, x2 - box / 2
        body.append('<path d="M%g %g L%g %g" stroke="%s" stroke-width="2"/>' % (sx, y1, ex, y2, T2))
        body.append('<path d="M%g %g l-12 -6 l0 12 z" fill="%s"/>' % (ex, y2, T2))
        body.append(text((sx + ex) / 2, y1 - fs * 0.55, label, fs * 0.9, T2, anchor='middle', weight=600))
    body.append(text(w / 2, h - fs * 1.1, caption, fs * 0.82, T3, anchor='middle', ls=fs * 0.1))
    return svg(path, w, h, title, body)


def markdown(path, w, h, tag, heading, lines, fs, lh):
    """정사각 마크다운 문서 — WRITING 썸네일."""
    bar = int(h * 0.085)
    pad = w * 0.085
    body = [rect(0, 0, w, h, PAPER)] + chrome_bar(w, bar, tag, dot=int(bar * 0.3))
    y = bar + h * 0.11
    body.append(text(pad, y, '#', fs * 1.5, T4))
    for i, seg in enumerate(heading):
        body.append(text(pad + fs * 2.0, y + i * fs * 1.75, seg, fs * 1.5, INK, family=SANS, weight=700))
    y += (len(heading) - 1) * fs * 1.75 + h * 0.085
    body.append(rect(pad, y, w * 0.18, 3, INK))
    y += h * 0.055
    for kind, s in lines:
        if y > h - lh:
            break
        if kind == 'code':
            body += [rect(pad, y - lh * 0.78, w - pad * 2, lh * 1.08, BAND),
                     rect(pad, y - lh * 0.78, 4, lh * 1.08, T4)]
            body.append(clip('md%d' % int(y), pad, y - lh, w - pad * 2, lh * 1.4,
                             [code(pad + fs * 0.9, y, s, fs * 0.88)]))
        elif kind == 'li':
            body += [rect(pad, y - fs * 0.34, fs * 0.34, fs * 0.34, T3)]
            body.append(text(pad + fs * 1.1, y, s, fs, T2, family=SANS))
        else:
            body.append(text(pad, y, s, fs, T2, family=SANS))
        y += lh
    body += [rect(pad, h - h * 0.135, w - pad * 2, 1, LINE),
             text(pad, h - h * 0.075, 'velog.io/@kannikii', fs * 0.82, T3),
             text(w - pad, h - h * 0.075, 'READ', fs * 0.82, T4, anchor='end', ls=fs * 0.12)]
    return svg(path, w, h, heading[0], body)


def sheet(path, w, h, kicker, title, rows, seal, fs):
    """세로 문서 — CREDENTIALS 카드. 아래 40%는 CSS 그라데이션이 덮는다."""
    m = w * 0.085
    body = [rect(0, 0, w, h, PAPER), rect(0, 0, w, h * 0.018, INK),
            '<rect x="%g" y="%g" width="%g" height="%g" fill="none" stroke="%s" stroke-width="2"/>'
            % (m, m * 1.4, w - m * 2, h - m * 2.6, LINE)]
    y = h * 0.135
    body.append(text(m * 1.8, y, kicker, fs * 0.78, T3, ls=fs * 0.16))
    y += h * 0.052
    for i, seg in enumerate(title):
        body.append(text(m * 1.8, y + i * fs * 1.6, seg, fs * 1.32, INK, family=SANS, weight=700))
    y += (len(title) - 1) * fs * 1.6 + h * 0.045
    body.append(rect(m * 1.8, y, w * 0.2, 2, INK))
    y += h * 0.045
    for k, v in rows:
        body.append(text(m * 1.8, y, k, fs * 0.72, T3, ls=fs * 0.1))
        body.append(clip('sh%d' % int(y), m * 1.7, y, w - m * 3.4, fs * 2.0,
                         [text(m * 1.8, y + fs * 1.25, v,
                               fs * (0.95 if len(v) < 22 else 0.78), T2, family=SANS)]))
        body.append(rect(m * 1.8, y + fs * 2.15, w - m * 3.6, 1, LINE))
        y += h * 0.085
    # 행이 많은 카드에서도 도장이 글자 위에 겹치지 않게 마지막 행 아래로 민다
    ss = w * 0.24
    sx = w - m * 1.8 - ss
    sy = min(max(h * 0.6, y + h * 0.005), h - m * 1.6 - ss)
    body += ['<rect x="%g" y="%g" width="%g" height="%g" fill="none" stroke="%s" stroke-width="2"/>'
             % (sx, sy, ss, ss, T4)]
    for i, seg in enumerate(seal):
        body.append(text(sx + ss / 2, sy + ss / 2 - fs * 0.2 + i * fs * 1.15, seg,
                         fs * 0.72, T3, anchor='middle'))
    return svg(path, w, h, title[0], body)


def dashboard(path, w, h, title, metrics, bars, fs):
    """대시보드 화면 — 지표 타일 · 파형 · 추이 선."""
    bar = int(h * 0.09)
    pad = w * 0.045
    body = [rect(0, 0, w, h, PAPER)] + chrome_bar(w, bar, title, dot=int(bar * 0.3))
    body += [rect(0, bar, w * 0.055, h - bar, SIDE), rect(w * 0.055 - 1, bar, 1, h - bar, LINE)]
    for i in range(5):
        body.append(rect(w * 0.014, bar + h * 0.05 + i * h * 0.075, w * 0.027, w * 0.016,
                         INK if i == 1 else T4))
    x0 = w * 0.055 + pad
    tw = (w - x0 - pad - pad * 0.5 * 2) / 3.0
    for i, (k, v) in enumerate(metrics):
        tx = x0 + i * (tw + pad * 0.5)
        body += ['<rect x="%g" y="%g" width="%g" height="%g" fill="none" stroke="%s" stroke-width="1.5"/>'
                 % (tx, bar + pad, tw, h * 0.17, LINE)]
        body.append(text(tx + pad * 0.5, bar + pad + h * 0.055, k, fs * 0.8, T3, ls=fs * 0.1))
        body.append(text(tx + pad * 0.5, bar + pad + h * 0.125, v, fs * 1.7, INK, family=SANS, weight=700))
    wy = bar + pad + h * 0.17 + pad
    body.append(text(x0, wy + fs * 0.9, 'WAVEFORM', fs * 0.8, T3, ls=fs * 0.1))
    wtop, whgt = wy + fs * 1.8, h * 0.2
    bw = (w - x0 - pad) / (len(bars) * 1.8)
    for i, v in enumerate(bars):
        bh = whgt * v
        body.append(rect(x0 + i * bw * 1.8, wtop + (whgt - bh) / 2.0, bw, bh,
                         INK if i % 7 == 3 else T4))
    cy = wtop + whgt + pad
    body.append(text(x0, cy + fs * 0.9, 'SCORE TREND', fs * 0.8, T3, ls=fs * 0.1))
    ctop, chgt, cw = cy + fs * 1.8, h - (cy + fs * 1.8) - pad, w - x0 - pad
    for i in range(4):
        body.append(rect(x0, ctop + chgt * i / 3.0, cw, 1, LINE))
    pts = [0.62, 0.48, 0.55, 0.34, 0.4, 0.26, 0.3, 0.16, 0.2, 0.08]
    d = ' '.join('%s%g %g' % ('M' if i == 0 else 'L', x0 + cw * i / (len(pts) - 1.0), ctop + chgt * v)
                 for i, v in enumerate(pts))
    body.append('<path d="%s" fill="none" stroke="%s" stroke-width="3"/>' % (d, INK))
    for i, v in enumerate(pts):
        body.append(rect(x0 + cw * i / (len(pts) - 1.0) - 4, ctop + chgt * v - 4, 8, 8, INK))
    return svg(path, w, h, title, body)


def archdiagram(path, w, h, title, tiers, footnote, fs):
    """아키텍처 구성도 — 계층별 상자와 연결선.

    상자는 (이름, 설명, 아래 계층에서 연결할 인덱스들) 로 준다.
    """
    body = [rect(0, 0, w, h, PAPER), rect(0, 0, w, h * 0.012, INK),
            text(w * 0.05, h * 0.115, title, fs * 1.15, INK, family=SANS, weight=700),
            rect(w * 0.05, h * 0.145, w * 0.06, 3, INK)]
    top, bottom = h * 0.24, h * 0.9
    rows = len(tiers)
    rh = (bottom - top) / rows
    geo = []
    for r, (label, boxes) in enumerate(tiers):
        y = top + r * rh
        body.append(text(w * 0.05, y + fs * 0.9, label, fs * 0.78, T3, ls=fs * 0.12))
        bx0, bw_all, gap = w * 0.22, w * 0.73, w * 0.022
        n = len(boxes)
        bw = (bw_all - gap * (n - 1)) / n
        bh = rh * 0.5
        row = []
        for i, (name, sub, _) in enumerate(boxes):
            x = bx0 + i * (bw + gap)
            body += [rect(x, y, bw, bh, BAND),
                     '<rect x="%g" y="%g" width="%g" height="%g" fill="none" stroke="%s" stroke-width="2"/>'
                     % (x, y, bw, bh, INK)]
            body.append(text(x + bw / 2, y + bh * 0.44, name, fs * 0.95, INK,
                             family=SANS, weight=700, anchor='middle'))
            body.append(text(x + bw / 2, y + bh * 0.74, sub, fs * 0.72, T2, anchor='middle'))
            row.append((x + bw / 2, y, y + bh))
        geo.append(row)
    for r in range(rows - 1):
        for i, (_, _, targets) in enumerate(tiers[r][1]):
            cx, _, cb = geo[r][i]
            for t in targets:
                nx, ty, _ = geo[r + 1][t]
                mid = (cb + ty) / 2
                body.append('<path d="M%g %g L%g %g L%g %g L%g %g" fill="none" stroke="%s" stroke-width="2"/>'
                            % (cx, cb, cx, mid, nx, mid, nx, ty - 12, T2))
                body.append('<path d="M%g %g l-7 -12 l14 0 z" fill="%s"/>' % (nx, ty, T2))
    body.append(text(w * 0.05, h * 0.955, footnote, fs * 0.78, T3, ls=fs * 0.08))
    return svg(path, w, h, title, body)


def ide(path, w, h, project, tree, tabs, left, right, term_lines, fs, lh, dark=False):
    """히어로용 넓은 IDE 화면 — 파일 트리 · 탭 두 장 · 하단 터미널.

    아래쪽은 CSS 그라데이션이 덮으므로 어두운 터미널을 깔아 자연스럽게 잇는다.
    """
    with palette(DARK if dark else {}):
        bar, tabh = int(h * 0.052), int(h * 0.048)
        act, side = w * 0.032, w * 0.175
        termh = h * 0.3
        body = [rect(0, 0, w, h, PAPER)] + chrome_bar(w, bar, project, dot=int(bar * 0.3))
        # 액티비티 바 · 파일 트리
        body += [rect(0, bar, act, h - bar, ACT), rect(act, bar, side, h - bar, SIDE),
                 rect(act + side - 1, bar, 1, h - bar, LINE)]
        for i in range(5):
            body.append(rect(act * 0.3, bar + h * 0.04 + i * h * 0.062, act * 0.4, act * 0.28,
                             INK if i == 0 else T4))
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
                body += [rect(tx, bar, tw, tabh, PAPER), rect(tx, bar, tw, 2, INK)]
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
            body.append(text(fs * 1.6, yy, ln, fs * 0.95,
                             TERM_P if ln.startswith('$') else (TERM_D if ln.startswith('  ') else TERM_T)))
            yy += lh
        return svg(path, w, h, project, [b for b in body if b])


# ===========================================================================
#  실제 이미지
# ===========================================================================

def build():
    made = []

    # --- HERO -------------------------------------------------------------
    # 히어로는 어두운 테마다. 위에 흰 제목이 얹히므로 밝은 화면이면 읽히지 않는다.
    made.append(ide('hero-16x9.svg', 1920, 1080, 'artifact-medical-ai — Spring Boot', dark=True,
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

    # --- WORK 카드 --------------------------------------------------------
    made.append(editor('work/artifact-medical-ai-3x2.svg', 1200, 800,
        'DiagnosisController.java — artifact-medical-ai', [
            '@RestController',
            '@RequestMapping("/api/v1/diagnoses")',
            '@RequiredArgsConstructor',
            'public class DiagnosisController {',
            '',
            '    private final DiagnosisService service;',
            '',
            '    @PostMapping',
            '    public DiagnosisResponse analyze(',
            '            @Valid @RequestBody DiagnosisRequest req) {',
            '        return service.analyze(req);',
            '    }',
            '',
            '    @GetMapping("/{id}/prescriptions")',
            '    public List<PrescriptionResponse> prescriptions(',
            '            @PathVariable Long id) {',
            '        return service.prescriptionsOf(id);',
            '    }',
            '}',
        ], fs=27, lh=38, tail=56))

    made.append(dashboard('work/speakflow-3x2.svg', 1200, 800, 'SpeakFlow — 발표 분석 리포트',
        metrics=[('SPEECH RATE', '312 wpm'), ('FILLER', '7 회'), ('EYE CONTACT', '82 %')],
        bars=[.3, .55, .8, 1, .7, .45, .6, .9, .5, .35, .75, .95, .6, .4, .55, .85,
              .65, .3, .5, .7, .9, .45, .6, .8, .35, .55, .75, .5, .4, .65],
        fs=22))

    # --- WORK 상세 히어로 · 구성도 ----------------------------------------
    made.append(terminal('work/artifact-hero-16x9.svg', 1920, 1080,
        'artifact-medical-ai — docker compose', [
            '$ docker compose up -d --build',
            '  [+] Building 48.2s (32/32) FINISHED',
            '  [+] Running 4/4',
            '   Container artifact-db      Started   0.9s',
            '   Container artifact-ai      Started   1.4s',
            '   Container artifact-api     Started   1.8s',
            '   Container artifact-web     Started   2.1s',
            '',
            '$ ./gradlew bootRun',
            '  Started ArtifactApplication in 3.284 seconds',
            '  Tomcat started on port 8080 (http)',
            '  Loaded 24,113 KCD codes / 490,552 prescription codes',
            '',
            '$ curl -s localhost:8080/actuator/health',
            '  {"status":"UP","components":{"db":{"status":"UP"}}}',
            '',
            '$ ',
        ], fs=24, lh=38))

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
    return made


def build_lab():
    """LAB 8장 — 에디터 · 터미널 · diff · 상태도를 섞어 카드가 단조롭지 않게 한다."""
    W, H, FS, LH = 940, 588, 32, 44
    made = []

    made.append(editor('lab/handcraftedboard-16x10.svg', W, H, 'PostService.java', [
        '@Service',
        '@Transactional(readOnly = true)',
        'public class PostService {',
        '',
        '    private final PostRepository posts;',
        '',
        '    @Transactional',
        '    public Long write(PostCommand cmd) {',
        '        return posts.save(cmd.toEntity()).getId();',
        '    }',
        '}',
    ], fs=FS, lh=LH))

    made.append(terminal('lab/problem-solving-16x10.svg', W, H, 'g++ — main.cpp', [
        '$ g++ -O2 -std=c++17 main.cpp -o sol',
        '$ ./sol < input.txt',
        '  1 2 4 5 3',
        '',
        '$ solved.ac --sync',
        '  streak 128 days  ·  tier Gold I',
        '$ ',
    ], fs=34, lh=52))

    made.append(statechart('lab/regex-to-dfa-16x10.svg', W, H, 'RegexToDFA — (a|b)*abb',
        states={'q0': (.20, .46), 'q1': (.43, .46), 'q2': (.66, .46), 'q3': (.88, .46)},
        edges=[('q0', 'q1', 'a'), ('q1', 'q2', 'b'), ('q2', 'q3', 'b'),
               ('q0', 'q0', 'a | b')], accept={'q3'},
        caption='NFA 12 STATES  ->  DFA 4 STATES', fs=30))

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

    made.append(editor('lab/xmas-tree-note-16x10.svg', W, H, 'TreeNote.jsx', [
        'export default function TreeNote({ notes }) {',
        '  const [open, setOpen] = useState(null);',
        '',
        '  return (',
        '    <ul className="tree">',
        '      {notes.map((n) => (',
        '        <Ornament key={n.id} note={n} />',
        '      ))}',
        '    </ul>',
        '  );',
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
    W = 800
    FS, LH = 30, 44
    posts = [
        ('repository-design', 'Spring Boot · JPA', ['도메인별 API 명세부터', '다시 쓴 레포지토리', '설계 기록'],
         [('p', '도메인 경계를 먼저 긋고 나서야'), ('p', '레포지토리 시그니처가 정리됐다.'),
          ('code', 'Optional<Post> findBySlug(String slug);'), ('li', '도메인별 패키지 분리'), ('li', 'N+1 제거'), ('li', '슬러그 기반 조회')]),
        ('springboot-study', 'Spring Boot · 설계', ['스프링부트', '학습용 프로젝트'],
         [('p', '게시판 하나를 처음부터 다시 만들며'), ('p', '계층 구조를 손에 익혔다.'),
          ('code', '@Transactional(readOnly = true)'), ('li', '계층 분리'), ('li', '테스트 코드'), ('li', '예외 처리 일원화')]),
        ('network-quiz-2', 'Network', ['컴퓨터 네트워크', '문제풀이 2'],
         [('p', '전송 계층 문제를 풀며 정리한'), ('p', '흐름 제어와 혼잡 제어 노트.'),
          ('code', 'cwnd = cwnd + MSS * (MSS / cwnd)'), ('li', 'TCP 상태 전이'), ('li', '슬라이딩 윈도우'), ('li', 'RTT 추정')]),
        ('cookie-session-jwt', 'Auth · HTTP', ['쿠키, 세션,', 'JWT 토큰'],
         [('p', '세 가지를 같은 기준으로 비교하면'), ('p', '어디에 무엇을 둘지가 분명해진다.'),
          ('code', 'Authorization: Bearer <token>'), ('li', '저장 위치'), ('li', '만료와 갱신'), ('li', 'XSS · CSRF')]),
        ('spring-mvc', 'Spring · MVC', ['스프링 MVC', '아키텍처와 흐름'],
         [('p', '요청 하나가 어디를 거쳐'), ('p', '응답이 되는지 따라가 봤다.'),
          ('code', 'DispatcherServlet -> HandlerAdapter'), ('li', '핸들러 매핑'), ('li', '뷰 리졸버'), ('li', '인터셉터')]),
        ('http-flow', 'Network · HTTP', ['HTTP 요청', '흐름 설명'],
         [('p', '주소창에 입력한 순간부터'), ('p', '화면이 그려지기까지의 경로.'),
          ('code', 'DNS -> TCP -> TLS -> HTTP'), ('li', '3-way handshake'), ('li', '캐시 헤더'), ('li', 'keep-alive')]),
        ('spring-bean', 'Spring · DI', ['@Bean', '생성 과정'],
         [('p', '컨테이너가 빈을 언제 만들고'), ('p', '언제 주입하는지 정리했다.'),
          ('code', '@Configuration  @Bean'), ('li', '싱글톤 레지스트리'), ('li', '순환 참조'), ('li', '생명주기 콜백')]),
        ('compiler-optimization', 'Compiler', ['컴파일러', '최적화'],
         [('p', '중간 표현 위에서 일어나는'), ('p', '최적화들을 단계별로 봤다.'),
          ('code', 'constant folding / DCE / inlining'), ('li', '기본 블록'), ('li', '데이터 흐름 분석'), ('li', '레지스터 할당')]),
    ]
    return [markdown('writing/%s-1x1.svg' % slug, W, W, tag, head, body, FS, LH)
            for slug, tag, head, body in posts]


def build_cred():
    W, H, FS = 700, 1050, 34
    return [
        sheet('cred/umc-award-2x3.svg', W, H, 'GRAND PRIZE', ['너디너리 페스티벌', 'UMC 10th'],
              [('AWARD', '대상'), ('HOST', 'University Makeus Challenge'), ('YEAR', '2026')],
              ['UMC', '10th'], FS),
        sheet('cred/injeju-award-2x3.svg', W, H, 'BEST AWARD', ['In-Jeju', 'Challenge'],
              [('AWARD', '최우수상 · 총장상'), ('HOST', '사물인터넷 혁신융합대학사업단'), ('YEAR', '2026')],
              ['IoT', '2026'], FS),
        # 제목은 두 줄로 맞춘다. 세 줄이면 본문이 밀려 카드 캡션과 겹친다.
        sheet('cred/certifications-2x3.svg', W, H, 'CERTIFICATIONS', ['정보처리기사', 'SQLD'],
              [('ENGINEER', '정보처리기사'), ('DATA', 'SQL 개발자 (SQLD)'), ('CRAFTSMAN', '프로그래밍기능사')],
              ['3', 'CERTS'], FS),
    ]


if __name__ == '__main__':
    files = build() + build_lab() + build_writing() + build_cred()
    for f in files:
        print(f)
    print('%d files' % len(files))
