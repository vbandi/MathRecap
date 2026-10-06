import { card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle } from "./kit.js";

const W = 720, CELL = 44, GX = 40, GY = 12;
const KINDS = [
  { id: "sum", label: "az összeg = s", test: (a, b, s) => a + b === s },
  { id: "atleast", label: "az összeg ≥ s", test: (a, b, s) => a + b >= s },
  { id: "double", label: "két egyforma szám", test: (a, b) => a === b },
];

const choose = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); };
function frac(top, bottom) {
  const element = make("span", "il-frac");
  const t = make("span"), b = make("span");
  t.append(top); b.append(bottom);
  element.append(t, b);
  return element;
}
function binom(n, k) {
  const wrapper = make("span");
  wrapper.style.whiteSpace = "nowrap";
  const inner = make("span", "il-frac");
  inner.style.margin = "0 2px";
  const top = make("span", "", String(n)), bottom = make("span", "", String(k));
  top.style.borderBottom = "none";
  inner.append(top, bottom);
  wrapper.append("(", inner, ")");
  return wrapper;
}

export function mount(root) {
  const scope = createScope();
  let kind = KINDS[0], s = 7, n = 8, r = 5, k = 2;

  root.append(lead("Ha egy kísérletnek véges sok, egyformán valószínű kimenetele van, akkor egy esemény valószínűsége a kedvező esetek száma osztva az összes eset számával. A nehéz rész a két szám pontos megszámolása, és annak ellenőrzése, hogy tényleg egyforma esélyűek-e az esetek."));

  const dice = card("Két kocka: 36 egyformán valószínű pár");
  const kindControls = controls();
  const sSlider = range({ label: "s:", min: 2, max: 12, step: 1, value: s, format: String, onInput: (value) => { s = value; renderDice(); } });
  const diceFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 300`, role: "img", "aria-label": "A két kocka lehetséges párjai" }, dice);
  const diceLayer = svg("g", {}, diceFigure);
  const diceFormula = make("div");
  dice.append(kindControls, controls(sSlider.element), diceFigure, diceFormula);

  const sums = card("Miért 36 eset, és nem 11?");
  const sumFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 210`, role: "img", "aria-label": "Az összegek száma 2-től 12-ig" }, sums);
  const sumLayer = svg("g", {}, sumFigure);
  sums.append(make("p", "il-muted", "Az összegek (2-től 12-ig) nem egyformán valószínűek: a 7-et 6 pár adja, a 2-t csak 1. Az egyenlő esélyű elemi esemény a kockapár, nem az összeg."), sumFigure);

  const comb = card("Kombinatorikával számolunk: egyszerre húzunk golyókat");
  const nSlider = range({ label: "Összes golyó (N):", min: 4, max: 12, step: 1, value: n, format: String, onInput: (value) => { n = value; renderComb(); } });
  const rSlider = range({ label: "Ebből piros (R):", min: 1, max: 12, step: 1, value: r, format: String, onInput: (value) => { r = value; renderComb(); } });
  const kSlider = range({ label: "Húzunk (k):", min: 1, max: 5, step: 1, value: k, format: String, onInput: (value) => { k = value; renderComb(); } });
  const balls = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 70`, role: "img", "aria-label": "Az urnában lévő golyók" }, comb);
  const combFormula = make("div");
  comb.append(controls(nSlider.element, rSlider.element, kSlider.element), balls, combFormula,
    make("p", "il-muted", "Kedvező eset: a k húzott golyó mind piros, ez R-ből k golyó kiválasztása. Összes eset: bármely k golyó az N-ből. A sorrend nem számít, ezért mindkettő kombináció."));

  root.append(dice, sums, comb, keyIdea("a Laplace-képlet (P = kedvező / összes) csak akkor igaz, ha az összes elemi esemény egyformán valószínű. Először ezt kell ellenőrizni, utána megszámolni a kedvező és az összes esetet, a szorzási elvvel vagy kombinációkkal."));

  function renderDice() {
    kindControls.replaceChildren(...KINDS.map((item) => toggle(item.label, item === kind, () => { kind = item; renderDice(); })));
    sSlider.input.disabled = kind.id === "double";
    diceLayer.replaceChildren();
    let favorable = 0;
    for (let a = 1; a <= 6; a++) {
      svg("text", { x: GX - 10, y: GY + (a - 0.5) * CELL + 5, "text-anchor": "end", text: String(a), style: "font-weight:700" }, diceLayer);
      for (let b = 1; b <= 6; b++) {
        const hit = kind.test(a, b, s);
        if (hit) favorable += 1;
        svg("rect", { x: GX + (b - 1) * CELL + 2, y: GY + (a - 1) * CELL + 2, width: CELL - 4, height: CELL - 4, rx: 7, style: `fill:${hit ? PALETTE.green : "var(--surface)"};fill-opacity:${hit ? 0.8 : 1};stroke:var(--line)` }, diceLayer);
        svg("text", { x: GX + (b - 0.5) * CELL, y: GY + (a - 0.5) * CELL + 4, "text-anchor": "middle", text: `${a}·${b}`, style: `font-size:12px;fill:${hit ? "#fff" : "var(--fg-soft)"}` }, diceLayer);
      }
    }
    for (let b = 1; b <= 6; b++) svg("text", { x: GX + (b - 0.5) * CELL, y: GY + 6 * CELL + 18, "text-anchor": "middle", text: String(b), style: "font-weight:700" }, diceLayer);
    svg("text", { x: GX + 6 * CELL + 30, y: 60, text: "sor: az első kocka", style: "font-size:12px;fill:var(--dim)" }, diceLayer);
    svg("text", { x: GX + 6 * CELL + 30, y: 80, text: "oszlop: a második kocka", style: "font-size:12px;fill:var(--dim)" }, diceLayer);
    svg("text", { x: GX + 6 * CELL + 30, y: 130, text: `kedvező: ${favorable}`, style: `font-size:16px;font-weight:700;fill:${PALETTE.green}` }, diceLayer);
    svg("text", { x: GX + 6 * CELL + 30, y: 155, text: "összes: 36", style: "font-size:16px;font-weight:700" }, diceLayer);
    diceFormula.replaceChildren(equation("P", rich(frac(String(favorable), "36"), " = ", slot(formatNumber(favorable / 36), 6, { align: "left" }))));
    renderSums();
  }

  function renderSums() {
    sumLayer.replaceChildren();
    const left = 40, right = W - 20, base = 160, top = 14, bw = (right - left) / 11;
    svg("line", { x1: left, x2: right, y1: base, y2: base, class: "axis" }, sumLayer);
    for (let total = 2; total <= 12; total++) {
      let count = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === total) count += 1;
      const on = kind.id === "sum" && s === total || kind.id === "atleast" && total >= s;
      const h = (count / 6) * (base - top - 20), x = left + (total - 2) * bw;
      svg("rect", { x: x + 5, y: base - h, width: bw - 10, height: h, rx: 4, style: `fill:${on ? PALETTE.green : PALETTE.blue};opacity:${on ? 1 : 0.55}` }, sumLayer);
      svg("text", { x: x + bw / 2, y: base - h - 5, "text-anchor": "middle", text: `${count}/36`, style: "font-size:11px" }, sumLayer);
      svg("text", { x: x + bw / 2, y: base + 18, "text-anchor": "middle", text: String(total), style: "font-weight:700" }, sumLayer);
    }
    svg("text", { x: right, y: 198, "text-anchor": "end", text: "az összeg", style: "font-size:12px;fill:var(--dim)" }, sumLayer);
  }

  function renderComb() {
    rSlider.input.max = n; if (r > n) { r = n; rSlider.set(r); }
    kSlider.input.max = Math.min(5, n); if (k > Math.min(5, n)) { k = Math.min(5, n); kSlider.set(k); }
    balls.replaceChildren();
    for (let i = 0; i < n; i++) svg("circle", { cx: 40 + i * 50, cy: 35, r: 18, style: `fill:${i < r ? PALETTE.red : PALETTE.blue};stroke:var(--input);stroke-width:2` }, balls);
    const favorable = choose(r, k), all = choose(n, k);
    combFormula.replaceChildren(equation("P(mind piros)", rich(
      frac(binom(r, k), binom(n, k)), " = ", frac(String(favorable), String(all)), " = ", slot(formatNumber(favorable / all), 6, { align: "left" }))));
  }

  renderDice(); renderComb();
  return () => scope.clearAll();
}
