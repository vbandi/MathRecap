import { card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, uniqueId } from "./kit.js";

const W = 600, H = 440, PAD = 30;
const X_MIN = -4, X_MAX = 4, Y_MIN = -8, Y_MAX = 8;
const toX = (x) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
const toY = (y) => H - PAD - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);
const XS = [1, 2, 3, 4];
const COLORS = [PALETTE.blue, PALETTE.pink, PALETTE.violet, PALETTE.amber];

export function mount(root) {
  const scope = createScope();
  const state = { k: 2, shifted: false };
  const clipId = uniqueId("prop-clip");

  root.append(lead("Két mennyiség egyenesen arányos, ha az egyik többszörösére nő, akkor a másik is ugyanannyiszorosára. Ilyenkor a hányadosuk (y : x) mindig ugyanaz a szám — és a grafikon az origón átmenő egyenes."));

  const main = card("Állítsd be az arányossági tényezőt");
  const kSlider = range({ label: "k", min: -2, max: 2, step: 0.5, value: state.k, onInput: (value) => { state.k = value; render(); } });
  const modes = make("div", "il-controls");
  const formulaLine = make("div");
  const table = make("table", "il-table");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", style: "max-width:560px;margin:0 auto" });
  const message = make("p", "il-message");
  main.append(controls(kSlider.element), modes, formulaLine, figure, table, message);
  root.append(main, keyIdea("egyenes arányosságnál y : x mindig ugyanannyi (ez a k), ezért a pontok egy origón átmenő egyenesen vannak. Ha a szabályhoz hozzáadunk egy állandót (mint a +3), az egyenes elmozdul, már nem megy át az origón, és a hányados sem állandó."));

  svg("rect", { x: PAD, y: PAD, width: W - 2 * PAD, height: H - 2 * PAD }, svg("clipPath", { id: clipId }, svg("defs", {}, figure)));
  for (let x = X_MIN; x <= X_MAX; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: PAD, y2: H - PAD, class: x ? "grid" : "axis" }, figure);
    if (x) svg("text", { x: toX(x), y: toY(0) + 15, "text-anchor": "middle", text: formatNumber(x), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  for (let y = Y_MIN; y <= Y_MAX; y += 2) {
    svg("line", { x1: PAD, x2: W - PAD, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    if (y) svg("text", { x: toX(0) - 6, y: toY(y) + 4, "text-anchor": "end", text: formatNumber(y), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  svg("text", { x: W - PAD - 2, y: toY(0) - 8, "text-anchor": "end", text: "x", style: "font-style:italic" }, figure);
  svg("text", { x: toX(0) + 8, y: PAD + 12, text: "y", style: "font-style:italic" }, figure);
  const plot = svg("g", { "clip-path": `url(#${clipId})` }, figure);

  function render() {
    const { k, shifted } = state, b = shifted ? 3 : 0;
    const f = (x) => k * x + b;
    modes.replaceChildren(
      toggle("y = k · x", !shifted, () => { state.shifted = false; render(); }),
      toggle("y = k · x + 3", shifted, () => { state.shifted = true; render(); }),
    );
    formulaLine.replaceChildren(equation("y", rich(slot(formatNumber(k), 4), " · x", slot(" + 3", 5, { align: "left", dim: !shifted }))));

    plot.replaceChildren();
    svg("line", { x1: toX(X_MIN), y1: toY(f(X_MIN)), x2: toX(X_MAX), y2: toY(f(X_MAX)), style: "stroke:var(--accent);stroke-width:3.5" }, plot);
    XS.forEach((x, i) => {
      const y = f(x), color = COLORS[i];
      if (i < 3) {
        svg("path", { d: `M ${toX(0)} ${toY(0)} H ${toX(x)} V ${toY(y)} Z`, fill: color, style: "fill-opacity:.12;stroke-width:2;stroke-dasharray:6 4", stroke: color }, plot);
        svg("text", { x: toX(x / 2), y: toY(0) + (y >= 0 ? 16 : -6), "text-anchor": "middle", text: formatNumber(x), style: `fill:${color};font-weight:700` }, plot);
        svg("text", { x: toX(x) + 6, y: toY(y / 2) + 4, text: formatNumber(y), style: `fill:${color};font-weight:700` }, plot);
      }
      svg("circle", { cx: toX(x), cy: toY(y), r: 6.5, style: `fill:${color};stroke:var(--input);stroke-width:2` }, plot);
    });
    svg("circle", { cx: toX(0), cy: toY(0), r: 5, style: "fill:var(--fg);stroke:var(--input);stroke-width:2" }, plot);
    if (shifted) {
      svg("circle", { cx: toX(0), cy: toY(3), r: 6, style: `fill:${PALETTE.red};stroke:var(--input);stroke-width:2` }, plot);
      svg("text", { x: toX(0) + 10, y: toY(3) - 8, text: "(0; 3)", style: `fill:${PALETTE.red};font-weight:700` }, plot);
    }

    const row = (heading, cell) => {
      const tr = make("tr");
      tr.append(make("th", "", heading), ...XS.map((x, i) => { const td = make("td", "", cell(x)); td.style.color = COLORS[i]; return td; }));
      return tr;
    };
    const ratio = (x) => formatNumber(f(x) / x, 2);
    table.replaceChildren(row("x", (x) => formatNumber(x)), row("y", (x) => formatNumber(f(x))), row("y : x", ratio));

    message.className = `il-message ${shifted ? "warn" : "good"}`;
    message.textContent = shifted
      ? `Most az y : x hányados minden pontnál más (${XS.map(ratio).join("; ")}), és az egyenes a (0; 3) ponton megy át, nem az origón. A szaggatott háromszögek átfogói különböző irányba mutatnak. Ez nem egyenes arányosság.`
      : k === 0
        ? "Ha k = 0, akkor minden y értéke 0: a grafikon maga az x tengely. Az y : x hányados mindenhol 0."
        : `Az y : x hányados mindenhol ugyanannyi: ${formatNumber(k)}. A háromszögek átfogói mind az egyenesen fekszenek, az egyenes az origón megy át.`;
  }

  render();
  return () => scope.clearAll();
}
