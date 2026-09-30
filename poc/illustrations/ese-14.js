import { card, keyIdea, lead, make, PALETTE, svg } from "./kit.js";

const DAYS = ["hé", "ke", "sze", "csü", "pé"];
const SETS = [
  { id: "A", type: "bar", values: [4, 9, 6, 2, 8], color: PALETTE.blue },
  { id: "B", type: "line", values: [3, 4, 7, 9, 10], color: PALETTE.green },
  { id: "C", type: "bar", values: [7, 7, 3, 5, 1], color: PALETTE.amber },
];
const MONTHS = ["jan", "feb", "már", "ápr", "máj", "jún"];
const MONTH_NAMES = ["január", "február", "március", "április", "május", "június"];
const RAIN = [40, 32, 55, 70, 48, 20];
const READ_QUESTIONS = [
  { text: "Melyik hónapban esett a legtöbb csapadék?", options: ["február", "március", "április"], answer: 2, why: "Az április oszlopa a legmagasabb: 70 mm." },
  { text: "Hány mm-rel esett több áprilisban, mint márciusban?", options: ["15", "25", "70"], answer: 0, why: "70 − 55 = 15 mm." },
  { text: "Hány hónapban esett 40 mm-nél több?", options: ["2", "3", "4"], answer: 1, why: "Március (55), április (70) és május (48). A január pontosan 40, az nem több 40-nél." },
];
const STATEMENTS = [
  { text: "A legkevesebb csapadék júniusban esett.", truth: true, why: "Igaz: júniusban 20 mm esett, ez a legalacsonyabb oszlop." },
  { text: "Februárban kétszer annyi csapadék esett, mint júniusban.", truth: false, why: "Hamis: februárban 32 mm, júniusban 20 mm esett, a kétszerese 40 mm lenne." },
  { text: "Januárban és májusban együtt 88 mm csapadék esett.", truth: true, why: "Igaz: 40 + 48 = 88." },
  { text: "A csapadék mennyisége hónapról hónapra folyamatosan nőtt.", truth: false, why: "Hamis: januárról februárra és májusról júniusra csökkent." },
];

const shuffle = (list) => { const copy = list.slice(); for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };

// Draws axes and bars or a polyline into a fixed viewBox; returns the bar elements.
function drawChart(parent, { width, height, labels, values, top, type = "bar", color, tooltip }) {
  const left = 34, right = 10, upper = 14, lower = 26;
  const plotWidth = width - left - right, plotHeight = height - upper - lower;
  const y = (v) => upper + plotHeight * (1 - v / top);
  const x = (i) => left + (i + 0.5) * (plotWidth / labels.length);
  for (let t = 0; t <= top; t += top / 4) {
    svg("line", { x1: left, x2: width - right, y1: y(t), y2: y(t), class: "grid" }, parent);
    svg("text", { x: left - 6, y: y(t) + 4, "text-anchor": "end", text: String(t), style: "fill:var(--dim);font-size:11px" }, parent);
  }
  svg("line", { x1: left, x2: width - right, y1: y(0), y2: y(0), class: "axis" }, parent);
  labels.forEach((label, i) => svg("text", { x: x(i), y: height - 8, "text-anchor": "middle", text: label, style: "font-size:11px" }, parent));
  if (type === "line") svg("polyline", { points: values.map((v, i) => `${x(i)},${y(v)}`).join(" "), fill: "none", stroke: color, "stroke-width": 3, "stroke-linejoin": "round" }, parent);
  const marks = [];
  values.forEach((value, i) => {
    const band = plotWidth / labels.length;
    const mark = type === "line"
      ? svg("circle", { cx: x(i), cy: y(value), r: 5, fill: color }, parent)
      : svg("rect", { x: x(i) - band * 0.3, y: y(value), width: band * 0.6, height: y(0) - y(value), rx: 3, fill: color }, parent);
    marks.push(mark);
    if (tooltip) {
      mark.setAttribute("tabindex", "0");
      mark.style.cursor = "pointer";
      const show = () => { tooltip.show(i, x(i), y(value)); marks.forEach((m) => { m.style.opacity = m === mark ? "1" : "0.55"; }); };
      const hide = () => { tooltip.hide(); marks.forEach((m) => { m.style.opacity = "1"; }); };
      mark.addEventListener("pointerenter", show); mark.addEventListener("focus", show);
      mark.addEventListener("pointerleave", hide); mark.addEventListener("blur", hide);
    }
  });
  return marks;
}

export function mount(root) {
  root.append(lead("A diagram azért jó, mert egy pillantással sok számot mutat. De két dolgot meg kell tanulni: pontosan leolvasni az értékeket, és eldönteni, hogy egy állítás következik-e belőle. Gyakorold mindkettőt!"));

  // ---------- 1. matching ----------
  const matchCard = card("1. Melyik táblázat melyik diagramhoz tartozik?");
  const chartRow = make("div"), tableRow = make("div");
  const gridStyle = "display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:10px 0";
  chartRow.style.cssText = tableRow.style.cssText = gridStyle;
  const matchMessage = make("p", "il-message");
  matchCard.append(make("p", "il-muted", "Kattints egy diagramra, majd arra a táblázatra, amelyik ugyanazokat az adatokat tartalmazza (vagy fordítva)."), chartRow, tableRow, matchMessage);

  const tableOrder = shuffle(SETS);
  const paired = new Set();
  let pickedChart = null, pickedTable = null;
  const chartBoxes = {}, tableBoxes = {};
  SETS.forEach((set) => {
    const box = make("div"); box.style.cssText = "cursor:pointer;border:2px solid var(--line);border-radius:12px;padding:6px;text-align:center";
    box.append(make("b", "", `${set.id} diagram`));
    const figure = svg("svg", { class: "il-svg", viewBox: "0 0 240 150", role: "img", "aria-label": `${set.id} diagram` }, box);
    drawChart(figure, { width: 240, height: 150, labels: DAYS, values: set.values, top: 12, type: set.type, color: set.color });
    box.addEventListener("click", () => { if (!paired.has(set.id)) { pickedChart = set.id; attempt(); } });
    chartBoxes[set.id] = box; chartRow.append(box);
  });
  tableOrder.forEach((set, index) => {
    const box = make("div"); box.style.cssText = "cursor:pointer;border:2px solid var(--line);border-radius:12px;padding:6px";
    box.append(make("b", "", `${index + 1}. táblázat`));
    const table = make("table", "il-table");
    const head = make("tr"), row = make("tr");
    DAYS.forEach((day, i) => { head.append(make("th", "", day)); row.append(make("td", "", String(set.values[i]))); });
    [head, row].forEach((tr) => [...tr.children].forEach((c) => { c.style.width = "4ch"; c.style.textAlign = "center"; }));
    table.append(head, row);
    box.append(table);
    box.addEventListener("click", () => { if (!paired.has(set.id)) { pickedTable = set.id; attempt(); } });
    tableBoxes[set.id] = box; tableRow.append(box);
  });
  const mark = (box, color) => { box.style.borderColor = color; };
  function attempt() {
    SETS.forEach((set) => { if (!paired.has(set.id)) { mark(chartBoxes[set.id], pickedChart === set.id ? "var(--accent)" : "var(--line)"); mark(tableBoxes[set.id], pickedTable === set.id ? "var(--accent)" : "var(--line)"); } });
    matchMessage.className = "il-message";
    if (pickedChart === null || pickedTable === null) { matchMessage.textContent = "Most válaszd ki a párját is."; return; }
    if (pickedChart === pickedTable) {
      paired.add(pickedChart);
      const set = SETS.find((s) => s.id === pickedChart);
      mark(chartBoxes[pickedChart], set.color); mark(tableBoxes[pickedChart], set.color);
      matchMessage.className = "il-message good";
      matchMessage.textContent = paired.size === SETS.length ? "Mind a három pár megvan!" : "Jó pár! Folytasd a többivel.";
    } else {
      matchMessage.className = "il-message warn";
      matchMessage.textContent = "Ez nem ugyanaz az adatsor. Ellenőrizz egy-két értéket: például melyik naphoz tartozik a legmagasabb érték?";
      SETS.forEach((set) => { if (!paired.has(set.id)) { mark(chartBoxes[set.id], "var(--line)"); mark(tableBoxes[set.id], "var(--line)"); } });
    }
    pickedChart = null; pickedTable = null;
  }
  matchMessage.textContent = "Kattints egy diagramra vagy egy táblázatra.";

  // ---------- 2. reading values ----------
  const readCard = card("2. Olvasd le az értékeket");
  const W = 640, H = 240;
  const rainFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Havi csapadék oszlopdiagram" });
  readCard.append(make("p", "il-muted", "Havi csapadék (mm). Vidd az egeret az oszlopok fölé, hogy lásd a pontos értéket, és válaszolj a kérdésekre."), rainFigure);
  const tip = svg("g", { style: "pointer-events:none;opacity:0" });
  const tipBox = svg("rect", { width: 120, height: 26, rx: 8, fill: "var(--surface)", stroke: "var(--accent)" }, tip);
  const tipText = svg("text", { x: 60, y: 18, "text-anchor": "middle", style: "fill:var(--fg);font-weight:700" }, tip);
  drawChart(rainFigure, {
    width: W, height: H, labels: MONTHS, values: RAIN, top: 80, color: PALETTE.blue,
    tooltip: {
      show(i, x, y) { tipText.textContent = `${MONTH_NAMES[i]}: ${RAIN[i]} mm`; tipBox.setAttribute("x", 0); tip.setAttribute("transform", `translate(${Math.min(W - 130, Math.max(40, x - 60))},${Math.max(2, y - 40)})`); tip.style.opacity = "1"; },
      hide() { tip.style.opacity = "0"; },
    },
  });
  rainFigure.append(tip);
  READ_QUESTIONS.forEach((item) => {
    const row = make("div"); row.style.margin = "10px 0";
    const feedback = make("div", "il-muted"); feedback.style.minHeight = "1.6em";
    const buttons = make("div", "il-controls");
    item.options.forEach((option, i) => {
      const b = make("button", "il-toggle", option); b.type = "button";
      b.addEventListener("click", () => {
        const right = i === item.answer;
        feedback.style.color = right ? "var(--accent)" : "var(--warn)";
        feedback.textContent = `${right ? "Helyes! " : "Nem ez. "}${item.why}`;
        [...buttons.children].forEach((x, j) => x.setAttribute("aria-pressed", String(j === i)));
      });
      buttons.append(b);
    });
    row.append(make("div", "", item.text), buttons, feedback);
    readCard.append(row);
  });

  // ---------- 3. true or false ----------
  const judgeCard = card("3. Igaz vagy hamis? (ugyanerről a diagramról)");
  let score = 0, answered = 0;
  const scoreLine = make("p", "il-muted");
  STATEMENTS.forEach((item) => {
    const row = make("div"); row.style.cssText = "margin:10px 0;padding-bottom:8px;border-bottom:1px dashed var(--line)";
    const feedback = make("div", "il-muted"); feedback.style.minHeight = "1.6em";
    const buttons = make("div", "il-controls");
    let done = false;
    [["Igaz", true], ["Hamis", false]].forEach(([label, value]) => {
      const b = make("button", "il-toggle", label); b.type = "button";
      b.addEventListener("click", () => {
        if (done) return;
        done = true; answered += 1;
        const right = value === item.truth;
        if (right) score += 1;
        b.setAttribute("aria-pressed", "true");
        feedback.style.color = right ? "var(--accent)" : "var(--warn)";
        feedback.textContent = `${right ? "Helyes. " : "Nem egészen. "}${item.why}`;
        scoreLine.textContent = `${score} / ${answered} helyes`;
      });
      buttons.append(b);
    });
    row.append(make("div", "", item.text), buttons, feedback);
    judgeCard.append(row);
  });
  judgeCard.append(scoreLine);

  root.append(matchCard, readCard, judgeCard, keyIdea("olvass pontosan: nézd a tengelyeket és a mértékegységet, és számolj a leolvasott értékekkel. Egy következtetés csak akkor igaz, ha az összes adat igazolja, nem csak az, ami első ránézésre látszik."));
  return () => {};
}
