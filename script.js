/* EdgeLine Academy — лендінг курсу */
(() => {
  "use strict";

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const y = $(".js-year");
  if (y) y.textContent = new Date().getFullYear();

  // ---------- заголовок: вписати найдовший рядок у ширину екрана ----------
  const slice = $(".slice");
  const sliceLines = $$(".slice__layer--top > span", slice);
  const SHIFT_EM = 0.14; // запас під зсув нижньої половини після розрізу
  function fitHero() {
    slice.style.fontSize = "";
    const fs = parseFloat(getComputedStyle(slice).fontSize);
    const avail = slice.clientWidth;
    const widest = Math.max(...sliceLines.map((s) => s.getBoundingClientRect().width));
    const need = widest + fs * SHIFT_EM;
    if (need > avail) slice.style.fontSize = Math.floor(fs * (avail / need) * 10) / 10 + "px";
  }
  fitHero();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);
  let fitTimer;
  window.addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitHero, 100); });

  // ---------- розріз заголовка ----------
  requestAnimationFrame(() => document.body.classList.add("is-loaded"));

  // ---------- лінія «ріжемо тут» ----------
  const rail = $(".cutrail");
  const railDone = $(".cutrail__done");
  const scissors = $(".cutrail__scissors");
  let cutTimer;

  // ---------- транспортир ----------
  const CX = 200, CY = 210, R = 180;
  const pt = (deg, r = R) => {
    const t = (deg * Math.PI) / 180;
    return [CX - r * Math.cos(t), CY - r * Math.sin(t)];
  };
  const ticks = $(".dial__ticks");
  const NS = "http://www.w3.org/2000/svg";
  for (let d = 0; d <= 180; d += 5) {
    const major = d % 45 === 0;
    const mid = d % 15 === 0;
    const [x1, y1] = pt(d, R);
    const [x2, y2] = pt(d, major ? R - 22 : mid ? R - 14 : R - 8);
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", x1); l.setAttribute("y1", y1);
    l.setAttribute("x2", x2); l.setAttribute("y2", y2);
    if (major || mid) l.classList.add("major");
    ticks.appendChild(l);
    if (major) {
      const [tx, ty] = pt(d, R + 16);
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", tx); t.setAttribute("y", ty + 4);
      t.setAttribute("text-anchor", d === 0 ? "end" : d === 180 ? "start" : "middle");
      t.textContent = d + "°";
      ticks.appendChild(t);
    }
  }
  const strand = $(".dial__strand");
  const arc = $(".dial__arc");
  const degOut = $(".dial__deg");
  let curDeg = 0, targetDeg = 0, dialRaf = null;

  const drawDial = (deg) => {
    const [x, y] = pt(deg, R - 4);
    strand.setAttribute("x2", x); strand.setAttribute("y2", y);
    if (deg < 0.5) { arc.setAttribute("d", ""); }
    else {
      const [sx, sy] = pt(0, R + 4);
      const [ex, ey] = pt(deg, R + 4);
      arc.setAttribute("d", `M ${sx} ${sy} A ${R + 4} ${R + 4} 0 0 1 ${ex} ${ey}`);
    }
    degOut.textContent = Math.round(deg);
  };
  const tweenDial = () => {
    curDeg += (targetDeg - curDeg) * 0.14;
    if (Math.abs(targetDeg - curDeg) < 0.3) curDeg = targetDeg;
    drawDial(curDeg);
    dialRaf = curDeg === targetDeg ? null : requestAnimationFrame(tweenDial);
  };
  const setDial = (deg) => {
    targetDeg = deg;
    if (reduced) { curDeg = deg; drawDial(deg); return; }
    if (!dialRaf) dialRaf = requestAnimationFrame(tweenDial);
  };
  drawDial(0);

  const moves = $$(".moves li");
  let hoverLock = false;
  if (window.matchMedia("(hover: hover)").matches) {
    moves.forEach((li) => {
      li.addEventListener("mouseenter", () => { hoverLock = true; activate(li); });
      li.addEventListener("mouseleave", () => { hoverLock = false; onScroll(); });
    });
  }
  function activate(li) {
    moves.forEach((m) => m.classList.toggle("is-on", m === li));
    setDial(Number(li.dataset.deg));
  }

  // ---------- градація ----------
  const layers = $$(".layers li");
  layers.forEach((li, i) => li.style.setProperty("--i", i));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  layers.forEach((li, i) => { li.style.transitionDelay = (i % 3) * 80 + "ms"; io.observe(li); });

  // ---------- сантиметрова стрічка ----------
  const MAX_MONTHS = 15;
  const tapeIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const plan = e.target.closest(".plan");
      const m = Number(plan.dataset.months);
      $(".tape__fill", plan).style.width = (m / MAX_MONTHS) * 100 + "%";
      tapeIO.unobserve(e.target);
    });
  }, { threshold: 0.6 });
  $$(".tape").forEach((t) => tapeIO.observe(t));

  // ---------- пакети на телефоні: вкладки + гортання ----------
  const grid = $(".plans__grid");
  const tabs = $$(".plans__tabs a");
  const planEls = $$(".plan", grid);
  const setTab = (i) => tabs.forEach((t, k) => t.classList.toggle("is-on", k === i));
  tabs.forEach((t, i) => t.addEventListener("click", (e) => {
    if (grid.scrollWidth <= grid.clientWidth) return; // десктоп: звичайний якір
    e.preventDefault();
    grid.scrollTo({ left: planEls[i].offsetLeft - grid.offsetLeft - parseFloat(getComputedStyle(grid).paddingLeft), behavior: reduced ? "auto" : "smooth" });
    setTab(i);
  }));
  grid.addEventListener("scroll", () => {
    const x = grid.scrollLeft + grid.clientWidth * 1;
    let idx = 0;
    planEls.forEach((p, i) => { if (p.offsetLeft - grid.offsetLeft <= x) idx = i; });
    setTab(idx);
  }, { passive: true });

  // ---------- нижня панель: між hero і пакетами ----------
  const dock = $(".dock");
  const heroCta = $(".hero__cta");
  const plansSec = $("#plans");
  const finale = $(".finale");

  // ---------- девіз: слова загоряються під час скролу ----------
  const motto = $(".js-words");
  const GOLD = ["прогнозувати", "результат,", "керувати", "формою"];
  const words = motto.textContent.trim().split(/\s+/);
  motto.setAttribute("aria-label", motto.textContent.trim());
  motto.innerHTML = words
    .map((w) => `<span class="w${GOLD.includes(w) ? " gold" : ""}" aria-hidden="true">${w}</span>`)
    .join(" ");
  const wordEls = $$(".w", motto);

  // ---------- головний обробник скролу ----------
  let ticking = false;
  function onScroll() {
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;

    if (rail && getComputedStyle(rail).display !== "none") {
      const px = p * (vh - 28);
      railDone.style.height = px + 14 + "px";
      scissors.style.top = px + "px";
      rail.classList.add("is-cutting");
      clearTimeout(cutTimer);
      cutTimer = setTimeout(() => rail.classList.remove("is-cutting"), 140);
    }

    if (!hoverLock) {
      const mid = vh * 0.55;
      let best = moves[0], bestD = Infinity;
      moves.forEach((li) => {
        const r = li.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = li; }
      });
      if (!best.classList.contains("is-on")) activate(best);
    }

    const mr = motto.getBoundingClientRect();
    const mp = clamp((vh * 0.85 - mr.top) / (mr.height + vh * 0.35), 0, 1);
    const lit = Math.round(mp * wordEls.length);
    wordEls.forEach((w, i) => {
      const on = reduced || i < lit;
      w.classList.toggle("is-lit", on && !w.classList.contains("gold"));
      w.classList.toggle("is-gold", on && w.classList.contains("gold"));
    });

    if (dock) {
      const pastHero = heroCta.getBoundingClientRect().bottom < 0;
      const pr = plansSec.getBoundingClientRect();
      const inPlans = pr.top < vh && pr.bottom > 0;
      const atEnd = finale.getBoundingClientRect().top < vh;
      dock.classList.toggle("is-on", pastHero && !inPlans && !atEnd);
    }

    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();
