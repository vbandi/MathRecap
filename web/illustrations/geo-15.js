import { button, card, controls, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const COLUMNS = 14, ROWS = 8, CELL = 40, ORIGIN = [20, 10];
const key = (column, row) => `${column},${row}`;

function toSvgPoint(figure, event) {
  const point = figure.createSVGPoint();
  point.x = event.clientX; point.y = event.clientY;
  const mapped = point.matrixTransform(figure.getScreenCTM().inverse());
  return [mapped.x, mapped.y];
}

// Number of unit edges on the boundary of the shape (edges next to an empty cell or the grid border).
export function measure(filled) {
  let perimeter = 0;
  for (const cell of filled) {
    const [c, r] = cell.split(",").map(Number);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!filled.has(key(c + dc, r + dr))) perimeter += 1;
  }
  return { area: filled.size, perimeter };
}

export function mount(root) {
  const state = { filled: new Set(), side: 1, showPerimeter: true, challenge: null, paint: null };
  for (let c = 2; c < 5; c++) for (let r = 2; r < 4; r++) state.filled.add(key(c, r));

  root.append(lead("A terület azt mondja meg, mennyi helyet foglal el egy alakzat, vagyis hány egységnyi négyzetlappal lehet lefedni. A kerület az alakzat széle mentén mért út hossza. Építs alakzatot négyzetlapokból, és figyeld, hogyan változik a kettő."));

  const main = card("Építs négyzetlapokból");
  const sideButtons = [[1, "1 cm oldalú lap (1 cm²)"], [2, "2 cm oldalú lap (4 cm²)"]].map(([side, text]) => toggle(text, side === state.side, () => { state.side = side; render(); }, PALETTE.blue));
  const perimeterToggle = toggle("Kerület kiemelése", state.showPerimeter, () => { state.showPerimeter = !state.showPerimeter; render(); }, PALETTE.amber);
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Négyzetrács, amelyen lapokat lehet ki- és bekapcsolni" });
  figure.style.touchAction = "none";
  const readout = make("div", "il-formula start");
  const note = make("p", "il-message");
  main.append(controls(...sideButtons, perimeterToggle, button("Törlés", () => { state.filled.clear(); render(); }, { ghost: true })), figure, readout, note,
    make("p", "il-muted", "Kattints egy mezőre, vagy húzd át az egeret (ujjad) több mezőn: a lap be- vagy kikapcsol."));

  const cellLayer = svg("g", {}, figure), edgeLayer = svg("g", { style: "pointer-events:none" }, figure);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLUMNS; c++) {
    svg("rect", { x: ORIGIN[0] + c * CELL, y: ORIGIN[1] + r * CELL, width: CELL, height: CELL, "data-cell": key(c, r) }, cellLayer);
  }
  const cellAt = (event) => {
    const [x, y] = toSvgPoint(figure, event), c = Math.floor((x - ORIGIN[0]) / CELL), r = Math.floor((y - ORIGIN[1]) / CELL);
    return c >= 0 && c < COLUMNS && r >= 0 && r < ROWS ? key(c, r) : null;
  };
  const apply = (cell) => {
    if (!cell || state.paint === null) return;
    if (state.paint) state.filled.add(cell); else state.filled.delete(cell);
    render();
  };
  figure.addEventListener("pointerdown", (event) => {
    const cell = cellAt(event);
    if (!cell) return;
    figure.setPointerCapture(event.pointerId);
    state.paint = !state.filled.has(cell);
    apply(cell);
  });
  figure.addEventListener("pointermove", (event) => { if (state.paint !== null) apply(cellAt(event)); });
  const stop = () => { state.paint = null; };
  figure.addEventListener("pointerup", stop);
  figure.addEventListener("pointercancel", stop);

  // --- Challenge ---
  const challenge = card("Kihívás: ugyanakkora terület, más kerület");
  const goal = make("p", "il-message");
  const newGoalButton = button("Új feladat", () => newGoal());
  challenge.append(make("p", "", "Két alakzatnak lehet ugyanakkora a területe, de különböző a kerülete. Teljesítsd a feladatot a fenti rácson!"), controls(newGoalButton), goal);

  root.append(main, challenge, keyIdea("a terület a lefedő egységnégyzetek száma, a kerület a határvonal hossza. Egyforma területű alakzatoknak különböző lehet a kerülete. A mérőszám a mértékegységtől is függ: ugyanaz a terület 4-szer annyi 1 cm²-es lappal fedhető, mint 4 cm²-essel."));

  function newGoal() {
    const area = 6 + Math.floor(Math.random() * 7), minimum = 2 * Math.ceil(2 * Math.sqrt(area)), maximum = 2 * area + 2;
    const options = [];
    for (let p = minimum; p <= maximum; p += 2) options.push(p);
    state.challenge = { area, perimeter: options[Math.floor(Math.random() * options.length)] };
    render();
  }

  function render() {
    const { area, perimeter } = measure(state.filled), side = state.side;
    sideButtons.forEach((b, i) => b.setAttribute("aria-pressed", String([1, 2][i] === side)));
    perimeterToggle.setAttribute("aria-pressed", String(state.showPerimeter));
    cellLayer.querySelectorAll("rect").forEach((rect) => {
      const on = state.filled.has(rect.dataset.cell);
      rect.style.cssText = `cursor:pointer;fill:${on ? PALETTE.blue : "transparent"};fill-opacity:${on ? 0.6 : 0};stroke:var(--line-strong);stroke-width:1`;
    });
    edgeLayer.replaceChildren();
    if (state.showPerimeter) {
      for (const cell of state.filled) {
        const [c, r] = cell.split(",").map(Number), x = ORIGIN[0] + c * CELL, y = ORIGIN[1] + r * CELL;
        const edges = [[1, 0, x + CELL, y, x + CELL, y + CELL], [-1, 0, x, y, x, y + CELL], [0, 1, x, y + CELL, x + CELL, y + CELL], [0, -1, x, y, x + CELL, y]];
        for (const [dc, dr, x1, y1, x2, y2] of edges) if (!state.filled.has(key(c + dc, r + dr))) svg("line", { x1, y1, x2, y2, style: `stroke:${PALETTE.amber};stroke-width:4;stroke-linecap:round` }, edgeLayer);
      }
    }
    svg("text", { x: 580, y: 334, "text-anchor": "end", text: `1 lap oldala = ${side} cm`, style: "font-size:12px;fill:var(--dim)" }, edgeLayer);
    readout.replaceChildren(
      "Terület: ", slot(String(area), 3), " lap = ", slot(make("b", "", formatNumber(area * side * side)), 4), " cm²", make("br"),
      "Kerület: ", slot(String(perimeter), 3), " él  = ", slot(make("b", "", formatNumber(perimeter * side)), 4), " cm");
    const otherSide = side === 1 ? 2 : 1, inOther = (area * side * side) / (otherSide * otherSide);
    note.className = "il-message";
    note.textContent = area === 0 ? "Még nincs lap. Kattints a rácsra!"
      : `Ugyanez a terület ${formatNumber(inOther)} darab ${otherSide} cm oldalú lappal fedhető le. A terület mérőszáma tehát attól függ, mekkora egységgel mérjük.`;
    if (!state.challenge) { goal.className = "il-message"; goal.textContent = "Kattints az Új feladat gombra."; return; }
    const { area: goalArea, perimeter: goalPerimeter } = state.challenge;
    const solved = area === goalArea && perimeter === goalPerimeter;
    goal.className = `il-message ${solved ? "good" : ""}`;
    goal.textContent = solved ? `Kész! ${goalArea} lapból sikerült ${goalPerimeter} egység kerületű alakzatot építeni.`
      : `Feladat: építs olyan alakzatot, amelynek a területe ${goalArea} lap, a kerülete ${goalPerimeter} egység. Most: terület ${area}, kerület ${perimeter}.`;
  }

  render();
  return () => {};
}
