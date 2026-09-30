import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, svg } from "./kit.js";

const W = 720, H = 250, LEFT = 50, RIGHT = 20, TOP = 16, BOTTOM = 205;
const FACES = [1, 2, 3, 4, 5, 6];

export function mount(root) {
  const scope = createScope();
  let counts, total, last, timer = null;
  const reset0 = () => { counts = Array(6).fill(0); total = 0; last = null; };
  reset0();

  root.append(lead("Ha egy kockával sokszor dobunk, mindegyik számot más-más alkalommal kapjuk. A gyakoriság azt mondja meg, hányszor kaptuk az adott számot. A relatív gyakoriság pedig azt, hogy az összes dobásnak hányad részében kaptuk: gyakoriság osztva a dobások számával."));

  const lab = card("Dobjunk sokat");
  const dieFace = svg("svg", { viewBox: "0 0 60 60", width: 60, height: 60, role: "img", "aria-label": "Az utolsó dobás", style: "flex:none" });
  const status = make("span", "il-muted");
  const tableBox = make("div");
  lab.append(controls(dieFace, button("1 dobás", () => roll(1)), button("10 dobás", () => roll(10)), button("100 dobás", () => roll(100)), button("1000 dobás", () => roll(1000)), button("Nullázás", reset, { ghost: true })), status, tableBox);

  const chartCard = card("A relatív gyakoriságok oszlopai");
  const chart = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "A hat dobás relatív gyakorisága" }, chartCard);
  const chartLayer = svg("g", {}, chart);
  const message = make("p", "il-message");
  chartCard.append(chart, message, make("p", "il-muted", "A narancs szaggatott vonal az 1/6 ≈ 0,167 érték, amit egy szabályos kockánál várunk. Kevés dobásnál az oszlopok össze-vissza ugrálnak, sok dobásnál mind ehhez a vonalhoz simul."));

  root.append(lab, chartCard, keyIdea("a relatív gyakoriság = gyakoriság / dobások száma. A relatív gyakoriságok összege mindig 1, és sok dobásnál mindegyik a valószínűséghez (itt 1/6-hoz) közelít."));

  function drawFace(value) {
    dieFace.replaceChildren();
    svg("rect", { x: 3, y: 3, width: 54, height: 54, rx: 11, style: "fill:var(--surface);stroke:var(--line-strong);stroke-width:2.5" }, dieFace);
    const pips = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[value] ?? [];
    pips.forEach(([dx, dy]) => svg("circle", { cx: 30 + dx * 13, cy: 30 + dy * 13, r: 4.8, style: "fill:var(--fg)" }, dieFace));
  }

  function roll(times) {
    if (timer !== null) scope.clearInterval(timer);
    let left = times;
    const perTick = times > 20 ? Math.ceil(times / 50) : 1;
    timer = scope.interval(() => {
      for (let i = 0; i < perTick && left > 0; i++, left--) {
        last = Math.floor(Math.random() * 6);
        counts[last] += 1; total += 1;
      }
      render();
      if (left <= 0) { scope.clearInterval(timer); timer = null; }
    }, times > 20 ? 30 : 350);
  }

  function reset() {
    scope.clearAll(); timer = null;
    reset0(); render();
  }

  function renderTable() {
    const table = make("table", "il-table");
    const head = make("tr"), freqRow = make("tr"), fractionRow = make("tr"), relRow = make("tr");
    head.append(make("th", "", "szám"));
    freqRow.append(make("th", "", "gyakoriság"));
    fractionRow.append(make("th", "", "tört"));
    relRow.append(make("th", "", "relatív gyakoriság"));
    FACES.forEach((face, i) => {
      const hot = last === i;
      const th = make("th", "", String(face));
      if (hot) th.style.color = "var(--accent)";
      head.append(th);
      freqRow.append(make("td", "", String(counts[i])));
      fractionRow.append(make("td", "", total ? `${counts[i]}/${total}` : "–"));
      relRow.append(make("td", "", total ? formatNumber(counts[i] / total, 3) : "–"));
    });
    head.append(make("th", "", "összesen"));
    freqRow.append(make("td", "", String(total)));
    fractionRow.append(make("td", "", total ? `${total}/${total}` : "–"));
    relRow.append(make("td", "", total ? "1" : "–"));
    table.append(head, freqRow, fractionRow, relRow);
    tableBox.replaceChildren(table);
  }

  function renderChart() {
    chartLayer.replaceChildren();
    const maxScale = total < 20 ? 1 : total < 120 ? 0.5 : 0.3;
    const y = (v) => BOTTOM - (Math.min(v, maxScale) / maxScale) * (BOTTOM - TOP);
    const ticks = maxScale === 1 ? [0, 0.5, 1] : maxScale === 0.5 ? [0, 0.25, 0.5] : [0, 0.1, 0.2, 0.3];
    ticks.forEach((tick) => {
      svg("line", { x1: LEFT, x2: W - RIGHT, y1: y(tick), y2: y(tick), class: tick ? "grid" : "axis" }, chartLayer);
      svg("text", { x: LEFT - 8, y: y(tick) + 4, "text-anchor": "end", text: formatNumber(tick), style: "font-size:12px;fill:var(--dim)" }, chartLayer);
    });
    const slotWidth = (W - LEFT - RIGHT) / 6;
    FACES.forEach((face, i) => {
      const value = total ? counts[i] / total : 0, x = LEFT + i * slotWidth + slotWidth * 0.2;
      svg("rect", { x, y: y(value), width: slotWidth * 0.6, height: BOTTOM - y(value), rx: 4, style: `fill:${PALETTE.blue};opacity:${last === i ? 1 : 0.8}` }, chartLayer);
      svg("text", { x: x + slotWidth * 0.3, y: BOTTOM + 18, "text-anchor": "middle", text: String(face), style: "font-weight:700" }, chartLayer);
      if (total) svg("text", { x: x + slotWidth * 0.3, y: y(value) - 5, "text-anchor": "middle", text: formatNumber(value, 2), style: "font-size:11px" }, chartLayer);
    });
    svg("line", { x1: LEFT, x2: W - RIGHT, y1: y(1 / 6), y2: y(1 / 6), style: `stroke:${PALETTE.amber};stroke-width:2.5;stroke-dasharray:7 5` }, chartLayer);
    svg("text", { x: W - RIGHT, y: y(1 / 6) - 6, "text-anchor": "end", text: "1/6", style: `fill:${PALETTE.amber};font-weight:700` }, chartLayer);
  }

  function render() {
    drawFace(last === null ? 0 : last + 1);
    status.textContent = total ? `${total} dobás` : "Még nem dobtunk.";
    renderTable(); renderChart();
    if (!total) { message.className = "il-message"; message.textContent = "Kattints a dobás gombokra!"; return; }
    const spread = Math.max(...counts.map((c) => Math.abs(c / total - 1 / 6)));
    message.className = `il-message ${total >= 600 ? "good" : ""}`;
    message.textContent = total < 30
      ? "Kevés dobásnál a relatív gyakoriságok még nagyon eltérnek egymástól és 1/6-tól."
      : `A legnagyobb eltérés az 1/6-tól (${formatNumber(1 / 6, 3)}) most ${formatNumber(spread, 3)}. ${total >= 600 ? "Sok dobásnál mindegyik szám relatív gyakorisága közel van 1/6-hoz." : "Dobj még többet!"}`;
  }

  render();
  return () => scope.clearAll();
}
