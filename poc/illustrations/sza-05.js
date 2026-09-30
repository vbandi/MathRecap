import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, range, rich, slot, stepper, svg, toggle } from "./kit.js";

const num = (n) => slot(String(n), 2, { align: "center" });
const TRICKS = [[25, 7, 4], [5, 17, 2], [125, 9, 8], [4, 13, 25], [50, 6, 2], [20, 7, 5]];

function drawGrid(parent, rows, cols, x0, y0, cell, colorOf) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      svg("rect", { x: x0 + c * cell + 1, y: y0 + r * cell + 1, width: cell - 2, height: cell - 2, rx: 3, style: `fill:${colorOf(c)};opacity:.85` }, parent);
    }
  }
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Számolásnál gyakran átrendezhetjük a műveleteket, hogy könnyebb legyen, és az eredmény ugyanaz marad. Itt kipróbálhatod, mikor szabad cserélni, csoportosítani vagy szétbontani."));

  // --- Distributivity ---
  const area = card("Szétosztás: egy téglalap két részre vágva");
  const state = { a: 4, b: 5, c: 3 };
  const areaFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 290", role: "img" });
  const areaLines = make("div", "il-formula start");
  const sliders = ["a", "b", "c"].map((key) => range({ label: key === "a" ? "a (magasság)" : key === "b" ? "b (kék rész)" : "c (zöld rész)", min: 1, max: 9, value: state[key], format: String, onInput: (value) => { state[key] = value; renderArea(); } }));
  area.append(controls(...sliders.map((s) => s.element)), areaFigure, areaLines);
  function renderArea() {
    const { a, b, c } = state, cell = Math.min(30, 480 / (b + c)), x0 = (600 - (b + c) * cell) / 2, y0 = 52;
    areaFigure.replaceChildren();
    drawGrid(areaFigure, a, b + c, x0, y0, cell, (col) => (col < b ? PALETTE.blue : PALETTE.green));
    svg("line", { x1: x0 + b * cell, x2: x0 + b * cell, y1: y0 - 10, y2: y0 + a * cell + 6, style: "stroke:var(--fg);stroke-width:2.5;stroke-dasharray:6 4" }, areaFigure);
    const label = (x, y, text, color) => svg("text", { x, y, "text-anchor": "middle", text, style: `fill:${color};font-size:16px;font-weight:700` }, areaFigure);
    label(x0 + (b * cell) / 2, y0 - 16, `b = ${b}`, PALETTE.blue);
    label(x0 + b * cell + (c * cell) / 2, y0 - 16, `c = ${c}`, PALETTE.green);
    label(x0 - 30, y0 + (a * cell) / 2 + 5, `a = ${a}`, "var(--fg-soft)");
    label(x0 + ((b + c) * cell) / 2, y0 + a * cell + 26, `${a * b} + ${a * c} = ${a * (b + c)} kis négyzet`, "var(--fg-soft)");
    areaLines.replaceChildren(
      rich(num(a), " · (", num(b), " + ", num(c), ") = ", num(a), " · ", num(b + c), " = ", num(a * (b + c))), make("br"),
      rich(num(a), " · ", num(b), " + ", num(a), " · ", num(c), " = ", num(a * b), " + ", num(a * c), " = ", num(a * b + a * c)),
    );
  }

  // --- Commutativity ---
  const swap = card("Felcserélés: forgatott téglalap");
  const swapState = { a: 3, b: 7, turned: false };
  const swapFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 250", role: "img" });
  const swapGroup = svg("g", { class: "il-move", style: "transform-origin:300px 125px" }, swapFigure);
  const swapLabels = svg("g", {}, swapFigure);
  const swapLine = make("div", "il-formula start");
  const swapA = stepper({ label: "a", min: 1, max: 9, value: swapState.a, onChange: (v) => { swapState.a = v; drawSwap(); } });
  const swapB = stepper({ label: "b", min: 1, max: 9, value: swapState.b, onChange: (v) => { swapState.b = v; drawSwap(); } });
  swap.append(controls(swapA.element, swapB.element, button("Forgatás 90°-kal", turn)), swapFigure, swapLine);
  function drawSwap() {
    const { a, b } = swapState, cell = 22;
    swapGroup.replaceChildren();
    drawGrid(swapGroup, a, b, 300 - (b * cell) / 2, 125 - (a * cell) / 2, cell, () => PALETTE.violet);
    swapGroup.style.transform = `rotate(${swapState.turned ? 90 : 0}deg)`;
    drawLabels();
  }
  function drawLabels() {
    const { a, b, turned } = swapState, rows = turned ? b : a, cols = turned ? a : b;
    swapLabels.replaceChildren();
    svg("text", { x: 300, y: 18, "text-anchor": "middle", text: `${cols} oszlop`, style: "font-size:15px" }, swapLabels);
    svg("text", { x: 18, y: 130, text: `${rows} sor`, style: "font-size:15px" }, swapLabels);
    swapLine.replaceChildren(rich(num(rows), " sor · ", num(cols), " oszlop = ", num(rows * cols), " kis négyzet"), make("br"), rich(num(a), " · ", num(b), " = ", num(b), " · ", num(a), " = ", num(a * b)));
  }
  function turn() {
    swapState.turned = !swapState.turned;
    swapGroup.style.transform = `rotate(${swapState.turned ? 90 : 0}deg)`;
    scope.timeout(drawLabels, 350);
  }

  // --- Associativity ---
  const group = card("Csoportosítás: zárójelek áthelyezése");
  const groupState = { values: [3, 4, 2], multiply: false, left: true };
  const groupFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 150", role: "img" });
  const groupLine = make("div", "il-formula start");
  const operationToggles = [toggle("Összeadás", true, () => setOperation(false)), toggle("Szorzás", false, () => setOperation(true))];
  const groupSteppers = groupState.values.map((value, index) => stepper({ label: ["a", "b", "c"][index], min: 1, max: 6, value, onChange: (v) => { groupState.values[index] = v; renderGroup(); } }));
  group.append(controls(...operationToggles, ...groupSteppers.map((s) => s.element)), groupFigure, groupLine, controls(button("Zárójel áthelyezése", () => { groupState.left = !groupState.left; renderGroup(); })));
  function setOperation(multiply) { groupState.multiply = multiply; operationToggles.forEach((t, i) => t.setAttribute("aria-pressed", String(i === (multiply ? 1 : 0)))); renderGroup(); }
  function renderGroup() {
    const { values: [a, b, c], multiply, left } = groupState, sign = multiply ? "·" : "+", colors = [PALETTE.blue, PALETTE.amber, PALETTE.green];
    const apply = (x, y) => (multiply ? x * y : x + y);
    groupFigure.replaceChildren();
    // Each value is a block of dots (addition) or a row of a-, b-, c-long bars (multiplication).
    let x = 20;
    const boxes = [];
    [a, b, c].forEach((value, index) => {
      const width = Math.max(1, Math.min(value, 6)) * 26 + 10;
      boxes.push({ x, width });
      for (let i = 0; i < value; i++) svg("circle", { cx: x + 18 + (i % 3) * 26 + (multiply ? 0 : 0), cy: 52 + Math.floor(i / 3) * 26, r: 10, style: `fill:${colors[index]}` }, groupFigure);
      svg("text", { x: x + 38, y: 134, "text-anchor": "middle", text: `${["a", "b", "c"][index]} = ${value}`, style: `fill:${colors[index]};font-weight:700` }, groupFigure);
      x += 3 * 26 + 50;
    });
    const from = left ? 0 : 1, to = left ? 1 : 2;
    svg("rect", { x: boxes[from].x - 6, y: 24, width: boxes[to].x + 3 * 26 + 10 - boxes[from].x, height: 82, rx: 14, style: "fill:none;stroke:var(--accent);stroke-width:3;stroke-dasharray:7 4" }, groupFigure);
    [0, 1].forEach((i) => svg("text", { x: boxes[i + 1].x - 26, y: 70, "text-anchor": "middle", text: sign, style: "font-size:26px;fill:var(--fg)" }, groupFigure));
    const inner = left ? apply(a, b) : apply(b, c);
    const total = left ? apply(inner, c) : apply(a, inner);
    groupLine.replaceChildren(left
      ? rich("(", num(a), ` ${sign} `, num(b), ") ", `${sign} `, num(c), " = ", num(inner), ` ${sign} `, num(c), " = ", num(total))
      : rich(num(a), ` ${sign} (`, num(b), ` ${sign} `, num(c), ") = ", num(a), ` ${sign} `, num(inner), " = ", num(total)));
  }

  // --- Mental maths ---
  const trick = card("Ügyes fejszámolás");
  let trickIndex = 0, clever = false;
  const trickLine = make("div", "il-formula start"), trickMessage = make("p", "il-message");
  const trickButtons = [toggle("Balról jobbra", true, () => { clever = false; renderTrick(); }), toggle("Ügyesen csoportosítva", false, () => { clever = true; renderTrick(); })];
  trick.append(controls(...trickButtons, button("Új példa", () => { trickIndex = (trickIndex + 1) % TRICKS.length; renderTrick(); }, { ghost: true })), trickLine, trickMessage);
  function renderTrick() {
    const [a, b, c] = TRICKS[trickIndex];
    trickButtons.forEach((t, i) => t.setAttribute("aria-pressed", String(i === (clever ? 1 : 0))));
    const easy = a * c, total = a * b * c;
    trickLine.replaceChildren(clever
      ? rich(`${a} · ${b} · ${c} = ${b} · (${a} · ${c}) = ${b} · ${easy} = ${total}`)
      : rich(`${a} · ${b} · ${c} = (${a} · ${b}) · ${c} = ${a * b} · ${c} = ${total}`));
    trickMessage.className = clever ? "il-message good" : "il-message";
    trickMessage.textContent = clever
      ? `A szorzás tagjait felcseréltük és átcsoportosítottuk: ${a} · ${c} = ${easy} kerek szám, így ${b} · ${easy} már fejben is megy.`
      : `Így is kijön, de ${a * b} · ${c} nehezebb. Próbáld ki az ügyes csoportosítást!`;
  }

  root.append(area, swap, group, trick, keyIdea("az összeadás és a szorzás tagjai felcserélhetők, és tetszőlegesen csoportosíthatók, az eredmény nem változik. A szorzás az összeadásra szétosztható: a · (b + c) = a · b + a · c. A kivonásra és az osztásra ez nem igaz."));
  renderArea(); drawSwap(); renderGroup(); renderTrick();
  return () => scope.clearAll();
}
