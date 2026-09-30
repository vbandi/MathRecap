import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

const MAX_N = 120, DOT = 12, GAP = 3, BLOCK_GAP = 10, WIDTH = 600, HEIGHT = 300;
const SUBSCRIPTS = "₀₁₂₃₄₅₆₇₈₉";
const LEVEL_COLORS = [PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.red, PALETTE.violet, PALETTE.pink, PALETTE.blue];

const subscript = (n) => String(n).split("").map((d) => SUBSCRIPTS[Number(d)]).join("");
const digitsIn = (n, base) => { let count = 1; while (n >= base ** count) count += 1; return count; };
const digitAt = (n, base, position) => Math.floor(n / base ** position) % base;

// Size in pixels of one block of b^level dots.
function blockSize(level, base) {
  const unit = DOT + GAP;
  if (level === 0) return { width: DOT, height: DOT };
  if (level === 1) return { width: base * unit - GAP, height: DOT };
  return { width: base * unit - GAP, height: base * unit - GAP };
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("A számrendszer azt mondja meg, hány darabból csinálunk egy nagyobb csomagot. A tízes számrendszerben tízesével, a kettesben kettesével csomagolunk. Egy szám jegyei azt mutatják, hány csomag maradt az egyes méretekből."));

  const state = { base: 10, n: 37, stage: 0 };
  const main = card("Csomagolás: a szám jegyei");
  const baseButtons = [2, 3, 4, 5, 6, 7, 8, 9, 10].map((b) => toggle(String(b), b === state.base, () => { state.base = b; state.stage = maxStage(); render(); }));
  const nSlider = range({ label: "A szám", min: 1, max: MAX_N, value: state.n, format: String, onInput: (v) => { state.n = v; state.stage = maxStage(); render(); } });
  const playButton = button("Csoportosíts lépésenként", () => play());
  main.append(controls(make("span", "il-muted", "Számrendszer alapja:"), ...baseButtons), controls(nSlider.element, playButton));
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img" }, main);
  const blockLayer = svg("g", { class: "il-fade" }, figure);
  const stageMessage = make("p", "il-message");
  const table = make("table", "il-table");
  const writtenLine = make("div", "il-formula start");
  main.append(stageMessage, table, writtenLine);

  const bulbs = card("Kettes számrendszer: villanykörtés számláló");
  bulbs.append(make("p", "", "Minden körte egy helyiérték: ha világít, 1-es a jegye, ha nem, 0. Kapcsolgasd őket, és figyeld az értéket."));
  const bulbState = { on: new Set([1, 4]), target: null };
  const bulbToggles = [128, 64, 32, 16, 8, 4, 2, 1].map((value) => toggle(String(value), bulbState.on.has(value), () => {
    if (bulbState.on.has(value)) bulbState.on.delete(value); else bulbState.on.add(value);
    renderBulbs();
  }, PALETTE.amber));
  bulbToggles.forEach((t) => { t.style.cssText += "min-width:52px;height:52px;border-radius:50%;font-family:var(--font-mono);"; });
  const bulbBits = make("div", "il-formula start");
  const bulbSum = make("div", "il-formula start");
  const bulbMessage = make("p", "il-message");
  bulbs.append(controls(...bulbToggles), bulbBits, bulbSum, controls(button("Kihívás: adott számot állíts be", () => { bulbState.target = 1 + Math.floor(Math.random() * 255); renderBulbs(); }), button("Kapcsolj mindent le", () => { bulbState.on.clear(); renderBulbs(); }, { ghost: true })), bulbMessage);
  root.append(main, bulbs, keyIdea("egy szám jegyei megmondják, hány b⁰, b¹, b², … értékű csomag kell hozzá, ahol b a számrendszer alapja. Mindegyik jegy 0 és b − 1 között van. A kettes számrendszerben csak 0 és 1 lehet: ezért kapcsolóként (be/ki) is megvalósítható."));

  function maxStage() { return digitsIn(state.n, state.base) - 1; }

  function drawBlocks() {
    const { base, n, stage } = state;
    // Blocks of the current stage: n // b^stage big blocks plus the finished smaller digits.
    const list = [];
    for (let i = 0; i < Math.floor(n / base ** stage); i++) list.push(stage);
    for (let level = stage - 1; level >= 0; level--) for (let i = 0; i < digitAt(n, base, level); i++) list.push(level);
    blockLayer.replaceChildren();
    let x = 10, y = 10, rowHeight = 0;
    for (const level of list) {
      const { width, height } = blockSize(level, base);
      if (x + width > WIDTH - 10) { x = 10; y += rowHeight + BLOCK_GAP; rowHeight = 0; }
      const group = svg("g", { transform: `translate(${x} ${y})` }, blockLayer);
      const color = LEVEL_COLORS[level];
      if (level === 0) svg("circle", { cx: DOT / 2, cy: DOT / 2, r: DOT / 2, style: `fill:${color}` }, group);
      else {
        svg("rect", { width: width + 6, height: height + 6, x: -3, y: -3, rx: 5, style: `fill:${color};fill-opacity:.18;stroke:${color};stroke-width:2` }, group);
        const columns = base, rows = level === 1 ? 1 : base;
        if (level <= 2) for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) svg("circle", { cx: DOT / 2 + c * (DOT + GAP), cy: DOT / 2 + r * (DOT + GAP), r: DOT / 2 - 1, style: `fill:${color}` }, group);
        else svg("text", { x: width / 2, y: height / 2 + 5, "text-anchor": "middle", text: `${base}³`, style: `font-weight:700;fill:var(--fg)` }, group);
      }
      x += width + BLOCK_GAP + 6;
      rowHeight = Math.max(rowHeight, height + 6);
    }
  }

  function render() {
    scope.clearAll();
    playButton.disabled = false;
    const { base, n, stage } = state;
    nSlider.set(n);
    baseButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(i + 2 === base)));
    blockLayer.style.opacity = 0;
    scope.frame(() => { drawBlocks(); blockLayer.style.opacity = 1; });

    const size = base ** stage;
    const finished = stage === maxStage();
    stageMessage.className = finished ? "il-message good" : "il-message";
    stageMessage.textContent = stage === 0
      ? `${n} különálló pötty. Csomagoljuk ${base}-esével!`
      : `${Math.floor(n / size)} db ${size} elemű csomag és a maradék: ${n % size}. ${finished ? `Már nincs ${base} egyforma csomag, több csomagolni való sincs.` : `A ${size} elemű csomagokból ${base} is összeáll egy nagyobbá, ha tovább csomagolunk.`}`;

    const cols = digitsIn(MAX_N, base);
    const headRow = make("tr"), valueRow = make("tr"), digitRow = make("tr");
    headRow.append(make("th", "", "helyiérték"));
    valueRow.append(make("th", "", "értéke"));
    digitRow.append(make("th", "", "jegy"));
    for (let k = cols - 1; k >= 0; k--) {
      const used = k < digitsIn(n, base);
      headRow.append(make("td", "", `${base}${"⁰¹²³⁴⁵⁶⁷"[k]}`));
      valueRow.append(make("td", "", String(base ** k)));
      const cell = make("td", "", used ? String(digitAt(n, base, k)) : "0");
      cell.style.color = used ? "var(--accent)" : "var(--dim)";
      if (!used) cell.className = "il-dim";
      digitRow.append(cell);
    }
    table.replaceChildren(headRow, valueRow, digitRow);
    const digits = [];
    for (let k = digitsIn(n, base) - 1; k >= 0; k--) digits.push(digitAt(n, base, k));
    const terms = digits.map((d, i) => ({ d, k: digits.length - 1 - i })).filter((t) => t.d).map((t) => `${t.d} · ${base ** t.k}`);
    writtenLine.textContent = `${n} = ${terms.join(" + ")}  →  ${n} = ${digits.join("")}${subscript(base)}`;
  }

  function play() {
    state.stage = 0;
    render();
    playButton.disabled = true;
    const advance = () => {
      if (state.stage >= maxStage()) { playButton.disabled = false; return; }
      scope.timeout(() => { state.stage += 1; render(); playButton.disabled = true; advance(); }, 1600);
    };
    advance();
  }

  function renderBulbs() {
    const values = [128, 64, 32, 16, 8, 4, 2, 1];
    bulbToggles.forEach((t, i) => t.setAttribute("aria-pressed", String(bulbState.on.has(values[i]))));
    const active = values.filter((v) => bulbState.on.has(v));
    const total = active.reduce((sum, v) => sum + v, 0);
    bulbBits.textContent = `kettes: ${values.map((v) => (bulbState.on.has(v) ? 1 : 0)).join("")}₂`;
    bulbSum.textContent = `tízes: ${active.length ? active.join(" + ") : "0"} = ${total}`;
    if (bulbState.target === null) { bulbMessage.className = "il-message"; bulbMessage.textContent = ""; return; }
    const solved = total === bulbState.target;
    bulbMessage.className = solved ? "il-message good" : "il-message";
    bulbMessage.textContent = solved ? `Megvan: ${bulbState.target} = ${values.map((v) => (bulbState.on.has(v) ? 1 : 0)).join("")}₂.` : `Állítsd be a(z) ${bulbState.target} számot! Most ${total} világít. Tipp: kezdd a legnagyobb helyiértékkel, ami még belefér.`;
  }

  state.stage = maxStage();
  render();
  renderBulbs();
  return () => scope.clearAll();
}
