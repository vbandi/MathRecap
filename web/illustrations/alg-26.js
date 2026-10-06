import { button, card, controls, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle, uniqueId } from "./kit.js";

const EQUATIONS = [{ p: -5, q: 4 }, { p: -1, q: -6 }, { p: 3, q: 2 }, { p: -4, q: 4 }];
const PLOT = { xMin: -3.5, xMax: 3.5, yMin: -8, yMax: 12, xUnit: 80, yUnit: 18, pad: 22 };
const WIDTH = (PLOT.xMax - PLOT.xMin) * PLOT.xUnit + 2 * PLOT.pad, HEIGHT = (PLOT.yMax - PLOT.yMin) * PLOT.yUnit + 2 * PLOT.pad;
const toX = (x) => PLOT.pad + (x - PLOT.xMin) * PLOT.xUnit;
const toY = (y) => PLOT.pad + (PLOT.yMax - y) * PLOT.yUnit;
const n = (value, digits = 2) => formatNumber(value, digits);
const plus = (value) => `${value < 0 ? "−" : "+"} ${n(Math.abs(value))}`;
const pc = (value) => `${value < 0 ? "−" : "+"} ${Math.abs(value) === 1 ? "" : n(Math.abs(value))}`;
const exactOrApprox = (value) => (Number.isInteger(value) ? n(value) : `√${n(value * value)} ≈ ${n(value)}`);

function rootsInY({ p, q }) {
  const D = p * p - 4 * q;
  if (D < 0) return [];
  const root = Math.sqrt(D);
  return D === 0 ? [-p / 2] : [(-p - root) / 2, (-p + root) / 2];
}

export function mount(root) {
  const state = { index: 0, step: 0 };
  const clipId = uniqueId("quartic-clip");

  root.append(lead("Egy negyedfokú egyenletet néha úgy oldhatunk meg, hogy észrevesszük: csak x² és x⁴ szerepel benne. Ha az x²-et egy új betűvel (y) helyettesítjük, másodfokú egyenletet kapunk, amit már meg tudunk oldani. A végén visszahelyettesítünk."));

  const main = card("Helyettesítés lépésről lépésre");
  const picker = make("div", "il-controls");
  const steps = make("ol", "il-steps");
  const previousButton = button("Vissza", () => { state.step -= 1; render(); }, { ghost: true });
  const nextButton = button("Következő lépés", () => { state.step += 1; render(); });
  const message = make("p", "il-message");
  main.append(picker, controls(previousButton, nextButton), steps, message);

  const graph = card("A negyedfokú függvény grafikonja");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "A negyedfokú függvény grafikonja és zérushelyei" }, graph);
  svg("rect", { x: PLOT.pad, y: PLOT.pad, width: WIDTH - 2 * PLOT.pad, height: HEIGHT - 2 * PLOT.pad }, svg("clipPath", { id: clipId }, svg("defs", {}, figure)));
  for (let x = Math.ceil(PLOT.xMin); x <= PLOT.xMax; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: PLOT.pad, y2: HEIGHT - PLOT.pad, class: x ? "grid" : "axis" }, figure);
    if (x) svg("text", { x: toX(x), y: toY(0) + 16, "text-anchor": "middle", text: n(x), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  for (let y = PLOT.yMin; y <= PLOT.yMax; y += 2) {
    svg("line", { x1: PLOT.pad, x2: WIDTH - PLOT.pad, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    if (y && y % 4 === 0) svg("text", { x: toX(0) - 6, y: toY(y) + 4, "text-anchor": "end", text: n(y), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  const curve = svg("path", { fill: "none", "clip-path": `url(#${clipId})`, style: "stroke:var(--accent);stroke-width:3.5" }, figure);
  const marks = svg("g", {}, figure);
  const graphMessage = make("p", "il-message");
  graph.append(graphMessage);
  root.append(main, graph, keyIdea("az x⁴ + px² + q = 0 egyenletnél y = x² helyettesítéssel másodfokú egyenletet kapunk. Visszahelyettesítéskor csak a nemnegatív y értékekből lesz x, mert egy valós szám négyzete nem lehet negatív."));

  function render() {
    const equation = EQUATIONS[state.index], { p, q } = equation, ys = rootsInY(equation), step = state.step;
    picker.replaceChildren(make("span", "il-muted", "Egyenlet:"), ...EQUATIONS.map((e, i) => toggle(`x⁴ ${pc(e.p)}x² ${plus(e.q)} = 0`, i === state.index, () => { Object.assign(state, { index: i, step: 0 }); render(); })));
    const coloured = (text) => { const s = make("b", "", text); s.style.color = PALETTE.blue; return s; };
    const line = (...parts) => { const item = make("li"); item.append(...parts); return item; };
    const all = [
      line(`x⁴ ${pc(p)}x² ${plus(q)} = 0`, make("span", "il-muted", "  | kiindulás: csak x⁴ és x² szerepel")),
      line("(", coloured("x²"), `)² ${pc(p)}`, coloured("x²"), ` ${plus(q)} = 0`, make("span", "il-muted", "  | x⁴ = (x²)²: az x² mindenhol ugyanaz")),
      line(coloured("y"), `² ${pc(p)}`, coloured("y"), ` ${plus(q)} = 0`, make("span", "il-muted", "  | y = x² helyettesítés (y ≥ 0 kell legyen)")),
      line(ys.length ? `D = ${n(p * p - 4 * q)},  ${ys.length === 1 ? `y = ${n(ys[0])}` : `y₁ = ${n(ys[0])},  y₂ = ${n(ys[1])}`}` : `D = ${n(p * p - 4 * q)} < 0: nincs y`, make("span", "il-muted", "  | megoldjuk y-ra a másodfokú egyenletet")),
    ];
    const back = ys.map((y) => line(y >= 0 ? `y = ${n(y)}  →  x² = ${n(y)}  →  x = ±${exactOrApprox(Math.sqrt(y))}` : `y = ${n(y)}  →  x² = ${n(y)}  →  nincs valós x`, make("span", "il-muted", y >= 0 ? "  | visszahelyettesítés" : "  | a négyzet nem lehet negatív")));
    const items = step < 4 ? all.slice(0, step + 1) : [...all, ...back];
    steps.replaceChildren(...items);
    const xs = ys.filter((y) => y >= 0).flatMap((y) => (y === 0 ? [0] : [-Math.sqrt(y), Math.sqrt(y)])).sort((u, v) => u - v);
    previousButton.disabled = step === 0; nextButton.disabled = step === 4;
    message.className = `il-message ${step === 4 ? (xs.length ? "good" : "warn") : ""}`;
    message.textContent = step === 4
      ? (xs.length ? `Valós megoldások: ${xs.map((x) => `x = ${n(x)}`).join(", ")}.` : "Nincs valós megoldás: minden y érték negatív, nem lehet belőle x.")
      : ["Vegyük észre, hogy az egyenlet az x²-nek másodfokú kifejezése.", "Az x⁴-t átírjuk (x²)²-ra: az x² többször is ugyanaz a kifejezés.", "Az x²-et mindenhol y-ra cseréljük: másodfokú egyenlet lett y-ra.", "Az y gyökei megvannak. Még nem vagyunk kész: x-et keressük!"][step];

    let d = "";
    for (let x = PLOT.xMin; x <= PLOT.xMax + 1e-9; x += 0.02) d += `${d ? "L" : "M"} ${toX(x)} ${toY(x ** 4 + p * x * x + q)} `;
    curve.setAttribute("d", d);
    marks.replaceChildren();
    const showRoots = step === 4;
    for (const x of showRoots ? xs : []) {
      svg("circle", { cx: toX(x), cy: toY(0), r: 8, style: `fill:${PALETTE.green};stroke:var(--input);stroke-width:2` }, marks);
      svg("text", { x: toX(x), y: toY(0) - 14, "text-anchor": "middle", text: n(x), style: `fill:${PALETTE.green};font-weight:700` }, marks);
    }
    graphMessage.className = "il-message";
    graphMessage.textContent = showRoots ? `A grafikon ${xs.length} helyen metszi az x tengelyt — pontosan ennyi valós megoldása van.${xs.length === 0 ? " A görbe végig az x tengely fölött marad." : ""}` : "Lépj végig a megoldáson: a végén megjelennek a metszéspontok.";
  }

  render();
  return () => {};
}
