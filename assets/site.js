/* ==========================================================================
   Markify X — shared site behaviour (all pages)
   theme · custom cursor · magnetic buttons · mobile menu · dropdowns ·
   active nav state · scroll reveal · contact-form helper
   ========================================================================== */
(function () {
  'use strict';
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- theme ---------- */
  var toggle = $('#themeToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('markify-theme', next); } catch (e) {}
    });
  }

  /* ---------- custom cursor (same on every page, fine pointers only) ---------- */
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var calm = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (fine && !calm) {
    document.body.classList.add('has-cursor');
    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
    window.addEventListener('pointermove', function (e) {
      dot.classList.add('on');
      dot.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px) translate(-50%,-50%)';
    }, { passive: true });
    document.addEventListener('pointerleave', function () { dot.classList.remove('on'); });
    // delegated, so dynamically-rendered cards/buttons also get the hover state
    var HOT = 'a,button,summary,label,.card,.svc-card,[role="button"]';
    var TEXT = 'input,textarea,select';
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest ? e.target : e.target.parentElement;
      if (!t) return;
      dot.classList.toggle('hide', !!t.closest(TEXT));
      dot.classList.toggle('big', !!t.closest(HOT));
    });
    // magnetic buttons
    document.addEventListener('pointermove', function (e) {
      var b = e.target.closest && e.target.closest('.btn');
      if (!b) return;
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.3).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px)';
    });
    document.addEventListener('pointerout', function (e) {
      var b = e.target.closest && e.target.closest('.btn');
      if (b) b.style.transform = '';
    });
  }


  /* ---------- hero panel tilt (all pages) ---------- */
  var tilt = $('#tiltPanel');
  if (tilt && fine && !calm) {
    var panel = $('.panel', tilt);
    if (panel) {
      tilt.addEventListener('pointermove', function (e) {
        var r = tilt.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        panel.style.transform = 'rotateX(' + (-py * 10 + 4).toFixed(2) + 'deg) rotateY(' + (px * 14 - 6).toFixed(2) + 'deg)';
      });
      tilt.addEventListener('pointerleave', function () { panel.style.transform = ''; });
    }
  }

  /* ---------- mobile menu ---------- */
  var burger = $('#burger'), nav = $('#navlinks');
  function setMenu(open) {
    if (!burger || !nav) return;
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
    if (!open) closeDropdowns();
  }
  function closeDropdowns(except) {
    $$('.has-dropdown.open').forEach(function (li) {
      if (li !== except) {
        li.classList.remove('open');
        var c = $('.nav-caret', li); if (c) c.setAttribute('aria-expanded', 'false');
      }
    });
  }
  if (burger && nav) {
    burger.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    // any real link closes the menu
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    // leaving mobile width resets everything
    window.matchMedia('(min-width:1021px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- dropdowns (caret button = toggle, link = navigate) ---------- */
  $$('.has-dropdown').forEach(function (li) {
    var caret = $('.nav-caret', li);
    if (!caret) return;
    caret.addEventListener('click', function (e) {
      e.stopPropagation();
      var was = li.classList.contains('open');
      closeDropdowns(li);
      li.classList.toggle('open', !was);
      caret.setAttribute('aria-expanded', !was ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-dropdown')) closeDropdowns();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var openMenu = nav && nav.classList.contains('open');
      closeDropdowns();
      if (openMenu) { setMenu(false); if (burger) burger.focus(); }
    }
  });

  /* ---------- active navigation state ---------- */
  var page = document.body.getAttribute('data-page'); // home | marketing | development
  var items = $$('.navlinks [data-nav]');
  function markPage() {
    items.forEach(function (li) {
      var on = li.getAttribute('data-nav') === page;
      li.classList.toggle('is-active', on);
      var a = $('a', li);
      if (a) { if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }
    });
  }
  markPage();
  // On the home page also highlight Case Studies / Resources while their section is on screen.
  if (page === 'home' && 'IntersectionObserver' in window) {
    var spy = items.filter(function (li) { return li.hasAttribute('data-spy'); });
    var visible = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var hit = null;
      spy.forEach(function (li) {
        li.getAttribute('data-spy').split(' ').forEach(function (id) { if (visible[id]) hit = li; });
      });
      items.forEach(function (li) { li.classList.remove('is-active'); });
      var target = hit || items.filter(function (li) { return li.getAttribute('data-nav') === 'home'; })[0];
      if (target) target.classList.add('is-active');
    }, { rootMargin: '-45% 0px -50% 0px' });
    spy.forEach(function (li) {
      li.getAttribute('data-spy').split(' ').forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    });
  }

  /* ---------- scroll reveal ---------- */
  var rev = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rev.forEach(function (el) { ro.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('in'); }); }

  /* ---------- contact form helper (all pages) ---------- */
  // Forms with data-contact-form validate name + email and show a friendly message.
  // Wire the real endpoint by adding  action="https://…"  and removing preventDefault below.
  $$('form[data-contact-form]').forEach(function (form) {
    var msg = $('.form-msg', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var email = String(d.get('email') || '');
      if (!d.get('name') || !/^\S+@\S+\.\S+$/.test(email)) {
        if (msg) { msg.textContent = 'Please add your name and a valid email.'; msg.className = 'form-msg err'; }
        return;
      }
      if (msg) { msg.textContent = "Thanks — we'll be in touch within one business day."; msg.className = 'form-msg ok'; }
      form.reset();
    });
  });
})();
