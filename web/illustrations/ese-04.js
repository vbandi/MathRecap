import { button, card, createScope, keyIdea, lead, make, PALETTE, slot, stepper, svg } from "./kit.js";

const STAGES = [
  { name: "Póló", labels: ["1", "2", "3"], color: PALETTE.red },
  { name: "Nadrág", labels: ["a", "b", "c"], color: PALETTE.blue },
  { name: "Cipő", labels: ["x", "y"], color: PALETTE.green },
];
const WIDTH = 560, HEIGHT = 340, COLUMN_X = [40, 170, 300, 430];
const DIGITS = [0, 1, 2, 3, 4];
const CASES = [
  { last: 0, color: PALETTE.blue, formula: "4 · 3 · 1", note: "Az első jegy a maradék 4 közül bármelyik, a középső a maradék 3-ból." },
  { last: 2, color: PALETTE.green, formula: "3 · 3 · 1", note: "Az első jegy nem lehet 0 és nem lehet 2: 3 lehetőség. A középső 3-féle lehet." },
  { last: 4, color: PALETTE.amber, formula: "3 · 3 · 1", note: "Ugyanaz, mint a 2-nél." },
];

// three-digit numbers with distinct digits from 0..4, ending in `last`, no leading zero
function evenNumbers(last) {
  const numbers = [];
  for (const first of DIGITS) for (const middle of DIGITS) {
    if (first === 0 || first === last || middle === last || first === middle) continue;
    numbers.push(`${first}${middle}${last}`);
  }
  return numbers;
}

export function mount(root) {
  const scope = createScope();
  const counts = [2, 2, 2];
  let shown = 0, treeTimer = null;

  root.append(lead("Ha egymás után döntünk, és minden döntésnél ugyanannyi lehetőségünk van, akármit választottunk korábban, akkor a lehetőségek száma a döntésenkénti számok szorzata. Ha viszont a feladat külön helyzetekre esik szét, akkor minden helyzetet külön számolunk meg, és az eredményeket összeadjuk."));

  const treeCard = card("Szorzás: öltözködés fa-diagrammal");
  const treeControls = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Fa-diagram az összeállításokról" });
  const treeFormula = make("div", "il-formula start");
  treeCard.append(treeControls, figure, treeFormula, make("p", "il-muted", "Minden levél (jobb szélső pont) egy különböző összeállítás. Minden ágnál annyi új ág nő, ahány lehetőség van, ezért szorzunk."));

  const caseCard = card("Összeadás: esetszétválasztás");
  caseCard.append(make("p", "", "Hány háromjegyű páros szám készíthető a 0, 1, 2, 3, 4 számjegyekből, ha egy számjegyet csak egyszer használhatunk?"));
  const caseGrid = make("div");
  caseGrid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px";
  const caseTotal = make("div", "il-formula start");
  const caseControls = make("div", "il-controls");
  caseCard.append(caseControls, caseGrid, caseTotal, make("p", "il-muted", "Miért kell szétválasztani? Ha az utolsó jegy 0, az első jegy bármi lehet. Ha 2 vagy 4 az utolsó, az első jegy nem lehet 0, tehát ott a szorzat első tagja kisebb: más a számolás."));

  root.append(treeCard, caseCard, keyIdea("„és” (egymás utáni döntések) → szorzás; „vagy” (külön esetek) → összeadás. Az eseteknek ne legyen közös eleme, és együtt mindent fedjenek le."));

  ["Pólók", "Nadrágok", "Cipők"].forEach((label, i) => {
    treeControls.append(stepper({ label, min: 1, max: STAGES[i].labels.length, value: counts[i], onChange: (value) => { counts[i] = value; buildTree(); } }).element);
  });
  treeControls.append(button("Újrajátszás", () => buildTree(), { ghost: true }));
  caseControls.append(button("Lejátszás", playCases));

  let nodes = [];
  const total = () => counts[0] * counts[1] * counts[2];

  function buildTree() {
    if (treeTimer !== null) scope.clearInterval(treeTimer);
    figure.replaceChildren();
    nodes = [];
    shown = 0;
    const leaves = total(), rowHeight = Math.min(34, (HEIGHT - 50) / leaves);
    STAGES.forEach((stage, level) => svg("text", { x: COLUMN_X[level + 1], y: 18, "text-anchor": "middle", "font-weight": 700, text: stage.name, style: "fill:var(--dim)" }, figure));
    let leafIndex = 0;
    function layout(level) {
      if (level === 3) { const leaf = { level, y: 34 + (leafIndex + 0.5) * rowHeight, first: leafIndex, kids: [] }; leafIndex += 1; return leaf; }
      const kids = Array.from({ length: counts[level] }, (_, j) => ({ label: STAGES[level].labels[j], ...layout(level + 1) }));
      return { level, kids, first: kids[0].first, y: kids.reduce((sum, kid) => sum + kid.y, 0) / kids.length };
    }
    const tree = layout(0);
    const edges = svg("g", {}, figure), circles = svg("g", {}, figure);
    (function draw(node, parent) {
      if (parent) {
        const mid = (COLUMN_X[parent.level] + COLUMN_X[node.level]) / 2;
        const path = svg("path", { d: `M${COLUMN_X[parent.level]},${parent.y} C${mid},${parent.y} ${mid},${node.y} ${COLUMN_X[node.level]},${node.y}`, fill: "none", stroke: "var(--line-strong)", "stroke-width": 2, class: "il-fade" }, edges);
        nodes.push({ element: path, first: node.first });
      }
      const group = svg("g", { class: "il-fade" }, circles);
      svg("circle", { cx: COLUMN_X[node.level], cy: node.y, r: node.level === 0 ? 7 : 12, fill: node.level === 0 ? "var(--dim)" : STAGES[node.level - 1].color }, group);
      if (node.label) svg("text", { x: COLUMN_X[node.level], y: node.y + 4, "text-anchor": "middle", text: node.label, style: "fill:#fff;font-weight:700;font-size:12px" }, group);
      if (node.level === 3) svg("text", { x: COLUMN_X[3] + 26, y: node.y + 4, text: String(node.first + 1), style: "fill:var(--accent);font-weight:700" }, group);
      nodes.push({ element: group, first: node.first });
      node.kids.forEach((kid) => draw(kid, node));
    })(tree, null);
    renderTree();
    treeTimer = scope.interval(() => {
      shown += 1; renderTree();
      if (shown >= leaves) { scope.clearInterval(treeTimer); treeTimer = null; }
    }, 260);
  }

  function renderTree() {
    for (const { element, first } of nodes) element.style.opacity = shown > first ? 1 : 0;
    treeFormula.replaceChildren(`${counts[0]} · ${counts[1]} · ${counts[2]} = `, make("b", "", String(total())), " összeállítás · eddig a fán: ", slot(String(shown), 3, { align: "left" }));
  }

  let casesToken = 0;
  function playCases() {
    casesToken += 1;
    const token = casesToken;
    caseGrid.replaceChildren(); caseTotal.replaceChildren();
    const columns = CASES.map((item) => {
      const box = make("div");
      box.style.cssText = `padding:10px;border:1px solid var(--line);border-top:3px solid ${item.color};border-radius:10px`;
      const count = make("b", "il-accent", "0");
      count.style.fontSize = "22px";
      const numbers = make("div");
      numbers.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;min-height:5.2em;margin:6px 0;font:13px var(--font-mono)";
      box.append(make("div", "", `Az utolsó jegy: ${item.last}`), make("div", "il-muted", item.formula), count, numbers, make("div", "il-muted", item.note));
      caseGrid.append(box);
      return { count, numbers, list: evenNumbers(item.last) };
    });
    const totals = [0, 0, 0];
    let tick = 0;
    const timer = scope.interval(() => {
      if (token !== casesToken) { scope.clearInterval(timer); return; }
      columns.forEach((column, index) => {
        if (tick < column.list.length) {
          column.numbers.append(make("span", "", column.list[tick]));
          totals[index] += 1;
          column.count.textContent = String(totals[index]);
        }
      });
      tick += 1;
      if (tick >= 12) {
        scope.clearInterval(timer);
        caseTotal.replaceChildren(`${totals.join(" + ")} = `, make("b", "", String(totals.reduce((a, b) => a + b, 0))), " páros szám");
      }
    }, 150);
  }

  buildTree();
  playCases();
  return () => scope.clearAll();
}
