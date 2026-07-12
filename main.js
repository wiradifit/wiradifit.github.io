/* =========================================================
   Prawira Hadi Fitrajaya — Liquid Glass interactions
   Vanilla JS, no dependencies. GPU-friendly, HIG-accessible.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Scroll progress + nav auto-hide ---------- */
  var bar = document.getElementById("progressBar");
  var nav = document.getElementById("nav");
  var lastY = 0, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    if (y > lastY && y > 500) nav.classList.add("hide");
    else nav.classList.remove("hide");
    lastY = y; ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  function toggleMenu(open) {
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", function () { toggleMenu(!menu.classList.contains("open")); });
  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { toggleMenu(false); });
  });

  /* ---------- Count-up stats ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
    var start = performance.now(), dur = 1100;
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Liquid Glass: pointer-reactive specular sheen ----------
     Sets --mx / --my on the hovered glass element so the highlight
     tracks the cursor, mimicking light refracting through glass.
     Skipped on coarse pointers (no hover) and reduced motion.        */
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine && !reduceMotion) {
    var panels = document.querySelectorAll(".glass");
    panels.forEach(function (el) {
      var raf = null, mx = 50, my = 0;
      el.addEventListener("pointermove", function (ev) {
        var r = el.getBoundingClientRect();
        mx = ((ev.clientX - r.left) / r.width) * 100;
        my = ((ev.clientY - r.top) / r.height) * 100;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          el.style.setProperty("--mx", mx + "%");
          el.style.setProperty("--my", my + "%");
          raf = null;
        });
      }, { passive: true });
    });
  }
})();
