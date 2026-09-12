/* ==========================================================================
   admin.js — 정적 사이트를 브라우저에서 고치고 깃허브에 바로 커밋한다.

   중간 데이터 파일을 두지 않는다. 깃허브에서 HTML 을 그대로 받아
   DOMParser 로 읽고, 고친 DOM 을 다시 HTML 로 직렬화해 커밋한다.
   그래서 공개 페이지는 지금처럼 자바스크립트 없이도, file:// 로 열어도
   그대로 동작한다. 관리자 모드는 이 페이지 안에서만 산다.

   토큰은 localStorage 에만 둔다. 깃허브 API 말고는 아무 데도 보내지 않는다.
   ========================================================================== */

(function () {
  'use strict';

  var API = 'https://api.github.com';
  var STORE = 'khl-admin';
  var IMG_RE = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

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

  /* 텍스트 탭에 올릴 요소. 블록 자식이 없는 것만 고른다. */
  var TEXT_SEL = 'h1, h2, h3, h4, p, li, dd, dt, blockquote, figcaption, pre';
  var BLOCK_SEL = 'div, section, article, ul, ol, dl, figure, table, p, h1, h2, h3, h4';

  var state = {
    owner: '', repo: '', branch: 'main', token: '',
    path: '', sha: '', doc: null, tree: null, pickTarget: null
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ------------------------------------------------------------------ 알림 */
  var toastTimer = 0;

  function toast(msg, bad) {
    var el = $('[data-toast]');
    el.textContent = msg;
    el.classList.toggle('ad-toast--bad', !!bad);
    el.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.hidden = true; }, bad ? 8000 : 3500);
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

  function rawUrl(path) {
    return 'https://raw.githubusercontent.com/' + state.owner + '/' + state.repo +
           '/' + state.branch + '/' + path;
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
    toast('토큰을 지웠다.');
  }

  /* ------------------------------------------------------------------ 연결 */
  function connect() {
    ['owner', 'repo', 'branch', 'token'].forEach(function (k) {
      state[k] = $('[data-f="' + k + '"]').value.trim();
    });

    if (!state.owner || !state.repo || !state.token) {
      toast('소유자 · 저장소 · 토큰을 모두 채운다.', true);
      return;
    }

    api('GET', repoPath('')).then(function (repo) {
      if (!repo.permissions || !repo.permissions.push) {
        throw new Error('이 토큰에는 쓰기 권한이 없다. Contents: Read and write 를 준다.');
      }
      if ($('[data-remember]').checked) {
        writeStore({ owner: state.owner, repo: state.repo, branch: state.branch, token: state.token });
      }
      $('[data-forget]').hidden = false;
      $('[data-step="file"]').hidden = false;
      $('[data-where]').textContent = state.owner + '/' + state.repo + ' · ' + state.branch;
      state.tree = null;
      toast('연결했다.');
    }).catch(function (err) {
      toast('연결 실패 — ' + err.message, true);
    });
  }

  /* ------------------------------------------------------------- 파일 열기 */
  function openFile() {
    var path = $('[data-file]').value;

    api('GET', repoPath('/contents/' + path + '?ref=' + encodeURIComponent(state.branch)))
      .then(function (file) {
        state.path = path;
        state.sha = file.sha;
        state.doc = new DOMParser().parseFromString(fromB64(file.content), 'text/html');

        renderCards();
        renderText();
        renderImages();

        $('[data-step="edit"]').hidden = false;
        $('[data-step="save"]').hidden = false;
        $('[data-where]').textContent =
          state.owner + '/' + state.repo + ' · ' + state.branch + ' · ' + path;
        selectTab($('[data-pane="cards"]').children.length ? 'cards' : 'text');
        toast(path + ' 을 불러왔다.');
      }).catch(function (err) {
        toast('불러오기 실패 — ' + err.message, true);
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

  /* ------------------------------------------------------------- 카드 편집 */
  function renderCards() {
    var pane = $('[data-pane="cards"]');
    pane.textContent = '';
    if (!state.doc) { return; }

    GRIDS.forEach(function (grid) {
      var host = state.doc.querySelector(grid.sel);
      if (!host) { return; }

      var h = document.createElement('h3');
      h.className = 'ad-h3';
      h.textContent = grid.name;
      pane.appendChild(h);

      var list = document.createElement('div');
      pane.appendChild(list);

      var acts = document.createElement('div');
      acts.className = 'ad-row';
      pane.appendChild(acts);

      var add = document.createElement('button');
      add.type = 'button';
      add.className = 'ad-btn';
      add.textContent = '＋ 새 항목';
      add.addEventListener('click', function () {
        var first = host.firstElementChild;
        if (!first) { toast('본보기로 쓸 카드가 없다.', true); return; }
        var copy = first.cloneNode(true);
        FIELDS.forEach(function (f) {
          $$(f.sel, copy).forEach(function (el) { el.textContent = ''; });
        });
        if (copy.hasAttribute('href')) { copy.setAttribute('href', ''); }
        host.appendChild(copy);
        drawList(host, list, grid);
      });
      acts.appendChild(add);

      if (grid.link) { acts.appendChild(linkAdder(host, list, grid)); }

      drawList(host, list, grid);
    });
  }

  /** 글 주소를 붙여 넣으면 새 카드를 만들고 제목을 채워 준다. */
  function linkAdder(host, list, grid) {
    var wrap = document.createElement('div');
    wrap.className = 'ad-row';
    wrap.style.flex = '1 1 320px';

    var field = document.createElement('label');
    field.className = 'ad-field';
    field.innerHTML = '<span>글 주소로 추가</span>';
    var input = document.createElement('input');
    input.type = 'url';
    input.placeholder = 'https://velog.io/@kannikii/…';
    field.appendChild(input);

    var go = document.createElement('button');
    go.type = 'button';
    go.className = 'ad-btn';
    go.textContent = '가져오기';
    go.addEventListener('click', function () {
      var url = input.value.trim();
      if (!url) { return; }

      var first = host.firstElementChild;
      if (!first) { toast('본보기로 쓸 카드가 없다.', true); return; }
      var copy = first.cloneNode(true);

      /* 브라우저에서 남의 사이트 본문을 바로 읽을 수는 없다 (CORS).
         주소 마지막 조각이 글 제목인 velog 를 기준으로 제목만 풀어 준다.
         나머지는 손으로 고친다. */
      var slug = url.replace(/[?#].*$/, '').replace(/\/$/, '').split('/').pop();
      var title = '';
      try { title = decodeURIComponent(slug).replace(/-/g, ' ').trim(); }
      catch (e) { title = slug; }

      copy.setAttribute('href', url);
      $$('.card__title', copy).forEach(function (el) { el.textContent = title; });
      $$('.card__tag', copy).forEach(function (el) { el.textContent = ''; });
      $$('.card__meta', copy).forEach(function (el) { el.textContent = today(); });

      host.appendChild(copy);
      drawList(host, list, grid);
      input.value = '';
      toast('제목과 날짜는 확인하고 고친다.');
    });

    wrap.appendChild(field);
    wrap.appendChild(go);
    return wrap;
  }

  function today() {
    var d = new Date();
    function two(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '.' + two(d.getMonth() + 1) + '.' + two(d.getDate());
  }

  function drawList(host, list, grid) {
    list.textContent = '';

    Array.prototype.forEach.call(host.children, function (card, i) {
      var row = document.createElement('div');
      row.className = 'ad-item';

      /* 왼쪽 — 썸네일과 순서 · 삭제 */
      var side = document.createElement('div');
      side.className = 'ad-item__side';

      var img = card.querySelector('img');
      var thumb = document.createElement('img');
      thumb.className = 'ad-item__thumb';
      thumb.alt = '';
      thumb.src = img ? rawUrl(repoFromRel(img.getAttribute('src'))) : '';
      side.appendChild(thumb);

      var no = document.createElement('p');
      no.className = 'ad-item__no';
      no.textContent = (i + 1) + ' / ' + host.children.length;
      side.appendChild(no);

      var acts = document.createElement('div');
      acts.className = 'ad-item__acts';
      acts.appendChild(btn('↑', function () { move(host, card, -1); drawList(host, list, grid); }));
      acts.appendChild(btn('↓', function () { move(host, card, 1); drawList(host, list, grid); }));
      if (img) {
        acts.appendChild(btn('이미지', function () { openPicker(img, thumb); }));
      }
      acts.appendChild(btn('삭제', function () {
        if (!window.confirm('이 항목을 지운다. 계속할까?')) { return; }
        card.remove();
        drawList(host, list, grid);
      }));
      side.appendChild(acts);
      row.appendChild(side);

      /* 오른쪽 — 글자와 속성 */
      var body = document.createElement('div');
      body.className = 'ad-item__body';

      FIELDS.forEach(function (f) {
        var el = card.querySelector(f.sel);
        if (!el) { return; }
        body.appendChild(textField(f.label, el.textContent, function (v) {
          el.textContent = v;
        }));
      });

      ATTRS.forEach(function (a) {
        if (!card.hasAttribute(a.name)) { return; }
        body.appendChild(textField(a.label, card.getAttribute(a.name), function (v) {
          card.setAttribute(a.name, v);
        }));
      });

      if (img) {
        body.appendChild(textField('이미지 설명 (alt)', img.getAttribute('alt') || '', function (v) {
          img.setAttribute('alt', v);
        }));
      }

      row.appendChild(body);
      list.appendChild(row);
    });
  }

  function move(host, card, dir) {
    if (dir < 0 && card.previousElementSibling) {
      host.insertBefore(card, card.previousElementSibling);
    } else if (dir > 0 && card.nextElementSibling) {
      host.insertBefore(card.nextElementSibling, card);
    }
  }

  function btn(label, fn) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ad-btn ad-btn--tiny';
    b.textContent = label;
    b.addEventListener('click', fn);
    return b;
  }

  function textField(label, value, onChange) {
    var wrap = document.createElement('label');
    wrap.className = 'ad-field';
    var span = document.createElement('span');
    span.textContent = label;
    var input = document.createElement('input');
    input.type = 'text';
    input.value = value || '';
    input.addEventListener('input', function () { onChange(input.value); });
    wrap.appendChild(span);
    wrap.appendChild(input);
    return wrap;
  }

  /* ------------------------------------------------------------- 텍스트 편집 */
  function renderText() {
    var pane = $('[data-pane="text"]');
    pane.textContent = '';
    if (!state.doc) { return; }

    var title = state.doc.querySelector('title');
    if (title) { pane.appendChild(block('페이지 제목 (title)', title, 'textContent')); }

    var desc = state.doc.querySelector('meta[name="description"]');
    if (desc) {
      var wrap = document.createElement('div');
      wrap.className = 'ad-block';
      var tag = document.createElement('span');
      tag.className = 'ad-block__tag';
      tag.textContent = '검색 설명 (meta description)';
      var ta = document.createElement('textarea');
      ta.value = desc.getAttribute('content') || '';
      ta.addEventListener('input', function () { desc.setAttribute('content', ta.value); });
      wrap.appendChild(tag);
      wrap.appendChild(ta);
      pane.appendChild(wrap);
    }

    var root = state.doc.querySelector('main') || state.doc.body;
    var heading = '';

    $$(TEXT_SEL, root).forEach(function (el) {
      if (el.closest(GRID_SEL)) { return; }          /* 카드 탭에서 다룬다 */
      if (el.closest('.site-header, .gnb, .site-footer')) { return; }
      if (el.querySelector(BLOCK_SEL)) { return; }   /* 껍데기는 건너뛴다 */
      if (!el.innerHTML.trim()) { return; }

      var name = el.tagName.toLowerCase();
      if (name === 'h1' || name === 'h2') { heading = el.textContent.trim(); }

      var label = (heading ? heading + ' · ' : '') + name;
      pane.appendChild(block(label, el, 'innerHTML', name === 'pre'));
    });

    if (!pane.children.length) {
      var empty = document.createElement('p');
      empty.className = 'ad-note';
      empty.textContent = '이 페이지에는 고칠 본문이 없다.';
      pane.appendChild(empty);
    }
  }

  function block(label, el, prop, mono) {
    var wrap = document.createElement('div');
    wrap.className = 'ad-block' + (mono ? ' ad-block--code' : '');

    var tag = document.createElement('span');
    tag.className = 'ad-block__tag';
    tag.textContent = label;

    var ta = document.createElement('textarea');
    ta.value = el[prop];
    ta.rows = Math.min(14, Math.max(2, Math.ceil(ta.value.length / 90) + 1));
    ta.addEventListener('input', function () { el[prop] = ta.value; });

    wrap.appendChild(tag);
    wrap.appendChild(ta);
    return wrap;
  }

  /* -------------------------------------------------------------- 이미지 탭 */
  function renderImages() {
    var pane = $('[data-pane="images"]');
    pane.textContent = '';
    if (!state.doc) { return; }

    var note = document.createElement('p');
    note.className = 'ad-note';
    note.textContent = '이 페이지가 쓰는 모든 이미지다. 카드 썸네일도 여기서 바꿀 수 있다.';
    pane.appendChild(note);

    $$('img', state.doc).forEach(function (img) {
      var row = document.createElement('div');
      row.className = 'ad-item';

      var side = document.createElement('div');
      side.className = 'ad-item__side';

      var thumb = document.createElement('img');
      thumb.className = 'ad-item__thumb';
      thumb.alt = '';
      thumb.src = rawUrl(repoFromRel(img.getAttribute('src')));
      side.appendChild(thumb);

      var acts = document.createElement('div');
      acts.className = 'ad-item__acts';
      acts.appendChild(btn('바꾸기', function () { openPicker(img, thumb); }));
      side.appendChild(acts);
      row.appendChild(side);

      var body = document.createElement('div');
      body.className = 'ad-item__body';
      var srcField = textField('경로', img.getAttribute('src'), function (v) {
        img.setAttribute('src', v);
        thumb.src = rawUrl(repoFromRel(v));
      });
      srcField.classList.add('ad-field--wide');
      body.appendChild(srcField);
      body.appendChild(textField('설명 (alt)', img.getAttribute('alt') || '', function (v) {
        img.setAttribute('alt', v);
      }));
      row.appendChild(body);

      pane.appendChild(row);
    });
  }

  /* ------------------------------------------------------------ 이미지 고르기 */
  function openPicker(img, thumb) {
    state.pickTarget = { img: img, thumb: thumb };
    $('[data-picker]').hidden = false;
    loadTree().then(drawThumbs).catch(function (err) {
      toast('이미지 목록 실패 — ' + err.message, true);
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

  function drawThumbs() {
    var list = $('[data-picker-list]');
    var q = $('[data-picker-filter]').value.trim().toLowerCase();
    list.textContent = '';

    (state.tree || []).filter(function (n) {
      return !q || n.path.toLowerCase().indexOf(q) !== -1;
    }).forEach(function (node) {
      var cell = document.createElement('div');

      var pick = document.createElement('button');
      pick.type = 'button';
      pick.className = 'ad-thumb';

      var im = document.createElement('img');
      im.loading = 'lazy';
      im.alt = '';
      im.src = rawUrl(node.path);

      var name = document.createElement('span');
      name.className = 'ad-thumb__name';
      name.textContent = node.path.replace('assets/images/', '');

      pick.appendChild(im);
      pick.appendChild(name);
      pick.addEventListener('click', function () { choose(node.path); });
      cell.appendChild(pick);

      var del = btn('파일 삭제', function () { removeImage(node); });
      del.style.marginTop = '4px';
      cell.appendChild(del);

      list.appendChild(cell);
    });

    if (!list.children.length) {
      var p = document.createElement('p');
      p.className = 'ad-note';
      p.style.padding = '0 14px';
      p.textContent = '해당하는 이미지가 없다.';
      list.appendChild(p);
    }
  }

  function choose(repoRelPath) {
    var t = state.pickTarget;
    if (!t) { return; }

    var rel = relFromFile(repoRelPath);
    t.img.setAttribute('src', rel);
    if (t.thumb) { t.thumb.src = rawUrl(repoRelPath); }

    /* 새 이미지의 실제 크기로 width · height 를 맞춘다.
       비율이 틀어지면 카드가 로딩 중에 흔들린다. */
    var probe = new Image();
    probe.onload = function () {
      t.img.setAttribute('width', String(probe.naturalWidth));
      t.img.setAttribute('height', String(probe.naturalHeight));
    };
    probe.src = rawUrl(repoRelPath);

    closePicker();
    renderImages();
    toast(rel + ' 로 바꿨다.');
  }

  function removeImage(node) {
    if (!window.confirm(node.path + ' 파일을 저장소에서 지운다. 되돌릴 수 없다. 계속할까?')) {
      return;
    }
    api('DELETE', repoPath('/contents/' + node.path), {
      message: 'chore(images): ' + node.path + ' 삭제',
      sha: node.sha,
      branch: state.branch
    }).then(function () {
      state.tree = state.tree.filter(function (n) { return n.path !== node.path; });
      drawThumbs();
      toast('지웠다. 이 파일을 쓰던 자리는 직접 바꿔야 한다.');
    }).catch(function (err) {
      toast('삭제 실패 — ' + err.message, true);
    });
  }

  function upload(file) {
    var dir = $('[data-upload-dir]').value.trim().replace(/^\/+|\/+$/g, '');
    var safe = file.name.toLowerCase().replace(/[^a-z0-9.\-]+/g, '-');
    var path = (dir ? dir + '/' : '') + safe;

    file.arrayBuffer().then(function (buf) {
      return api('PUT', repoPath('/contents/' + path), {
        message: 'chore(images): ' + path + ' 추가',
        content: bufToB64(buf),
        branch: state.branch
      });
    }).then(function (res) {
      state.tree = state.tree || [];
      state.tree.unshift({ path: path, sha: res.content.sha, type: 'blob' });
      drawThumbs();
      toast(path + ' 을 올렸다. 목록에서 고른다.');
    }).catch(function (err) {
      toast('업로드 실패 — ' + err.message, true);
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
    var btnEl = $('[data-save]');
    btnEl.disabled = true;

    api('PUT', repoPath('/contents/' + state.path), {
      message: $('[data-message]').value.trim() || 'chore(content): 내용 수정',
      content: toB64(serialize()),
      sha: state.sha,
      branch: state.branch
    }).then(function (res) {
      state.sha = res.content.sha;
      toast('저장했다. 1 ~ 2분 뒤 사이트에 반영된다.');
    }).catch(function (err) {
      toast('저장 실패 — ' + err.message, true);
    }).then(function () {
      btnEl.disabled = false;
    });
  }

  /* --------------------------------------------------------------- 미리보기 */
  function preview() {
    if (!state.doc) { return; }

    /* 상대 경로가 admin.html 기준으로 풀리도록 base 를 끼워 넣는다. */
    var copy = state.doc.cloneNode(true);
    var base = copy.createElement('base');
    base.setAttribute('href', state.path.indexOf('/') === -1 ? './' :
      state.path.split('/').slice(0, -1).join('/') + '/');
    copy.head.insertBefore(base, copy.head.firstChild);

    $('[data-preview-frame]').srcdoc =
      '<!doctype html>\n' + copy.documentElement.outerHTML;
    $('[data-preview-box]').hidden = false;
  }

  /* ------------------------------------------------------------------- 탭 */
  function selectTab(name) {
    $$('[data-tab]').forEach(function (t) {
      t.setAttribute('aria-selected', String(t.dataset.tab === name));
    });
    $$('[data-pane]').forEach(function (p) {
      p.hidden = p.dataset.pane !== name;
    });
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
    $('[data-open]').addEventListener('click', openFile);
    $('[data-save]').addEventListener('click', save);
    $('[data-preview]').addEventListener('click', preview);
    $('[data-reload]').addEventListener('click', function () {
      if (window.confirm('저장하지 않은 수정은 사라진다. 다시 불러올까?')) { openFile(); }
    });
    $('[data-preview-close]').addEventListener('click', function () {
      $('[data-preview-box]').hidden = true;
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
      if (e.key === 'Escape' && !$('[data-picker]').hidden) { closePicker(); }
    });

    /* 저장하지 않고 창을 닫는 실수를 막는다. */
    window.addEventListener('beforeunload', function (e) {
      if (state.doc) { e.preventDefault(); e.returnValue = ''; }
    });

    selectTab('cards');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
