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
      var bk = $('#cita');
      if (bk) bk.classList.add('no-webgl');
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

    // piezas de taller flotando en la sección «Solicitar cita»
    var wc = $('#workshop-canvas');
    var bookSec = $('#cita');
    if (wc && bookSec && window.NAOS3D.initWorkshop) {
      var ws = null;
      try { ws = window.NAOS3D.initWorkshop(wc, bookSec); } catch (e) { ws = null; }
      if (!ws) bookSec.classList.add('no-webgl');
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

  /* ---------- 8c. Solicitud de cita ----------
     Sin servidor: al enviar se abre WhatsApp (680 31 01 80) con la solicitud
     redactada. Los datos no se guardan ni salen del navegador hasta que el
     propio cliente pulsa «enviar» en WhatsApp. */
  var WA_NUMBER = '34680310180';
  var booking = null;

  function initBooking() {
    var form = $('#book-form');
    var daysBox = $('#day-chips');
    if (!form || !daysBox) return null;

    var tried = false;
    var reopen = $('#book-reopen');
    var locale = function () { return window.I18N.lang === 'en' ? 'en-GB' : 'es-ES'; };

    function canaryToday() {
      try {
        var o = {};
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Atlantic/Canary', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false
        }).formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
        return { y: +o.year, m: +o.month, d: +o.day, h: (+o.hour) % 24 };
      } catch (e) {
        var n = new Date();
        return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate(), h: n.getHours() };
      }
    }

    // próximos 10 días laborables; «hoy» solo si es laborable y antes de las 12:00
    function buildDays() {
      var sel = form.querySelector('input[name="day"]:checked');
      var selected = sel ? sel.value : '';
      var fWd = new Intl.DateTimeFormat(locale(), { weekday: 'short', timeZone: 'UTC' });
      var fMo = new Intl.DateTimeFormat(locale(), { month: 'short', timeZone: 'UTC' });
      var now = canaryToday();
      var base = Date.UTC(now.y, now.m - 1, now.d);
      var html = '', count = 0, offset = now.h >= 12 ? 1 : 0;

      while (count < 10 && offset < 40) {
        var dt = new Date(base + offset * 86400000);
        var wd = dt.getUTCDay();
        if (wd >= 1 && wd <= 5) {
          var iso = dt.toISOString().slice(0, 10);
          var wdTxt = offset === 0 ? window.I18N.t('book.today') : fWd.format(dt).replace('.', '');
          html += '<label class="day"><input type="radio" name="day" value="' + iso + '"' + (iso === selected ? ' checked' : '') + '>' +
                  '<span class="day__box"><span class="day__wd">' + wdTxt + '</span>' +
                  '<span class="day__num">' + dt.getUTCDate() + '</span>' +
                  '<span class="day__mo">' + fMo.format(dt).replace('.', '') + '</span></span></label>';
          count++;
        }
        offset++;
      }
      html += '<label class="day day--any"><input type="radio" name="day" value="any"' + (selected === 'any' ? ' checked' : '') + '>' +
              '<span class="day__box"><span class="day__num">' + window.I18N.t('book.anyday') + '</span>' +
              '<span class="day__mo">' + window.I18N.t('book.anydayd') + '</span></span></label>';
      daysBox.innerHTML = html;
    }

    function val(n) { var el = form.elements.namedItem(n); return el && el.value ? el.value.trim() : ''; }
    function checked(n) { return form.querySelector('input[name="' + n + '"]:checked'); }
    function digits() { return val('phone').replace(/\D/g, ''); }

    function serviceLabels() {
      return [].slice.call(form.querySelectorAll('input[name="service"]:checked')).map(function (i) {
        return i.parentElement.querySelector('[data-i18n]').textContent.trim();
      });
    }
    function vehicleLabel() {
      var model = val('model');
      if (!model) return '';
      var vt = checked('vtype');
      var plate = val('plate').toUpperCase();
      return (vt ? vt.nextElementSibling.textContent.trim() + ' · ' : '') + model + (plate ? ' (' + plate + ')' : '');
    }
    function dayLabel() {
      var i = checked('day');
      if (!i) return '';
      if (i.value === 'any') return window.I18N.t('book.anyday');
      var p = i.value.split('-');
      var dt = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
      var s = new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(dt);
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function slotLabel() {
      var i = checked('slot');
      if (!i) return '';
      return i.value === 'any' ? window.I18N.t('book.sl.any') : i.value;
    }

    function setRow(id, text) {
      var dd = document.getElementById(id);
      dd.textContent = text || '—';
      dd.classList.toggle('is-empty', !text);
    }

    function update() {
      var sv = serviceLabels();
      var name = val('name');
      setRow('t-service', sv.join(', '));
      setRow('t-vehicle', vehicleLabel());
      setRow('t-day', dayLabel());
      setRow('t-slot', slotLabel());
      setRow('t-name', name ? name + (val('phone') ? ' · ' + val('phone') : '') : '');

      var done = {
        service: sv.length > 0,
        vehicle: !!val('model'),
        when: !!checked('day') && !!checked('slot'),
        contact: !!name && digits().length >= 9 && form.elements.namedItem('consent').checked
      };
      var n = 0;
      Object.keys(done).forEach(function (k) {
        if (done[k]) n++;
        var fs = form.querySelector('.bstep[data-step="' + k + '"]');
        if (fs) fs.classList.toggle('is-complete', done[k]);
      });
      $('#t-count').textContent = n;
      $('#t-bar').style.width = (n / 4) * 100 + '%';
    }

    function setErr(id, key, input) {
      var p = document.getElementById(id);
      if (p) p.textContent = key ? window.I18N.t(key) : '';
      if (input) input.setAttribute('aria-invalid', key ? 'true' : 'false');
    }

    function validate(moveFocus) {
      var first = null;
      function check(cond, id, key, focusEl, input) {
        setErr(id, cond ? '' : key, input);
        if (!cond && !first) first = focusEl;
      }
      var model = form.elements.namedItem('model');
      var nameEl = form.elements.namedItem('name');
      var phone = form.elements.namedItem('phone');
      var consent = form.elements.namedItem('consent');

      check(serviceLabels().length > 0, 'err-service', 'book.err.service', form.querySelector('input[name="service"]'));
      check(!!val('model'), 'err-model', 'book.err.model', model, model);
      check(!!checked('day') && !!checked('slot'), 'err-when', 'book.err.when',
            checked('day') ? form.querySelector('input[name="slot"]') : form.querySelector('input[name="day"]'));
      check(!!val('name'), 'err-name', 'book.err.name', nameEl, nameEl);
      check(digits().length >= 9, 'err-phone', 'book.err.phone', phone, phone);
      check(consent.checked, 'err-consent', 'book.err.consent', consent);

      if (first && moveFocus) {
        var box = first.closest('.field') || first.closest('.bstep');
        if (box) box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        first.focus({ preventScroll: true });
      }
      return !first;
    }

    function message() {
      var L = [window.I18N.t('book.msg.hello'), ''];
      L.push('• ' + window.I18N.t('book.msg.service') + ': ' + serviceLabels().join(', '));
      L.push('• ' + window.I18N.t('book.msg.vehicle') + ': ' + vehicleLabel());
      L.push('• ' + window.I18N.t('book.msg.day') + ': ' + dayLabel());
      L.push('• ' + window.I18N.t('book.msg.slot') + ': ' + slotLabel());
      L.push('• ' + window.I18N.t('book.msg.name') + ': ' + val('name'));
      L.push('• ' + window.I18N.t('book.msg.phone') + ': ' + val('phone'));
      if (val('msg')) L.push('• ' + window.I18N.t('book.msg.comment') + ': ' + val('msg'));
      L.push('', window.I18N.t('book.msg.bye'));
      return L.join('\n');
    }

    form.addEventListener('input', function () { update(); if (tried) validate(false); });
    form.addEventListener('change', function () { update(); if (tried) validate(false); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      update();
      if (!validate(true)) return;
      var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message());
      if (reopen) { reopen.href = url; reopen.target = '_blank'; reopen.rel = 'noopener'; }
      $('#book-done').hidden = false;
      window.open(url, '_blank', 'noopener');
    });

    buildDays();
    update();

    return {
      refresh: function () { buildDays(); update(); if (tried) validate(false); }
    };
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
    booking = initBooking();
    initEngine();

    document.addEventListener('naos:lang', function () {
      buildTicker();
      updateStatus();
      if (booking) booking.refresh();
    });

    window.setInterval(updateStatus, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
