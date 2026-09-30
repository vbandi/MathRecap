import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const COLUMN_WIDTH = 34, RIGHT_EDGE = 560, LEFT_EDGE = 40, TOP = 76, ROW_HEIGHT = 54;
const PLACES = ["egyesek", "tízesek", "százasok", "ezresek", "tízezresek"];
const OPERATIONS = [
  { id: "add", name: "Összeadás" }, { id: "subtract", name: "Kivonás" },
  { id: "multiply1", name: "Szorzás egyjegyűvel" }, { id: "multiply2", name: "Szorzás kétjegyűvel" }, { id: "divide", name: "Osztás" },
];
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const digitsOf = (n) => String(n).split("").reverse().map(Number); // index = column counted from the right
const groupedText = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const rowY = (row) => TOP + row * ROW_HEIGHT;
const digitCells = (row, n, offset = 0, extra = {}) => digitsOf(n).map((digit, index) => ({ r: row, c: index + offset, t: String(digit), kind: "digit", ...extra }));
// Writes text into columns counted from the right, e.g. "347 · 25".
const textCells = (row, text) => [...text].reverse().flatMap((ch, c) => (ch === " " ? [] : [{ r: row, c, t: ch, kind: /\d/.test(ch) ? "digit" : "op" }]));

function addition(a, b) {
  const length = Math.max(String(a).length, String(b).length), da = digitsOf(a), db = digitsOf(b);
  const steps = [{ cells: [...digitCells(0, a), ...digitCells(1, b), { r: 1, c: length, t: "+", kind: "op" }], lines: [{ r: 1, c0: 0, c1: length }], note: "Az egyesek az egyesek alá, a tízesek a tízesek alá kerülnek. Jobbról balra haladunk, helyiértékenként." }];
  let carry = 0;
  for (let i = 0; i < length; i++) {
    const x = da[i] ?? 0, y = db[i] ?? 0, sum = x + y + carry, cells = [{ r: 2, c: i, t: String(sum % 10), kind: "digit" }];
    const carryIn = carry;
    carry = Math.floor(sum / 10);
    if (carry && i + 1 < length) cells.push({ r: 0, c: i + 1, t: "1", kind: "small", color: PALETTE.blue });
    const text = `${PLACES[i]}: ${x} + ${y}${carryIn ? " + 1 (átvitel)" : ""} = ${sum}. Leírjuk: ${sum % 10}${carry ? ", az átvitel 1 a következő helyiértékre kerül" : ""}.`;
    steps.push({ cells, hl: [i], note: text });
  }
  if (carry) steps.push({ cells: [{ r: 2, c: length, t: "1", kind: "digit" }], hl: [length], note: "Az utolsó átvitelt leírjuk: új helyiérték született." });
  return { steps, layout: "right", result: a + b, estimate: estimateAddSub(a, b, "+") };
}

// Written subtraction by "pótlás" (the Hungarian school method): in each column we ask
// what must be added to the lower digit to reach the upper one; if the upper digit is
// too small we top up to it plus ten, and carry 1 to the next column's lower digit.
function subtraction(a, b) {
  const length = String(a).length, top = digitsOf(a), bottom = digitsOf(b), resultLength = String(a - b).length;
  const steps = [{ cells: [...digitCells(0, a), ...digitCells(1, b), { r: 1, c: length, t: "−", kind: "op" }], lines: [{ r: 1, c0: 0, c1: length }], note: "Pótlással dolgozunk, jobbról balra: minden oszlopban azt keressük, mennyit kell az alsó számjegyhez adni, hogy a felsőt kapjuk." }];
  let carry = 0;
  for (let i = 0; i < resultLength; i++) {
    const x = top[i], lower = (bottom[i] ?? 0) + carry, carryIn = carry, cells = [];
    const lowerText = carryIn ? `${bottom[i] ?? 0} + 1 = ${lower}` : String(lower);
    let text;
    if (x >= lower) {
      carry = 0;
      text = `${PLACES[i]}: alul ${lowerText}. ${lower} + ? = ${x}, tehát ? = ${x - lower}. Leírjuk: ${x - lower}.`;
      cells.push({ r: 2, c: i, t: String(x - lower), kind: "digit" });
    } else {
      carry = 1;
      const digit = x + 10 - lower;
      text = `${PLACES[i]}: alul ${lowerText}. ${lower} + ? = ${x} nem megy, mert ${x} kisebb. Ezért ${x + 10}-ig pótolunk: ${lower} + ${digit} = ${x + 10}. Leírjuk: ${digit}, az 1 tízest pedig továbbvisszük a következő oszlop alsó számjegyéhez.`;
      cells.push({ r: 0, c: i, t: "+10", kind: "small", color: PALETTE.amber }, { r: 2, c: i, t: String(digit), kind: "digit" });
      if (i + 1 < length) cells.push({ r: 1, c: i + 1, t: "+1", kind: "small", color: PALETTE.blue });
    }
    steps.push({ cells, hl: [i], note: text });
  }
  return { steps, layout: "right", result: a - b, estimate: estimateAddSub(a, b, "−") };
}

function multiplication(a, b) {
  const multiplierLength = String(b).length, multiplicand = digitsOf(a), bDigits = digitsOf(b);
  const columnOf = (i) => multiplierLength + 3 + i;
  const lastColumn = columnOf(multiplicand.length - 1);
  const steps = [{ cells: textCells(0, `${a} · ${b}`), lines: [{ r: 0, c0: 0, c1: lastColumn }], note: multiplierLength === 1 ? "Az egyes szorzót végigszorozzuk a szorzandó minden számjegyével, jobbról balra." : "Először a szorzó tízes jegyével szorzunk, utána az egyesekkel. A részeredményeket jobbra igazítva írjuk egymás alá." }];
  const partials = [];
  for (let p = multiplierLength - 1; p >= 0; p--) {
    const d = bDigits[p], row = multiplierLength - p;
    let carry = 0;
    partials.push({ p, value: a * d });
    multiplicand.forEach((x, i) => {
      const prod = x * d + carry, carryIn = carry, cells = [], last = i === multiplicand.length - 1;
      carry = Math.floor(prod / 10);
      cells.push({ r: row, c: p + i, t: String(prod % 10), kind: "digit" });
      if (last && carry) cells.push({ r: row, c: p + i + 1, t: String(carry), kind: "digit" });
      else if (carry) cells.push({ r: row, c: 0, carryFor: columnOf(i + 1), t: String(carry), kind: "small", color: PALETTE.blue });
      let note = `${x} · ${d}${carryIn ? ` + ${carryIn} (átvitel)` : ""} = ${prod}. Leírjuk: ${last ? prod : prod % 10}${carry && !last ? `, az átvitel ${carry} a következő számjegy fölé kerül` : ""}.`;
      if (i === 0 && multiplierLength === 2) note = `${p === 1 ? `Szorzó tízes jegye: ${d} (valójában ${d * 10}), ezért az eredmény egy hellyel balrább kezdődik. ` : `Szorzó egyes jegye: ${d}. `}${note}`;
      steps.push({ cells: cells.map((cell) => (cell.carryFor ? { ...cell, r: 0, c: cell.carryFor } : cell)), hl: [columnOf(i), p + i], note, clearSmall: i === 0 });
    });
  }
  if (multiplierLength === 2) {
    const total = a * b, totalLength = String(total).length, p0 = digitsOf(partials[1].value), p1 = digitsOf(partials[0].value);
    steps[steps.length - 1].lines = [{ r: 2, c0: 0, c1: Math.max(totalLength, String(partials[0].value).length + 1) - 1 }];
    let carry = 0;
    for (let i = 0; i < totalLength; i++) {
      const x = p0[i] ?? 0, y = i >= 1 ? p1[i - 1] ?? 0 : 0, sum = x + y + carry, carryIn = carry;
      carry = Math.floor(sum / 10);
      const cells = [{ r: 3, c: i, t: String(sum % 10), kind: "digit" }];
      if (carry && i + 1 < totalLength) cells.push({ r: 3, c: i + 1, t: String(carry), kind: "small", color: PALETTE.blue, zone: true });
      steps.push({ cells, hl: [i], clearSmall: i === 0, note: `${i === 0 ? "Most összeadjuk a két részeredményt. " : ""}${PLACES[i]}: ${x} + ${y}${carryIn ? ` + ${carryIn} (átvitel)` : ""} = ${sum}. Leírjuk: ${sum % 10}${carry && i + 1 < totalLength ? `, átvitel: ${carry}` : ""}.` });
    }
  }
  return { steps, layout: "right", result: a * b, estimate: estimateMultiply(a, b) };
}

function division(a, d) {
  const digits = String(a).split("").map(Number), n = digits.length;
  let start = 1, prefix = digits[0];
  while (prefix < d) prefix = prefix * 10 + digits[start++];
  const dividendCells = digits.map((digit, c) => ({ r: 0, c, t: String(digit), kind: "digit" }));
  const operators = [{ r: 0, c: n, t: ":", kind: "op" }, { r: 0, c: n + 1, t: String(d), kind: "digit" }, { r: 0, c: n + 2, t: "=", kind: "op" }];
  const steps = [{ cells: [...dividendCells, ...operators], note: "Balról jobbra haladunk: mindig az éppen osztható számot nézzük, leírjuk a hányados számjegyét, és lehozzuk a következő számjegyet." }];
  let current = prefix;
  for (let p = start - 1; p < n; p++) {
    const q = Math.floor(current / d), r = current % d, row = p - (start - 1) + 1, cells = [];
    cells.push({ r: 0, c: n + 3 + (p - (start - 1)), t: String(q), kind: "digit" });
    cells.push({ r: row, c: p, t: String(r), kind: "digit" });
    const last = p === n - 1;
    if (!last) cells.push({ r: row, c: p + 1, t: String(digits[p + 1]), kind: "digit", color: PALETTE.blue });
    let note = `${current} : ${d} = ${q}, mert ${q} · ${d} = ${q * d}. Maradék: ${current} − ${q * d} = ${r}.`;
    if (!last) note += ` Lehozzuk a következő számjegyet: ${digits[p + 1]}.`;
    steps.push({ cells, hl: [p], note });
    current = r * 10 + (digits[p + 1] ?? 0);
  }
  return { steps, layout: "left", result: Math.floor(a / d), remainder: a % d, estimate: estimateDivide(a, d) };
}

function estimateAddSub(a, b, sign) {
  const unit = Math.max(String(a).length, String(b).length) >= 4 ? 100 : 10;
  const x = Math.round(a / unit) * unit, y = Math.round(b / unit) * unit;
  return { value: sign === "+" ? x + y : x - y, text: `${groupedText(a)} ${sign} ${groupedText(b)} ≈ ${groupedText(x)} ${sign} ${groupedText(y)} = ${groupedText(sign === "+" ? x + y : x - y)}` };
}
const roundFirstDigit = (n) => { const unit = 10 ** (String(n).length - 1); return Math.round(n / unit) * unit; };
function estimateMultiply(a, b) {
  const x = roundFirstDigit(a), y = roundFirstDigit(b);
  return { value: x * y, text: `${a} · ${b} ≈ ${x} · ${y} = ${groupedText(x * y)}` };
}
function estimateDivide(a, d) {
  const unit = 10 ** (String(a).length - 2), near = Math.max(1, Math.round(a / (d * unit))) * d * unit;
  return { value: near / d, text: `${groupedText(a)} : ${d} ≈ ${groupedText(near)} : ${d} = ${groupedText(near / d)}` };
}

const GENERATORS = {
  add: () => addition(randomInt(200, 7999), randomInt(150, 1999)),
  subtract: () => { const a = randomInt(300, 9999); return subtraction(a, randomInt(100, a - 1)); },
  multiply1: () => multiplication(randomInt(100, 999), randomInt(2, 9)),
  multiply2: () => multiplication(randomInt(100, 999), randomInt(2, 9) * 10 + randomInt(2, 9)),
  divide: () => division(randomInt(200, 9999), randomInt(2, 9)),
};

export function mount(root) {
  const scope = createScope();
  root.append(lead("Az írásbeli műveletek ugyanazt csinálják, mint a fejszámolás, csak helyiértékenként, egyszerre egy kis lépést. Nézd végig, mi történik minden oszlopban, és mire valók az átvitt számok."));
  const main = card("Írásbeli műveletek");
  let operation = "add", problem, stepIndex;
  const tabs = OPERATIONS.map(({ id, name }) => toggle(name, id === operation, () => { operation = id; newProblem(); }));
  const estimate = make("p", "il-formula start");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 330", role: "img", "aria-label": "Írásbeli művelet lépésről lépésre" });
  const message = make("p", "il-message");
  const next = button("Következő lépés", () => go(stepIndex + 1));
  const previous = button("Előző lépés", () => go(stepIndex - 1), { ghost: true });
  const all = button("Az összes lépés", () => go(problem.steps.length - 1), { ghost: true });
  main.append(controls(...tabs), estimate, figure, message, controls(next, previous, all, button("Új feladat", newProblem, { ghost: true })));
  root.append(main, keyIdea("az írásbeli eljárás csak a helyiértékes gondolkodást rögzíti: minden oszlopban kis számokkal dolgozunk, ami nem fér el (tíz vagy több), az átvitelként a következő helyiértékre kerül. Előre becsülj, hogy utána lásd, ésszerű-e az eredmény."));

  function newProblem() {
    problem = GENERATORS[operation]();
    stepIndex = 0;
    estimate.textContent = `Becslés: ${problem.estimate.text}`;
    tabs.forEach((element, index) => element.setAttribute("aria-pressed", String(OPERATIONS[index].id === operation)));
    draw();
  }
  function go(index) {
    stepIndex = Math.max(0, Math.min(problem.steps.length - 1, index));
    draw();
  }
  function draw() {
    figure.replaceChildren();
    const x = (c) => (problem.layout === "right" ? RIGHT_EDGE - c * COLUMN_WIDTH : LEFT_EDGE + c * COLUMN_WIDTH);
    const cells = new Map(), lines = [];
    problem.steps.slice(0, stepIndex + 1).forEach((step, index) => {
      if (step.clearSmall) for (const [key, cell] of cells) if (cell.kind === "small") cells.delete(key);
      for (const cell of step.cells) cells.set(`${cell.r},${cell.c},${cell.kind}`, { ...cell, step: index });
      lines.push(...(step.lines ?? []).map((line) => ({ ...line, step: index })));
    });
    const current = problem.steps[stepIndex];
    for (const c of current.hl ?? []) svg("rect", { x: x(c) - COLUMN_WIDTH / 2, y: 20, width: COLUMN_WIDTH, height: 290, rx: 8, style: "fill:var(--accent);opacity:.09" }, figure);
    for (const line of lines) {
      const y = rowY(line.r) + 12;
      svg("line", { x1: x(line.c1) - COLUMN_WIDTH / 2 - 4, x2: x(line.c0) + COLUMN_WIDTH / 2 + 4, y1: y, y2: y, style: "stroke:var(--fg-soft);stroke-width:2" }, figure);
    }
    const replacedColumns = new Set([...cells.values()].filter((cell) => cell.kind === "small" && cell.color === PALETTE.red).map((cell) => cell.c));
    for (const cell of cells.values()) {
      const fresh = cell.step === stepIndex && stepIndex > 0;
      const small = cell.kind === "small", struck = operation === "subtract" && cell.r === 0 && cell.kind === "digit" && replacedColumns.has(cell.c);
      const text = svg("text", {
        x: x(cell.c) + (small ? 8 : 0), y: small ? rowY(cell.r) - 26 : rowY(cell.r), "text-anchor": "middle", text: cell.t,
        style: `font-family:var(--font-mono);font-size:${small ? 15 : 28}px;font-weight:${fresh ? 700 : 500};fill:${small ? cell.color : cell.color ?? (fresh ? "var(--accent)" : cell.kind === "op" ? "var(--dim)" : "var(--fg)")};opacity:${struck ? 0.4 : 1};${struck ? "text-decoration:line-through;" : ""}`,
      }, figure);
      if (fresh) { text.setAttribute("opacity", 0); text.classList.add("il-fade"); scope.frame(() => scope.frame(() => text.setAttribute("opacity", 1))); }
    }
    const finished = stepIndex === problem.steps.length - 1;
    message.className = `il-message${finished ? " good" : ""}`;
    message.textContent = current.note;
    if (finished) {
      const error = Math.abs(problem.result - problem.estimate.value) / Math.max(1, problem.result);
      const remainder = problem.remainder ? `, maradék ${problem.remainder}` : "";
      message.textContent += ` Eredmény: ${groupedText(problem.result)}${remainder}. A becslés ${groupedText(problem.estimate.value)} volt, ${error < 0.15 ? "tehát az eredmény ésszerű" : "eléggé eltér, de a becslés durva"}.`;
    }
    next.disabled = finished; previous.disabled = stepIndex === 0; all.disabled = finished;
  }
  newProblem();
  return () => scope.clearAll();
}
