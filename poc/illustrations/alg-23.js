import { button, card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const EQUATIONS = [
  { b: 6, c: 5 },
  { b: 4, c: -12 },
  { b: 8, c: 16 },
  { b: 4, c: 1 },
  { b: 2, c: 5 },
];
const X = 70, U = 20;
const n = (value) => formatNumber(value);
const plus = (value) => `${value < 0 ? "−" : "+"} ${n(Math.abs(value))}`;
const plusX = (value) => `${value < 0 ? "−" : "+"} ${Math.abs(value) === 1 ? "" : n(Math.abs(value))}x`;
const equationText = ({ b, c }) => `x² ${plusX(b)} ${plus(c)} = 0`;

// Integer pairs (p, q) with p·q = c, each unordered pair once.
function factorPairs(c) {
  const pairs = [];
  for (let d = 1; d <= Math.abs(c); d++) {
    if (c % d !== 0) continue;
    for (const [p, q] of [[d, c / d], [-d, -c / d]]) {
      if (p <= q && !pairs.some(([a, b]) => a === p && b === q)) pairs.push([p, q]);
    }
  }
  return pairs.sort((first, second) => Math.abs(first[0]) + Math.abs(first[1]) - Math.abs(second[0]) - Math.abs(second[1]) || first[0] - second[0]);
}

const sqrtText = (r) => (Number.isInteger(Math.sqrt(r)) ? n(Math.sqrt(r)) : `√${n(r)}`);

export function mount(root) {
  const state = { index: 0, tries: 0, step: 0 };

  root.append(lead("A másodfokú egyenletnek kétféle kézi megoldása van. Az egyik egy ügyes keresés: két számot keresünk, amelynek az összege és a szorzata adott. A másik mindig működik: az egyenletet teljes négyzetté alakítjuk, és gyököt vonunk."));

  const picker = card("Válassz egyenletet");
  const toggles = make("div", "il-controls");
  const hint = make("p", "il-message");
  picker.append(toggles, hint);

  const columns = make("div");
  columns.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:0 14px";

  const factoring = card("1. módszer: szorzattá alakítás");
  const factoringNote = make("p", "il-muted");
  const table = make("table", "il-table");
  const tryButton = button("Következő próba", () => { state.tries += 1; renderFactoring(); });
  const resetTries = button("Újra", () => { state.tries = 0; renderFactoring(); }, { ghost: true });
  const factoringResult = make("p", "il-message");
  factoring.append(factoringNote, table, controls(tryButton, resetTries), factoringResult);

  const completing = card("2. módszer: teljes négyzetté alakítás");
  const tiles = svg("svg", { class: "il-svg", viewBox: "0 0 300 200", role: "img", "aria-label": "Lapok a négyzetté alakításhoz" });
  const steps = make("ol", "il-steps");
  const previousButton = button("Vissza", () => { state.step -= 1; renderCompleting(); }, { ghost: true });
  const nextButton = button("Következő lépés", () => { state.step += 1; renderCompleting(); });
  const completingResult = make("p", "il-message");
  completing.append(tiles, controls(previousButton, nextButton), steps, completingResult);

  columns.append(factoring, completing);
  root.append(picker, columns, keyIdea("ha van két egész szám, amelynek az összege b, a szorzata c, akkor az x² + bx + c szorzattá alakítható, és a megoldás azonnal leolvasható. Ha nincs, a teljes négyzetté alakítás akkor is célhoz ér — és ebből lesz a megoldóképlet."));

  const current = () => EQUATIONS[state.index];
  const match = () => factorPairs(current().c).findIndex(([p, q]) => p + q === current().b);

  function render() {
    toggles.replaceChildren(...EQUATIONS.map((e, i) => toggle(equationText(e), i === state.index, () => { Object.assign(state, { index: i, tries: 0, step: 0 }); render(); })));
    const found = match() >= 0;
    hint.textContent = found
      ? `Itt a szorzattá alakítás a gyorsabb: a táblázatban van megfelelő számpár (${n(current().b)} az összeg, ${n(current().c)} a szorzat).`
      : "Itt nincs olyan egész számpár, amelynek az összege és a szorzata is megfelelő, ezért a teljes négyzetté alakítás az ésszerűbb módszer.";
    renderFactoring();
    renderCompleting();
  }

  function renderFactoring() {
    const { b, c } = current(), pairs = factorPairs(c), hit = match();
    factoringNote.textContent = `Olyan p és q kell, hogy p · q = ${n(c)} és p + q = ${n(b)}. Ekkor x² ${plus(b)}x ${plus(c)} = (x + p)(x + q).`;
    const head = make("tr");
    head.append(...["p", "q", "p · q", "p + q", ""].map((t) => make("th", "", t)));
    table.replaceChildren(head);
    pairs.forEach(([p, q], i) => {
      const row = make("tr"), visible = i < state.tries, ok = p + q === b;
      row.append(...[n(p), n(q), n(p * q), n(p + q), visible ? (ok ? "✓" : "✗") : ""].map((t) => make("td", "", t)));
      row.style.opacity = visible ? 1 : 0.35;
      if (visible && ok) row.style.color = PALETTE.green;
      table.append(row);
    });
    const done = state.tries > hit && hit >= 0, exhausted = state.tries >= pairs.length;
    tryButton.disabled = done || exhausted;
    factoringResult.className = `il-message ${done ? "good" : ""}`;
    const [p, q] = hit >= 0 ? pairs[hit] : [0, 0];
    factoringResult.textContent = done
      ? `Megvan: p = ${n(p)}, q = ${n(q)}. Tehát (x ${plus(p)})(x ${plus(q)}) = 0, ezért x = ${n(-p)} vagy x = ${n(-q)}.`
      : exhausted ? "Egyik számpár sem jó: az egyenlet nem bontható egész együtthatós szorzattá. Próbáld a másik módszert!" : "";
  }

  function renderCompleting() {
    const { b, c } = current(), h = b / 2, r = h * h - c, step = state.step;
    tiles.replaceChildren();
    const stage = Math.min(step, 2);
    const rect = (x, y, w, height, color, text, dashed = false) => {
      svg("rect", { x: 20 + x, y: 20 + y, width: w, height, style: dashed ? `fill:none;stroke:${color};stroke-width:2;stroke-dasharray:4 3` : `fill:${color};fill-opacity:.85;stroke:var(--input);stroke-width:2` }, tiles);
      if (text) svg("text", { x: 20 + x + w / 2, y: 20 + y + height / 2 + 5, "text-anchor": "middle", text, style: "fill:#fff;font-weight:700;font-size:13px" }, tiles);
    };
    rect(0, 0, X, X, PALETTE.blue, "x²");
    for (let i = 0; i < b; i++) {
      if (stage === 0) rect(X + 12 + i * (U + 2), 0, U, X, PALETTE.green, "x");
      else if (i < h) rect(X + i * U, 0, U, X, PALETTE.green, "x");
      else rect(0, X + (i - h) * U, X, U, PALETTE.green, "x");
    }
    if (stage >= 1) for (let i = 0; i < h; i++) for (let j = 0; j < h; j++) rect(X + i * U, X + j * U, U, U, PALETTE.pink, stage === 2 ? "1" : "", stage === 1);
    if (stage === 2) svg("text", { x: 20 + X + h * U + 8, y: 20 + X / 2, text: `(x + ${n(h)})²`, style: "font-weight:700" }, tiles);

    const roots = r > 0 ? `x = ${n(-h)} ± ${sqrtText(r)}${Number.isInteger(Math.sqrt(r)) ? `, azaz x = ${n(-h + Math.sqrt(r))} vagy x = ${n(-h - Math.sqrt(r))}` : `, azaz x ≈ ${n(Math.round((-h + Math.sqrt(r)) * 100) / 100)} vagy x ≈ ${n(Math.round((-h - Math.sqrt(r)) * 100) / 100)}`}`
      : r === 0 ? `x = ${n(-h)} (kétszeres gyök)` : "nincs valós megoldás";
    const lines = [
      equationText(current()),
      `(x ${plus(h)})² ${plus(-h * h)} ${plus(c)} = 0   | ${n(h)}² = ${n(h * h)}-t hozzáadtunk és levontunk`,
      `(x ${plus(h)})² = ${n(r)}   | ${n(h * h)} − (${n(c)})`,
      r > 0 ? `x ${plus(h)} = ±${sqrtText(r)}   | mindkét oldalból gyököt vonunk` : r === 0 ? `x ${plus(h)} = 0` : `Egy négyzet nem lehet negatív: ${n(r)} < 0`,
      roots,
    ];
    steps.replaceChildren(...lines.slice(0, step + 1).map((text) => make("li", "", text)));
    previousButton.disabled = step === 0; nextButton.disabled = step === 4;
    completingResult.className = `il-message ${step === 4 ? (r >= 0 ? "good" : "warn") : ""}`;
    completingResult.textContent = step === 4 ? `Eredmény: ${roots}.` : ["Kiindulás: x² és b darab x csík.", "A csíkokat kettéosztjuk: fele jobbra, fele lefelé.", "A hiányzó sarok kiegészítésével négyzetet kapunk.", "", ""][step];
  }

  render();
  return () => {};
}
