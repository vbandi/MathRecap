import { card, controls, createScope, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

// Quadrilateral classes: position in the tree, example shape and facts.
const CLASSES = {
  quad: { name: "négyszög", at: [300, 30], parents: [], is: ["quad"], points: [[120, 210], [420, 230], [470, 70], [200, 40]], facts: ["nincs különleges tulajdonsága", "az átlók tetszőlegesek", "nincs szimmetriája"] },
  trapezoid: { name: "trapéz", at: [150, 90], parents: ["quad"], is: ["trapezoid", "quad"], points: [[100, 220], [440, 220], [400, 60], [200, 60]], facts: ["legalább egy párhuzamos oldalpárja van", "az átlók tetszőlegesek", "általános esetben nincs szimmetriája"] },
  kite: { name: "deltoid", at: [450, 90], parents: ["quad"], is: ["kite", "quad"], points: [[120, 130], [260, 40], [480, 130], [260, 220]], facts: ["két-két szomszédos oldala egyenlő", "az átlói merőlegesek egymásra", "1 szimmetriatengelye van (az egyik átló)"] },
  parallelogram: { name: "paralelogramma", at: [150, 150], parents: ["trapezoid"], is: ["parallelogram", "trapezoid", "quad"], points: [[100, 220], [400, 220], [500, 60], [200, 60]], facts: ["mindkét szemközti oldalpár párhuzamos és egyenlő", "az átlók felezik egymást", "középpontosan szimmetrikus, tengelye nincs"] },
  rectangle: { name: "téglalap", at: [70, 215], parents: ["parallelogram"], is: ["rectangle", "parallelogram", "trapezoid", "quad"], points: [[120, 220], [440, 220], [440, 60], [120, 60]], facts: ["minden szöge derékszög", "az átlók egyenlők és felezik egymást", "2 szimmetriatengelye van, középpontosan szimmetrikus"] },
  rhombus: { name: "rombusz", at: [300, 215], parents: ["parallelogram", "kite"], is: ["rhombus", "parallelogram", "trapezoid", "kite", "quad"], points: [[300, 30], [450, 130], [300, 230], [150, 130]], facts: ["mind a négy oldala egyenlő", "az átlók merőlegesek és felezik egymást", "2 szimmetriatengelye van, középpontosan szimmetrikus"] },
  square: { name: "négyzet", at: [185, 275], parents: ["rectangle", "rhombus"], is: ["square", "rectangle", "rhombus", "parallelogram", "trapezoid", "kite", "quad"], points: [[200, 220], [400, 220], [400, 20], [200, 20]], facts: ["minden oldala egyenlő, minden szöge derékszög", "az átlók egyenlők, merőlegesek és felezik egymást", "4 szimmetriatengelye van, középpontosan szimmetrikus"] },
};
const PROPERTIES = { // canonical property values per class
  quad: { parallel: 0, equal: "none", right: false }, trapezoid: { parallel: 1, equal: "none", right: false }, kite: { parallel: 0, equal: "kite", right: false },
  parallelogram: { parallel: 2, equal: "none", right: false }, rectangle: { parallel: 2, equal: "none", right: true },
  rhombus: { parallel: 2, equal: "all", right: false }, square: { parallel: 2, equal: "all", right: true },
};

export function resolveClass({ parallel, equal, right }) {
  if (right) return equal === "none" ? "rectangle" : "square";
  if (equal === "all") return "rhombus";
  if (equal === "kite") return parallel > 0 ? "rhombus" : "kite";
  return parallel === 2 ? "parallelogram" : parallel === 1 ? "trapezoid" : "quad";
}

const NODE_W = 130, NODE_H = 34;

export function mount(root) {
  const scope = createScope();
  const state = { props: { ...PROPERTIES.quad }, points: CLASSES.quad.points.map((p) => [...p]), note: "" };

  root.append(lead("A négyszögeknek sok fajtája van: trapéz, paralelogramma, téglalap, rombusz, négyzet, deltoid. Ezek nem különálló dobozok: a négyzet például egyszerre téglalap, rombusz és paralelogramma is. Kattints egy fajtára, vagy kapcsolj be tulajdonságokat, és nézd meg, milyen négyszög lesz belőle."));

  // --- tree ---
  const treeCard = card("Melyik fajta melyiknek a különleges esete?");
  const tree = svg("svg", { class: "il-svg", viewBox: "0 0 600 300", role: "img", "aria-label": "A négyszögek hierarchiája" });
  treeCard.append(tree, make("p", "il-muted", "A nyíl mentén haladva egyre több tulajdonság teljesül. Zöld: a mostani négyszög ilyen is. Kattints egy névre példáért."));

  // --- morph ---
  const morphCard = card("Építs négyszöget tulajdonságokból");
  const group = (title, options, key) => {
    const buttons = options.map(([label, value]) => toggle(label, false, () => { state.props[key] = value; applyProps(); }, PALETTE.blue));
    const row = controls(make("b", "", title), ...buttons);
    row.firstChild.style.cssText = "min-width:22ch;font-size:13px;color:var(--fg-soft)";
    return { row, buttons, options, key };
  };
  const groups = [
    group("Párhuzamos oldalpárok:", [["nincs", 0], ["egy pár", 1], ["két pár", 2]], "parallel"),
    group("Egyenlő oldalak:", [["nincs", "none"], ["szomszédos párok", "kite"], ["mind a négy", "all"]], "equal"),
    group("Derékszögek:", [["nincs", false], ["mind a négy", true]], "right"),
  ];
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 260", role: "img", "aria-label": "Átalakuló négyszög" });
  const names = make("p", "il-message");
  const facts = make("ul");
  facts.style.cssText = "margin:6px 0 0;padding-left:20px;min-height:5.2em;color:var(--fg-soft)";
  morphCard.append(...groups.map((g) => g.row), figure, names, facts);
  const polygon = svg("polygon", { style: `fill:${PALETTE.blue};fill-opacity:.2;stroke:var(--fg);stroke-width:3;stroke-linejoin:round` }, figure);
  const diagonalLines = [0, 1].map(() => svg("line", { style: `stroke:${PALETTE.amber};stroke-width:2;stroke-dasharray:7 5` }, figure));
  const vertexLabels = "ABCD".split("").map((name) => svg("text", { text: name, "text-anchor": "middle", style: "font-weight:800;fill:var(--fg)" }, figure));

  root.append(treeCard, morphCard, keyIdea("a négyszögfajták egymásra épülnek: a négyzet minden tulajdonsága megvan a téglalapnak és a rombusznak is, azok minden tulajdonsága a paralelogrammának, és így tovább. Minél különlegesebb a fajta, annál több tulajdonsága van."));

  // tree: edges first, nodes on top
  for (const [id, cls] of Object.entries(CLASSES)) for (const parent of cls.parents) {
    const [px, py] = CLASSES[parent].at, [cx, cy] = cls.at;
    svg("line", { x1: px, y1: py + NODE_H / 2, x2: cx, y2: cy - NODE_H / 2, style: "stroke:var(--line-strong);stroke-width:2" }, tree);
  }
  const nodes = Object.entries(CLASSES).map(([id, cls]) => {
    const g = svg("g", { tabindex: 0, role: "button", style: "cursor:pointer", "aria-label": cls.name }, tree);
    const rect = svg("rect", { x: cls.at[0] - NODE_W / 2, y: cls.at[1] - NODE_H / 2, width: NODE_W, height: NODE_H, rx: 10 }, g);
    svg("text", { x: cls.at[0], y: cls.at[1] + 5, "text-anchor": "middle", text: cls.name, style: "font-weight:700;fill:var(--fg)" }, g);
    const pick = () => setClass(id);
    g.addEventListener("click", pick);
    g.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); pick(); } });
    return { id, rect };
  });

  function setClass(id) { state.props = { ...PROPERTIES[id] }; state.note = ""; applyProps(); }

  function applyProps() {
    const cls = resolveClass(state.props), canonical = PROPERTIES[cls];
    const changed = Object.keys(canonical).some((key) => canonical[key] !== state.props[key]);
    state.note = changed ? "A kiválasztott tulajdonságokból további következik, ezért a gombok kiegészültek. " : "";
    state.props = { ...canonical };
    morphTo(CLASSES[cls].points);
    render();
  }

  function morphTo(target) {
    scope.clearAll();
    const from = state.points.map((p) => [...p]), start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 700), e = t * t * (3 - 2 * t);
      state.points = from.map((p, i) => [p[0] + (target[i][0] - p[0]) * e, p[1] + (target[i][1] - p[1]) * e]);
      drawShape();
      if (t < 1) scope.frame(step);
    };
    scope.frame(step);
  }

  function drawShape() {
    const p = state.points;
    polygon.setAttribute("points", p.map((q) => q.join(",")).join(" "));
    [[0, 2], [1, 3]].forEach(([i, j], n) => { diagonalLines[n].setAttribute("x1", p[i][0]); diagonalLines[n].setAttribute("y1", p[i][1]); diagonalLines[n].setAttribute("x2", p[j][0]); diagonalLines[n].setAttribute("y2", p[j][1]); });
    const cx = p.reduce((s, q) => s + q[0] / 4, 0), cy = p.reduce((s, q) => s + q[1] / 4, 0);
    vertexLabels.forEach((label, i) => {
      const dx = p[i][0] - cx, dy = p[i][1] - cy, l = Math.hypot(dx, dy) || 1;
      label.setAttribute("x", p[i][0] + (dx / l) * 16); label.setAttribute("y", p[i][1] + (dy / l) * 16 + 5);
    });
  }

  function render() {
    const cls = resolveClass(state.props), info = CLASSES[cls];
    groups.forEach((g) => g.buttons.forEach((button, index) => button.setAttribute("aria-pressed", String(g.options[index][1] === state.props[g.key]))));
    nodes.forEach(({ id, rect }) => {
      const applies = info.is.includes(id), exact = id === cls;
      rect.setAttribute("style", `fill:${applies ? PALETTE.green : "var(--surface)"};fill-opacity:${exact ? 0.55 : applies ? 0.3 : 1};stroke:${exact ? PALETTE.green : applies ? PALETTE.green : "var(--line-strong)"};stroke-width:${exact ? 3.5 : 1.5}`);
    });
    names.className = "il-message good";
    names.textContent = `${state.note}Ez a négyszög: ${info.is.map((id) => CLASSES[id].name).join(", ")}. A legszűkebb neve: ${info.name}.`;
    facts.replaceChildren(...info.facts.map((text) => make("li", "", text)));
  }

  drawShape();
  render();
  return () => scope.clearAll();
}
