import { button, card, createScope, keyIdea, lead, make, PALETTE, slot, stepper, svg, toggle } from "./kit.js";

const PEOPLE = [
  { letter: "A", name: "Anna", color: PALETTE.red },
  { letter: "B", name: "Bence", color: PALETTE.blue },
  { letter: "C", name: "Csilla", color: PALETTE.green },
  { letter: "D", name: "Dani", color: PALETTE.amber },
  { letter: "E", name: "Eszter", color: PALETTE.violet },
  { letter: "F", name: "Feri", color: PALETTE.pink },
];
const SIZE = 340;

export function mount(root) {
  const scope = createScope();
  let n = 5, mode = "ordered", merged = 0, selected = null, timer = null;

  root.append(lead("Egy baráti társaságból két embert választunk ki. Ha két külön szerepet osztunk (elnök és titkár), akkor az számít, ki melyik. Ha csak két küldöttet küldünk, akkor csak az számít, kik mentek el. Ugyanabból a társaságból így más-más számú választás lesz."));

  const panel = card("Páros választás");
  const controlRow = make("div", "il-controls");
  const modeRow = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${SIZE} ${SIZE}`, role: "img", "aria-label": "Táblázat a kiválasztható párokról" });
  figure.style.maxWidth = "380px";
  const counter = make("div", "il-formula start");
  const message = make("p", "il-message");
  panel.append(controlRow, modeRow, figure, counter, message);
  root.append(panel, keyIdea("ha a sorrend számít, n · (n − 1) választás van; ha nem számít, minden pár kétszer szerepel (AB és BA), ezért n · (n − 1) / 2 a számuk. A két szám aránya pontosan 2."));

  let cells = [];
  const total = () => n * (n - 1);
  const pairsTotal = () => total() / 2;
  const cellSize = () => (SIZE - 10) / (n + 1);
  const position = (row, col) => ({ x: 5 + (col + 1) * cellSize(), y: 5 + (row + 1) * cellSize() });

  controlRow.append(stepper({ label: "Barátok száma", min: 3, max: 6, value: n, onChange: (value) => { n = value; rebuild(); } }).element);
  modeRow.append(
    toggle("Elnök + titkár (a sorrend számít)", true, () => setMode("ordered")),
    toggle("Két küldött (a sorrend nem számít)", false, () => setMode("unordered")),
    button("Vonjuk össze a párokat", () => startMerging()),
  );

  function setMode(next) {
    mode = next; merged = 0; selected = null;
    stopTimer();
    if (mode === "unordered") startMerging(); else render();
  }
  function stopTimer() { if (timer !== null) { scope.clearInterval(timer); timer = null; } }
  function startMerging() {
    mode = "unordered"; merged = 0; selected = null;
    stopTimer(); render();
    timer = scope.interval(() => {
      merged += 1; render();
      if (merged >= pairsTotal()) stopTimer();
    }, 450);
  }
  // pairs (i < j) in a fixed order; the k-th pair merges its mirror cell (j, i) into (i, j)
  const pairOrder = () => { const list = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) list.push([i, j]); return list; };

  function rebuild() {
    stopTimer(); merged = 0; selected = null;
    figure.replaceChildren();
    cells = [];
    const size = cellSize();
    PEOPLE.slice(0, n).forEach((person, i) => {
      svg("text", { x: position(-1, i).x + size / 2, y: position(-1, i).y + size / 2 + 5, "text-anchor": "middle", "font-weight": 700, text: person.letter, style: `fill:${person.color}` }, figure);
      svg("text", { x: position(i, -1).x + size / 2, y: position(i, -1).y + size / 2 + 5, "text-anchor": "middle", "font-weight": 700, text: person.letter, style: `fill:${person.color}` }, figure);
    });
    svg("text", { x: 5 + size / 2, y: 5 + size / 2 + 4, "text-anchor": "middle", text: "1. ↓  2. →", style: "fill:var(--dim);font-size:10px" }, figure);
    for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
      const group = svg("g", { class: "il-move" }, figure);
      const at = position(row, col);
      group.style.transform = `translate(${at.x}px, ${at.y}px)`;
      const rect = svg("rect", { x: 2, y: 2, width: size - 4, height: size - 4, rx: 8 }, group);
      const label = svg("text", { x: size / 2, y: size / 2 + 5, "text-anchor": "middle", text: row === col ? "✕" : PEOPLE[row].letter + PEOPLE[col].letter }, group);
      if (row === col) {
        rect.setAttribute("fill", "none"); rect.setAttribute("stroke", "var(--line)"); label.style.fill = "var(--line-strong)";
      } else {
        group.style.cursor = "pointer";
        group.addEventListener("click", () => { selected = selected && selected[0] === row && selected[1] === col ? null : [row, col]; render(); });
      }
      cells.push({ row, col, group, rect, label });
    }
    render();
  }

  function render() {
    const ordered = mode === "ordered";
    modeRow.children[0].setAttribute("aria-pressed", String(ordered));
    modeRow.children[1].setAttribute("aria-pressed", String(!ordered));
    const mergedPairs = pairOrder().slice(0, merged);
    const isMerged = (i, j) => mergedPairs.some(([a, b]) => a === i && b === j);
    for (const cell of cells) {
      const { row, col, group, rect, label } = cell;
      if (row === col) continue;
      const mirrorGone = row > col && isMerged(col, row);
      const at = mirrorGone ? position(col, row) : position(row, col);
      group.style.transform = `translate(${at.x}px, ${at.y}px)`;
      group.style.opacity = mirrorGone ? 0 : 1;
      group.style.pointerEvents = mirrorGone ? "none" : "";
      const twinSelected = selected && ((selected[0] === row && selected[1] === col) || (!ordered && selected[0] === col && selected[1] === row));
      const both = row < col && isMerged(row, col);
      rect.setAttribute("fill", twinSelected ? "var(--accent-soft)" : both ? "rgba(255,255,255,.06)" : "var(--surface)");
      rect.setAttribute("stroke", twinSelected ? "var(--accent)" : both ? "var(--accent)" : "var(--line-strong)");
      rect.setAttribute("stroke-width", twinSelected ? 2.5 : 1);
      label.textContent = both ? `${PEOPLE[row].letter}${PEOPLE[col].letter}=${PEOPLE[col].letter}${PEOPLE[row].letter}` : PEOPLE[row].letter + PEOPLE[col].letter;
      label.style.fontSize = both && n >= 5 ? "9px" : "";
      label.style.fill = twinSelected ? "var(--accent)" : "var(--fg-soft)";
    }
    const remaining = total() - merged;
    counter.replaceChildren(ordered
      ? `${n} · ${n - 1} = `
      : `${n} · ${n - 1} ÷ 2 = `,
    make("b", "", String(ordered ? total() : pairsTotal())),
    ` · megmaradt cella: `, slot(String(ordered ? total() : remaining), 3, { align: "left" }));
    message.className = "il-message";
    if (selected) {
      const [r, c] = selected, a = PEOPLE[r], b = PEOPLE[c];
      message.textContent = ordered
        ? `${a.name} az elnök, ${b.name} a titkár. Ha fordítva lenne (${b.name} az elnök), az másik választás: ${b.letter}${a.letter}.`
        : `${a.name} és ${b.name} együtt mennek küldöttnek. Mindegy, melyiküket soroljuk fel előbb: ${a.letter}${b.letter} és ${b.letter}${a.letter} ugyanaz a páros.`;
    } else {
      message.textContent = ordered
        ? `Sorok: ki az elnök, oszlopok: ki a titkár. A főátlóban ✕: ugyanaz az ember nem lehet mindkettő. Összesen ${total()} lehetőség. Kattints egy cellára!`
        : merged < pairsTotal() ? "Minden pár két cellában szerepelt (AB és BA): most egyesével összevonjuk őket."
          : `Minden páros kétszer szerepelt, most már egyszer: ${pairsTotal()} különböző küldöttpár.`;
    }
  }

  rebuild();
  return () => scope.clearAll();
}
