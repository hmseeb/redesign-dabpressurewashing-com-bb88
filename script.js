/* =========================================================
   DAB Pressure Washing — interactions
   Vanilla JS. No dependencies, no external APIs.
   ========================================================= */
(function () {
  'use strict';

  var doc = document;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- current year ---------- */
  var yearEl = doc.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- sticky header shadow ---------- */
  var header = doc.getElementById('header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-stuck', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile nav ---------- */
  var burger = doc.getElementById('burger');
  var nav = doc.getElementById('nav');

  function closeNav() {
    if (!nav || !burger) return;
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
    doc.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !burger.contains(e.target)) closeNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) closeNav();
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revealables = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentElement ? Array.prototype.slice.call(el.parentElement.children) : [];
        var idx = siblings.indexOf(el);
        el.style.transitionDelay = (Math.min(Math.max(idx, 0), 5) * 70) + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px' });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- animated stat counters ---------- */
  var counters = Array.prototype.slice.call(doc.querySelectorAll('[data-count]'));
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var start = null;
    var duration = 1400;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCounter);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          cio.unobserve(entry.target);
        });
      }, { threshold: 0.6 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---------- accordion: one open at a time ---------- */
  var accs = Array.prototype.slice.call(doc.querySelectorAll('.acc'));
  accs.forEach(function (acc) {
    acc.addEventListener('toggle', function () {
      if (!acc.open) return;
      accs.forEach(function (other) {
        if (other !== acc) other.open = false;
      });
    });
  });

  /* ---------- active nav link on scroll ---------- */
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('.nav a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return doc.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { sio.observe(s); });
  }

  /* ---------- quote form -> prefilled email ---------- */
  var form = doc.getElementById('quote-form');
  var status = doc.getElementById('formstatus');

  function setStatus(msg, isError) {
    if (!status) return;
    status.textContent = msg;
    status.classList.toggle('is-error', !!isError);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = doc.getElementById('name');
      var phone = doc.getElementById('phone');
      var email = doc.getElementById('email');
      var town = doc.getElementById('town');
      var service = doc.getElementById('service');
      var details = doc.getElementById('details');

      var required = [name, phone];
      var missing = false;

      required.forEach(function (el) {
        var empty = !el.value.trim();
        el.classList.toggle('is-invalid', empty);
        if (empty) missing = true;
      });

      if (missing) {
        setStatus('Please add your name and phone number so we can send the quote back.', true);
        (name.value.trim() ? phone : name).focus();
        return;
      }

      var lines = [
        'Name: ' + name.value.trim(),
        'Phone: ' + phone.value.trim(),
        'Email: ' + (email.value.trim() || 'not provided'),
        'Town: ' + (town.value.trim() || 'Champaign County'),
        'Service: ' + service.value,
        '',
        'Details:',
        details.value.trim() || 'Requesting a free written estimate.',
        '',
        '— Sent from dabpressurewashing.com'
      ];

      var subject = 'Free quote request — ' + service.value + ' (' + (town.value.trim() || 'Champaign County') + ')';
      var href = 'mailto:barakadjibade2@gmail.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(lines.join('\n'));

      window.location.href = href;
      setStatus('Opening your email app with the request ready to send. Prefer to talk? Call (217) 689-2050.', false);
    });

    form.addEventListener('input', function (e) {
      if (e.target.classList) e.target.classList.remove('is-invalid');
    });
  }
})();
