import { card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle, uniqueId } from "./kit.js";

const EQUATIONS = [
  { name: "2x + 1 = −x + 4", f: (x) => 2 * x + 1, g: (x) => -x + 4, fText: "2x + 1", gText: "−x + 4", exact: "x = 1" },
  { name: "x² = x + 2", f: (x) => x * x, g: (x) => x + 2, fText: "x²", gText: "x + 2", exact: "x = −1 és x = 2" },
  { name: "|x| = 2", f: (x) => Math.abs(x), g: () => 2, fText: "|x|", gText: "2", exact: "x = −2 és x = 2" },
  { name: "2ˣ = x + 2", f: (x) => 2 ** x, g: (x) => x + 2, fText: "2ˣ", gText: "x + 2", exact: "x = 2 és egy tizedestört közelítés (x ≈ −1,69)" },
];
const VIEW = { width: 640, height: 420, pad: 22, xSpan: 20, ySpan: 13 };
const n = (value, digits = 3) => formatNumber(value, digits);

function findRoots(f, g) {
  const roots = [];
  const h = (x) => f(x) - g(x);
  let previousX = -10, previous = h(previousX);
  for (let x = -9.995; x <= 10 + 1e-9; x += 0.005) {
    const current = h(x);
    if (previous === 0) roots.push(previousX);
    else if (previous * current < 0) {
      let low = previousX, high = x;
      for (let i = 0; i < 60; i++) {
        const middle = (low + high) / 2;
        if (h(low) * h(middle) <= 0) high = middle; else low = middle;
      }
      roots.push((low + high) / 2);
    }
    previousX = x; previous = current;
  }
  return roots;
}

function niceStep(span) {
  const raw = span / 8, power = 10 ** Math.floor(Math.log10(raw)), mantissa = raw / power;
  return (mantissa < 1.5 ? 1 : mantissa < 3.5 ? 2 : mantissa < 7.5 ? 5 : 10) * power;
}

export function mount(root) {
  const state = { index: 1, zoom: 0, target: 0 };
  const clipId = uniqueId("graph-clip");

  root.append(lead("Az f(x) = g(x) egyenlet megoldásai azok az x értékek, ahol a két függvény értéke egyenlő — a grafikonon ott metszik egymást. Nem kell semmit kiszámolni: elég megrajzolni a két oldalt, és leolvasni a metszéspontok x-koordinátáit."));

  const main = card("Rajzold meg mindkét oldalt");
  const picker = make("div", "il-controls");
  const zoomSlider = range({ label: "nagyítás", min: 0, max: 3, value: 0, format: (v) => (v === 0 ? "1×" : `${10 ** v}×`), onInput: (v) => { state.zoom = v; render(); } });
  const targetToggles = make("div", "il-controls");
  const functions = make("div");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, role: "img", "aria-label": "Az egyenlet két oldalának grafikonja" });
  svg("rect", { x: VIEW.pad, y: VIEW.pad, width: VIEW.width - 2 * VIEW.pad, height: VIEW.height - 2 * VIEW.pad }, svg("clipPath", { id: clipId }, svg("defs", {}, figure)));
  const readout = make("p", "il-message");
  main.append(picker, functions, figure, controls(zoomSlider.element, targetToggles), readout);
  root.append(main, keyIdea("a grafikus megoldás a metszéspontok x-koordinátája. Nagyítással egyre pontosabban leolvasható, de a rajzról kapott érték csak közelítés — behelyettesítéssel ellenőrizhető, és pontos értéket az algebrai módszer ad."));

  function render() {
    const equationData = EQUATIONS[state.index], { f, g } = equationData;
    const roots = findRoots(f, g);
    if (state.target >= roots.length) state.target = 0;
    const zoomFactor = 10 ** state.zoom;
    const focus = state.zoom > 0 ? roots[state.target] : 0;
    const view = state.zoom > 0
      ? { cx: focus, cy: f(focus), xSpan: VIEW.xSpan / zoomFactor, ySpan: VIEW.ySpan / zoomFactor }
      : { cx: 0, cy: 1.5, xSpan: VIEW.xSpan, ySpan: VIEW.ySpan };
    const unitX = (VIEW.width - 2 * VIEW.pad) / view.xSpan, unitY = (VIEW.height - 2 * VIEW.pad) / view.ySpan;
    const toX = (x) => VIEW.width / 2 + (x - view.cx) * unitX, toY = (y) => VIEW.height / 2 - (y - view.cy) * unitY;
    const digits = state.zoom + 2;

    picker.replaceChildren(make("span", "il-muted", "Egyenlet:"), ...EQUATIONS.map((e, i) => toggle(e.name, i === state.index, () => { Object.assign(state, { index: i, zoom: 0, target: 0 }); zoomSlider.set(0); render(); })));
    targetToggles.replaceChildren(...(state.zoom > 0 || roots.length > 1 ? roots.map((_, i) => toggle(`${i + 1}. megoldás`, i === state.target, () => { state.target = i; if (state.zoom === 0) { state.zoom = 1; zoomSlider.set(1); } render(); })) : []));
    const fSpan = make("span", "", `f(x) = ${equationData.fText}`), gSpan = make("span", "", `g(x) = ${equationData.gText}`);
    fSpan.style.color = PALETTE.blue; gSpan.style.color = PALETTE.amber;
    functions.replaceChildren(equation(fSpan, gSpan, "|"));

    figure.querySelectorAll(":scope > :not(defs)").forEach((node) => node.remove());
    const stepX = niceStep(view.xSpan), stepY = niceStep(view.ySpan);
    const labelDigits = Math.max(0, -Math.floor(Math.log10(stepX)));
    for (let x = Math.ceil((view.cx - view.xSpan / 2) / stepX) * stepX; x <= view.cx + view.xSpan / 2; x += stepX) {
      const value = Math.round(x / stepX) * stepX;
      svg("line", { x1: toX(value), x2: toX(value), y1: VIEW.pad, y2: VIEW.height - VIEW.pad, class: Math.abs(value) < 1e-9 ? "axis" : "grid" }, figure);
      if (Math.abs(value) > 1e-9) svg("text", { x: toX(value), y: VIEW.height - VIEW.pad - 6, "text-anchor": "middle", text: n(value, labelDigits + 1), style: "font-size:11px;fill:var(--dim)" }, figure);
    }
    for (let y = Math.ceil((view.cy - view.ySpan / 2) / stepY) * stepY; y <= view.cy + view.ySpan / 2; y += stepY) {
      const value = Math.round(y / stepY) * stepY;
      svg("line", { x1: VIEW.pad, x2: VIEW.width - VIEW.pad, y1: toY(value), y2: toY(value), class: Math.abs(value) < 1e-9 ? "axis" : "grid" }, figure);
      if (Math.abs(value) > 1e-9) svg("text", { x: VIEW.pad + 4, y: toY(value) - 4, text: n(value, labelDigits + 1), style: "font-size:11px;fill:var(--dim)" }, figure);
    }
    const layer = svg("g", { "clip-path": `url(#${clipId})` }, figure);
    for (const [fn, color] of [[f, PALETTE.blue], [g, PALETTE.amber]]) {
      let d = "";
      for (let i = 0; i <= 500; i++) {
        const x = view.cx - view.xSpan / 2 + (view.xSpan * i) / 500;
        d += `${i ? "L" : "M"} ${toX(x)} ${toY(fn(x))} `;
      }
      svg("path", { d, fill: "none", style: `stroke:${color};stroke-width:3.5` }, layer);
    }
    roots.forEach((root, i) => {
      const y = f(root), visible = Math.abs(root - view.cx) < view.xSpan / 2 && Math.abs(y - view.cy) < view.ySpan / 2;
      if (!visible) return;
      svg("line", { x1: toX(root), x2: toX(root), y1: toY(y), y2: toY(0), style: "stroke:var(--fg);stroke-width:1.8;stroke-dasharray:6 5" }, layer);
      svg("circle", { cx: toX(root), cy: toY(y), r: 7, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, layer);
      svg("circle", { cx: toX(root), cy: toY(0), r: 5, style: `fill:${PALETTE.green};stroke:var(--input);stroke-width:2` }, layer);
      svg("text", { x: toX(root) + 12, y: toY(y) - 12, text: `x${i + 1} ≈ ${n(root, digits)}`, style: `fill:${PALETTE.green};font-weight:700` }, layer);
    });

    const shown = roots.map((r, i) => `x${i + 1} ≈ ${n(r, digits)}`).join(",  ");
    readout.className = "il-message good";
    const root = roots[state.zoom > 0 ? state.target : 0];
    readout.textContent = state.zoom === 0
      ? `A metszéspontok x-koordinátái: ${shown}. Pontos megoldás: ${equationData.exact}. Húzd a nagyítást, hogy közelebbről lásd!`
      : `${state.target + 1}. megoldás, ${zoomFactor}× nagyítással: x ≈ ${n(root, digits)}. Ellenőrzés: f(x) ≈ ${n(f(root), digits)}, g(x) ≈ ${n(g(root), digits)}. Minél jobban nagyítasz, annál több tizedesjegy olvasható le.`;
  }

  render();
  return () => {};
}
