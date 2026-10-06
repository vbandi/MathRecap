import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, svg, toggle, uniqueId } from "./kit.js";

// ---------- Part 1: arrow diagrams ----------
const EXAMPLES = [
  { left: [1, 2, 3, 4], right: [2, 3, 5], arrows: [[0, 0], [1, 0], [2, 1], [3, 2]], isFunction: true,
    why: "Minden kiindulási elemből pontosan egy nyíl indul. Az, hogy az 1 és a 2 is ugyanoda mutat, nem számít: az egyik elemhez akkor is csak egy érték tartozik." },
  { left: [1, 2, 3], right: [4, 5, 6], arrows: [[0, 0], [1, 1], [1, 2], [2, 2]], isFunction: false, bad: 1,
    why: "A 2-ből két nyíl indul (az 5-höz és a 6-hoz is). Így nem egyértelmű, melyik érték tartozik a 2-höz, ezért ez nem függvény." },
  { left: [1, 2, 3, 4], right: [1, 4, 9], arrows: [[0, 0], [1, 1], [2, 2]], isFunction: false, bad: 3,
    why: "A 4-ből nem indul nyíl, tehát hozzá nem tartozik érték. Függvénynél minden kiindulási elemnek kell hozzárendelt értéke." },
  { left: [-2, -1, 0, 1], right: [0, 1, 4], arrows: [[0, 2], [1, 1], [2, 0], [3, 1]], isFunction: true,
    why: "Minden számból egy nyíl indul: minden számhoz a négyzete tartozik. A −1 és az 1 ugyanazt az értéket kapja, de ez belefér." },
];
const VIEW = { w: 600, h: 230, leftX: 90, rightX: 410, boxW: 100, boxH: 30 };
const rowY = (index, count) => (count === 1 ? VIEW.h / 2 : 28 + (index * (VIEW.h - 56)) / (count - 1));

// ---------- Plot helper ----------
function makeWindow(figure, { w, h, pad, xMin, xMax, yMin, yMax, xStep = 1, yStep = 1 }) {
  const toX = (x) => pad + ((x - xMin) / (xMax - xMin)) * (w - 2 * pad);
  const toY = (y) => h - pad - ((y - yMin) / (yMax - yMin)) * (h - 2 * pad);
  for (let x = Math.ceil(xMin); x <= xMax; x += xStep) {
    svg("line", { x1: toX(x), x2: toX(x), y1: pad, y2: h - pad, class: x ? "grid" : "axis" }, figure);
    if (x) svg("text", { x: toX(x), y: toY(0) + 15, "text-anchor": "middle", text: formatNumber(x), style: "font-size:10px;fill:var(--dim)" }, figure);
  }
  for (let y = Math.ceil(yMin); y <= yMax; y += yStep) {
    svg("line", { x1: pad, x2: w - pad, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    if (y) svg("text", { x: toX(0) - 6, y: toY(y) + 4, "text-anchor": "end", text: formatNumber(y), style: "font-size:10px;fill:var(--dim)" }, figure);
  }
  svg("text", { x: w - pad - 2, y: toY(0) - 7, "text-anchor": "end", text: "x", style: "font-style:italic" }, figure);
  svg("text", { x: toX(0) + 7, y: pad - 6, text: "y", style: "font-style:italic" }, figure);
  return { toX, toY };
}

const pathOf = (points, toX, toY) => points.map(([x, y], i) => `${i ? "L" : "M"} ${toX(x)} ${toY(y)}`).join(" ");
const sample = (from, to, n, map) => Array.from({ length: n + 1 }, (_, i) => { const t = from + ((to - from) * i) / n; return map(t); });

// ---------- Part 2: vertical line test ----------
const CURVES = {
  parabola: { label: "Parabola", isFunction: true, hits: (v) => [v * v / 4 - 2.5].filter((y) => Math.abs(y) <= 4),
    points: () => sample(-5, 5, 100, (x) => [x, x * x / 4 - 2.5]), why: "Bárhová húzod a függőleges egyenest, pontosan egy pontban metszi a görbét: minden x-hez egy y tartozik. Ez függvény grafikonja." },
  circle: { label: "Kör", isFunction: false, hits: (v) => (Math.abs(v) > 3 ? [] : Math.abs(v) === 3 ? [0] : [Math.sqrt(9 - v * v), -Math.sqrt(9 - v * v)]),
    points: () => sample(0, 2 * Math.PI, 120, (t) => [3 * Math.cos(t), 3 * Math.sin(t)]), why: "A kör belsejében a függőleges egyenes két pontban metszi a görbét, vagyis egy x-hez két y tartozik. Ez nem függvény grafikonja." },
  sideways: { label: "Fekvő parabola", isFunction: false, hits: (v) => (v < -3 ? [] : v === -3 ? [0] : [Math.sqrt(2 * (v + 3)), -Math.sqrt(2 * (v + 3))]),
    points: () => sample(-4, 4, 100, (y) => [y * y / 2 - 3, y]), why: "Jobbra a csúcstól a függőleges egyenes két pontban metszi a görbét, egy x-hez két y tartozik. Ez nem függvény grafikonja." },
};

// ---------- Part 3: domain and range ----------
const FUNCTIONS = [
  { label: "f(x) = x² − 2", f: (x) => x * x - 2, from: -2, to: 3, range: [-2, 7], win: { xMin: -4, xMax: 5, yMin: -4, yMax: 9 }, yStep: 1 },
  { label: "g(x) = 2x − 1", f: (x) => 2 * x - 1, from: -1, to: 3, range: [-3, 5], win: { xMin: -3, xMax: 5, yMin: -5, yMax: 7 }, yStep: 1 },
  { label: "h(x) = √x", f: (x) => Math.sqrt(x), from: 0, to: 9, range: [0, 3], win: { xMin: -2, xMax: 10, yMin: -2, yMax: 4 }, yStep: 1 },
];

export function mount(root) {
  const scope = createScope();
  root.append(lead("A függvény olyan hozzárendelés, amelyben minden kiindulási értékhez pontosan egy érték tartozik. Ha egy x-hez két különböző y is járna, vagy nem járna semmi, akkor nem függvény."));

  // ---- Card 1 ----
  const check = card("Függvény vagy nem függvény?");
  const exState = { index: 0, answered: false };
  const exFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW.w} ${VIEW.h}`, role: "img" });
  const exMessage = make("p", "il-message");
  const yesButton = button("Függvény", () => answer(true));
  const noButton = button("Nem függvény", () => answer(false));
  const nextButton = button("Következő ábra", () => { exState.index = (exState.index + 1) % EXAMPLES.length; exState.answered = false; exMessage.textContent = ""; exMessage.className = "il-message"; drawExample(); }, { ghost: true });
  check.append(make("p", "", "Nézd meg a nyilakat: minden kiindulási elemből pontosan egy nyíl indul?"), exFigure, exMessage, controls(yesButton, noButton, nextButton));
  const markerId = uniqueId("fn-arrow");
  const defs = svg("defs", {}, exFigure);
  svg("path", { d: "M 0 0 L 10 5 L 0 10 Z", style: "fill:var(--accent)" }, svg("marker", { id: markerId, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 8, markerHeight: 8, orient: "auto" }, defs));
  const exLayer = svg("g", {}, exFigure);

  function drawExample() {
    const ex = EXAMPLES[exState.index], leftX = 130, rightX = 420, boxW = 52;
    exLayer.replaceChildren();
    for (const [from, to] of ex.arrows) {
      svg("line", { x1: leftX + boxW + 4, y1: rowY(from, ex.left.length), x2: rightX - 4, y2: rowY(to, ex.right.length), "marker-end": `url(#${markerId})`, style: "stroke:var(--accent);stroke-width:2.5" }, exLayer);
    }
    const box = (x, y, text, bad) => {
      svg("rect", { x, y: y - VIEW.boxH / 2, width: boxW, height: VIEW.boxH, rx: 9, style: `fill:var(--surface);stroke:${bad ? "var(--warn)" : "var(--line-strong)"};stroke-width:${bad ? 3 : 1.5}` }, exLayer);
      svg("text", { x: x + boxW / 2, y: y + 5, "text-anchor": "middle", text: formatNumber(text), style: "fill:var(--fg);font-weight:600;font-size:15px" }, exLayer);
    };
    ex.left.forEach((value, i) => box(leftX, rowY(i, ex.left.length), value, exState.answered && ex.bad === i));
    ex.right.forEach((value, i) => box(rightX, rowY(i, ex.right.length), value, false));
  }

  function answer(guessYes) {
    const ex = EXAMPLES[exState.index];
    exState.answered = true;
    const right = guessYes === ex.isFunction;
    exMessage.className = `il-message ${right ? "good" : "warn"}`;
    exMessage.textContent = `${right ? "Jó!" : "Nem egészen."} ${ex.why}`;
    drawExample();
  }

  // ---- Card 2 ----
  const lineTest = card("Függőleges egyenes próba");
  const lt = { curve: "parabola", v: -1 };
  const curveRow = make("div", "il-controls");
  const ltFigure = svg("svg", { class: "il-svg", viewBox: "0 0 560 460", role: "img", style: "max-width:560px;margin:0 auto;touch-action:none" });
  const ltMessage = make("p", "il-message");
  const ltWin = makeWindow(ltFigure, { w: 560, h: 460, pad: 30, xMin: -5, xMax: 5, yMin: -4, yMax: 4 });
  const ltLayer = svg("g", {}, ltFigure);
  const ltSlider = range({ label: "a függőleges egyenes helye: x", min: -5, max: 5, step: 0.25, value: lt.v, onInput: (value) => { lt.v = value; drawLineTest(); } });
  lineTest.append(make("p", "", "Egy grafikon akkor függvényé, ha nincs olyan függőleges egyenes, amely két pontban is metszi. Húzd a függőleges egyenest (csúszkával vagy az ábrán), és számold a metszéspontokat."), curveRow, ltFigure, controls(ltSlider.element), ltMessage);

  function drawLineTest() {
    const curve = CURVES[lt.curve];
    curveRow.replaceChildren(...Object.entries(CURVES).map(([key, c]) => toggle(c.label, key === lt.curve, () => { lt.curve = key; drawLineTest(); })));
    ltLayer.replaceChildren();
    svg("path", { d: pathOf(curve.points(), ltWin.toX, ltWin.toY), fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, ltLayer);
    svg("line", { x1: ltWin.toX(lt.v), x2: ltWin.toX(lt.v), y1: 30, y2: 430, style: `stroke:${PALETTE.blue};stroke-width:2.5;stroke-dasharray:7 5` }, ltLayer);
    const hits = curve.hits(lt.v);
    for (const y of hits) svg("circle", { cx: ltWin.toX(lt.v), cy: ltWin.toY(y), r: 8, style: `fill:${hits.length > 1 ? PALETTE.red : PALETTE.amber};stroke:var(--input);stroke-width:2` }, ltLayer);
    const xText = formatNumber(lt.v, 2);
    ltMessage.className = `il-message ${hits.length > 1 ? "warn" : ""}`;
    ltMessage.textContent = hits.length === 0
      ? `x = ${xText}-nél a görbe nem metszi az egyenest: itt nincs is ilyen pont a grafikonon.`
      : hits.length === 1
        ? `x = ${xText} mellett pontosan 1 metszéspont van (y = ${formatNumber(hits[0], 2)}). ${curve.isFunction ? curve.why : "Húzd tovább az egyenest: hol lesz belőle kettő?"}`
        : `x = ${xText} mellett ${hits.length} metszéspont van (y = ${hits.map((y) => formatNumber(y, 2)).join(" és y = ")}). ${curve.why}`;
  }
  ltFigure.addEventListener("pointerdown", (event) => { ltFigure.setPointerCapture?.(event.pointerId); moveLine(event); });
  ltFigure.addEventListener("pointermove", (event) => { if (event.buttons) moveLine(event); });
  function moveLine(event) {
    const box = ltFigure.getBoundingClientRect(), px = ((event.clientX - box.left) / box.width) * 560;
    lt.v = Math.max(-5, Math.min(5, Math.round(((px - 30) / 500 * 10 - 5) * 4) / 4));
    ltSlider.set(lt.v); drawLineTest();
  }

  // ---- Card 3 ----
  const dr = card("Értelmezési tartomány és értékkészlet");
  const drState = { index: 0, x: -2, shade: false };
  const drRow = make("div", "il-controls");
  const drFigure = svg("svg", { class: "il-svg", viewBox: "0 0 560 360", role: "img", style: "max-width:560px;margin:0 auto" });
  const drText = make("p", "il-message");
  const drSlider = range({ label: "x", min: -2, max: 3, step: 0.25, value: -2, onInput: (value) => { drState.x = value; drawDomain(); } });
  const shadeToggle = toggle("Mutasd a tartományokat", false, () => { drState.shade = !drState.shade; shadeToggle.setAttribute("aria-pressed", String(drState.shade)); drawDomain(); });
  dr.append(make("p", "", "Az értelmezési tartomány azok az x értékek, amelyekre a függvényt megadtuk (a vízszintes tengelyen). Az értékkészlet azok az y értékek, amelyeket a függvény fel is vesz (a függőleges tengelyen)."), drRow, drFigure, controls(drSlider.element, shadeToggle), drText);

  function drawDomain() {
    const fn = FUNCTIONS[drState.index];
    drRow.replaceChildren(...FUNCTIONS.map((item, i) => toggle(item.label, i === drState.index, () => { drState.index = i; drState.x = item.from; drSlider.input.min = item.from; drSlider.input.max = item.to; drSlider.set(item.from); drawDomain(); })));
    drFigure.replaceChildren();
    const win = makeWindow(drFigure, { w: 560, h: 360, pad: 30, ...fn.win });
    const [lo, hi] = fn.range;
    if (drState.shade) {
      svg("line", { x1: win.toX(fn.from), x2: win.toX(fn.to), y1: win.toY(0), y2: win.toY(0), style: `stroke:${PALETTE.blue};stroke-width:9;opacity:.6;stroke-linecap:round` }, drFigure);
      svg("line", { x1: win.toX(0), x2: win.toX(0), y1: win.toY(lo), y2: win.toY(hi), style: `stroke:${PALETTE.amber};stroke-width:9;opacity:.6;stroke-linecap:round` }, drFigure);
    }
    svg("path", { d: pathOf(sample(fn.from, fn.to, 120, (x) => [x, fn.f(x)]), win.toX, win.toY), fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, drFigure);
    for (const x of [fn.from, fn.to]) svg("circle", { cx: win.toX(x), cy: win.toY(fn.f(x)), r: 5, style: "fill:var(--accent)" }, drFigure);
    const y = fn.f(drState.x);
    svg("line", { x1: win.toX(drState.x), x2: win.toX(drState.x), y1: win.toY(y), y2: win.toY(0), style: `stroke:${PALETTE.blue};stroke-width:2;stroke-dasharray:5 4` }, drFigure);
    svg("line", { x1: win.toX(drState.x), x2: win.toX(0), y1: win.toY(y), y2: win.toY(y), style: `stroke:${PALETTE.amber};stroke-width:2;stroke-dasharray:5 4` }, drFigure);
    svg("circle", { cx: win.toX(drState.x), cy: win.toY(y), r: 7, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, drFigure);
    drText.className = "il-message";
    drText.textContent = drState.shade
      ? `Értelmezési tartomány (kék): ${formatNumber(fn.from)} ≤ x ≤ ${formatNumber(fn.to)}, vagyis [${formatNumber(fn.from)}; ${formatNumber(fn.to)}]. Értékkészlet (narancs): ${formatNumber(lo)} ≤ y ≤ ${formatNumber(hi)}, vagyis [${formatNumber(lo)}; ${formatNumber(hi)}].`
      : `x = ${formatNumber(drState.x, 2)} esetén a függvény értéke ${formatNumber(y, 2)}. Mozgasd az x-et, és kapcsold be a tartományok mutatását.`;
  }

  root.append(check, lineTest, dr, keyIdea("függvénynél minden x-hez pontosan egy y tartozik. A grafikonon ez azt jelenti, hogy semelyik függőleges egyenes nem metszi a görbét kétszer. Az x értékek halmaza az értelmezési tartomány, az y értékeké az értékkészlet."));
  drawExample();
  drawLineTest();
  drawDomain();
  return () => scope.clearAll();
}
