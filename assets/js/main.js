/* ==========================================================================
   main.js — 헤더 · 오버레이 · 네비 · 캐러셀 · 리빌 · TOP · 메일 복사
   해당 DOM이 없으면 각 함수는 조용히 return 한다 (상세 페이지 공용).
   ========================================================================== */

(function () {
  'use strict';

  /* 네비 라벨은 여기 한 곳에서만 관리한다.
     index.html 의 마크업은 JS 없이도 동작하도록 같은 내용을 담고 있고,
     아래 배열이 로드 시 라벨과 링크를 덮어쓴다. */
  var NAV = [
    { id: 'work',        label: 'Work' },
    { id: 'lab',         label: 'Lab' },
    { id: 'writing',     label: 'Writing' },
    { id: 'credentials', label: 'Credentials' },
    { id: 'contact',     label: 'Contact' }
  ];

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* index.html 안에서만 해시 링크를 쓴다. 상세 페이지에서는 index.html#id 로 보낸다. */
  var isHome = !/\/work\//.test(window.location.pathname);
  var homePrefix = isHome ? '' : '../index.html';

  /* ------------------------------------------------------------------ 네비 렌더 */
  function renderNav() {
    var lists = document.querySelectorAll('[data-nav]');

    Array.prototype.forEach.call(lists, function (list) {
      var linkClass = list.getAttribute('data-nav-link-class') || '';
      list.innerHTML = '';

      NAV.forEach(function (item) {
        var a = document.createElement('a');
        a.href = homePrefix + '#' + item.id;
        a.textContent = item.label;
        a.setAttribute('data-nav-target', item.id);
        if (linkClass) { a.className = linkClass; }
        list.appendChild(a);
      });
    });
  }

  /* ------------------------------------------------------------------ 헤더 */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) { return; }

    var lastY = window.scrollY;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      var headerHeight = header.offsetHeight;

      header.classList.toggle('is-pinned', y > 0);

      if (y <= 0) {
        header.classList.remove('is-hidden');
      } else if (y > lastY && y > headerHeight) {
        header.classList.add('is-hidden');
      } else if (y < lastY) {
        header.classList.remove('is-hidden');
      }

      lastY = y;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* ------------------------------------------------------------------ 오버레이 */
  function initOverlay() {
    var gnb = document.getElementById('gnb');
    var openBtn = document.querySelector('.hamburger');
    if (!gnb || !openBtn) { return; }

    var closeBtn = gnb.querySelector('.gnb__close');
    var focusables = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';
    var pendingHash = null;

    function open() {
      gnb.classList.add('is-open');
      gnb.setAttribute('aria-hidden', 'false');
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';

      var first = gnb.querySelector(focusables);
      if (first) { first.focus(); }
    }

    function close() {
      gnb.classList.remove('is-open');
      gnb.setAttribute('aria-hidden', 'true');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      openBtn.focus();
    }

    openBtn.addEventListener('click', open);
    if (closeBtn) { closeBtn.addEventListener('click', close); }

    document.addEventListener('keydown', function (event) {
      if (!gnb.classList.contains('is-open')) { return; }

      if (event.key === 'Escape') {
        close();
        return;
      }

      if (event.key !== 'Tab') { return; }

      /* 포커스 트랩 */
      var items = gnb.querySelectorAll(focusables);
      if (!items.length) { return; }

      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    /* 메뉴 클릭 → 닫힘 애니메이션이 끝난 뒤 해당 섹션으로 이동 */
    gnb.addEventListener('click', function (event) {
      var link = event.target.closest('a[href*="#"]');
      if (!link) { return; }

      var hash = link.hash;
      var samePage = link.pathname === window.location.pathname || isHome;
      if (!hash || !samePage || !document.querySelector(hash)) { return; }

      event.preventDefault();
      pendingHash = hash;
      close();

      window.setTimeout(function () {
        var target = document.querySelector(pendingHash);
        pendingHash = null;
        if (!target) { return; }
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        history.replaceState(null, '', hash);
      }, prefersReducedMotion ? 0 : 320);
    });
  }

  /* ------------------------------------------------------------------ 네비 활성 상태 */
  function initNav() {
    var links = document.querySelectorAll('.site-nav__link');
    if (!links.length || !('IntersectionObserver' in window)) { return; }

    var byId = {};
    Array.prototype.forEach.call(links, function (link) {
      byId[link.getAttribute('data-nav-target')] = link;
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link) { return; }
        if (entry.isIntersecting) {
          Array.prototype.forEach.call(links, function (other) {
            other.classList.remove('is-active');
          });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px' });

    NAV.forEach(function (item) {
      var section = document.getElementById(item.id);
      if (section) { observer.observe(section); }
    });
  }

  /* ------------------------------------------------------------------ LAB 캐러셀 */
  function initCarousel() {
    var track = document.querySelector('[data-carousel-track]');
    var prev = document.querySelector('[data-carousel-prev]');
    var next = document.querySelector('[data-carousel-next]');
    if (!track || !prev || !next) { return; }

    function step() {
      var card = track.querySelector('.card');
      if (!card) { return 0; }
      var gap = parseFloat(getComputedStyle(track).columnGap) || 30;
      return (card.getBoundingClientRect().width + gap) * 2;   /* 한 번에 카드 2장 */
    }

    function syncArrows() {
      var max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= max - 1;
    }

    function scrollBy(direction) {
      track.scrollBy({
        left: direction * step(),
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    }

    prev.addEventListener('click', function () { scrollBy(-1); });
    next.addEventListener('click', function () { scrollBy(1); });
    track.addEventListener('scroll', syncArrows, { passive: true });
    window.addEventListener('resize', syncArrows);

    syncArrows();
  }

  /* ------------------------------------------------------------------ 스크롤 리빌 */
  function initReveal() {
    var targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) { return; }

    Array.prototype.forEach.call(targets, function (group) {
      var children = group.children;
      Array.prototype.forEach.call(children, function (child, index) {
        child.classList.add('reveal');
        child.style.transitionDelay = (index * 60) + 'ms';   /* stagger */
      });
    });

    function revealAll() {
      Array.prototype.forEach.call(targets, function (group) {
        Array.prototype.forEach.call(group.children, function (child) {
          child.classList.add('is-visible');
        });
      });
    }

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealAll();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        Array.prototype.forEach.call(entry.target.children, function (child) {
          child.classList.add('is-visible');
        });
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .08 });

    Array.prototype.forEach.call(targets, function (group) { observer.observe(group); });
  }

  /* ------------------------------------------------------------------ TOP 버튼 */
  function initTopButton() {
    var button = document.querySelector('.to-top');
    if (!button) { return; }

    var ticking = false;

    function update() {
      button.classList.toggle('is-visible', window.scrollY > 600);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    update();
  }

  /* ------------------------------------------------------------------ 메일 주소 복사 */
  function initCopyEmail() {
    var button = document.querySelector('[data-copy-email]');
    if (!button) { return; }

    var address = button.getAttribute('data-copy-email');
    var original = button.textContent;
    var timer = null;

    function feedback(message) {
      button.textContent = message;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { button.textContent = original; }, 1500);
    }

    function fallbackCopy() {
      var field = document.createElement('textarea');
      field.value = address;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();

      var ok = false;
      try { ok = document.execCommand('copy'); } catch (error) { ok = false; }

      document.body.removeChild(field);
      feedback(ok ? '복사됨' : '복사 실패');
    }

    button.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(address).then(function () {
          feedback('복사됨');
        }).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  }

  /* ------------------------------------------------------------------ 상장 원본 보기 */
  /* data-lightbox 를 가진 버튼을 누르면 전체 화면으로 스캔본을 띄운다.
     서버가 없으므로 이미지는 저장소에 들어 있는 파일을 그대로 부른다. */
  function initLightbox() {
    var box = document.querySelector('[data-lightbox-dialog]');
    if (!box) { return; }

    var img = box.querySelector('[data-lightbox-img]');
    var text = box.querySelector('[data-lightbox-text]');
    var link = box.querySelector('[data-lightbox-link]');
    var closeBtn = box.querySelector('[data-lightbox-close]');
    var opener = null;

    function open(trigger) {
      opener = trigger;
      img.src = trigger.getAttribute('data-lightbox');
      img.alt = trigger.getAttribute('data-lightbox-alt') || '';
      text.textContent = trigger.getAttribute('data-lightbox-caption') || '';

      var href = trigger.getAttribute('data-lightbox-href');
      if (href) {
        link.href = href;
        link.textContent = trigger.getAttribute('data-lightbox-href-text') || '저장소 보기';
        link.hidden = false;
      } else {
        link.hidden = true;
      }

      box.hidden = false;
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function close() {
      box.hidden = true;
      document.body.style.overflow = '';
      /* 이미지를 비워 두면 다음에 열 때 이전 상장이 잠깐 보이지 않는다 */
      img.removeAttribute('src');
      if (opener) { opener.focus(); }
      opener = null;
    }

    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-lightbox]');
      if (trigger) {
        event.preventDefault();
        open(trigger);
        return;
      }

      /* 사진 바깥을 누르면 닫는다 */
      if (!box.hidden && (event.target === box || event.target.closest('[data-lightbox-close]'))) {
        close();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (box.hidden) { return; }

      if (event.key === 'Escape') {
        close();
        return;
      }

      /* 포커스가 라이트박스 밖으로 나가지 않게 닫기 버튼과 링크 사이에 가둔다 */
      if (event.key !== 'Tab') { return; }
      var items = [];
      [closeBtn, link].forEach(function (el) {
        if (el && !el.hidden) { items.push(el); }
      });
      if (!items.length) { return; }

      var first = items[0];
      var last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ------------------------------------------------------------------ 부트스트랩 */
  function init() {
    renderNav();
    initHeader();
    initOverlay();
    initNav();
    initCarousel();
    initReveal();
    initTopButton();
    initCopyEmail();
    initLightbox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
