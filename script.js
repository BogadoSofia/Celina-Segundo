/* Mentoría de publicidad digital — Celi Segundo · JavaScript vanilla, sin dependencias */
(function () {
  'use strict';

  var d = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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

  /* ---------- Pestañas (3.3 ¿Es para ti? y 3.5 Programa por plataforma) ---------- */
  $$('[role="tablist"]').forEach(function (list) {
    var tabsEls = $$('[role="tab"]', list);
    // Si la lista indica un destino, ese texto cambia con la pestaña (el nombre de la plataforma en el título)
    var nameSel = list.getAttribute('data-name-target');
    var nameEl = nameSel ? $(nameSel) : null;

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
      if (nameEl && tab.getAttribute('data-name')) nameEl.textContent = tab.getAttribute('data-name');
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
  });

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
    // Aviso al <head> de que el JS llegó hasta acá (ver el respaldo de 2,5 s en index.html)
    window.celiReady = true;
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    // Se dispara apenas el elemento asoma (incluso un poco antes de entrar en
    // pantalla), así al scrollear rápido la animación ya está en marcha.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px 80px 0px' });
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
    var plansVisible = false;
    // Se oculta en la portada, en el contacto y mientras se ve el precio
    // (que ya tiene sus propios botones). En mobile no se muestra nunca (ver CSS).
    function update() { btn.classList.toggle('is-shown', pastHero && !contactVisible && !plansVisible); }

    var plans = $('#planes .stack--plans');
    if (plans) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { plansVisible = en.isIntersecting; });
        update();
      }).observe(plans);
    }

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
