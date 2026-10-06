import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const SOLIDS = ["henger", "kúp", "gömb", "csonkakúp"];

// Volume and surface area for each solid; r = base radius, m = height, r2 = top radius of the frustum.
export function measures(solid, r, m, r2) {
  const slant = solid === "csonkakúp" ? Math.hypot(r - r2, m) : Math.hypot(r, m);
  switch (solid) {
    case "henger": return { volume: Math.PI * r * r * m, area: 2 * Math.PI * r * (r + m), slant };
    case "kúp": return { volume: (Math.PI * r * r * m) / 3, area: Math.PI * r * (r + slant), slant };
    case "gömb": return { volume: (4 * Math.PI * r ** 3) / 3, area: 4 * Math.PI * r * r, slant };
    default: return { volume: (Math.PI * m * (r * r + r * r2 + r2 * r2)) / 3, area: Math.PI * (r * r + r2 * r2 + (r + r2) * slant), slant };
  }
}

export function mount(root) {
  const scope = createScope();
  const state = { solid: "henger", r: 3, m: 4, r2: 2, radius: 3, pour: 0 };

  root.append(lead("A henger, a kúp, a csonkakúp és a gömb felszínére és térfogatára is van egy-egy képlet. Itt nem csak kiszámolhatod őket: két látványos összehasonlítás azt is megmutatja, honnan jönnek a kúp és a gömb térfogatában szereplő törtek."));

  // --- Formulas ---
  const main = card("Válassz testet, és állítsd be a méreteit");
  const solidButtons = SOLIDS.map((name) => toggle(name, name === state.solid, () => { state.solid = name; renderSolid(); }));
  const rSlider = range({ label: "sugár (r)", min: 1, max: 5, value: state.r, onInput: (value) => { state.r = value; renderSolid(); } });
  const mSlider = range({ label: "magasság (m)", min: 1, max: 6, value: state.m, onInput: (value) => { state.m = value; renderSolid(); } });
  const r2Slider = range({ label: "felső sugár", min: 1, max: 5, value: state.r2, onInput: (value) => { state.r2 = value; renderSolid(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 270", role: "img", "aria-label": "A kiválasztott test oldalnézetben" });
  const formulas = make("div", "il-formula start");
  main.append(controls(...solidButtons), controls(rSlider.element, mSlider.element, r2Slider.element), figure, formulas);

  // --- Comparisons ---
  const compare = card("Összehasonlítások");
  const pourFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 250", role: "img", "aria-label": "Három kúpnyi víz megtölt egy hengert" });
  const pourText = make("p", "il-message");
  const sphereFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 250", role: "img", "aria-label": "Gömb a köré írt hengerben" });
  const sphereText = make("div", "il-formula start");
  const radius = range({ label: "közös sugár", min: 1, max: 4, value: state.radius, onInput: (value) => { state.radius = value; renderCompare(); } });
  compare.append(controls(radius.element), make("p", "il-muted", "1. Egy kúp és egy henger alapja és magassága egyforma. Hány kúpnyi víz kell a henger megtöltéséhez?"), pourFigure, controls(button("Önts át!", pour), button("Újra", () => { scope.clearAll(); state.pour = 0; renderCompare(); }, { ghost: true })), pourText,
    make("p", "il-muted", "2. A gömböt körülveszi egy henger: az alapköre a gömb legnagyobb köre, a magassága a gömb átmérője (Arkhimédész ötlete)."), sphereFigure, sphereText);
  root.append(main, compare, keyIdea("a kúp térfogata a vele egyenlő alapú és magasságú henger harmada (V = r²πm/3), a gömb térfogata pedig a köré írt henger térfogatának 2/3 része (V = 4r³π/3). A gömb felszíne (4r²π) éppen akkora, mint a köré írt henger palástja."));

  function pour() {
    scope.clearAll();
    const start = performance.now(), from = state.pour >= 3 ? 0 : state.pour;
    const tick = (now) => {
      const t = Math.min(3, from + (now - start) / 1500);
      state.pour = t; renderCompare();
      if (t < 3) scope.frame(tick);
    };
    scope.frame(tick);
  }

  function renderSolid() {
    const { solid, r, m, r2 } = state, s = 21;
    solidButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(SOLIDS[i] === solid)));
    mSlider.input.disabled = solid === "gömb"; mSlider.element.style.opacity = solid === "gömb" ? 0.35 : 1;
    r2Slider.input.disabled = solid !== "csonkakúp"; r2Slider.element.style.opacity = solid === "csonkakúp" ? 1 : 0.35;
    figure.replaceChildren();
    const cx = 300, fill = `fill:${PALETTE.blue};fill-opacity:.3;stroke:var(--fg);stroke-width:2`;
    const height = solid === "gömb" ? 2 * r : m, baseY = 135 + (height * s) / 2;
    const ellipse = (y, rx, style) => svg("ellipse", { cx, cy: y, rx, ry: rx * 0.28, style }, figure);
    const dashed = "fill:none;stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:5 4";
    const text = (x, y, content, color, anchor = "middle") => svg("text", { x, y, "text-anchor": anchor, text: content, style: `fill:${color};font-weight:700;font-size:15px` }, figure);
    const topR = solid === "henger" ? r : solid === "csonkakúp" ? r2 : 0;
    if (solid === "gömb") {
      svg("circle", { cx, cy: baseY - r * s, r: r * s, style: fill }, figure);
      ellipse(baseY - r * s, r * s, dashed);
      svg("line", { x1: cx, y1: baseY - r * s, x2: cx + r * s, y2: baseY - r * s, style: `stroke:${PALETTE.pink};stroke-width:3` }, figure);
      text(cx + (r * s) / 2, baseY - r * s - 8, "r", PALETTE.pink);
    } else {
      const topY = baseY - m * s, path = `M ${cx - r * s} ${baseY} L ${cx - topR * s} ${topY} L ${cx + topR * s} ${topY} L ${cx + r * s} ${baseY} Z`;
      ellipse(baseY, r * s, fill);
      svg("path", { d: path, style: `${fill};stroke:none` }, figure);
      svg("path", { d: `M ${cx - r * s} ${baseY} L ${cx - topR * s} ${topY} M ${cx + topR * s} ${topY} L ${cx + r * s} ${baseY}`, style: "stroke:var(--fg);stroke-width:2;fill:none" }, figure);
      svg("path", { d: `M ${cx - r * s} ${baseY} A ${r * s} ${r * s * 0.28} 0 0 0 ${cx + r * s} ${baseY}`, style: "stroke:var(--fg);stroke-width:2;fill:none" }, figure);
      if (topR > 0) ellipse(topY, topR * s, `${fill};fill-opacity:.45`);
      svg("line", { x1: cx, y1: baseY, x2: cx + r * s, y2: baseY, style: `stroke:${PALETTE.pink};stroke-width:3` }, figure);
      text(cx + (r * s) / 2, baseY + 18, solid === "csonkakúp" ? "R" : "r", PALETTE.pink);
      svg("line", { x1: cx, y1: baseY, x2: cx, y2: topY, style: `stroke:${PALETTE.green};stroke-width:3;stroke-dasharray:6 4` }, figure);
      text(cx - 10, (baseY + topY) / 2, "m", PALETTE.green, "end");
      if (solid === "csonkakúp") { svg("line", { x1: cx, y1: topY, x2: cx + topR * s, y2: topY, style: `stroke:${PALETTE.violet};stroke-width:3` }, figure); text(cx + (topR * s) / 2, topY - 8, "r", PALETTE.violet); }
      if (solid !== "henger") text(cx + ((r + topR) * s) / 2 + 14, (baseY + topY) / 2, "a", PALETTE.amber, "start");
    }
    const { volume, area, slant } = measures(solid, r, m, r2), f = (v) => formatNumber(v, 1);
    const lines = {
      henger: [["V = r² · π · m", `V = ${r}² · π · ${m} = ${f(volume)}`], ["A = 2πr(r + m)", `A = 2π · ${r} · (${r} + ${m}) = ${f(area)}`]],
      "kúp": [["V = r² · π · m / 3", `V = ${r}² · π · ${m} / 3 = ${f(volume)}`], ["A = πr(r + a), a = √(r² + m²)", `a = ${formatNumber(slant, 2)},  A = π · ${r} · (${r} + ${formatNumber(slant, 2)}) = ${f(area)}`]],
      "gömb": [["V = 4r³π / 3", `V = 4 · ${r}³ · π / 3 = ${f(volume)}`], ["A = 4r²π", `A = 4 · ${r}² · π = ${f(area)}`]],
      csonkakúp: [["V = πm(R² + Rr + r²) / 3", `V = π · ${m} · (${r}² + ${r}·${r2} + ${r2}²) / 3 = ${f(volume)}`], ["A = π(R² + r² + (R + r)a)", `a = ${formatNumber(slant, 2)},  A = π · (${r}² + ${r2}² + ${r + r2} · ${formatNumber(slant, 2)}) = ${f(area)}`]],
    }[solid];
    formulas.replaceChildren(...lines.flatMap(([symbolic, numeric]) => { const label = slot(symbolic, 50, { align: "left" }); label.style.opacity = 0.6; return [label, make("br"), slot(numeric, 50, { align: "left" }), make("br")]; }));
  }

  function renderCompare() {
    const r = state.radius, m = r * 2, s = 20;
    // --- Cone poured into a cylinder of the same base and height (m = 2r here) ---
    pourFigure.replaceChildren();
    const baseY = 215, coneX = 140, cylX = 400, coneH = m * s;
    const t = state.pour, phase = Math.min(2, Math.floor(t)), p = t >= 3 ? 1 : t - phase;
    const coneFill = t >= 3 ? 0 : 1 - p, level = Math.min(1, (phase + p) / 3);
    // The cone stands on its tip like a funnel; the liquid level follows the volume (volume ~ level cubed).
    svg("path", { d: `M ${coneX - r * s} ${baseY - coneH} L ${coneX} ${baseY} L ${coneX + r * s} ${baseY - coneH} Z`, style: "fill:none;stroke:var(--fg);stroke-width:2.5;stroke-linejoin:round" }, pourFigure);
    if (coneFill > 0.001) {
      const fraction = Math.cbrt(coneFill), levelY = baseY - coneH * fraction;
      svg("path", { d: `M ${coneX} ${baseY} L ${coneX - r * s * fraction} ${levelY} L ${coneX + r * s * fraction} ${levelY} Z`, style: `fill:${PALETTE.blue};fill-opacity:.65` }, pourFigure);
    }
    svg("rect", { x: cylX - r * s, y: baseY - m * s, width: 2 * r * s, height: m * s, style: "fill:none;stroke:var(--fg);stroke-width:2.5" }, pourFigure);
    svg("rect", { x: cylX - r * s, y: baseY - m * s * level, width: 2 * r * s, height: m * s * level, style: `fill:${PALETTE.blue};fill-opacity:.65` }, pourFigure);
    for (const k of [1, 2]) svg("line", { x1: cylX - r * s, x2: cylX + r * s, y1: baseY - (m * s * k) / 3, y2: baseY - (m * s * k) / 3, style: "stroke:var(--fg-soft);stroke-width:1;stroke-dasharray:4 4" }, pourFigure);
    svg("text", { x: coneX, y: 240, "text-anchor": "middle", text: "kúp", style: "fill:var(--dim)" }, pourFigure);
    svg("text", { x: cylX, y: 240, "text-anchor": "middle", text: "henger", style: "fill:var(--dim)" }, pourFigure);
    const poured = Math.min(3, Math.floor(t + 1e-9));
    pourText.textContent = t >= 3 ? "Pontosan 3 kúpnyi víz töltötte meg a hengert: a kúp térfogata a henger térfogatának harmada." : `${poured} kúp van átöntve a 3-ból. A henger harmadánál mindig egy kúpnyi víz áll.`;

    // --- Sphere inside its circumscribed cylinder ---
    sphereFigure.replaceChildren();
    const sphereCx = 150, sphereCy = 125, sr = r * s * 1.4;
    svg("rect", { x: sphereCx - sr, y: sphereCy - sr, width: 2 * sr, height: 2 * sr, style: "fill:none;stroke:var(--fg);stroke-width:2.5" }, sphereFigure);
    svg("circle", { cx: sphereCx, cy: sphereCy, r: sr, style: `fill:${PALETTE.blue};fill-opacity:.4;stroke:${PALETTE.blue};stroke-width:2.5` }, sphereFigure);
    svg("ellipse", { cx: sphereCx, cy: sphereCy, rx: sr, ry: sr * 0.28, style: "fill:none;stroke:var(--fg-soft);stroke-dasharray:5 4" }, sphereFigure);
    // Bar: how much of the cylinder's volume the sphere takes (2/3).
    const barX = 340, barW = 220, barY = 100;
    svg("rect", { x: barX, y: barY, width: barW, height: 34, style: "fill:none;stroke:var(--fg);stroke-width:2" }, sphereFigure);
    svg("rect", { x: barX, y: barY, width: (barW * 2) / 3, height: 34, style: `fill:${PALETTE.blue};fill-opacity:.7` }, sphereFigure);
    svg("text", { x: barX + barW / 3, y: barY + 22, "text-anchor": "middle", text: "gömb: 2/3", style: "fill:#fff;font-weight:700" }, sphereFigure);
    svg("text", { x: barX + (barW * 5) / 6, y: barY + 22, "text-anchor": "middle", text: "1/3", style: "fill:var(--fg-soft);font-weight:700" }, sphereFigure);
    svg("text", { x: barX, y: barY - 10, text: "a henger térfogata = 1", style: "fill:var(--dim)" }, sphereFigure);
    const cylinderVolume = 2 * Math.PI * r ** 3, sphereVolume = (4 * Math.PI * r ** 3) / 3, cylinderLateral = 2 * Math.PI * r * 2 * r, sphereArea = 4 * Math.PI * r * r;
    sphereText.replaceChildren(
      slot(`henger: r²π · 2r = ${formatNumber(cylinderVolume, 1)}`, 34, { align: "left" }), slot(`gömb: 4r³π/3 = ${formatNumber(sphereVolume, 1)}`, 28, { align: "left" }), make("br"),
      slot(`a henger palástja: 2πr · 2r = ${formatNumber(cylinderLateral, 1)}`, 34, { align: "left" }), slot(`a gömb felszíne: 4r²π = ${formatNumber(sphereArea, 1)}`, 34, { align: "left" }),
    );
  }

  renderSolid();
  renderCompare();
  return () => scope.clearAll();
}
