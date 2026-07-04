/**
 * Auxova Foundation — Main JavaScript
 * Handles: scroll reveals, counter animations, journey SVG path draw,
 * mobile menu toggle, smooth scroll, hover effects.
 */

(function () {
  'use strict';

  /* ============================================================
     UTILITIES
     ============================================================ */

  /**
   * Easing: easeOutCubic
   * @param {number} t - progress 0..1
   * @returns {number}
   */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Easing: easeInOutQuad
   * @param {number} t - progress 0..1
   * @returns {number}
   */
  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /**
   * Run a tween for `duration` ms, calling `onFrame` with eased progress.
   * @param {number} duration - milliseconds
   * @param {function} onFrame - called with t (0..1, eased)
   * @param {function} [easeFn] - easing function, defaults to easeOutCubic
   */
  function tween(duration, onFrame, easeFn) {
    var ease = easeFn || easeOutCubic;
    var start = null;

    function step(ts) {
      if (!start) start = ts;
      var raw = Math.min(1, (ts - start) / duration);
      var t = ease(raw);
      onFrame(t, raw);
      if (raw < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  /**
   * Observe an element once, then disconnect.
   * @param {Element} el
   * @param {function} callback
   * @param {IntersectionObserverInit} [opts]
   */
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
     Elements with [data-reveal] start invisible and slide up.
     The attribute value is the delay in ms.
     ============================================================ */
  function initScrollReveal() {
    var els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;

    // Set initial invisible state
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
     Animates stat numbers when the stats section enters view.
     ============================================================ */
  function initCounters() {
    var statsSection = document.getElementById('ax-stats');
    if (!statsSection) return;

    var el17 = document.getElementById('counter-17');
    var el63 = document.getElementById('counter-63');

    if (!el17 && !el63) return;

    var done = false;

    observeOnce(statsSection, function () {
      if (done) return;
      done = true;

      tween(1700, function (t) {
        if (el17) el17.textContent = String(Math.round(17 * t));
        if (el63) el63.textContent = String(Math.round(63 * t));
      }, easeOutCubic);
    }, { threshold: 0.35 });
  }

  /* ============================================================
     3. JOURNEY PATH DRAW
     Animates the SVG stroke-dashoffset from 1→0 and moves
     a traveling dot along the path.
     ============================================================ */
  function initJourneyPath() {
    var journeySection = document.getElementById('ax-journey');
    var animatedPath = document.getElementById('ax-journey-path');
    var travelingDot = document.getElementById('ax-journey-dot');

    if (!journeySection || !animatedPath) return;

    var done = false;

    observeOnce(journeySection, function () {
      if (done) return;
      done = true;

      var pathLen = animatedPath.getTotalLength();

      // Show the traveling dot
      if (travelingDot) {
        travelingDot.style.display = 'block';
      }

      tween(2800, function (t) {
        var eased = easeInOutQuad(t);

        // Draw the path
        animatedPath.style.strokeDashoffset = String(1 - eased);

        // Move the dot along the path
        if (travelingDot && pathLen) {
          var pt = animatedPath.getPointAtLength(pathLen * eased);
          travelingDot.setAttribute('cx', String(pt.x));
          travelingDot.setAttribute('cy', String(pt.y));
        }

        // At the end, hide the dot (it reached the last node)
        if (t >= 1 && travelingDot) {
          // Keep dot at final position
        }
      }, function (t) { return t; }); // raw linear progress fed into easeInOutQuad inside frame
    }, { threshold: 0.35 });
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

    // Close menu when a link is clicked
    var menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        hamburger.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu on outside click
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
     Handles anchor links — offsets for fixed nav height.
     ============================================================ */
  function initSmoothScroll() {
    var NAV_HEIGHT = 80; // px offset for fixed nav

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
     6. JOURNEY PATH RE-INIT (fix: call with correct easing)
     ============================================================ */
  function initJourneyPathFixed() {
    var journeySection = document.getElementById('ax-journey');
    var animatedPath = document.getElementById('ax-journey-path');
    var travelingDot = document.getElementById('ax-journey-dot');

    if (!journeySection || !animatedPath) return;

    var done = false;
    var pathLen;

    // Wait for layout to calculate total length
    requestAnimationFrame(function () {
      try {
        pathLen = animatedPath.getTotalLength();
      } catch (e) {
        pathLen = 0;
      }
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !done) {
          done = true;
          io.disconnect();

          if (!pathLen) {
            try { pathLen = animatedPath.getTotalLength(); } catch (e) { pathLen = 0; }
          }

          if (travelingDot) {
            travelingDot.style.display = 'block';
          }

          var startTime = null;
          var DURATION = 2800;

          function frame(ts) {
            if (!startTime) startTime = ts;
            var raw = Math.min(1, (ts - startTime) / DURATION);
            var eased = easeInOutQuad(raw);

            // Animate stroke-dashoffset from 1 to 0
            animatedPath.style.strokeDashoffset = String(1 - eased);

            // Move dot
            if (travelingDot && pathLen > 0) {
              try {
                var pt = animatedPath.getPointAtLength(pathLen * eased);
                travelingDot.setAttribute('cx', String(pt.x));
                travelingDot.setAttribute('cy', String(pt.y));
              } catch (err) { /* noop */ }
            }

            if (raw < 1) {
              requestAnimationFrame(frame);
            }
          }

          requestAnimationFrame(frame);
        }
      });
    }, { threshold: 0.35 });

    io.observe(journeySection);
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    initScrollReveal();
    initCounters();
    initJourneyPathFixed();
    initMobileMenu();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
