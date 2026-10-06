import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

const SIZE = 360, MAX_DOTS = 1500, PER_FRAME = 4;

export function mount(root) {
  const scope = createScope();
  let mode = "exclusive", a = 0.4, b = 0.3, running = true, counts, frameId = null;
  const resetCounts = () => { counts = { total: 0, a: 0, b: 0, both: 0 }; };
  resetCounts();

  root.append(lead("A négyzet pontjai a lehetséges kimenetelek, az A és a B esemény pedig a négyzet egy-egy része. A pontok véletlenszerűen esnek a négyzetbe, és mi azt nézzük, hányszor esnek az A-ba, a B-be vagy mindkettőbe. Két különböző dolgot vizsgálunk: mikor zárják ki egymást az események, és mikor függetlenek."));

  const main = card("Két esemény a négyzetben");
  const modeControls = controls();
  const sliderA = range({ label: "P(A):", min: 5, max: 95, step: 5, value: a * 100, format: (n) => `${n} %`, onInput: (n) => { a = n / 100; if (mode === "exclusive" && a + b > 1) { b = Math.round((1 - a) * 100) / 100; sliderB.set(b * 100); } restart(); } });
  const sliderB = range({ label: "P(B):", min: 5, max: 95, step: 5, value: b * 100, format: (n) => `${n} %`, onInput: (n) => { b = n / 100; if (mode === "exclusive" && a + b > 1) { a = Math.round((1 - b) * 100) / 100; sliderA.set(a * 100); } restart(); } });
  const layout = make("div");
  layout.style.cssText = "display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start";
  const left = make("div"), right = make("div");
  left.style.cssText = "flex:1 1 300px;max-width:380px";
  right.style.cssText = "flex:1 1 280px;min-width:0";
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${SIZE} ${SIZE}`, role: "img", "aria-label": "A négyzet két eseménnyel és véletlen pontokkal" });
  const regions = svg("g", {}, figure), dots = svg("g", {}, figure), labels = svg("g", {}, figure);
  const pauseButton = button("Szünet", () => { running = !running; pauseButton.textContent = running ? "Szünet" : "Folytatás"; });
  left.append(figure, controls(pauseButton, button("Nullázás", restart, { ghost: true })));
  const explain = make("p", "");
  explain.style.minHeight = "9em";
  const table = make("table", "il-table");
  right.append(explain, table);
  layout.append(left, right);
  main.append(modeControls, controls(sliderA.element, sliderB.element), layout);

  const exclusiveBox = make("div", "il-key");
  exclusiveBox.append(make("b", "", "Egymást kizáró: "), "nem következhetnek be egyszerre, vagyis A ∩ B = ∅.", make("div", "il-formula", "P(A ∪ B) = P(A) + P(B)"));
  const independentBox = make("div", "il-key");
  independentBox.append(make("b", "", "Független: "), "az egyik bekövetkezése nem változtatja meg a másik esélyét.", make("div", "il-formula", "P(A ∩ B) = P(A) · P(B)"));
  const trap = make("div", "il-key");
  trap.append(make("b", "", "Gyakori csapda: "), "a kizáró és a független nem ugyanaz! Ha A és B kizárják egymást (és lehetségesek), akkor éppen függők: ha tudom, hogy A bekövetkezett, akkor B biztosan nem.");

  root.append(main, exclusiveBox, independentBox, trap, keyIdea("kizáró eseményeknél a valószínűségeket összeadjuk, független eseményeknél összeszorozzuk. A kettő általában nem áll fenn egyszerre."));

  const inA = (u) => u < a;
  const inB = (u, v) => (mode === "exclusive" ? u > 1 - b : v < b);

  function drawRegions() {
    regions.replaceChildren(); labels.replaceChildren();
    svg("rect", { x: 0, y: 0, width: a * SIZE, height: SIZE, style: `fill:${PALETTE.blue};fill-opacity:.2` }, regions);
    if (mode === "exclusive") svg("rect", { x: (1 - b) * SIZE, y: 0, width: b * SIZE, height: SIZE, style: `fill:${PALETTE.amber};fill-opacity:.25` }, regions);
    else svg("rect", { x: 0, y: (1 - b) * SIZE, width: SIZE, height: b * SIZE, style: `fill:${PALETTE.amber};fill-opacity:.25` }, regions);
    svg("text", { x: 10, y: 24, text: "A", style: `fill:${PALETTE.blue};font-size:20px;font-weight:800` }, labels);
    svg("text", { x: SIZE - 10, y: mode === "exclusive" ? 24 : SIZE - 10, "text-anchor": "end", text: "B", style: `fill:${PALETTE.amber};font-size:20px;font-weight:800` }, labels);
  }

  function addDot() {
    const u = Math.random(), v = Math.random(), isA = inA(u), isB = inB(u, v);
    counts.total += 1; if (isA) counts.a += 1; if (isB) counts.b += 1; if (isA && isB) counts.both += 1;
    const color = isA && isB ? PALETTE.green : isA ? PALETTE.blue : isB ? PALETTE.amber : "var(--dim)";
    svg("circle", { cx: u * SIZE, cy: (1 - v) * SIZE, r: 2.8, style: `fill:${color}` }, dots);
  }

  function renderTable() {
    const pct = (x) => `${formatNumber(x * 100, 1)} %`, n = counts.total || 1, both = mode === "exclusive" ? 0 : a * b;
    const rows = [["P(A)", a, counts.a / n], ["P(B)", b, counts.b / n], ["P(A ∩ B)", both, counts.both / n], ["P(A ∪ B)", a + b - both, (counts.a + counts.b - counts.both) / n]];
    const head = make("tr");
    head.append(make("th", "", ""), make("th", "", "elmélet"), make("th", "", `kísérlet (${counts.total})`));
    table.replaceChildren(head, ...rows.map(([name, theory, observed]) => {
      const tr = make("tr");
      tr.append(make("th", "", name), make("td", "", pct(theory)), make("td", "", counts.total ? pct(observed) : "–"));
      return tr;
    }));
  }

  function explainText() {
    explain.replaceChildren();
    if (mode === "exclusive") {
      explain.append("A és B nem fedik át egymást: ha egy pont A-ban van, B-ben biztosan nincs. Nincs közös rész, ezért az unió valószínűsége összeadás: ", make("b", "", `${formatNumber(a)} + ${formatNumber(b)} = ${formatNumber(a + b)}`), ".");
    } else {
      explain.append("A egy függőleges, B egy vízszintes sáv. A metszetük a kis téglalap, területe (szélesség · magasság): ", `${formatNumber(a)} · ${formatNumber(b)} = `, make("b", "", formatNumber(a * b)), ". Az A-ban lévő pontok között is éppen P(B) a B-ben lévők aránya, ezért a két esemény független. Az unió kiszámításakor a közös részt egyszer le kell vonni.");
    }
  }

  function loop() {
    if (running) {
      for (let i = 0; i < PER_FRAME && counts.total < MAX_DOTS; i++) addDot();
      if (counts.total % 20 < PER_FRAME || counts.total >= MAX_DOTS) renderTable();
    }
    frameId = scope.frame(loop);
  }

  function renderModes() {
    modeControls.replaceChildren(toggle("Egymást kizáró", mode === "exclusive", () => setMode("exclusive")), toggle("Független", mode === "independent", () => setMode("independent")));
  }

  function setMode(next) {
    mode = next;
    if (mode === "exclusive" && a + b > 1) { b = Math.round((1 - a) * 100) / 100; sliderB.set(b * 100); }
    renderModes(); restart();
  }

  function restart() {
    dots.replaceChildren();
    resetCounts();
    drawRegions(); explainText(); renderTable();
  }

  renderModes(); restart(); loop();
  return () => scope.clearAll();
}
