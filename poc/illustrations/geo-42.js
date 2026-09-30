import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const VIEW = { width: 640, height: 310 }, CENTER = { x: 320, y: 270 }, RADIUS = 200;
const DEGREES = 180 / Math.PI, RADIANS = Math.PI / 180;

// Pointer-based dragging for an SVG element; onMove receives SVG user-space coordinates.
function makeDraggable(figure, handle, onMove) {
  handle.style.cursor = "grab";
  handle.style.touchAction = "none";
  const toSvg = (event) => {
    const point = figure.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(figure.getScreenCTM().inverse());
  };
  handle.addEventListener("pointerdown", (event) => { handle.setPointerCapture(event.pointerId); event.preventDefault(); });
  handle.addEventListener("pointermove", (event) => {
    if (handle.hasPointerCapture(event.pointerId)) { const p = toSvg(event); onMove(p.x, p.y); }
  });
}

export function mount(root) {
  const state = { mode: "sin", value: 0.5, beta: 100 };

  root.append(lead("Néha a szög ismeretlen, és csak azt tudjuk, mennyi a szinusza vagy a koszinusza. Ilyenkor az egységkörön megkeressük, melyik pontnak van éppen ekkora koordinátája. A zsebszámológép viszont egyetlen szöget ad vissza. Vajon mindig ez az egyetlen jó?"));

  const main = card("Melyik szög lehet?");
  const modeToggles = ["sin", "cos"].map((mode) => toggle(`${mode} α = érték`, mode === state.mode, () => {
    state.mode = mode;
    if (mode === "sin") state.value = Math.max(0, state.value);
    render();
  }));
  const valueSlider = range({ label: "érték", min: -1, max: 1, step: 0.05, value: state.value, format: (v) => formatNumber(v, 2), onInput: (value) => { state.value = value; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, role: "img", "aria-label": "Egységkör, benne a megadott értéket jelző egyenes" });
  const layer = svg("g", {}, figure);
  const handle = svg("circle", { r: 13, style: `fill:${PALETTE.amber};stroke:var(--fg);stroke-width:2` }, figure);
  makeDraggable(figure, handle, (x, y) => {
    const raw = state.mode === "sin" ? (CENTER.y - y) / RADIUS : (x - CENTER.x) / RADIUS;
    state.value = Math.round(Math.min(1, Math.max(state.mode === "sin" ? 0 : -1, raw)) * 20) / 20;
    render();
  });
  const calculator = make("div", "il-formula start");
  calculator.style.whiteSpace = "pre-wrap";
  const context = card("Melyik jó a háromszögben?");
  const betaSlider = range({ label: "a háromszög másik szöge (β)", min: 20, max: 160, step: 5, value: state.beta, format: (v) => `${v}°`, onInput: (value) => { state.beta = value; render(); } });
  const verdicts = [make("p", "il-message"), make("p", "il-message")];
  verdicts.forEach((line) => { line.style.minHeight = "1.6em"; });
  context.append(make("p", "", "Egy háromszög egyik szöge α, egy másik β. A szögeik összege 180°, ezért α + β < 180° kell legyen. Döntsd el ennek alapján, melyik jelölt használható."), controls(betaSlider.element), ...verdicts);
  main.append(controls(...modeToggles, valueSlider.element), figure, calculator);
  root.append(main, context, keyIdea("szinuszból két szög is következik: α és 180° − α, mert a két pont magassága ugyanakkora. A számológép csak a hegyesszögűt adja, a tompát te tudod kiszámolni, és a feladat adataiból (például a szögösszegből) döntheted el, melyik jó. A koszinusz 0° és 180° között egyértelmű."));

  function render() {
    const { mode, value, beta } = state;
    modeToggles.forEach((button, index) => button.setAttribute("aria-pressed", String(["sin", "cos"][index] === mode)));
    valueSlider.input.min = mode === "sin" ? 0 : -1;
    valueSlider.set(value);
    layer.replaceChildren();
    const toView = (x, y) => ({ x: CENTER.x + x * RADIUS, y: CENTER.y - y * RADIUS });
    const candidates = mode === "sin"
      ? (() => { const first = Math.asin(value) * DEGREES; return value === 0 || value === 1 ? (value === 1 ? [90] : [0, 180]) : [first, 180 - first]; })()
      : [Math.acos(value) * DEGREES];
    svg("line", { x1: 40, y1: CENTER.y, x2: 600, y2: CENTER.y, class: "axis" }, layer);
    svg("line", { x1: CENTER.x, y1: CENTER.y, x2: CENTER.x, y2: 40, class: "axis" }, layer);
    svg("path", { d: `M ${CENTER.x - RADIUS} ${CENTER.y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER.x + RADIUS} ${CENTER.y}`, fill: "none", style: "stroke:var(--fg-soft);stroke-width:2" }, layer);
    const isSin = mode === "sin";
    const lineStyle = `stroke:${PALETTE.amber};stroke-width:3;stroke-dasharray:8 5`;
    if (isSin) {
      const y = toView(0, value).y;
      svg("line", { x1: 40, y1: y, x2: 600, y2: y, style: lineStyle }, layer);
      handle.setAttribute("cx", 590); handle.setAttribute("cy", y);
    } else {
      const x = toView(value, 0).x;
      svg("line", { x1: x, y1: CENTER.y + 4, x2: x, y2: 30, style: lineStyle }, layer);
      handle.setAttribute("cx", x); handle.setAttribute("cy", CENTER.y + 22);
    }
    const colors = [PALETTE.green, PALETTE.pink];
    candidates.forEach((degrees, index) => {
      const p = toView(Math.cos(degrees * RADIANS), Math.sin(degrees * RADIANS)), origin = toView(0, 0);
      svg("line", { x1: origin.x, y1: origin.y, x2: p.x, y2: p.y, style: `stroke:${colors[index]};stroke-width:2.5` }, layer);
      const radius = 34 + index * 12;
      svg("path", { d: `M ${origin.x + radius} ${origin.y} A ${radius} ${radius} 0 0 0 ${origin.x + radius * Math.cos(degrees * RADIANS)} ${origin.y - radius * Math.sin(degrees * RADIANS)}`, fill: "none", style: `stroke:${colors[index]};stroke-width:3` }, layer);
      svg("circle", { cx: p.x, cy: p.y, r: 7, style: `fill:${colors[index]};stroke:var(--fg);stroke-width:1.5` }, layer);
      svg("text", { x: p.x + (p.x >= CENTER.x ? 12 : -12), y: p.y - 10, "text-anchor": p.x >= CENTER.x ? "start" : "end", text: `${formatNumber(degrees, 1)}°`, style: `font-weight:800;fill:${colors[index]}` }, layer);
    });
    const name = isSin ? "sin" : "cos";
    const calc = make("span");
    calc.append(`zsebszámológép: ${name}⁻¹(`, slot(formatNumber(value, 2), 5), ") = ", slot(make("b", "", `${formatNumber(candidates[0], 1)}°`), 7));
    const second = make("span");
    second.append(isSin ? "de az egységkörön van még egy pont: 180° − " : "a koszinusznál nincs második pont: ", slot(isSin ? `${formatNumber(candidates[0], 1)}°` : "", 7), isSin ? " = " : "", slot(make("b", "", isSin && candidates[1] !== undefined ? `${formatNumber(candidates[1], 1)}°` : ""), 7));
    if (isSin && candidates.length === 1) second.style.opacity = 0.4;
    calculator.replaceChildren(calc, make("br"), second);

    const verdictFor = (degrees, line, color) => {
      if (degrees === undefined) { line.className = "il-message"; line.textContent = ""; return; }
      const sum = degrees + beta, ok = sum < 180;
      line.className = `il-message ${ok ? "good" : "warn"}`;
      line.style.color = "";
      line.textContent = `α = ${formatNumber(degrees, 1)}°: ${formatNumber(degrees, 1)}° + ${beta}° = ${formatNumber(sum, 1)}° ${ok ? "< 180°, tehát lehetséges." : "≥ 180°, tehát nem lehet a háromszög szöge."}`;
    };
    verdictFor(candidates[0], verdicts[0]);
    verdictFor(candidates[1], verdicts[1]);
    if (candidates[1] === undefined) verdicts[1].textContent = isSin ? "" : "A koszinusz 0° és 180° között minden értéket csak egyszer vesz fel, így nincs mit eldönteni.";
  }

  render();
  return () => {};
}
