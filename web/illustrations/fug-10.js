import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle, uniqueId } from "./kit.js";

const UNIT = 40, X_MIN = -7, X_MAX = 7, Y_MIN = -5, Y_MAX = 5, PAD = 20;
const WIDTH = (X_MAX - X_MIN) * UNIT + 2 * PAD, HEIGHT = (Y_MAX - Y_MIN) * UNIT + 2 * PAD;
const TARGET_SLOPES = [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3];

const toX = (x) => PAD + (x - X_MIN) * UNIT;
const toY = (y) => PAD + (Y_MAX - y) * UNIT;

export function formula(m, b) {
  const slopeTerm = m === 0 ? "" : m === 1 ? "x" : m === -1 ? "−x" : `${formatNumber(m)}x`;
  if (!slopeTerm) return `f(x) = ${formatNumber(b)}`;
  const constant = b > 0 ? ` + ${formatNumber(b)}` : b < 0 ? ` − ${formatNumber(-b)}` : "";
  return `f(x) = ${slopeTerm}${constant}`;
}

// Same rule as formula(), laid out in fixed slots. Terms that are normally not written
// (coefficient 1, a zero term) are shown dimmed instead of removed, so nothing shifts.
function stableFormula(m, b) {
  const right = make("span");
  const coefficient = make("span");
  if (m === -1) coefficient.append("−", slot("1", 1, { dim: true }));
  else coefficient.append(slot(formatNumber(m), Math.abs(m) === 1 || m === 0 ? 1 : formatNumber(m).length, { dim: m === 1 || m === 0 }));
  right.append(
    slot(coefficient, 4),
    slot("x", 1, { dim: m === 0 }),
    slot(` ${b < 0 ? "−" : "+"} `, 3, { dim: b === 0 }),
    slot(formatNumber(Math.abs(b)), 1, { align: "left", dim: b === 0 }),
  );
  return equation("f(x)", right);
}

export function mount(root) {
  const scope = createScope();
  const state = { m: 1, b: 1, target: null };
  const clipId = uniqueId("plot-clip");

  root.append(lead("Az f(x) = mx + b függvény grafikonja egyenes. A b megmondja, hol metszi az egyenes az y tengelyt. Az m (meredekség) megmondja, mennyit megy fel az egyenes, ha 1-et lépsz jobbra — ha m negatív, akkor lefelé megy."));

  const main = card("Állítsd be a meredekséget és a tengelymetszetet");
  const slope = range({ label: "m (meredekség)", min: -3, max: 3, step: 0.5, value: state.m, onInput: (value) => { state.m = value; render(); } });
  const intercept = range({ label: "b (tengelymetszet)", min: -4, max: 4, step: 1, value: state.b, onInput: (value) => { state.b = value; render(); } });
  const formulaLine = make("div");
  main.append(controls(slope.element, intercept.element), formulaLine);

  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img" }, main);
  svg("rect", { x: PAD, y: PAD, width: WIDTH - 2 * PAD, height: HEIGHT - 2 * PAD }, svg("clipPath", { id: clipId }, svg("defs", {}, figure)));
  for (let x = X_MIN; x <= X_MAX; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: PAD, y2: HEIGHT - PAD, class: x ? "grid" : "axis" }, figure);
    if (x) svg("text", { x: toX(x), y: toY(0) + 16, "text-anchor": "middle", text: formatNumber(x), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  for (let y = Y_MIN; y <= Y_MAX; y++) {
    svg("line", { x1: PAD, x2: WIDTH - PAD, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    if (y) svg("text", { x: toX(0) - 8, y: toY(y) + 4, "text-anchor": "end", text: formatNumber(y), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  svg("text", { x: WIDTH - PAD - 4, y: toY(0) - 8, "text-anchor": "end", text: "x", style: "font-style:italic" }, figure);
  svg("text", { x: toX(0) + 8, y: PAD + 14, text: "y", style: "font-style:italic" }, figure);
  const plot = svg("g", { "clip-path": `url(#${clipId})` }, figure);
  const targetLine = svg("line", { style: `stroke:${PALETTE.amber};stroke-width:3;stroke-dasharray:9 7`, opacity: 0.9 }, plot);
  const line = svg("line", { style: "stroke:var(--accent);stroke-width:3.5" }, plot);
  const stairs = svg("path", { fill: "none", style: `stroke:${PALETTE.pink};stroke-width:2.5` }, plot);
  const walker = svg("circle", { r: 7, style: `fill:${PALETTE.pink}`, opacity: 0 }, plot);
  const triangle = svg("g", {}, plot);
  const interceptDot = svg("circle", { r: 7, style: `fill:${PALETTE.blue};stroke:var(--input);stroke-width:2` }, plot);
  const interceptLabel = svg("text", { style: `fill:${PALETTE.blue};font-weight:700` }, plot);

  const valueTable = make("table", "il-table");
  const walkButton = button("Lépkedj végig!", walk, { ghost: true });
  main.append(controls(walkButton), valueTable);

  const challenge = card("Kihívás: olvasd le a szabályt");
  challenge.append(make("p", "", "A narancs szaggatott egyenesnek mi a hozzárendelési szabálya? Állítsd be úgy a csúszkákat, hogy a zöld egyenes pontosan ráfeküdjön."));
  const challengeMessage = make("p", "il-message");
  const challengeToggle = toggle("Kihívás indítása", false, () => (state.target ? stopChallenge() : newChallenge()));
  challenge.append(controls(challengeToggle, button("Új egyenes", newChallenge, { ghost: true })), challengeMessage);
  root.append(main, challenge, keyIdea("a grafikonról két dolgot kell leolvasni: hol metszi az egyenes az y tengelyt (ez a b), és mennyit emelkedik 1 lépés alatt jobbra (ez az m). A kettőből felírható a szabály: f(x) = mx + b."));

  function linePoints(m, b) {
    return { x1: toX(X_MIN), y1: toY(m * X_MIN + b), x2: toX(X_MAX), y2: toY(m * X_MAX + b) };
  }

  function render() {
    scope.clearAll();
    walker.setAttribute("opacity", 0);
    stairs.setAttribute("d", "");
    walkButton.disabled = false;
    const { m, b } = state;
    for (const [name, value] of Object.entries(linePoints(m, b))) line.setAttribute(name, value);
    formulaLine.replaceChildren(stableFormula(m, b));
    interceptDot.setAttribute("cx", toX(0)); interceptDot.setAttribute("cy", toY(b));
    interceptLabel.setAttribute("x", toX(0) - 12); interceptLabel.setAttribute("y", toY(b) - 12);
    interceptLabel.setAttribute("text-anchor", "end");
    interceptLabel.textContent = `(0; ${formatNumber(b)})`;

    triangle.replaceChildren();
    const corner = { x: toX(1), y: toY(b) };
    svg("path", { d: `M ${toX(0)} ${toY(b)} H ${corner.x} V ${toY(b + m)}`, fill: "none", style: "stroke:var(--fg);stroke-width:2;stroke-dasharray:5 4" }, triangle);
    svg("text", { x: (toX(0) + corner.x) / 2, y: toY(b) + (m > 0 ? 18 : -8), "text-anchor": "middle", text: "1", style: "fill:var(--fg);font-weight:700" }, triangle);
    if (m) svg("text", { x: corner.x + 8, y: (toY(b) + toY(b + m)) / 2 + 5, text: `${m > 0 ? "+" : ""}${formatNumber(m)}`, style: "fill:var(--fg);font-weight:700" }, triangle);

    const xs = [-2, -1, 0, 1, 2];
    const row = (heading, values) => {
      const tr = make("tr");
      tr.append(make("th", "", heading), ...values.map((value) => make("td", "", formatNumber(value))));
      return tr;
    };
    valueTable.replaceChildren(row("x", xs), row("f(x)", xs.map((x) => m * x + b)));
    renderChallenge();
  }

  function renderChallenge() {
    targetLine.setAttribute("opacity", state.target ? 0.9 : 0);
    challengeToggle.setAttribute("aria-pressed", String(Boolean(state.target)));
    if (!state.target) { challengeMessage.textContent = ""; return; }
    for (const [name, value] of Object.entries(linePoints(state.target.m, state.target.b))) targetLine.setAttribute(name, value);
    const solved = state.target.m === state.m && state.target.b === state.b;
    challengeMessage.className = `il-message ${solved ? "good" : ""}`;
    challengeMessage.textContent = solved
      ? `Talált! A szabály: ${formula(state.m, state.b)}.`
      : state.target.b !== state.b
        ? "Tipp: hol metszi a narancs egyenes az y tengelyt?"
        : "A tengelymetszet stimmel. Mennyit lép felfelé (vagy lefelé), ha 1-et lépsz jobbra?";
  }

  function newChallenge() {
    let target;
    do target = { m: TARGET_SLOPES[Math.floor(Math.random() * TARGET_SLOPES.length)], b: Math.floor(Math.random() * 7) - 3 };
    while (target.m === state.m && target.b === state.b);
    state.target = target;
    render();
  }

  function stopChallenge() {
    state.target = null;
    render();
  }

  // Walks along the line one unit at a time: 1 step right, then m steps up.
  function walk() {
    scope.clearAll();
    const { m, b } = state;
    let x = -4, d = `M ${toX(x)} ${toY(m * x + b)}`;
    stairs.setAttribute("d", d);
    walker.setAttribute("opacity", 1);
    const moveWalker = (px, py) => { walker.setAttribute("cx", toX(px)); walker.setAttribute("cy", toY(py)); };
    moveWalker(x, m * x + b);
    walkButton.disabled = true;
    const step = () => {
      if (x >= 4) {
        walkButton.disabled = false;
        scope.timeout(() => { walker.setAttribute("opacity", 0); stairs.setAttribute("d", ""); }, 1600);
        return;
      }
      d += ` H ${toX(x + 1)}`;
      stairs.setAttribute("d", d);
      moveWalker(x + 1, m * x + b);
      scope.timeout(() => {
        x += 1;
        d += ` V ${toY(m * x + b)}`;
        stairs.setAttribute("d", d);
        moveWalker(x, m * x + b);
        scope.timeout(step, 380);
      }, 320);
    };
    scope.timeout(step, 300);
  }

  render();
  return () => scope.clearAll();
}
