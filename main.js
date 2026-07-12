/* =========================================================
   Prawira Hadi Fitrajaya — Portfolio interactions
   Vanilla JS. No dependencies. GPU-friendly, reduced-motion aware.
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Scroll reveal via IntersectionObserver ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Scroll progress + nav hide on scroll-down ---------- */
  var bar = document.getElementById("progressBar");
  var nav = document.getElementById("nav");
  var lastY = 0, ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";

    if (y > lastY && y > 500) nav.classList.add("hide");
    else nav.classList.remove("hide");
    lastY = y;
    ticking = false;
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
  burger.addEventListener("click", function () {
    toggleMenu(!menu.classList.contains("open"));
  });
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

  /* ---------- Hero animated price chart (Canvas 2D) ---------- */
  var canvas = document.getElementById("chart");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, points = [], t = 0;
    var N = 120;               // candles/points
    var rafId;

    function seed() {
      points = [];
      var v = 0.5;
      for (var i = 0; i < N; i++) {
        v += (Math.random() - 0.48) * 0.05;
        v = Math.max(0.12, Math.min(0.88, v));
        points.push(v);
      }
    }

    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // subtle grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (var gy = 0; gy < H; gy += 60) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      var step = W / (N - 1);
      // wave-modulated line so it feels alive
      function yAt(i) {
        var base = points[i];
        var wobble = Math.sin(i * 0.18 + t) * 0.015;
        return H - (base + wobble) * H * 0.9 - H * 0.05;
      }

      // area fill
      var grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "rgba(52,245,197,0.16)");
      grad.addColorStop(1, "rgba(52,245,197,0)");
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (var i = 0; i < N; i++) ctx.lineTo(i * step, yAt(i));
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // line
      ctx.beginPath();
      for (var j = 0; j < N; j++) {
        var x = j * step, y = yAt(j);
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(52,245,197,0.9)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(52,245,197,0.6)";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // leading dot
      var lx = (N - 1) * step, ly = yAt(N - 1);
      ctx.beginPath();
      ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#7ff8d8";
      ctx.fill();

      t += 0.02;
      // occasionally nudge the series so it drifts
      if (Math.random() < 0.04) {
        points.shift();
        var last = points[points.length - 1];
        var nv = Math.max(0.12, Math.min(0.88, last + (Math.random() - 0.48) * 0.08));
        points.push(nv);
      }
      rafId = requestAnimationFrame(draw);
    }

    seed(); resize(); draw();
    window.addEventListener("resize", resize);

    // Pause when tab hidden (perf)
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(rafId); }
      else { rafId = requestAnimationFrame(draw); }
    });
  }
})();
