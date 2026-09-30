import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, rich, slot, stepper, svg, toggle } from "./kit.js";

// Polynomials are coefficient arrays, highest degree first: [c3, c2, c1, c0].
const ADDITIONS = [
  { p: [0, 2, 3, -1], q: [0, 1, -5, 4] },
  { p: [1, 0, -2, 5], q: [0, 3, 2, -5] },
  { p: [0, 4, -3, 0], q: [0, -4, 3, 7] },
];
const POWER_NAMES = ["", "x", "x²", "x³", "x⁴"];

function term(coefficient, power, first) {
  const body = power === 0 ? formatNumber(Math.abs(coefficient)) : `${Math.abs(coefficient) === 1 ? "" : formatNumber(Math.abs(coefficient))}${POWER_NAMES[power]}`;
  return first ? `${coefficient < 0 ? "−" : ""}${body}` : ` ${coefficient < 0 ? "−" : "+"} ${body}`;
}

// Text of a polynomial from [power, coefficient] pairs in the given order.
function pairsText(pairs) {
  const used = pairs.filter(([, c]) => c !== 0);
  return used.length ? used.map(([power, c], index) => term(c, power, index === 0)).join("") : "0";
}

function highestDegree(coefficients) {
  for (let i = 0; i < coefficients.length; i++) if (coefficients[i] !== 0) return coefficients.length - 1 - i;
  return 0;
}

export function mount(root) {
  const scope = createScope();
  const state = { a: 2, b: 3, order: 0, ordered: false, addition: 0 };

  root.append(lead("A polinom olyan kifejezés, amelyben x különböző hatványai szerepelnek számokkal szorozva, például 2x³ + 3x² − x + 5. Két polinom szorzását is meg lehet rajzolni: a téglalap területe az összes kisebb rész területének összege."));

  // --- Tile multiplication ---
  const product = card("Szorzás téglalappal: (x + a) · (x + b)");
  const aControl = stepper({ label: "a", min: 0, max: 5, value: state.a, onChange: (v) => { state.a = v; renderProduct(); } });
  const bControl = stepper({ label: "b", min: 0, max: 5, value: state.b, onChange: (v) => { state.b = v; renderProduct(); } });
  const productFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 250", role: "img" });
  const productLine = make("div");
  const productMessage = make("p", "il-message");
  product.append(controls(aControl.element, bControl.element), productFigure, productLine, productMessage);

  // --- Degree and order ---
  const degree = card("Fokszám és rendezés");
  const orderPicker = controls(...[0, 1].map((index) => toggle(`${index + 1}. polinom`, index === 0, () => { state.order = index; state.ordered = false; renderOrder(); })));
  const orderLine = make("div", "il-formula");
  const orderMessage = make("p", "il-message");
  const orderButton = button("Rendezd fokszám szerint", () => { state.ordered = true; renderOrder(); });
  degree.append(orderPicker, orderLine, controls(orderButton, button("Keverd össze", () => { state.ordered = false; renderOrder(); }, { ghost: true })), orderMessage);

  // --- Addition ---
  const addition = card("Polinomok összeadása");
  const additionPicker = controls(...ADDITIONS.map((_, index) => toggle(`${index + 1}. példa`, index === 0, () => { state.addition = index; renderAddition(); })));
  const additionTable = make("table", "il-table");
  const additionMessage = make("p", "il-message");
  addition.append(make("p", "", "Összeadáskor az azonos fokszámú tagokat egymás alá írjuk, és oszloponként adjuk össze."), additionPicker, additionTable, additionMessage);

  root.append(product, degree, addition, keyIdea("a polinom foka a legnagyobb kitevő, amelyik nulla együtthatóval nem szerepel. Szorzásnál minden tagot minden taggal meg kell szorozni (ezt mutatja a téglalap részekre bontása), összeadásnál az azonos fokszámú tagok vonhatók össze."));

  function renderProduct() {
    const { a, b } = state;
    const X = 110, unit = 22, left = 30, top = 24;
    productFigure.replaceChildren();
    const block = (x, y, w, h, fill, label) => {
      svg("rect", { x, y, width: Math.max(w, 0), height: Math.max(h, 0), style: `fill:${fill};stroke:var(--input);stroke-width:2` }, productFigure);
      if (w >= 30 && h >= 18) svg("text", { x: x + w / 2, y: y + h / 2 + 5, "text-anchor": "middle", text: label, style: "fill:#fff;font-weight:700;font-size:15px" }, productFigure);
    };
    block(left, top, X, X, PALETTE.green, "x²");
    if (a) for (let i = 0; i < a; i++) block(left + X + i * unit, top, unit, X, PALETTE.blue, "x");
    if (b) for (let j = 0; j < b; j++) block(left, top + X + j * unit, X, unit, PALETTE.blue, "x");
    for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) block(left + X + i * unit, top + X + j * unit, unit, unit, PALETTE.amber, "1");
    svg("text", { x: left + X / 2, y: top - 8, "text-anchor": "middle", text: "x", style: "font-weight:700;fill:var(--fg)" }, productFigure);
    if (a) svg("text", { x: left + X + (a * unit) / 2, y: top - 8, "text-anchor": "middle", text: String(a), style: "font-weight:700;fill:var(--fg)" }, productFigure);
    svg("text", { x: left - 8, y: top + X / 2 + 5, "text-anchor": "end", text: "x", style: "font-weight:700;fill:var(--fg)" }, productFigure);
    if (b) svg("text", { x: left - 8, y: top + X + (b * unit) / 2 + 5, "text-anchor": "end", text: String(b), style: "font-weight:700;fill:var(--fg)" }, productFigure);
    const rightX = 330;
    const rows = [["x²", "1 db", PALETTE.green], [`x (${a + b} db)`, `${a}x + ${b}x`, PALETTE.blue], [`1-esek (${a * b} db)`, `${a} · ${b}`, PALETTE.amber]];
    rows.forEach(([name, detail, color], index) => {
      svg("rect", { x: rightX, y: 50 + index * 40, width: 18, height: 18, rx: 3, style: `fill:${color}` }, productFigure);
      svg("text", { x: rightX + 28, y: 64 + index * 40, text: `${name}: ${detail}`, style: "font-size:14px;fill:var(--fg)" }, productFigure);
    });
    const sumText = `x² ${a + b ? `+ ${a + b}x ` : ""}${a * b ? `+ ${a * b}` : ""}`.trim();
    productLine.replaceChildren(equation(rich(`(x + ${a})(x + ${b})`), rich(slot(sumText, 16, { align: "left" }))));
    productMessage.className = "il-message good";
    productMessage.textContent = `Az egész téglalap oldalai x + ${a} és x + ${b}. A részek területe: x², ${a}x, ${b}x és ${a} · ${b} = ${a * b}. Az x-es tagok összevonva: ${a}x + ${b}x = ${a + b}x.`;
  }

  function renderOrder() {
    const example = state.order === 0
      ? { pairs: [[0, 5], [2, 3], [1, -1], [3, 2]] }
      : { pairs: [[1, 4], [4, -1], [0, -7], [2, 6]] };
    orderPicker.querySelectorAll("button").forEach((btn, i) => btn.setAttribute("aria-pressed", String(i === state.order)));
    const sorted = [...example.pairs].sort((p, q) => q[0] - p[0]);
    const shown = state.ordered ? sorted : example.pairs;
    orderLine.textContent = pairsText(shown);
    const top = sorted[0];
    orderMessage.className = `il-message ${state.ordered ? "good" : ""}`;
    orderMessage.textContent = state.ordered
      ? `Fokszám szerint csökkenő sorrendben: a polinom foka ${top[0]}, a főegyütthatója (a legmagasabb fokú tag együtthatója) ${formatNumber(top[1])}.`
      : "A tagok összevissza vannak. A legnagyobb kitevőjű tag mutatja meg a polinom fokát.";
    orderButton.disabled = state.ordered;
  }

  function renderAddition() {
    const { p, q } = ADDITIONS[state.addition];
    additionPicker.querySelectorAll("button").forEach((btn, i) => btn.setAttribute("aria-pressed", String(i === state.addition)));
    const sum = p.map((value, i) => value + q[i]);
    const powers = [3, 2, 1, 0];
    const row = (heading, values, highlight = false) => {
      const tr = make("tr");
      tr.append(make("th", "", heading), ...values.map((value) => { const td = make("td", "", typeof value === "string" ? value : value === 0 ? "·" : formatNumber(value)); if (highlight) td.style.cssText = "color:var(--accent);font-weight:700"; if (value === 0) td.style.opacity = 0.4; return td; }));
      return tr;
    };
    additionTable.replaceChildren(row("", powers.map((power) => POWER_NAMES[power] || "1")), row(`(${pairsText(powers.map((power, i) => [power, p[i]]))})`, p), row(`+ (${pairsText(powers.map((power, i) => [power, q[i]]))})`, q), row("összeg", sum, true));
    additionMessage.className = "il-message good";
    additionMessage.textContent = `Az összeg: ${pairsText(powers.map((power, i) => [power, sum[i]]))}, foka ${highestDegree(sum)}. A fokszám kisebb is lehet, mint az összeadandók foka, ha a legmagasabb fokú tagok kiesnek.`;
  }

  renderProduct();
  renderOrder();
  renderAddition();
  return () => scope.clearAll();
}
