import { card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const UNIT = 40, CX = 300, CY = 170;
const toView = ([x, y]) => [CX + x * UNIT, CY - y * UNIT];
const pointsOf = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const fmt = (vector) => `(${formatNumber(vector[0])}; ${formatNumber(vector[1])})`;

function addHandle(figure, parent, color, onMove) {
  const group = svg("g", { style: "cursor:grab;touch-action:none" }, parent);
  svg("circle", { r: 20, fill: "transparent" }, group);
  svg("circle", { r: 9, style: `fill:${color};stroke:var(--input);stroke-width:2.5` }, group);
  group.addEventListener("pointerdown", (event) => { group.setPointerCapture(event.pointerId); event.preventDefault(); });
  group.addEventListener("pointermove", (event) => {
    if (!group.hasPointerCapture(event.pointerId)) return;
    const point = figure.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(figure.getScreenCTM().inverse());
    onMove(local.x, local.y);
  });
  return { place(x, y) { group.setAttribute("transform", `translate(${x} ${y})`); } };
}

function arrow(parent, from, to, color, width = 3.5, dash = "0") {
  const [x1, y1] = toView(from), [x2, y2] = toView(to);
  svg("line", { x1, y1, x2, y2, style: `stroke:${color};stroke-width:${width};stroke-dasharray:${dash}` }, parent);
  const length = Math.hypot(x2 - x1, y2 - y1);
  if (length < 8) return;
  const ux = (x2 - x1) / length, uy = (y2 - y1) / length, size = 12;
  svg("polygon", { points: pointsOf([[x2, y2], [x2 - size * ux + size * 0.45 * uy, y2 - size * uy - size * 0.45 * ux], [x2 - size * ux - size * 0.45 * uy, y2 - size * uy + size * 0.45 * ux]]), style: `fill:${color}` }, parent);
}

const MODES = [{ key: "sum", name: "Összeadás: a + b" }, { key: "difference", name: "Kivonás: a − b" }, { key: "scalar", name: "Szorzás számmal: k · a" }];

export function mount(root) {
  const state = { mode: "sum", k: 2 };
  const a = [3, 1], b = [1, 2];

  root.append(lead("A vektor olyan nyíl, amelynek van hossza és iránya. Két vektort úgy adunk össze, hogy az egyik végpontjához odatesszük a másik kezdőpontját. Számmal úgy szorzunk, hogy a nyilat nyújtjuk, zsugorítjuk vagy megfordítjuk."));

  const main = card("Játssz a vektorokkal");
  const modeToggles = MODES.map((mode) => toggle(mode.name, mode.key === state.mode, () => { state.mode = mode.key; render(); }));
  const sliderK = range({ label: "k", min: -3, max: 3, step: 0.5, value: state.k, onInput: (value) => { state.k = value; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Két vektor a koordináta-rácson" });
  for (let i = -7; i <= 7; i++) svg("line", { class: i ? "grid" : "axis", x1: CX + i * UNIT, x2: CX + i * UNIT, y1: 0, y2: 340 }, figure);
  for (let i = -4; i <= 4; i++) svg("line", { class: i ? "grid" : "axis", x1: 0, x2: 600, y1: CY - i * UNIT, y2: CY - i * UNIT }, figure);
  const layer = svg("g", {}, figure);
  const handleA = addHandle(figure, figure, PALETTE.blue, (x, y) => { a[0] = clamp(Math.round((x - CX) / UNIT), -7, 7); a[1] = clamp(Math.round((CY - y) / UNIT), -4, 4); render(); });
  const handleB = addHandle(figure, figure, PALETTE.violet, (x, y) => { b[0] = clamp(Math.round((x - CX) / UNIT), -7, 7); b[1] = clamp(Math.round((CY - y) / UNIT), -4, 4); render(); });
  const readA = make("div"), readB = make("div"), readResult = make("div");
  const message = make("p", "il-message");
  main.append(controls(...modeToggles), controls(sliderK.element), figure, readA, readB, readResult, message);

  function label(point, text, color, dx = 10, dy = -10) {
    const [x, y] = toView(point);
    svg("text", { x: x + dx, y: y + dy, text, style: `font-weight:700;font-size:16px;fill:${color}` }, layer);
  }

  function render() {
    modeToggles.forEach((element, index) => element.setAttribute("aria-pressed", String(MODES[index].key === state.mode)));
    sliderK.element.style.opacity = state.mode === "scalar" ? 1 : 0.35;
    sliderK.input.disabled = state.mode !== "scalar";
    layer.replaceChildren();
    const zero = [0, 0];
    let result, resultName, text;
    if (state.mode === "sum") {
      result = [a[0] + b[0], a[1] + b[1]]; resultName = "a + b";
      arrow(layer, a, result, PALETTE.violet, 2, "6 5");
      arrow(layer, b, result, PALETTE.blue, 2, "6 5");
      arrow(layer, zero, a, PALETTE.blue);
      arrow(layer, a, result, PALETTE.violet);
      arrow(layer, zero, b, PALETTE.violet, 2.5);
      arrow(layer, zero, result, PALETTE.green, 4.5);
      text = "Két módon is megkapod az összeget: ha b nyilát a nyíl végéhez illeszted (fej-láb módszer), vagy ha az a és b által kifeszített paralelogramma átlóját rajzolod meg.";
    } else if (state.mode === "difference") {
      result = [a[0] - b[0], a[1] - b[1]]; resultName = "a − b";
      arrow(layer, zero, a, PALETTE.blue);
      arrow(layer, zero, b, PALETTE.violet);
      arrow(layer, b, a, PALETTE.green, 4.5);
      arrow(layer, zero, result, PALETTE.green, 2, "6 5");
      text = "a − b az a vektor, amely b végpontjából a végpontjába mutat. Ugyanez a vektor az origóból indítva a szaggatott nyíl. Másképp: a + (−b).";
    } else {
      result = [state.k * a[0], state.k * a[1]]; resultName = "k · a";
      arrow(layer, zero, a, PALETTE.blue, 2.5, "6 5");
      arrow(layer, zero, result, PALETTE.amber, 4.5);
      text = state.k === 0 ? "k = 0: az eredmény a nullvektor, amelynek hossza 0, és nincs iránya (csak egy pont)."
        : state.k === 1 ? "k = 1: a vektor nem változik."
          : state.k === -1 ? "k = −1: az ellentett vektor, amely ugyanolyan hosszú, de ellenkező irányú."
            : state.k < 0 ? `k negatív: a vektor megfordul, és a hossza ${formatNumber(Math.abs(state.k))}-szorosára változik.`
              : Math.abs(state.k) < 1 ? "0 és 1 között a vektor rövidül, az iránya megmarad." : `k = ${formatNumber(state.k)}: az irány marad, a hossz ${formatNumber(state.k)}-szeresére nő.`;
    }
    const isZero = result[0] === 0 && result[1] === 0;
    if (isZero) {
      const [x, y] = toView(zero);
      svg("circle", { cx: x, cy: y, r: 7, style: `fill:${PALETTE.green};stroke:var(--fg);stroke-width:2` }, layer);
      text = `${resultName} = 0: nullvektor, mert a nyíl visszaér a kiindulópontba. ${state.mode === "sum" ? "Ez akkor történik, ha b az a ellentettje." : ""}`;
    }
    label(a, "a", PALETTE.blue); label(b, "b", PALETTE.violet, 10, 20);
    const [ox, oy] = toView(zero);
    svg("text", { x: ox - 16, y: oy + 18, text: "O", style: "font-weight:700;fill:var(--fg)" }, layer);
    handleA.place(...toView(a)); handleB.place(...toView(b));
    readA.replaceChildren(equation("a", slot(fmt(a), 24, { align: "left" })));
    readB.replaceChildren(equation("b", slot(fmt(b), 24, { align: "left" })));
    readResult.replaceChildren(equation(resultName, slot(`${fmt(result)}${isZero ? "  (nullvektor)" : ""}`, 24, { align: "left" })));
    message.textContent = text;
  }

  root.append(main, keyIdea("vektorokat koordinátánként adunk össze és vonunk ki, számmal koordinátánként szorzunk: a + b = (a₁ + b₁; a₂ + b₂), k · a = (k · a₁; k · a₂). A nullvektor hossza 0, az a vektor ellentettje −a."));
  render();
  return () => {};
}
