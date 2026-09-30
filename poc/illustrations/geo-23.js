import { button, card, controls, keyIdea, lead, make, PALETTE, svg } from "./kit.js";

const UNIT = 36, ORIGIN_X = 20, ORIGIN_Y = 20, COLUMNS = 15, ROWS = 9;
const FLAG = [[0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [2, 2], [2, 3], [1, 3], [1, 4], [0, 4]];
const PIVOT_INDEX = 0;

const pointsOf = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");
const translate = (points, dx, dy) => points.map(([x, y]) => [x + dx, y + dy]);
const rotate90 = (points, [px, py]) => points.map(([x, y]) => [px - (y - py), py + (x - px)]);
const mirrorVertical = (points, [px]) => points.map(([x, y]) => [2 * px - x, y]);
const mirrorHorizontal = (points, [, py]) => points.map(([x, y]) => [x, 2 * py - y]);

// Canonical description of a vertex set up to translation, rotation and reflection.
function canonical(points) {
  let best = null;
  for (let mirror = 0; mirror < 2; mirror++) {
    let current = mirror ? mirrorVertical(points, [0, 0]) : points;
    for (let turn = 0; turn < 4; turn++) {
      const minX = Math.min(...current.map(([x]) => x)), minY = Math.min(...current.map(([, y]) => y));
      const key = current.map(([x, y]) => `${x - minX},${y - minY}`).sort().join(";");
      if (best === null || key < best) best = key;
      current = rotate90(current, [0, 0]);
    }
  }
  return best;
}
const sameSet = (first, second) => pointsKey(first) === pointsKey(second);
const pointsKey = (points) => points.map(([x, y]) => `${x},${y}`).sort().join(";");

const OPTION_SHAPES = {
  reference: [[0, 0], [1, 0], [1, 2], [3, 2], [3, 3], [0, 3]],
};
const OPTIONS = [
  { points: [[0, 0], [1, 0], [1, 2], [4, 2], [4, 3], [0, 3]] },
  { points: rotate90(OPTION_SHAPES.reference, [0, 0]) },
  { points: [[0, 0], [1, 0], [1, 2], [3, 2], [3, 4], [0, 4]] },
  { points: mirrorVertical(OPTION_SHAPES.reference, [0, 0]) },
];

export function mount(root) {
  root.append(lead("Két alakzat egybevágó, ha az egyiket mozgatással (eltolással, forgatással vagy tükrözéssel) pontosan rá lehet illeszteni a másikra. A méretük és az alakjuk ugyanaz, csak a helyzetük más."));

  // --- Card 1: place the copy onto the target ---
  const state = { copy: [], target: [], moves: 0, solved: false };
  const puzzle = card("Illeszd rá a másolatot a szaggatott vonalra");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${ORIGIN_X * 2 + COLUMNS * UNIT} ${ORIGIN_Y * 2 + ROWS * UNIT}`, role: "img", "aria-label": "Rács, rajta a mozgatható alakzat és a célhelyzet" });
  const view = ([x, y]) => [ORIGIN_X + x * UNIT, ORIGIN_Y + y * UNIT];
  for (let i = 0; i <= COLUMNS; i++) svg("line", { class: "grid", x1: ORIGIN_X + i * UNIT, x2: ORIGIN_X + i * UNIT, y1: ORIGIN_Y, y2: ORIGIN_Y + ROWS * UNIT }, figure);
  for (let i = 0; i <= ROWS; i++) svg("line", { class: "grid", x1: ORIGIN_X, x2: ORIGIN_X + COLUMNS * UNIT, y1: ORIGIN_Y + i * UNIT, y2: ORIGIN_Y + i * UNIT }, figure);
  const targetShape = svg("polygon", { style: `fill:${PALETTE.amber};fill-opacity:.15;stroke:${PALETTE.amber};stroke-width:3;stroke-dasharray:8 6` }, figure);
  const copyShape = svg("polygon", { style: `fill:${PALETTE.blue};fill-opacity:.6;stroke:var(--fg);stroke-width:2.5;cursor:grab;touch-action:none` }, figure);
  const pivotDot = svg("circle", { r: 6, style: `fill:${PALETTE.red};stroke:var(--input);stroke-width:2;pointer-events:none` }, figure);
  const pivotLabel = svg("text", { style: `font-weight:700;fill:${PALETTE.red};pointer-events:none`, text: "P" }, figure);
  const moveButtons = controls(
    button("← eltolás", () => act((p) => translate(p, -1, 0)), { ghost: true }),
    button("→ eltolás", () => act((p) => translate(p, 1, 0)), { ghost: true }),
    button("↑ eltolás", () => act((p) => translate(p, 0, -1)), { ghost: true }),
    button("↓ eltolás", () => act((p) => translate(p, 0, 1)), { ghost: true }),
  );
  const turnButtons = controls(
    button("Forgatás 90°-kal P körül", () => act((p, pivot) => rotate90(p, pivot)), { ghost: true }),
    button("Tükrözés függőleges tengelyre", () => act((p, pivot) => mirrorVertical(p, pivot)), { ghost: true }),
    button("Tükrözés vízszintes tengelyre", () => act((p, pivot) => mirrorHorizontal(p, pivot)), { ghost: true }),
    button("Új feladat", newTask),
  );
  const puzzleMessage = make("p", "il-message");
  puzzle.append(figure, moveButtons, turnButtons, puzzleMessage);

  function act(transform) {
    state.copy = transform(state.copy, state.copy[PIVOT_INDEX]);
    state.moves += 1;
    renderPuzzle();
  }

  // Dragging moves the copy by whole grid units.
  let dragStart = null;
  copyShape.addEventListener("pointerdown", (event) => {
    copyShape.setPointerCapture(event.pointerId);
    event.preventDefault();
    dragStart = { pointer: null, copy: state.copy };
  });
  copyShape.addEventListener("pointermove", (event) => {
    if (!copyShape.hasPointerCapture(event.pointerId) || !dragStart) return;
    const point = figure.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(figure.getScreenCTM().inverse());
    dragStart.pointer ??= local;
    const dx = Math.round((local.x - dragStart.pointer.x) / UNIT), dy = Math.round((local.y - dragStart.pointer.y) / UNIT);
    const next = translate(dragStart.copy, dx, dy);
    if (!sameSet(next, state.copy)) { state.copy = next; state.moves += 1; renderPuzzle(); }
  });
  copyShape.addEventListener("pointerup", () => { dragStart = null; });

  function newTask() {
    // The target is the flag moved by a random rigid motion to the right half of the grid.
    let target = FLAG;
    const turns = Math.floor(Math.random() * 4);
    if (Math.random() < 0.5) target = mirrorVertical(target, [0, 0]);
    for (let i = 0; i < turns; i++) target = rotate90(target, [0, 0]);
    const minX = Math.min(...target.map(([x]) => x)), minY = Math.min(...target.map(([, y]) => y));
    target = translate(target, 8 - minX + Math.floor(Math.random() * 3), 1 - minY + Math.floor(Math.random() * 3));
    state.target = target;
    state.copy = translate(FLAG, 1, 2 + Math.floor(Math.random() * 2));
    state.moves = 0;
    renderPuzzle();
  }

  function renderPuzzle() {
    targetShape.setAttribute("points", pointsOf(state.target.map(view)));
    copyShape.setAttribute("points", pointsOf(state.copy.map(view)));
    const [px, py] = view(state.copy[PIVOT_INDEX]);
    pivotDot.setAttribute("cx", px); pivotDot.setAttribute("cy", py);
    pivotLabel.setAttribute("x", px + 9); pivotLabel.setAttribute("y", py - 8);
    const solved = sameSet(state.copy, state.target);
    puzzleMessage.className = `il-message ${solved ? "good" : ""}`;
    puzzleMessage.textContent = solved
      ? `Egybevágóak: a másolat pontosan fedi a célt, ${state.moves} mozgatással. Ha tükrözni kellett, az sem változtat a méreten és az alakon.`
      : "Húzd az alakzatot vagy használd a gombokat. A forgatás és a tükrözés a piros P pont körül történik. Ha a két alakzat forgásiránya eltér, tükrözni is kell.";
  }

  // --- Card 2: pick the congruent shapes ---
  const pick = card("Melyik egybevágó a mintával?");
  const pickFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 170", role: "group", "aria-label": "Minta és négy alakzat" });
  const selected = new Set();
  let checked = false;
  const panels = [null, ...OPTIONS].map((option, index) => {
    const x = index * 120 + 6;
    const group = svg("g", { class: index ? "il-item" : "", tabindex: index ? 0 : -1, role: index ? "button" : "img", "aria-label": index ? `${index}. alakzat` : "Minta" }, pickFigure);
    const background = svg("rect", { x, y: 6, width: 108, height: 130, rx: 10, style: `fill:var(--surface);stroke:${index ? "var(--line-strong)" : PALETTE.blue};stroke-width:${index ? 1.5 : 2.5}` }, group);
    const points = option?.points ?? OPTION_SHAPES.reference, s = 24;
    const minX = Math.min(...points.map(([px]) => px)), minY = Math.min(...points.map(([, py]) => py));
    const maxX = Math.max(...points.map(([px]) => px)), maxY = Math.max(...points.map(([, py]) => py));
    const ox = x + (108 - (maxX - minX) * s) / 2 - minX * s, oy = 6 + (130 - (maxY - minY) * s) / 2 - minY * s;
    svg("polygon", { points: pointsOf(points.map(([px, py]) => [ox + px * s, oy + py * s])), style: `fill:${index ? PALETTE.violet : PALETTE.blue};fill-opacity:.7;stroke:var(--fg);stroke-width:2;pointer-events:none` }, group);
    svg("text", { x: x + 54, y: 158, "text-anchor": "middle", text: index ? String(index) : "minta", style: "font-weight:700;fill:var(--fg)" }, pickFigure);
    if (index) {
      const toggleSelection = () => { if (checked) return; if (selected.has(index)) selected.delete(index); else selected.add(index); renderPick(); };
      group.addEventListener("click", toggleSelection);
      group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleSelection(); } });
    }
    return { background };
  });
  const checkButton = button("Ellenőrzés", () => { checked = true; renderPick(); });
  const resetButton = button("Újra", () => { checked = false; selected.clear(); renderPick(); }, { ghost: true });
  const pickMessage = make("p", "il-message");
  pick.append(make("p", "", "Kattints azokra az alakzatokra, amelyek egybevágók a mintával. A tükörkép is egybevágó, mert a tükrözés is egybevágósági mozgás."), pickFigure, controls(checkButton, resetButton), pickMessage);

  function renderPick() {
    const reference = canonical(OPTION_SHAPES.reference);
    const isCongruent = OPTIONS.map((option) => canonical(option.points) === reference);
    panels.slice(1).forEach(({ background }, i) => {
      const chosen = selected.has(i + 1);
      const right = isCongruent[i] === chosen;
      background.style.stroke = checked ? (right ? PALETTE.green : PALETTE.red) : chosen ? "var(--accent)" : "var(--line-strong)";
      background.style.strokeWidth = checked || chosen ? 3 : 1.5;
    });
    const correct = isCongruent.every((value, i) => value === selected.has(i + 1));
    pickMessage.className = `il-message ${checked ? (correct ? "good" : "warn") : ""}`;
    pickMessage.textContent = !checked
      ? `Kijelölt alakzatok: ${selected.size}.`
      : correct
        ? "Jól választottál! Az elforgatott és a tükrözött alakzat egybevágó. A megnyújtott és a másik méretű nem az: nem lehet rájuk illeszteni a mintát."
        : "Még nem teljesen jó (zöld: helyes, piros: hibás döntés). Képzeld el, hogy a mintát forgatod vagy tükrözöd: ráillik-e pontosan?";
  }

  root.append(puzzle, pick, keyIdea("két alakzat egybevágó, ha van olyan mozgás (eltolás, forgatás, tükrözés vagy ezek egymás utáni alkalmazása), amely az egyiket a másikra viszi. Egybevágó alakzatokban a megfelelő szakaszok és szögek egyenlők."));
  newTask();
  renderPick();
  return () => {};
}
