(function () {
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (reduce || !("IntersectionObserver" in window)) {
    nodes.forEach(function (n) { n.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    nodes.forEach(function (n) { io.observe(n); });
  }

  var journey = document.querySelector(".journey");
  var video = document.querySelector(".stage__video");
  var bar = document.querySelector(".stage__progress");
  if (!journey || !video) return;

  function progress() {
    var r = journey.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    if (total <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / total));
  }

  function setBar() { if (bar) bar.style.setProperty("--p", progress().toFixed(4)); }
  window.addEventListener("scroll", setBar, { passive: true });
  setBar();
  if (reduce) return;

  var mobile = window.matchMedia("(max-width: 860px), (hover: none) and (pointer: coarse)").matches;
  var src = mobile ? video.dataset.mobile : video.dataset.desktop;
  var current = 0, ready = false;

  function start() {
    ready = true;
    video.classList.add("is-ready");
    requestAnimationFrame(tick);
  }

  function tick() {
    var d = video.duration || 0;
    if (d) {
      var target = progress() * (d - 0.05);
      current += (target - current) * 0.18;
      if (Math.abs(target - current) < 0.002) current = target;
      if (Math.abs(video.currentTime - current) > 0.01 && !video.seeking) {
        video.currentTime = current;
      }
    }
    requestAnimationFrame(tick);
  }

  fetch(src).then(function (res) { return res.blob(); }).then(function (blob) {
    video.src = URL.createObjectURL(blob);
    video.addEventListener("loadeddata", function () {
      video.pause();
      if (!ready) start();
    }, { once: true });
    video.load();
  }).catch(function () {
    video.src = src;
    video.preload = "auto";
    video.addEventListener("loadeddata", function () { if (!ready) start(); }, { once: true });
  });

  window.addEventListener("touchstart", function prime() {
    var p = video.play();
    if (p && p.then) p.then(function () { video.pause(); }).catch(function () {});
  }, { once: true, passive: true });
})();
