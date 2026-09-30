import { card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const W = 720, CELL = 46, GX = 70, GY = 34;
const EVENTS = [
  { id: "sum7", label: "az összeg 7", test: (a, b) => a + b === 7 },
  { id: "double", label: "dupla (két egyforma szám)", test: (a, b) => a === b },
  { id: "first6", label: "az első kocka 6-os", test: (a) => a === 6 },
  { id: "big", label: "az összeg legalább 10", test: (a, b) => a + b >= 10 },
  { id: "even", label: "az összeg páros", test: (a, b) => (a + b) % 2 === 0 },
];
const OPERATIONS = [
  { id: "A", label: "A", test: (a) => a, name: "az A esemény" },
  { id: "B", label: "B", test: (a, b) => b, name: "a B esemény" },
  { id: "and", label: "A és B", test: (a, b) => a && b, name: "A és B: a metszet, a közös elemek" },
  { id: "or", label: "A vagy B", test: (a, b) => a || b, name: "A vagy B: az unió, az összes elem, amely legalább az egyikben benne van" },
  { id: "notA", label: "nem A", test: (a) => !a, name: "nem A: az A komplementere, minden más elem" },
];

export function mount(root) {
  const scope = createScope();
  let eventA = EVENTS[0], eventB = EVENTS[1], operation = OPERATIONS[0], selected = null;

  root.append(lead("Ha két kockával dobunk, 36-féle dobáspár lehetséges: ezek az elemi események, és együtt az eseményteret alkotják. Egy esemény az elemi események egy része, például minden olyan pár, amelynek összege 7. Az eseményekből újakat is készíthetünk: és, vagy, nem."));

  const main = card("Az eseménytér: 6 × 6 dobáspár");
  const aControls = controls(), bControls = controls(), opControls = controls();
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 330`, role: "img", "aria-label": "A két kockadobás 36 lehetséges eredménye" }, main);
  const cells = [];
  svg("text", { x: GX + 3 * CELL, y: 18, "text-anchor": "middle", text: "a második kocka", style: "font-size:12px;fill:var(--dim)" }, figure);
  svg("text", { x: 22, y: GY + 3 * CELL, "text-anchor": "middle", text: "első", style: "font-size:12px;fill:var(--dim)" }, figure);
  for (let i = 1; i <= 6; i++) {
    svg("text", { x: GX + (i - 0.5) * CELL, y: GY - 4, "text-anchor": "middle", text: String(i), style: "font-weight:700" }, figure);
    svg("text", { x: GX - 10, y: GY + (i - 0.5) * CELL + 5, "text-anchor": "end", text: String(i), style: "font-weight:700" }, figure);
  }
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
    const g = svg("g", { style: "cursor:pointer" }, figure);
    const rect = svg("rect", { x: GX + (b - 1) * CELL + 2, y: GY + (a - 1) * CELL + 2, width: CELL - 4, height: CELL - 4, rx: 7 }, g);
    const text = svg("text", { x: GX + (b - 0.5) * CELL, y: GY + (a - 0.5) * CELL + 4, "text-anchor": "middle", text: `${a};${b}`, style: "font-size:12px" }, g);
    g.addEventListener("click", () => { selected = selected && selected[0] === a && selected[1] === b ? null : [a, b]; render(); });
    cells.push({ a, b, rect, text });
  }
  const legendX = GX + 6 * CELL + 40;
  [["Kék keret: az A esemény", PALETTE.blue], ["Narancs keret: a B esemény", PALETTE.amber], ["Zöld kitöltés: a kiválasztott művelet eredménye", PALETTE.green]].forEach(([text, color], i) => {
    svg("rect", { x: legendX, y: 50 + i * 40, width: 18, height: 18, rx: 4, style: `fill:${i === 2 ? color : "none"};stroke:${color};stroke-width:3` }, figure);
    const words = text.split(": ");
    svg("text", { x: legendX + 28, y: 57 + i * 40, text: words[0] + ":", style: "font-weight:700;font-size:12px" }, figure);
    svg("text", { x: legendX + 28, y: 73 + i * 40, text: words[1], style: "font-size:12px" }, figure);
  });
  const selectedLine = make("p", "il-message");
  const countA = make("span"), countB = make("span"), countResult = make("span");
  const numbers = make("div", "il-formula start");
  numbers.append(countA, make("br"), countB, make("br"), countResult);
  main.append(make("p", "il-muted", "Kattints egy mezőre, hogy lásd az elemi eseményt. Válassz két eseményt (A és B), majd egy műveletet."), aControls, bControls, opControls, figure, selectedLine, numbers);

  root.append(main, keyIdea("az elemi események az eseménytér pontjai, az esemény ezek részhalmaza. Az „és” a közös részt, a „vagy” az egyesítést, a „nem” a komplementert (a többi elemet) jelenti."));

  function render() {
    aControls.replaceChildren(make("span", "", "A esemény:"), ...EVENTS.map((e) => toggle(e.label, e === eventA, () => { eventA = e; render(); }, PALETTE.blue)));
    bControls.replaceChildren(make("span", "", "B esemény:"), ...EVENTS.map((e) => toggle(e.label, e === eventB, () => { eventB = e; render(); }, PALETTE.amber)));
    opControls.replaceChildren(make("span", "", "Művelet:"), ...OPERATIONS.map((o) => toggle(o.label, o === operation, () => { operation = o; render(); }, PALETTE.green)));
    let a = 0, b = 0, r = 0;
    cells.forEach((cell) => {
      const inA = eventA.test(cell.a, cell.b), inB = eventB.test(cell.a, cell.b), inR = Boolean(operation.test(inA, inB));
      a += inA; b += inB; r += inR;
      const isSelected = selected && selected[0] === cell.a && selected[1] === cell.b;
      cell.rect.setAttribute("style", `fill:${inR ? PALETTE.green : "var(--surface)"};fill-opacity:${inR ? 0.75 : 1};stroke:${isSelected ? "var(--fg)" : inA ? PALETTE.blue : inB ? PALETTE.amber : "var(--line)"};stroke-width:${isSelected ? 4 : inA || inB ? 3.5 : 1}`);
      cell.text.setAttribute("style", `font-size:12px;fill:${inR ? "#fff" : "var(--fg-soft)"};font-weight:${inA || inB ? 700 : 400}`);
    });
    selectedLine.className = "il-message";
    selectedLine.textContent = selected
      ? `Elemi esemény: az első kockán ${selected[0]}, a másodikon ${selected[1]}. Ez 1 elem a 36 közül, tehát valószínűsége 1/36.`
      : "";
    countA.replaceChildren("A: ", slot(String(a), 3), " elem     ");
    countB.replaceChildren("B: ", slot(String(b), 3), " elem     ");
    countResult.replaceChildren(slot(`${operation.label}:`, 9, { align: "left" }), slot(String(r), 3), ` elem, P = `, slot(`${r}/36 = ${formatNumber(r / 36, 3)}`, 16, { align: "left" }));
    if (operation.id === "and" && eventA === eventB) selectedLine.textContent = "Az A és B ugyanaz az esemény, ezért a közös rész maga az esemény.";
  }

  render();
  return () => scope.clearAll();
}
