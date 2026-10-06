import { card, equation, keyIdea, lead, make, PALETTE, rich, toggle } from "./kit.js";

const NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);
const isA = (n) => n % 2 === 0, isB = (n) => n > 5;
const OPERATIONS = [
  { id: "not", label: "nem A", header: "nem A", fn: (a) => !a, meaning: "Ott igaz, ahol A hamis: a tagadás megfordítja az igazságértéket.", example: "„Nem esik az eső” akkor igaz, ha az „esik az eső” hamis." },
  { id: "and", label: "A és B", header: "A és B", fn: (a, b) => a && b, meaning: "Csak ott igaz, ahol mindkét állítás igaz.", example: "„Van nálam toll és füzet”: mindkettő kell hozzá." },
  { id: "or", label: "A vagy B (megengedő)", header: "A vagy B", fn: (a, b) => a || b, meaning: "Ott igaz, ahol legalább az egyik igaz, a kettő együtt is jó.", example: "„Kérsz tejet vagy cukrot a teába?” Mind a kettő is kérhető, ez a megengedő vagy. A matematikában ezt használjuk, ha nincs másképp jelezve." },
  { id: "xor", label: "vagy A, vagy B (kizáró)", header: "kizáró", fn: (a, b) => a !== b, meaning: "Ott igaz, ahol pontosan az egyik igaz; ha mindkettő igaz, már nem.", example: "„Vagy moziba megyünk, vagy otthon maradunk.” A kettő együtt nem lehet, ez a kizáró vagy." },
];
const ROWS = [[true, true], [true, false], [false, true], [false, false]];
const word = (value) => (value ? "I" : "H");

export function mount(root) {
  const state = { operation: 1, hoverNumber: null, hoverRow: null };

  root.append(lead("Az állításokat összekapcsolhatjuk. A „nem” megfordítja az igazságot, az „és” azt kéri, hogy mindkettő igaz legyen, a „vagy” pedig azt, hogy legalább az egyik. Itt az A állítás: „a szám páros”, a B állítás: „a szám nagyobb 5-nél”."));

  const play = card("Hol igaz az összetett állítás?");
  const picker = make("div", "il-controls");
  const grid = make("div");
  grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(54px,1fr));gap:8px;margin:12px 0";
  const cells = NUMBERS.map((n) => {
    const cell = make("div");
    cell.style.cssText = "padding:8px 0 6px;border:2px solid var(--line-strong);border-radius:12px;text-align:center;cursor:default;transition:background-color .2s,opacity .2s,border-color .2s";
    const number = make("div", "", String(n));
    number.style.cssText = "font:700 20px var(--font-mono)";
    const tags = make("div");
    tags.style.cssText = "font:600 11px var(--font);letter-spacing:.05em;height:1.4em";
    const tagA = make("span", "", "A"), tagB = make("span", "", "B");
    tagA.style.color = PALETTE.violet; tagB.style.color = PALETTE.blue;
    tagA.style.opacity = isA(n) ? 1 : 0.2; tagB.style.opacity = isB(n) ? 1 : 0.2;
    tagA.style.marginRight = "6px";
    tags.append(tagA, tagB);
    cell.append(number, tags);
    cell.addEventListener("mouseenter", () => { state.hoverNumber = n; paint(); });
    cell.addEventListener("mouseleave", () => { state.hoverNumber = null; paint(); });
    return cell;
  });
  grid.append(...cells);
  const setLine = make("div");

  const table = make("table", "il-table");
  const head = make("tr");
  head.append(make("th", "", "A"), make("th", "", "B"), ...OPERATIONS.map((o) => make("th", "", o.header)));
  table.append(head);
  const tableRows = ROWS.map(([a, b]) => {
    const row = make("tr");
    row.append(make("td", "", word(a)), make("td", "", word(b)), ...OPERATIONS.map((o) => make("td", "", word(o.fn(a, b)))));
    row.addEventListener("mouseenter", () => { state.hoverRow = [a, b]; paint(); });
    row.addEventListener("mouseleave", () => { state.hoverRow = null; paint(); });
    table.append(row);
    return { row, a, b };
  });
  for (const cell of table.querySelectorAll("th, td")) { cell.style.textAlign = "center"; cell.style.width = "auto"; cell.style.padding = "4px 12px"; cell.style.whiteSpace = "nowrap"; }
  const meaning = make("p", "il-message");
  const example = make("div");
  example.style.cssText = "margin:10px 0 0;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--input);color:var(--fg-soft);min-height:4.8em";
  play.append(picker, grid, setLine, meaning, make("div", "il-muted", "Igazságtábla (I = igaz, H = hamis). Vidd az egeret egy szám vagy egy sor fölé!"), table, example);
  root.append(play, keyIdea("a matematikai „vagy” megengedő: az is jó, ha mindkettő igaz. Ha azt akarjuk, hogy csak az egyik lehessen, külön kimondjuk: „vagy … vagy …”."));

  const operation = () => OPERATIONS[state.operation];

  function paint() {
    const op = operation();
    picker.replaceChildren(...OPERATIONS.map((o, i) => toggle(o.label, state.operation === i, () => { state.operation = i; paint(); })));
    const truth = NUMBERS.filter((n) => op.fn(isA(n), isB(n)));
    NUMBERS.forEach((n, i) => {
      const value = op.fn(isA(n), isB(n));
      const cell = cells[i];
      const matchesRow = state.hoverRow && state.hoverRow[0] === isA(n) && state.hoverRow[1] === isB(n);
      cell.style.background = value ? "color-mix(in srgb, var(--accent) 28%, transparent)" : "transparent";
      cell.style.opacity = value ? 1 : 0.5;
      cell.style.borderColor = state.hoverNumber === n || matchesRow ? "var(--fg)" : value ? "var(--accent)" : "var(--line-strong)";
    });
    setLine.replaceChildren(equation(`ahol „${op.label.split(" (")[0]}” igaz`, rich("{ ", make("span", "il-accent", truth.join("; ") || "∅"), " }"), "→"));
    meaning.textContent = op.meaning;
    example.textContent = `Hétköznapi példa: ${op.example}`;
    const hoverKey = state.hoverNumber !== null ? [isA(state.hoverNumber), isB(state.hoverNumber)] : state.hoverRow;
    tableRows.forEach(({ row, a, b }) => {
      const active = hoverKey && hoverKey[0] === a && hoverKey[1] === b;
      row.style.background = active ? "color-mix(in srgb, var(--fg) 12%, transparent)" : "";
      [...row.children].forEach((td, i) => {
        const selected = i === state.operation + 2;
        td.style.color = selected ? "var(--accent)" : "";
        td.style.fontWeight = selected ? "700" : "";
        td.style.background = selected && active ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "";
      });
    });
    [...head.children].forEach((th, i) => { th.style.color = i === state.operation + 2 ? "var(--accent)" : ""; });
  }

  paint();
  return () => {};
}
