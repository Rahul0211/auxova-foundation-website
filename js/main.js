/**
 * Auxova Foundation — Main JavaScript
 * Handles: scroll reveals, counter animations, journey SVG path draw,
 * mobile menu toggle, smooth scroll, contact form, active nav.
 */

(function () {
  'use strict';

  /* ============================================================
     UTILITIES
     ============================================================ */

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  function tween(duration, onFrame, easeFn) {
    var ease = easeFn || easeOutCubic;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var raw = Math.min(1, (ts - start) / duration);
      var t = ease(raw);
      onFrame(t, raw);
      if (raw < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function observeOnce(el, callback, opts) {
    if (!el) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          io.disconnect();
          callback(entry);
        }
      });
    }, opts || { threshold: 0.12 });
    io.observe(el);
  }

  /* ============================================================
     1. SCROLL REVEAL
     ============================================================ */
  function initScrollReveal() {
    var els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;

    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(26px)';
      el.style.transition = 'opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1)';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-reveal') || '0', 10);
        setTimeout(function () {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     2. COUNTER ANIMATION
     Handles any element with [data-counter] attribute.
     data-counter="600" data-counter-suffix="M+"
     ============================================================ */
  function formatWithCommas(num, decimals) {
    var parts = num.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function initCounters() {
    var counterEls = document.querySelectorAll('[data-counter]');
    if (!counterEls.length) return;

    // Find the closest scrollable ancestor section for each counter
    counterEls.forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-counter'));
      var prefix = el.getAttribute('data-counter-prefix') || '';
      var suffix = el.getAttribute('data-counter-suffix') || '';
      var decimals = parseInt(el.getAttribute('data-counter-decimals') || '0', 10);
      var useCommas = el.hasAttribute('data-counter-commas');
      var done = false;

      // Observe the parent stat card or section instead of the tiny span
      var observeTarget = el.closest('.ax-stat-card') || el.closest('[id]') || el;

      observeOnce(observeTarget, function () {
        if (done) return;
        done = true;
        tween(2000, function (t) {
          var val = target * t;
          var formatted = useCommas ? formatWithCommas(val, decimals) : val.toFixed(decimals);
          el.textContent = prefix + formatted + suffix;
        }, easeOutCubic);
      }, { threshold: 0.15 });
    });
  }

  /* ============================================================
     3. JOURNEY PATH DRAW
     ============================================================ */
  function initJourneyPath() {
    var journeySection = document.getElementById('ax-journey');
    var animatedPath = document.getElementById('ax-journey-path');
    var travelingDot = document.getElementById('ax-journey-dot');

    if (!journeySection || !animatedPath) return;

    var done = false;
    var pathLen;

    requestAnimationFrame(function () {
      try { pathLen = animatedPath.getTotalLength(); } catch (e) { pathLen = 0; }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !done) {
          done = true;
          io.disconnect();

          if (!pathLen) {
            try { pathLen = animatedPath.getTotalLength(); } catch (e) { pathLen = 0; }
          }

          if (travelingDot) travelingDot.style.display = 'block';

          var startTime = null;
          var DURATION = 2800;

          function frame(ts) {
            if (!startTime) startTime = ts;
            var raw = Math.min(1, (ts - startTime) / DURATION);
            var eased = easeInOutQuad(raw);

            animatedPath.style.strokeDashoffset = String(1 - eased);

            if (travelingDot && pathLen > 0) {
              try {
                var pt = animatedPath.getPointAtLength(pathLen * eased);
                travelingDot.setAttribute('cx', String(pt.x));
                travelingDot.setAttribute('cy', String(pt.y));
              } catch (err) { /* noop */ }
            }

            if (raw < 1) requestAnimationFrame(frame);
          }

          requestAnimationFrame(frame);
        }
      });
    }, { threshold: 0.35 });

    io.observe(journeySection);
  }

  /* ============================================================
     4. MOBILE MENU TOGGLE
     ============================================================ */
  function initMobileMenu() {
    var hamburger = document.getElementById('ax-hamburger');
    var mobileMenu = document.getElementById('ax-mobile-menu');

    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.contains('is-open');
      if (isOpen) {
        mobileMenu.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      } else {
        mobileMenu.classList.add('is-open');
        hamburger.classList.add('is-open');
        hamburger.setAttribute('aria-expanded', 'true');
      }
    });

    var menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ============================================================
     5. SMOOTH SCROLL
     ============================================================ */
  function initSmoothScroll() {
    var NAV_HEIGHT = 80;

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - NAV_HEIGHT;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  /* ============================================================
     6. ACTIVE NAV STATE
     ============================================================ */
  function initActiveNav() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';

    var navMap = {
      'index.html': 'Home',
      '': 'Home',
      'about.html': 'About Us',
      'programs.html': 'Thematic Areas',
      'impact.html': 'Impact',
      'contact.html': 'Contact Us'
    };

    var activeName = navMap[page];
    if (!activeName) return;

    document.querySelectorAll('.ax-navlinks a, .ax-mobile-menu a').forEach(function (link) {
      if (link.textContent.trim() === activeName) {
        link.classList.add('is-active');
      }
    });
  }

  /* ============================================================
     7. CONTACT FORM
     ============================================================ */
  function initContactForm() {
    var form = document.getElementById('ax-contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var submitBtn = form.querySelector('.ax-form-submit');
      var originalText = submitBtn.innerHTML;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      // Submit via Netlify Forms
      var formData = new FormData(form);
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      })
      .then(function (response) {
        if (response.ok) {
          submitBtn.textContent = 'Message Sent!';
          submitBtn.style.background = 'linear-gradient(120deg, #059669, #10B981)';
          form.reset();
        } else {
          submitBtn.textContent = 'Error — Please try again';
          submitBtn.style.background = 'linear-gradient(120deg, #DC2626, #EF4444)';
        }
        setTimeout(function () {
          submitBtn.innerHTML = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
        }, 3000);
      })
      .catch(function () {
        // Fallback: open mailto
        var email = formData.get('work_email') || '';
        var name = formData.get('full_name') || '';
        var org = formData.get('organization') || '';
        var msg = formData.get('message') || '';
        var subject = 'CSR Partnership Enquiry from ' + name + ' (' + org + ')';
        var body = 'Name: ' + name + '\nOrganization: ' + org + '\nEmail: ' + email + '\n\n' + msg;
        window.location.href = 'mailto:hello@auxova.in?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
        submitBtn.disabled = false;
      });
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    initScrollReveal();
    initCounters();
    initJourneyPath();
    initMobileMenu();
    initSmoothScroll();
    initActiveNav();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
