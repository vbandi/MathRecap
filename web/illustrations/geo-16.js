import { card, controls, equation, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const CELL = 30, GRID = 10;
const SEMI = 12; // fixed perimeter 2 * 12 = 24 in the exploration
const barArea = (a) => a * (SEMI - a);

export function mount(root) {
  const state = { a: 5, b: 3, width: 4 };

  root.append(lead("Egy téglalap kerülete a körbejárt út hossza, a területe pedig az, hány egységnégyzet fér bele. Az egységnégyzetek sorokba rendeződnek, így a szorzás adja meg őket."));

  // --- Card 1: area and perimeter of a×b ---
  const main = card("Téglalap az egységrácson");
  const sliderA = range({ label: "a (szélesség)", min: 1, max: GRID, value: state.a, onInput: (value) => { state.a = value; renderMain(); } });
  const sliderB = range({ label: "b (magasság)", min: 1, max: GRID, value: state.b, onInput: (value) => { state.b = value; renderMain(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 330", role: "img", "aria-label": "Téglalap egységrácson" });
  const areaLine = make("div"), perimeterLine = make("div");
  main.append(controls(sliderA.element, sliderB.element), figure, areaLine, perimeterLine,
    make("p", "il-muted", "A terület négyzetegységben, a kerület egységnyi hosszban értendő. Négyzet esetén a = b."));

  // --- Card 2: fixed perimeter ---
  const explore = card("Állandó kerület, változó terület");
  const sliderWidth = range({ label: "a (szélesség)", min: 1, max: SEMI - 1, value: state.width, onInput: (value) => { state.width = value; renderExplore(); } });
  const exploreFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 260", role: "img", "aria-label": "Azonos kerületű téglalapok területei oszlopdiagramon" });
  const exploreLine = make("div");
  const exploreMessage = make("p", "il-message");
  explore.append(make("p", "", "Egy 24 egység hosszú drótból hajlítunk téglalapot. Az a oldalt te választod, a b oldal 12 − a lesz. Melyik alakból lesz a legnagyobb terület?"),
    controls(sliderWidth.element), exploreFigure, exploreLine, exploreMessage);

  root.append(main, explore, keyIdea("téglalap területe a · b, kerülete 2 · (a + b). Ha a kerület adott, a négyzethez áll legközelebb a legnagyobb területű téglalap."));

  function renderMain() {
    const { a, b } = state;
    figure.replaceChildren();
    const x0 = 20, y0 = 15;
    for (let i = 0; i <= GRID; i++) {
      svg("line", { x1: x0 + i * CELL, y1: y0, x2: x0 + i * CELL, y2: y0 + GRID * CELL, class: "grid" }, figure);
      svg("line", { x1: x0, y1: y0 + i * CELL, x2: x0 + GRID * CELL, y2: y0 + i * CELL, class: "grid" }, figure);
    }
    const bottom = y0 + GRID * CELL;
    const colors = [PALETTE.blue, PALETTE.violet];
    for (let row = 0; row < b; row++) {
      for (let column = 0; column < a; column++) {
        svg("rect", { x: x0 + column * CELL + 1, y: bottom - (row + 1) * CELL + 1, width: CELL - 2, height: CELL - 2, rx: 3, style: `fill:${colors[row % 2]};fill-opacity:.75` }, figure);
      }
    }
    svg("rect", { x: x0, y: bottom - b * CELL, width: a * CELL, height: b * CELL, fill: "none", style: "stroke:var(--fg);stroke-width:3" }, figure);
    svg("text", { x: x0 + a * CELL / 2, y: bottom + 14, "text-anchor": "middle", text: `a = ${a}`, style: "font-weight:700;fill:var(--fg)" }, figure);
    svg("text", { x: x0 + a * CELL + 8, y: bottom - b * CELL / 2 + 5, text: `b = ${b}`, style: "font-weight:700;fill:var(--fg)" }, figure);
    const info = (y, text, color) => svg("text", { x: 350, y, text, style: `font:700 17px var(--font-mono);fill:${color}` }, figure);
    info(120, `${b} sor × ${a} négyzet`, "var(--fg-soft)");
    info(150, `Terület: ${a * b}`, "var(--accent)");
    info(180, `Kerület: ${2 * (a + b)}`, "var(--accent)");
    if (a === b) info(215, "Ez egy négyzet.", "var(--ai)");
    areaLine.replaceChildren(equation("T = a · b", slot(`${a} · ${b} = ${a * b}`, 14, { align: "left" })));
    perimeterLine.replaceChildren(equation("K = 2 · (a + b)", slot(`2 · ${a + b} = ${2 * (a + b)}`, 14, { align: "left" })));
  }

  function renderExplore() {
    const a = state.width, b = SEMI - a, unit = 15;
    exploreFigure.replaceChildren();
    svg("rect", { x: 20, y: 240 - b * unit, width: a * unit, height: b * unit, style: `fill:${PALETTE.blue};fill-opacity:.7;stroke:var(--fg);stroke-width:2.5` }, exploreFigure);
    svg("text", { x: 20, y: 18, text: "Téglalap (kicsinyítve)", style: "fill:var(--dim)" }, exploreFigure);
    const baseline = 235, bar = 26, chartX = 240;
    svg("line", { x1: chartX - 10, y1: baseline, x2: 590, y2: baseline, class: "axis" }, exploreFigure);
    for (let i = 1; i < SEMI; i++) {
      const height = barArea(i) * 5, x = chartX + (i - 1) * (bar + 4);
      const current = i === a;
      svg("rect", { x, y: baseline - height, width: bar, height, rx: 3, style: `fill:${i === SEMI / 2 ? PALETTE.amber : PALETTE.blue};fill-opacity:${current ? 1 : 0.35};${current ? "stroke:var(--fg);stroke-width:2" : ""}` }, exploreFigure);
      svg("text", { x: x + bar / 2, y: baseline + 15, "text-anchor": "middle", text: String(i), style: `font-size:12px;${current ? "font-weight:700;fill:var(--fg)" : ""}` }, exploreFigure);
    }
    svg("text", { x: chartX + 160, y: 16, "text-anchor": "middle", text: "Terület az a oldal függvényében", style: "fill:var(--dim)" }, exploreFigure);
    svg("text", { x: chartX + (a - 1) * (bar + 4) + bar / 2, y: baseline - barArea(a) * 5 - 6, "text-anchor": "middle", text: String(barArea(a)), style: "font-weight:700;fill:var(--fg)" }, exploreFigure);
    exploreLine.replaceChildren(equation(`a = ${a}, b = ${b}`, slot(`T = ${a} · ${b} = ${a * b}`, 16, { align: "left" })));
    exploreMessage.className = `il-message ${a === b ? "good" : ""}`;
    exploreMessage.textContent = a === b
      ? "Négyzet! A 24 egység drótból ennek a legnagyobb a területe: 36."
      : `A kerület mindig 24, a terület mégis ${a * b}. A legnagyobb terület (36) akkor lesz, ha a = b = 6.`;
  }

  renderMain();
  renderExplore();
  return () => {};
}
