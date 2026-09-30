import { card, controls, button, createScope, keyIdea, lead, make, PALETTE, slot, svg } from "./kit.js";

const PLACES = ["milliók", "százezrek", "tízezrek", "ezrek", "százasok", "tízesek", "egyesek"];
const COLUMN_COUNT = PLACES.length;
const ONES = ["", "egy", "kettő", "három", "négy", "öt", "hat", "hét", "nyolc", "kilenc"];
const TENS = ["", "tíz", "húsz", "harminc", "negyven", "ötven", "hatvan", "hetven", "nyolcvan", "kilencven"];
const NBSP = " ";

const placeValue = (column) => 10 ** (COLUMN_COUNT - 1 - column);
const grouped = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

// Below 1000; "attributive" is used before száz/ezer/millió, where "kettő" becomes "két".
function groupWords(g, attributive) {
  const hundreds = Math.floor(g / 100), rest = g % 100, unit = rest % 10;
  const unitWord = unit === 2 && attributive ? "két" : ONES[unit];
  let words = hundreds === 0 ? "" : hundreds === 1 ? "száz" : `${hundreds === 2 ? "két" : ONES[hundreds]}száz`;
  if (rest >= 10 && rest < 20) words += rest === 10 ? "tíz" : `tizen${unitWord}`;
  else if (rest >= 20 && rest < 30) words += rest === 20 ? "húsz" : `huszon${unitWord}`;
  else if (rest >= 30) words += TENS[Math.floor(rest / 10)] + unitWord;
  else words += unitWord;
  return words;
}

// Hungarian number words: up to 2000 written as one word, above that hyphenated between groups.
export function numberWords(n) {
  if (n === 0) return "nulla";
  const millions = Math.floor(n / 1e6), thousands = Math.floor(n / 1000) % 1000, rest = n % 1000;
  const parts = [];
  if (millions) parts.push(`${groupWords(millions, true)}millió`);
  if (thousands) parts.push(thousands === 1 ? "ezer" : `${groupWords(thousands, true)}ezer`);
  if (rest) parts.push(groupWords(rest, false));
  return parts.join(n <= 2000 ? "" : "-");
}

// Base-10 blocks: nagy kocka (1000), lap (100), rúd (10), kocka (1).
const BLOCKS = [
  { place: 3, w: 34, h: 34, cols: 3, label: "nagy kocka = 1000", color: PALETTE.violet, cube: true },
  { place: 2, w: 34, h: 34, cols: 3, label: "lap = 100", color: PALETTE.blue },
  { place: 1, w: 8, h: 34, cols: 9, label: "rúd = 10", color: PALETTE.green },
  { place: 0, w: 10, h: 10, cols: 3, label: "kocka = 1", color: PALETTE.amber },
];

export function mount(root) {
  const scope = createScope();
  const digits = [0, 0, 2, 3, 0, 5, 7];
  const value = () => digits.reduce((sum, digit, column) => sum + digit * placeValue(column), 0);
  root.append(lead("Ugyanaz a számjegy más értéket jelent attól függően, hol áll a számban: a 7 lehet hét egyes, de hetven vagy hétezer is. A számjegy helye dönti el, hogy hányszor tíz az értéke."));

  // --- Place-value table ---
  const table = card("Helyiérték-táblázat");
  const bigNumber = make("div", "il-formula start");
  bigNumber.style.fontSize = "26px";
  const words = make("p", "il-message");
  const grid = make("table", "il-table");
  grid.style.width = "100%";
  grid.style.tableLayout = "fixed";
  const cells = [];
  const rows = { name: make("tr"), place: make("tr"), shape: make("tr"), real: make("tr") };
  const rowTitles = { name: "hely", place: "helyi érték", shape: "alaki érték", real: "valódi érték" };
  for (const [key, row] of Object.entries(rows)) {
    const title = make("td", "", rowTitles[key]);
    title.style.textAlign = "left"; title.style.width = "13ch"; title.style.color = "var(--dim)";
    row.append(title);
    grid.append(row);
  }
  for (let column = 0; column < COLUMN_COUNT; column++) {
    const nameCell = make("td", "", PLACES[column]);
    nameCell.style.fontSize = "11px"; nameCell.style.width = "auto"; nameCell.style.textAlign = "center";
    const placeCell = make("td", "", grouped(placeValue(column)));
    placeCell.style.textAlign = "center"; placeCell.style.width = "auto";
    const up = make("button", "", "▲"), down = make("button", "", "▼"), digit = make("b", "", "0");
    up.type = down.type = "button";
    up.setAttribute("aria-label", `${PLACES[column]} számjegyének növelése`);
    down.setAttribute("aria-label", `${PLACES[column]} számjegyének csökkentése`);
    up.addEventListener("click", () => { digits[column] = (digits[column] + 1) % 10; render(); });
    down.addEventListener("click", () => { digits[column] = (digits[column] + 9) % 10; render(); });
    const shape = make("td");
    shape.style.cssText = "text-align:center;width:auto";
    const stepperBox = make("span", "il-stepper");
    stepperBox.style.flexDirection = "column"; stepperBox.style.gap = "2px";
    stepperBox.append(up, digit, down);
    for (const button of [up, down]) button.style.height = "20px";
    shape.append(stepperBox);
    const real = make("td");
    real.style.cssText = "text-align:center;width:auto;font-size:12px";
    rows.name.append(nameCell); rows.place.append(placeCell); rows.shape.append(shape); rows.real.append(real);
    cells.push({ digit, real, placeCell });
  }
  table.append(bigNumber, grid, words);

  // --- Blocks ---
  const blocks = card("Építsd fel dobozokból");
  blocks.append(make("p", "il-muted", "Ugyanez a szám építőkockákból (egymilliótól fölfelé már nem férne el). Az ezresek, százasok, tízesek és egyesek számát a fenti számjegyek adják."));
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 190", role: "img" }, blocks);
  blocks.append(figure);
  function drawBlocks() {
    figure.replaceChildren();
    BLOCKS.forEach((block, index) => {
      const count = digits[COLUMN_COUNT - 1 - block.place];
      const left = 14 + index * 148;
      svg("text", { x: left, y: 180, text: block.label, style: "font-size:12px" }, figure);
      const step = block.w + 4;
      for (let i = 0; i < count; i++) {
        const x = left + (i % block.cols) * step + (block.cube ? 0 : 0);
        const y = block.cols === 9 ? 140 - block.h : 140 - block.h - Math.floor(i / block.cols) * (block.h + 4);
        const xx = block.cols === 9 ? left + i * step : x;
        const inner = svg("g", { transform: `translate(${xx} ${y})` }, figure);
        svg("rect", { width: block.w, height: block.h, rx: 2, style: `fill:${block.color};stroke:var(--bg);stroke-width:1.5;opacity:.9` }, inner);
        if (block.cube) svg("path", { d: "M 0 0 L 8 -7 L 42 -7 L 34 0 Z M 34 0 L 42 -7 L 42 27 L 34 34", style: "fill:#fff;opacity:.3" }, inner);
        if (block.place === 2) for (let g = 1; g < 10; g++) svg("path", { d: `M ${g * 3.4} 0 V 34 M 0 ${g * 3.4} H 34`, style: "stroke:var(--bg);stroke-width:.5;opacity:.6" }, inner);
        if (block.place === 1) for (let g = 1; g < 10; g++) svg("path", { d: `M 0 ${g * 3.4} H 8`, style: "stroke:var(--bg);stroke-width:.6" }, inner);
      }
    });
  }

  function render() {
    const n = value();
    bigNumber.textContent = grouped(n);
    words.textContent = numberWords(n);
    digits.forEach((digit, column) => {
      cells[column].digit.textContent = digit;
      cells[column].digit.style.opacity = digit === 0 ? .35 : 1;
      cells[column].real.textContent = digit ? grouped(digit * placeValue(column)) : "–";
      cells[column].real.style.opacity = digit ? 1 : .35;
    });
    drawBlocks();
  }

  // --- Moving a digit left ---
  const move = card("Egy hellyel balra: tízszer annyi");
  const moveFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 150", role: "img" }, move);
  const COLUMN_WIDTH = 600 / COLUMN_COUNT;
  PLACES.forEach((name, column) => {
    svg("rect", { x: column * COLUMN_WIDTH + 3, y: 6, width: COLUMN_WIDTH - 6, height: 138, rx: 8, style: "fill:var(--surface);stroke:var(--line)" }, moveFigure);
    svg("text", { x: column * COLUMN_WIDTH + COLUMN_WIDTH / 2, y: 26, "text-anchor": "middle", text: name, style: "font-size:11px" }, moveFigure);
    svg("text", { x: column * COLUMN_WIDTH + COLUMN_WIDTH / 2, y: 130, "text-anchor": "middle", text: grouped(placeValue(column)), style: "font-size:11px" }, moveFigure);
  });
  const chip = svg("g", { class: "il-move" }, moveFigure);
  svg("circle", { cx: COLUMN_WIDTH / 2, cy: 72, r: 28, style: `fill:${PALETTE.blue}` }, chip);
  const chipText = svg("text", { x: COLUMN_WIDTH / 2, y: 82, "text-anchor": "middle", style: "font-size:28px;font-weight:700;fill:#fff" }, chip);
  let chipDigit = 7, chipColumn = 6;
  const chipMessage = make("p", "il-message");
  const digitButton = button("Másik számjegy", () => { chipDigit = chipDigit % 9 + 1; renderChip(); }, { ghost: true });
  const left = button("◀ balra", () => { chipColumn = Math.max(0, chipColumn - 1); renderChip(); });
  const right = button("jobbra ▶", () => { chipColumn = Math.min(COLUMN_COUNT - 1, chipColumn + 1); renderChip(); }, { ghost: true });
  move.append(controls(left, right, digitButton), chipMessage);
  function renderChip() {
    chip.style.transform = `translate(${chipColumn * COLUMN_WIDTH}px, 0)`;
    chipText.textContent = chipDigit;
    left.disabled = chipColumn === 0; right.disabled = chipColumn === COLUMN_COUNT - 1;
    const valueNow = chipDigit * placeValue(chipColumn);
    chipMessage.className = "il-message good";
    chipMessage.replaceChildren(`Hely: ${PLACES[chipColumn]}. Érték: ${chipDigit} · ${grouped(placeValue(chipColumn))} = `, slot(grouped(valueNow), 10, { align: "left" }), chipColumn < COLUMN_COUNT - 1 ? ` Egy hellyel jobbra ennek a tizede lenne.` : "");
  }
  root.append(table, blocks, move, keyIdea("a számjegy értéke a helyétől függ. Minden hellyel balra tízszer akkora a helyi érték, ezért a számjegy valódi értéke is tízszeresére nő. A nulla a helyet tartja fenn, hogy a többi számjegy a jó helyen álljon."));
  render();
  renderChip();
  return () => scope.clearAll();
}
