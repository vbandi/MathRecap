import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const W = 720, X0 = 40, STEP = 64, BEAM_Y = 150, BLOCK = 26;
const MAX_VALUES = 12, MAX_STACK = 5;
const DATASETS = [[2, 3, 3, 6, 9], [1, 4, 5, 5, 8, 9], [6, 6, 7, 7, 8], [1, 1, 2, 10, 10]];

const px = (value) => X0 + value * STEP;
const meanOf = (values) => values.reduce((a, b) => a + b, 0) / values.length;
const medianOf = (values) => {
  const sorted = [...values].sort((a, b) => a - b), mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export function mount(root) {
  const scope = createScope();
  let values = [...DATASETS[0]], fulcrum = 2, datasetIndex = 0, dragging = false;

  root.append(lead("Az átlag az a szám, amelyet minden értéknek adhatnánk, hogy az összeg ne változzon. Képzeld el az adatokat súlyoknak egy számegyenesen: az átlag az a pont, ahol az egész rúd megtámasztva egyensúlyban marad."));

  // ---- Card 1: balance beam ----
  const balance = card("Keresd meg az egyensúlypontot");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 270`, role: "img", "aria-label": "Számegyenes súlyokkal és mozgatható támasszal" }, balance);
  const beam = svg("g", { class: "il-move", style: "transition-duration:.45s" }, figure);
  svg("rect", { x: X0 - 24, y: BEAM_Y, width: 10 * STEP + 48, height: 10, rx: 5, style: "fill:var(--dim)" }, beam);
  const blocks = svg("g", {}, beam);
  for (let v = 0; v <= 10; v++) {
    svg("line", { x1: px(v), x2: px(v), y1: BEAM_Y + 10, y2: BEAM_Y + 17, style: "stroke:var(--line-strong);stroke-width:1.5" }, beam);
  }
  const stand = svg("g", { style: "cursor:ew-resize", tabindex: 0, role: "slider", "aria-label": "Támasz helye", "aria-valuemin": 0, "aria-valuemax": 10 }, figure);
  const standShape = svg("path", { style: "fill:var(--accent);stroke:var(--bg);stroke-width:2" }, stand);
  const standHit = svg("rect", { y: BEAM_Y + 10, width: 60, height: 80, fill: "transparent" }, stand);
  const standLabel = svg("text", { y: BEAM_Y + 84, "text-anchor": "middle", style: "fill:var(--accent);font-weight:700" }, figure);
  const tickRow = svg("g", {}, figure);
  for (let v = 0; v <= 10; v++) {
    const cell = svg("g", { style: "cursor:pointer", role: "button", "aria-label": `Súly hozzáadása: ${v}` }, tickRow);
    svg("rect", { x: px(v) - STEP / 2 + 3, y: 236, width: STEP - 6, height: 28, rx: 8, style: "fill:var(--surface);stroke:var(--line)" }, cell);
    svg("text", { x: px(v), y: 255, "text-anchor": "middle", text: String(v) }, cell);
    cell.addEventListener("click", () => addValue(v));
  }
  const balanceMessage = make("p", "il-message");
  const sumLine = make("div", "il-formula start");
  const shuffleButton = button("Másik adatsor", () => { datasetIndex = (datasetIndex + 1) % DATASETS.length; values = [...DATASETS[datasetIndex]]; fulcrum = 0; renderAll(); }, { ghost: true });
  const solveButton = button("Mutasd az átlagot", () => moveFulcrumTo(meanOf(values)));
  balance.append(make("p", "il-muted", "Húzd a zöld támaszt a rúd alatt (vagy használd a nyílbillentyűket). Egy súlyra kattintva leveszed, a számra kattintva újat teszel a rúdra."), balanceMessage,
    controls(solveButton, shuffleButton), sumLine);

  // ---- Card 2: levelling ----
  const level = card("Kiegyenlítés: ugyanannyi jut mindenkinek");
  const levelFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 210`, role: "img", "aria-label": "Oszlopok kiegyenlítése az átlag magasságára" }, level);
  const levelLayer = svg("g", {}, levelFigure);
  const meanLine = svg("line", { x1: 20, x2: W - 20, style: "stroke:var(--ai);stroke-width:2;stroke-dasharray:6 5", opacity: 0 }, levelFigure);
  const meanLabel = svg("text", { x: W - 20, "text-anchor": "end", style: "fill:var(--ai);font-weight:700", opacity: 0 }, levelFigure);
  let levelProgress = 0, levelRunning = false;
  const levelButton = button("Kiegyenlítés", () => animateLevel(levelProgress < 0.5 ? 1 : 0));
  level.append(controls(levelButton), make("p", "il-muted", "A magas tornyokból átkerülnek kockák az alacsonyabbakra, amíg mindegyik ugyanolyan magas nem lesz. Ez a közös magasság az átlag."));

  // ---- Card 3: outlier ----
  const outlierCard = card("Amikor az átlag félrevezet");
  const base = [4, 5, 5, 6, 5];
  let outlier = 5;
  const outlierSlider = range({ label: "Hatodik érték:", min: 0, max: 40, step: 1, value: outlier, format: (n) => String(n), onInput: (n) => { outlier = n; renderOutlier(); } });
  const outlierFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 130`, role: "img", "aria-label": "Adatpontok és az átlag egy kiugró értékkel" }, outlierCard);
  const outlierLayer = svg("g", {}, outlierFigure);
  const outlierText = make("p", "il-message");
  outlierCard.append(make("p", "", "Öt barát zsebpénze (ezer Ft): 4, 5, 5, 6, 5. Hozzájön egy hatodik. Húzd a csúszkát, és figyeld az átlagot (narancs) és a középső értéket (kék)."),
    controls(outlierSlider.element), outlierFigure, outlierText);

  root.append(balance, level, outlierCard, keyIdea("az átlag az értékek összege osztva a darabszámmal, és egyben az egyensúlypont is. Egyetlen nagyon távoli érték messzire húzza, ilyenkor érdemes a középső értékre is ránézni."));

  // ---- balance beam rendering ----
  function addValue(v) {
    if (values.length >= MAX_VALUES || values.filter((x) => x === v).length >= MAX_STACK) return;
    values.push(v);
    renderAll();
  }
  function removeValue(v) {
    if (values.length <= 2) return;
    values.splice(values.lastIndexOf(v), 1);
    renderAll();
  }
  function snap(value) { return Math.round(Math.min(10, Math.max(0, value)) * 10) / 10; }
  function setFulcrum(value) {
    const mean = meanOf(values);
    fulcrum = snap(value);
    if (Math.abs(fulcrum - mean) <= 0.15 && dragging) fulcrum = snap(mean);
    renderBeam();
  }
  function moveFulcrumTo(target) {
    scope.clearAll();
    const from = fulcrum, to = Math.round(target * 10) / 10, start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 700), eased = 1 - (1 - t) ** 3;
      fulcrum = from + (to - from) * eased;
      renderBeam();
      if (t < 1) scope.frame(tick);
    };
    scope.frame(tick);
  }
  function svgX(event) {
    const box = figure.getBoundingClientRect();
    return ((event.clientX - box.left) / box.width) * W;
  }
  stand.addEventListener("pointerdown", (event) => { dragging = true; stand.setPointerCapture(event.pointerId); scope.clearAll(); });
  stand.addEventListener("pointermove", (event) => { if (dragging) setFulcrum((svgX(event) - X0) / STEP); });
  const stopDrag = () => { dragging = false; };
  stand.addEventListener("pointerup", stopDrag);
  stand.addEventListener("pointercancel", stopDrag);
  stand.addEventListener("keydown", (event) => {
    const delta = { ArrowLeft: -0.1, ArrowRight: 0.1 }[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    setFulcrum(fulcrum + delta);
  });

  function renderBeam() {
    const mean = meanOf(values), torque = values.length * (mean - fulcrum);
    const balanced = Math.abs(fulcrum - mean) < 0.05;
    const angle = balanced ? 0 : Math.max(-9, Math.min(9, torque * 1.2));
    const cx = px(fulcrum);
    beam.style.transform = `translate(${cx}px, ${BEAM_Y}px) rotate(${angle}deg) translate(${-cx}px, ${-BEAM_Y}px)`;
    const tipY = BEAM_Y + 10;
    standShape.setAttribute("d", `M ${cx} ${tipY} L ${cx - 24} ${tipY + 62} L ${cx + 24} ${tipY + 62} Z`);
    standHit.setAttribute("x", cx - 30);
    standLabel.setAttribute("x", cx);
    standLabel.textContent = `támasz: ${formatNumber(fulcrum, 1)}`;
    stand.setAttribute("aria-valuenow", fulcrum);
    const left = values.filter((v) => v < fulcrum).reduce((s, v) => s + (fulcrum - v), 0);
    const right = values.filter((v) => v > fulcrum).reduce((s, v) => s + (v - fulcrum), 0);
    balanceMessage.className = `il-message ${balanced ? "good" : ""}`;
    balanceMessage.textContent = balanced
      ? `Egyensúlyban! A támasz pontosan az átlagnál van: ${formatNumber(mean)}.`
      : `${torque > 0 ? "Jobbra" : "Balra"} billen: a támasztól ${torque > 0 ? "jobbra" : "balra"} lévő súlyok többet nyomnak (a távolságaik összege ${formatNumber(Math.max(left, right), 1)}, a másik oldalon csak ${formatNumber(Math.min(left, right), 1)}).`;
  }

  function renderAll() {
    blocks.replaceChildren();
    const stackCount = {};
    for (const v of values) {
      const level = stackCount[v] = (stackCount[v] ?? 0) + 1;
      const block = svg("rect", { x: px(v) - BLOCK / 2, y: BEAM_Y - level * (BLOCK + 2), width: BLOCK, height: BLOCK, rx: 5, style: `fill:${PALETTE.blue};stroke:var(--bg);stroke-width:2;cursor:pointer` }, blocks);
      block.addEventListener("click", () => removeValue(v));
    }
    const sum = values.reduce((a, b) => a + b, 0), mean = meanOf(values);
    sumLine.replaceChildren(`átlag = (${[...values].sort((a, b) => a - b).join(" + ")}) / ${values.length} = `, slot(`${sum} / ${values.length} = `, 8, { align: "left" }), slot(formatNumber(mean), 6, { align: "left" }));
    sumLine.lastChild.style.color = "var(--accent)";
    renderBeam();
    renderLevel();
  }

  // ---- levelling ----
  function renderLevel() {
    levelLayer.replaceChildren();
    const count = values.length, mean = meanOf(values), unit = 17, baseY = 190, gap = 8;
    const barWidth = Math.min(56, (W - 40) / count - gap), total = count * (barWidth + gap) - gap, left = (W - total) / 2;
    values.forEach((value, i) => {
      const shown = value + (mean - value) * levelProgress;
      const x = left + i * (barWidth + gap);
      svg("rect", { x, y: baseY - shown * unit, width: barWidth, height: shown * unit, rx: 4, style: `fill:${PALETTE.blue};opacity:.85` }, levelLayer);
      for (let k = 1; k < Math.ceil(shown); k++) svg("line", { x1: x, x2: x + barWidth, y1: baseY - k * unit, y2: baseY - k * unit, style: "stroke:var(--input);stroke-width:1.5" }, levelLayer);
      svg("text", { x: x + barWidth / 2, y: baseY - shown * unit - 6, "text-anchor": "middle", text: formatNumber(shown, 1), style: "font-weight:700" }, levelLayer);
    });
    svg("line", { x1: 20, x2: W - 20, y1: baseY, y2: baseY, class: "axis" }, levelLayer);
    meanLine.setAttribute("y1", baseY - mean * unit);
    meanLine.setAttribute("y2", baseY - mean * unit);
    meanLine.setAttribute("opacity", levelProgress > 0.02 ? 1 : 0);
    meanLabel.setAttribute("y", baseY - mean * unit - 6);
    meanLabel.textContent = `átlag = ${formatNumber(mean)}`;
    meanLabel.setAttribute("opacity", levelProgress > 0.02 ? 1 : 0);
    levelButton.textContent = levelProgress < 0.5 ? "Kiegyenlítés" : "Vissza az eredetihez";
  }
  function animateLevel(target) {
    if (levelRunning) return;
    levelRunning = true;
    const from = levelProgress, start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1100);
      levelProgress = from + (target - from) * (t * t * (3 - 2 * t));
      renderLevel();
      if (t < 1) scope.frame(tick); else levelRunning = false;
    };
    scope.frame(tick);
  }

  // ---- outlier ----
  function renderOutlier() {
    const all = [...base, outlier], mean = meanOf(all), median = medianOf(all), scale = (W - 60) / 40;
    const x = (v) => 30 + v * scale;
    outlierLayer.replaceChildren();
    svg("line", { x1: 30, x2: W - 30, y1: 80, y2: 80, class: "axis" }, outlierLayer);
    for (let v = 0; v <= 40; v += 5) svg("text", { x: x(v), y: 104, "text-anchor": "middle", text: String(v), style: "font-size:11px;fill:var(--dim)" }, outlierLayer);
    const seen = {};
    all.forEach((v, i) => {
      const level = seen[v] = (seen[v] ?? 0) + 1;
      svg("circle", { cx: x(v), cy: 80 - level * 15, r: 7, style: `fill:${i === 5 ? PALETTE.red : PALETTE.blue}` }, outlierLayer);
    });
    svg("path", { d: `M ${x(mean)} 82 l -8 14 h 16 Z`, style: `fill:${PALETTE.amber}` }, outlierLayer);
    svg("text", { x: x(mean), y: 122, "text-anchor": "middle", text: `átlag ${formatNumber(mean, 1)}`, style: `fill:${PALETTE.amber};font-weight:700` }, outlierLayer);
    svg("line", { x1: x(median), x2: x(median), y1: 20, y2: 80, style: `stroke:${PALETTE.blue};stroke-width:2;stroke-dasharray:4 3` }, outlierLayer);
    svg("text", { x: Math.min(x(median) + 6, W - 150), y: 18, text: `középső érték ${formatNumber(median, 1)}`, style: `fill:${PALETTE.blue};font-weight:700` }, outlierLayer);
    const shift = mean - meanOf(base);
    outlierText.className = `il-message ${shift > 3 ? "warn" : ""}`;
    outlierText.textContent = shift > 3
      ? `Az átlag ${formatNumber(mean, 1)} lett, pedig öt barátból négynek 6 ezer Ft vagy kevesebb van. Az átlag itt nem jellemzi jól a csoportot.`
      : `Az öt eredeti érték átlaga ${formatNumber(meanOf(base))}. A hatodik érték hatására az átlag ${formatNumber(mean, 1)} lett.`;
  }

  renderAll();
  renderOutlier();
  return () => scope.clearAll();
}
