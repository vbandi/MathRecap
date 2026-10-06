import { card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, stepper, svg, toggle } from "./kit.js";

const CONTEXTS = [
  { name: "Hőmérséklet", unit: "°C", zero: "fagypont", describe: (v) => (v === 0 ? "pontosan a fagypont" : `${Math.abs(v)} fokkal a fagypont ${v < 0 ? "alatt" : "felett"}`) },
  { name: "Lift", unit: ". szint", zero: "földszint", describe: (v) => (v === 0 ? "a földszinten vagy" : `${Math.abs(v)} emelettel a földszint ${v < 0 ? "alatt" : "felett"}`) },
  { name: "Tengerszint", unit: " m", zero: "tengerszint", describe: (v) => (v === 0 ? "pontosan a tengerszinten" : `${Math.abs(v)} méterrel a tengerszint ${v < 0 ? "alatt" : "felett"}`) },
];
const ZERO_Y = 190, UNIT = 16, AXIS_X = 170;
const yOf = (value) => ZERO_Y - value * UNIT;

export function mount(root) {
  const scope = createScope();
  root.append(lead("A negatív számok a nulla „másik oldalán” vannak: a hőmérőn a fagypont alatti fokok, a liftben a földszint alatti szintek, a térképen a tengerszint alatti mélységek. Minden számnak van egy tükörképe, az ellentettje."));

  // --- Vertical number line ---
  const line = card("Függőleges számegyenes");
  const state = { value: -4, context: 0 };
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 380", role: "img" });
  const bar = svg("rect", { x: AXIS_X - 7, width: 14, rx: 3 }, figure);
  svg("line", { x1: AXIS_X, x2: AXIS_X, y1: yOf(10) - 10, y2: yOf(-10) + 10, class: "axis" }, figure);
  for (let v = -10; v <= 10; v++) {
    svg("line", { x1: AXIS_X - (v % 5 === 0 ? 14 : 8), x2: AXIS_X + (v % 5 === 0 ? 14 : 8), y1: yOf(v), y2: yOf(v), class: v === 0 ? "axis" : "grid" }, figure);
    if (v % 2 === 0 && v !== 0) svg("text", { x: AXIS_X - 24, y: yOf(v) + 4, "text-anchor": "end", text: formatNumber(v), style: "font-size:12px" }, figure);
  }
  svg("line", { x1: AXIS_X - 60, x2: AXIS_X + 200, y1: ZERO_Y, y2: ZERO_Y, style: "stroke:var(--fg-soft);stroke-width:2;stroke-dasharray:6 4" }, figure);
  svg("text", { x: AXIS_X - 24, y: ZERO_Y + 4, "text-anchor": "end", text: "0", style: "font-size:13px;font-weight:700;fill:var(--fg)" }, figure);
  const zeroLabel = svg("text", { x: AXIS_X + 200, y: ZERO_Y - 6, "text-anchor": "end", style: "font-size:11px;fill:var(--dim)" }, figure);
  const marker = svg("g", { class: "il-move" }, figure);
  svg("circle", { cx: AXIS_X, cy: 0, r: 9, style: `fill:${PALETTE.red}` }, marker);
  const markerText = svg("text", { x: AXIS_X + 22, y: 5, style: `fill:${PALETTE.red};font-size:15px;font-weight:700` }, marker);
  const mirror = svg("g", { class: "il-move" }, figure);
  svg("circle", { cx: AXIS_X, cy: 0, r: 9, style: `fill:var(--input);stroke:${PALETTE.violet};stroke-width:3` }, mirror);
  const mirrorText = svg("text", { x: AXIS_X + 22, y: 5, style: `fill:${PALETTE.violet};font-size:15px;font-weight:700` }, mirror);
  const bracket = svg("path", { fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3` }, figure);
  const bracketText = svg("text", { "text-anchor": "end", style: `fill:${PALETTE.amber};font-size:14px;font-weight:700` }, figure);
  const arrow = svg("path", { fill: "none", style: `stroke:${PALETTE.violet};stroke-width:2;stroke-dasharray:5 4` }, figure);
  const message = make("p", "il-message");
  const contextToggles = CONTEXTS.map(({ name }, index) => toggle(name, index === state.context, () => { state.context = index; renderLine(); }));
  const slider = range({ label: "Szám", min: -10, max: 10, value: state.value, format: formatNumber, onInput: (value) => { state.value = value; renderLine(); } });
  line.append(controls(...contextToggles), controls(slider.element), figure, message);
  function renderLine() {
    const { value, context } = state, { unit, zero, describe } = CONTEXTS[context], abs = Math.abs(value);
    contextToggles.forEach((element, index) => element.setAttribute("aria-pressed", String(index === context)));
    zeroLabel.textContent = zero;
    bar.setAttribute("y", Math.min(yOf(value), ZERO_Y)); bar.setAttribute("height", Math.abs(value) * UNIT);
    bar.style.fill = value < 0 ? PALETTE.blue : PALETTE.red; bar.style.opacity = 0.6;
    marker.style.transform = `translateY(${yOf(value)}px)`;
    mirror.style.transform = `translateY(${yOf(-value)}px)`;
    markerText.textContent = `${formatNumber(value)}${unit}`;
    mirrorText.textContent = `ellentett: ${formatNumber(-value)}${unit}`;
    bracket.setAttribute("d", `M ${AXIS_X - 100} ${yOf(0)} h -8 V ${yOf(value)} h 8`);
    bracketText.setAttribute("x", AXIS_X - 114); bracketText.setAttribute("y", (yOf(value) + yOf(0)) / 2 + 5);
    bracketText.textContent = value === 0 ? "" : `|${formatNumber(value)}| = ${abs}`;
    arrow.setAttribute("d", value === 0 ? "" : `M ${AXIS_X + 185} ${yOf(value)} C ${AXIS_X + 245} ${yOf(value)} ${AXIS_X + 245} ${yOf(-value)} ${AXIS_X + 185} ${yOf(-value)}`);
    message.className = "il-message good";
    message.textContent = `${formatNumber(value)}${unit}: ${describe(value)}. Az ellentettje ${formatNumber(-value)}, ugyanennyire van a 0-tól, csak a másik oldalon. Az abszolút érték a 0-tól mért távolság: |${formatNumber(value)}| = ${abs}.`;
  }

  // --- Comparing ---
  const compare = card("Melyik a nagyobb?");
  const pair = { a: -7, b: -2 };
  const compareFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 130", role: "img" });
  const compareMessage = make("p", "il-message");
  compare.append(controls(stepper({ label: "Piros szám", min: -10, max: 10, value: pair.a, onChange: (v) => { pair.a = v; renderCompare(); } }).element, stepper({ label: "Kék szám", min: -10, max: 10, value: pair.b, onChange: (v) => { pair.b = v; renderCompare(); } }).element), compareFigure, compareMessage);
  function renderCompare() {
    const x = (v) => 300 + v * 26;
    compareFigure.replaceChildren();
    svg("line", { x1: 20, x2: 580, y1: 70, y2: 70, class: "axis" }, compareFigure);
    svg("path", { d: "M 580 70 l -10 -6 v 12 Z", style: "fill:var(--line-strong)" }, compareFigure);
    for (let v = -10; v <= 10; v++) {
      svg("line", { x1: x(v), x2: x(v), y1: v === 0 ? 58 : 64, y2: v === 0 ? 82 : 76, class: "axis" }, compareFigure);
      if (v % 2 === 0) svg("text", { x: x(v), y: 100, "text-anchor": "middle", text: formatNumber(v), style: "font-size:12px" }, compareFigure);
    }
    for (const [value, color, dy] of [[pair.a, PALETTE.red, 0], [pair.b, PALETTE.blue, 0]]) {
      svg("circle", { cx: x(value), cy: 70, r: 9, style: `fill:${color};opacity:.9` }, compareFigure);
      svg("text", { x: x(value), y: 44 + dy, "text-anchor": "middle", text: formatNumber(value), style: `fill:${color};font-size:16px;font-weight:700` }, compareFigure);
    }
    const relation = pair.a === pair.b ? "=" : pair.a < pair.b ? "<" : ">";
    compareMessage.className = "il-message good";
    compareMessage.textContent = pair.a === pair.b
      ? "A két szám ugyanaz, ugyanott van a számegyenesen."
      : `${formatNumber(pair.a)} ${relation} ${formatNumber(pair.b)}, mert ${formatNumber(Math.min(pair.a, pair.b))} balrább van, és ami balrább van, az a kisebb.${pair.a < 0 && pair.b < 0 ? " Negatív számoknál a 0-tól távolabbi szám a kisebb." : ""}`;
  }

  root.append(line, compare, keyIdea("a számegyenesen a 0-tól jobbra a pozitív, balra a negatív számok vannak, és ami balrább van, az kisebb. Az ellentett a 0-ra tükrözött szám, az abszolút érték pedig a 0-tól mért távolság, ezért sosem negatív."));
  renderLine(); renderCompare();
  return () => scope.clearAll();
}
