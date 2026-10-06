import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, stepper, svg, toggle } from "./kit.js";

const DAYS = ["hétfő", "kedd", "szerda", "csütörtök", "péntek"];
const COLORS = [PALETTE.red, PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.violet];
const WIDTH = 640, HEIGHT = 300, LEFT = 46, RIGHT = 20, TOP = 22, BOTTOM = 42;
const TYPES = [["bar", "Oszlopdiagram"], ["pie", "Kördiagram"], ["line", "Vonaldiagram"], ["scatter", "Pontdiagram"]];
const QUESTIONS = [
  { text: "Melyik napon olvastam a legtöbbet?", type: "bar", why: "Az oszlopok magasságát egymás mellett könnyű összehasonlítani, ezért külön kategóriák összevetéséhez az oszlopdiagram a legjobb." },
  { text: "A heti olvasásnak mekkora részét olvastam csütörtökön?", type: "pie", why: "A kördiagram azt mutatja, hogy az egész mekkora részét adja egy-egy kategória. Csak akkor értelmes, ha az adatok összeadva egy egészet adnak." },
  { text: "Hogyan alakult az olvasás a hét során: nőtt vagy csökkent?", type: "line", why: "A vonaldiagram az időbeli változást mutatja: az összekötő vonal emelkedése és süllyedése mutatja a trendet." },
  { text: "Hogyan függ össze két mért érték (pl. alvással töltött idő és dolgozatpontszám)?", type: "scatter", why: "A pontdiagramban minden adat egy pont két mért érték szerint. A pontfelhő alakjából látszik, van-e összefüggés. (Itt a nap sorszáma és az oldalszám szerepel.)" },
];

export function mount(root) {
  const values = [12, 20, 8, 25, 15];
  let type = "bar", question = null;

  root.append(lead("Ugyanazt az adatsort többféle diagramon is megrajzolhatjuk, de nem mindegyik mutatja meg jól azt, amit tudni szeretnénk. Módosítsd az adatokat, váltogasd a diagramtípusokat, és válaszd ki, melyik kérdéshez melyik illik!"));

  const data = card("Adat: egy hét olvasott oldalai");
  const steppers = make("div", "il-controls");
  DAYS.forEach((day, i) => steppers.append(stepper({ label: day, min: 0, max: 30, value: values[i], onChange: (value) => { values[i] = value; render(); } }).element));
  const typeControls = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Diagram az olvasott oldalakról" });
  data.append(steppers, typeControls, figure);

  const which = card("Melyik diagram melyik kérdésre jó?");
  const questionControls = make("div");
  questionControls.style.cssText = "display:flex;flex-direction:column;gap:6px;align-items:flex-start";
  const explanation = make("p", "il-message");
  which.append(questionControls, explanation);
  root.append(data, which, keyIdea("a diagram típusát a kérdés dönti el: összehasonlításra oszlop, részarányra kör, időbeli változásra vonal, két mennyiség kapcsolatára pont. Ugyanazok az adatok rossz típusban megtéveszthetnek."));

  const maxAxis = () => Math.max(10, Math.ceil(Math.max(...values) / 5) * 5);
  const plot = () => ({ width: WIDTH - LEFT - RIGHT, height: HEIGHT - TOP - BOTTOM });
  const xOf = (i, band) => LEFT + (i + 0.5) * (plot().width / DAYS.length) + (band ? 0 : 0);
  const yOf = (value) => TOP + plot().height * (1 - value / maxAxis());

  function axes() {
    const top = maxAxis();
    for (let t = 0; t <= top; t += top / 5) {
      svg("line", { x1: LEFT, x2: WIDTH - RIGHT, y1: yOf(t), y2: yOf(t), class: "grid" }, figure);
      svg("text", { x: LEFT - 8, y: yOf(t) + 4, "text-anchor": "end", text: formatNumber(t), style: "fill:var(--dim);font-size:12px" }, figure);
    }
    svg("line", { x1: LEFT, x2: WIDTH - RIGHT, y1: yOf(0), y2: yOf(0), class: "axis" }, figure);
    DAYS.forEach((day, i) => svg("text", { x: xOf(i), y: HEIGHT - 20, "text-anchor": "middle", text: day }, figure));
    svg("text", { x: LEFT, y: 12, text: "oldal", style: "fill:var(--dim);font-size:12px" }, figure);
  }

  function pieSlice(cx, cy, r, from, to, color) {
    if (to - from >= Math.PI * 2 - 1e-6) return svg("circle", { cx, cy, r, fill: color }, figure);
    const p = (a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    return svg("path", { d: `M${cx},${cy} L${p(from)} A${r},${r} 0 ${to - from > Math.PI ? 1 : 0} 1 ${p(to)} Z`, fill: color, stroke: "var(--input)", "stroke-width": 2 }, figure);
  }

  function render() {
    typeControls.replaceChildren(...TYPES.map(([id, label]) => toggle(label, type === id, () => { type = id; render(); })));
    figure.replaceChildren();
    const total = values.reduce((a, b) => a + b, 0);
    if (type === "bar") {
      axes();
      const band = plot().width / DAYS.length;
      values.forEach((value, i) => {
        svg("rect", { x: xOf(i) - band * 0.3, y: yOf(value), width: band * 0.6, height: yOf(0) - yOf(value), rx: 4, fill: COLORS[i] }, figure);
        svg("text", { x: xOf(i), y: yOf(value) - 6, "text-anchor": "middle", text: String(value), style: "font-weight:700" }, figure);
      });
    } else if (type === "pie") {
      if (total === 0) { svg("text", { x: WIDTH / 2, y: HEIGHT / 2, "text-anchor": "middle", text: "Nincs adat: minden érték nulla." }, figure); }
      else {
        const cx = 240, cy = 150, r = 115;
        let angle = -Math.PI / 2;
        values.forEach((value, i) => {
          if (value === 0) return;
          const next = angle + (value / total) * Math.PI * 2;
          pieSlice(cx, cy, r, angle, next, COLORS[i]);
          const mid = (angle + next) / 2;
          if (value / total > 0.06) svg("text", { x: cx + r * 0.65 * Math.cos(mid), y: cy + r * 0.65 * Math.sin(mid) + 4, "text-anchor": "middle", text: `${formatNumber((value / total) * 100, 0)} %`, style: "fill:#fff;font-weight:700" }, figure);
          angle = next;
        });
      }
      DAYS.forEach((day, i) => {
        svg("rect", { x: 420, y: 70 + i * 28, width: 16, height: 16, rx: 4, fill: COLORS[i] }, figure);
        svg("text", { x: 444, y: 83 + i * 28, text: `${day}: ${values[i]}` }, figure);
      });
    } else {
      axes();
      const pts = values.map((value, i) => [xOf(i), yOf(value)]);
      if (type === "line") svg("polyline", { points: pts.map((p) => p.join(",")).join(" "), fill: "none", stroke: "var(--accent)", "stroke-width": 3, "stroke-linejoin": "round" }, figure);
      pts.forEach(([x, y], i) => {
        svg("circle", { cx: x, cy: y, r: type === "line" ? 5 : 7, fill: type === "line" ? "var(--accent)" : COLORS[i] }, figure);
        svg("text", { x, y: y - 12, "text-anchor": "middle", text: String(values[i]) }, figure);
      });
    }
    questionControls.replaceChildren(...QUESTIONS.map((item, i) => {
      const b = make("button", "il-toggle", item.text);
      b.type = "button";
      b.setAttribute("aria-pressed", String(question === i));
      b.style.textAlign = "left";
      b.addEventListener("click", () => { question = i; type = item.type; render(); });
      return b;
    }));
    explanation.className = "il-message";
    explanation.textContent = question === null ? "Kattints egy kérdésre: megmutatjuk, melyik diagramtípus illik hozzá, és miért." : `Legjobb: ${TYPES.find(([id]) => id === QUESTIONS[question].type)[1]}. ${QUESTIONS[question].why}`;
  }

  render();
  return () => {};
}
