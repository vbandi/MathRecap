import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, stepper, svg } from "./kit.js";

// Addition examples as [a, b, decimals] with exact integer scaling.
const ADDITION_PAIRS = [[12.5, 3.75, 2], [0.8, 0.45, 2], [7.06, 2.9, 2], [0.96, 0.27, 2], [19.9, 0.35, 2]];
const DIVISION_PAIRS = [[4.5, 0.15], [1.2, 0.4], [0.72, 0.06], [9.1, 0.7], [2.5, 0.05]];

const decimalsOf = (value) => (String(value).split(".")[1] ?? "").length;
const pow10 = (n) => 10 ** n;

// Splits a scaled integer into display columns, rightmost first: k decimals, comma, integer digits.
function columnsOf(scaled, k, width) {
  const text = String(scaled).padStart(k + 1, "0");
  const chars = text.slice(0, text.length - k).split("").concat(",", ...text.slice(text.length - k).split(""));
  const cells = chars.join("").padStart(width, " ").split("");
  return cells;
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("A tizedes törtekkel ugyanúgy számolunk, mint az egész számokkal, csak a tizedesvesszővel kell vigyázni: összeadáskor a helyiértékeknek kell egymás alá kerülniük, szorzásnál és osztásnál pedig a vessző helyét kell jól kiszámolni."));

  // --- Written addition ---
  const addition = card("Írásbeli összeadás: vessző a vessző alatt");
  let pairIndex = 0, running = false;
  const grid = make("div");
  grid.style.cssText = "display:grid;justify-content:start;font:24px/1.35 var(--font-mono);margin:10px 0;";
  const addMessage = make("p", "il-message");
  const runButton = button("Mutasd meg lépésenként", () => runAddition());
  const nextButton = button("Másik példa", () => { pairIndex = (pairIndex + 1) % ADDITION_PAIRS.length; showAddition(-1); }, { ghost: true });
  addition.append(grid, controls(runButton, nextButton), addMessage);
  root.append(addition);

  function additionData() {
    const [a, b] = ADDITION_PAIRS[pairIndex];
    const k = Math.max(decimalsOf(a), decimalsOf(b));
    const A = Math.round(a * pow10(k)), B = Math.round(b * pow10(k));
    return { a, b, k, A, B, S: A + B };
  }

  // revealed = number of result columns (from the right) already filled in; -1 = none.
  function showAddition(revealed, carries = []) {
    const { k, A, B, S } = additionData();
    const width = String(S).padStart(k + 1, "0").length + 2;
    const rows = [columnsOf(A, k, width), columnsOf(B, k, width), columnsOf(S, k, width)];
    grid.style.gridTemplateColumns = `repeat(${width}, 1.3ch)`;
    grid.replaceChildren();
    const cell = (char, style = "") => { const c = make("span", "", char); c.style.cssText = `text-align:center;${style}`; grid.append(c); return c; };
    // Carry row (small digits above the next column to the left).
    for (let col = 0; col < width; col++) {
      const fromRight = width - 1 - col;
      cell(carries[fromRight] ? "1" : " ", `font-size:13px;color:${PALETTE.amber};font-weight:700;`);
    }
    rows[0].forEach((c, col) => cell(c, `color:${c === "," ? "var(--accent)" : "var(--fg)"};`));
    rows[1].forEach((c, col) => cell(col === 0 ? "+" : c, `color:${c === "," ? "var(--accent)" : "var(--fg)"};${col === 0 ? "color:var(--dim)" : ""}`));
    // Rule line: 'B' row is already the addend; put "+" in the leading blank column of row b.
    for (let col = 0; col < width; col++) cell(" ", "border-top:2px solid var(--line-strong);height:4px;line-height:4px;");
    rows[2].forEach((c, col) => {
      const fromRight = width - 1 - col;
      const visible = revealed >= width || fromRight < revealed;
      cell(visible ? c : " ", `color:${c === "," ? "var(--accent)" : PALETTE.blue};font-weight:700;`);
    });
    // Columns are cells in a grid; the first blank column of each number row must be kept for "+".
    if (revealed < 0) addMessage.textContent = "Figyeld meg: a vesszők pontosan egymás alatt vannak. Ha az egyik szám rövidebb, képzeletben nullákkal pótolhatod.";
  }

  function runAddition() {
    if (running) return;
    scope.clearAll();
    running = true; runButton.disabled = nextButton.disabled = true;
    const { k, A, B, S } = additionData();
    const width = String(S).padStart(k + 1, "0").length + 2;
    const digitsOf = (n, p) => Math.floor(n / pow10(p)) % 10;
    const carries = [];
    let position = 0, carry = 0, revealed = 0;
    const last = Math.max(String(S).length, k + 1) - 1;
    // The comma occupies one column between the decimal and integer digits.
    const columnOf = (p) => (p < k ? p : p + 1);
    const step = () => {
      const da = digitsOf(A, position), db = digitsOf(B, position);
      const total = da + db + carry;
      addMessage.textContent = `${da} + ${db}${carry ? " + 1 (átvitel)" : ""} = ${total}` + (total > 9 ? `: leírunk ${total % 10}-t, és 1-et viszünk át a következő helyiértékre.` : `: leírjuk a ${total}-t.`);
      carry = Math.floor(total / 10);
      revealed = columnOf(position) + 1;
      if (position === k - 1) revealed += 1;
      if (carry > 0) carries[columnOf(position + 1)] = true;
      showAddition(revealed, carries);
      position += 1;
      if (position <= last && position < 12) scope.timeout(step, 1300);
      else scope.timeout(() => {
        showAddition(width + 1);
        addMessage.className = "il-message good";
        addMessage.textContent = `Eredmény: ${formatNumber(S / pow10(k))}. A vessző az összeadandók vesszője alatt maradt.`;
        running = false; runButton.disabled = nextButton.disabled = false;
      }, 1300);
    };
    addMessage.className = "il-message";
    showAddition(0, []);
    scope.timeout(step, 500);
  }

  // --- Multiplication on the 10 x 10 grid ---
  const multiplication = card("Szorzás: 0,3 · 0,2 a területrácson");
  multiplication.append(make("p", "", "A nagy négyzet az 1 egész. Minden kis négyzet 0,01. Az első szám szélességet, a második magasságot jelöl."));
  const state = { tenthsA: 3, tenthsB: 2 };
  const gridSize = 300, cellSize = gridSize / 10;
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 360 338", role: "img", style: "max-width:420px" }, multiplication);
  const squares = [];
  for (let row = 0; row < 10; row++) for (let col = 0; col < 10; col++) {
    squares.push(svg("rect", { x: 30 + col * cellSize, y: 10 + row * cellSize, width: cellSize, height: cellSize, style: "stroke:var(--line-strong);stroke-width:1" }, figure));
  }
  const overlayLabel = svg("text", { x: 30, y: 332, style: "font-weight:700;fill:var(--fg)" }, figure);
  const equationLine = make("div", "il-formula start");
  const placesLine = make("p", "il-message");
  const controlA = stepper({ label: "Szélesség (tizedek)", min: 1, max: 9, value: state.tenthsA, onChange: (v) => { state.tenthsA = v; renderMultiplication(); } });
  const controlB = stepper({ label: "Magasság (tizedek)", min: 1, max: 9, value: state.tenthsB, onChange: (v) => { state.tenthsB = v; renderMultiplication(); } });
  multiplication.append(controls(controlA.element, controlB.element), equationLine, placesLine);
  root.append(multiplication);

  function renderMultiplication() {
    const { tenthsA: a, tenthsB: b } = state;
    squares.forEach((square, index) => {
      const row = Math.floor(index / 10), col = index % 10;
      const inA = col < a, inB = row < b;
      square.style.fill = inA && inB ? PALETTE.green : inA ? PALETTE.blue : inB ? PALETTE.amber : "var(--surface)";
      square.style.opacity = inA || inB ? (inA && inB ? 1 : 0.4) : 1;
    });
    const product = a * b;
    overlayLabel.textContent = `${product} kis négyzet, mindegyik 0,01`;
    equationLine.textContent = `${formatNumber(a / 10)} · ${formatNumber(b / 10)} = ${formatNumber(product / 100, 2)}`;
    placesLine.textContent = `Vessző nélkül: ${a} · ${b} = ${product}. A tényezőkben 1 + 1 = 2 tizedesjegy van, ezért az eredményben is 2: ${formatNumber(product / 100, 2)}.`;
  }

  // --- Division by shifting commas ---
  const division = card("Osztás: tologassuk a vesszőt mindkét számon");
  division.append(make("p", "", "Ha az osztandót és az osztót ugyanazzal a 10-hatvánnyal szorozzuk, a hányados nem változik. Szorozzunk, amíg az osztó egész nem lesz."));
  let divisionIndex = 0, shifts = 0;
  const divisionLine = make("div", "il-formula start");
  divisionLine.style.fontSize = "22px";
  const divisionMessage = make("p", "il-message");
  const shiftButton = button("Szorzás 10-zel mindkettőt", () => { shifts += 1; renderDivision(); });
  const resetButton = button("Másik példa", () => { divisionIndex = (divisionIndex + 1) % DIVISION_PAIRS.length; shifts = 0; renderDivision(); }, { ghost: true });
  division.append(divisionLine, controls(shiftButton, resetButton), divisionMessage);
  root.append(division);

  function renderDivision() {
    const [a, b] = DIVISION_PAIRS[divisionIndex];
    const needed = decimalsOf(b);
    const factor = pow10(shifts);
    divisionLine.textContent = `${formatNumber(a * factor, 4)} : ${formatNumber(b * factor, 4)}${shifts >= needed ? ` = ${formatNumber(a / b, 4)}` : ""}`;
    shiftButton.disabled = shifts >= needed;
    divisionMessage.className = shifts >= needed ? "il-message good" : "il-message";
    divisionMessage.textContent = shifts === 0
      ? `Az osztó (${formatNumber(b)}) nem egész szám. ${needed} tizedesjegye van, ezért ${needed}-szer kell 10-zel szorozni.`
      : shifts < needed ? `A vessző mindkét számon ${shifts} hellyel jobbra került. Az osztó még nem egész.`
        : `Az osztó egész, az osztás egész számokkal elvégezhető: ${formatNumber(a * factor, 4)} : ${formatNumber(b * factor, 4)} = ${formatNumber(a / b, 4)}.`;
  }

  // --- Unit conversion link ---
  const units = card("Ugyanez a mértékegység-váltás: méter és centiméter");
  let centimeters = 135;
  const unitLine = make("div", "il-formula start");
  unitLine.style.fontSize = "22px";
  const unitMessage = make("p", "il-message");
  const unitSlider = range({ label: "Hossz (cm)", min: 1, max: 300, value: centimeters, format: (v) => `${v} cm`, onInput: (v) => { centimeters = v; renderUnits(); } });
  units.append(controls(unitSlider.element), unitLine, unitMessage);
  root.append(units, keyIdea("összeadásnál a vessző a vessző alá kerül; szorzásnál a tizedesjegyek számát összeadjuk; osztásnál mindkét számon ugyanannyit tolunk a vesszőn, hogy az osztó egész legyen."));

  function renderUnits() {
    unitLine.textContent = `${formatNumber(centimeters / 100, 2)} m = ${centimeters} cm`;
    unitMessage.textContent = `1 m = 100 cm, tehát métert centiméterré 100-zal szorozva váltunk: a vessző 2 hellyel jobbra ugrik. Visszafelé 100-zal osztunk: a vessző 2 hellyel balra ugrik.`;
  }

  showAddition(-1);
  renderMultiplication();
  renderDivision();
  renderUnits();
  return () => scope.clearAll();
}
