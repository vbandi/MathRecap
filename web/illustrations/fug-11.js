import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, svg, toggle, uniqueId } from "./kit.js";

const SIZE = 460, PAD = 30, R = 5;
const unit = (SIZE - 2 * PAD) / (2 * R);
const toX = (x) => PAD + (x + R) * unit;
const toY = (y) => SIZE - PAD - (y + R) * unit;

const FUNCTIONS = {
  linear: {
    label: "f(x) = 2x + 1", f: (x) => 2 * x + 1, from: -5, to: 5, oneToOne: true,
    hits: (c) => [(c - 1) / 2],
    inverse: "A tükörkép az y = (x − 1) / 2 egyenes: ez az inverz függvény. Ellenőrzés: f(1) = 3, és az inverz a 3-hoz visszaadja az 1-et.",
    horizontal: (c, hits) => `A c = ${formatNumber(c)} magasságú vízszintes egyenes 1 pontban metszi a grafikont (x = ${formatNumber(hits[0], 2)}). Bárhol húzod, pontosan egy metszéspont lesz: minden y-hoz egyetlen x tartozik, tehát kölcsönösen egyértelmű.`,
  },
  square: {
    label: "f(x) = x² (minden x)", f: (x) => x * x, from: -5, to: 5, oneToOne: false,
    hits: (c) => (c > 0 ? [-Math.sqrt(c), Math.sqrt(c)] : c === 0 ? [0] : []),
    inverse: "A tükörkép fekvő parabola: egy x-hez két y is tartozik, ezért ez nem függvény. Az x² az egész számegyenesen nem invertálható.",
    horizontal: (c, hits) => hits.length === 2
      ? `A c = ${formatNumber(c)} magasságú vízszintes egyenes 2 pontban metszi a grafikont (x = ${formatNumber(hits[0], 2)} és x = ${formatNumber(hits[1], 2)}): ugyanahhoz az y-hoz két x tartozik, ezért nem kölcsönösen egyértelmű.`
      : hits.length === 1 ? "Ennél a magasságnál csak a csúcs van a vízszintes egyenesen, de máshol már kettő lesz: emeld feljebb!" : "Ez a magasság a parabola alatt van, itt nincs metszéspont. Emeld az egyenest feljebb!",
  },
  root: {
    label: "f(x) = x², ha x ≥ 0", f: (x) => x * x, from: 0, to: 5, oneToOne: true,
    hits: (c) => (c >= 0 ? [Math.sqrt(c)] : []),
    inverse: "A tükörkép az y = √x görbe, ez már függvény. Az x² inverze tehát az x ≥ 0 tartományon a négyzetgyök.",
    horizontal: (c, hits) => (hits.length ? `Így a c = ${formatNumber(c)} magasságú vízszintes egyenes legfeljebb 1 pontban metszi a grafikont (x = ${formatNumber(hits[0], 2)}). A negatív oldalt elhagytuk, ezért kölcsönösen egyértelmű.` : "Ez a magasság a grafikon alatt van, itt nincs metszéspont. Emeld feljebb!"),
  },
};

const DIAGRAMS = {
  linear: { label: "2x + 1", left: [0, 1, 2, 3], right: [1, 3, 5, 7], pairs: [[0, 0], [1, 1], [2, 2], [3, 3]], note: "Megfordítva minden szám egyetlen számhoz tartozik vissza: ez függvény, az inverz." },
  square: { label: "x²", left: [-1, 0, 1, 2], right: [0, 1, 4], pairs: [[0, 1], [1, 0], [2, 1], [3, 2]], note: "Megfordítva az 1-ből két nyíl indul (a −1-hez és az 1-hez is): egy kiindulási elemhez két érték tartozna, ez nem függvény." },
};

export function mount(root) {
  const scope = createScope();
  const state = { fn: "linear", t: 0, c: 2, animating: false, dia: "linear", reversed: false };
  const clipId = uniqueId("inv-clip");

  root.append(lead("Az inverz függvény visszafelé csinálja azt, amit az eredeti. Ha f az x-ből y-t csinál, akkor az inverze az y-ból visszacsinálja az x-et. Ez csak akkor megy, ha minden y-hoz pontosan egy x tartozik."));

  const main = card("Tükrözés az y = x egyenesre");
  const fnRow = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${SIZE} ${SIZE}`, role: "img", style: "max-width:460px;margin:0 auto" });
  svg("rect", { x: PAD, y: PAD, width: SIZE - 2 * PAD, height: SIZE - 2 * PAD }, svg("clipPath", { id: clipId }, svg("defs", {}, figure)));
  const tSlider = range({ label: "tükrözés", min: 0, max: 1, step: 0.02, value: 0, format: (v) => `${Math.round(v * 100)}%`, onInput: (v) => { stop(); state.t = v; render(); } });
  const cSlider = range({ label: "vízszintes egyenes: y", min: -4, max: 4, step: 0.5, value: state.c, onInput: (v) => { state.c = v; render(); } });
  const animateButton = button("Tükrözd!", animate);
  const horizontalMessage = make("p", "il-message");
  const mirrorMessage = make("p", "il-message");
  main.append(fnRow, figure, controls(cSlider.element), horizontalMessage, controls(tSlider.element, animateButton), mirrorMessage);

  function stop() { state.animating = false; scope.clearAll(); }
  function animate() {
    if (state.animating) return stop();
    state.animating = true;
    if (state.t >= 1) state.t = 0;
    const tick = () => {
      if (!state.animating) return;
      state.t = Math.min(1, state.t + 0.025);
      tSlider.set(state.t); render();
      if (state.t >= 1) return stop();
      scope.timeout(tick, 35);
    };
    tick();
  }

  function render() {
    const fn = FUNCTIONS[state.fn];
    fnRow.replaceChildren(...Object.entries(FUNCTIONS).map(([key, item]) => toggle(item.label, key === state.fn, () => { stop(); state.fn = key; state.t = 0; tSlider.set(0); render(); })));
    animateButton.textContent = state.animating ? "Megállít" : "Tükrözd!";
    figure.replaceChildren(figure.firstChild);
    for (let v = -R; v <= R; v++) {
      svg("line", { x1: toX(v), x2: toX(v), y1: PAD, y2: SIZE - PAD, class: v ? "grid" : "axis" }, figure);
      svg("line", { x1: PAD, x2: SIZE - PAD, y1: toY(v), y2: toY(v), class: v ? "grid" : "axis" }, figure);
      if (v) {
        svg("text", { x: toX(v), y: toY(0) + 15, "text-anchor": "middle", text: formatNumber(v), style: "font-size:10px;fill:var(--dim)" }, figure);
        svg("text", { x: toX(0) - 6, y: toY(v) + 4, "text-anchor": "end", text: formatNumber(v), style: "font-size:10px;fill:var(--dim)" }, figure);
      }
    }
    const plot = svg("g", { "clip-path": `url(#${clipId})` }, figure);
    svg("line", { x1: toX(-R), y1: toY(-R), x2: toX(R), y2: toY(R), style: `stroke:${PALETTE.violet};stroke-width:2;stroke-dasharray:8 6` }, plot);
    svg("text", { x: toX(3.3), y: toY(4.1), text: "y = x", style: `fill:${PALETTE.violet};font-weight:700` }, figure);
    const points = Array.from({ length: 121 }, (_, i) => { const x = fn.from + ((fn.to - fn.from) * i) / 120; return [x, fn.f(x)]; });
    const d = (list) => list.map(([x, y], i) => `${i ? "L" : "M"} ${toX(x)} ${toY(y)}`).join(" ");
    if (state.t > 0) svg("path", { d: d(points), fill: "none", style: "stroke:var(--accent);stroke-width:2.5;opacity:.35" }, plot);
    const t = state.t;
    const moved = points.map(([x, y]) => [x + t * (y - x), y + t * (x - y)]);
    svg("path", { d: d(moved), fill: "none", style: `stroke:${t >= 1 ? PALETTE.pink : "var(--accent)"};stroke-width:3.5` }, plot);

    const hits = fn.hits(state.c);
    svg("line", { x1: PAD, x2: SIZE - PAD, y1: toY(state.c), y2: toY(state.c), style: `stroke:${PALETTE.blue};stroke-width:2.5;stroke-dasharray:7 5` }, figure);
    for (const x of hits) svg("circle", { cx: toX(x), cy: toY(state.c), r: 7, style: `fill:${hits.length > 1 ? PALETTE.red : PALETTE.amber};stroke:var(--input);stroke-width:2` }, plot);
    horizontalMessage.className = `il-message ${fn.oneToOne ? "good" : hits.length > 1 ? "warn" : ""}`;
    horizontalMessage.textContent = fn.horizontal(state.c, hits);
    mirrorMessage.className = `il-message ${t >= 1 ? (fn.oneToOne ? "good" : "warn") : ""}`;
    mirrorMessage.textContent = t >= 1 ? fn.inverse : "Húzd a tükrözés csúszkát, vagy nyomd meg a gombot: a grafikon a szaggatott y = x egyenesre tükröződik, az x és y szerepe felcserélődik.";
  }

  // ---- Card 2: reversing the arrows ----
  const arrows = card("Fordítsd meg a nyilakat");
  const diaRow = make("div", "il-controls");
  const diaFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 230", role: "img" });
  const diaMessage = make("p", "il-message");
  const markerId = uniqueId("inv-arrow");
  svg("path", { d: "M 0 0 L 10 5 L 0 10 Z", style: "fill:var(--accent)" }, svg("marker", { id: markerId, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: "auto" }, svg("defs", {}, diaFigure)));
  const diaLayer = svg("g", {}, diaFigure);
  arrows.append(diaRow, diaFigure, diaMessage, controls(button("Nyilak megfordítása", () => { state.reversed = !state.reversed; renderDiagram(); })));

  function renderDiagram() {
    const dia = DIAGRAMS[state.dia];
    diaRow.replaceChildren(...Object.entries(DIAGRAMS).map(([key, item]) => toggle(`f(x) = ${item.label}`, key === state.dia, () => { state.dia = key; state.reversed = false; renderDiagram(); })));
    const from = state.reversed ? dia.right : dia.left, to = state.reversed ? dia.left : dia.right;
    const pairs = dia.pairs.map(([a, b]) => (state.reversed ? [b, a] : [a, b]));
    const y = (i, n) => 30 + (i * 170) / Math.max(1, n - 1);
    diaLayer.replaceChildren();
    for (const [a, b] of pairs) svg("line", { x1: 190, y1: y(a, from.length), x2: 406, y2: y(b, to.length), "marker-end": `url(#${markerId})`, style: "stroke:var(--accent);stroke-width:2.5" }, diaLayer);
    const box = (x, yy, text) => {
      svg("rect", { x, y: yy - 15, width: 56, height: 30, rx: 9, style: "fill:var(--surface);stroke:var(--line-strong);stroke-width:1.5" }, diaLayer);
      svg("text", { x: x + 28, y: yy + 5, "text-anchor": "middle", text: formatNumber(text), style: "fill:var(--fg);font-weight:600;font-size:15px" }, diaLayer);
    };
    from.forEach((v, i) => box(130, y(i, from.length), v));
    to.forEach((v, i) => box(410, y(i, to.length), v));
    svg("text", { x: 300, y: 16, "text-anchor": "middle", text: state.reversed ? "inverz hozzárendelés" : "f", style: "fill:var(--dim)" }, diaLayer);
    diaMessage.className = `il-message ${state.reversed ? (state.dia === "linear" ? "good" : "warn") : ""}`;
    diaMessage.textContent = state.reversed ? dia.note : "Ez az eredeti hozzárendelés. Nyomd meg a gombot: a nyilak iránya megfordul, és megnézheted, hogy az eredmény függvény marad-e.";
  }

  root.append(main, arrows, keyIdea("az inverz függvény akkor létezik, ha minden y-hoz pontosan egy x tartozik (kölcsönösen egyértelmű). A grafikonja az eredeti tükörképe az y = x egyenesre. Ha egy vízszintes egyenes kétszer is metszi a grafikont, nincs inverz, de a definíciós tartomány szűkítésével (x ≥ 0) megmenthető."));
  render();
  renderDiagram();
  return () => scope.clearAll();
}
