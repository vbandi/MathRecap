import { button, card, controls, createScope, equation, keyIdea, lead, make, rich, slot, stepper, svg } from "./kit.js";

const PAINT_A = { name: "kék", rgb: [24, 110, 226] };
const PAINT_B = { name: "sárga", rgb: [244, 196, 48] };
const MAX_PARTS = 8;

// Paint mixes subtractively: a weighted geometric mean per channel approximates it,
// so blue + yellow gives green (an arithmetic mean would give grey-olive).
const mixColor = (a, b) => {
  const total = a + b;
  if (!total) return "var(--surface)";
  const channels = PAINT_A.rgb.map((value, i) => Math.round(Math.exp((Math.log(value) * a + Math.log(PAINT_B.rgb[i]) * b) / total)));
  return `rgb(${channels.join(",")})`;
};
const PAINT_A_CSS = `rgb(${PAINT_A.rgb.join(",")})`;
const PAINT_B_CSS = `rgb(${PAINT_B.rgb.join(",")})`;

export function mount(root) {
  const scope = createScope();
  const state = { a: 2, b: 3, factor: 1, multiplier: 4, step: 0 };

  root.append(lead("Az arány azt mondja meg, hogyan viszonyul egymáshoz két mennyiség. Ha festéket keversz 2 rész kékből és 3 rész sárgából, a színt nem az dönti el, hány kanálnyit használtál, hanem az, hogy milyen viszonyban van a két festék."));

  // --- Mixing paint ---
  const mixing = card("Festékkeverés");
  const aControl = stepper({ label: "Kék részek", min: 1, max: MAX_PARTS, value: state.a, onChange: (v) => { state.a = v; state.step = 0; render(); } });
  const bControl = stepper({ label: "Sárga részek", min: 1, max: MAX_PARTS, value: state.b, onChange: (v) => { state.b = v; state.step = 0; render(); } });
  const factorControl = stepper({ label: "Többszörös adag", min: 1, max: 4, value: state.factor, onChange: (v) => { state.factor = v; render(); } });
  const mixFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 150", role: "img" });
  const mixLine = make("div");
  const mixMessage = make("p", "il-message");
  mixing.append(controls(aControl.element, bControl.element, factorControl.element), mixFigure, mixLine, mixMessage);

  // --- Solving a proportion ---
  const solving = card("Aránypár megoldása sávmodellel");
  const multiplierControl = stepper({ label: "A sárga festék mennyisége (egységekben)", min: 1, max: 6, value: state.multiplier, onChange: (v) => { state.multiplier = v; state.step = 0; render(); } });
  const barFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 190", role: "img" });
  const solveLine = make("div");
  const solveMessage = make("p", "il-message");
  const nextButton = button("Következő lépés", () => { state.step = Math.min(3, state.step + 1); render(); });
  const resetButton = button("Újra", () => { state.step = 0; render(); }, { ghost: true });
  solving.append(make("p", "", "Ugyanabban a színben kevered tovább a festéket: ha a sárgából ismert mennyit használsz, hány egység kék kell hozzá?"), controls(multiplierControl.element), barFigure, solveLine, solveMessage, controls(nextButton, resetButton));

  root.append(mixing, solving, keyIdea("az arány nem változik, ha mindkét tagját ugyanazzal a nem nulla számmal szorozzuk vagy osztjuk. Az aránypárban a kereszteződő szorzatok egyenlők: ha a : b = c : d, akkor a · d = b · c."));

  function renderMix() {
    const { a, b, factor } = state;
    const countA = a * factor, countB = b * factor;
    const cell = Math.min(34, 380 / Math.max(countA, countB)), gap = 3;
    mixFigure.replaceChildren();
    const row = (count, y, fill, label) => {
      svg("text", { x: 12, y: y + cell / 2 + 4, text: label, style: "font-weight:700" }, mixFigure);
      for (let i = 0; i < count; i++) {
        const groupBreak = Math.floor(i / (count / factor)) * 6;
        svg("rect", { x: 70 + i * cell + groupBreak, y, width: cell - gap, height: cell - gap, rx: 4, style: `fill:${fill}` }, mixFigure);
      }
    };
    row(countA, 28, PAINT_A_CSS, "kék");
    row(countB, 28 + cell + 14, PAINT_B_CSS, "sárga");
    svg("circle", { cx: 515, cy: 75, r: 52, style: `fill:${mixColor(a, b)};stroke:var(--line-strong);stroke-width:2` }, mixFigure);
    svg("text", { x: 515, y: 143, "text-anchor": "middle", text: "a kapott szín" }, mixFigure);
    mixFigure.setAttribute("aria-label", `${countA} rész kék és ${countB} rész sárga festék keveréke`);
    mixLine.replaceChildren(equation(
      rich(slot(a, 2), " : ", slot(b, 2)),
      rich(slot(countA, 2, { align: "left" }), " : ", slot(countB, 2, { align: "left" })),
    ));
    mixMessage.className = "il-message good";
    mixMessage.textContent = factor === 1
      ? "Egy adag: a keverék színe attól függ, hány rész kék jut egy rész sárgára."
      : `${factor}-szoros adag: a színminta ugyanaz maradt, mert a kék és a sárga viszonya nem változott.`;
  }

  function renderSolve() {
    const { a, b, multiplier, step } = state;
    const known = b * multiplier, unknown = a * multiplier;
    barFigure.replaceChildren();
    const width = 440, left = 130;
    const bar = (count, y, fill, labelFor, title) => {
      svg("text", { x: 12, y: y + 27, text: title, style: "font-weight:700" }, barFigure);
      const segment = width / Math.max(a, b);
      for (let i = 0; i < count; i++) {
        svg("rect", { x: left + i * segment, y, width: segment - 3, height: 40, rx: 5, style: `fill:${fill}` }, barFigure);
        const label = labelFor(i);
        if (label) svg("text", { x: left + i * segment + (segment - 3) / 2, y: y + 26, "text-anchor": "middle", text: label, style: "fill:#fff;font-weight:700;font-size:15px" }, barFigure);
      }
      return { segment };
    };
    bar(a, 30, PAINT_A_CSS, () => (step >= 3 ? String(multiplier) : ""), "kék");
    bar(b, 110, PAINT_B_CSS, () => (step >= 2 ? String(multiplier) : ""), "sárga");
    const brace = (count, y, text, segment) => {
      svg("path", { d: `M ${left} ${y} V ${y + 6} H ${left + count * segment - 3} V ${y}`, fill: "none", style: "stroke:var(--fg-soft);stroke-width:1.5" }, barFigure);
      svg("text", { x: left + (count * segment - 3) / 2, y: y + 22, "text-anchor": "middle", text, style: "font-weight:700" }, barFigure);
    };
    const segment = width / Math.max(a, b);
    brace(b, 152, `${known}`, segment);
    brace(a, 72, step >= 3 ? `${unknown}` : "x", segment);
    solveLine.replaceChildren(equation(
      rich(slot(a, 2), " : ", slot(b, 2)),
      rich(slot(step >= 3 ? unknown : "x", 2, { align: "left" }), " : ", slot(known, 3, { align: "left" })),
    ));
    solveMessage.className = `il-message ${step >= 3 ? "good" : ""}`;
    solveMessage.textContent = [
      `Az ismeretlen kék mennyiség: x. A sárga ${b} része együtt ${known} egység.`,
      `A ${b} sárga rész összesen ${known} egység, tehát ${known} : ${b} = ${multiplier} egység jut egy részre.`,
      `Egy rész ${multiplier} egység, így a kék ${a} része ${a} · ${multiplier} = ${unknown} egység.`,
      `x = ${unknown}. Ellenőrzés: ${a} · ${known} = ${a * known} és ${b} · ${unknown} = ${b * unknown}, a kereszteződő szorzatok egyenlők. ✓`,
    ][step];
    nextButton.disabled = step >= 3;
  }

  function render() {
    renderMix();
    renderSolve();
  }

  render();
  return () => scope.clearAll();
}
