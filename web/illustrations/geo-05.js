import { card, controls, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const WIDTH = 600, HEIGHT = 380, MIDDLE = [300, 190], HALF_GAP = 70, WEDGE = 36;
const LINE_Y = [MIDDLE[1] - HALF_GAP, MIDDLE[1] + HALF_GAP];

// Relations between the selected angle (intersection i, quadrant q) and its partners.
// Quadrants: 0 = upper right, 1 = upper left, 2 = lower left, 3 = lower right.
const RELATIONS = [
  { id: "vertical", name: "csúcsszög", color: PALETTE.violet, equal: true, partners: (i, q) => [[i, (q + 2) % 4]] },
  { id: "supplementary", name: "mellékszög", color: PALETTE.red, equal: false, partners: (i, q) => [[i, (q + 1) % 4], [i, (q + 3) % 4]] },
  { id: "corresponding", name: "egyállású szög", color: PALETTE.green, equal: true, partners: (i, q) => [[1 - i, q]] },
  { id: "alternate", name: "váltószög", color: PALETTE.blue, equal: true, partners: (i, q) => [[1 - i, (q + 2) % 4]] },
  { id: "cointerior", name: "társszög", color: PALETTE.pink, equal: false, partners: (i, q) => [[1 - i, 3 - q]] },
];

function toSvgPoint(figure, event) {
  const point = figure.createSVGPoint();
  point.x = event.clientX; point.y = event.clientY;
  const mapped = point.matrixTransform(figure.getScreenCTM().inverse());
  return [mapped.x, mapped.y];
}

function makeDraggable(figure, handle, onMove) {
  handle.style.cursor = "grab";
  handle.style.touchAction = "none";
  handle.addEventListener("pointerdown", (event) => { handle.setPointerCapture(event.pointerId); event.preventDefault(); });
  handle.addEventListener("pointermove", (event) => {
    if (handle.hasPointerCapture(event.pointerId)) onMove(...toSvgPoint(figure, event));
  });
}

const RAD = Math.PI / 180;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const onScreen = (center, radius, degrees) => [center[0] + radius * Math.cos(degrees * RAD), center[1] - radius * Math.sin(degrees * RAD)];
const angleValue = (theta, quadrant) => (quadrant % 2 === 0 ? theta : 180 - theta);

export function mount(root) {
  const state = { theta: 60, selected: [0, 0], visible: new Set(RELATIONS.map((r) => r.id)) };

  root.append(lead("Ha két párhuzamos egyenest elmetsz egy harmadikkal (a metszővel), nyolc szög keletkezik. Ezek között szoros kapcsolatok vannak: némelyik egyenlő, némelyik 180°-ra egészíti ki a másikat. Kattints egy szögre, és megmutatjuk a párjait."));

  const main = card("Két párhuzamos egyenes és egy metsző");
  const filters = RELATIONS.map((relation) => toggle(relation.name, true, () => {
    if (state.visible.has(relation.id)) state.visible.delete(relation.id); else state.visible.add(relation.id);
    render();
  }, relation.color));
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Két párhuzamos egyenes metszővel" });
  const table = make("table", "il-table");
  main.append(controls(...filters), figure, table, make("p", "il-muted", "Húzd a metsző végén lévő pontot, hogy változzon a szög. Kattints bármelyik szögre a kijelöléshez."));

  const lineLayer = svg("g", {}, figure), wedgeLayer = svg("g", {}, figure), labelLayer = svg("g", { style: "pointer-events:none" }, figure);
  const handle = svg("g", {}, figure);
  svg("circle", { r: 22, fill: "transparent" }, handle);
  svg("circle", { r: 9, style: `fill:${PALETTE.amber};stroke:var(--input);stroke-width:3` }, handle);
  makeDraggable(figure, handle, (x, y) => {
    const degrees = Math.atan2(MIDDLE[1] - y, x - MIDDLE[0]) / RAD;
    state.theta = clamp(Math.round((degrees + 360) % 180), 25, 155);
    render();
  });

  function intersection(index) {
    const offset = (index === 0 ? -1 : 1) * HALF_GAP;
    return [MIDDLE[0] - offset / Math.tan(state.theta * RAD), LINE_Y[index]];
  }

  function partnerRelations(i, q) {
    const result = new Map();
    for (const relation of RELATIONS) {
      if (!state.visible.has(relation.id)) continue;
      for (const [pi, pq] of relation.partners(i, q)) result.set(`${pi}-${pq}`, relation);
    }
    return result;
  }

  function render() {
    const theta = state.theta, [selectedI, selectedQ] = state.selected;
    lineLayer.replaceChildren(); wedgeLayer.replaceChildren(); labelLayer.replaceChildren();
    for (const y of LINE_Y) svg("line", { x1: 0, y1: y, x2: WIDTH, y2: y, style: "stroke:var(--fg);stroke-width:3" }, lineLayer);
    for (const [y, label] of [[LINE_Y[0], "a"], [LINE_Y[1], "b"]]) svg("text", { x: 14, y: y - 8, text: label, style: "font-style:italic;font-weight:700;fill:var(--fg)" }, lineLayer);
    const reach = 210, direction = [Math.cos(theta * RAD), -Math.sin(theta * RAD)];
    svg("line", { x1: MIDDLE[0] - direction[0] * reach, y1: MIDDLE[1] - direction[1] * reach, x2: MIDDLE[0] + direction[0] * reach, y2: MIDDLE[1] + direction[1] * reach, style: `stroke:${PALETTE.amber};stroke-width:3` }, lineLayer);
    const handleDistance = HALF_GAP / Math.sin(theta * RAD) + 34;
    handle.setAttribute("transform", `translate(${MIDDLE[0] + direction[0] * handleDistance} ${MIDDLE[1] + direction[1] * handleDistance})`);

    const partners = partnerRelations(selectedI, selectedQ);
    for (const i of [0, 1]) {
      const center = intersection(i);
      for (let q = 0; q < 4; q++) {
        const start = q === 0 ? 0 : q === 1 ? theta : q === 2 ? 180 : 180 + theta;
        const end = q === 0 ? theta : q === 1 ? 180 : q === 2 ? 180 + theta : 360;
        const [x1, y1] = onScreen(center, WEDGE, start), [x2, y2] = onScreen(center, WEDGE, end);
        const isSelected = i === selectedI && q === selectedQ, relation = partners.get(`${i}-${q}`);
        const color = isSelected ? PALETTE.amber : relation?.color;
        const wedge = svg("path", {
          d: `M ${center[0]} ${center[1]} L ${x1} ${y1} A ${WEDGE} ${WEDGE} 0 ${end - start > 180 ? 1 : 0} 0 ${x2} ${y2} Z`,
          style: `cursor:pointer;fill:${color ?? "var(--dim)"};fill-opacity:${color ? 0.6 : 0.12};stroke:${color ?? "var(--dim)"};stroke-width:${color ? 2 : 1}`,
          tabindex: 0, role: "button", "aria-label": `${angleValue(theta, q)} fokos szög kijelölése`,
        }, wedgeLayer);
        const select = () => { state.selected = [i, q]; render(); };
        wedge.addEventListener("click", select);
        wedge.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); } });
        const [lx, ly] = onScreen(center, WEDGE + 24, (start + end) / 2);
        svg("text", { x: lx, y: ly + 4, "text-anchor": "middle", text: `${angleValue(theta, q)}°`, style: `font-size:13px;font-weight:${color ? 800 : 400};fill:${color ?? "var(--dim)"}` }, labelLayer);
      }
    }

    const selectedValue = angleValue(theta, selectedQ);
    const rows = RELATIONS.map((relation) => {
      const active = state.visible.has(relation.id);
      const partnerValues = relation.partners(selectedI, selectedQ).map(([, pq]) => angleValue(theta, pq));
      const tr = make("tr");
      tr.style.opacity = active ? 1 : 0.35;
      const name = make("th", "", `● ${relation.name}`);
      name.style.cssText = `color:${relation.color};width:16ch;font-weight:700`;
      const value = make("td", "", `${partnerValues.map((v) => `${v}°`).join(" és ")}`);
      value.style.cssText = "width:14ch;text-align:left;color:var(--fg);white-space:nowrap";
      const rule = make("td", "", relation.equal ? `egyenlő a kijelölttel (${selectedValue}°)` : `a kijelölttel együtt 180°  (${selectedValue}° + ${180 - selectedValue}°)`);
      rule.style.cssText = "width:auto;text-align:left;font-family:var(--font);white-space:nowrap";
      tr.append(name, value, rule);
      return tr;
    });
    const header = make("tr");
    const selectedCell = make("th", "", "Kijelölt szög:");
    selectedCell.style.cssText = "width:16ch;color:var(--dim)";
    const selectedText = make("td", "", `${selectedValue}°`);
    selectedText.style.cssText = `width:14ch;text-align:left;color:${PALETTE.amber};font-weight:800`;
    const hint = make("td", "", "");
    header.append(selectedCell, selectedText, hint);
    table.replaceChildren(header, ...rows);
    filters.forEach((button, index) => button.setAttribute("aria-pressed", String(state.visible.has(RELATIONS[index].id))));
  }

  root.append(main, keyIdea("párhuzamos egyenesek metszésénél a csúcsszögek, az egyállású szögek és a váltószögek egyenlők; a mellékszögek és a társszögek összege 180°. Ha ezt egy ábrán látod, egyetlen szögből az összes többit kiszámolhatod."));
  render();
  return () => {};
}
