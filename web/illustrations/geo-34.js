import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

const CELL = 30, LEGS = { a: 3, b: 2 };
const GROUND = 290, ORIGINAL_X = 30, ENLARGED_X = 180, VIEW = { width: 640, height: 320 };
const HYPOTENUSE = Math.hypot(LEGS.a, LEGS.b);
const PERIMETER = LEGS.a + LEGS.b + HYPOTENUSE, AREA = LEGS.a * LEGS.b / 2;

const point = (originX, x, y) => `${originX + x * CELL},${GROUND - y * CELL}`;

export function mount(root) {
  const state = { lambda: 2, tiled: false };

  root.append(lead("Ha egy alakzatot λ-szeresére nagyítunk, akkor minden hossza λ-szor nagyobb lesz. De vajon a kerülete és a területe is ugyanennyiszer nő? Próbáld ki egy négyzetrácson!"));

  const main = card("Nagyítsd a háromszöget");
  const lambdaSlider = range({ label: "λ", min: 1, max: 3, step: 0.5, value: state.lambda, onInput: (value) => { state.lambda = value; render(); } });
  const tileToggle = toggle("Kirakás az eredeti háromszög másolataival", state.tiled, () => { state.tiled = !state.tiled; render(); }, PALETTE.violet);
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, role: "img", "aria-label": "Háromszög és nagyítása négyzetrácson" });
  for (let x = 0; x <= VIEW.width; x += CELL) svg("line", { x1: x, y1: 0, x2: x, y2: VIEW.height, class: "grid" }, figure);
  for (let y = GROUND; y >= 0; y -= CELL) svg("line", { x1: 0, y1: y, x2: VIEW.width, y2: y, class: "grid" }, figure);
  const enlargedGroup = svg("g", {}, figure);
  const originalGroup = svg("g", {}, figure);
  const table = make("table", "il-table");
  const message = make("p", "il-message");
  main.append(controls(lambdaSlider.element, tileToggle), figure, table, message);
  root.append(main, keyIdea("λ-szoros nagyításnál a kerület λ-szeresére nő, a terület viszont λ²-szeresére, mert két irányban is nyúlik az alakzat. Kétszer akkora háromszögbe 4, háromszor akkorába 9 eredeti fér bele."));

  function render() {
    const { lambda, tiled } = state;
    const isWhole = Number.isInteger(lambda);
    tileToggle.setAttribute("aria-pressed", String(tiled));
    originalGroup.replaceChildren();
    enlargedGroup.replaceChildren();
    const outline = (parent, originX, scale, style) => svg("polygon", { points: [[0, 0], [LEGS.a * scale, 0], [0, LEGS.b * scale]].map(([x, y]) => point(originX, x, y)).join(" "), style }, parent);
    outline(originalGroup, ORIGINAL_X, 1, `fill:${PALETTE.red};fill-opacity:.55;stroke:${PALETTE.red};stroke-width:2.5`);
    svg("text", { x: ORIGINAL_X, y: GROUND + 22, text: `${LEGS.a} × ${LEGS.b}`, style: "font-weight:700;fill:var(--fg)" }, originalGroup);
    outline(enlargedGroup, ENLARGED_X, lambda, `fill:${PALETTE.blue};fill-opacity:${tiled && isWhole ? 0.08 : 0.3};stroke:${PALETTE.blue};stroke-width:2.5`);
    svg("text", { x: ENLARGED_X, y: GROUND + 22, text: `${formatNumber(LEGS.a * lambda)} × ${formatNumber(LEGS.b * lambda)}`, style: "font-weight:700;fill:var(--fg)" }, enlargedGroup);

    if (tiled && isWhole) {
      // Lattice points (i·a, j·b): upward copies are translates, downward ones are half-turned copies.
      const vertex = (i, j) => point(ENLARGED_X, i * LEGS.a, j * LEGS.b);
      const tile = (vertices, color) => svg("polygon", { points: vertices.map(([i, j]) => vertex(i, j)).join(" "), style: `fill:${color};fill-opacity:.6;stroke:var(--input);stroke-width:2` }, enlargedGroup);
      for (let i = 0; i < lambda; i++) {
        for (let j = 0; i + j < lambda; j++) {
          tile([[i, j], [i + 1, j], [i, j + 1]], PALETTE.red);
          if (i + j < lambda - 1) tile([[i + 1, j], [i, j + 1], [i + 1, j + 1]], PALETTE.violet);
        }
      }
    }

    const headerRow = make("tr");
    headerRow.append(make("th", "", ""), make("td", "", "eredeti"), make("td", "", "nagyított"), make("td", "", "szorzó"));
    const row = (heading, original, enlarged, factor) => {
      const tr = make("tr");
      tr.append(make("th", "", heading), ...[original, enlarged, factor].map((value) => make("td", "", value)));
      return tr;
    };
    table.replaceChildren(
      headerRow,
      row("Kerület", formatNumber(PERIMETER, 2), formatNumber(PERIMETER * lambda, 2), `×${formatNumber(lambda)}`),
      row("Terület", formatNumber(AREA), formatNumber(AREA * lambda * lambda, 2), `×${formatNumber(lambda * lambda, 2)}`),
    );
    message.className = `il-message ${tiled && isWhole ? "good" : ""}`;
    message.textContent = tiled && !isWhole
      ? "Törtszámú nagyításnál az eredeti háromszögek nem rakhatók ki pontosan. Válassz egész λ-t (1, 2 vagy 3)!"
      : tiled
        ? `A nagyított háromszögbe pontosan ${lambda * lambda} eredeti fér, ezért a terület ${lambda * lambda}-szeresére nőtt. A kerület viszont csak ${lambda}-szeresére, hiszen a hosszak ${lambda}-szeresére nőttek.`
        : `Minden oldal ${formatNumber(lambda)}-szeresére nőtt, így a kerület is. A terület ${formatNumber(lambda)} · ${formatNumber(lambda)} = ${formatNumber(lambda * lambda, 2)}-szeresére nőtt.`;
  }

  render();
  return () => {};
}
