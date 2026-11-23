/* Animated graphics for the sound-effect pads.
   SFXFX.fire("boom") plays the graphic for that pad; SFXFX.stop() clears the screen.
   Everything is a sticker image or a word, moved only with transform + opacity (cheap for the streaming app to draw).
   The timings inside each effect are matched to where the hits land in that pad's sound. */
(function () {
  const IDS = ["fah", "airhorn", "boom", "bruh", "trombone", "crickets", "scratch", "rimshot", "explosion", "gunshots", "laugh", "applause", "oooh", "chaching", "buzzer", "siren"];
  const css = document.createElement("style");
  css.textContent = `
    #fx { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: 8; }
    #fx .fxs { position: absolute; inset: 0; }
    #fx .fxp { position: absolute; width: 0; height: 0; }
    #fx .fxc { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); }
    #fx .fxn { will-change: transform, opacity; }
    #fx img { display: block; width: 100%; height: auto; }
    #fx .fxw { font: 400 1em/1 Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif; white-space: nowrap; letter-spacing: .02em;
               -webkit-text-stroke: .11em #000; paint-order: stroke fill; text-shadow: .05em .07em 0 #000; }
    #fx .fxflash { position: absolute; inset: 0; opacity: 0; will-change: opacity; }
    #fx .fxring { border-radius: 50%; border: 1.5vmin solid #fff; box-sizing: border-box; }
    #fx .fxbit { border-radius: 22%; }
    #fx .fxbolt { height: 2.4vmin; border-radius: 1.2vmin; background: linear-gradient(90deg, rgba(57,255,106,0), #39ff6a 55%, #eafff0); }
    #fx .fxbeam { width: 260vmax; height: 70vmin; opacity: .6;
                  background: linear-gradient(90deg, rgba(255,40,40,0) 5%, rgba(255,40,40,.7) 30%, rgba(255,90,80,.85) 50%, rgba(255,40,40,.7) 70%, rgba(255,40,40,0) 95%);
                  clip-path: polygon(0 0, 50% 48%, 100% 0, 100% 100%, 50% 52%, 0 100%); }`;
  document.head.appendChild(css);
  const layer = document.createElement("div"); layer.id = "fx";
  (document.body || document.documentElement).appendChild(layer);
  [...IDS, "bill"].forEach(id => { new Image().src = "fx/" + id + ".webp"; });      // fetch the art up front

  const R = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const el = (cls, parent) => { const d = document.createElement("div"); d.className = cls; if (parent) parent.appendChild(d); return d; };
  /* animate: t0 and len in seconds */
  const A = (n, kf, t0, len, o) => n.animate(kf, Object.assign({ delay: t0 * 1000, duration: len * 1000, fill: "both", easing: "linear" }, o || {}));
  /* place a node with its centre at x%, y% of the screen; returns the node to animate */
  function put(s, x, y, rot) {
    const p = el("fxp", s); p.style.left = x + "%"; p.style.top = y + "%";
    const c = el("fxc", p); if (rot) c.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
    return el("fxn", c);
  }
  function stk(s, id, x, y, size, rot) { const n = put(s, x, y, rot); n.style.width = size + "vmin"; const i = new Image(); i.src = "fx/" + id + ".webp"; n.appendChild(i); return n; }
  function word(s, text, x, y, size, color, rot) { const n = put(s, x, y, rot); n.classList.add("fxw"); n.style.fontSize = size + "vmin"; n.style.color = color; n.textContent = text; return n; }
  function pop(n, t, o) {
    o = o || {}; const from = o.from ?? 0.3, over = o.over ?? (from < 1 ? 1.15 : 0.92), len = o.len ?? 0.22;
    return A(n, [{ opacity: 0, transform: `scale(${from})` }, { opacity: 1, transform: `scale(${over})`, offset: 0.6 }, { opacity: 1, transform: "scale(1)" }], t, len, { easing: "ease-out" });
  }
  const out = (n, t, len) => A(n, [{ opacity: 1 }, { opacity: 0 }], t, len ?? 0.25, { fill: "forwards" });
  const jolt = (n, t, amp, len) => A(n, [{ transform: "scale(1)" }, { transform: `scale(${1 + (amp ?? 0.12)})`, offset: 0.3 }, { transform: "scale(1)" }], t, len ?? 0.2, { composite: "add" });
  const pulse = (n, t, len, period, amp) => A(n, [{ transform: "scale(1)" }, { transform: `scale(${1 + amp})` }], t, period / 2, { composite: "add", iterations: Math.max(2, Math.round(len / (period / 2) / 2) * 2), direction: "alternate", easing: "ease-in-out" });
  function shake(n, t, len, amp, decay) {
    const steps = Math.max(4, Math.round(len / 0.045)), kf = [{ transform: "translate(0,0) rotate(0deg)" }];
    for (let i = 1; i < steps; i++) { const k = amp * (decay === false ? 1 : 1 - i / steps); kf.push({ transform: `translate(${R(-k, k).toFixed(2)}vmin, ${R(-k, k).toFixed(2)}vmin) rotate(${R(-k, k).toFixed(2)}deg)` }); }
    kf.push({ transform: "translate(0,0) rotate(0deg)" });
    return A(n, kf, t, len, { composite: "add" });
  }
  function flash(s, color, t, len, peak) { const f = el("fxflash", s); f.style.background = color; A(f, [{ opacity: 0 }, { opacity: peak ?? 0.7, offset: 0.15 }, { opacity: 0 }], t, len ?? 0.3); return f; }
  function ring(s, x, y, t, color, size, len) {
    const n = put(s, x, y); n.classList.add("fxring"); n.style.width = n.style.height = (size ?? 60) + "vmin"; n.style.borderColor = color;
    A(n, [{ opacity: 0, transform: "scale(.08)" }, { opacity: 1, transform: "scale(.12)", offset: 0.03 }, { opacity: 0, transform: "scale(1)" }], t, len ?? 0.5, { easing: "ease-out" }); return n;
  }
  /* bits flying out from a point (debris, sparks) */
  function bits(s, x, y, n, t, o) {
    for (let i = 0; i < n; i++) {
      const a = R(0, Math.PI * 2), d = o.dist * R(0.35, 1), z = R(1.2, 3.4), b = put(s, x, y);
      b.classList.add("fxbit"); b.style.width = b.style.height = z + "vmin"; b.style.background = pick(o.color);
      const end = `translate(${(Math.cos(a) * d).toFixed(1)}vmin, ${(Math.sin(a) * d + (o.fall ?? 14)).toFixed(1)}vmin) rotate(${R(-500, 500).toFixed(0)}deg) scale(.4)`;
      A(b, [{ opacity: 0, transform: "translate(0,0) rotate(0deg) scale(1)" }, { opacity: 1, transform: "translate(0,0) rotate(0deg) scale(1)", offset: 0.02 }, { opacity: 1, offset: 0.7 }, { opacity: 0, transform: end }], t, o.len * R(0.7, 1.1), { easing: "cubic-bezier(.1,.7,.3,1)" });
    }
  }
  /* stickers falling from the top of the screen to the bottom */
  function rain(s, id, n, t0, span, size) {
    for (let i = 0; i < n; i++) {
      const p = stk(s, id, R(4, 96), -14, R(size[0], size[1]), R(-30, 30)), sway = R(-10, 10);
      A(p, [{ opacity: 0, transform: "translate(0,0) rotate(0deg)" }, { opacity: 1, transform: "translate(0,0) rotate(0deg)", offset: 0.02 }, { opacity: 1, transform: `translate(${sway}vmin, 135vh) rotate(${R(-260, 260).toFixed(0)}deg)` }], t0 + R(0, span), R(1.2, 1.8), { easing: "cubic-bezier(.4,0,.8,.6)" });
    }
  }

  /* ---- one function per pad: builds its scene, returns how many seconds it stays up ---- */
  const FX = {
    fah(s) {
      flash(s, "#ff2a1a", 0.05, 0.4, 0.35);
      const f = stk(s, "fah", 50, 44, 58); pop(f, 0.05, { from: 2.6, len: 0.16 }); shake(f, 0.1, 1.7, 2.6);
      const w = word(s, "FAHHH!", 50, 83, 18, "#ff4b3a"); pop(w, 0.1); shake(w, 0.1, 1.5, 1.4);
      A(w, [{ transform: "scaleX(1)" }, { transform: "scaleX(1.4)" }], 0.3, 1.7, { composite: "add", easing: "ease-out" });
      return 2.5;
    },
    airhorn(s) {
      flash(s, "#fff", 0.16, 0.22, 0.3); flash(s, "#fff", 0.5, 0.22, 0.3);
      for (let t = 0.18; t < 1.85; t += 0.17) ring(s, 44, 38, t, "#fff", 95, 0.6);
      const h = stk(s, "airhorn", 30, 56, 48); pop(h, 0, { from: 0.2, len: 0.14 }); pulse(h, 0.16, 1.8, 0.11, 0.1); shake(h, 0.18, 1.8, 0.7, false);
      const w = word(s, "BRRRAAAP!", 60, 82, 14, "#ffd21a"); pop(w, 0.18); shake(w, 0.2, 1.75, 0.9, false);
      return 2.3;
    },
    boom(s) {
      flash(s, "#fff", 0.03, 0.45, 0.85);
      const b = stk(s, "boom", 50, 46, 82); pop(b, 0.04, { from: 0.15, over: 1.3, len: 0.2 });
      A(b, [{ transform: "scale(1) rotate(0deg)" }, { transform: "scale(1.2) rotate(7deg)" }], 0.25, 2.2, { composite: "add", easing: "ease-out" }); out(b, 1.7, 0.7);
      bits(s, 50, 46, 22, 0.05, { color: ["#ffb01a", "#ff5a1a", "#fff3a0", "#555"], dist: 75, len: 1.2 });
      const w = word(s, "BOOM!", 50, 47, 23, "#ff2a1a"); pop(w, 0.08, { from: 3, len: 0.18 }); shake(w, 0.1, 0.9, 2); out(w, 1.9, 0.5);
      shake(s, 0.05, 0.9, 2.2);
      return 2.6;
    },
    bruh(s) {
      const f = stk(s, "bruh", 50, 45, 50);
      A(f, [{ opacity: 0, transform: "translateY(60vmin)" }, { opacity: 1, transform: "translateY(0)" }], 0.05, 0.3, { easing: "cubic-bezier(.2,1.2,.3,1)" });
      A(f, [{ transform: "scale(1)" }, { transform: "scale(1.25)" }], 0.35, 2, { composite: "add" });
      const w = word(s, "BRUH.", 50, 85, 18, "#fff"); pop(w, 0.46, { from: 1.6, len: 0.14 });
      return 2.4;
    },
    trombone(s) {
      const t = stk(s, "trombone", 50, 32, 44); pop(t, 0.05);
      [0.3, 1.22, 2.04].forEach((at, i) => {                 // each "womp" knocks it down a step
        A(t, [{ transform: "translateY(0) rotate(0deg)" }, { transform: "translateY(5vmin) rotate(7deg)" }], at, 0.3, { composite: "add", easing: "ease-out" });
        const w = word(s, "WOMP", 28 + i * 21, 60 + i * 7, 11, "#ffd21a", -6 + i * 6); pop(w, at); out(w, 4.2, 0.4);
      });
      A(t, [{ transform: "translateY(0) rotate(0deg)" }, { transform: "translateY(95vmin) rotate(45deg)" }], 2.9, 1.9, { composite: "add", easing: "cubic-bezier(.6,0,.9,.5)" });
      const w = word(s, "WOOOOMP...", 50, 89, 13, "#ff8a1a"); pop(w, 2.9);
      A(w, [{ transform: "scaleX(1)" }, { transform: "scaleX(1.35)" }], 3, 1.7, { composite: "add", easing: "ease-out" });
      return 5;
    },
    crickets(s) {
      const say = word(s, "*crickets*", 50, 55, 7, "#7dffa6"); pop(say, 0.3);
      [0.5, 1.2, 1.9].forEach((t, i) => { const d = put(s, 43 + i * 7, 40); d.style.cssText = "width:4.5vmin;height:4.5vmin;border-radius:50%;background:#fff;border:.7vmin solid #000;box-sizing:border-box"; pop(d, t); });
      [[18, 80, 20, 1], [52, 86, 25, -1], [84, 78, 18, -1]].forEach(([x, y, z, dir], i) => {
        const c = stk(s, "crickets", x, y, z); if (dir < 0) c.firstChild.style.transform = "scaleX(-1)";
        pop(c, 0.05 + i * 0.25);
        for (let t = 0.7 + i * 0.37; t < 3.5; t += R(0.75, 1.15))
          A(c, [{ transform: "translate(0,0)" }, { transform: `translate(${dir * 3.5}vmin, -9vmin)`, offset: 0.5 }, { transform: `translate(${dir * 7}vmin, 0)` }], t, 0.38, { composite: "add" });
      });
      return 4;
    },
    scratch(s) {
      const r = stk(s, "scratch", 50, 44, 56); pop(r, 0, { from: 0.5, len: 0.12 });
      A(r, [{ transform: "rotate(0deg)" }, { transform: "rotate(260deg)", offset: 0.3 }, { transform: "rotate(120deg)", offset: 0.45 }, { transform: "rotate(300deg)", offset: 0.6 }, { transform: "rotate(60deg)", offset: 0.8 }, { transform: "rotate(95deg)" }], 0, 0.75, { composite: "add" });
      const w = word(s, "HOLD UP!", 50, 84, 18, "#39ff6a"); pop(w, 0.6, { from: 2.4, len: 0.14 }); shake(s, 0.6, 0.3, 1);
      return 2.2;
    },
    rimshot(s) {
      const d = stk(s, "rimshot", 50, 44, 52); pop(d, 0, { from: 0.5, len: 0.1 }); jolt(d, 0.12, 0.1); jolt(d, 0.27, 0.1); jolt(d, 0.62, 0.22, 0.3);
      ring(s, 62, 30, 0.62, "#ffd21a", 70, 0.6); flash(s, "#ffd21a", 0.62, 0.25, 0.25);
      pop(word(s, "BA-DUM", 36, 84, 14, "#fff", -4), 0.12); pop(word(s, "TSS!", 74, 82, 17, "#ffd21a", 5), 0.62, { from: 2.2, len: 0.14 });
      return 2.4;
    },
    explosion(s) {
      const bomb = stk(s, "explosion", 50, 44, 42); pop(bomb, 0, { from: 2.2, len: 0.08 }); out(bomb, 0.1, 0.05);
      flash(s, "#fff", 0.04, 0.4, 0.85);
      [[0.04, 50, 45, 84], [0.24, 24, 34, 46], [0.62, 76, 60, 52], [0.76, 32, 70, 42], [0.94, 72, 26, 48], [1.26, 50, 50, 64]].forEach(([t, x, y, z]) => {
        const b = stk(s, "boom", x, y, z, R(-30, 30)); pop(b, t, { from: 0.1, over: 1.25, len: 0.16 }); out(b, t + 0.35, 0.45);
        bits(s, x, y, 9, t, { color: ["#ffb01a", "#ff5a1a", "#fff3a0", "#555"], dist: 45, len: 0.9 });
        if (t > 0.1) flash(s, "#ffb01a", t, 0.2, 0.35);
      });
      const w = word(s, "KABOOM!", 50, 85, 18, "#ffb01a"); pop(w, 0.1, { from: 3, len: 0.16 });
      shake(s, 0.04, 1.6, 2.6);
      return 2.6;
    },
    gunshots(s) {
      const g = stk(s, "gunshots", 19, 62, 36); pop(g, 0, { from: 0.4, len: 0.08 });
      [0.05, 0.28, 0.42, 0.56, 0.7, 0.84, 1.0, 1.15].forEach(t => {
        A(g, [{ transform: "translate(0,0) rotate(0deg)" }, { transform: "translate(-3vmin, -1vmin) rotate(-9deg)", offset: 0.3 }, { transform: "translate(0,0) rotate(0deg)" }], t, 0.13, { composite: "add" });
        const p = el("fxp", s); p.style.left = "33%"; p.style.top = "56%"; p.style.transform = `rotate(${R(-16, 9).toFixed(1)}deg)`;
        const d = R(70, 120), c = el("fxc", p), bolt = el("fxn fxbolt", c); bolt.style.width = "34vmin";
        A(bolt, [{ opacity: 0, transform: "translateX(0)" }, { opacity: 1, transform: "translateX(6vmin)", offset: 0.05 }, { opacity: 1, transform: `translateX(${d}vmin)` }], t, 0.13); out(bolt, t + 0.13, 0.03);
        const hit = el("fxn fxring", el("fxc", p)); hit.style.width = hit.style.height = "26vmin"; hit.style.borderColor = "#39ff6a";
        A(hit, [{ opacity: 0, transform: `translateX(${d + 14}vmin) scale(.1)` }, { opacity: 1, transform: `translateX(${d + 14}vmin) scale(.15)`, offset: 0.03 }, { opacity: 0, transform: `translateX(${d + 14}vmin) scale(1)` }], t + 0.12, 0.35, { easing: "ease-out" });
        flash(s, "#39ff6a", t, 0.09, 0.16);
      });
      const w = word(s, "SHOTS FIRED!", 56, 86, 13, "#39ff6a"); pop(w, 0.28); shake(w, 0.3, 0.9, 0.8, false);
      return 2.3;
    },
    laugh(s) {
      const f = stk(s, "laugh", 50, 46, 52); pop(f, 0.1);
      A(f, [{ transform: "rotate(-9deg) translateY(0)" }, { transform: "rotate(9deg) translateY(-3vmin)" }], 0.3, 0.16, { composite: "add", iterations: 18, direction: "alternate", easing: "ease-in-out" });
      [0.32, 0.5, 0.66, 0.86, 1.1, 1.32, 1.52, 1.8, 2.1, 2.4].forEach((t, i) => {
        const left = i % 2 === 0, w = word(s, pick(["HA", "HA", "HAHA", "LOL"]), left ? R(10, 30) : R(70, 90), R(16, 84), R(8, 13), pick(["#ffd21a", "#fff", "#39ff6a"]), R(-22, 22));
        pop(w, t, { len: 0.16 }); out(w, t + 0.75, 0.25);
      });
      return 3.4;
    },
    applause(s) {
      for (let i = 0; i < 22; i++) {
        const h = stk(s, "applause", R(5, 95), 112, R(9, 17), R(-25, 25));
        A(h, [{ opacity: 0, transform: "translateY(0)" }, { opacity: 1, transform: "translateY(-6vh)", offset: 0.05 }, { opacity: 1, offset: 0.75 }, { opacity: 0, transform: `translateY(-${R(60, 125).toFixed(0)}vh)` }], R(0, 2.5), R(1.2, 1.9), { easing: "ease-out" });
      }
      const h = stk(s, "applause", 50, 44, 48); pop(h, 0.03); pulse(h, 0.12, 3.5, 0.15, 0.09);
      const w = word(s, "BRAVO!", 50, 85, 17, "#ffd21a"); pop(w, 0.36); pulse(w, 0.6, 3, 0.45, 0.06);
      return 4;
    },
    oooh(s) {
      const f = stk(s, "oooh", 50, 45, 50);
      A(f, [{ opacity: 0, transform: "scale(.2)" }, { opacity: 1, transform: "scale(.7)", offset: 0.25 }, { opacity: 1, transform: "scale(1.22)" }], 0.1, 0.7, { easing: "ease-out" });
      A(f, [{ transform: "rotate(-5deg)" }, { transform: "rotate(5deg)" }], 0.3, 0.2, { composite: "add", iterations: 10, direction: "alternate", easing: "ease-in-out" });
      const w = word(s, "OOOOOH!", 50, 86, 16, "#ffd21a"); pop(w, 0.26);
      A(w, [{ transform: "scaleX(1)" }, { transform: "scaleX(1.4)" }], 0.4, 1.5, { composite: "add", easing: "ease-out" });
      return 2.5;
    },
    chaching(s) {
      rain(s, "bill", 26, 0.2, 1.7, [9, 16]);
      flash(s, "#ffd21a", 1.4, 0.35, 0.3); ring(s, 50, 46, 1.4, "#ffd21a", 110, 0.6);
      const b = stk(s, "chaching", 50, 46, 46); pop(b, 0.14); jolt(b, 0.36, 0.12); jolt(b, 0.88, 0.1); jolt(b, 1.4, 0.3, 0.3);
      const w = word(s, "CHA-CHING!", 50, 85, 15, "#39ff6a"); pop(w, 1.4, { from: 2.2, len: 0.15 });
      return 3.6;
    },
    buzzer(s) {
      [0, 0.6, 1.2].forEach((t, i) => flash(s, "#ff1a1a", t, 0.5, i ? 0.3 : 0.45));
      const x = stk(s, "buzzer", 50, 44, 56); pop(x, 0.02, { from: 3, len: 0.14 }); shake(x, 0.1, 1.7, 1, false);
      const w = word(s, "WRONG!", 50, 85, 18, "#ff3b2a"); pop(w, 0.1);
      return 2.2;
    },
    siren(s) {
      const tint = el("fxflash", s); tint.style.background = "#ff1a1a";
      A(tint, [{ opacity: 0.08 }, { opacity: 0.32 }], 0.1, 0.28, { iterations: 11, direction: "alternate", fill: "none" });
      const beam = put(s, 50, 18); beam.classList.add("fxbeam");
      A(beam, [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], 0, 1.1, { iterations: 4, fill: "none" }); out(beam, 3.1, 0.3);
      const b = stk(s, "siren", 50, 18, 30); pop(b, 0, { len: 0.14 }); pulse(b, 0.15, 3.1, 0.28, 0.1);
      const w = word(s, "ALERT!", 50, 62, 23, "#ff2a1a"); pop(w, 0.16, { from: 2.4, len: 0.14 });
      A(w, [{ opacity: 1 }, { opacity: 0.15 }], 0.4, 0.28, { iterations: 10, direction: "alternate", fill: "none", easing: "steps(1, end)" });
      return 3.4;
    },
  };

  const live = [];                                            // scenes on screen right now
  function drop(sc) { clearTimeout(sc.timer); sc.node.remove(); const i = live.indexOf(sc); if (i >= 0) live.splice(i, 1); }
  function fire(id) {
    if (!FX[id]) return false;
    live.filter(x => x.id === id).forEach(drop);              // pressing the same pad again restarts it
    while (live.length >= 3) drop(live[0]);                   // never pile up more than three at once
    const node = el("fxs", layer), sc = { id, node };
    let dur = 2.5;
    try { dur = FX[id](node) || dur; } catch (e) { node.remove(); return false; }
    A(node, [{ opacity: 1 }, { opacity: 0 }], dur - 0.25, 0.25, { fill: "forwards" });
    sc.timer = setTimeout(() => drop(sc), dur * 1000 + 50);
    live.push(sc); return true;
  }
  window.SFXFX = { fire, stop: () => [...live].forEach(drop), ids: IDS };
})();
