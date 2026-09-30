import { button, card, controls, createScope, equation, formatNumber, fraction, keyIdea, lead, make, PALETTE, rich, slot, stepper, svg, toggle } from "./kit.js";

const MARBLES = {
  red: { name: "piros", color: PALETTE.red },
  blue: { name: "kék", color: PALETTE.blue },
  green: { name: "zöld", color: PALETTE.green },
};
const CHART = { width: 720, height: 240, left: 40, right: 12, top: 16, bottom: 28 };

export function mount(root) {
  const scope = createScope();
  const counts = { red: 3, blue: 2, green: 1 };
  const favorable = new Set(["red"]);
  let draws = 0, hits = 0, history = [], runTimer = null;

  const marbles = () => Object.entries(counts).flatMap(([color, count]) => Array(count).fill(color));
  const theory = () => {
    const all = marbles();
    return all.length ? all.filter((color) => favorable.has(color)).length / all.length : 0;
  };

  root.append(lead("Ha minden golyónak egyforma esélye van, akkor egy esemény valószínűsége az, hogy az összes golyó hányad része jó nekünk. De honnan tudjuk, hogy ez a szám tényleg jelent valamit? Húzzunk sokszor, és figyeljük, hogyan viselkedik az arány!"));

  const urn = card("Az urna");
  const countControls = make("div", "il-controls");
  const eventControls = make("div", "il-controls");
  const jar = make("div", "il-jar");
  const formulaLine = make("div");
  urn.append(countControls, eventControls, jar, formulaLine);
  for (const [color, marble] of Object.entries(MARBLES)) {
    countControls.append(stepper({ label: marble.name, min: 0, max: 8, value: counts[color], onChange: (value) => { counts[color] = value; reset(); } }).element);
  }

  const properties = card("A valószínűség tulajdonságai");
  const bar = (label, color) => {
    const row = make("div", "il-bar");
    const track = make("div", "track");
    const fill = make("div", "fill");
    fill.style.background = color;
    const value = make("b");
    track.append(fill);
    row.append(make("span", "", label), track, value);
    properties.append(row);
    return { fill, value };
  };
  properties.append(controls(
    button("Lehetetlen esemény", () => { favorable.clear(); reset(); }, { ghost: true }),
    button("Biztos esemény", () => { Object.keys(MARBLES).forEach((color) => favorable.add(color)); reset(); }, { ghost: true }),
    make("span", "il-muted", "Kattints, és figyeld a sávokat."),
  ));
  const probabilityBar = bar("P(kedvező)", "var(--accent)");
  const complementBar = bar("P(nem kedvező) = 1 − P", PALETTE.amber);
  const facts = make("ul", "il-muted");
  ["Mindig 0 ≤ P ≤ 1. A lehetetlen esemény valószínűsége 0, a biztosé 1.", "Egy esemény és az ellentettje együtt mindent lefed: P + (1 − P) = 1."]
    .forEach((text) => facts.append(make("li", "", text)));
  properties.append(facts);

  const experiment = card("Mi történik, ha sokszor húzunk?");
  const stats = make("span", "il-muted");
  experiment.append(controls(
    button("1 húzás", () => run(1)), button("10 húzás", () => run(10)), button("300 húzás", () => run(300)),
    button("Nullázás", reset, { ghost: true }), stats,
  ));
  const chart = svg("svg", { class: "il-svg", viewBox: `0 0 ${CHART.width} ${CHART.height}`, role: "img", "aria-label": "A relatív gyakoriság alakulása a húzások számának függvényében" }, experiment);
  const plotHeight = CHART.height - CHART.top - CHART.bottom;
  const yOf = (value) => CHART.top + (1 - value) * plotHeight;
  for (const tick of [0, 0.5, 1]) {
    svg("line", { x1: CHART.left, x2: CHART.width - CHART.right, y1: yOf(tick), y2: yOf(tick), class: "grid" }, chart);
    svg("text", { x: CHART.left - 8, y: yOf(tick) + 4, "text-anchor": "end", text: formatNumber(tick), style: "fill:var(--dim);font-size:12px" }, chart);
  }
  svg("text", { x: CHART.width - CHART.right, y: CHART.height - 8, "text-anchor": "end", text: "húzások száma →", style: "fill:var(--dim);font-size:12px" }, chart);
  const theoryLine = svg("line", { x1: CHART.left, x2: CHART.width - CHART.right, style: "stroke:var(--ai);stroke-width:2;stroke-dasharray:6 5" }, chart);
  const observedLine = svg("polyline", { fill: "none", style: "stroke:var(--accent);stroke-width:2.5;stroke-linejoin:round" }, chart);
  experiment.append(make("p", "il-muted", "A zöld vonal a megfigyelt relatív gyakoriság (kedvező húzások / összes húzás), a narancs szaggatott vonal a kiszámolt valószínűség. Kevés húzásnál a zöld vonal nagyon ingadozik, sok húzásnál egyre közelebb marad a narancshoz."));

  root.append(urn, properties, experiment, keyIdea("a valószínűség az a 0 és 1 közötti szám, amely köré a relatív gyakoriság sok kísérlet után beáll. Egyenlő esélyű esetekben ki is számolható: kedvező esetek száma / összes eset száma."));

  function renderEventControls() {
    eventControls.replaceChildren(make("span", "", "Melyik szín számít kedvezőnek?"));
    for (const [color, marble] of Object.entries(MARBLES)) {
      eventControls.append(toggle(marble.name, favorable.has(color), () => {
        if (favorable.has(color)) favorable.delete(color); else favorable.add(color);
        reset();
      }, marble.color));
    }
  }

  function renderUrn() {
    jar.replaceChildren();
    for (const color of marbles()) {
      const marble = make("div", `il-marble ${favorable.has(color) ? "glow" : "dim"}`);
      marble.style.setProperty("--c", MARBLES[color].color);
      jar.append(marble);
    }
    const all = marbles().length, good = marbles().filter((color) => favorable.has(color)).length;
    const p = all ? good / all : 0;
    formulaLine.replaceChildren(all
      ? equation("P(kedvező)", rich(fraction("kedvező", "összes"), " = ", fraction(good, all, { wide: true }), " = ", slot(formatNumber(p), 5, { align: "left" })))
      : make("p", "il-formula", "Tegyél golyókat az urnába!"));
    probabilityBar.fill.style.width = `${p * 100}%`;
    complementBar.fill.style.width = `${(all ? 1 - p : 0) * 100}%`;
    probabilityBar.value.textContent = formatNumber(p);
    complementBar.value.textContent = formatNumber(all ? 1 - p : 0);
  }

  function drawOne(animate) {
    const all = marbles();
    const index = Math.floor(Math.random() * all.length);
    draws += 1;
    if (favorable.has(all[index])) hits += 1;
    history.push(hits / draws);
    if (animate) {
      const marble = jar.children[index];
      marble.classList.add("flash");
      scope.timeout(() => marble.classList.remove("flash"), 220);
    }
  }

  function run(count) {
    if (!marbles().length) return;
    if (runTimer !== null) scope.clearInterval(runTimer);
    let left = count;
    const perTick = count > 20 ? Math.ceil(count / 60) : 1;
    runTimer = scope.interval(() => {
      for (let i = 0; i < perTick && left > 0; i++, left--) drawOne(perTick === 1);
      renderChart();
      if (left <= 0) { scope.clearInterval(runTimer); runTimer = null; }
    }, count > 20 ? 25 : 350);
  }

  function renderChart() {
    stats.textContent = draws ? `${draws} húzás, ebből ${hits} kedvező → ${formatNumber(hits / draws)} (kiszámolva: ${formatNumber(theory())})` : "";
    theoryLine.setAttribute("y1", yOf(theory()));
    theoryLine.setAttribute("y2", yOf(theory()));
    const span = Math.max(30, history.length);
    const plotWidth = CHART.width - CHART.left - CHART.right;
    observedLine.setAttribute("points", history.map((value, i) => `${CHART.left + (i / (span - 1)) * plotWidth},${yOf(value)}`).join(" "));
  }

  function reset() {
    scope.clearAll();
    runTimer = null;
    draws = 0; hits = 0; history = [];
    renderEventControls(); renderUrn(); renderChart();
  }

  reset();
  return () => scope.clearAll();
}
