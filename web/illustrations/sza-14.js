import { button, card, controls, createScope, formatNumber, fraction, keyIdea, lead, make, PALETTE, range, rich, svg, toggle } from "./kit.js";

const COLUMNS = [
  { name: "százasok", value: 100 }, { name: "tízesek", value: 10 }, { name: "egyesek", value: 1 },
  { name: "tizedek", value: 0.1 }, { name: "századok", value: 0.01 }, { name: "ezredek", value: 0.001 },
];
const PAIRS = [[50, 50.0], [30, 25], [7, 70], [40, 38], [6, 60], [9, 89]]; // hundredths; the first pair is written 0,5 and 0,50
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// 10 x 10 square; the first `count` small squares are filled strip by strip (full strips blue, loose squares amber).
function drawSquare(parent, x0, y0, size, count) {
  const cell = size / 10;
  for (let k = 0; k < 100; k++) {
    const column = Math.floor(k / 10), row = k % 10, filled = k < count, strip = column < Math.floor(count / 10);
    svg("rect", { x: x0 + column * cell + 1, y: y0 + row * cell + 1, width: cell - 2, height: cell - 2, rx: 2, style: `fill:${filled ? (strip ? PALETTE.blue : PALETTE.amber) : "var(--surface)"};stroke:var(--line);stroke-width:1` }, parent);
  }
}
const hundredthsText = (count) => formatNumber(count / 100, 2);

export function mount(root) {
  const scope = createScope();
  root.append(lead("A tizedes tört ugyanaz a helyiértékes írásmód, mint az egész számoknál, csak a tizedesvessző után tovább folytatódik: minden hellyel jobbra tízszer kisebb az érték. Így a törtrészek is pontosan leírhatók."));

  // --- Place-value table ---
  const table = card("Helyiértéktábla tizedesjegyekkel");
  const digits = [0, 1, 2, 3, 4, 5];
  const grid = make("table", "il-table");
  grid.style.cssText = "width:100%;table-layout:fixed;font-size:14px";
  const rowNames = ["hely", "helyi érték", "számjegy", "valódi érték"], rows = rowNames.map((name) => { const tr = make("tr"), th = make("td", "", name); th.style.cssText = "width:12ch;text-align:left;color:var(--dim)"; tr.append(th); grid.append(tr); return tr; });
  const cells = COLUMNS.map((column, index) => {
    const name = make("td", "", column.name), place = make("td", "", formatNumber(column.value)), real = make("td");
    const up = make("button", "", "▲"), down = make("button", "", "▼"), digit = make("b", "", "0"), box = make("span", "il-stepper"), shape = make("td");
    up.type = down.type = "button";
    up.setAttribute("aria-label", `${column.name} számjegyének növelése`); down.setAttribute("aria-label", `${column.name} számjegyének csökkentése`);
    up.addEventListener("click", () => { digits[index] = (digits[index] + 1) % 10; renderTable(); });
    down.addEventListener("click", () => { digits[index] = (digits[index] + 9) % 10; renderTable(); });
    box.style.cssText = "flex-direction:column;gap:2px"; up.style.height = down.style.height = "20px";
    box.append(up, digit, down); shape.append(box);
    for (const cell of [name, place, shape, real]) { cell.style.cssText = "text-align:center;width:auto;font-size:12px"; }
    name.style.fontSize = "11px";
    if (index === 3) for (const cell of [name, place, shape, real]) cell.style.borderLeft = "3px solid var(--accent)";
    [name, place, shape, real].forEach((cell, r) => rows[r].append(cell));
    return { digit, real };
  });
  const bigNumber = make("div", "il-formula start"), decomposition = make("p", "il-message");
  bigNumber.style.fontSize = "28px";
  // A comma is drawn between the units and the tenths.
  table.append(bigNumber, grid, decomposition);
  function renderTable() {
    const whole = digits[0] * 100 + digits[1] * 10 + digits[2], frac = digits[3] * 100 + digits[4] * 10 + digits[5];
    bigNumber.textContent = `${whole},${String(frac).padStart(3, "0")}`;
    const parts = [];
    digits.forEach((digit, index) => { if (digit) parts.push(formatNumber(digit * COLUMNS[index].value)); });
    decomposition.className = "il-message good";
    decomposition.textContent = `${bigNumber.textContent} = ${parts.join(" + ") || "0"}${frac ? `. A tizedesvessző utáni rész: ${frac}/1000.` : ""}`;
    digits.forEach((digit, index) => { cells[index].digit.textContent = digit; cells[index].digit.style.opacity = digit ? 1 : 0.35; cells[index].real.textContent = digit ? formatNumber(digit * COLUMNS[index].value) : "–"; cells[index].real.style.opacity = digit ? 1 : 0.35; });
  }

  // --- 10 x 10 square ---
  const model = card("A 10 × 10-es négyzet: egész = 100 kis négyzet");
  let count = 37;
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 170", role: "img" });
  const info = make("div", "il-formula start"), infoMessage = make("p", "il-message");
  const slider = range({ label: "Színezett kis négyzetek", min: 0, max: 100, value: count, format: String, onInput: (v) => { count = v; renderModel(); } });
  model.append(controls(slider.element), figure, info, infoMessage);
  function renderModel() {
    figure.replaceChildren();
    drawSquare(figure, 30, 10, 150, count);
    const tenths = Math.floor(count / 10), hundredths = count % 10, text = (x, y, content, color) => svg("text", { x, y, text: content, style: `fill:${color};font-size:17px;font-weight:700` }, figure);
    text(215, 50, `${tenths} egész sáv = ${tenths} tized`, PALETTE.blue);
    text(215, 85, `${hundredths} külön kis négyzet = ${hundredths} század`, PALETTE.amber);
    text(215, 125, `Összesen ${count} kis négyzet a 100-ból`, "var(--fg-soft)");
    info.replaceChildren(rich(`${hundredthsText(count)} = `, fraction(count, 100), count === 100 ? " = 1" : ""));
    infoMessage.className = "il-message good";
    infoMessage.textContent = count === 100 ? "Az egész négyzet színes: ez az 1 egész." : `${hundredthsText(count)}: a vessző után ${tenths} tized és ${hundredths} század áll, ez ${count} század, vagyis ${count}/100.`;
  }

  // --- Comparing ---
  const compare = card("Melyik a nagyobb?");
  let pairIndex = 1, pair = PAIRS[pairIndex];
  const compareFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 190", role: "img" });
  const compareMessage = make("p", "il-message");
  const pairButtons = PAIRS.map((candidate, index) => toggle(`${hundredthsText(candidate[0] === 50 ? 50 : candidate[0])} és ${index === 0 ? "0,50" : hundredthsText(candidate[1])}`, index === pairIndex, () => setPair(candidate, index)));
  compare.append(controls(...pairButtons, button("Véletlen pár", () => setPair([randomInt(1, 99), randomInt(1, 99)], -1), { ghost: true })), compareFigure, compareMessage);
  function setPair(next, index) { pair = next; pairIndex = index; pairButtons.forEach((el, i) => el.setAttribute("aria-pressed", String(i === index))); renderCompare(); }
  function renderCompare() {
    const [x, y] = pair, tenthsOnly = (v) => v % 10 === 0;
    const label = (v, second) => {
      if (pairIndex === 0) return second ? "0,50" : "0,5";
      void second;
      return tenthsOnly(v) && v > 0 ? `${formatNumber(v / 100, 1)} = ${formatNumber(v / 100, 1)}0` : hundredthsText(v);
    };
    compareFigure.replaceChildren();
    drawSquare(compareFigure, 70, 20, 130, x); drawSquare(compareFigure, 390, 20, 130, y);
    const relation = x === y ? "=" : x > y ? ">" : "<";
    svg("text", { x: 300, y: 100, "text-anchor": "middle", text: relation, style: "fill:var(--accent);font-size:44px;font-weight:700" }, compareFigure);
    svg("text", { x: 135, y: 175, "text-anchor": "middle", text: label(x, false), style: "fill:var(--fg);font-size:17px;font-weight:700" }, compareFigure);
    svg("text", { x: 455, y: 175, "text-anchor": "middle", text: label(y, true), style: "fill:var(--fg);font-size:17px;font-weight:700" }, compareFigure);
    compareMessage.className = "il-message good";
    compareMessage.textContent = x === y
      ? `Ugyanannyi négyzet színes (${x} a 100-ból): a nulla a tizedesjegy végén nem változtat az értéken.`
      : `${x} század ${relation} ${y} század, ezért ${formatNumber(x / 100, 2)} ${relation} ${formatNumber(y / 100, 2)}. Nem a tizedesjegyek száma számít, hanem hogy mennyi színes négyzet van.`;
  }

  root.append(table, model, compare, keyIdea("a tizedesvessző után minden hely tízszer kisebb, mint az előtte lévő: tized, század, ezred. Ezért 0,37 = 37/100, és a végén lévő nulla nem változtat az értéken (0,5 = 0,50). Tizedes törteket úgy hasonlíts össze, hogy azonos helyiértékre hozod őket."));
  renderTable(); renderModel(); setPair(PAIRS[1], 1);
  return () => scope.clearAll();
}
