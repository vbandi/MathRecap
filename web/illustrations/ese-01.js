import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, slot, stepper, svg, toggle } from "./kit.js";

const SHIRTS = ["piros", "kék", "zöld"];
const PANTS = ["farmer", "fekete", "szürke"];
const SHOES = ["tornacipő", "bakancs"];
const COLORS = [PALETTE.red, PALETTE.blue, PALETTE.green];
const WIDTH = 640, HEIGHT = 460, COLUMN_X = [60, 190, 340, 490];
const PILL_WIDTH = 92, PILL_HEIGHT = 22;

export function mount(root) {
  const scope = createScope();
  const counts = [2, 2, 2];
  let shown = 0, selected = -1, view = "tree", timer = null;
  let combos = [];

  root.append(lead("Ha több dolgot kell egymás után kiválasztani (póló, nadrág, cipő), könnyű kihagyni egy összeállítást vagy kétszer megszámolni. A módszer: menjünk rendszerben, ágról ágra, és minden lehetőséget pontosan egyszer írjunk fel."));

  const panel = card("Öltözködés");
  const steppers = make("div", "il-controls");
  ["Pólók", "Nadrágok", "Cipők"].forEach((label, i) => {
    steppers.append(stepper({ label, min: 1, max: i === 2 ? 2 : 3, value: counts[i], onChange: (value) => { counts[i] = value; restart(); } }).element);
  });
  const viewControls = make("div", "il-controls");
  const playControls = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Fa-diagram az öltözékekről" });
  const tableBox = make("div");
  const counter = make("div", "il-formula start");
  const message = make("p", "il-message");
  panel.append(steppers, viewControls, playControls, figure, tableBox, counter, message);
  root.append(panel, keyIdea("ha minden döntésnél ugyanannyi ág indul, a levelek (összeállítások) száma a lehetőségek szorzata. A fában minden összeállításhoz pontosan egy út vezet, a táblázatban pontosan egy cella tartozik."));

  let leafRefs = [], edgeRefs = [], nodeRefs = [];

  const total = () => counts[0] * counts[1] * counts[2];
  const comboName = (index) => combos[index].map((value, level) => [SHIRTS, PANTS, SHOES][level][value]).join(" – ");

  function buildCombos() {
    combos = [];
    for (let s = 0; s < counts[0]; s++) for (let p = 0; p < counts[1]; p++) for (let c = 0; c < counts[2]; c++) combos.push([s, p, c]);
  }

  function buildTree() {
    figure.replaceChildren();
    leafRefs = []; edgeRefs = []; nodeRefs = [];
    const n = combos.length, rowHeight = Math.min(30, (HEIGHT - 50) / n), top = 30;
    ["Póló", "Nadrág", "Cipő"].forEach((name, level) => {
      svg("text", { x: COLUMN_X[level + 1], y: 18, "text-anchor": "middle", "font-weight": 700, text: name, style: "fill:var(--dim)" }, figure);
    });
    svg("text", { x: 590, y: 18, "text-anchor": "middle", "font-weight": 700, text: "Sorszám", style: "fill:var(--dim)" }, figure);
    const edgeLayer = svg("g", {}, figure), nodeLayer = svg("g", {}, figure);

    function layout(level, prefix, lo) {
      if (level === 3) return { level, y: top + (lo + 0.5) * rowHeight, lo, hi: lo, prefix };
      const kids = [];
      let cursor = lo;
      for (let j = 0; j < counts[level]; j++) {
        const kid = layout(level + 1, [...prefix, j], cursor);
        kids.push(kid);
        cursor = kid.hi + 1;
      }
      return { level, prefix, kids, lo, hi: cursor - 1, y: kids.reduce((sum, kid) => sum + kid.y, 0) / kids.length };
    }
    const tree = layout(0, [], 0);

    function draw(node, parent) {
      if (parent) {
        const x1 = COLUMN_X[parent.level] + (parent.level === 0 ? 6 : PILL_WIDTH / 2), x2 = COLUMN_X[node.level] - (node.level === 3 ? 0 : PILL_WIDTH / 2);
        if (node.level < 3) {
          const path = svg("path", { d: `M${x1},${parent.y} C${(x1 + x2) / 2},${parent.y} ${(x1 + x2) / 2},${node.y} ${x2},${node.y}`, fill: "none", class: "il-fade", "stroke-width": 2 }, edgeLayer);
          edgeRefs.push({ element: path, node });
        }
      }
      if (node.level === 0) {
        svg("circle", { cx: COLUMN_X[0], cy: node.y, r: 6, fill: "var(--dim)" }, nodeLayer);
      } else if (node.level < 3) {
        const group = svg("g", { class: "il-fade" }, nodeLayer);
        const value = node.prefix[node.level - 1];
        svg("rect", { x: COLUMN_X[node.level] - PILL_WIDTH / 2, y: node.y - PILL_HEIGHT / 2, width: PILL_WIDTH, height: PILL_HEIGHT, rx: 11, fill: node.level === 1 ? COLORS[value] : "var(--surface)", stroke: node.level === 1 ? "none" : "var(--line-strong)" }, group);
        svg("text", { x: COLUMN_X[node.level], y: node.y + 4, "text-anchor": "middle", text: [SHIRTS, PANTS, SHOES][node.level - 1][value], style: node.level === 1 ? "fill:#fff;font-weight:700" : "" }, group);
        nodeRefs.push({ element: group, node });
      }
      node.kids?.forEach((kid) => draw(kid, node));
    }
    draw(tree, null);
    // leaves (shoe pills + number)
    combos.forEach((combo, index) => {
      const y = top + (index + 0.5) * rowHeight;
      const parentPants = findParent(tree, combo);
      const x1 = COLUMN_X[2] + PILL_WIDTH / 2, x2 = COLUMN_X[3] - PILL_WIDTH / 2;
      const edge = svg("path", { d: `M${x1},${parentPants.y} C${(x1 + x2) / 2},${parentPants.y} ${(x1 + x2) / 2},${y} ${x2},${y}`, fill: "none", class: "il-fade", "stroke-width": 2 }, edgeLayer);
      edgeRefs.push({ element: edge, node: { lo: index, hi: index } });
      const group = svg("g", { class: "il-fade il-item", tabindex: 0, role: "button", "aria-label": `${index + 1}. összeállítás: ${comboName(index)}`, style: "cursor:pointer" }, nodeLayer);
      svg("rect", { x: COLUMN_X[3] - PILL_WIDTH / 2, y: y - PILL_HEIGHT / 2, width: PILL_WIDTH, height: PILL_HEIGHT, rx: 11, fill: "var(--surface)", stroke: "var(--line-strong)" }, group);
      svg("text", { x: COLUMN_X[3], y: y + 4, "text-anchor": "middle", text: SHOES[combo[2]] }, group);
      svg("text", { x: 590, y: y + 4, "text-anchor": "middle", text: String(index + 1), "font-weight": 700, style: "fill:var(--accent)" }, group);
      const pick = () => { selected = selected === index ? -1 : index; render(); };
      group.addEventListener("click", pick);
      group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pick(); } });
      leafRefs.push({ element: group, index });
    });
  }

  function findParent(tree, combo) {
    return tree.kids[combo[0]].kids[combo[1]];
  }

  function buildTable() {
    tableBox.replaceChildren();
    const table = make("table", "il-table");
    const head = make("tr");
    head.append(make("th", "", "Póló + nadrág"));
    for (let c = 0; c < counts[2]; c++) { const th = make("th", "", SHOES[c]); th.style.width = "12ch"; head.append(th); }
    table.append(head);
    let index = 0;
    for (let s = 0; s < counts[0]; s++) for (let p = 0; p < counts[1]; p++) {
      const row = make("tr");
      const label = make("td", "", `${SHIRTS[s]} + ${PANTS[p]}`);
      label.style.cssText = "width:auto;white-space:nowrap;text-align:left";
      row.append(label);
      for (let c = 0; c < counts[2]; c++) {
        const cell = make("td", "il-fade", String(index + 1));
        cell.dataset.index = String(index);
        cell.style.cursor = "pointer";
        const mine = index;
        cell.addEventListener("click", () => { selected = selected === mine ? -1 : mine; render(); });
        row.append(cell);
        index += 1;
      }
      table.append(row);
    }
    tableBox.append(table);
  }

  function render() {
    figure.style.display = view === "tree" ? "" : "none";
    tableBox.style.display = view === "table" ? "" : "none";
    const isSelected = (lo, hi) => selected >= lo && selected <= hi;
    for (const { element, node } of edgeRefs) {
      element.style.opacity = shown > node.lo ? 1 : 0;
      element.setAttribute("stroke", selected >= 0 && isSelected(node.lo, node.hi) ? "var(--accent)" : "var(--line-strong)");
    }
    for (const { element, node } of nodeRefs) {
      element.style.opacity = shown > node.lo ? 1 : 0;
      element.querySelector("rect").setAttribute("stroke", selected >= 0 && isSelected(node.lo, node.hi) ? "var(--accent)" : node.level === 1 ? "none" : "var(--line-strong)");
      element.querySelector("rect").setAttribute("stroke-width", selected >= 0 && isSelected(node.lo, node.hi) ? 2.5 : 1);
    }
    for (const { element, index } of leafRefs) {
      element.style.opacity = shown > index ? 1 : 0;
      element.querySelector("rect").setAttribute("stroke", index === selected ? "var(--accent)" : "var(--line-strong)");
      element.querySelector("rect").setAttribute("stroke-width", index === selected ? 2.5 : 1);
    }
    tableBox.querySelectorAll("td[data-index]").forEach((cell) => {
      const index = Number(cell.dataset.index);
      cell.style.opacity = shown > index ? 1 : 0.15;
      cell.style.color = index === selected ? "var(--accent)" : "";
      cell.style.fontWeight = index === selected ? "700" : "";
    });
    counter.replaceChildren(`${counts[0]} · ${counts[1]} · ${counts[2]} = `, slot(String(total()), 3, { align: "left" }), "összeállítás · eddig felrajzolva: ", slot(String(shown), 3, { align: "left" }));
    message.className = "il-message";
    message.textContent = selected >= 0
      ? `${selected + 1}. összeállítás: ${comboName(selected)}. A fában egyetlen út vezet ide, a táblázatban egyetlen cella jelzi, másik nincs belőle.`
      : shown < total() ? "Nézd, ahogy a fa ágról ágra nő." : "Kattints egy levélre vagy cellára: megmutatjuk, hogy az az összeállítás csak egyszer szerepel.";
  }

  function restart() {
    scope.clearAll();
    timer = null;
    selected = -1;
    shown = 0;
    buildCombos(); buildTree(); buildTable();
    render();
    timer = scope.interval(() => {
      shown += 1;
      render();
      if (shown >= total()) { scope.clearInterval(timer); timer = null; }
    }, 280);
  }

  function stopTimer() { if (timer !== null) { scope.clearInterval(timer); timer = null; } }

  viewControls.append(
    toggle("Fa-diagram", true, () => { view = "tree"; refreshToggles(); render(); }),
    toggle("Táblázat", false, () => { view = "table"; refreshToggles(); render(); }),
  );
  function refreshToggles() {
    const [treeToggle, tableToggle] = viewControls.children;
    treeToggle.setAttribute("aria-pressed", String(view === "tree"));
    tableToggle.setAttribute("aria-pressed", String(view === "table"));
  }
  playControls.append(
    button("Következő ág", () => { stopTimer(); shown = Math.min(total(), shown + 1); render(); }),
    button("Mind", () => { stopTimer(); shown = total(); render(); }, { ghost: true }),
    button("Újrajátszás", restart, { ghost: true }),
  );

  restart();
  return () => scope.clearAll();
}
