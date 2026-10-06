import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, svg } from "./kit.js";

const CELL = 24, ORIGIN = 30, MAX_LEVEL = 4;
const LINE_X = 30, LINE_WIDTH = 540, LINE_Y = 80;

// Integer part of sqrt(A * 100^level) computed exactly, so no floating-point surprises.
function floorRootScaled(area, level) {
  const scaled = area * 100 ** level;
  let root = Math.floor(Math.sqrt(scaled));
  while ((root + 1) * (root + 1) <= scaled) root += 1;
  while (root * root > scaled) root -= 1;
  return root;
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Egy szám négyzetgyöke azt a nemnegatív számot jelenti, amelyet önmagával szorozva az eredeti számot kapjuk. Egy négyzet területéből így megkapod az oldalát: ha a terület 25, az oldal √25 = 5."));

  const state = { area: 20, level: 0 };

  // --- Square with area A ---
  const squareCard = card("Terület és oldalhossz");
  const areaSlider = range({ label: "A terület", min: 1, max: 100, value: state.area, format: String, onInput: (v) => { state.area = v; state.level = 0; render(); } });
  squareCard.append(controls(areaSlider.element));
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 300 290", role: "img", style: "max-width:420px" }, squareCard);
  for (let i = 0; i <= 10; i++) {
    svg("line", { x1: ORIGIN + i * CELL, x2: ORIGIN + i * CELL, y1: ORIGIN, y2: ORIGIN + 10 * CELL, class: "grid" }, figure);
    svg("line", { y1: ORIGIN + i * CELL, y2: ORIGIN + i * CELL, x1: ORIGIN, x2: ORIGIN + 10 * CELL, class: "grid" }, figure);
  }
  const square = svg("rect", { x: ORIGIN, y: ORIGIN, style: `fill:${PALETTE.blue};fill-opacity:.35;stroke-width:3` }, figure);
  const areaLabel = svg("text", { x: ORIGIN + 8, y: ORIGIN + 20, style: "font-weight:700;fill:var(--fg)" }, figure);
  const sideLabel = svg("text", { x: ORIGIN, y: ORIGIN - 10, style: "font-weight:700;fill:var(--fg)" }, figure);
  for (let i = 0; i <= 10; i += 2) svg("text", { x: ORIGIN + i * CELL, y: ORIGIN + 10 * CELL + 16, "text-anchor": "middle", text: String(i), style: "font-size:11px;fill:var(--dim)" }, figure);
  const squareMessage = make("p", "il-message");
  squareCard.append(squareMessage);

  // --- Zoomed number line ---
  const zoomCard = card("Hol van a négyzetgyök a számegyenesen?");
  zoomCard.append(make("p", "", "Ha nem négyzetszám, két egész közé szorítjuk, aztán egyre finomabban: minden nagyítás egy újabb tizedesjegyet ad."));
  const line = svg("svg", { class: "il-svg", viewBox: "0 0 600 150", role: "img" }, zoomCard);
  const lineLayer = svg("g", {}, line);
  const marker = svg("g", { class: "il-move" }, line);
  svg("path", { d: "M 0 -6 L -9 -24 L 9 -24 Z", style: `fill:${PALETTE.red}` }, marker);
  const markerText = svg("text", { y: -30, "text-anchor": "middle", style: `fill:${PALETTE.red};font-weight:700` }, marker);
  const zoomIn = button("Nagyítás", () => { state.level += 1; render(); });
  const zoomOut = button("Vissza", () => { state.level -= 1; render(); }, { ghost: true });
  const bracketLine = make("div", "il-formula start");
  const zoomMessage = make("p", "il-message");
  zoomCard.append(controls(zoomIn, zoomOut), bracketLine, zoomMessage);
  root.append(squareCard, zoomCard, keyIdea("a √A az a szám, amely négyzetre emelve A-t ad. Négyzetszámoknál ez egész szám, a többinél két egész közé esik, és tizedes tört alakja nem ér véget. Gyökvonáskor mindig a nemnegatív számot vesszük."));

  function render() {
    areaSlider.set(state.area);
    const { area, level } = state;
    const side = Math.sqrt(area);
    const perfect = Number.isInteger(side);
    square.setAttribute("width", side * CELL); square.setAttribute("height", side * CELL);
    square.style.stroke = perfect ? PALETTE.green : PALETTE.amber;
    areaLabel.textContent = `A = ${area}`;
    sideLabel.textContent = perfect ? `√${area} = ${side}` : `√${area} ≈ ${formatNumber(side, 3)}`;
    squareMessage.className = perfect ? "il-message good" : "il-message";
    squareMessage.textContent = perfect
      ? `${side} · ${side} = ${area}, ezért a négyzet oldala pontosan ${side}: az oldal a rácsvonalakra esik.`
      : `Az oldal ${Math.floor(side)} és ${Math.floor(side) + 1} között van, mert ${Math.floor(side)}² = ${Math.floor(side) ** 2} < ${area} < ${(Math.floor(side) + 1) ** 2} = ${Math.floor(side) + 1}². Nem esik rácsvonalra.`;

    // Zoom window at this level.
    const scale = 10 ** level;
    const low = floorRootScaled(area, level);
    const windowLow = perfect ? side * scale : low;
    const toValue = (integerUnits) => integerUnits / scale;
    const from = toValue(windowLow), to = toValue(windowLow + 1);
    lineLayer.replaceChildren();
    svg("line", { x1: LINE_X, x2: LINE_X + LINE_WIDTH, y1: LINE_Y, y2: LINE_Y, class: "axis" }, lineLayer);
    for (let i = 0; i <= 10; i++) {
      const x = LINE_X + (LINE_WIDTH * i) / 10;
      svg("line", { x1: x, x2: x, y1: LINE_Y - 7, y2: LINE_Y + 7, class: "axis" }, lineLayer);
      svg("text", { x, y: LINE_Y + 26, "text-anchor": "middle", text: formatNumber(from + (to - from) * i / 10, level + 1), style: "font-size:11px;fill:var(--dim)" }, lineLayer);
    }
    const position = perfect ? 0 : (side - from) / (to - from);
    marker.style.transform = `translate(${LINE_X + LINE_WIDTH * position}px, ${LINE_Y}px)`;
    markerText.textContent = `√${area}`;

    const digits = level;
    const lowSquare = (windowLow * windowLow) / 100 ** level, highSquare = ((windowLow + 1) * (windowLow + 1)) / 100 ** level;
    if (perfect) {
      bracketLine.textContent = `${formatNumber(side, 0)}² = ${area}`;
      zoomMessage.className = "il-message good";
      zoomMessage.textContent = "Itt a nagyítás nem változtat semmit: a négyzetgyök pontosan egy osztásvonalon áll.";
    } else {
      bracketLine.textContent = `${formatNumber(from, digits)}² = ${formatNumber(lowSquare, 2 * digits)} < ${area} < ${formatNumber(highSquare, 2 * digits)} = ${formatNumber(to, digits)}²`;
      zoomMessage.className = "il-message";
      zoomMessage.textContent = `A √${area} értéke ${formatNumber(from, digits)} és ${formatNumber(to, digits)} között van. ${level < MAX_LEVEL ? "Nagyíts rá még egyszer!" : `Közelítő érték: ${formatNumber(side, 4)}…, és sosem fejezhető be.`}`;
    }
    zoomIn.disabled = level >= MAX_LEVEL || perfect;
    zoomOut.disabled = level <= 0;
  }

  render();
  return () => scope.clearAll();
}
