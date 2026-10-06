import { card, controls, createScope, keyIdea, lead, make, PALETTE, range, rich, svg } from "./kit.js";

const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n) => String(n).split("").map((d) => SUPERSCRIPT[Number(d)]).join("");
const NBSP = " ";
const grouped = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
const LAYER_COLORS = [PALETTE.red, PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.violet, PALETTE.pink];

export function mount(root) {
  const scope = createScope();
  root.append(lead("A hatvány az ismételt szorzás rövid jelölése: 3⁴ azt jelenti, hogy négy darab 3-ast szorzunk össze. Az alsó szám (alap) az ismétlődő tényező, a kis felső szám (kitevő) pedig azt mondja meg, hányszor szerepel."));

  // --- Base and exponent ---
  const basic = card("Alap és kitevő");
  const state = { base: 3, exponent: 4 };
  const expanded = make("div", "il-formula start"), contrast = make("div");
  expanded.style.cssText += ";font-size:20px;line-height:1.8;min-height:3.6em";
  const message = make("p", "il-message");
  basic.append(controls(
    range({ label: "Alap", min: 1, max: 10, value: state.base, format: String, onInput: (v) => { state.base = v; renderBasic(); } }).element,
    range({ label: "Kitevő", min: 1, max: 6, value: state.exponent, format: String, onInput: (v) => { state.exponent = v; renderBasic(); } }).element,
  ), expanded, contrast, message);
  function bar(label, value, max, color) {
    const row = make("div", "il-bar"), name = make("span", "", label), track = make("div", "track"), fill = make("div", "fill"), number = make("b", "", grouped(value));
    name.style.flexBasis = "210px";
    fill.style.width = `${Math.max(1, (value / max) * 100)}%`; fill.style.background = color;
    track.append(fill); row.append(name, track, number);
    return row;
  }
  function renderBasic() {
    const { base, exponent } = state, power = base ** exponent, product = base * exponent;
    expanded.replaceChildren(rich(`${base}${sup(exponent)} = ${Array(exponent).fill(base).join(" · ")} = ${grouped(power)}`));
    const max = Math.max(power, product);
    contrast.replaceChildren(
      bar(`${base} · ${exponent} = ${exponent} db ${base} összege`, product, max, PALETTE.amber),
      bar(`${base}${sup(exponent)} = ${exponent} db ${base} szorzata`, power, max, PALETTE.blue),
    );
    message.className = "il-message good";
    message.textContent = base === 1 ? "Az 1 bármelyik hatványa 1, mert az 1-gyel való szorzás semmit sem változtat." : `${base}${sup(exponent)} = ${grouped(power)}, de ${base} · ${exponent} = ${product}: a szorzás az összeadást rövidíti, a hatvány a szorzást. A hatvány sokkal gyorsabban nő.`;
  }

  // --- Squares and cubes ---
  const shapes = card("Négyzetszám és köbszám");
  let n = 4;
  const grid = make("div");
  grid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px";
  const squareFigure = svg("svg", { class: "il-svg", viewBox: "0 0 300 300", role: "img" });
  const cubeFigure = svg("svg", { class: "il-svg", viewBox: "0 0 300 300", role: "img" });
  grid.append(squareFigure, cubeFigure);
  const shapeLine = make("div", "il-formula start"), shapeMessage = make("p", "il-message");
  shapes.append(controls(range({ label: "n", min: 1, max: 5, value: n, format: String, onInput: (v) => { n = v; renderShapes(); } }).element), grid, shapeLine, shapeMessage);
  function renderShapes() {
    squareFigure.replaceChildren(); cubeFigure.replaceChildren();
    const cell = 240 / Math.max(n, 3), x0 = 150 - (n * cell) / 2, y0 = 150 - (n * cell) / 2;
    for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
      svg("circle", { cx: x0 + col * cell + cell / 2, cy: y0 + row * cell + cell / 2, r: cell * 0.36, style: `fill:${LAYER_COLORS[Math.max(row, col)]};opacity:.9` }, squareFigure);
    }
    svg("text", { x: 150, y: 20, "text-anchor": "middle", text: `${n} sor, ${n} oszlop`, style: "font-size:13px" }, squareFigure);
    // Isometric stack of n · n · n unit cubes, drawn back to front.
    const s = Math.min(36, 120 / n), a = s * 0.866, b = s * 0.5, cx = 150, cy = 40 + n * s * 0.85;
    const project = (x, y, z) => `${cx + (x - y) * a},${cy + (x + y) * b - z * s}`;
    for (let z = 0; z < n; z++) for (let sum = 0; sum <= 2 * (n - 1); sum++) for (let x = 0; x < n; x++) {
      const y = sum - x;
      if (y < 0 || y >= n) continue;
      const face = (points, shade) => svg("polygon", { points: points.map((p) => project(...p)).join(" "), style: `fill:${LAYER_COLORS[z]};stroke:var(--bg);stroke-width:1.2;filter:brightness(${shade})` }, cubeFigure);
      face([[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], 1.15);
      face([[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], 0.85);
      face([[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]], 0.65);
    }
    svg("text", { x: 150, y: 20, "text-anchor": "middle", text: `${n} réteg, rétegenként ${n * n} kocka`, style: "font-size:13px" }, cubeFigure);
    shapeLine.replaceChildren(rich(`${n}² = ${n} · ${n} = ${n * n}`), make("br"), rich(`${n}³ = ${n} · ${n} · ${n} = ${n ** 3}`));
    const odds = Array.from({ length: n }, (_, i) => 2 * i + 1);
    shapeMessage.className = "il-message good";
    shapeMessage.textContent = `${n * n} a négyzetszám (a négyzet kis köreinek száma), ${n ** 3} a köbszám (a kocka építőkockáinak száma). A színek megmutatják: ${odds.join(" + ")} = ${n * n}, vagyis minden újabb réteg páratlan számú körrel bővíti a négyzetet.`;
  }

  // --- Doubling ---
  const doubling = card("Duplázás: a 2 hatványai");
  let k = 5;
  const doublingFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 320", role: "img" });
  const doublingLine = make("div", "il-formula start"), doublingMessage = make("p", "il-message");
  doubling.append(controls(range({ label: "Kitevő", min: 1, max: 8, value: k, format: String, onInput: (v) => { k = v; renderDoubling(); } }).element), doublingFigure, doublingLine, doublingMessage);
  function renderDoubling() {
    doublingFigure.replaceChildren();
    const total = 2 ** k, columns = Math.min(16, total), spacing = 18;
    for (let i = 0; i < total; i++) {
      const generation = i === 0 ? 0 : Math.floor(Math.log2(i)) + 1;
      svg("circle", { cx: 26 + (i % columns) * spacing, cy: 16 + Math.floor(i / columns) * spacing, r: 6.5, style: `fill:${LAYER_COLORS[generation % LAYER_COLORS.length]}` }, doublingFigure);
    }
    const lines = [`2${sup(k)} = ${Array(k).fill(2).join(" · ")} = ${total}`, `Lépésenként duplázódik: ${Array.from({ length: k + 1 }, (_, i) => 2 ** i).join(" → ")}`];
    svg("text", { x: 340, y: 60, text: "Minden új szín az eddigi összes", style: "font-size:14px" }, doublingFigure);
    svg("text", { x: 340, y: 82, text: "pötty pontosan megkétszerezi.", style: "font-size:14px" }, doublingFigure);
    doublingLine.textContent = lines[0];
    doublingMessage.className = "il-message good";
    doublingMessage.textContent = `${lines[1]}. Ha a kitevő 1-gyel nő, az érték kétszeresére változik, ezért gyorsan óriási számokhoz jutunk.`;
  }

  root.append(basic, shapes, doubling, keyIdea("az aⁿ azt jelenti, hogy n darab a-t szorzunk össze (nem azt, hogy a · n). A négyzetszám egy n · n-es négyzet, a köbszám egy n · n · n-es kocka pontjainak száma, a 2 hatványai pedig minden lépésben megduplázódnak."));
  renderBasic(); renderShapes(); renderDoubling();
  return () => scope.clearAll();
}
