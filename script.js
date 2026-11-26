/* Mentoría Meta Ads — Celi Segundo · JavaScript vanilla, sin dependencias */
(function () {
  'use strict';

  var d = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isMobile = window.matchMedia('(max-width: 767px)');

  function $(sel, ctx) { return (ctx || d).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || d).querySelectorAll(sel)); }

  /* Reinicia una animación CSS de entrada en un elemento */
  function replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ---------- Año del footer ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Imágenes: si no cargan, queda el placeholder ---------- */
  $$('.media img').forEach(function (img) {
    var box = img.closest('.media');
    function fail() { box.classList.add('is-missing'); }
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
    img.addEventListener('error', fail);
    img.addEventListener('load', function () { box.classList.remove('is-missing'); });
  });

  /* ---------- 3.3 Pestañas ---------- */
  (function tabs() {
    var list = $('[role="tablist"]');
    if (!list) return;
    var tabsEls = $$('[role="tab"]', list);

    function select(tab, focus) {
      if (tab.getAttribute('aria-selected') === 'true') { if (focus) tab.focus(); return; }
      tabsEls.forEach(function (t) {
        var on = t === tab;
        var panel = d.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panel.hidden = !on;
        if (on) replay(panel, 'up');
      });
      if (focus) tab.focus();
    }

    tabsEls.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabsEls.length;
        else if (e.key === 'ArrowLeft') n = (i - 1 + tabsEls.length) % tabsEls.length;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = tabsEls.length - 1;
        if (n !== null) { e.preventDefault(); select(tabsEls[n], true); }
      });
    });
  })();

  /* ---------- 3.5 Carrusel ---------- */
  (function carousel() {
    var root = $('[data-carousel]');
    if (!root) return;
    var viewport = $('.car-viewport', root);
    var track = $('.car-track', root);
    var cards = $$('.mod', track);
    var dotsWrap = $('[data-dots]', root);
    var live = $('[data-live]', root);
    var prevBtn = $('[data-prev]');
    var nextBtn = $('[data-next]');
    var total = cards.length;
    var index = 0;
    var base = 0;

    var dots = cards.map(function (card, i) {
      var b = d.createElement('button');
      b.type = 'button';
      b.className = 'car-dot';
      b.setAttribute('aria-label', 'Ir a ' + card.getAttribute('data-title'));
      b.setAttribute('aria-controls', 'car-track');
      b.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(b);
      return b;
    });

    function gap() {
      var g = parseFloat(window.getComputedStyle(track).columnGap);
      return isNaN(g) ? 20 : g;
    }
    function offsetFor(i) {
      var step = cards[0].offsetWidth + gap();
      // Nunca se desplaza más allá del final: así no queda espacio vacío a la derecha.
      var max = Math.max(0, track.scrollWidth - viewport.clientWidth);
      return Math.min(i * step, max);
    }

    function render(announce) {
      base = -offsetFor(index);
      track.style.transform = 'translateX(' + base + 'px)';
      cards.forEach(function (c, i) { c.classList.toggle('is-active', i === index); });
      dots.forEach(function (b, i) {
        var on = i === index;
        b.classList.toggle('is-active', on);
        if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      prevBtn.setAttribute('aria-disabled', index === 0 ? 'true' : 'false');
      if (announce) {
        live.textContent = 'Módulo ' + (index + 1) + ' de ' + total + ': ' + cards[index].getAttribute('data-title');
      }
    }

    function go(i) {
      var n = Math.max(0, Math.min(total - 1, i));
      if (n === index) { render(false); return; }
      index = n;
      render(true);
    }
    function prev() { if (index > 0) go(index - 1); }
    function next() { go(index + 1 >= total ? 0 : index + 1); }

    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);

    // Clic en una tarjeta: la vuelve activa (salvo que venga de un arrastre)
    var suppressClick = false;
    cards.forEach(function (card, i) {
      $('.mod-hit', card).addEventListener('click', function () {
        if (suppressClick) { suppressClick = false; return; }
        go(i);
      });
    });

    // Teclado: flechas cuando el foco está dentro del carrusel o en sus controles
    function onKey(e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(total - 1); }
    }
    root.addEventListener('keydown', onKey);
    prevBtn.addEventListener('keydown', onKey);
    nextBtn.addEventListener('keydown', onKey);

    // Swipe táctil y arrastre con mouse (Pointer Events)
    var THRESHOLD = 40;
    var drag = null;

    viewport.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      suppressClick = false;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, moved: false };
    });

    window.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      var dy = e.clientY - drag.y;
      if (!drag.moved) {
        if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) {
          if (Math.abs(dy) > 10) drag = null; // gesto vertical: se deja scrollear
          return;
        }
        drag.moved = true;
        viewport.classList.add('is-dragging');
        track.classList.add('no-anim');
      }
      drag.dx = dx;
      // Resistencia en los extremos
      var resist = (index === 0 && dx > 0) || (index === total - 1 && dx < 0) ? 0.35 : 1;
      track.style.transform = 'translateX(' + (base + dx * resist) + 'px)';
    });

    function endDrag(e, cancelled) {
      if (!drag || e.pointerId !== drag.id) return;
      var moved = drag.moved;
      var dx = drag.dx;
      drag = null;
      viewport.classList.remove('is-dragging');
      track.classList.remove('no-anim');
      if (!moved) return;
      suppressClick = true;
      if (!cancelled && dx <= -THRESHOLD && index < total - 1) go(index + 1);
      else if (!cancelled && dx >= THRESHOLD && index > 0) go(index - 1);
      else render(false);
    }
    window.addEventListener('pointerup', function (e) { endDrag(e, false); });
    window.addEventListener('pointercancel', function (e) { endDrag(e, true); });
    viewport.addEventListener('dragstart', function (e) { e.preventDefault(); });

    // Recalcular en resize sin animar
    var rt;
    window.addEventListener('resize', function () {
      track.classList.add('no-anim');
      render(false);
      clearTimeout(rt);
      rt = setTimeout(function () { track.classList.remove('no-anim'); }, 120);
    });

    render(false);
  })();

  /* ---------- 3.8 Test de planes ---------- */
  (function quiz() {
    var root = $('[data-quiz]');
    if (!root) return;
    var result = $('[data-result]', root);
    var answers = {};
    var PLANS = {
      express: { name: 'Lanzamiento Express', reason: 'Una clase por semana te deja tiempo para practicar cada módulo con calma.' },
      pro: { name: 'Pro', reason: 'En 4 semanas ves los 8 módulos y el bonus de ventas por WhatsApp.' },
      vip: { name: 'VIP', reason: 'Sumas sesiones 1 a 1, los dos bonus y un mes de seguimiento con soporte sin límite.' }
    };

    function evaluate() {
      if (!answers.ritmo || !answers.vip) return;
      var key = answers.vip === 'si' ? 'vip' : (answers.ritmo === 'dos' ? 'pro' : 'express');
      var plan = PLANS[key];

      result.innerHTML = '';
      var p = d.createElement('p');
      var strong = d.createElement('strong');
      strong.textContent = 'Te conviene ' + plan.name + '.';
      p.appendChild(strong);
      p.appendChild(d.createTextNode(' ' + plan.reason));
      result.appendChild(p);
      replay(p, 'up');

      var target = null;
      $$('.plan').forEach(function (card) {
        var on = card.getAttribute('data-plan') === key;
        card.classList.toggle('is-reco', on);
        if (on) target = card;
      });
      if (target && isMobile.matches) {
        target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
      }
    }

    $$('[role="radiogroup"]', root).forEach(function (group) {
      var radios = $$('[role="radio"]', group);
      var q = group.getAttribute('data-q');

      function choose(radio, focus) {
        radios.forEach(function (r) {
          var on = r === radio;
          r.setAttribute('aria-checked', on ? 'true' : 'false');
          r.tabIndex = on ? 0 : -1;
        });
        if (focus) radio.focus();
        answers[q] = radio.getAttribute('data-value');
        evaluate();
      }

      radios.forEach(function (radio, i) {
        radio.addEventListener('click', function () { choose(radio, false); });
        radio.addEventListener('keydown', function (e) {
          var n = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % radios.length;
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + radios.length) % radios.length;
          if (n !== null) { e.preventDefault(); choose(radios[n], true); }
        });
      });
    });
  })();

  /* ---------- 3.9 Acordeón ---------- */
  (function faq() {
    var items = $$('.faq-item');
    function set(item, open) {
      item.classList.toggle('is-open', open);
      $('.faq-q', item).setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    items.forEach(function (item) {
      $('.faq-q', item).addEventListener('click', function () {
        var wasOpen = item.classList.contains('is-open');
        items.forEach(function (it) { set(it, false); });
        if (!wasOpen) set(item, true);
      });
    });
  })();

  /* ---------- Aparición al hacer scroll ---------- */
  (function reveal() {
    $$('.stagger').forEach(function (grid) {
      Array.prototype.forEach.call(grid.children, function (child, i) {
        child.style.setProperty('--i', String(i));
      });
    });

    var els = $$('.reveal');
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        // 15% del elemento visible, o 15% de la pantalla cubierta en elementos muy altos
        if (en.intersectionRatio >= 0.15 || en.intersectionRect.height >= window.innerHeight * 0.15) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: [0, 0.05, 0.1, 0.15] });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- 3.12 Botón flotante ---------- */
  (function floating() {
    var btn = $('[data-float]');
    var hero = d.getElementById('inicio');
    var contact = d.getElementById('contacto');
    if (!btn || !hero || !contact) return;
    if (!('IntersectionObserver' in window)) { btn.classList.add('is-shown'); return; }

    var pastHero = false;
    var contactVisible = false;
    function update() { btn.classList.toggle('is-shown', pastHero && !contactVisible); }

    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        pastHero = !en.isIntersecting && en.boundingClientRect.top < 0;
      });
      update();
    }).observe(hero);

    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { contactVisible = en.isIntersecting; });
      update();
    }).observe(contact);
  })();
})();
