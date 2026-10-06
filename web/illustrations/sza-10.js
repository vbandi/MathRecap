import { card, controls, createScope, keyIdea, lead, make, PALETTE, rich, slot, stepper, svg } from "./kit.js";

const CLASS_COLORS = [PALETTE.red, PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.violet, PALETTE.pink, "var(--dim)"];
const COUNT = 30;

export function mount(root) {
  const scope = createScope();
  root.append(lead("Ha n dolgot egyenlő csoportokba osztasz, általában marad néhány, amelyből már nem jön ki egy újabb teljes csoport. Ez a maradék, és mindig kisebb, mint a csoport mérete."));

  // --- Groups and leftover ---
  const groups = card("Csoportokba osztás");
  const state = { n: 17, d: 5 };
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 150", role: "img" });
  const equationLine = make("div", "il-formula start");
  const message = make("p", "il-message");
  groups.append(controls(
    stepper({ label: "Ennyi tárgy van (n)", min: 0, max: 40, value: state.n, onChange: (v) => { state.n = v; renderGroups(); } }).element,
    stepper({ label: "Ennyi fér egy csoportba (d)", min: 1, max: 9, value: state.d, onChange: (v) => { state.d = v; renderGroups(); } }).element,
  ), figure, equationLine, message);
  function renderGroups() {
    const { n, d } = state, q = Math.floor(n / d), r = n % d;
    figure.replaceChildren();
    const columns = Math.min(d, 3), rows = Math.ceil(d / columns), step = 17, boxW = columns * step + 10, boxH = rows * step + 10;
    const place = (index, count, color, dashed) => {
      const perRow = Math.floor(560 / (boxW + 8)), row = Math.floor(index / perRow), col = index % perRow;
      const x = 20 + col * (boxW + 8), y = 14 + row * (boxH + 10);
      svg("rect", { x, y, width: boxW, height: boxH, rx: 9, style: `fill:none;stroke:${color};stroke-width:2;${dashed ? "stroke-dasharray:5 4" : ""}` }, figure);
      for (let i = 0; i < count; i++) svg("circle", { cx: x + 14 + (i % columns) * step, cy: y + 14 + Math.floor(i / columns) * step, r: 6.5, style: `fill:${color}` }, figure);
    };
    for (let g = 0; g < q; g++) place(g, d, PALETTE.blue, false);
    if (r > 0) place(q, r, PALETTE.amber, true);
    equationLine.replaceChildren(rich(slot(String(n), 2), " = ", slot(String(d), 1), " · ", slot(String(q), 2), " + ", slot(String(r), 1)));
    message.className = "il-message good";
    message.textContent = r === 0
      ? `${q} teljes csoport lett (kék), és semmi sem maradt: ${d} osztója ${n}-nek.`
      : `${q} teljes csoport lett (kék), ${r} tárgy maradt (sárga). A maradék mindig kisebb a csoport méreténél: ${r} < ${d}.`;
    if (n === 0) message.textContent = "Nincs mit csoportosítani: 0 = d · 0 + 0.";
  }

  // --- Remainder classes ---
  const classes = card("Maradékosztályok");
  const classState = { d: 4, selected: 1 };
  const classFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 420", role: "img" });
  const classMessage = make("p", "il-message");
  classes.append(make("p", "", `Írd fel a 0-tól ${COUNT - 1}-ig terjedő számokat d oszlopba. Az azonos színű számoknak ugyanannyi a maradékuk. Kattints egy oszlopra a kiemeléséhez!`), controls(stepper({ label: "Oszlopok száma (d)", min: 2, max: 7, value: classState.d, onChange: (v) => { classState.d = v; classState.selected = Math.min(classState.selected, v - 1); renderClasses(); } }).element), classFigure, classMessage);
  function renderClasses() {
    const { d, selected } = classState, rows = Math.ceil(COUNT / d), cell = Math.min(40, 330 / rows), width = Math.min(70, 520 / d), x0 = (600 - d * width) / 2, y0 = 44;
    classFigure.replaceChildren();
    for (let c = 0; c < d; c++) {
      const header = svg("g", { style: "cursor:pointer" }, classFigure);
      svg("rect", { x: x0 + c * width + 2, y: 6, width: width - 4, height: 28, rx: 8, style: `fill:${CLASS_COLORS[c]};opacity:${c === selected ? 1 : 0.45}` }, header);
      svg("text", { x: x0 + c * width + width / 2, y: 25, "text-anchor": "middle", text: `maradék ${c}`, style: "fill:#fff;font-size:12px;font-weight:700" }, header);
      header.addEventListener("click", () => { classState.selected = c; renderClasses(); });
    }
    for (let k = 0; k < COUNT; k++) {
      const c = k % d, row = Math.floor(k / d), active = c === selected;
      const x = x0 + c * width, y = y0 + row * cell;
      svg("rect", { x: x + 3, y: y + 2, width: width - 6, height: cell - 4, rx: 7, style: `fill:${CLASS_COLORS[c]};opacity:${active ? 0.95 : 0.3}` }, classFigure);
      svg("text", { x: x + width / 2, y: y + cell / 2 + 5, "text-anchor": "middle", text: k, style: `fill:${active ? "#fff" : "var(--fg-soft)"};font-size:${Math.min(16, cell * 0.6)}px;font-weight:700` }, classFigure);
    }
    const members = Array.from({ length: COUNT }, (_, k) => k).filter((k) => k % d === selected);
    classMessage.className = "il-message good";
    classMessage.textContent = `Maradék ${selected} (${d}-es osztásnál): ${members.slice(0, 6).join(", ")}${members.length > 6 ? " és így tovább" : ""}. Bármely kettő különbsége ${d} többszöröse, például ${members[1] ?? members[0]} − ${members[0]} = ${(members[1] ?? members[0]) - members[0]}.`;
  }

  root.append(groups, classes, keyIdea("minden n szám felírható n = d · q + r alakban, ahol a maradék 0 ≤ r < d. A d szerinti osztáskor pontosan d féle maradék lehet, ezek a maradékosztályok, és a számok így d oszlopba rendeződnek, mint egy ismétlődő minta."));
  renderGroups(); renderClasses();
  return () => scope.clearAll();
}
