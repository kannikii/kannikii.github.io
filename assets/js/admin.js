/* ==========================================================================
   admin.js — 정적 사이트를 브라우저에서 고치고 깃허브에 바로 커밋한다.

   중간 데이터 파일을 두지 않는다. 깃허브에서 HTML 을 그대로 받아
   DOMParser 로 읽고, 고친 DOM 을 다시 HTML 로 직렬화해 커밋한다.
   그래서 공개 페이지는 지금처럼 자바스크립트 없이도, file:// 로 열어도
   그대로 동작한다. 관리자 모드는 이 페이지 안에서만 산다.

   고치는 길은 셋이다. 탭의 입력 칸, 미리보기 안의 글자 (contenteditable),
   블록 단위 조작 (옮기기 · 복제 · 삭제). 셋 다 같은 state.doc 을 고치고,
   한쪽에서 고치면 나머지가 따라온다.

   토큰은 localStorage 에만 둔다. 깃허브 API 말고는 아무 데도 보내지 않는다.
   ========================================================================== */

(function () {
  'use strict';

  var API = 'https://api.github.com';
  var STORE = 'khl-admin';
  var IMG_RE = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

  /* 올리는 사진의 긴 변 상한. 사이트에서 이보다 크게 보여 주는 자리가 없다. */
  var MAX_EDGE = 1600;
  var JPEG_QUALITY = 0.86;
  var HISTORY_MAX = 30;

  /* 카드 한 장에서 고칠 수 있는 글자. 클래스로 찾는다. */
  var FIELDS = [
    { sel: '.card__tag',        label: '태그' },
    { sel: '.card__title',      label: '제목' },
    { sel: '.card__desc',       label: '설명' },
    { sel: '.card__meta',       label: '메타' },
    { sel: '.cred__card-label', label: '상 구분' },
    { sel: '.cred__card-text',  label: '이름' },
    { sel: '.cred__card-more',  label: '버튼 글씨' }
  ];

  /* 카드 자체에 붙는 속성. 링크와 상장 라이트박스 설정이다. */
  var ATTRS = [
    { name: 'href',                    label: '링크' },
    { name: 'data-lightbox',           label: '원본 이미지 경로' },
    { name: 'data-lightbox-caption',   label: '원본 캡션' },
    { name: 'data-lightbox-href',      label: '연결 저장소' },
    { name: 'data-lightbox-href-text', label: '연결 글씨' }
  ];

  /* index.html 에서 카드 목록으로 다루는 자리. */
  var GRIDS = [
    { sel: '.work__grid',    name: 'Work — 메인 프로젝트' },
    { sel: '.lab__track',    name: 'Side Projects' },
    { sel: '.writing__grid', name: 'Writing — 블로그 글', link: true },
    { sel: '.cred__cards',   name: 'Credentials — 수상' }
  ];

  var GRID_SEL = GRIDS.map(function (g) { return g.sel; }).join(', ');
  var FIELD_SEL = FIELDS.map(function (f) { return f.sel; }).join(', ');

  /* 텍스트로 다룰 요소. 블록 자식이 없는 것만 고른다. */
  var TEXT_SEL = 'h1, h2, h3, h4, p, li, dd, dt, blockquote, figcaption, pre';
  var BLOCK_SEL = 'div, section, article, ul, ol, dl, figure, table, p, h1, h2, h3, h4';

  /* 본문이 아닌 자리. 메뉴 · 머리말 · 꼬리말 · 라이트박스 껍데기는 고치지 않는다. */
  var SKIP_SEL = '.site-header, .gnb, .site-footer, .lightbox, .to-top, script, noscript, template';

  /* 해라체로 끝나는 낱말. 문장 끝 (마침표 · 물음표 · 닫는 괄호 · 글 끝) 바로 앞의 '…다'.
     '…니다' 는 합니다체라 뺀다. 표시만 하고 고치지는 않는다. */
  var BANMAL_RE = /[가-힣]+다(?=\s*(?:[.!?…"'”’)\]]|$))/g;

  /* 미리보기 iframe 안에만 넣는 스타일. 공개 페이지에는 들어가지 않는다. */
  var FRAME_CSS = [
    /* 다시 그릴 때마다 카드가 페이드 인 되며 깜빡이지 않게 리빌을 끈다 */
    '.reveal{opacity:1!important;transform:none!important;transition:none!important}',
    'html{scroll-behavior:auto!important}',
    'html.ad-edit [data-ad-i]{cursor:text;-webkit-user-select:text;user-select:text}',
    'html.ad-edit a{-webkit-user-drag:none}',
    'html.ad-edit [data-ad-i]:hover{outline:1px dashed currentColor;outline-offset:3px}',
    'html.ad-edit [data-ad-i]:focus{outline:2px solid currentColor;outline-offset:3px}',
    'html.ad-edit [data-ad-i]:empty{display:inline-block;min-width:6em}',
    'html.ad-edit [data-ad-i]:empty::before{content:"(비어 있음)";opacity:.45}',
    '[data-ad-warn]::after{content:"반말?";display:inline-block;margin-left:.5em;padding:1px 5px;' +
      'border:1px solid currentColor;font:600 10px/1.4 system-ui,sans-serif;letter-spacing:0;' +
      'text-transform:none;vertical-align:middle}',
    '::highlight(ad-banmal){background-color:rgba(128,128,128,.4);text-decoration:underline wavy}',
    '#ad-bar{all:initial;position:fixed;z-index:2147483647;display:none;align-items:center;gap:4px;' +
      'padding:4px;background:#000;color:#fff;font:500 12px/1 "Pretendard Variable",system-ui,sans-serif;' +
      'box-shadow:0 2px 10px rgba(0,0,0,.3)}',
    '#ad-bar[data-on]{display:flex}',
    '#ad-bar span{all:initial;padding:0 6px 0 4px;color:#aaa;font:inherit}',
    '#ad-bar button{all:initial;padding:5px 9px;border:1px solid #555;color:#fff;font:inherit;cursor:pointer}',
    '#ad-bar button:hover{background:#333}'
  ].join('\n');

  var MIME = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
    avif: 'image/avif', gif: 'image/gif', svg: 'image/svg+xml'
  };

  var state = {
    owner: '', repo: '', branch: 'main', token: '',
    path: '', sha: '', doc: null, tree: null, pickTarget: null,
    dirty: false,
    history: [],          /* 직렬화한 HTML. 구조를 바꾸기 직전과 칸에 입력을 시작할 때 쌓는다. */
    editKey: null,        /* 지금 입력 중인 칸. 같은 칸에서 이어 치면 더 쌓지 않는다. */
    bound: new Map(),     /* 문서 요소 → 그 요소를 보여 주는 입력 칸들 */
    frameList: [],        /* 미리보기의 data-ad-i 번호 → 문서 요소 */
    frameIndex: new Map(),
    editMode: true,
    barTarget: null,
    localUrls: {},        /* 방금 올리거나 바꾼 이미지. raw 캐시 대신 이 사본을 보여 준다. */
    lintCursor: -1,
    hints: {}
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text != null) { n.textContent = text; }
    return n;
  }

  function debounce(fn, ms) {
    var t = 0;
    return function () {
      window.clearTimeout(t);
      t = window.setTimeout(fn, ms);
    };
  }

  function assign(a, b) {
    Object.keys(b).forEach(function (k) { a[k] = b[k]; });
    return a;
  }

  /** 받침에 맞춰 조사를 붙인다. pair 는 '을/를' 처럼 받침 있을 때 / 없을 때. */
  function josa(word, pair) {
    var c = word.charCodeAt(word.length - 1);
    var has = c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
    var p = pair.split('/');
    return word + (has ? p[0] : p[1]);
  }

  /* ------------------------------------------------------------------ 알림 */
  var toastTimer = 0;

  function toast(msg, bad) {
    var el = $('[data-toast]');
    el.textContent = msg;
    el.classList.toggle('ad-toast--bad', !!bad);
    el.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.hidden = true; }, bad ? 8000 : 4000);
  }

  function hintOnce(key, msg) {
    if (state.hints[key]) { return; }
    state.hints[key] = true;
    toast(msg);
  }

  /* ------------------------------------------------------- base64 ↔ UTF-8 */
  function toB64(text) {
    var bytes = new TextEncoder().encode(text);
    var out = '';
    /* 한 번에 넘기면 인자 수 제한에 걸린다. 잘라서 붙인다. */
    for (var i = 0; i < bytes.length; i += 0x8000) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return window.btoa(out);
  }

  function fromB64(b64) {
    var bin = window.atob(String(b64).replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) { bytes[i] = bin.charCodeAt(i); }
    return new TextDecoder().decode(bytes);
  }

  function bufToB64(buf) {
    var bytes = new Uint8Array(buf);
    var out = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return window.btoa(out);
  }

  /* ------------------------------------------------------------- 깃허브 API */
  function api(method, path, body) {
    return window.fetch(API + path, {
      method: method,
      headers: {
        'Authorization': 'Bearer ' + state.token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = text ? JSON.parse(text) : {};
        if (!res.ok) {
          throw new Error(data.message || (res.status + ' ' + res.statusText));
        }
        return data;
      });
    });
  }

  function repoPath(rest) {
    return '/repos/' + state.owner + '/' + state.repo + rest;
  }

  function encodePath(p) {
    return String(p).split('/').map(encodeURIComponent).join('/');
  }

  function contentsPath(p) {
    return repoPath('/contents/' + encodePath(p));
  }

  function rawUrl(path) {
    return 'https://raw.githubusercontent.com/' + state.owner + '/' + state.repo +
           '/' + state.branch + '/' + encodePath(path);
  }

  function imgUrl(path) {
    return state.localUrls[path] || rawUrl(path);
  }

  /** 저장소 경로의 이미지를 띄운다. raw 주소가 열리지 않으면 (비공개 저장소 · 오프라인)
      이 사이트에 배포된 사본으로 바꾼다. admin.html 이 저장소 루트에 있어 경로가 같다. */
  function showImg(im, path) {
    im.onerror = state.localUrls[path] ? null : function () {
      im.onerror = null;
      im.src = encodePath(path);
    };
    im.src = imgUrl(path);
  }

  /* ------------------------------------------------------------------ 저장소 */
  function readStore() {
    try { return JSON.parse(window.localStorage.getItem(STORE) || '{}'); }
    catch (e) { return {}; }
  }

  function writeStore(obj) {
    try { window.localStorage.setItem(STORE, JSON.stringify(obj)); }
    catch (e) { /* 시크릿 창에서는 막힐 수 있다. 무시한다. */ }
  }

  function forget() {
    try { window.localStorage.removeItem(STORE); } catch (e) {}
    state.token = '';
    $('[data-f="token"]').value = '';
    $('[data-forget]').hidden = true;
    toast('이 브라우저에서 토큰을 지웠습니다.');
  }

  /* ------------------------------------------------------------------ 연결 */
  function connect() {
    ['owner', 'repo', 'branch', 'token'].forEach(function (k) {
      state[k] = $('[data-f="' + k + '"]').value.trim();
    });

    if (!state.owner || !state.repo || !state.token) {
      toast('소유자 · 저장소 · 토큰을 모두 입력해 주세요.', true);
      return;
    }

    api('GET', repoPath('')).then(function (repo) {
      if (!repo.permissions || !repo.permissions.push) {
        throw new Error('이 토큰에는 쓰기 권한이 없습니다. Contents: Read and write 권한을 주세요.');
      }
      if ($('[data-remember]').checked) {
        writeStore({ owner: state.owner, repo: state.repo, branch: state.branch, token: state.token });
      }
      $('[data-forget]').hidden = false;
      $('[data-step="file"]').hidden = false;
      $('[data-where]').textContent = state.owner + '/' + state.repo + ' · ' + state.branch;
      state.tree = null;
      toast('연결했습니다.');
    }).catch(function (err) {
      toast('연결하지 못했습니다 — ' + err.message, true);
    });
  }

  /* ------------------------------------------------------------- 파일 열기 */
  function openFile(force) {
    if (state.dirty && force !== true &&
        !window.confirm('저장하지 않은 수정이 있습니다. 다른 페이지를 불러오면 사라집니다. 계속할까요?')) {
      return;
    }
    var path = $('[data-file]').value;

    api('GET', contentsPath(path) + '?ref=' + encodeURIComponent(state.branch))
      .then(function (file) {
        state.path = path;
        state.sha = file.sha;
        state.doc = new DOMParser().parseFromString(fromB64(file.content), 'text/html');
        state.history = [];
        state.editKey = null;
        state.dirty = false;
        state.lintCursor = -1;

        var cards = renderAll();
        updateUndo();

        $('[data-step="edit"]').hidden = false;
        $('[data-step="save"]').hidden = false;
        $('[data-where]').textContent =
          state.owner + '/' + state.repo + ' · ' + state.branch + ' · ' + path;
        selectTab(cards ? 'cards' : 'text');
        if (previewOpen()) { preview(false); }
        toast(path + ' 파일을 불러왔습니다.');
      }).catch(function (err) {
        toast('불러오지 못했습니다 — ' + err.message, true);
      });
  }

  /* --------------------------------------------------------------- 경로 계산 */
  /** 편집 중인 파일에서 저장소 루트의 파일을 가리키는 상대 경로. */
  function relFromFile(repoRelPath) {
    var up = state.path.split('/').length - 1;
    return new Array(up + 1).join('../') + repoRelPath;
  }

  /** 반대로, 편집 중인 파일 기준 상대 경로를 저장소 루트 기준으로 되돌린다. */
  function repoFromRel(rel) {
    var base = state.path.split('/').slice(0, -1);
    var parts = String(rel).split('/');
    parts.forEach(function (p) {
      if (p === '..') { base.pop(); }
      else if (p !== '.' && p !== '') { base.push(p); }
    });
    return base.join('/');
  }

  function isExternal(src) {
    return /^(?:[a-z]+:)?\/\//i.test(src) || /^(?:data|blob):/i.test(src);
  }

  /** img 의 src 를 저장소 경로로. 바깥 주소면 null. */
  function resolveSrc(src) {
    if (!src || isExternal(src)) { return null; }
    return repoFromRel(src.split(/[?#]/)[0]);
  }

  function setThumb(im, src) {
    if (!src) { im.onerror = null; im.removeAttribute('src'); return; }
    if (isExternal(src)) { im.onerror = null; im.src = src; return; }
    showImg(im, resolveSrc(src));
  }

  /* ------------------------------------------------------- 실행 취소 · 수정 표시 */
  function snapshot() {
    if (!state.doc) { return; }
    state.history.push(serialize());
    if (state.history.length > HISTORY_MAX) { state.history.shift(); }
    state.editKey = null;
    state.dirty = true;
    updateUndo();
  }

  /** 칸에 입력을 시작할 때 한 번만 스냅숏을 남긴다. 한 글자마다 쌓지 않는다. */
  function touch(key) {
    if (state.editKey === key) { return; }
    snapshot();
    state.editKey = key;
  }

  function undo() {
    if (!state.doc) { return; }
    if (!state.history.length) { toast('더 되돌릴 작업이 없습니다.'); return; }
    state.doc = new DOMParser().parseFromString(state.history.pop(), 'text/html');
    state.editKey = null;
    renderAll();
    updateUndo();
    if (previewOpen()) { preview(true); }
    toast('한 단계 되돌렸습니다.');
  }

  function updateUndo() {
    $$('[data-undo]').forEach(function (b) { b.disabled = !state.history.length; });
  }

  function renderAll() {
    state.bound = new Map();
    var cards = renderCards();
    renderText();
    renderImages();
    lintSummary();
    return cards;
  }

  /** 구조를 바꾼 뒤 탭과 미리보기를 다시 그린다. */
  function afterChange(focusEl, fromFrame) {
    renderAll();
    if (previewOpen()) { preview(true, fromFrame ? focusEl : null); }
    if (!fromFrame && focusEl) { focusControl(focusEl); }
  }

  /* ------------------------------------------------------------ 값 연결 */
  /* prop 은 'textContent' · 'innerHTML' 이거나 '@속성이름' 이다. */
  function getProp(el, prop) {
    return prop.charAt(0) === '@' ? (el.getAttribute(prop.slice(1)) || '') : el[prop];
  }

  /** 칸에 보여 줄 값. 소스의 줄바꿈과 들여쓰기는 화면에서 아무 뜻이 없으니 한 칸으로 줄인다.
      pre 는 공백이 곧 내용이라 그대로 둔다. 고치지 않은 요소의 원본은 건드리지 않는다. */
  function shownProp(el, prop) {
    var v = getProp(el, prop);
    if (prop.charAt(0) === '@' || el.closest('pre')) { return v; }
    return v.replace(/\s*\n\s*/g, ' ').trim();
  }

  function setProp(el, prop, v) {
    if (prop.charAt(0) === '@') { el.setAttribute(prop.slice(1), v); }
    else { el[prop] = v; }
  }

  function bind(el, ctl, prop, wrap) {
    var list = state.bound.get(el);
    if (!list) { list = []; state.bound.set(el, list); }
    list.push({ ctl: ctl, prop: prop, wrap: wrap });
    if (wrap) {
      wrap._adEl = el;
      wrap._adProp = prop;
      lintInto(wrap);
    }
  }

  /** 한 요소가 바뀌면 그 요소를 보여 주는 다른 칸과 미리보기를 맞춘다. */
  function refreshEl(el, source) {
    (state.bound.get(el) || []).forEach(function (b) {
      if (b.ctl !== source) { b.ctl.value = shownProp(el, b.prop); }
      if (b.wrap) { lintInto(b.wrap); }
    });
    if (!source || source.ownerDocument === document) { syncFrame(el); }
    lintSummarySoon();
  }

  function focusControl(el) {
    var list = state.bound.get(el) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].prop === 'innerHTML' || list[i].prop === 'textContent') {
        list[i].ctl.focus({ preventScroll: true });
        list[i].ctl.scrollIntoView({ block: 'center' });
        return;
      }
    }
  }

  function btn(label, fn, title) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ad-btn ad-btn--tiny';
    b.textContent = label;
    if (title) { b.title = title; b.setAttribute('aria-label', title); }
    b.addEventListener('click', fn);
    return b;
  }

  /** 한 줄 입력 칸. 문서의 el[prop] 과 묶인다. */
  function field(label, el, prop, opts) {
    opts = opts || {};
    var wrap = make('label', 'ad-field' + (opts.wide ? ' ad-field--wide' : ''));
    wrap.appendChild(make('span', '', label));
    var input = document.createElement('input');
    input.type = 'text';
    input.value = shownProp(el, prop);
    input.addEventListener('input', function () {
      touch(input);
      setProp(el, prop, input.value);
      refreshEl(el, input);
      if (opts.after) { opts.after(input.value); }
    });
    wrap.appendChild(input);
    bind(el, input, prop, opts.lint ? wrap : null);
    return wrap;
  }

  /* ------------------------------------------------------------ 블록 조작 */
  /** 글자 하나를 고칠 때 함께 움직일 덩어리. 카드 · 그림 · 항목 · 섹션 · 사실 … */
  function unitOf(el) {
    var host = el.closest(GRID_SEL);
    if (host && host !== el) {
      var card = el;
      while (card.parentElement !== host) { card = card.parentElement; }
      return { node: card, label: '카드' };
    }

    var tag = el.tagName.toLowerCase();
    var parent = el.parentElement;

    if (tag === 'figcaption' && el.closest('figure')) {
      return { node: el.closest('figure'), label: '그림' };
    }
    if (/^h[1-4]$/.test(tag) && parent && parent.firstElementChild === el) {
      if (parent.classList.contains('detail__item'))  { return { node: parent, label: '항목' }; }
      if (parent.classList.contains('detail__block')) { return { node: parent, label: '섹션' }; }
    }
    if (tag === 'dt' || tag === 'dd') {
      if (parent && parent.tagName === 'DIV' && parent.parentElement &&
          parent.parentElement.tagName === 'DL') {
        return { node: parent, label: '사실' };
      }
      return { node: el, label: '사실' };
    }
    if (tag === 'li') { return { node: el, label: '목록 항목' }; }
    if (tag === 'p')  { return { node: el, label: '문단' }; }
    if (/^h[1-4]$/.test(tag)) { return { node: el, label: '제목' }; }
    return { node: el, label: '블록' };
  }

  function isGap(n) {
    return n && n.nodeType === 3 && !n.nodeValue.trim();
  }

  /* 형제 사이의 줄바꿈 · 들여쓰기 텍스트 노드는 그 자리에 두고 요소만 맞바꾼다.
     insertBefore 로 옮기면 들여쓰기가 한쪽으로 몰려 저장한 HTML 이 지저분해진다. */
  function swap(a, b) {
    var mark = a.ownerDocument.createTextNode('');
    a.before(mark);
    b.before(a);
    mark.replaceWith(b);
  }

  /** ref 바로 뒤에 node 를 넣는다. ref 앞의 들여쓰기를 한 벌 복사해 둔다. */
  function insertAfter(ref, node) {
    var gap = isGap(ref.previousSibling) ? ref.previousSibling.cloneNode() : null;
    var after = ref.nextSibling;
    if (gap) { ref.parentNode.insertBefore(gap, after); }
    ref.parentNode.insertBefore(node, after);
  }

  function removeWithGap(node) {
    if (isGap(node.previousSibling)) { node.previousSibling.remove(); }
    node.remove();
  }

  /* 복제본에 같은 id 가 둘 생기지 않게 지운다. 그 id 를 가리키던 aria 도 함께. */
  function stripIds(root) {
    [root].concat($$('[id], [aria-labelledby]', root)).forEach(function (n) {
      n.removeAttribute('id');
      n.removeAttribute('aria-labelledby');
    });
  }

  function pathTo(root, el) {
    var path = [];
    while (el && el !== root) {
      path.unshift(Array.prototype.indexOf.call(el.parentElement.children, el));
      el = el.parentElement;
    }
    return el === root ? path : null;
  }

  function follow(root, path) {
    if (!path) { return null; }
    var n = root;
    for (var i = 0; i < path.length && n; i++) { n = n.children[path[i]]; }
    return n || null;
  }

  /** op: up · down · dup · del. el 은 고치던 글자 요소나 카드. */
  function runOp(op, el, fromFrame) {
    var u = unitOf(el);
    var node = u.node;
    var focus = el;
    var msg = '';

    if (op === 'up' || op === 'down') {
      var other = op === 'up' ? node.previousElementSibling : node.nextElementSibling;
      if (!other) { toast(op === 'up' ? '이미 맨 위입니다.' : '이미 맨 아래입니다.'); return; }
      snapshot();
      swap(node, other);
    } else if (op === 'dup') {
      snapshot();
      var copy = node.cloneNode(true);
      stripIds(copy);
      insertAfter(node, copy);
      focus = follow(copy, pathTo(node, el)) || copy;
      msg = josa(u.label, '을/를') + ' 복제했습니다. 바로 아래에 생긴 쪽을 고쳐 주세요.';
    } else if (op === 'del') {
      var parent = node.parentElement;
      if (parent && parent.matches(GRID_SEL) && parent.children.length < 2) {
        toast('마지막 카드는 새 카드의 본보기라서 지우지 않습니다.', true);
        return;
      }
      snapshot();
      removeWithGap(node);
      focus = null;
      msg = josa(u.label, '을/를') + ' 삭제했습니다. 실행 취소로 되돌릴 수 있습니다.';
    } else {
      return;
    }

    if (fromFrame) { hideBar(); }
    afterChange(focus, fromFrame);
    if (msg) { toast(msg); }
  }

  /* ------------------------------------------------------------- 카드 편집 */
  function renderCards() {
    var pane = $('[data-pane="cards"]');
    pane.textContent = '';
    if (!state.doc) { return 0; }
    var found = 0;

    GRIDS.forEach(function (grid) {
      var host = state.doc.querySelector(grid.sel);
      if (!host) { return; }
      found++;

      pane.appendChild(make('h3', 'ad-h3', grid.name));
      Array.prototype.forEach.call(host.children, function (card, i) {
        pane.appendChild(cardRow(host, card, i));
      });

      var acts = make('div', 'ad-row');
      var add = make('button', 'ad-btn', '＋ 새 카드');
      add.type = 'button';
      add.addEventListener('click', function () { addCard(host); });
      acts.appendChild(add);
      if (grid.link) { acts.appendChild(linkAdder(host)); }
      pane.appendChild(acts);
    });

    if (!found) {
      pane.appendChild(make('p', 'ad-note',
        '이 페이지에는 카드 목록이 없습니다. 텍스트 탭이나 미리보기에서 고쳐 주세요.'));
    }
    return found;
  }

  function cardRow(host, card, i) {
    var row = make('div', 'ad-item');

    /* 왼쪽 — 썸네일과 순서 · 조작 */
    var side = make('div', 'ad-item__side');
    var img = card.querySelector('img');
    var thumb = make('img', 'ad-item__thumb');
    thumb.alt = '';
    if (img && img.getAttribute('src')) { setThumb(thumb, img.getAttribute('src')); }
    side.appendChild(thumb);
    side.appendChild(make('p', 'ad-item__no', (i + 1) + ' / ' + host.children.length));

    var acts = make('div', 'ad-item__acts');
    acts.appendChild(btn('↑', function () { runOp('up', card); }, '카드를 위로'));
    acts.appendChild(btn('↓', function () { runOp('down', card); }, '카드를 아래로'));
    acts.appendChild(btn('복제', function () { runOp('dup', card); }));
    if (img) { acts.appendChild(btn('이미지', function () { openPicker(img); })); }
    acts.appendChild(btn('삭제', function () { runOp('del', card); }));
    side.appendChild(acts);
    row.appendChild(side);

    /* 오른쪽 — 글자와 속성 */
    var body = make('div', 'ad-item__body');
    FIELDS.forEach(function (f) {
      var el = card.querySelector(f.sel);
      if (el) { body.appendChild(field(f.label, el, 'textContent', { lint: true })); }
    });
    ATTRS.forEach(function (a) {
      if (card.hasAttribute(a.name)) {
        body.appendChild(field(a.label, card, '@' + a.name, { after: schedulePreview }));
      }
    });
    if (img) { body.appendChild(field('이미지 설명 (alt)', img, '@alt')); }
    row.appendChild(body);
    return row;
  }

  /** 첫 카드를 본보기로 글자만 비운 사본. */
  function blankCard(host) {
    var first = host.firstElementChild;
    if (!first) { toast('본보기로 쓸 카드가 없습니다.', true); return null; }
    var copy = first.cloneNode(true);
    stripIds(copy);
    FIELDS.forEach(function (f) {
      $$(f.sel, copy).forEach(function (el) { el.textContent = ''; });
    });
    if (copy.hasAttribute('href')) { copy.setAttribute('href', ''); }
    return copy;
  }

  function addCard(host) {
    var copy = blankCard(host);
    if (!copy) { return; }
    snapshot();
    insertAfter(host.lastElementChild, copy);
    afterChange();
    toast('새 카드를 목록 맨 끝에 넣었습니다. 내용을 채워 주세요.');
  }

  /** 글 주소를 붙여 넣으면 새 카드를 만들고 제목을 채워 준다. */
  function linkAdder(host) {
    var wrap = make('div', 'ad-row');
    wrap.style.flex = '1 1 320px';
    wrap.style.marginTop = '0';

    var lab = make('label', 'ad-field');
    lab.appendChild(make('span', '', '글 주소로 추가'));
    var input = document.createElement('input');
    input.type = 'url';
    input.placeholder = 'https://velog.io/@kannikii/…';
    lab.appendChild(input);

    var go = make('button', 'ad-btn', '가져오기');
    go.type = 'button';
    go.addEventListener('click', function () {
      var url = input.value.trim();
      if (!url) { return; }
      var copy = blankCard(host);
      if (!copy) { return; }

      /* 브라우저에서 남의 사이트 본문을 바로 읽을 수는 없다 (CORS).
         주소 마지막 조각이 글 제목인 velog 를 기준으로 제목만 풀어 준다.
         나머지는 손으로 고친다. */
      var slug = url.replace(/[?#].*$/, '').replace(/\/$/, '').split('/').pop();
      var title = '';
      try { title = decodeURIComponent(slug).replace(/-/g, ' ').trim(); }
      catch (e) { title = slug; }

      copy.setAttribute('href', url);
      $$('.card__title', copy).forEach(function (el) { el.textContent = title; });
      $$('.card__meta', copy).forEach(function (el) { el.textContent = today(); });

      snapshot();
      insertAfter(host.lastElementChild, copy);
      afterChange();
      input.value = '';
      toast('글 카드를 만들었습니다. 제목과 날짜를 확인해 주세요.');
    });

    wrap.appendChild(lab);
    wrap.appendChild(go);
    return wrap;
  }

  function today() {
    var d = new Date();
    function two(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '.' + two(d.getMonth() + 1) + '.' + two(d.getDate());
  }

  /* ------------------------------------------------------------- 텍스트 편집 */
  function isTextTarget(el) {
    return !el.closest(GRID_SEL) && !el.closest(SKIP_SEL) &&
           !el.querySelector(BLOCK_SEL) && el.textContent.trim() !== '';
  }

  function textTargets() {
    return $$(TEXT_SEL, state.doc.body).filter(isTextTarget);
  }

  /** 미리보기에서 바로 고칠 수 있는 요소. 본문 글자와 카드 글자. */
  function frameTargets() {
    return $$(TEXT_SEL + ', ' + FIELD_SEL, state.doc.body).filter(function (el) {
      if (el.matches(FIELD_SEL) && el.closest(GRID_SEL)) { return true; }
      return el.matches(TEXT_SEL) && isTextTarget(el);
    });
  }

  function renderText() {
    var pane = $('[data-pane="text"]');
    pane.textContent = '';
    if (!state.doc) { return; }

    pane.appendChild(make('p', 'ad-note',
      '미리보기를 열면 글자를 바로 눌러 고칠 수도 있습니다. 새 블록이 필요하면 비슷한 블록을 ' +
      '복제한 뒤 고칩니다. 삭제는 실행 취소로 되돌릴 수 있습니다.'));

    var title = state.doc.querySelector('title');
    if (title) { pane.appendChild(textBlock('페이지 제목 (title)', title, 'textContent', {})); }

    var desc = state.doc.querySelector('meta[name="description"]');
    if (desc) { pane.appendChild(textBlock('검색 설명 (meta description)', desc, '@content', {})); }

    var heading = '';
    var count = 0;
    textTargets().forEach(function (el) {
      var name = el.tagName.toLowerCase();
      if (name === 'h1' || name === 'h2') {
        heading = el.textContent.replace(/\s+/g, ' ').trim();
        if (heading.length > 40) { heading = heading.slice(0, 40) + '…'; }
      }
      var label = (heading ? heading + ' · ' : '') + name;
      pane.appendChild(textBlock(label, el, 'innerHTML', { ops: true, mono: name === 'pre' }));
      count++;
    });

    if (!count) {
      pane.appendChild(make('p', 'ad-note', '이 페이지에는 고칠 본문이 없습니다.'));
    }
  }

  function textBlock(label, el, prop, opts) {
    var wrap = make('div', 'ad-block' + (opts.mono ? ' ad-block--code' : ''));
    var head = make('div', 'ad-block__head');
    head.appendChild(make('span', 'ad-block__tag', label));

    if (opts.ops) {
      var u = unitOf(el);
      var acts = make('div', 'ad-block__acts');
      acts.appendChild(make('span', 'ad-block__unit', u.label));
      acts.appendChild(btn('↑', function () { runOp('up', el); }, josa(u.label, '을/를') + ' 위로'));
      acts.appendChild(btn('↓', function () { runOp('down', el); }, josa(u.label, '을/를') + ' 아래로'));
      acts.appendChild(btn('복제', function () { runOp('dup', el); }, josa(u.label, '을/를') + ' 복제'));
      acts.appendChild(btn('삭제', function () { runOp('del', el); }, josa(u.label, '을/를') + ' 삭제'));
      head.appendChild(acts);
    }

    var ta = document.createElement('textarea');
    ta.value = shownProp(el, prop);
    ta.rows = Math.min(14, Math.max(2, Math.ceil(ta.value.length / 90) + 1));
    ta.addEventListener('input', function () {
      touch(ta);
      setProp(el, prop, ta.value);
      refreshEl(el, ta);
    });

    wrap.appendChild(head);
    wrap.appendChild(ta);
    bind(el, ta, prop, wrap);
    return wrap;
  }

  /* ---------------------------------------------------------------- 반말 표시 */
  function banmalText(text) {
    var out = [];
    (String(text).replace(/\s+/g, ' ').trim().match(BANMAL_RE) || []).forEach(function (w) {
      if (/니다$/.test(w) || out.indexOf(w) !== -1) { return; }
      out.push(w);
    });
    return out;
  }

  /** 코드 조각은 빼고 읽는다. 명령어 예시가 반말로 잡히지 않게. */
  function banmalWords(el) {
    if (el.tagName === 'PRE') { return []; }
    var c = el.cloneNode(true);
    $$('code, pre, kbd, samp', c).forEach(function (n) { n.remove(); });
    return banmalText(c.textContent);
  }

  function lintWords(el, prop) {
    if (prop && prop.charAt(0) === '@') { return banmalText(el.getAttribute(prop.slice(1)) || ''); }
    return banmalWords(el);
  }

  function lintInto(wrap) {
    var words = lintWords(wrap._adEl, wrap._adProp);
    var hint = wrap.querySelector('.ad-warn__hint');
    wrap.classList.toggle('ad-warn', words.length > 0);
    if (!words.length) {
      if (hint) { hint.remove(); }
      return;
    }
    if (!hint) {
      hint = make('em', 'ad-warn__hint');
      wrap.appendChild(hint);
    }
    hint.textContent = '반말 어미로 보입니다: ' + words.join(', ');
  }

  function lintSummary() {
    var n = $$('.ad-warn', $('[data-step="edit"]')).length;
    $('[data-lint]').classList.toggle('ad-lint--warn', n > 0);
    $('[data-lint-text]').textContent = n
      ? '반말 어미로 보이는 곳이 ' + n + '곳 있습니다.'
      : '반말 어미로 보이는 곳이 없습니다.';
    $('[data-lint-next]').hidden = !n;
    $('[data-lint-mini]').textContent = n ? '반말 의심 ' + n + '곳' : '';
  }

  var lintSummarySoon = debounce(lintSummary, 150);

  /** 다음 반말 위치로 간다. 미리보기가 열려 있으면 그 안도 함께 옮긴다. */
  function lintNext() {
    var list = $$('.ad-warn', $('[data-step="edit"]'));
    if (!list.length) { return; }
    state.lintCursor = (state.lintCursor + 1) % list.length;
    var wrap = list[state.lintCursor];
    var pane = wrap.closest('[data-pane]');
    if (pane && pane.hidden) { selectTab(pane.dataset.pane); }
    wrap.scrollIntoView({ block: 'center', behavior: 'smooth' });
    var ctl = wrap.querySelector('textarea, input');
    if (ctl) { ctl.focus({ preventScroll: true }); }
    var i = state.frameIndex.get(wrap._adEl);
    if (i !== undefined && previewOpen()) { scrollFrameTo(frameEl(i)); }
  }

  /* -------------------------------------------------------------- 이미지 탭 */
  function renderImages() {
    var pane = $('[data-pane="images"]');
    pane.textContent = '';
    if (!state.doc) { return; }

    pane.appendChild(make('p', 'ad-note',
      '이 페이지가 쓰는 이미지입니다. 바꾸기는 다른 파일을 고르고, 파일 교체는 같은 경로의 ' +
      '파일 내용을 새 이미지로 덮어씁니다. 파일 교체는 그 파일을 쓰는 모든 페이지에 반영됩니다. ' +
      '긴 변이 ' + MAX_EDGE + 'px보다 큰 사진은 줄여서 올립니다.'));

    var count = 0;
    $$('img', state.doc.body).forEach(function (img) {
      var src = img.getAttribute('src');
      if (!src || img.closest(SKIP_SEL)) { return; }
      count++;

      var row = make('div', 'ad-item');
      var side = make('div', 'ad-item__side');
      var thumb = make('img', 'ad-item__thumb');
      thumb.alt = '';
      setThumb(thumb, src);
      side.appendChild(thumb);

      var acts = make('div', 'ad-item__acts');
      acts.appendChild(btn('바꾸기', function () { openPicker(img); }, '다른 이미지 파일 고르기'));
      if (!isExternal(src)) {
        acts.appendChild(btn('파일 교체', function () {
          replaceFile(resolveSrc(img.getAttribute('src')));
        }, '같은 경로의 파일 내용을 새 이미지로 덮어쓰기'));
      }
      side.appendChild(acts);
      row.appendChild(side);

      var body = make('div', 'ad-item__body');
      body.appendChild(field('경로', img, '@src', {
        wide: true,
        after: function (v) { setThumb(thumb, v); schedulePreview(); }
      }));
      body.appendChild(field('설명 (alt)', img, '@alt'));
      row.appendChild(body);

      pane.appendChild(row);
    });

    if (!count) {
      pane.appendChild(make('p', 'ad-note', '이 페이지에는 이미지가 없습니다.'));
    }
  }

  /* ------------------------------------------------------------ 이미지 고르기 */
  function openPicker(img) {
    state.pickTarget = { img: img };
    $('[data-picker]').hidden = false;
    $('[data-picker-filter]').focus();
    loadTree().then(drawThumbs).catch(function (err) {
      toast('이미지 목록을 불러오지 못했습니다 — ' + err.message, true);
    });
  }

  function closePicker() {
    $('[data-picker]').hidden = true;
    state.pickTarget = null;
  }

  function loadTree() {
    if (state.tree) { return Promise.resolve(state.tree); }
    return api('GET', repoPath('/git/trees/' + encodeURIComponent(state.branch) + '?recursive=1'))
      .then(function (data) {
        state.tree = (data.tree || []).filter(function (n) {
          return n.type === 'blob' && n.path.indexOf('assets/images/') === 0 && IMG_RE.test(n.path);
        });
        return state.tree;
      });
  }

  function findNode(path) {
    var list = state.tree || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].path === path) { return list[i]; }
    }
    return null;
  }

  function drawThumbs() {
    var list = $('[data-picker-list]');
    var q = $('[data-picker-filter]').value.trim().toLowerCase();
    var current = state.pickTarget ? resolveSrc(state.pickTarget.img.getAttribute('src')) : null;
    list.textContent = '';

    (state.tree || []).filter(function (n) {
      return !q || n.path.toLowerCase().indexOf(q) !== -1;
    }).forEach(function (node) {
      var cell = make('div', 'ad-thumb-cell');

      var pick = make('button', 'ad-thumb' + (node.path === current ? ' is-current' : ''));
      pick.type = 'button';
      if (node.path === current) { pick.setAttribute('aria-current', 'true'); }

      var im = document.createElement('img');
      im.loading = 'lazy';
      im.alt = '';
      showImg(im, node.path);

      pick.appendChild(im);
      pick.appendChild(make('span', 'ad-thumb__name', node.path.replace('assets/images/', '')));
      pick.addEventListener('click', function () { choose(node.path); });
      cell.appendChild(pick);

      var acts = make('div', 'ad-thumb__acts');
      acts.appendChild(btn('파일 교체', function () { replaceFile(node.path); }));
      acts.appendChild(btn('파일 삭제', function () { removeImage(node); }));
      cell.appendChild(acts);

      list.appendChild(cell);
    });

    if (!list.children.length) {
      var p = make('p', 'ad-note', '해당하는 이미지가 없습니다.');
      p.style.padding = '0 14px';
      list.appendChild(p);
    }
  }

  function setDims(img, w, h) {
    if (!w || !h) { return; }
    img.setAttribute('width', String(w));
    img.setAttribute('height', String(h));
  }

  /** 고른 파일로 대상 img 의 src 를 바꾼다. dims 를 모르면 실제 파일에서 잰다. */
  function choose(repoRelPath, dims, note) {
    var t = state.pickTarget;
    if (!t) { return; }
    snapshot();

    var rel = relFromFile(repoRelPath);
    t.img.setAttribute('src', rel);

    /* 새 이미지의 실제 크기로 width · height 를 맞춘다.
       비율이 틀어지면 카드가 로딩 중에 흔들린다. */
    if (dims && dims.width && dims.height) {
      setDims(t.img, dims.width, dims.height);
    } else {
      var probe = new Image();
      /* 크기는 파일을 받아 온 뒤에야 알 수 있다. 그 사이 미리보기는 이미 그려졌으니
         크기가 달라졌으면 한 번 더 그린다. */
      probe.onload = function () {
        var before = t.img.getAttribute('width') + 'x' + t.img.getAttribute('height');
        setDims(t.img, probe.naturalWidth, probe.naturalHeight);
        if (before !== probe.naturalWidth + 'x' + probe.naturalHeight) { schedulePreview(); }
      };
      showImg(probe, repoRelPath);
    }

    closePicker();
    afterChange();
    toast(note || '이미지를 ' + rel + ' 파일로 바꿨습니다.');
  }

  function usesInDoc(path) {
    return $$('img', state.doc).filter(function (img) {
      return resolveSrc(img.getAttribute('src')) === path;
    });
  }

  function removeImage(node) {
    var uses = state.doc ? usesInDoc(node.path).length : 0;
    var msg = node.path + ' 파일을 저장소에서 삭제합니다.\n' +
              (uses ? '지금 페이지에서 ' + uses + '곳이 이 파일을 씁니다.\n' : '') +
              '관리자 모드에서는 되돌릴 수 없습니다. 계속할까요?';
    if (!window.confirm(msg)) { return; }

    api('DELETE', contentsPath(node.path), {
      message: 'chore(images): ' + node.path + ' 삭제',
      sha: node.sha,
      branch: state.branch
    }).then(function () {
      state.tree = state.tree.filter(function (n) { return n.path !== node.path; });
      forgetLocal(node.path);
      drawThumbs();
      toast('삭제했습니다. 이 파일을 쓰던 자리는 직접 바꿔 주세요.');
    }).catch(function (err) {
      toast('삭제하지 못했습니다 — ' + err.message, true);
    });
  }

  /* ------------------------------------------------------- 이미지 준비 (축소) */
  function extOf(name) {
    var m = /\.([a-z0-9]+)$/i.exec(String(name).split(/[?#]/)[0]);
    return m ? m[1].toLowerCase() : '';
  }

  function kb(n) {
    return n < 1024 * 1024 ? Math.max(1, Math.round(n / 1024)) + 'KB' : (n / 1048576).toFixed(1) + 'MB';
  }

  function decode(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var im = new Image();
      im.onload = function () { resolve(im); window.setTimeout(function () { URL.revokeObjectURL(url); }, 0); };
      im.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('이 브라우저에서 읽을 수 없는 이미지입니다.'));
      };
      im.src = url;
    });
  }

  function svgSize(txt) {
    var svg = new DOMParser().parseFromString(txt, 'image/svg+xml').documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg') { return { w: 0, h: 0 }; }
    function len(v) {
      return /^\s*\d+(\.\d+)?\s*(px)?\s*$/.test(v || '') ? Math.round(parseFloat(v)) : 0;
    }
    var w = len(svg.getAttribute('width'));
    var h = len(svg.getAttribute('height'));
    if (!w || !h) {
      var vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
      if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) { w = Math.round(vb[2]); h = Math.round(vb[3]); }
    }
    return { w: w, h: h };
  }

  /**
   * 올릴 파일을 준비한다. 긴 변이 MAX_EDGE 보다 크면 줄이고, target 확장자가 있으면
   * 그 형식으로 맞춘다 (파일 교체는 경로가 그대로여야 한다). SVG · GIF 는 손대지 않는다.
   * 결과: { blob, ext, width, height, srcWidth, srcHeight, resized }
   */
  function prepareImage(file, target) {
    var ext = extOf(file.name);
    var isSvg = file.type === 'image/svg+xml' || ext === 'svg';
    var isGif = file.type === 'image/gif' || ext === 'gif';

    if (isSvg || target === 'svg') {
      if (!isSvg) { return Promise.reject(new Error('SVG 자리에는 SVG 파일만 넣을 수 있습니다.')); }
      if (target && target !== 'svg') {
        return Promise.reject(new Error('SVG 파일은 SVG 자리에만 넣을 수 있습니다.'));
      }
      return file.text().then(function (txt) {
        var d = svgSize(txt);
        return { blob: file, ext: 'svg', width: d.w, height: d.h,
                 srcWidth: d.w, srcHeight: d.h, resized: false };
      });
    }

    if (isGif || target === 'gif') {
      if (!isGif) { return Promise.reject(new Error('GIF 자리에는 GIF 파일만 넣을 수 있습니다.')); }
      if (target && target !== 'gif') {
        return Promise.reject(new Error('움직이는 GIF는 바꾸지 않습니다. GIF 자리에만 넣을 수 있습니다.'));
      }
      return decode(file).then(function (im) {
        var w = im.naturalWidth, h = im.naturalHeight;
        return { blob: file, ext: 'gif', width: w, height: h, srcWidth: w, srcHeight: h, resized: false };
      });
    }

    var outExt = target || (ext === 'png' || ext === 'webp' ? ext : 'jpg');
    var outType = MIME[outExt] || 'image/jpeg';

    return decode(file).then(function (im) {
      var w = im.naturalWidth, h = im.naturalHeight;
      var scale = Math.min(1, MAX_EDGE / Math.max(w, h));
      var base = { ext: outExt, srcWidth: w, srcHeight: h };

      if (scale === 1 && file.type === outType) {
        return assign(base, { blob: file, width: w, height: h, resized: false });
      }

      var cw = Math.max(1, Math.round(w * scale));
      var ch = Math.max(1, Math.round(h * scale));
      var canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      var ctx = canvas.getContext('2d');
      /* JPEG 에는 투명이 없다. 비워 두면 투명한 자리가 검게 나온다. */
      if (outType === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch); }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(im, 0, 0, cw, ch);

      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob) { reject(new Error('이미지를 변환하지 못했습니다.')); return; }
          /* 지원하지 않는 형식을 달라고 하면 브라우저는 말없이 PNG 를 준다. */
          if (blob.type !== outType) {
            reject(new Error('이 브라우저는 ' + outExt + ' 형식으로 저장하지 못합니다.'));
            return;
          }
          resolve(assign(base, { blob: blob, width: cw, height: ch, resized: scale < 1 }));
        }, outType, JPEG_QUALITY);
      });
    });
  }

  function sizeNote(file, out) {
    var s = (out.width && out.height ? out.width + '×' + out.height + ' · ' : '') + kb(out.blob.size);
    if (out.resized) {
      s += ' (원본 ' + out.srcWidth + '×' + out.srcHeight + ' · ' + kb(file.size) + '에서 줄임)';
    }
    return s;
  }

  function putFile(path, blob, sha, message) {
    return blob.arrayBuffer().then(function (buf) {
      var body = { message: message, content: bufToB64(buf), branch: state.branch };
      if (sha) { body.sha = sha; }
      return api('PUT', contentsPath(path), body);
    });
  }

  function remember(path, blob) {
    forgetLocal(path);
    state.localUrls[path] = URL.createObjectURL(blob);
  }

  function forgetLocal(path) {
    if (state.localUrls[path]) {
      URL.revokeObjectURL(state.localUrls[path]);
      delete state.localUrls[path];
    }
  }

  function stamp() {
    var d = new Date();
    function two(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + two(d.getMonth() + 1) + two(d.getDate()) + '-' +
           two(d.getHours()) + two(d.getMinutes()) + two(d.getSeconds());
  }

  function pickFile(accept, cb) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change', function () {
      if (input.files && input.files[0]) { cb(input.files[0]); }
    });
    input.click();
  }

  /** 새 이미지를 올리고, 고르기 창을 연 자리에 바로 적용한다. */
  function upload(file) {
    var dir = $('[data-upload-dir]').value.trim().replace(/^\/+|\/+$/g, '');
    /* 한글 파일 이름은 주소에서 깨지기 쉽다. 영문 · 숫자만 남기고, 남는 게 없으면 시각으로 짓는다. */
    var stem = file.name.replace(/\.[^.]*$/, '').toLowerCase()
      .replace(/[^a-z0-9\-]+/g, '-').replace(/^-+|-+$/g, '') || ('image-' + stamp());
    var out;

    toast('이미지를 준비하고 있습니다…');
    prepareImage(file, '').then(function (o) {
      out = o;
      return loadTree();
    }).then(function () {
      var prefix = dir ? dir + '/' : '';
      var path = prefix + stem + '.' + out.ext;
      var node = findNode(path);
      var sha = null;

      if (node) {
        if (window.confirm(path + ' 파일이 이미 있습니다.\n\n' +
            '확인: 덮어씁니다. 이 파일을 쓰는 모든 페이지가 바뀝니다.\n' +
            '취소: 번호를 붙여 새 파일로 올립니다.')) {
          sha = node.sha;
        } else {
          var n = 2;
          while (findNode(prefix + stem + '-' + n + '.' + out.ext)) { n++; }
          path = prefix + stem + '-' + n + '.' + out.ext;
          node = null;
        }
      }

      toast('올리고 있습니다…');
      return putFile(path, out.blob, sha, 'chore(images): ' + path + (sha ? ' 교체' : ' 추가'))
        .then(function (res) {
          if (node) { node.sha = res.content.sha; }
          else { state.tree.unshift({ path: path, sha: res.content.sha, type: 'blob' }); }
          remember(path, out.blob);

          var note = path + ' 파일을 올리고 적용했습니다 · ' + sizeNote(file, out);
          if (state.pickTarget) { choose(path, out, note); }
          else { drawThumbs(); toast(note); }
        });
    }).catch(function (err) {
      toast('올리지 못했습니다 — ' + err.message, true);
    });
  }

  /** 같은 경로의 파일 내용을 새 이미지로 바꾼다. 이 파일을 쓰는 모든 페이지에 반영된다. */
  function replaceFile(path) {
    if (!path) { return; }
    var ext = extOf(path);
    var accept = ext === 'svg' ? '.svg,image/svg+xml' : ext === 'gif' ? 'image/gif' : 'image/*';

    pickFile(accept, function (file) {
      var node, out;
      loadTree().then(function () {
        node = findNode(path);
        if (!node) { throw new Error('저장소의 assets/images 안에 있는 파일만 교체할 수 있습니다.'); }
        return prepareImage(file, ext);
      }).then(function (o) {
        out = o;
        var uses = state.doc ? usesInDoc(path).length : 0;
        var msg = path + ' 파일의 내용을 새 이미지로 바꿉니다.\n' +
                  '이 파일을 쓰는 모든 페이지에 반영됩니다' +
                  (uses ? ' (지금 페이지에서 ' + uses + '곳).' : '.') + '\n' +
                  '새 이미지: ' + sizeNote(file, out) + '\n\n계속할까요?';
        if (!window.confirm(msg)) { return null; }
        toast('올리고 있습니다…');
        return putFile(path, out.blob, node.sha, 'chore(images): ' + path + ' 교체');
      }).then(function (res) {
        if (!res) { return; }
        node.sha = res.content.sha;
        remember(path, out.blob);

        /* 크기가 달라졌으면 이 페이지의 width · height 도 맞춘다. 이건 페이지 저장이 필요하다. */
        var fix = state.doc ? usesInDoc(path).filter(function (img) {
          return out.width && out.height &&
            (img.getAttribute('width') !== String(out.width) ||
             img.getAttribute('height') !== String(out.height));
        }) : [];
        if (fix.length) {
          snapshot();
          fix.forEach(function (img) { setDims(img, out.width, out.height); });
        }

        if (state.doc) { afterChange(); }
        if (!$('[data-picker]').hidden) { drawThumbs(); }
        toast(path + ' 파일을 교체했습니다.' + (fix.length
          ? ' 크기가 달라진 ' + fix.length + '곳의 width · height를 맞췄으니 페이지도 저장해 주세요.'
          : ''));
      }).catch(function (err) {
        toast('교체하지 못했습니다 — ' + err.message, true);
      });
    });
  }

  /* ------------------------------------------------------------------ 직렬화 */
  function serialize() {
    /* 끝에 줄바꿈을 덧붙이면 안 된다. 그 한 글자가 다음 파싱 때 body 안의
       텍스트 노드로 들어가 저장할 때마다 파일이 한 줄씩 길어진다. */
    return '<!doctype html>\n' + state.doc.documentElement.outerHTML;
  }

  /* ------------------------------------------------------------------ 저장 */
  function save() {
    if (!state.doc) { return; }

    var warn = $$('.ad-warn', $('[data-step="edit"]')).length;
    if (warn && !window.confirm('반말 어미로 보이는 곳이 ' + warn + '곳 남아 있습니다. 그래도 저장할까요?')) {
      return;
    }

    /* 미리보기용 표식이 새어 들어가지 않았는지 한 번 더 걷어 낸다. */
    $$('[data-ad-i], [data-ad-warn], [data-ad-src], [contenteditable]', state.doc).forEach(function (n) {
      ['data-ad-i', 'data-ad-warn', 'data-ad-src', 'contenteditable'].forEach(function (a) {
        n.removeAttribute(a);
      });
    });

    var btnEl = $('[data-save]');
    btnEl.disabled = true;

    api('PUT', contentsPath(state.path), {
      message: $('[data-message]').value.trim() || 'chore(content): 내용 수정',
      content: toB64(serialize()),
      sha: state.sha,
      branch: state.branch
    }).then(function (res) {
      state.sha = res.content.sha;
      state.dirty = false;
      toast('저장했습니다. 1 ~ 2분 뒤 사이트에 반영됩니다.');
    }).catch(function (err) {
      var m = err.message;
      if (/does not match|409/.test(m)) {
        m = '그사이 깃허브의 파일이 바뀌었습니다. 지금 수정을 따로 적어 두고 다시 불러온 뒤 고쳐 주세요.';
      }
      toast('저장하지 못했습니다 — ' + m, true);
    }).then(function () {
      btnEl.disabled = false;
    });
  }

  /* --------------------------------------------------------------- 미리보기 */
  function previewOpen() {
    return !$('[data-preview-box]').hidden;
  }

  function frameDoc() {
    var f = $('[data-preview-frame]');
    try { return f.contentDocument; } catch (e) { return null; }
  }

  function frameEl(i) {
    var d = frameDoc();
    return d ? d.querySelector('[data-ad-i="' + i + '"]') : null;
  }

  /**
   * 문서를 복제해 iframe 에 띄운다. 고칠 수 있는 요소에 번호 (data-ad-i) 를 잠깐 붙여
   * 복제하고 원본에서는 바로 뗀다. 그 번호로 미리보기와 원본을 잇는다.
   */
  function preview(keep, focusEl) {
    if (!state.doc) { return; }
    var frame = $('[data-preview-frame]');
    var box = $('[data-preview-box]');
    var wasOpen = previewOpen();
    var y = 0;
    if (keep) {
      try { y = frame.contentWindow.scrollY || 0; } catch (e) { y = 0; }
    }

    var list = frameTargets();
    state.frameList = list;
    state.frameIndex = new Map();
    list.forEach(function (el, i) {
      el.setAttribute('data-ad-i', String(i));
      state.frameIndex.set(el, i);
    });
    var copy = state.doc.cloneNode(true);
    list.forEach(function (el) { el.removeAttribute('data-ad-i'); });

    /* 상대 경로가 admin.html 기준으로 풀리도록 base 를 끼워 넣는다. */
    var base = copy.createElement('base');
    base.setAttribute('href', state.path.indexOf('/') === -1 ? './' :
      state.path.split('/').slice(0, -1).join('/') + '/');
    copy.head.insertBefore(base, copy.head.firstChild);

    var style = copy.createElement('style');
    style.textContent = FRAME_CSS;
    copy.head.appendChild(style);

    state.barTarget = null;
    frame.onload = function () { setupFrame(y, focusEl); };
    frame.srcdoc = '<!doctype html>\n' + copy.documentElement.outerHTML;
    box.hidden = false;
    if (!wasOpen) { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  var schedulePreview = debounce(function () {
    if (previewOpen()) { preview(true); }
  }, 700);

  function setupFrame(y, focusEl) {
    var doc = frameDoc();
    if (!doc || !doc.body) { return; }
    var win = doc.defaultView;

    if (y) { win.scrollTo(0, y); }

    var bar = doc.createElement('div');
    bar.id = 'ad-bar';
    doc.body.appendChild(bar);

    overrideImgs(doc);
    $$('[data-ad-i]', doc).forEach(function (fe) {
      var el = state.frameList[+fe.getAttribute('data-ad-i')];
      if (el) { lintFrame(fe, el); }
    });
    highlightSoon();
    applyEditMode();

    /* window 의 캡처 단계에서 받아야 페이지 스크립트 (main.js) 보다 먼저 막을 수 있다. */
    win.addEventListener('click', onFrameClick, true);
    doc.addEventListener('keydown', onFrameKey, true);
    doc.addEventListener('paste', onFramePaste, true);
    doc.addEventListener('drop', function (e) {
      if (e.target.closest && e.target.closest('[data-ad-i]')) { e.preventDefault(); }
    }, true);
    doc.addEventListener('input', onFrameInput, true);
    doc.addEventListener('focusin', onFrameFocus, true);
    doc.addEventListener('focusout', onFrameBlur, true);
    win.addEventListener('scroll', placeBar, { passive: true });
    win.addEventListener('resize', placeBar);

    if (focusEl) { focusInFrame(focusEl); }
  }

  function applyEditMode() {
    var doc = frameDoc();
    if (!doc || !doc.documentElement) { return; }
    doc.documentElement.classList.toggle('ad-edit', state.editMode);
    $$('[data-ad-i]', doc).forEach(function (fe) {
      if (state.editMode) {
        fe.setAttribute('contenteditable', 'true');
        fe.spellcheck = false;
      } else {
        fe.removeAttribute('contenteditable');
      }
    });
    if (!state.editMode) { hideBar(); }
  }

  /* 방금 올리거나 바꾼 파일은 아직 사이트에 없다. 미리보기 안에서만 사본으로 보여 준다.
     원래 src 는 data-ad-src 에 두었다가 원본에 옮길 때 되돌린다. */
  function overrideImgs(root) {
    $$('img[src]', root).forEach(function (img) {
      if (img.hasAttribute('data-ad-src')) { return; }
      var src = img.getAttribute('src');
      var p = resolveSrc(src);
      if (p && state.localUrls[p]) {
        img.setAttribute('data-ad-src', src);
        img.setAttribute('src', state.localUrls[p]);
      }
    });
  }

  function unwrap(n) {
    var p = n.parentNode;
    while (n.firstChild) { p.insertBefore(n.firstChild, n); }
    p.removeChild(n);
  }

  /**
   * 미리보기에서 고친 요소의 HTML 을 원본에 옮길 모양으로 다듬는다.
   * 브라우저 편집기가 끼워 넣는 span[style] · font · &nbsp; · 끝의 <br> 을 걷어 낸다.
   */
  function cleanHTML(fe, el) {
    var c = fe.cloneNode(true);
    $$('font, span[style]', c).forEach(unwrap);
    $$('[data-ad-i], [data-ad-warn], [contenteditable]', c).forEach(function (n) {
      n.removeAttribute('data-ad-i');
      n.removeAttribute('data-ad-warn');
      n.removeAttribute('contenteditable');
    });
    $$('img[data-ad-src]', c).forEach(function (img) {
      img.setAttribute('src', img.getAttribute('data-ad-src'));
      img.removeAttribute('data-ad-src');
    });

    var isPre = fe.tagName === 'PRE';
    if (isPre) {
      $$('br', c).forEach(function (br) { br.replaceWith('\n'); });
    }
    var html = c.innerHTML;
    if (!isPre && el.innerHTML.indexOf('&nbsp;') === -1) { html = html.replace(/&nbsp;/g, ' '); }
    return html.replace(/(?:<br\s*\/?>\s*)+$/i, '');
  }

  function onFrameInput(e) {
    var fe = e.target.closest && e.target.closest('[data-ad-i]');
    if (!fe) { return; }
    var el = state.frameList[+fe.getAttribute('data-ad-i')];
    if (!el) { return; }
    touch(fe);
    el.innerHTML = cleanHTML(fe, el);
    refreshEl(el, fe);
    lintFrame(fe, el);
    highlightSoon();
    placeBar();
  }

  function onFrameClick(e) {
    var t = e.target;
    if (!t || !t.closest || t.closest('#ad-bar')) { return; }

    if (state.editMode) {
      /* 편집 중에는 링크 이동 · 메뉴 · 라이트박스가 열리지 않게 한다. */
      if (t.closest('a, button, [data-lightbox], label, summary')) {
        e.preventDefault();
        e.stopPropagation();
      }
      return;
    }

    var a = t.closest('a[href]');
    if (!a || a.hasAttribute('data-lightbox')) { return; }
    var href = a.getAttribute('href') || '';
    e.preventDefault();
    if (href.charAt(0) === '#') {
      /* base 가 있어 그냥 두면 다른 문서로 이동한다. 같은 문서 안에서 스크롤만 한다. */
      var target = href.length > 1 ? t.ownerDocument.getElementById(href.slice(1)) : null;
      if (target) { scrollFrameTo(target, 0); }
    } else {
      hintOnce('nav', '미리보기에서는 다른 페이지로 이동하지 않습니다.');
    }
  }

  function onFrameKey(e) {
    var fe = e.target.closest && e.target.closest('[data-ad-i]');
    var editing = fe && fe.isContentEditable;
    var mod = e.metaKey || e.ctrlKey;

    if (mod && !e.shiftKey && !e.altKey && (e.key === 'z' || e.key === 'Z') && !editing) {
      e.preventDefault();
      undo();
      return;
    }
    if (!editing) { return; }
    /* 한글 조합 중의 Enter 는 글자를 확정하는 키다. 건드리지 않는다. */
    if (e.isComposing || e.keyCode === 229) { return; }

    if (e.key === 'Enter') {
      e.preventDefault();
      var doc = fe.ownerDocument;
      if (fe.tagName === 'PRE') {
        doc.execCommand('insertText', false, '\n');
      } else if (e.shiftKey) {
        doc.execCommand('insertLineBreak');
      } else {
        hintOnce('enter', '새 블록은 위에 뜨는 막대의 복제로 만듭니다. 줄바꿈은 Shift + Enter 입니다.');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      fe.blur();
    }
  }

  /* 다른 곳의 서식이 딸려 오지 않게 글자만 붙여 넣는다. */
  function onFramePaste(e) {
    var fe = e.target.closest && e.target.closest('[data-ad-i]');
    if (!fe || !fe.isContentEditable) { return; }
    e.preventDefault();
    var text = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
    if (fe.tagName !== 'PRE') { text = text.replace(/\s*\n\s*/g, ' '); }
    fe.ownerDocument.execCommand('insertText', false, text);
  }

  function onFrameFocus(e) {
    var fe = e.target.closest && e.target.closest('[data-ad-i]');
    if (!fe || !state.editMode) { return; }
    state.barTarget = fe;
    drawBar(fe);
  }

  function onFrameBlur() {
    window.setTimeout(function () {
      var doc = frameDoc();
      var a = doc && doc.activeElement;
      if (!a || !a.closest || !a.closest('[data-ad-i]')) { hideBar(); }
    }, 0);
  }

  /** 고치는 글자 위에 뜨는 막대. 그 글자가 속한 덩어리를 옮기고 복제 · 삭제한다. */
  function drawBar(fe) {
    var doc = fe.ownerDocument;
    var bar = doc.getElementById('ad-bar');
    var el = state.frameList[+fe.getAttribute('data-ad-i')];
    if (!bar || !el) { return; }
    var u = unitOf(el);

    bar.textContent = '';
    var name = doc.createElement('span');
    name.textContent = u.label;
    bar.appendChild(name);

    function add(label, title, fn) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.title = title;
      /* 누르는 순간 글자에서 포커스가 빠지면 막대가 사라진다. 막는다. */
      b.addEventListener('mousedown', function (ev) { ev.preventDefault(); });
      b.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        fn();
      });
      bar.appendChild(b);
    }

    add('↑', josa(u.label, '을/를') + ' 위로', function () { runOp('up', el, true); });
    add('↓', josa(u.label, '을/를') + ' 아래로', function () { runOp('down', el, true); });
    add('복제', josa(u.label, '을/를') + ' 복제', function () { runOp('dup', el, true); });
    add('삭제', josa(u.label, '을/를') + ' 삭제', function () { runOp('del', el, true); });

    var img = u.node.querySelector ? u.node.querySelector('img') : null;
    if (img) { add('이미지', '이미지 바꾸기', function () { openPicker(img); }); }

    bar.setAttribute('data-on', '');
    placeBar();
  }

  function placeBar() {
    var doc = frameDoc();
    var bar = doc && doc.getElementById('ad-bar');
    var fe = state.barTarget;
    if (!bar || !bar.hasAttribute('data-on') || !fe || !fe.isConnected) { return; }
    var r = fe.getBoundingClientRect();
    var h = bar.offsetHeight || 30;
    var top = r.top - h - 8;
    if (top < 4) { top = r.bottom + 8; }
    var vw = doc.documentElement.clientWidth;
    var left = Math.max(4, Math.min(r.left, vw - bar.offsetWidth - 4));
    bar.style.top = top + 'px';
    bar.style.left = left + 'px';
  }

  function hideBar() {
    var doc = frameDoc();
    var bar = doc && doc.getElementById('ad-bar');
    if (bar) { bar.removeAttribute('data-on'); }
    state.barTarget = null;
  }

  /** iframe 안에서만 스크롤한다. scrollIntoView 는 바깥 페이지까지 움직인다. */
  function scrollFrameTo(fe, ratio) {
    if (!fe) { return; }
    var win = fe.ownerDocument.defaultView;
    var r = fe.getBoundingClientRect();
    win.scrollTo(0, win.scrollY + r.top - win.innerHeight * (ratio == null ? 1 / 3 : ratio));
  }

  function focusInFrame(el) {
    var i = state.frameIndex.get(el);
    var fe = i === undefined ? null : frameEl(i);
    if (!fe || !fe.isContentEditable) { return; }
    var doc = fe.ownerDocument;
    var win = doc.defaultView;
    var r = fe.getBoundingClientRect();
    if (r.top < 60 || r.bottom > win.innerHeight - 20) { scrollFrameTo(fe); }
    fe.focus({ preventScroll: true });
    var range = doc.createRange();
    range.selectNodeContents(fe);
    range.collapse(false);
    var sel = win.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /** 원본 요소에서 원본 칸으로 옮겨 온 미리보기 요소를 다시 맞춘다. */
  function syncFrame(el) {
    if (!previewOpen()) { return; }
    var i = state.frameIndex.get(el);
    if (i === undefined) { return; }
    var fe = frameEl(i);
    if (!fe) { return; }
    fe.innerHTML = el.innerHTML;
    overrideImgs(fe);
    lintFrame(fe, el);
    highlightSoon();
  }

  function lintFrame(fe, el) {
    var words = banmalWords(el);
    if (words.length) { fe.setAttribute('data-ad-warn', words.join(' ')); }
    else { fe.removeAttribute('data-ad-warn'); }
  }

  /* 반말로 잡힌 낱말만 형광펜처럼 칠한다 (CSS Custom Highlight API).
     지원하지 않는 브라우저에서는 요소 끝의 '반말?' 표시만 남는다. */
  function highlightFrame() {
    var doc = frameDoc();
    var win = doc && doc.defaultView;
    if (!win || !win.CSS || !win.CSS.highlights || typeof win.Highlight !== 'function') { return; }

    var hl = new win.Highlight();
    $$('[data-ad-warn]', doc).forEach(function (fe) {
      var words = fe.getAttribute('data-ad-warn').split(' ');
      var walker = doc.createTreeWalker(fe, 4 /* NodeFilter.SHOW_TEXT */);
      var n;
      while ((n = walker.nextNode())) {
        if (n.parentElement.closest('code, pre, kbd, samp')) { continue; }
        words.forEach(function (w) {
          var from = 0;
          var at;
          while ((at = n.nodeValue.indexOf(w, from)) !== -1) {
            var r = doc.createRange();
            r.setStart(n, at);
            r.setEnd(n, at + w.length);
            hl.add(r);
            from = at + w.length;
          }
        });
      }
    });
    win.CSS.highlights.set('ad-banmal', hl);
  }

  var highlightSoon = debounce(highlightFrame, 120);

  /* ------------------------------------------------------------------- 탭 */
  function selectTab(name) {
    $$('[data-tab]').forEach(function (t) {
      t.setAttribute('aria-selected', String(t.dataset.tab === name));
    });
    $$('[data-pane]').forEach(function (p) {
      p.hidden = p.dataset.pane !== name;
    });
  }

  function isTyping(t) {
    if (!t) { return false; }
    if (t.isContentEditable || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') { return true; }
    return t.tagName === 'INPUT' && !/^(checkbox|radio|button|submit|file)$/i.test(t.type);
  }

  /* ------------------------------------------------------------- 부트스트랩 */
  function init() {
    var saved = readStore();
    ['owner', 'repo', 'branch', 'token'].forEach(function (k) {
      if (saved[k]) { $('[data-f="' + k + '"]').value = saved[k]; }
    });
    if (saved.token) { $('[data-forget]').hidden = false; }

    $('[data-connect]').addEventListener('click', connect);
    $('[data-forget]').addEventListener('click', forget);
    $('[data-open]').addEventListener('click', function () { openFile(); });
    $('[data-save]').addEventListener('click', save);
    $('[data-preview]').addEventListener('click', function () { preview(previewOpen()); });
    $('[data-reload]').addEventListener('click', function () {
      if (window.confirm('저장하지 않은 수정은 모두 사라집니다. 깃허브에서 다시 불러올까요?')) {
        openFile(true);
      }
    });
    $$('[data-undo]').forEach(function (b) { b.addEventListener('click', undo); });
    $('[data-lint-next]').addEventListener('click', lintNext);

    $('[data-preview-close]').addEventListener('click', function () {
      hideBar();
      $('[data-preview-box]').hidden = true;
    });
    $('[data-preview-refresh]').addEventListener('click', function () { preview(true); });
    $('[data-edit-mode]').addEventListener('change', function (e) {
      state.editMode = e.target.checked;
      applyEditMode();
    });

    $$('[data-tab]').forEach(function (t) {
      t.addEventListener('click', function () { selectTab(t.dataset.tab); });
    });

    $('[data-picker-close]').addEventListener('click', closePicker);
    $('[data-picker]').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) { closePicker(); }
    });
    $('[data-picker-filter]').addEventListener('input', drawThumbs);
    $('[data-upload]').addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) { upload(e.target.files[0]); }
      e.target.value = '';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('[data-picker]').hidden) { closePicker(); return; }
      var mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && !e.altKey && (e.key === 'z' || e.key === 'Z') &&
          state.doc && !isTyping(e.target)) {
        e.preventDefault();
        undo();
      }
    });

    /* 저장하지 않고 창을 닫는 실수를 막는다. */
    window.addEventListener('beforeunload', function (e) {
      if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
    });

    updateUndo();
    selectTab('cards');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
