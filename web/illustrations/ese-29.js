import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const W = 720;
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const span = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const EXPERIMENTS = {
  dice: { label: "Két kocka összege", outcomes: span(1, 6).flatMap((a) => span(1, 6).map((b) => a + b)) },
  coins: { label: "Fejek száma 4 érmedobásból", outcomes: span(0, 15).map((mask) => span(0, 3).filter((bit) => (mask >> bit) & 1).length) },
  urn: {
    label: "Piros golyók száma 2 húzásból (3 piros, 2 kék, visszatevés nélkül)",
    outcomes: (() => { const urn = [1, 1, 1, 0, 0], out = []; urn.forEach((x, i) => urn.forEach((y, j) => { if (i !== j) out.push(x + y); })); return out; })(),
  },
};
const GAMES = {
  wheel: { label: "Szerencsekerék", price: 300, outcomes: [[0, 45], [200, 30], [500, 15], [1000, 8], [2000, 2]] },
  ticket: { label: "Sorsjegy (1000 db)", price: 200, outcomes: [[0, 874], [200, 100], [1000, 20], [5000, 5], [50000, 1]] },
};
const TIERS = ["var(--line-strong)", PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.pink];
const money = (v) => `${v < 0 ? "−" : ""}${Math.abs(Math.round(v * 100) / 100).toLocaleString("hu-HU")} Ft`;

function frac(top, bottom) {
  const element = make("span", "il-frac");
  const t = make("span", "", String(top)), b = make("span", "", String(bottom));
  element.append(t, b);
  return element;
}
const distributionOf = (experiment) => {
  const counts = new Map();
  experiment.outcomes.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  return { total: experiment.outcomes.length, rows: [...counts.entries()].sort((a, b) => a[0] - b[0]) };
};

export function mount(root) {
  const scope = createScope();
  root.append(lead("Sok kísérlet eredménye egy szám: egy összeg, egy darabszám, egy nyeremény. Az eloszlás megmondja, hogy melyik számot mekkora valószínűséggel kapjuk. A valószínűségek összege mindig 1, mert valamelyik érték biztosan bekövetkezik."));

  // ---------------- Distribution ----------------
  let key = "dice", samples = {}, sampleTotal = 0;
  const dist = card("Válassz kísérletet");
  const picker = controls();
  const chart = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 260`, role: "img", "aria-label": "A diszkrét eloszlás oszlopdiagramja" });
  const info = make("span", "il-muted");
  const sumLine = make("div", "il-formula");
  const table = make("table", "il-table");
  let expectedShown = false;
  dist.append(picker, chart, controls(make("b", "", "Próbáljuk ki:"), button("1 minta", () => drawSamples(1)), button("100 minta", () => drawSamples(100)), button("2000 minta", () => drawSamples(2000)), button("Nullázás", resetDist, { ghost: true }), info),
    make("p", "il-muted", "A narancs jel az oszlopon a megfigyelt relatív gyakoriság. Sok mintánál az oszlopok tetejére áll. A narancs függőleges vonal a mintaátlag, ami sok mintánál a zöld vonalra, a várható értékre áll be."), sumLine, table);

  function renderPicker() {
    picker.replaceChildren(...Object.entries(EXPERIMENTS).map(([id, item]) => toggle(item.label, id === key, () => { key = id; resetDist(); playExpected(); })));
  }

  function renderDist() {
    const { total, rows } = distributionOf(EXPERIMENTS[key]);
    const maxCount = Math.max(...rows.map(([, c]) => c)) * 1.15, left = 40, right = W - 20, base = 200, top = 18, bw = (right - left) / rows.length;
    const y = (count) => base - (count / maxCount) * (base - top);
    chart.replaceChildren();
    svg("line", { x1: left, x2: right, y1: base, y2: base, class: "axis" }, chart);
    rows.forEach(([value, count], i) => {
      const x = left + i * bw;
      svg("rect", { x: x + 6, y: y(count), width: bw - 12, height: base - y(count), rx: 4, style: `fill:${PALETTE.blue};opacity:.6` }, chart);
      svg("text", { x: x + bw / 2, y: base + 17, "text-anchor": "middle", text: String(value), style: "font-weight:700" }, chart);
      svg("text", { x: x + bw / 2, y: base + 33, "text-anchor": "middle", text: `${count}/${total}`, style: "font-size:11px" }, chart);
      if (sampleTotal) {
        const observed = ((samples[value] ?? 0) / sampleTotal) * total;
        svg("line", { x1: x + 3, x2: x + bw - 3, y1: y(observed), y2: y(observed), style: `stroke:${PALETTE.amber};stroke-width:4` }, chart);
      }
    });
    const xOf = (mean) => left + (mean - rows[0][0] + 0.5) * bw;
    if (expectedShown) {
      const expected = rows.reduce((s, [v, c]) => s + v * c, 0) / total;
      svg("line", { x1: xOf(expected), x2: xOf(expected), y1: top - 6, y2: base, style: `stroke:${PALETTE.green};stroke-width:2.5;stroke-dasharray:6 5` }, chart);
      svg("text", { x: xOf(expected) + 6, y: top + 4, text: `E(X) = ${formatNumber(expected)}`, style: `fill:${PALETTE.green};font-weight:700` }, chart);
    }
    if (sampleTotal) {
      const mean = rows.reduce((s, [v]) => s + v * (samples[v] ?? 0), 0) / sampleTotal;
      svg("line", { x1: xOf(mean), x2: xOf(mean), y1: top + 10, y2: base, style: `stroke:${PALETTE.amber};stroke-width:2.5` }, chart);
      svg("text", { x: xOf(mean) + 6, y: top + 24, text: `átlag ${formatNumber(mean)}`, style: `fill:${PALETTE.amber};font-weight:700;font-size:12px` }, chart);
      info.textContent = `${sampleTotal} minta`;
    } else info.textContent = "";
    sumLine.replaceChildren(`Σ P = ${rows.map(([, c]) => `${c}/${total}`).join(" + ")} = `, make("b", "", `${total}/${total} = 1`));
    const head = make("tr");
    head.append(make("th", "", "érték"), make("th", "", "valószínűség"), make("th", "", "tizedes"), make("th", "", "kísérlet"));
    table.replaceChildren(head, ...rows.map(([value, count]) => {
      const tr = make("tr");
      tr.append(make("th", "", String(value)), make("td", "", `${count}/${total}`), make("td", "", formatNumber(count / total)), make("td", "", sampleTotal ? `${formatNumber(((samples[value] ?? 0) / sampleTotal) * 100, 1)} %` : "–"));
      return tr;
    }));
  }
  function drawSamples(times) {
    const { outcomes } = EXPERIMENTS[key];
    for (let i = 0; i < times; i++) { const v = pick(outcomes); samples[v] = (samples[v] ?? 0) + 1; sampleTotal += 1; }
    renderDist();
  }
  function resetDist() { samples = {}; sampleTotal = 0; expectedShown = false; renderPicker(); renderDist(); }

  // ---------------- Expected value ----------------
  const expectedCard = card("Várható érték");
  const terms = make("div", "il-formula start");
  terms.style.minHeight = "3.4em";
  const evSum = make("div", "il-formula");
  const evNote = make("p", "il-message");
  expectedCard.append(make("p", "", "A várható érték az az átlag, amely körül az eredmények hosszú távon ingadoznak. Minden értéket megszorzunk a valószínűségével, és összeadjuk: E(X) = Σ x · P(x). Az oszlopdiagramon ez az eloszlás súlypontja, ahol az ábra egyensúlyban lenne."),
    controls(button("Számold ki újra", playExpected)), terms, evSum, evNote);

  function playExpected() {
    scope.clearAll();
    expectedShown = false; renderDist();
    const { total, rows } = distributionOf(EXPERIMENTS[key]);
    terms.replaceChildren(); evSum.replaceChildren(); evNote.textContent = "";
    let running = 0, i = 0;
    const step = () => {
      if (i < rows.length) {
        const [value, count] = rows[i];
        terms.append(make("span", "", `${i ? "  +  " : ""}${value} · ${count}/${total}`));
        running += value * count; i += 1;
        evSum.replaceChildren(`eddig: ${running}/${total} = ${formatNumber(running / total)}`);
        scope.timeout(step, rows.length > 8 ? 220 : 380);
        return;
      }
      expectedShown = true; renderDist();
      evSum.replaceChildren("E(X) = ", frac(running, total), " = ", make("b", "", formatNumber(running / total)));
      evNote.textContent = `A zöld szaggatott vonal az eloszlás súlypontja: E(X) = ${formatNumber(running / total)}. Ez nem feltétlenül lehetséges érték, de hosszú távon ennyi lesz az átlag.`;
    };
    scope.timeout(step, 300);
  }

  // ---------------- Games of chance ----------------
  let gameKey = "wheel", price = 300, plays = 0, spent = 0, won = 0, series = [], gameCounts = [], rotation = 0;
  const game = card("Szerencsejáték: mennyit ér egy játék?");
  const gamePicker = controls();
  const priceSlider = range({ label: "Egy játék ára (Ft):", min: 50, max: 600, step: 10, value: price, format: String, onInput: (v) => { price = v; resetPlays(); } });
  const gameLayout = make("div");
  gameLayout.style.cssText = "display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start";
  const visual = svg("svg", { viewBox: "-115 -125 230 240", role: "img", "aria-label": "A játék nyereményei", style: "flex:1 1 220px;max-width:300px;display:block" });
  const gameTable = make("table", "il-table");
  gameTable.style.flex = "1 1 300px";
  gameLayout.append(visual, gameTable);
  const gameFormula = make("div", "il-formula start");
  const gameResult = make("p", "il-message");
  const gameChart = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 210`, role: "img", "aria-label": "Az átlagos nettó nyereség alakulása" });
  const gameStats = make("p", "il-muted");
  game.append(make("p", "", "A várható érték legjobb példája a szerencsejáték. Egy játék várható nyereménye a nyeremények valószínűséggel súlyozott átlaga. Ha ez kisebb, mint az ár, a játékos hosszú távon veszít."),
    gamePicker, controls(priceSlider.element, button("Tisztességes ár", () => { price = Math.min(600, Math.max(50, Math.round(expectedPrize() / 10) * 10)); priceSlider.set(price); resetPlays(); }, { ghost: true })),
    gameLayout, gameFormula,
    controls(button("Játék", () => playOnce()), button("100 játék", playBatch), button("5000 játék", () => { for (let i = 0; i < 5000; i++) record(pickOutcome()); gameResult.textContent = ""; renderGame(); }), button("Nullázás", resetPlays, { ghost: true })),
    gameResult, gameChart, gameStats,
    make("p", "il-muted", "A zöld szaggatott vonal az elméleti várható nettó nyereség játékonként, a kék vonal az eddigi tényleges átlag. Kevés játéknál a szerencse dönt, sok játéknál az átlag a várható értékhez közelít."));

  const outcomes = () => GAMES[gameKey].outcomes;
  const totalWeight = () => outcomes().reduce((s, [, w]) => s + w, 0);
  const expectedPrize = () => outcomes().reduce((s, [p, w]) => s + p * w, 0) / totalWeight();
  const polar = (angle, r) => [r * Math.sin((angle * Math.PI) / 180), -r * Math.cos((angle * Math.PI) / 180)];
  const bounds = () => { let start = 0; return outcomes().map(([, w]) => { const size = (w / totalWeight()) * 360, b = [start, start + size]; start += size; return b; }); };
  let wheelGroup = null;

  function buildVisual() {
    visual.replaceChildren();
    if (gameKey === "wheel") {
      wheelGroup = svg("g", { style: `transition:transform 1s cubic-bezier(.15,.7,.15,1);transform:rotate(${rotation}deg)` }, visual);
      bounds().forEach(([a0, a1], i) => {
        const [x0, y0] = polar(a0, 100), [x1, y1] = polar(a1, 100);
        svg("path", { d: `M0,0 L${x0},${y0} A100,100 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1} Z`, style: `fill:${TIERS[i]};stroke:var(--bg);stroke-width:2` }, wheelGroup);
        if (a1 - a0 > 20) { const [tx, ty] = polar((a0 + a1) / 2, 66); svg("text", { x: tx, y: ty, "text-anchor": "middle", "dominant-baseline": "middle", text: String(outcomes()[i][0]), style: "fill:#fff;font-weight:800;font-size:13px" }, wheelGroup); }
      });
      svg("circle", { r: 9, style: "fill:var(--bg);stroke:var(--line-strong)" }, visual);
      svg("path", { d: "M-9,-112 L9,-112 L0,-94 Z", style: "fill:var(--accent)" }, visual);
    } else {
      wheelGroup = null;
      let y = -105;
      svg("text", { x: -110, y: -112, text: "1000 sorsjegy (a sáv hossza az esélyükkel arányos)", style: "font-size:8px;fill:var(--dim)" }, visual);
      outcomes().forEach(([prize, weight], i) => {
        svg("rect", { x: -110, y, width: Math.max(weight / totalWeight() * 220, 2), height: 16, rx: 3, style: `fill:${TIERS[i]};opacity:${prize ? 1 : 0.4}` }, visual);
        svg("text", { x: -110, y: y + 28, text: `${prize ? money(prize) : "nincs nyeremény"}: ${weight} db`, style: "font-size:10px" }, visual);
        y += 36;
      });
    }
  }

  function pickOutcome() {
    let roll = Math.random() * totalWeight();
    for (let i = 0; i < outcomes().length; i++) { roll -= outcomes()[i][1]; if (roll < 0) return i; }
    return outcomes().length - 1;
  }
  function record(index) { plays += 1; spent += price; won += outcomes()[index][0]; gameCounts[index] = (gameCounts[index] ?? 0) + 1; series.push((won - spent) / plays); }
  function playOnce(fast = false) {
    const index = pickOutcome(), prize = outcomes()[index][0];
    if (wheelGroup) {
      const [a0, a1] = bounds()[index], target = a0 + (a1 - a0) * (0.15 + Math.random() * 0.7);
      rotation = Math.floor(rotation / 360) * 360 + 360 * (fast ? 1 : 3) + (360 - target);
      wheelGroup.style.transitionDuration = fast ? ".12s" : "1s";
      wheelGroup.style.transform = `rotate(${rotation}deg)`;
    }
    record(index);
    gameResult.textContent = `Nyeremény: ${money(prize)} (ár: ${money(price)}, nettó: ${money(prize - price)})`;
    renderGame();
  }
  function playBatch() {
    let left = 100;
    scope.interval(() => { if (left-- > 0) playOnce(true); }, 15);
  }
  function resetPlays() { scope.clearAll(); plays = 0; spent = 0; won = 0; series = []; gameCounts = []; gameResult.textContent = ""; renderGame(); }

  function renderGame() {
    gamePicker.replaceChildren(...Object.entries(GAMES).map(([id, item]) => toggle(item.label, id === gameKey, () => { gameKey = id; price = item.price; priceSlider.set(price); buildVisual(); resetPlays(); })));
    const total = totalWeight(), expected = expectedPrize(), net = expected - price;
    const head = make("tr");
    head.append(make("th", "", "nyeremény"), make("th", "", "valószínűség"), make("th", "", "nyeremény · P"), make("th", "", "kísérlet"));
    gameTable.replaceChildren(head, ...outcomes().map(([prize, weight], i) => {
      const tr = make("tr"), first = make("th", "", money(prize));
      first.style.color = TIERS[i];
      tr.append(first, make("td", "", `${weight}/${total}`), make("td", "", `${formatNumber((prize * weight) / total, 2)} Ft`), make("td", "", plays ? `${formatNumber(((gameCounts[i] ?? 0) / plays) * 100, 1)} %` : "–"));
      return tr;
    }));
    gameFormula.replaceChildren(`E(nyeremény) = ${outcomes().filter(([p]) => p).map(([p, w]) => `${p} · ${w}/${total}`).join(" + ")} = `, make("b", "", money(expected)), make("br"),
      `E(nettó) = ${money(expected)} − ${money(price)} = `, (() => { const b = make("b", "", money(net)); b.style.color = net >= 0 ? "var(--accent)" : "var(--warn)"; return b; })(), " játékonként");
    gameStats.textContent = plays ? `${plays} játék: befizetve ${money(spent)}, kifizetve ${money(won)}, egyenleg ${money(won - spent)}; átlag ${money((won - spent) / plays)} játékonként (várható: ${money(net)}).` : "";
    renderGameChart(net);
  }

  function renderGameChart(target) {
    gameChart.replaceChildren();
    const left = 70, right = W - 20, top = 14, bottom = 185, half = Math.max(price, 150) * 1.1;
    const y = (v) => bottom - ((Math.min(Math.max(v, target - half), target + half) - (target - half)) / (2 * half)) * (bottom - top);
    [0, target].forEach((v) => svg("line", { x1: left, x2: right, y1: y(v), y2: y(v), class: "grid" }, gameChart));
    svg("text", { x: left - 6, y: y(0) + 4, "text-anchor": "end", text: "0 Ft", style: "font-size:11px;fill:var(--dim)" }, gameChart);
    svg("line", { x1: left, x2: right, y1: y(target), y2: y(target), style: `stroke:${PALETTE.green};stroke-width:2;stroke-dasharray:6 5` }, gameChart);
    svg("text", { x: right, y: y(target) - 6, "text-anchor": "end", text: `E = ${Math.round(target)} Ft`, style: `fill:${PALETTE.green};font-weight:700` }, gameChart);
    if (series.length) {
      const count = Math.max(30, series.length), step = Math.max(1, Math.floor(series.length / 600));
      const pts = series.map((v, i) => [i, v]).filter(([i]) => i % step === 0 || i === series.length - 1);
      svg("polyline", { points: pts.map(([i, v]) => `${left + (i / (count - 1)) * (right - left)},${y(v)}`).join(" "), fill: "none", style: `stroke:${PALETTE.blue};stroke-width:2.5;stroke-linejoin:round` }, gameChart);
    }
    svg("text", { x: right, y: 205, "text-anchor": "end", text: "játékok száma →", style: "font-size:12px;fill:var(--dim)" }, gameChart);
  }

  root.append(dist, expectedCard, game, keyIdea("az eloszlás táblázata (érték és valószínűség) és az oszlopdiagram ugyanazt mondja el. Ellenőrzés: minden valószínűség 0 és 1 között van, és az összegük pontosan 1. A várható érték az értékek valószínűséggel súlyozott átlaga."));
  resetDist(); playExpected();
  buildVisual(); renderGame();
  return () => scope.clearAll();
}
