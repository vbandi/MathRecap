import { button, card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const INEQUALITIES = [
  { a: -2, b: 3, c: 7, relation: ">" },
  { a: 2, b: 1, c: 9, relation: "≤" },
  { a: -3, b: -2, c: 4, relation: "≥" },
  { a: 4, b: 5, c: 1, relation: "<" },
];
const FLIPPED = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" };
const n = (value) => formatNumber(value);
const compare = (left, right, relation) => ({ "<": left < right, ">": left > right, "≤": left <= right, "≥": left >= right })[relation];
const symbolFor = (left, right) => (left < right ? "<" : left > right ? ">" : "=");

// Hungarian interval notation: reversed square brackets for open ends, infinity is always open.
function interval(relation, t) {
  if (relation === ">") return `]${n(t)}; ∞[`;
  if (relation === "≥") return `[${n(t)}; ∞[`;
  if (relation === "<") return `]−∞; ${n(t)}[`;
  return `]−∞; ${n(t)}]`;
}

function linear(a, b) {
  return `${n(b)} ${a < 0 ? "−" : "+"} ${n(Math.abs(a))}x`;
}

export function mount(root) {
  const state = { index: 0, step: 0, test: null, p: 2, q: 5, k: -2 };

  root.append(lead("Az egyenlőtlenség megoldása nem egy szám, hanem számok egész tartománya. Ugyanúgy oldjuk meg, mint az egyenletet, de van egy csapda: ha negatív számmal szorzunk vagy osztunk, a relációjel megfordul."));

  // --- Solve step by step ---
  const solve = card("Oldd meg lépésről lépésre");
  const picker = make("div", "il-controls");
  const steps = make("ol", "il-steps");
  const message = make("p", "il-message");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 110", role: "img", "aria-label": "Számegyenes a megoldás sugarával" });
  const answer = make("div");
  const nextButton = button("Következő lépés", () => { state.step += 1; render(); });
  const resetButton = button("Újra", () => { state.step = 0; render(); }, { ghost: true });
  const testMessage = make("p", "il-message");
  solve.append(picker, steps, controls(nextButton, resetButton), message, figure, answer, testMessage,
    make("p", "il-muted", "Kattints a számegyenesre, hogy kipróbálj egy számot az eredeti egyenlőtlenségben."));

  // --- Why the sign flips ---
  const flip = card("Miért fordul meg a jel?");
  const pSlider = range({ label: "első szám", min: -6, max: 6, value: state.p, format: n, onInput: (v) => { state.p = v; renderFlip(); } });
  const qSlider = range({ label: "második szám", min: -6, max: 6, value: state.q, format: n, onInput: (v) => { state.q = v; renderFlip(); } });
  const kSlider = range({ label: "szorzó", min: -5, max: 5, value: state.k, format: n, onInput: (v) => { state.k = v; renderFlip(); } });
  const flipFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 185", role: "img", "aria-label": "Két szám és a szorzatuk a számegyenesen" });
  const flipLine = make("div");
  const flipMessage = make("p", "il-message");
  flip.append(controls(pSlider.element, qSlider.element, kSlider.element), flipFigure, flipLine, flipMessage);
  root.append(solve, flip, keyIdea("negatív számmal szorzáskor vagy osztáskor a számegyenes tükröződik, ezért a nagyobb szám kisebb lesz, és a relációjel megfordul. Pozitív számmal szorozva a jel marad. A megoldás intervallum: a nyílt végnél ], [, a zárt végnél [, ] áll."));

  const toX = (v) => 300 + v * 32;
  function drawAxis(target, y, unit, from, to, center = 300) {
    svg("line", { x1: 20, x2: 580, y1: y, y2: y, class: "axis" }, target);
    for (let v = from; v <= to; v++) {
      svg("line", { x1: center + v * unit, x2: center + v * unit, y1: y - 5, y2: y + 5, class: "axis" }, target);
      if (Math.abs(unit) > 20 || v % 5 === 0) svg("text", { x: center + v * unit, y: y + 22, "text-anchor": "middle", text: n(v) }, target);
    }
  }

  function render() {
    const { a, b, c, relation } = INEQUALITIES[state.index];
    const t = (c - b) / a, finalRelation = a < 0 ? FLIPPED[relation] : relation;
    picker.replaceChildren(make("span", "il-muted", "Feladat:"), ...INEQUALITIES.map((q, i) => toggle(`${linear(q.a, q.b)} ${q.relation} ${n(q.c)}`, i === state.index, () => { Object.assign(state, { index: i, step: 0, test: null }); render(); })));
    const lines = [
      [`${linear(a, b)} ${relation} ${n(c)}`, "kiindulás"],
      [`${n(a)}x ${relation} ${n(c - b)}`, b > 0 ? `mindkét oldalból kivonunk ${n(b)} értéket` : `mindkét oldalhoz hozzáadunk ${n(-b)} értéket`],
      [`x ${finalRelation} ${n(t)}`, `mindkét oldalt osztjuk az x együtthatójával (${n(a)})${a < 0 ? ` — negatív, ezért a jel megfordul: ${relation} helyett ${finalRelation}` : ""}`],
    ];
    steps.replaceChildren(...lines.slice(0, state.step + 1).map(([text, note]) => {
      const item = make("li", "", text);
      item.append(make("span", "il-muted", `  | ${note}`));
      return item;
    }));
    nextButton.disabled = state.step >= 2;
    message.className = `il-message ${state.step === 2 ? "good" : ""}`;
    message.textContent = state.step === 0 ? "Cél: az x maradjon egyedül az egyik oldalon."
      : state.step === 1 ? "Az x-es tag most egyedül áll a bal oldalon. Már csak az együtthatóját kell elosztani."
        : a < 0 ? "Negatív számmal osztottunk, ezért megfordult a jel. Ellenőrizd a számegyenesen egy próbaszámmal!" : "Pozitív számmal osztottunk, a jel maradt.";

    figure.replaceChildren();
    const rayVisible = state.step === 2;
    drawAxis(figure, 60, 32, -9, 9);
    const strict = finalRelation === "<" || finalRelation === ">";
    const toRight = finalRelation === ">" || finalRelation === "≥";
    const ray = svg("g", { class: "il-fade", opacity: rayVisible ? 1 : 0 }, figure);
    svg("line", { x1: toX(t), x2: toRight ? 590 : 10, y1: 60, y2: 60, style: `stroke:${PALETTE.green};stroke-width:7;stroke-linecap:round` }, ray);
    svg("path", { d: toRight ? "M 580 50 L 596 60 L 580 70 Z" : "M 20 50 L 4 60 L 20 70 Z", style: `fill:${PALETTE.green}` }, ray);
    svg("circle", { cx: toX(t), cy: 60, r: 9, style: `fill:${strict ? "var(--input)" : PALETTE.green};stroke:${PALETTE.green};stroke-width:3.5` }, ray);
    if (state.test !== null) {
      const holds = compare(a * state.test + b, c, relation);
      svg("circle", { cx: toX(state.test), cy: 60, r: 6, style: `fill:${holds ? PALETTE.blue : PALETTE.red};stroke:var(--input);stroke-width:2` }, figure);
      svg("text", { x: toX(state.test), y: 34, "text-anchor": "middle", text: n(state.test), style: `fill:${holds ? PALETTE.blue : PALETTE.red};font-weight:700` }, figure);
    }
    const hit = svg("rect", { x: 0, y: 0, width: 600, height: 110, fill: "transparent", style: "cursor:crosshair" }, figure);
    hit.addEventListener("click", (event) => {
      const box = figure.getBoundingClientRect();
      const x = ((event.clientX - box.left) / box.width) * 600;
      state.test = Math.max(-9, Math.min(9, Math.round(((x - 300) / 32) * 2) / 2));
      render();
    });
    answer.replaceChildren(make("p", "il-formula start", `Megoldás: ${rayVisible ? `x ${finalRelation} ${n(t)}, azaz ${interval(finalRelation, t)}` : "…"}`));
    if (state.test === null) testMessage.textContent = "";
    else {
      const left = a * state.test + b, holds = compare(left, c, relation);
      const shown = state.test < 0 ? `(${n(state.test)})` : n(state.test);
      testMessage.className = `il-message ${holds ? "good" : "warn"}`;
      testMessage.textContent = `x = ${n(state.test)}: ${n(b)} ${a < 0 ? "−" : "+"} ${n(Math.abs(a))}·${shown} = ${n(left)}, és ${n(left)} ${relation} ${n(c)} ${holds ? "igaz" : "hamis"}.${rayVisible ? (holds === compare(state.test, t, finalRelation) ? "" : " (eltér a sugártól!)") : ""}`;
    }
  }

  function renderFlip() {
    const { p, q, k } = state;
    flipFigure.replaceChildren();
    const rows = [{ y: 50, values: [p, q], unit: 40, label: "eredeti" }, { y: 130, values: [k * p, k * q], unit: Math.min(40, 260 / Math.max(6, Math.abs(k * p), Math.abs(k * q))), label: `szorzat (${n(k)}-szoros)` }];
    rows.forEach((row, index) => {
      drawAxis(flipFigure, row.y, row.unit, Math.ceil(-270 / row.unit), Math.floor(270 / row.unit));
      svg("text", { x: 22, y: row.y + 42, text: index === 0 ? "eredeti számok" : "a szorzat (más beosztással)" }, flipFigure);
      row.values.forEach((v, i) => {
        const color = i === 0 ? PALETTE.blue : PALETTE.amber;
        svg("circle", { cx: 300 + v * row.unit, cy: row.y, r: 8, style: `fill:${color};stroke:var(--input);stroke-width:2` }, flipFigure);
        svg("text", { x: 300 + v * row.unit, y: row.y - 14 - (v === row.values[1 - i] ? 14 : 0), "text-anchor": "middle", text: n(v), style: `fill:${color};font-weight:700` }, flipFigure);
      });
    });
    const before = symbolFor(p, q), after = k === 0 ? "=" : symbolFor(k * p, k * q);
    flipLine.replaceChildren(equation(slot(`${n(p)} ${before} ${n(q)}`, 11), slot(`${n(k * p)} ${after} ${n(k * q)}`, 11, { align: "left" }), `· ${k < 0 ? `(${n(k)})` : n(k)} →`));
    flipMessage.className = `il-message ${k < 0 && p !== q ? "warn" : ""}`;
    flipMessage.textContent = p === q ? "A két szám egyenlő, ilyenkor semmi sem fordulhat meg."
      : k === 0 ? "0-val szorozva mindkét oldal 0 lesz: a reláció elvész, ezért 0-val nem szorzunk egyenlőtlenségben."
        : k < 0 ? `Negatív számmal szorozva a számegyenes tükröződik: ${n(p)} ${before} ${n(q)}, de ${n(k * p)} ${after} ${n(k * q)}. A jel megfordult.`
          : "Pozitív számmal szorozva a két szám sorrendje nem változik, a jel marad.";
  }

  render();
  renderFlip();
  return () => {};
}
