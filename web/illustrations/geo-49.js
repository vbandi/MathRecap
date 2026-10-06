import { button, card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const SPHERE_RADIUS = 5;
const EARTH_RADIUS_KM = 6371;
const DEGREES = Math.PI / 180;

export function sectionRadius(radius, distance) { return Math.sqrt(Math.max(0, radius * radius - distance * distance)); }

// Orthographic view of a point on the globe (latitude/longitude in degrees) seen from longitude `centerLon`, tilted `tilt` radians.
export function globePoint(latitude, longitude, centerLon, tilt) {
  const phi = latitude * DEGREES, lambda = (longitude - centerLon) * DEGREES;
  const x = Math.cos(phi) * Math.sin(lambda), y = Math.sin(phi), z = Math.cos(phi) * Math.cos(lambda);
  return { x, y: y * Math.cos(tilt) - z * Math.sin(tilt), depth: z * Math.cos(tilt) + y * Math.sin(tilt) };
}

export function mount(root) {
  const state = { distance: 3, latitude: 47, longitude: 19, viewLon: 19 };

  root.append(lead("Ha egy gömböt síkkal elvágunk, a vágás helyén mindig kör keletkezik. Minél távolabb van a sík a gömb közepétől, annál kisebb ez a kör. A Földön ugyanez a helyzet: a szélességi körök a gömböt vágó síkok nyomai, a hosszúsági körök pedig a pólusokon átmenő főkörök."));

  // --- Cutting a sphere ---
  const cut = card("Gömb elmetszése síkkal");
  const distance = range({ label: "a sík távolsága a középponttól (d)", min: 0, max: SPHERE_RADIUS, step: 0.5, value: state.distance, onInput: (value) => { state.distance = value; renderCut(); } });
  const cutFigure = svg("svg", { class: "il-svg", viewBox: "0 0 620 300", role: "img", "aria-label": "Síkkal elmetszett gömb és oldalnézete" });
  const cutFormula = make("div", "il-formula start");
  cut.append(controls(distance.element), cutFigure, cutFormula);

  // --- Globe ---
  const earth = card("A Föld mint gömb: szélesség és hosszúság");
  const latitude = range({ label: "szélesség", min: -90, max: 90, value: state.latitude, format: (v) => `${formatNumber(Math.abs(v))}° ${v >= 0 ? "É" : "D"}`, onInput: (value) => { state.latitude = value; renderGlobe(); } });
  const longitude = range({ label: "hosszúság", min: -180, max: 180, value: state.longitude, format: (v) => `${formatNumber(Math.abs(v))}° ${v >= 0 ? "K" : "Ny"}`, onInput: (value) => { state.longitude = value; state.viewLon = value; renderGlobe(); } });
  const globeFigure = svg("svg", { class: "il-svg", viewBox: "0 0 620 330", role: "img", "aria-label": "Földgömb szélességi és hosszúsági körökkel" });
  const globeFormula = make("div", "il-formula start");
  earth.append(controls(latitude.element, longitude.element, button("Budapest (kb.)", () => { state.latitude = 47; state.longitude = 19; state.viewLon = 19; latitude.set(47); longitude.set(19); renderGlobe(); }, { ghost: true })), globeFigure, globeFormula);
  root.append(cut, earth, keyIdea("ha a sík d távolságra van a gömb közepétől, a metszetkör sugara r = √(R² − d²): ez egy derékszögű háromszög, amelynek átfogója R. A legnagyobb kör (főkör) akkor jön ki, ha a sík átmegy a középponton."));

  function renderCut() {
    const d = state.distance, R = SPHERE_RADIUS, r = sectionRadius(R, d), s = 22, pitch = 0.42;
    cutFigure.replaceChildren();
    const cx = 170, cy = 150, R2 = R * s;
    svg("circle", { cx, cy, r: R2, style: "fill:var(--fg-soft);fill-opacity:.08;stroke:var(--fg);stroke-width:2" }, cutFigure);
    svg("ellipse", { cx, cy, rx: R2, ry: R2 * Math.sin(pitch), style: "fill:none;stroke:var(--dim);stroke-dasharray:5 4" }, cutFigure);
    const planeY = cy - d * s * Math.cos(pitch);
    svg("ellipse", { cx, cy: planeY, rx: r * s, ry: r * s * Math.sin(pitch), style: `fill:${PALETTE.amber};fill-opacity:.55;stroke:${PALETTE.amber};stroke-width:3` }, cutFigure);
    svg("line", { x1: cx, y1: cy, x2: cx, y2: planeY, style: `stroke:${PALETTE.blue};stroke-width:3` }, cutFigure);
    svg("circle", { cx, cy, r: 4, style: "fill:var(--fg)" }, cutFigure);
    svg("text", { x: cx - 10, y: cy + 16, text: "O", "text-anchor": "end", style: "font-style:italic" }, cutFigure);

    // Side view: the same cut as a right triangle with legs d and r and hypotenuse R.
    const sx = 450, sy = 150;
    svg("circle", { cx: sx, cy: sy, r: R2, style: "fill:none;stroke:var(--fg);stroke-width:2" }, cutFigure);
    svg("line", { x1: sx - r * s, y1: sy - d * s, x2: sx + r * s, y2: sy - d * s, style: `stroke:${PALETTE.amber};stroke-width:4;stroke-linecap:round` }, cutFigure);
    svg("polygon", { points: `${sx},${sy} ${sx},${sy - d * s} ${sx + r * s},${sy - d * s}`, style: "fill:var(--fg-soft);fill-opacity:.15;stroke:var(--fg);stroke-width:2;stroke-linejoin:round" }, cutFigure);
    svg("line", { x1: sx, y1: sy, x2: sx + r * s, y2: sy - d * s, style: `stroke:${PALETTE.pink};stroke-width:3` }, cutFigure);
    const label = (x, y, text, color, anchor = "middle") => svg("text", { x, y, text, "text-anchor": anchor, style: `fill:${color};font-weight:700;font-size:15px` }, cutFigure);
    label(sx + r * s / 2, sy - d * s - 10, "r", PALETTE.amber);
    if (d > 0) label(sx - 8, sy - d * s / 2 + 5, "d", PALETTE.blue, "end");
    label(sx + r * s / 2 + (d > 0 ? 12 : 0), sy - d * s / 2 + (d > 0 ? 18 : 18), "R", PALETTE.pink, "start");
    svg("text", { x: cx, y: 290, text: "térbeli kép", "text-anchor": "middle", style: "fill:var(--dim)" }, cutFigure);
    svg("text", { x: sx, y: 290, text: "oldalnézet (átmetszet)", "text-anchor": "middle", style: "fill:var(--dim)" }, cutFigure);

    const rText = Number.isInteger(r) ? String(r) : `√${R * R - d * d} ≈ ${formatNumber(r, 2)}`;
    cutFormula.replaceChildren(
      slot(`R = ${R},  d = ${formatNumber(d)}`, 16, { align: "left" }), make("br"),
      slot(`r = √(${R}² − ${formatNumber(d)}²) = √(${formatNumber(R * R - d * d, 2)})`, 28, { align: "left" }), " = ", slot(rText, 14, { align: "left" }), make("br"),
      slot(d === 0 ? "d = 0: a legnagyobb kör (főkör), r = R." : d === R ? "d = R: a sík csak érinti a gömböt, a metszet egyetlen pont." : `A metszetkör területe: ${formatNumber(Math.PI * r * r, 1)} (r² · π)`, 56, { align: "left" }),
    );
  }

  function renderGlobe() {
    const { latitude: lat, longitude: lon, viewLon } = state, tilt = 0.35, cx = 310, cy = 165, R = 140;
    globeFigure.replaceChildren();
    const toScreen = (p) => [cx + R * p.x, cy - R * p.y];
    svg("circle", { cx, cy, r: R, style: "fill:var(--fg-soft);fill-opacity:.08;stroke:var(--fg);stroke-width:2" }, globeFigure);
    // A curve is cut into runs of visible / hidden points so hidden parts can be dimmed.
    const curve = (points, style) => {
      let run = [], front = null;
      const flush = () => { if (run.length > 1) svg("polyline", { points: run.map(toScreen).map((q) => q.join(",")).join(" "), fill: "none", style: `${style};${front ? "" : "opacity:.18"}` }, globeFigure); };
      for (const p of points) {
        const isFront = p.depth >= 0;
        if (front !== null && isFront !== front) { flush(); run = run.slice(-1); }
        front = isFront; run.push(p);
      }
      flush();
    };
    const sample = (f) => Array.from({ length: 73 }, (_, i) => f(i * 5));
    for (let phi = -60; phi <= 60; phi += 30) curve(sample((t) => globePoint(phi, t - 180, viewLon, tilt)), `stroke:${phi === 0 ? "var(--fg)" : "var(--line-strong)"};stroke-width:${phi === 0 ? 2 : 1.3}`);
    const meridian = (lam, half) => sample((t) => (t <= 180 ? globePoint(t - 90, lam, viewLon, tilt) : globePoint(270 - t, lam + 180, viewLon, tilt))).slice(0, half ? 37 : 73);
    for (let lam = 0; lam < 180; lam += 30) curve(meridian(lam, false), `stroke:${lam === 0 ? "var(--fg)" : "var(--line-strong)"};stroke-width:${lam === 0 ? 2 : 1.3}`);
    // The chosen parallel and meridian, and the point.
    curve(sample((t) => globePoint(lat, t - 180, viewLon, tilt)), `stroke:${PALETTE.amber};stroke-width:3.5`);
    curve(meridian(lon, true), `stroke:${PALETTE.blue};stroke-width:3.5`);
    const p = globePoint(lat, lon, viewLon, tilt), [px, py] = toScreen(p);
    svg("circle", { cx: px, cy: py, r: 7, style: `fill:${PALETTE.red};stroke:var(--input);stroke-width:2.5;opacity:${p.depth >= 0 ? 1 : 0.3}` }, globeFigure);
    const north = toScreen(globePoint(90, 0, viewLon, tilt));
    svg("text", { x: north[0] + 8, y: north[1] - 4, text: "É", style: "font-weight:700" }, globeFigure);
    svg("text", { x: 20, y: 30, text: "szélességi kör (narancs)", style: `fill:${PALETTE.amber};font-weight:700` }, globeFigure);
    svg("text", { x: 20, y: 52, text: "hosszúsági kör (kék)", style: `fill:${PALETTE.blue};font-weight:700` }, globeFigure);

    const parallelRadius = EARTH_RADIUS_KM * Math.cos(lat * DEGREES);
    globeFormula.replaceChildren(
      slot(`A szélességi kör sugara: R · cos ${formatNumber(Math.abs(lat))}° ≈ ${formatNumber(Math.round(parallelRadius))} km`, 62, { align: "left" }), make("br"),
      slot(`a hossza: 2π · ${formatNumber(Math.round(parallelRadius))} ≈ ${formatNumber(Math.round(2 * Math.PI * parallelRadius))} km`, 62, { align: "left" }),
    );
  }

  const enableGlobeDrag = () => {
    let last = null;
    globeFigure.style.touchAction = "none"; globeFigure.style.cursor = "grab";
    globeFigure.addEventListener("pointerdown", (event) => { last = event.clientX; globeFigure.setPointerCapture(event.pointerId); });
    globeFigure.addEventListener("pointermove", (event) => { if (last === null) return; state.viewLon = ((state.viewLon - (event.clientX - last) * 0.5 + 540) % 360) - 180; last = event.clientX; renderGlobe(); });
    const end = () => { last = null; };
    globeFigure.addEventListener("pointerup", end); globeFigure.addEventListener("pointercancel", end);
  };
  enableGlobeDrag();
  renderCut();
  renderGlobe();
  return () => {};
}
