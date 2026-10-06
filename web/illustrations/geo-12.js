import { card, controls, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const CENTER = [300, 185], RADIUS = 160;
const FAN_COLORS = [PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.violet, PALETTE.pink, PALETTE.red];

const vertex = (n, i) => {
  const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
  return [CENTER[0] + RADIUS * Math.cos(angle), CENTER[1] + RADIUS * Math.sin(angle)];
};

export function mount(root) {
  const state = { n: 6, fan: true, all: false };

  root.append(lead("Egy sokszög átlója két nem szomszédos csúcsát köti össze. Ha egy csúcsból behúzod az összes átlót, a sokszög háromszögekre esik szét, és a háromszögek szögösszegét már ismered. Ebből kiszámolható a sokszög szögeinek összege is."));

  const main = card("Hány oldalú a sokszög?");
  const slider = range({ label: "Oldalak száma (n)", min: 3, max: 12, step: 1, value: state.n, format: (v) => `${v}`, onInput: (value) => { state.n = value; render(); } });
  const fanToggle = toggle("Átlók egy csúcsból → háromszögek", state.fan, () => { state.fan = !state.fan; render(); }, PALETTE.blue);
  const allToggle = toggle("Az összes átló", state.all, () => { state.all = !state.all; render(); }, PALETTE.amber);
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 370", role: "img", "aria-label": "Szabályos sokszög átlókkal" });
  const equations = make("div", "il-formula start");
  const table = make("table", "il-table");
  const tableWrap = make("div");
  tableWrap.style.overflowX = "auto";
  tableWrap.append(table);
  main.append(controls(slider.element, fanToggle, allToggle), figure, equations, tableWrap);
  const message = make("p", "il-message");
  main.append(message);

  root.append(main, keyIdea("az n oldalú konvex sokszög egy csúcsából n − 3 átló húzható, ezek n − 2 háromszögre vágják, ezért a belső szögeinek összege (n − 2) · 180°. Az összes átló száma n(n − 3)/2, mert minden csúcsból n − 3 indul, de így mindegyiket kétszer számoltuk."));

  function render() {
    const { n } = state;
    const points = Array.from({ length: n }, (_, i) => vertex(n, i));
    figure.replaceChildren();
    fanToggle.setAttribute("aria-pressed", String(state.fan));
    allToggle.setAttribute("aria-pressed", String(state.all));
    const polygon = (list, style) => svg("polygon", { points: list.map((p) => p.join(",")).join(" "), style }, figure);
    if (state.fan) for (let i = 1; i <= n - 2; i++) polygon([points[0], points[i], points[i + 1]], `fill:${FAN_COLORS[(i - 1) % FAN_COLORS.length]};fill-opacity:.4;stroke:none`);
    if (state.all) {
      for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        svg("line", { x1: points[i][0], y1: points[i][1], x2: points[j][0], y2: points[j][1], style: `stroke:${PALETTE.amber};stroke-width:1.6;opacity:.85` }, figure);
      }
    }
    if (state.fan) for (let j = 2; j <= n - 2; j++) svg("line", { x1: points[0][0], y1: points[0][1], x2: points[j][0], y2: points[j][1], style: `stroke:var(--fg);stroke-width:2.5` }, figure);
    polygon(points, "fill:none;stroke:var(--fg);stroke-width:3.5;stroke-linejoin:round");
    points.forEach((p, i) => svg("circle", { cx: p[0], cy: p[1], r: i === 0 ? 7 : 4.5, style: `fill:${i === 0 ? PALETTE.red : "var(--fg)"}` }, figure));
    svg("text", { x: points[0][0] + 14, y: points[0][1] + 4, text: "A", style: `font-weight:800;fill:${PALETTE.red}` }, figure);
    if (state.fan && n > 3) svg("text", { x: CENTER[0], y: CENTER[1] + 4, "text-anchor": "middle", text: `${n - 2} háromszög`, style: "font-weight:800;font-size:16px;fill:var(--fg)" }, figure);

    const fromOne = n - 3, triangles = n - 2, total = (n * (n - 3)) / 2;
    equations.replaceChildren(
      "egy csúcsból induló átló: n − 3 = ", slot(String(fromOne), 2), "   háromszög: n − 2 = ", slot(String(triangles), 2), make("br"),
      "szögösszeg: ", slot(String(triangles), 2), " · 180° = ", slot(make("b", "", `${triangles * 180}°`), 6, { align: "left" }), make("br"),
      "összes átló: ", slot(`${n} · ${fromOne}/2`, 8, { align: "left" }), " = ", slot(make("b", "", String(total)), 3, { align: "left" }));
    table.replaceChildren();
    const rows = [["n", (k) => k], ["átló 1 csúcsból", (k) => k - 3], ["háromszög", (k) => k - 2], ["szögösszeg", (k) => `${(k - 2) * 180}°`], ["összes átló", (k) => (k * (k - 3)) / 2]];
    for (const [heading, fn] of rows) {
      const tr = make("tr");
      tr.append(make("th", "", heading));
      for (let k = 3; k <= 12; k++) {
        const td = make("td", "", String(fn(k)));
        td.style.cssText = `width:7ch;${k === n ? `color:var(--accent);font-weight:800;background:rgba(255,255,255,.06)` : ""}`;
        tr.append(td);
      }
      table.append(tr);
    }
    table.firstChild.firstChild.style.minWidth = "16ch";
    message.className = "il-message";
    message.textContent = n === 3 ? "A háromszögnek nincs átlója: minden csúcsa szomszédos a másik kettővel, és ő maga egyetlen háromszög."
      : state.all ? `Minden csúcsból ${fromOne} átló indul. Ez együtt ${n * fromOne}, de minden átlót kétszer számoltunk (mindkét végpontjánál), ezért ${total} átló van.`
        : `Az A csúcsból ${fromOne} átló húzható, ezek ${triangles} háromszögre osztják a sokszöget. A háromszögek szögei együtt kiadják a sokszög szögeit.`;
  }

  render();
  return () => {};
}
