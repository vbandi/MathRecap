import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const W = 720, AXIS_Y = 190, MAX_STACK = 8, MAX_VALUES = 20;
const PRESETS = [
  { label: "Dolgozat pontszámok", unit: "pont", min: 1, max: 10, values: [4, 5, 5, 6, 6, 6, 7, 8, 9] },
  { label: "Fizetések egy kisvállalatnál", unit: "százezer Ft", min: 1, max: 12, values: [2, 2, 2, 3, 4, 5, 8, 10, 12] },
];

const sortedCopy = (values) => [...values].sort((a, b) => a - b);
const meanOf = (values) => values.reduce((a, b) => a + b, 0) / values.length;
const medianOf = (values) => {
  const sorted = sortedCopy(values), mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
export function modesOf(values) {
  const counts = new Map();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  const top = Math.max(...counts.values());
  return { top, modes: top < 2 ? [] : [...counts].filter(([, c]) => c === top).map(([v]) => v).sort((a, b) => a - b) };
}

export function mount(root) {
  const scope = createScope();
  let preset = PRESETS[0], values = [...preset.values], step = 0;
  const show = { mode: true, median: true, mean: true };

  root.append(lead("Egy adatsorról sokszor elég három szám is, hogy képet kapjunk: melyik érték fordul elő a leggyakrabban (módusz), mi van pontosan középen, ha sorba rendezzük az adatokat (medián), és mennyi lenne mindenkinek, ha egyenlően osztanánk el (átlag)."));

  // ---- Card 1: editable dot plot ----
  const plotCard = card("Pontdiagram: kattintással szerkesztheted");
  const presetControls = controls();
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 250`, role: "img", "aria-label": "Pontdiagram az adatokról" }, plotCard);
  const plotLayer = svg("g", {}, figure);
  const toggles = controls();
  const summary = make("div", "il-formula start");
  const modeText = make("span"), medianText = make("span"), meanText = make("span");
  summary.append(modeText, make("br"), medianText, make("br"), meanText);
  const note = make("p", "il-message");
  plotCard.append(make("p", "il-muted", "Kattints egy szám fölé, hogy új pont kerüljön oda, egy pontra kattintva pedig leveszed."), presetControls, figure, toggles, summary, note);

  // ---- Card 2: median by pairing ----
  const pairCard = card("A medián megkeresése: párosával lecsípjük a két szélét");
  const rowFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 120`, role: "img", "aria-label": "Sorba rendezett adatok" }, pairCard);
  const rowLayer = svg("g", {}, rowFigure);
  const pairMessage = make("p", "il-message");
  const stepButton = button("Következő pár", () => advance());
  const playButton = button("Mutasd végig", playAll, { ghost: true });
  const resetButton = button("Újra", () => { scope.clearAll(); step = 0; updateRow(); }, { ghost: true });
  pairCard.append(make("p", "", "Rendezd sorba az adatokat, aztán mindig vedd el a legkisebbet és a legnagyobbat. Ami a végén marad, az a középső érték."), rowFigure, pairMessage, controls(stepButton, playButton, resetButton));

  root.append(plotCard, pairCard, keyIdea("a módusz a leggyakoribb érték, a medián a sorba rendezett adatok közepe, az átlag az egyenlő elosztás. Ha az adatok aszimmetrikusak (néhány nagyon nagy érték van), a három szám nagyon eltérhet egymástól, ezért mindig érdemes megnézni, melyik mond igazat."));

  const px = (v) => 50 + ((v - preset.min) / (preset.max - preset.min)) * (W - 100);

  function renderPresets() {
    presetControls.replaceChildren();
    PRESETS.forEach((item) => presetControls.append(toggle(item.label, item === preset, () => { preset = item; values = [...item.values]; changed(); }, undefined)));
    const toggleRow = [["mode", "Módusz", PALETTE.amber], ["median", "Medián", PALETTE.blue], ["mean", "Átlag", PALETTE.red]];
    toggles.replaceChildren(...toggleRow.map(([key, text, color]) => toggle(text, show[key], () => { show[key] = !show[key]; renderPlot(); renderToggles(); }, color)));
  }
  function renderToggles() { renderPresets(); }

  function renderPlot() {
    plotLayer.replaceChildren();
    const sorted = sortedCopy(values), n = values.length;
    const { top, modes } = modesOf(values), median = medianOf(values), mean = meanOf(values);
    svg("line", { x1: 30, x2: W - 30, y1: AXIS_Y, y2: AXIS_Y, class: "axis" }, plotLayer);
    const counts = {};
    for (let v = preset.min; v <= preset.max; v++) {
      svg("text", { x: px(v), y: AXIS_Y + 20, "text-anchor": "middle", text: String(v), style: "font-size:12px;fill:var(--dim)" }, plotLayer);
      const hit = svg("rect", { x: px(v) - 20, y: 10, width: 40, height: AXIS_Y - 6, fill: "transparent", style: "cursor:pointer" }, plotLayer);
      hit.addEventListener("click", () => {
        if (values.length >= MAX_VALUES || values.filter((x) => x === v).length >= MAX_STACK) return;
        values.push(v); changed();
      });
    }
    svg("text", { x: W - 30, y: 244, "text-anchor": "end", text: preset.unit, style: "font-size:12px;fill:var(--dim)" }, plotLayer);
    if (show.median) {
      svg("line", { x1: px(median), x2: px(median), y1: 34, y2: AXIS_Y, style: `stroke:${PALETTE.blue};stroke-width:2.5;stroke-dasharray:6 4` }, plotLayer);
      svg("text", { x: px(median), y: 26, "text-anchor": "middle", text: `medián ${formatNumber(median, 1)}`, style: `fill:${PALETTE.blue};font-weight:700` }, plotLayer);
    }
    sorted.forEach((v) => {
      const level = counts[v] = (counts[v] ?? 0) + 1;
      const isMode = show.mode && modes.includes(v);
      const dot = svg("circle", { cx: px(v), cy: AXIS_Y - 4 - level * 19 + 6, r: 8.5, style: `fill:${isMode ? PALETTE.amber : PALETTE.green};stroke:var(--input);stroke-width:2;cursor:pointer` }, plotLayer);
      dot.addEventListener("click", (event) => {
        event.stopPropagation();
        if (values.length <= 3) return;
        values.splice(values.lastIndexOf(v), 1); changed();
      });
    });
    if (show.mode && modes.length) {
      for (const v of modes) svg("text", { x: px(v), y: AXIS_Y - 4 - counts[v] * 19 - 8, "text-anchor": "middle", text: "módusz", style: `fill:${PALETTE.amber};font-weight:700;font-size:12px` }, plotLayer);
    }
    if (show.mean) {
      svg("path", { d: `M ${px(mean)} ${AXIS_Y + 3} l -9 15 h 18 Z`, style: `fill:${PALETTE.red}` }, plotLayer);
      svg("text", { x: px(mean), y: 228, "text-anchor": "middle", text: `átlag ${formatNumber(mean, 1)}`, style: `fill:${PALETTE.red};font-weight:700` }, plotLayer);
    }
    modeText.replaceChildren("módusz  = ", slot(modes.length ? `${modes.map(String).join(" és ")} (${top} db)` : "nincs (mindegyik érték egyszer szerepel)", 40, { align: "left" }));
    medianText.replaceChildren("medián  = ", slot(formatNumber(median, 1), 40, { align: "left" }));
    meanText.replaceChildren("átlag   = ", slot(formatNumber(mean, 2), 40, { align: "left" }));
    const spread = Math.max(Math.abs(mean - median), modes.length ? Math.abs(mean - modes[0]) : 0);
    note.className = `il-message ${spread > 1 ? "warn" : "good"}`;
    note.textContent = spread > 1
      ? "A három szám elég távol van egymástól. Ilyenkor az adatsor nem szimmetrikus: a nagy értékek felfelé húzzák az átlagot, de a legtöbb ember értéke ennél kisebb."
      : "A három szám közel van egymáshoz, az adatok nagyjából szimmetrikusan oszlanak el. Húzz fel néhány nagy értéket, és nézd meg, mi történik!";
  }

  // ---- pairing row ----
  let rowItems = [];
  const maxStep = () => Math.floor((values.length - 1) / 2);
  function buildRow() {
    rowLayer.replaceChildren();
    const sorted = sortedCopy(values), n = sorted.length, gap = Math.min(54, (W - 60) / Math.max(n - 1, 1)), left = (W - gap * (n - 1)) / 2;
    const arcs = [];
    for (let k = 0; k < maxStep(); k++) {
      const x1 = left + k * gap, x2 = left + (n - 1 - k) * gap, y = 30 + k * 3;
      arcs.push(svg("path", { d: `M ${x1} 62 Q ${(x1 + x2) / 2} ${y - 12 - k * 6} ${x2} 62`, fill: "none", style: "stroke:var(--line-strong);stroke-width:1.5;stroke-dasharray:4 4;opacity:0", class: "il-fade" }, rowLayer));
    }
    rowItems = sorted.map((v, i) => {
      const g = svg("g", { class: "il-fade" }, rowLayer);
      svg("circle", { cx: left + i * gap, cy: 75, r: 17, style: `fill:${PALETTE.green};stroke:var(--input);stroke-width:2` }, g);
      svg("text", { x: left + i * gap, y: 80, "text-anchor": "middle", text: String(v), style: "fill:#fff;font-weight:700" }, g);
      return { g, x: left + i * gap, arcs: null, value: v };
    });
    rowItems.arcs = arcs;
    rowItems.ring = svg("g", {}, rowLayer);
    rowItems.label = svg("text", { "text-anchor": "middle", y: 112, style: `fill:${PALETTE.blue};font-weight:700` }, rowLayer);
  }
  function updateRow() {
    const n = values.length, sorted = sortedCopy(values);
    rowItems.forEach((item, i) => item.g.style.opacity = i < step || i >= n - step ? "0.18" : "1");
    rowItems.arcs.forEach((arc, k) => arc.style.opacity = k < step ? "1" : "0");
    const done = step >= maxStep();
    rowItems.ring.replaceChildren();
    rowItems.label.textContent = "";
    if (done) {
      const keep = n % 2 ? [n >> 1] : [n / 2 - 1, n / 2];
      keep.forEach((i) => svg("circle", { cx: rowItems[i].x, cy: 75, r: 22, fill: "none", style: `stroke:${PALETTE.blue};stroke-width:3` }, rowItems.ring));
      rowItems.label.setAttribute("x", (rowItems[keep[0]].x + rowItems[keep.at(-1)].x) / 2);
      rowItems.label.textContent = "medián";
      const median = medianOf(values);
      pairMessage.className = "il-message good";
      pairMessage.textContent = n % 2
        ? `Egyetlen érték maradt: ${sorted[n >> 1]}. Ez a medián.`
        : `Két érték maradt: ${sorted[n / 2 - 1]} és ${sorted[n / 2]}. Páros számú adatnál a medián e kettő átlaga: ${formatNumber(median, 1)}.`;
    } else {
      pairMessage.className = "il-message";
      pairMessage.textContent = step === 0 ? `${n} adatunk van. Kattints a „Következő pár” gombra!` : `${step}. pár elvéve (a legkisebb és a legnagyobb). Még ${n - 2 * step} érték maradt.`;
    }
    stepButton.disabled = done;
    playButton.disabled = done;
  }
  function advance() { if (step < maxStep()) { step += 1; updateRow(); } }
  function playAll() {
    scope.clearAll();
    step = 0; updateRow();
    const tick = () => { if (step < maxStep()) { advance(); scope.timeout(tick, 800); } };
    scope.timeout(tick, 500);
  }

  function changed() {
    scope.clearAll();
    step = 0;
    renderPresets(); renderPlot(); buildRow(); updateRow();
  }

  changed();
  return () => scope.clearAll();
}
