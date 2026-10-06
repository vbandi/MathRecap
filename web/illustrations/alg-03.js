import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, stepper, svg, toggle, withInstrumental } from "./kit.js";

const PRICE = 400, MAX_KG = 8, MAX_PRICE = PRICE * MAX_KG;
const PLOT = { left: 64, right: 580, top: 16, bottom: 236 };
const toX = (kg) => PLOT.left + (kg / MAX_KG) * (PLOT.right - PLOT.left);
const toY = (forint) => PLOT.bottom - (forint / MAX_PRICE) * (PLOT.bottom - PLOT.top);
const ft = (value) => `${formatNumber(value)} Ft`;

export function mount(root) {
  const scope = createScope();
  const state = { kg: 2.5, known: 3, target: 5, revealed: 3, total: 60, a: 2, b: 3 };

  root.append(lead("Két mennyiség egyenesen arányos, ha az egyik többszörösére a másik is ugyanannyiszorosára változik: kétszer annyi alma kétszer annyiba kerül. Ilyenkor az egy kilóra jutó ár mindig ugyanannyi."));

  // --- Apples: slider, table and graph ---
  const market = card("Alma a piacon: 400 Ft / kg");
  const kgSlider = range({ label: "Tömeg (kg)", min: 0, max: MAX_KG, step: 0.5, value: state.kg, onInput: (v) => { state.kg = v; renderMarket(); } });
  const marketLine = make("div");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 282", role: "img", "aria-label": "Az alma ára a tömeg függvényében: origón átmenő egyenes" });
  for (let kg = 0; kg <= MAX_KG; kg += 2) {
    svg("line", { x1: toX(kg), x2: toX(kg), y1: PLOT.top, y2: PLOT.bottom, class: kg ? "grid" : "axis" }, figure);
    svg("text", { x: toX(kg), y: PLOT.bottom + 18, "text-anchor": "middle", text: String(kg) }, figure);
  }
  for (let value = 0; value <= MAX_PRICE; value += 800) {
    svg("line", { x1: PLOT.left, x2: PLOT.right, y1: toY(value), y2: toY(value), class: value ? "grid" : "axis" }, figure);
    svg("text", { x: PLOT.left - 8, y: toY(value) + 4, "text-anchor": "end", text: formatNumber(value) }, figure);
  }
  svg("text", { x: PLOT.right, y: PLOT.bottom + 36, "text-anchor": "end", text: "tömeg (kg)" }, figure);
  svg("text", { x: PLOT.left + 6, y: PLOT.top + 12, text: "ár (Ft)" }, figure);
  svg("line", { x1: toX(0), y1: toY(0), x2: toX(MAX_KG), y2: toY(MAX_PRICE), style: `stroke:${PALETTE.blue};stroke-width:3` }, figure);
  const guide = svg("path", { fill: "none", style: "stroke:var(--accent);stroke-width:2;stroke-dasharray:6 5" }, figure);
  const dot = svg("circle", { r: 8, style: `fill:var(--accent);stroke:var(--input);stroke-width:2` }, figure);
  const table = make("table", "il-table");
  market.append(controls(kgSlider.element), marketLine, figure, table);

  // --- Inference steps ---
  const inference = card("Egyről többre, többről egyre");
  const knownControl = stepper({ label: "Ismert tömeg (kg)", min: 2, max: 6, value: state.known, onChange: (v) => { state.known = v; state.revealed = 3; renderInference(); } });
  const targetControl = stepper({ label: "Kérdezett tömeg (kg)", min: 1, max: 8, value: state.target, onChange: (v) => { state.target = v; state.revealed = 3; renderInference(); } });
  const inferenceFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 210", role: "img" });
  const inferenceMessage = make("p", "il-message");
  const demoButton = button("Mutasd meg", runInference);
  inference.append(make("p", "", "Ha tudod, mennyibe kerül néhány kiló, először egy kilóra számolsz vissza, onnan jutsz el a kérdezett mennyiséghez."), controls(knownControl.element, targetControl.element, demoButton), inferenceFigure, inferenceMessage);

  // --- Proportional division ---
  const division = card("Arányos osztás");
  const totalPicker = controls(...[60, 100, 120].map((total) => toggle(`${total} osztása`, total === state.total, () => { state.total = total; renderDivision(); })));
  const aControl = stepper({ label: "Első arány", min: 1, max: 6, value: state.a, onChange: (v) => { state.a = v; renderDivision(); } });
  const bControl = stepper({ label: "Második arány", min: 1, max: 6, value: state.b, onChange: (v) => { state.b = v; renderDivision(); } });
  const divisionFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 120", role: "img" });
  const divisionLine = make("div", "il-formula start");
  division.append(make("p", "", "Osszuk szét az összeget két részre úgy, hogy a részek aránya a megadott legyen."), totalPicker, controls(aControl.element, bControl.element), divisionFigure, divisionLine);

  root.append(market, inference, division, keyIdea("egyenes arányosságnál a két mennyiség hányadosa állandó (itt y : x = 400). A grafikon az origón átmenő egyenes, és bármit megkaphatsz úgy, hogy egy egységre osztasz, majd szorzol."));

  function renderMarket() {
    const { kg } = state;
    const cost = kg * PRICE;
    dot.setAttribute("cx", toX(kg)); dot.setAttribute("cy", toY(cost));
    guide.setAttribute("d", `M ${toX(kg)} ${PLOT.bottom} V ${toY(cost)} H ${PLOT.left}`);
    marketLine.replaceChildren(equation(
      rich(slot(formatNumber(kg), 4), " kg"),
      rich(slot(formatNumber(cost), 5, { align: "left" }), " Ft"),
      "→",
    ));
    const quotient = make("div", "il-formula");
    quotient.append(kg ? `${formatNumber(cost)} : ${formatNumber(kg)} = ${PRICE} Ft / kg` : "0 kg-nál a hányados nem értelmezhető, de az ár 0 Ft");
    marketLine.append(quotient);
    const xs = [1, 2, 3, 4, 5];
    const row = (heading, values) => {
      const tr = make("tr");
      tr.append(make("th", "", heading), ...values.map((value) => make("td", "", value)));
      return tr;
    };
    table.replaceChildren(row("kg", xs.map(String)), row("Ft", xs.map((x) => formatNumber(x * PRICE))), row("Ft : kg", xs.map(() => String(PRICE))));
  }

  function renderInference() {
    const { known, target, revealed } = state;
    inferenceFigure.replaceChildren();
    const rows = [
      { kg: known, cost: known * PRICE, y: 18 },
      { kg: 1, cost: PRICE, y: 92 },
      { kg: target, cost: target * PRICE, y: 166 },
    ];
    const ops = [`: ${known}`, `· ${target}`];
    rows.forEach((row, index) => {
      const group = svg("g", { class: "il-fade", opacity: index < revealed ? 1 : 0 }, inferenceFigure);
      svg("rect", { x: 130, y: row.y, width: 340, height: 40, rx: 8, style: `fill:var(--surface);stroke:${index === 1 ? PALETTE.amber : "var(--line-strong)"};stroke-width:2` }, group);
      svg("text", { x: 230, y: row.y + 26, "text-anchor": "end", text: `${formatNumber(row.kg)} kg`, style: "font-weight:700;font-size:16px;fill:var(--fg)" }, group);
      svg("text", { x: 300, y: row.y + 26, "text-anchor": "middle", text: "→", style: "fill:var(--dim)" }, group);
      svg("text", { x: 370, y: row.y + 26, "text-anchor": "start", text: index === 2 && revealed < 3 ? "?" : ft(row.cost), style: "font-weight:700;font-size:16px;fill:var(--fg)" }, group);
    });
    ops.forEach((operation, index) => {
      const group = svg("g", { class: "il-fade", opacity: index + 1 < revealed ? 1 : 0 }, inferenceFigure);
      const y1 = rows[index].y + 40, y2 = rows[index + 1].y;
      for (const x of [110, 490]) {
        svg("path", { d: `M ${x} ${y1 + 4} V ${y2 - 10}`, style: `stroke:${PALETTE.pink};stroke-width:2.5` }, group);
        svg("path", { d: `M ${x - 6} ${y2 - 12} L ${x} ${y2 - 2} L ${x + 6} ${y2 - 12} Z`, style: `fill:${PALETTE.pink}` }, group);
        svg("text", { x: x === 110 ? x - 10 : x + 10, y: (y1 + y2) / 2 + 5, "text-anchor": x === 110 ? "end" : "start", text: operation, style: `fill:${PALETTE.pink};font-weight:700;font-size:16px` }, group);
      }
    });
    const texts = [
      `${known} kg alma ${ft(known * PRICE)}. Ebből kiindulva keressük ${target} kg árát.`,
      `Egyre megyünk vissza: ${known} kg-ot ${withInstrumental(known)} osztunk, az árat is: ${formatNumber(known * PRICE)} : ${known} = ${PRICE} Ft egy kilóért.`,
      `Innen többre megyünk: mindkettőt ${withInstrumental(target)} szorozzuk. ${target} kg ára ${PRICE} · ${target} = ${formatNumber(PRICE * target)} Ft.`,
    ];
    inferenceMessage.textContent = revealed >= 3 ? texts[2] : texts[revealed - 1] ?? texts[0];
    inferenceMessage.className = `il-message ${revealed >= 3 ? "good" : ""}`;
  }

  function runInference() {
    scope.clearAll();
    demoButton.disabled = true;
    state.revealed = 1;
    renderInference();
    scope.timeout(() => { state.revealed = 2; renderInference(); }, 1100);
    scope.timeout(() => { state.revealed = 3; renderInference(); demoButton.disabled = false; }, 2400);
  }

  function renderDivision() {
    const { total, a, b } = state;
    totalPicker.querySelectorAll("button").forEach((element, index) => element.setAttribute("aria-pressed", String([60, 100, 120][index] === total)));
    const parts = a + b, unit = total / parts;
    const exact = Number.isInteger(unit);
    const width = 540 / parts;
    divisionFigure.replaceChildren();
    for (let i = 0; i < parts; i++) {
      svg("rect", { x: 30 + i * width, y: 20, width: width - 3, height: 46, rx: 5, style: `fill:${i < a ? PALETTE.green : PALETTE.blue}` }, divisionFigure);
    }
    const label = (from, count, text) => svg("text", { x: 30 + (from + count / 2) * width, y: 92, "text-anchor": "middle", text, style: "font-weight:700;font-size:15px;fill:var(--fg)" }, divisionFigure);
    label(0, a, `${formatNumber(a * unit)}`);
    label(a, b, `${formatNumber(b * unit)}`);
    const eq = exact ? "=" : "≈";
    divisionLine.replaceChildren(`${a + b} rész = ${total}, 1 rész ${eq} ${formatNumber(unit)}`, make("br"), `${a} · ${formatNumber(unit)} ${eq} ${formatNumber(a * unit)}, ${b} · ${formatNumber(unit)} ${eq} ${formatNumber(b * unit)}; ${formatNumber(a * unit)} + ${formatNumber(b * unit)} = ${total}`);
  }

  renderMarket();
  renderInference();
  renderDivision();
  return () => scope.clearAll();
}
