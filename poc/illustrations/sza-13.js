import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

const fmt = formatNumber;
const term = (n) => (n < 0 ? `(${fmt(n)})` : fmt(n));
const CHIP = 30, GAP = 6, CHIP_X0 = 30;

// Chip frames for a + b or a - b. Each chip is "plain", "new", "pair" (about to cancel) or "remove".
function buildFrames(a, b, subtract) {
  const plain = (n) => Array(n).fill("plain");
  let pos = plain(Math.max(a, 0)), neg = plain(Math.max(-a, 0));
  const frames = [{ pos: [...pos], neg: [...neg], note: `Kiindulás: ${fmt(a)}. Ennyi zsetonunk van: ${pos.length} pozitív (+), ${neg.length} negatív (−).` }];
  const push = (note) => frames.push({ pos: [...pos], neg: [...neg], note });
  if (!subtract) {
    const add = Math.abs(b);
    if (b > 0) pos = [...pos, ...Array(add).fill("new")]; else neg = [...neg, ...Array(add).fill("new")];
    if (b !== 0) push(`Hozzáteszünk ${add} ${b > 0 ? "pozitív" : "negatív"} zsetont.`);
    const pairs = Math.min(pos.length, neg.length);
    if (pairs > 0) {
      pos = pos.map((s, i) => (i < pairs ? "pair" : "plain")); neg = neg.map((s, i) => (i < pairs ? "pair" : "plain"));
      push(`Egy + és egy − zseton együtt nulla, ezek a nulla párok kioltják egymást: ${pairs} pár.`);
      pos = pos.slice(pairs); neg = neg.slice(pairs);
    }
  } else if (b !== 0) {
    const need = Math.abs(b), have = (b > 0 ? pos : neg).length, zeroPairs = Math.max(0, need - have);
    if (zeroPairs > 0) {
      pos = [...pos, ...Array(zeroPairs).fill("new")]; neg = [...neg, ...Array(zeroPairs).fill("new")];
      push(`Nincs elég ${b > 0 ? "pozitív" : "negatív"} zseton az elvételhez, ezért ${zeroPairs} nulla párt teszünk be. Ettől az érték nem változik.`);
    }
    const target = b > 0 ? pos : neg, marked = target.map((s, i) => (i < need ? "remove" : s));
    if (b > 0) pos = marked; else neg = marked;
    push(`Elveszünk ${need} ${b > 0 ? "pozitív" : "negatív"} zsetont.`);
    if (b > 0) pos = pos.filter((s) => s !== "remove"); else neg = neg.filter((s) => s !== "remove");
  }
  pos = pos.map(() => "plain"); neg = neg.map(() => "plain");
  frames.push({ pos, neg, note: `Ami megmaradt: ${pos.length} pozitív, ${neg.length} negatív zseton. Az eredmény: ${fmt(a + (subtract ? -b : b))}.`, final: true });
  return frames;
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Az egész számokkal való számolást zsetonokkal is el lehet képzelni: a pozitív zseton +1-et, a negatív −1-et ér. Egy pozitív és egy negatív zseton együtt nullát ér, ezért kioltják egymást."));

  const state = { a: 3, b: -5, subtract: false, frame: 0 };
  let frames = buildFrames(state.a, state.b, state.subtract);

  // --- Chips ---
  const chips = card("Zsetonmodell");
  const sliderA = range({ label: "Első szám", min: -6, max: 6, value: state.a, format: fmt, onInput: (v) => { state.a = v; rebuild(); } });
  const sliderB = range({ label: "Második szám", min: -6, max: 6, value: state.b, format: fmt, onInput: (v) => { state.b = v; rebuild(); } });
  const operationToggles = [toggle("Összeadás", true, () => { state.subtract = false; rebuild(); }), toggle("Kivonás", false, () => { state.subtract = true; rebuild(); })];
  const equationLine = make("div", "il-formula start");
  equationLine.style.fontSize = "22px";
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 190", role: "img" });
  const message = make("p", "il-message");
  const nextButton = button("Következő lépés", () => { state.frame = Math.min(frames.length - 1, state.frame + 1); renderChips(); });
  chips.append(controls(...operationToggles), controls(sliderA.element, sliderB.element), equationLine, figure, message, controls(nextButton, button("Újrakezdés", () => { state.frame = 0; renderChips(); }, { ghost: true })));
  function rebuild() {
    frames = buildFrames(state.a, state.b, state.subtract); state.frame = 0;
    operationToggles.forEach((t, i) => t.setAttribute("aria-pressed", String(i === (state.subtract ? 1 : 0))));
    renderChips(); renderArrows();
  }
  function drawRow(states, y, sign) {
    const color = sign > 0 ? PALETTE.red : PALETTE.blue;
    svg("text", { x: 8, y: y + 6, text: sign > 0 ? "+" : "−", style: `font-size:22px;font-weight:700;fill:${color}` }, figure);
    states.forEach((status, i) => {
      const x = CHIP_X0 + i * (CHIP + GAP) + CHIP / 2, group = svg("g", {}, figure);
      svg("circle", { cx: x, cy: y, r: CHIP / 2, style: `fill:${color};opacity:${status === "remove" ? 0.35 : 0.92};stroke:${status === "plain" ? "none" : status === "remove" ? PALETTE.amber : status === "pair" ? "var(--fg)" : "var(--accent)"};stroke-width:3;${status === "remove" ? "stroke-dasharray:4 3" : ""}` }, group);
      svg("text", { x, y: y + 7, "text-anchor": "middle", text: sign > 0 ? "+" : "−", style: "fill:#fff;font-size:20px;font-weight:700" }, group);
    });
  }
  function renderChips() {
    const frame = frames[state.frame], result = state.a + (state.subtract ? -state.b : state.b);
    figure.replaceChildren();
    svg("line", { x1: 0, x2: 600, y1: 95, y2: 95, style: "stroke:var(--line)" }, figure);
    drawRow(frame.pos, 50, 1); drawRow(frame.neg, 140, -1);
    equationLine.textContent = `${fmt(state.a)} ${state.subtract ? "−" : "+"} ${term(state.b)} = ${frame.final ? fmt(result) : "?"}`;
    message.className = `il-message${frame.final ? " good" : ""}`;
    message.textContent = frame.note;
    nextButton.disabled = state.frame === frames.length - 1;
  }

  // --- Number line arrows ---
  const arrows = card("Nyilak a számegyenesen");
  const arrowFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 150", role: "img" });
  const arrowMessage = make("p", "il-message");
  arrows.append(make("p", "il-muted", "Ugyanaz a művelet nyilakkal: az első szám a 0-tól indul, a második a végéről folytatódik. A kivonás az ellentett hozzáadása."), arrowFigure, arrowMessage);
  function renderArrows() {
    const { a, b, subtract } = state, step = subtract ? -b : b, result = a + step, x = (v) => 300 + v * 22;
    arrowFigure.replaceChildren();
    svg("line", { x1: 14, x2: 586, y1: 100, y2: 100, class: "axis" }, arrowFigure);
    for (let v = -12; v <= 12; v++) {
      svg("line", { x1: x(v), x2: x(v), y1: v === 0 ? 92 : 96, y2: v === 0 ? 108 : 104, class: "axis" }, arrowFigure);
      if (v % 2 === 0) svg("text", { x: x(v), y: 126, "text-anchor": "middle", text: fmt(v), style: "font-size:12px" }, arrowFigure);
    }
    const arrow = (from, to, y, color, label) => {
      if (from === to) return;
      const dir = to > from ? 1 : -1;
      svg("path", { d: `M ${x(from)} ${y} H ${x(to) - dir * 7}`, style: `stroke:${color};stroke-width:4` }, arrowFigure);
      svg("path", { d: `M ${x(to)} ${y} l ${-dir * 12} -7 v 14 Z`, style: `fill:${color}` }, arrowFigure);
      svg("text", { x: (x(from) + x(to)) / 2, y: y - 10, "text-anchor": "middle", text: label, style: `fill:${color};font-size:14px;font-weight:700` }, arrowFigure);
    };
    arrow(0, a, 78, PALETTE.red, fmt(a));
    arrow(a, result, 52, PALETTE.blue, step >= 0 ? `+${step}` : fmt(step));
    svg("circle", { cx: x(result), cy: 100, r: 6, style: `fill:${PALETTE.green}` }, arrowFigure);
    arrowMessage.className = "il-message good";
    arrowMessage.textContent = subtract
      ? `${fmt(a)} − ${term(b)} = ${fmt(a)} + ${term(-b)} = ${fmt(result)}. Ha kivonunk, a nyíl a másik irányba mutat, mintha az ellentettet adnánk hozzá.`
      : `${fmt(a)} + ${term(b)} = ${fmt(result)}. ${b >= 0 ? "Pozitív számot adva jobbra" : "Negatív számot adva balra"} lépünk.`;
  }

  // --- Multiplication pattern ---
  const pattern = card("Szorzás előjelszabálya: a minta folytatása");
  const patternState = { factor: 3, shown: 4 };
  const tableBox = make("div"), patternMessage = make("p", "il-message");
  const factorSlider = range({ label: "Első tényező", min: -4, max: 4, value: patternState.factor, format: fmt, onInput: (v) => { patternState.factor = v; patternState.shown = 4; renderPattern(); } });
  pattern.append(make("p", "il-muted", "A második tényezőt egyesével csökkentjük. Nézd meg, mit csinál a szorzat, és folytasd a mintát!"), controls(factorSlider.element, button("Következő sor", () => { patternState.shown = Math.min(7, patternState.shown + 1); renderPattern(); }), button("Újra", () => { patternState.shown = 4; renderPattern(); }, { ghost: true })), tableBox, patternMessage);
  function renderPattern() {
    const { factor, shown } = patternState, table = make("table", "il-table");
    table.style.fontSize = "17px";
    for (let row = 0; row < 7; row++) {
      const second = 3 - row, tr = make("tr"), visible = row < shown;
      const cells = [make("td", "", `${term(factor)} · ${term(second)}`), make("td", "", "="), make("td", "", visible ? fmt(factor * second) : "?"), make("td", "il-muted", row > 0 && visible ? `változás: ${factor === 0 ? "0" : fmt(-factor)}` : "")];
      cells.forEach((cell) => { cell.style.width = "auto"; cell.style.textAlign = "left"; cell.style.padding = "3px 10px"; });
      if (second < 0 && visible) cells[2].style.color = factor * second > 0 ? PALETTE.red : PALETTE.blue;
      cells[2].style.fontWeight = "700";
      if (!visible) tr.style.opacity = 0.5;
      tr.append(...cells); table.append(tr);
    }
    tableBox.replaceChildren(table);
    patternMessage.className = "il-message good";
    const last = 3 - (shown - 1);
    if (factor === 0) patternMessage.textContent = "Nullával szorozva mindig 0 a szorzat, bármi is a másik tényező.";
    else if (shown < 7) patternMessage.textContent = `Minden sorral a második tényező 1-gyel kisebb, a szorzat pedig ${fmt(-factor)} értékkel változik. Mi lesz a következő sor?`;
    else patternMessage.textContent = `${factor > 0 ? "Pozitív · negatív = negatív" : "Negatív · negatív = pozitív"}: ${term(factor)} · ${term(last)} = ${fmt(factor * last)}. A minta folytatása ezt mutatja.`;
  }

  root.append(chips, arrows, pattern, keyIdea("az ellentett zsetonok nulla párt alkotnak, ezért ugyanannyi + és − zseton kioltja egymást. Kivonni annyi, mint az ellentettet hozzáadni. Szorzásnál a minta mutatja, hogy két negatív szám szorzata pozitív, egy pozitív és egy negatív szám szorzata negatív."));
  rebuild(); renderPattern();
  return () => scope.clearAll();
}
