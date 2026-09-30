import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle } from "./kit.js";

const SIZE = 420, PAD = 34, MAX = 13;
const unit = (SIZE - 2 * PAD) / MAX;
const toX = (x) => PAD + x * unit;
const toY = (y) => SIZE - PAD - y * unit;
const AREAS = [4, 6, 12];

export function mount(root) {
  const scope = createScope();
  const state = { area: 12, x: 3, visited: new Set([3]), showCurve: false, playing: false };
  const heightOf = (x) => state.area / x;

  root.append(lead("Képzelj el téglalapokat, amelyeknek ugyanakkora a területük. Ha az egyik oldaluk nő, a másiknak kisebbre kell lennie. Az ilyen kapcsolat a fordított arányosság: a két oldal szorzata mindig ugyanannyi."));

  const main = card("Állandó területű téglalapok");
  const areaRow = make("div", "il-controls");
  const widthSlider = range({ label: "szélesség (x)", min: 1, max: 12, step: 0.5, value: state.x, onInput: (v) => { stop(); setX(v); } });
  const playButton = button("Végigpásztázás", play);
  const curveToggle = toggle("Görbe mutatása", false, () => { state.showCurve = !state.showCurve; curveToggle.setAttribute("aria-pressed", String(state.showCurve)); render(); });
  const formulaLine = make("div");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${SIZE} ${SIZE}`, role: "img", style: "max-width:460px;margin:0 auto" });
  const message = make("p", "il-message");
  main.append(areaRow, controls(widthSlider.element, playButton, curveToggle), formulaLine, figure, message);

  // ---- Card 2: getting close to the axes ----
  const close = card("Eléri valaha a tengelyt?");
  const zoom = { x: 4, rows: [] };
  const zoomTable = make("table", "il-table");
  const zoomMessage = make("p", "il-message");
  close.append(make("p", "", "Kezdd a 4 szélességgel, és többször egymás után felezd meg vagy duplázd meg a szélességet. Nézd meg, mi lesz a magasságból."),
    controls(button("Felezés (x : 2)", () => step(0.5)), button("Duplázás (x · 2)", () => step(2)), button("Újra", reset, { ghost: true })), zoomTable, zoomMessage);
  root.append(main, close, keyIdea("fordított arányosságnál a két mennyiség szorzata állandó (x · y = k). Ha az egyik kétszeresére nő, a másik a felére csökken. A grafikon ezért görbe, a hiperbola, amely egyre közelebb kerül a tengelyekhez, de sosem éri el őket."));

  function stop() { state.playing = false; scope.clearAll(); playButton.textContent = "Végigpásztázás"; }
  function setX(x) { state.x = x; state.visited.add(x); widthSlider.set(x); render(); }

  function play() {
    if (state.playing) return stop();
    state.playing = true; playButton.textContent = "Megállít";
    if (state.x >= 12) state.x = 0.5;
    const tick = () => {
      if (!state.playing) return;
      if (state.x >= 12) return stop();
      setX(state.x + 0.5);
      scope.timeout(tick, 260);
    };
    tick();
  }

  function render() {
    const k = state.area, x = state.x, y = heightOf(x);
    areaRow.replaceChildren(make("span", "il-muted", "Terület (k):"), ...AREAS.map((value) => toggle(String(value), value === k, () => { stop(); state.area = value; state.visited = new Set([state.x]); render(); })));
    formulaLine.replaceChildren(equation(rich(slot(formatNumber(x, 2), 5), " · ", slot(formatNumber(y, 2), 5)), String(k)));
    figure.replaceChildren();
    for (let v = 0; v <= MAX; v++) {
      svg("line", { x1: toX(v), x2: toX(v), y1: toY(MAX), y2: toY(0), class: v ? "grid" : "axis" }, figure);
      svg("line", { x1: toX(0), x2: toX(MAX), y1: toY(v), y2: toY(v), class: v ? "grid" : "axis" }, figure);
      if (v && v % 2 === 0) {
        svg("text", { x: toX(v), y: toY(0) + 16, "text-anchor": "middle", text: String(v), style: "font-size:11px;fill:var(--dim)" }, figure);
        svg("text", { x: toX(0) - 7, y: toY(v) + 4, "text-anchor": "end", text: String(v), style: "font-size:11px;fill:var(--dim)" }, figure);
      }
    }
    svg("text", { x: toX(MAX) - 2, y: toY(0) - 8, "text-anchor": "end", text: "x", style: "font-style:italic" }, figure);
    svg("text", { x: toX(0) + 8, y: toY(MAX) + 12, text: "y", style: "font-style:italic" }, figure);
    if (state.showCurve) {
      const from = k / MAX, points = [];
      for (let i = 0; i <= 160; i++) { const px = from + ((MAX - from) * i) / 160; points.push(`${i ? "L" : "M"} ${toX(px)} ${toY(k / px)}`); }
      svg("path", { d: points.join(" "), fill: "none", style: `stroke:${PALETTE.pink};stroke-width:3` }, figure);
    }
    for (const past of state.visited) {
      if (past === x) continue;
      const py = k / past;
      svg("rect", { x: toX(0), y: toY(py), width: past * unit, height: py * unit, fill: "none", style: "stroke:var(--line-strong);stroke-width:1" }, figure);
      svg("circle", { cx: toX(past), cy: toY(py), r: 4.5, style: `fill:${PALETTE.pink}` }, figure);
    }
    svg("rect", { x: toX(0), y: toY(y), width: x * unit, height: y * unit, style: `fill:${PALETTE.amber};fill-opacity:.35;stroke:${PALETTE.amber};stroke-width:2.5` }, figure);
    svg("text", { x: toX(x / 2), y: toY(y / 2) + 5, "text-anchor": "middle", text: `terület = ${k}`, style: "fill:var(--fg);font-weight:700" }, figure);
    svg("circle", { cx: toX(x), cy: toY(y), r: 8, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2.5` }, figure);
    message.className = "il-message";
    message.textContent = `A téglalap ${formatNumber(x, 2)} széles és ${formatNumber(y, 2)} magas, a területe ${formatNumber(x, 2)} · ${formatNumber(y, 2)} = ${k}. A sarokpontja a (${formatNumber(x, 2)}; ${formatNumber(y, 2)}) pont — mozgasd a csúszkát, és nézd, merre jár.`;
    renderZoom();
  }

  function step(factor) {
    zoom.x *= factor;
    zoom.rows.push(zoom.x);
    if (zoom.rows.length > 7) zoom.rows.shift();
    renderZoom();
  }

  function reset() { zoom.x = 4; zoom.rows = []; renderZoom(); }

  function renderZoom() {
    const k = state.area, xs = [4, ...zoom.rows].slice(-7);
    const row = (heading, cell) => { const tr = make("tr"); tr.append(make("th", "", heading), ...xs.map((v) => make("td", "", cell(v)))); return tr; };
    zoomTable.replaceChildren(row("x", (v) => formatNumber(v, 4)), row("y", (v) => formatNumber(k / v, 4)), row("x · y", (v) => formatNumber(v * (k / v), 4)));
    const tiny = Math.min(...xs), huge = Math.max(...xs);
    zoomMessage.className = "il-message good";
    zoomMessage.textContent = tiny < 1 && xs.includes(tiny) && tiny <= 0.25
      ? `Minél kisebb az x, annál nagyobb az y, hogy a szorzat ${k} maradjon. Az x nem lehet 0, mert 0 · y mindig 0, nekünk pedig ${k} kell. Ezért a grafikon nem érheti el az y tengelyt.`
      : huge >= 16
        ? `Minél nagyobb az x, annál kisebb az y, de pozitív szám osztva pozitív számmal mindig pozitív, tehát az y sosem lesz 0. Ezért a grafikon nem érheti el az x tengelyt.`
        : "Próbáld tovább: mi történik az y-nal, ha az x nagyon kicsi vagy nagyon nagy?";
    if (zoomMessage.textContent.startsWith("Próbáld")) zoomMessage.className = "il-message";
  }

  render();
  return () => scope.clearAll();
}
