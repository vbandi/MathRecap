import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, uniqueId } from "./kit.js";

const PLOT = { xMin: -8, xMax: 8, yMin: -8, yMax: 8, xUnit: 36, yUnit: 22, pad: 22 };
const WIDTH = (PLOT.xMax - PLOT.xMin) * PLOT.xUnit + 2 * PLOT.pad, HEIGHT = (PLOT.yMax - PLOT.yMin) * PLOT.yUnit + 2 * PLOT.pad;
const toX = (x) => PLOT.pad + (x - PLOT.xMin) * PLOT.xUnit;
const toY = (y) => PLOT.pad + (PLOT.yMax - y) * PLOT.yUnit;
const n = (value, digits = 2) => formatNumber(value, digits);
const DERIVATION = [
  ["ax² + bx + c = 0", "kiindulás (a ≠ 0)"],
  ["4a²x² + 4abx + 4ac = 0", "szorozzuk mindkét oldalt 4a-val"],
  ["(2ax + b)² − b² + 4ac = 0", "a két első tag és b² teljes négyzet: (2ax)² + 2·2ax·b + b²"],
  ["(2ax + b)² = b² − 4ac", "a konstansokat átvisszük"],
  ["2ax + b = ± √(b² − 4ac)", "gyököt vonunk (csak ha b² − 4ac ≥ 0)"],
  ["x = (−b ± √(b² − 4ac)) / (2a)", "x-et kifejezzük"],
];

export function mount(root) {
  const scope = createScope();
  const state = { a: 1, b: -2, c: -3 };
  const clipId = uniqueId("discriminant-clip");

  root.append(lead("A másodfokú egyenlet megoldásainak számát egyetlen szám eldönti: a diszkrimináns (D = b² − 4ac). Megmutatja, hány helyen metszi a parabola az x tengelyt — a megoldóképlet pedig kiszámolja ezeket a helyeket."));

  const main = card("Állítsd az együtthatókat");
  const aSlider = range({ label: "a", min: -3, max: 3, value: state.a, format: n, onInput: (v) => { state.a = v; stop(); render(); } });
  const bSlider = range({ label: "b", min: -6, max: 6, value: state.b, format: n, onInput: (v) => { state.b = v; stop(); render(); } });
  const cSlider = range({ label: "c", min: -6, max: 6, value: state.c, format: n, onInput: (v) => { state.c = v; stop(); render(); } });
  const sweepButton = button("c végigfuttatása", sweep, { ghost: true });
  const equationLine = make("div");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "A parabola és az x tengellyel való metszéspontjai" });
  svg("rect", { x: PLOT.pad, y: PLOT.pad, width: WIDTH - 2 * PLOT.pad, height: HEIGHT - 2 * PLOT.pad }, svg("clipPath", { id: clipId }, svg("defs", {}, figure)));
  for (let x = PLOT.xMin; x <= PLOT.xMax; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: PLOT.pad, y2: HEIGHT - PLOT.pad, class: x ? "grid" : "axis" }, figure);
    if (x && x % 2 === 0) svg("text", { x: toX(x), y: toY(0) + 14, "text-anchor": "middle", text: n(x), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  for (let y = PLOT.yMin; y <= PLOT.yMax; y++) {
    svg("line", { x1: PLOT.pad, x2: WIDTH - PLOT.pad, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    if (y && y % 2 === 0) svg("text", { x: toX(0) - 6, y: toY(y) + 4, "text-anchor": "end", text: n(y), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  const curve = svg("path", { fill: "none", "clip-path": `url(#${clipId})`, style: "stroke:var(--accent);stroke-width:3.5" }, figure);
  const marks = svg("g", {}, figure);
  const discriminantLine = make("div");
  const rootsOne = make("div"), rootsTwo = make("div");
  const message = make("p", "il-message");
  main.append(controls(aSlider.element, bSlider.element, cSlider.element, sweepButton), equationLine, figure, discriminantLine, rootsOne, rootsTwo, message);

  const derivation = make("details");
  derivation.style.margin = "14px 0";
  derivation.append(make("summary", "", "Honnan jön a képlet? (levezetés)"));
  const list = make("ol", "il-steps");
  for (const [formula, note] of DERIVATION) {
    const item = make("li", "", formula);
    item.append(make("span", "il-muted", `  | ${note}`));
    list.append(item);
  }
  derivation.append(list);
  root.append(main, derivation, keyIdea("D = b² − 4ac előjele dönt: D > 0 esetén két gyök van (a parabola két helyen metszi az x tengelyt), D = 0 esetén egy (érinti), D < 0 esetén nincs valós gyök (nem éri el az x tengelyt). A gyökök: x = (−b ± √D) / (2a)."));

  function stop() { scope.clearAll(); sweepButton.disabled = false; }

  function sweep() {
    stop();
    sweepButton.disabled = true;
    state.c = 6; cSlider.set(6); render();
    scope.interval(() => {
      if (state.c <= -6) { stop(); return; }
      state.c -= 1; cSlider.set(state.c); render();
    }, 550);
  }

  function render() {
    const { a, b, c } = state, D = b * b - 4 * a * c;
    const term = (value, suffix, first) => `${first ? (value < 0 ? "−" : "") : value < 0 ? " − " : " + "}${Math.abs(value) === 1 && suffix ? "" : n(Math.abs(value))}${suffix}`;
    equationLine.replaceChildren(make("p", "il-formula start", a === 0 ? "a = 0: ez nem másodfokú" : `y = ${term(a, "x²", true)}${term(b, "x", false)}${term(c, "", false)}`));
    curve.setAttribute("d", "");
    if (a !== 0) {
      let d = "";
      for (let x = PLOT.xMin; x <= PLOT.xMax + 1e-9; x += 0.1) d += `${d ? "L" : "M"} ${toX(x)} ${toY(a * x * x + b * x + c)} `;
      curve.setAttribute("d", d);
    }
    marks.replaceChildren();
    const tone = D > 0 ? PALETTE.green : D === 0 ? PALETTE.amber : PALETTE.red;
    let x1 = null, x2 = null;
    if (a !== 0 && D >= 0) { x1 = (-b - Math.sqrt(D)) / (2 * a); x2 = (-b + Math.sqrt(D)) / (2 * a); if (x1 > x2) [x1, x2] = [x2, x1]; }
    if (x1 !== null) {
      for (const x of D === 0 ? [x1] : [x1, x2]) {
        svg("circle", { cx: toX(x), cy: toY(0), r: 8, style: `fill:${tone};stroke:var(--input);stroke-width:2` }, marks);
        svg("text", { x: toX(x), y: toY(0) - 14, "text-anchor": "middle", text: n(x), style: `fill:${tone};font-weight:700` }, marks);
      }
    }
    discriminantLine.replaceChildren(equation(slot(`D = ${n(b)}² − 4·${a < 0 ? `(${n(a)})` : n(a)}·${c < 0 ? `(${n(c)})` : n(c)} = ${n(D)}`, 30), slot(a === 0 ? "—" : D > 0 ? "D > 0: két gyök" : D === 0 ? "D = 0: egy gyök" : "D < 0: nincs valós gyök", 22, { align: "left" }), "→"));
    discriminantLine.querySelector("span:last-child").style.color = tone;
    const rootLine = (label, value) => {
      const line = make("p", "il-formula start");
      line.append(slot(label, 23, { align: "left" }), slot(a === 0 ? "—" : value === null ? "nincs" : n(value), 8, { align: "left" }));
      return line;
    };
    rootsOne.replaceChildren(rootLine(a === 0 || D < 0 ? "x₁ =" : D === 0 ? "x₁ = x₂ = −b / 2a =" : "x₁ = (−b − √D) / 2a =", x1));
    rootsTwo.replaceChildren(rootLine(D > 0 && a !== 0 ? "x₂ = (−b + √D) / 2a =" : "x₂ =", x2));
    message.className = `il-message ${D > 0 && a !== 0 ? "good" : "warn"}`;
    message.textContent = a === 0 ? "Állíts be nullától különböző a értéket."
      : D > 0 ? "Két metszéspont: a parabola átmegy az x tengelyen."
        : D === 0 ? "A parabola csúcsa pontosan az x tengelyen van: csak érinti azt."
          : "A parabola nem éri el az x tengelyt, ezért nincs valós gyök. Vigyázz: a √D nem értelmezhető.";
  }

  render();
  return () => scope.clearAll();
}
