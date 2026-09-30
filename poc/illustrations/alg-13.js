import { button, card, controls, createScope, equation, gcd, keyIdea, lead, make, svg } from "./kit.js";

const PUZZLES = [
  { left: { x: 3, units: 2 }, right: { x: 1, units: 8 }, solution: 3 },
  { left: { x: 2, units: 5 }, right: { x: 0, units: 11 }, solution: 3 },
  { left: { x: 4, units: 1 }, right: { x: 2, units: 9 }, solution: 4 },
  { left: { x: 1, units: 10 }, right: { x: 3, units: 2 }, solution: 4 },
  { left: { x: 5, units: 3 }, right: { x: 2, units: 12 }, solution: 3 },
];
const PIVOT = { x: 300, y: 80 }, ARM = 210, PLATE_Y = 150;
const BOX = 34, UNIT = 20, GAP = 4, PAN_HALF_WIDTH = 82;
const KIND_NAMES = { x: "egy x dobozt", units: "egy 1-es súlyt" };
const SIDE_NAMES = { left: "bal", right: "jobb" };

function expression({ x, units }) {
  const terms = [];
  if (x) terms.push(x === 1 ? "x" : `${x}x`);
  if (units) terms.push(String(units));
  return terms.join(" + ") || "0";
}

// Positions of the items on a pan, relative to its hanging point: boxes on the bottom rows, weights above.
function panLayout({ x, units }) {
  const items = [];
  let bottom = PLATE_Y;
  const place = (count, kind, size) => {
    const perRow = Math.floor((2 * PAN_HALF_WIDTH + GAP) / (size + GAP));
    for (let row = 0; row * perRow < count; row++) {
      const inRow = Math.min(perRow, count - row * perRow);
      const rowWidth = inRow * size + (inRow - 1) * GAP;
      for (let i = 0; i < inRow; i++) items.push({ kind, x: -rowWidth / 2 + i * (size + GAP), y: bottom - size - 2, size });
      bottom -= size + GAP;
    }
  };
  place(x, "x", BOX);
  place(units, "units", UNIT);
  return items;
}

export function mount(root) {
  const scope = createScope();
  let puzzleIndex = 0, state, demoRunning = false;

  root.append(lead("Az egyenlet olyan, mint egy egyensúlyban lévő mérleg. Az x dobozok egyforma, ismeretlen súlyúak, a kis súlyok 1-esek. Ha valamit leveszel az egyik oldalról, a mérleg megbillen — csak akkor marad egyensúlyban, ha a másik oldallal is ugyanazt teszed."));

  const main = card("Mérlegelv");
  const equationLine = make("div");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img" });
  svg("path", { d: `M ${PIVOT.x} ${PIVOT.y} L ${PIVOT.x - 46} 322 L ${PIVOT.x + 46} 322 Z`, style: "fill:var(--surface);stroke:var(--line-strong);stroke-width:2" }, figure);
  svg("rect", { x: 200, y: 322, width: 200, height: 8, rx: 3, style: "fill:var(--line-strong)" }, figure);
  const beam = svg("g", { class: "il-move", style: `transform-origin:${PIVOT.x}px ${PIVOT.y}px` }, figure);
  svg("rect", { x: PIVOT.x - ARM - 10, y: PIVOT.y - 6, width: 2 * ARM + 20, height: 12, rx: 6, style: "fill:var(--dim)" }, beam);
  svg("path", { d: `M ${PIVOT.x - 10} ${PIVOT.y - 22} L ${PIVOT.x + 10} ${PIVOT.y - 22} L ${PIVOT.x} ${PIVOT.y - 6} Z`, style: "fill:var(--accent)" }, beam);
  svg("circle", { cx: PIVOT.x, cy: PIVOT.y, r: 7, style: "fill:var(--fg-soft)" }, figure);
  const pans = {};
  for (const side of ["left", "right"]) {
    const group = svg("g", { class: "il-move" }, figure);
    svg("path", { d: `M 0 0 L ${-PAN_HALF_WIDTH} ${PLATE_Y} M 0 0 L ${PAN_HALF_WIDTH} ${PLATE_Y}`, style: "stroke:var(--line-strong);stroke-width:1.5" }, group);
    svg("path", { d: `M ${-PAN_HALF_WIDTH - 8} ${PLATE_Y} Q 0 ${PLATE_Y + 26} ${PAN_HALF_WIDTH + 8} ${PLATE_Y} Z`, style: "fill:var(--surface);stroke:var(--line-strong);stroke-width:2" }, group);
    pans[side] = { group, items: svg("g", {}, group) };
  }
  const message = make("p", "il-message");
  const undoButton = button("Visszatesz", undo, { ghost: true });
  const divideButton = button("Osztás", divide);
  const demoButton = button("Mutasd meg", runDemo, { ghost: true });
  const nextButton = button("Új egyenlet", () => { puzzleIndex = (puzzleIndex + 1) % PUZZLES.length; start(); }, { ghost: true });
  const history = make("ol", "il-steps");
  main.append(equationLine, figure, message, controls(divideButton, undoButton, demoButton, nextButton), make("p", "il-muted", "Kattints egy dobozra vagy súlyra, hogy levedd a mérlegről."), history);
  root.append(main, keyIdea("az egyenlet mindkét oldalán ugyanazt a műveletet kell elvégezni — ugyanannyit elvenni, hozzáadni, vagy ugyanannyi részre osztani. Így a megoldás nem változik, az egyenlet viszont egyre egyszerűbb lesz, amíg egyedül nem marad az x."));

  function start() {
    scope.clearAll();
    demoRunning = false;
    const puzzle = PUZZLES[puzzleIndex];
    state = { left: { ...puzzle.left }, right: { ...puzzle.right }, pending: null, solved: false };
    history.replaceChildren(make("li", "", `${expression(state.left)} = ${expression(state.right)}`));
    setMessage("");
    render();
  }

  const weight = (side) => state[side].x * PUZZLES[puzzleIndex].solution + state[side].units;
  const setMessage = (text, tone = "") => { message.textContent = text; message.className = `il-message ${tone}`; };

  function addStep(operation) {
    const row = make("li");
    row.append(`${expression(state.left)} = ${expression(state.right)}`, make("span", "il-muted", `  | ${operation}`));
    history.append(row);
  }

  function render() {
    const difference = weight("right") - weight("left");
    const angle = difference === 0 ? 0 : Math.sign(difference) * Math.min(11, 4 + Math.abs(difference));
    beam.style.transform = `rotate(${angle}deg)`;
    const radians = (angle * Math.PI) / 180;
    for (const side of ["left", "right"]) {
      const direction = side === "left" ? -1 : 1;
      const hangX = PIVOT.x + direction * ARM * Math.cos(radians), hangY = PIVOT.y + direction * ARM * Math.sin(radians);
      pans[side].group.style.transform = `translate(${hangX}px, ${hangY}px)`;
      pans[side].items.replaceChildren();
      for (const item of panLayout(state[side])) {
        const group = svg("g", { class: "il-item", role: "button", tabindex: 0, "aria-label": `${item.kind === "x" ? "x doboz" : "1-es súly"} a ${SIDE_NAMES[side]} oldalon` }, pans[side].items);
        group.dataset.kind = item.kind;
        const isBox = item.kind === "x";
        svg("rect", { x: item.x, y: item.y, width: item.size, height: item.size, rx: isBox ? 6 : 4, style: isBox ? "fill:var(--il-green);stroke:#7ee0c8;stroke-width:1.5" : "fill:var(--il-amber)" }, group);
        svg("text", { x: item.x + item.size / 2, y: item.y + item.size / 2 + (isBox ? 6 : 4), "text-anchor": "middle", text: isBox ? "x" : "1", style: `fill:${isBox ? "#fff" : "#2a1a00"};font-weight:700;font-size:${isBox ? 17 : 12}px` }, group);
        const activate = () => { if (!demoRunning) remove(side, item.kind); };
        group.addEventListener("click", activate);
        group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); } });
      }
    }
    const balanced = difference === 0;
    equationLine.replaceChildren(equation(expression(state.left), expression(state.right), balanced ? "=" : "≠"));
    equationLine.querySelector("b").style.color = balanced ? "" : "var(--warn)";
    const divisor = commonDivisor();
    divideButton.textContent = divisor > 1 ? `Mindkét oldal ÷ ${divisor}` : "Osztás";
    divideButton.disabled = demoRunning || state.solved || state.pending !== null || divisor < 2;
    undoButton.hidden = state.pending === null;
    demoButton.disabled = demoRunning || state.solved;
  }

  function commonDivisor() {
    const { left, right } = state;
    return [left.x, left.units, right.x, right.units].reduce((result, value) => gcd(result, value), 0);
  }

  function remove(side, kind) {
    if (state.solved) return;
    const other = side === "left" ? "right" : "left";
    if (state.pending) {
      if (side === state.pending.side) return setMessage("Előbb a másik oldalról is vedd le ugyanazt — vagy tedd vissza, amit levettél.", "warn");
      if (kind !== state.pending.kind) return setMessage(`Nem ugyanaz! A ${SIDE_NAMES[side]} oldalról is ${KIND_NAMES[state.pending.kind]} kell levenni.`, "warn");
    }
    state[side][kind] -= 1;
    if (!state.pending) {
      state.pending = { side, kind };
      setMessage(state[other][kind] > 0
        ? `Megbillent! Most a ${SIDE_NAMES[other]} oldalról is vegyél le ${KIND_NAMES[kind]}.`
        : `Megbillent! A ${SIDE_NAMES[other]} oldalon nincs ilyen, amit levehetnél — tedd vissza.`, "warn");
    }
    else {
      state.pending = null;
      addStep(kind === "x" ? "−x mindkét oldalon" : "−1 mindkét oldalon");
      setMessage("Újra egyensúlyban. Az egyenlet egyszerűbb lett, a megoldása ugyanaz.", "good");
      checkSolved();
    }
    render();
  }

  function undo() {
    if (!state.pending) return;
    const { side, kind } = state.pending;
    state[side][kind] += 1;
    state.pending = null;
    setMessage("Visszatettük, a mérleg újra egyensúlyban van.");
    render();
  }

  function divide() {
    const divisor = commonDivisor();
    for (const side of ["left", "right"]) { state[side].x /= divisor; state[side].units /= divisor; }
    addStep(`÷ ${divisor} mindkét oldalon`);
    setMessage(`Mindkét oldalt ${divisor} egyforma csoportra osztottuk, és egy csoportot megtartottunk. Az egyensúly megmaradt.`, "good");
    checkSolved();
    render();
  }

  function checkSolved() {
    const { left, right } = state;
    const alone = (a, b) => a.x === 1 && a.units === 0 && b.x === 0;
    if (!alone(left, right) && !alone(right, left)) return;
    state.solved = true;
    const puzzle = PUZZLES[puzzleIndex];
    const value = puzzle.solution;
    const check = (term) => `${term.x ? `${term.x}·${value}` : ""}${term.x && term.units ? " + " : ""}${term.units || ""}`;
    setMessage(`Megvan: x = ${value}. Ellenőrzés: ${check(puzzle.left)} = ${puzzle.left.x * value + puzzle.left.units} és ${check(puzzle.right)} = ${puzzle.right.x * value + puzzle.right.units}. ✓`, "good");
  }

  // Solves step by step from the current state, showing the tilt between the two halves of each step.
  function runDemo() {
    if (state.pending) undo();
    demoRunning = true;
    render();
    const actions = [];
    const { left, right } = state;
    const commonX = Math.min(left.x, right.x);
    for (let i = 0; i < commonX; i++) actions.push(["left", "x"], ["right", "x"]);
    const xSide = left.x - commonX > 0 ? "left" : "right";
    const otherSide = xSide === "left" ? "right" : "left";
    for (let i = 0; i < state[xSide].units; i++) actions.push([xSide, "units"], [otherSide, "units"]);
    let delay = 300;
    actions.forEach(([side, kind], index) => {
      delay += index % 2 === 0 ? 650 : 900;
      scope.timeout(() => remove(side, kind), delay);
    });
    scope.timeout(() => {
      if (commonDivisor() > 1 && !state.solved) divide();
      demoRunning = false;
      render();
    }, delay + 1100);
  }

  start();
  return () => scope.clearAll();
}
