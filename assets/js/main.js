/* =========================================================
   NAOS Electromecánica — comportamiento de la página
   ========================================================= */
(function () {
  'use strict';

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Idioma ---------- */
  function initLang() {
    var buttons = $$('.lang__btn');

    function set(lang) {
      window.I18N.apply(lang);
      buttons.forEach(function (b) {
        var on = b.getAttribute('data-lang') === lang;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { set(b.getAttribute('data-lang')); });
    });

    set(window.I18N.preferred());
  }

  /* ---------- 2. Preloader ---------- */
  function initPreloader() {
    var el = $('#preloader');
    if (!el) return;
    var done = false;
    function hide() {
      if (done) return;
      done = true;
      el.classList.add('is-done');
      window.setTimeout(function () { el.remove(); }, 700);
    }
    window.addEventListener('load', function () { window.setTimeout(hide, 250); });
    window.setTimeout(hide, 2600);
  }

  /* ---------- 3. Cabecera y navegación ---------- */
  function initHeader() {
    var header = $('#header');
    var burger = $('#burger');
    var menu   = $('#mobile-menu');
    var toTop  = $('#to-top');

    var onScroll = function () {
      var y = window.scrollY || window.pageYOffset;
      header.classList.toggle('is-stuck', y > 24);
      if (toTop) toTop.classList.toggle('is-visible', y > 900);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }

    function closeMenu() {
      menu.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', window.I18N.t('a11y.menuOpen'));
      document.body.classList.remove('is-locked');
      window.setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 350);
    }

    function openMenu() {
      menu.hidden = false;
      // fuerza el reflow para que la transición de opacidad se dispare
      void menu.offsetWidth;
      menu.classList.add('is-open');
      burger.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', window.I18N.t('a11y.menuClose'));
      document.body.classList.add('is-locked');
    }

    burger.addEventListener('click', function () {
      if (menu.classList.contains('is-open')) closeMenu(); else openMenu();
    });

    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024 && menu.classList.contains('is-open')) closeMenu();
    });

    // Sección activa en el menú
    var links = $$('.nav a');
    var sections = links
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) {
            a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(function (s) { spy.observe(s); });
    }
  }

  /* ---------- 4. Aparición al hacer scroll ---------- */
  function initReveal() {
    var items = $$('.reveal');
    items.forEach(function (el) {
      var d = el.getAttribute('data-delay');
      if (d) el.style.setProperty('--d', d + 'ms');
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in', 'is-done'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('is-in');
        io.unobserve(el);
        // terminada la entrada, el elemento vuelve a transiciones rápidas (hover)
        var wait = (parseInt(el.getAttribute('data-delay'), 10) || 0) + 900;
        window.setTimeout(function () { el.classList.add('is-done'); }, wait);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 5. Contadores ---------- */
  function initCounters() {
    var nums = $$('.count');
    if (!nums.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      nums.forEach(function (n) { n.textContent = n.getAttribute('data-count'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var start = null, dur = 1500;
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });

    nums.forEach(function (n) { n.textContent = '0'; io.observe(n); });
  }

  /* ---------- 6. Cinta de servicios ---------- */
  function buildTicker() {
    var track = $('#ticker-track');
    if (!track) return;
    var list = window.I18N.t('ticker') || [];
    var html = '';
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < list.length; i++) html += '<span>' + list[i] + '</span>';
    }
    track.innerHTML = html;
  }

  /* ---------- 7. Horario en vivo (hora de Canarias) ---------- */
  var OPEN_MIN = 7 * 60;      // 07:00
  var CLOSE_MIN = 15 * 60;    // 15:00
  var DAY_KEYS = ['day.sun.s', 'day.mon.s', 'day.tue.s', 'day.wed.s', 'day.thu.s', 'day.fri.s', 'day.sat.s'];

  function canaryNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Atlantic/Canary', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      var h = parseInt(o.hour, 10); if (h === 24) h = 0;
      return { day: map[o.weekday], minutes: h * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function updateStatus() {
    var now = canaryNow();
    var isWeekday = now.day >= 1 && now.day <= 5;
    var isOpen = isWeekday && now.minutes >= OPEN_MIN && now.minutes < CLOSE_MIN;

    var label;
    if (isOpen) {
      label = (CLOSE_MIN - now.minutes <= 60)
        ? window.I18N.t('status.closingSoon')
        : window.I18N.t('status.open');
    } else if (isWeekday && now.minutes < OPEN_MIN) {
      label = window.I18N.t('status.opensToday');
    } else {
      var ahead = 1;
      while (ahead < 8) {
        var d = (now.day + ahead) % 7;
        if (d >= 1 && d <= 5) break;
        ahead++;
      }
      if (ahead === 1) label = window.I18N.t('status.opensTomorrow');
      else label = window.I18N.t('status.opensOn').replace('{day}', window.I18N.t(DAY_KEYS[(now.day + ahead) % 7]));
    }

    $$('.status').forEach(function (chip) {
      chip.classList.toggle('is-open', isOpen);
      chip.classList.toggle('is-closed', !isOpen);
      chip.setAttribute('title', label);
      var txt = $('.status__text', chip);
      if (txt) txt.textContent = label;
    });

    $$('#hours-table tr').forEach(function (tr) {
      tr.classList.toggle('is-today', parseInt(tr.getAttribute('data-day'), 10) === now.day);
    });
  }

  /* ---------- 8. Motor 3D ---------- */
  function initEngine() {
    var canvas = $('#engine-canvas');
    var hero = $('#hero');
    if (!canvas || !hero) return;

    var supported = (function () {
      try {
        var c = document.createElement('canvas');
        return !!(window.WebGLRenderingContext &&
          (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')));
      } catch (e) { return false; }
    })();

    if (!supported || !window.THREE || !window.NAOS3D) {
      hero.classList.add('no-webgl');
      var d = $('#dial');
      if (d) d.classList.add('no-webgl');
      return;
    }

    var instance = null;
    try { instance = window.NAOS3D.init(canvas); } catch (e) { instance = null; }
    if (!instance) hero.classList.add('no-webgl');

    // engranajes de la sección «Profesionales»
    var dial = $('#dial');
    var gears = $('#gears-canvas');
    if (dial && gears) {
      var g = null;
      try { g = window.NAOS3D.initGears(gears); } catch (e) { g = null; }
      if (!g) dial.classList.add('no-webgl');
    }
  }

  /* ---------- 8b. Osciloscopio de «Diagnosis» ----------
     Dibuja la señal de un sensor inductivo de cigüeñal (rueda fónica 60-2):
     una serie de dientes y, en el hueco de los dos que faltan, una oscilación
     más larga y amplia. Se dibujan dos ciclos para que la animación sea continua. */
  function initScope() {
    var path = document.getElementById('scope-path');
    if (!path) return;
    var MID = 70, TOOTH = 12, TEETH = 29, CYCLE = 400;
    var GAP = CYCLE - TOOTH * TEETH;
    var d = [];
    for (var x = 0; x <= CYCLE * 2; x += 1) {
      var local = x % CYCLE, y;
      if (local < TOOTH * TEETH) {
        y = MID - 30 * Math.sin((2 * Math.PI * local) / TOOTH);
      } else {
        y = MID + 46 * Math.sin((Math.PI * (local - TOOTH * TEETH)) / GAP);
      }
      d.push((x === 0 ? 'M' : 'L') + x + ' ' + y.toFixed(1));
    }
    path.setAttribute('d', d.join(''));
  }

  /* ---------- 9. Año en el pie ---------- */
  function initYear() {
    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- arranque ---------- */
  function boot() {
    initLang();
    initPreloader();
    initHeader();
    initReveal();
    initCounters();
    buildTicker();
    updateStatus();
    initYear();
    initScope();
    initEngine();

    document.addEventListener('naos:lang', function () {
      buildTicker();
      updateStatus();
    });

    window.setInterval(updateStatus, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
