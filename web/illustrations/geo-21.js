import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const UNIT = 40, GROUND = 150, START_X = 40, ROLL_MS = 3800;
const SEGMENT_COLORS = [PALETTE.blue, PALETTE.violet, PALETTE.pink, PALETTE.green];

export function mount(root) {
  const scope = createScope();
  const state = { d: 2, progress: 0, rolling: false, n: 4, rearranged: false };

  root.append(lead("Ha egy kör alakú kereket egyszer körbegörgetsz, pontosan a kerületének megfelelő utat teszi meg. A kerület és az átmérő hányadosa mindig ugyanaz a szám: π ≈ 3,14."));

  // --- Card 1: circumference ---
  const roll = card("Kerület: a kerék kigurítja magát");
  const sliderD = range({ label: "d (átmérő)", min: 1, max: 3, step: 0.5, value: state.d, onInput: (value) => { state.d = value; reset(); } });
  const rollButton = button("Gurítsd!", startRoll);
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 230", role: "img", "aria-label": "Kerék, amely kigurítja a kerületét egy egyenesre" });
  svg("line", { x1: 10, x2: 590, y1: GROUND, y2: GROUND, class: "axis" }, figure);
  const segmentLayer = svg("g", {}, figure);
  const wheel = svg("g", {}, figure);
  const wheelCircle = svg("circle", { style: `fill:${PALETTE.blue};fill-opacity:.25;stroke:var(--fg);stroke-width:2.5` }, wheel);
  const spoke = svg("line", { style: "stroke:var(--fg-soft);stroke-width:1.5" }, wheel);
  const marker = svg("circle", { r: 6, style: `fill:${PALETTE.red}` }, wheel);
  const labelLayer = svg("g", {}, figure);
  const circumferenceLine = make("div"), travelLine = make("div");
  const rollMessage = make("p", "il-message");
  roll.append(controls(sliderD.element, rollButton), figure, circumferenceLine, travelLine, rollMessage);

  function reset() {
    scope.clearAll();
    state.progress = 0; state.rolling = false;
    rollButton.disabled = false;
    renderRoll();
  }

  function startRoll() {
    scope.clearAll();
    state.progress = 0; state.rolling = true;
    rollButton.disabled = true;
    let startTime = null;
    const step = (time) => {
      startTime ??= time;
      state.progress = Math.min(1, (time - startTime) / ROLL_MS);
      if (state.progress >= 1) { state.rolling = false; rollButton.disabled = false; } else scope.frame(step);
      renderRoll();
    };
    scope.frame(step);
    renderRoll();
  }

  function renderRoll() {
    const { d, progress } = state, r = d / 2;
    const theta = 2 * Math.PI * progress;
    const distance = r * theta; // in units
    const cx = START_X + distance * UNIT, cy = GROUND - r * UNIT;
    wheelCircle.setAttribute("cx", cx); wheelCircle.setAttribute("cy", cy); wheelCircle.setAttribute("r", r * UNIT);
    const mx = cx - r * UNIT * Math.sin(theta), my = cy + r * UNIT * Math.cos(theta);
    spoke.setAttribute("x1", cx); spoke.setAttribute("y1", cy); spoke.setAttribute("x2", mx); spoke.setAttribute("y2", my);
    marker.setAttribute("cx", mx); marker.setAttribute("cy", my);
    segmentLayer.replaceChildren();
    labelLayer.replaceChildren();
    // The unrolled path is cut into pieces as long as the diameter.
    for (let k = 0; k * d < distance; k++) {
      const from = k * d, to = Math.min(distance, (k + 1) * d), full = to - from >= d - 1e-9;
      svg("line", { x1: START_X + from * UNIT, x2: START_X + to * UNIT, y1: GROUND + 14, y2: GROUND + 14, style: `stroke:${full ? SEGMENT_COLORS[k % 4] : PALETTE.amber};stroke-width:10;stroke-linecap:butt` }, segmentLayer);
      if (full) svg("text", { x: START_X + (from + to) / 2 * UNIT, y: GROUND + 42, "text-anchor": "middle", text: "d", style: "font-weight:700;font-style:italic;fill:var(--fg)" }, labelLayer);
    }
    if (progress >= 1) {
      const whole = Math.floor(Math.PI);
      svg("text", { x: START_X + (whole * d + (Math.PI - whole) * d / 2) * UNIT, y: GROUND + 42, "text-anchor": "middle", text: `${formatNumber(Math.PI - whole, 2)} d`, style: `font-weight:700;fill:${PALETTE.amber}` }, labelLayer);
    }
    circumferenceLine.replaceChildren(equation("K = π · d", slot(`≈ 3,14 · ${formatNumber(d)} = ${formatNumber(Math.PI * d, 2)}`, 24, { align: "left" })));
    travelLine.replaceChildren(equation("a kerék útja", slot(formatNumber(distance, 2), 24, { align: "left" })));
    rollMessage.className = `il-message ${progress >= 1 ? "good" : ""}`;
    rollMessage.textContent = progress >= 1
      ? `Egy fordulat után a kerék útja ${formatNumber(Math.PI * d, 2)} egység: 3 teljes átmérő és még 0,14 átmérőnyi. Bármekkora a kerék, ugyanez igaz.`
      : state.rolling ? "A piros pont a kerék szélén van. Amikor újra leér a földre, a kerék pontosan egyszer fordult körbe." : "Nyomd meg a gombot, és figyeld, milyen hosszú utat tesz meg egy fordulat alatt. Közben az utat az átmérő hosszú darabokra vágjuk.";
  }

  // --- Card 2: area ---
  const area = card("Terület: szeletelés és átrendezés");
  const sliderN = range({ label: "n (a szeletek száma 2n)", min: 2, max: 12, value: state.n, onInput: (value) => { state.n = value; buildSlices(); } });
  const rearrangeButton = button("Átrendezés", () => { state.rearranged = !state.rearranged; applySlices(); });
  const sliceFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 300", role: "img", "aria-label": "Körcikkekre vágott kör átrendezése" });
  const pieceLayer = svg("g", {}, sliceFigure);
  const brace = svg("g", { class: "il-fade", opacity: 0 }, sliceFigure);
  const countLine = make("div"), areaLine = make("div");
  const sliceMessage = make("p", "il-message");
  area.append(controls(sliderN.element, rearrangeButton), sliceFigure, countLine, areaLine, sliceMessage);

  let pieces = [];
  function buildSlices() {
    const count = 2 * state.n, r = 80, theta = 2 * Math.PI / count;
    const arc = r * theta, x0 = 240;
    pieceLayer.replaceChildren();
    brace.replaceChildren();
    const half = theta / 2;
    const d = `M 0 0 L ${r * Math.cos(-half)} ${r * Math.sin(-half)} A ${r} ${r} 0 0 1 ${r * Math.cos(half)} ${r * Math.sin(half)} Z`;
    pieces = Array.from({ length: count }, (_, i) => {
      const element = svg("path", { d, class: "il-move", style: `fill:${i % 2 ? PALETTE.violet : PALETTE.blue};fill-opacity:.8;stroke:var(--input);stroke-width:1.5` }, pieceLayer);
      const circle = `translate(120px, 150px) rotate(${i * 360 / count}deg)`;
      const row = i % 2 === 0 ? `translate(${x0 + arc / 2 + i * arc / 2}px, 110px) rotate(90deg)` : `translate(${x0 + arc / 2 + i * arc / 2}px, 190px) rotate(-90deg)`;
      return { element, circle, row };
    });
    const width = (count + 1) * arc / 2;
    svg("line", { x1: x0, x2: x0 + width, y1: 214, y2: 214, style: "stroke:var(--fg);stroke-width:2" }, brace);
    svg("text", { x: x0 + width / 2, y: 236, "text-anchor": "middle", text: "kb. π · r (a kerület fele)", style: "font-weight:700;fill:var(--fg)" }, brace);
    svg("line", { x1: x0 + width + 10, x2: x0 + width + 10, y1: 110, y2: 190, style: "stroke:var(--fg);stroke-width:2" }, brace);
    svg("text", { x: x0 + width + 20, y: 155, text: "r", style: "font-weight:700;font-style:italic;fill:var(--fg)" }, brace);
    applySlices(true);
  }

  function applySlices(instant = false) {
    pieces.forEach(({ element, circle, row }) => {
      if (instant) element.style.transition = "none";
      element.style.transform = state.rearranged ? row : circle;
    });
    if (instant) scope.frame(() => scope.frame(() => pieces.forEach(({ element }) => { element.style.transition = ""; })));
    brace.setAttribute("opacity", state.rearranged ? 1 : 0);
    rearrangeButton.textContent = state.rearranged ? "Vissza körré" : "Átrendezés";
    countLine.replaceChildren(equation(`${2 * state.n} szelet`, slot(`egy szelet: a kör 1/${2 * state.n} része`, 34, { align: "left", dim: true })));
    areaLine.replaceChildren(equation("T ≈ r · π · r", slot("= π · r²", 34, { align: "left" })));
    sliceMessage.textContent = state.rearranged
      ? "A szeletek majdnem téglalapot adnak: a magasságuk r, a szélességük a kerület fele, azaz π · r. Több szeletnél a szélek egyre simábbak, és a téglalap egyre pontosabb."
      : `A kört ${2 * state.n} egyforma körcikkre vágtuk. Nyomd meg az átrendezést, és nézd meg, milyen alakzat lesz belőlük. Próbáld kevesebb és több szelettel is.`;
  }

  root.append(roll, area, keyIdea("a kör kerülete K = π · d = 2 · π · r, a területe T = π · r². Mindkettőben ugyanaz a π ≈ 3,14 szerepel."));
  renderRoll();
  buildSlices();
  return () => scope.clearAll();
}
