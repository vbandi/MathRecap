import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const SPORTS = [
  { name: "Labdarúgás", weight: 0.32, color: PALETTE.green },
  { name: "Kosárlabda", weight: 0.22, color: PALETTE.amber },
  { name: "Úszás", weight: 0.16, color: PALETTE.blue },
  { name: "Kézilabda", weight: 0.14, color: PALETTE.red },
  { name: "Futás", weight: 0.1, color: PALETTE.violet },
  { name: "Tenisz", weight: 0.06, color: PALETTE.pink },
];
const MAX_ANSWERS = 60;
const GROUP_WIDTH = 26;

function randomSport() {
  let r = Math.random();
  for (let i = 0; i < SPORTS.length; i++) { r -= SPORTS[i].weight; if (r < 0) return i; }
  return SPORTS.length - 1;
}

// Tally marks: groups of five (four strokes and one diagonal).
function tally(count, color) {
  const groups = Math.ceil(count / 5);
  const element = svg("svg", { viewBox: `0 0 ${12 * GROUP_WIDTH} 22`, width: 12 * GROUP_WIDTH, height: 22, "aria-label": `${count} strigula` });
  element.style.cssText = "display:block;max-width:100%";
  for (let g = 0; g < groups; g++) {
    const inGroup = Math.min(5, count - g * 5), x0 = g * GROUP_WIDTH + 2;
    for (let s = 0; s < Math.min(4, inGroup); s++) svg("line", { x1: x0 + s * 5, y1: 3, x2: x0 + s * 5, y2: 19, stroke: color, "stroke-width": 2.5, "stroke-linecap": "round" }, element);
    if (inGroup === 5) svg("line", { x1: x0 - 2, y1: 16, x2: x0 + 18, y2: 6, stroke: color, "stroke-width": 2.5, "stroke-linecap": "round" }, element);
  }
  return element;
}

export function mount(root) {
  const scope = createScope();
  const counts = SPORTS.map(() => 0);
  let total = 0, last = null, sorted = false, timer = null;

  root.append(lead("Az adatgyűjtés úgy kezdődik, hogy felteszünk egy kérdést, és feljegyezzük a válaszokat. A sok válaszból táblázat lesz, amelyből már ki lehet olvasni, mi a gyakori és mi a ritka. Kérdezd meg az osztály sportolási szokásait!"));

  const survey = card("Kedvenc sport: felmérés");
  const bubble = make("div", "il-message");
  bubble.style.cssText = "min-height:2.6em;font-size:16px";
  const tableBox = make("div");
  const status = make("p", "il-muted");
  survey.append(controls(
    button("Kérdezz meg valakit", () => ask(1)),
    button("Kérdezz meg 10 embert", () => ask(10), { ghost: true }),
    button("Újrakezdés", reset, { ghost: true }),
  ), bubble, tableBox, status);
  root.append(survey, keyIdea("a nyers válaszokat érdemes táblázatba rendezni: a gyakoriság azt mondja meg, hányan választották az adott választ, a relatív gyakoriság pedig az összes válaszhoz viszonyított arányt (gyakoriság / összes). A relatív gyakoriságok összege mindig 1, vagyis 100 %."));

  function ask(howMany) {
    if (timer !== null) return;
    let left = Math.min(howMany, MAX_ANSWERS - total);
    if (left <= 0) return;
    timer = scope.interval(() => {
      const sport = randomSport();
      counts[sport] += 1; total += 1; last = sport; left -= 1;
      render();
      if (left <= 0 || total >= MAX_ANSWERS) { scope.clearInterval(timer); timer = null; render(); }
    }, howMany > 1 ? 120 : 10);
  }
  function reset() {
    if (timer !== null) { scope.clearInterval(timer); timer = null; }
    counts.fill(0); total = 0; last = null; render();
  }

  function render() {
    bubble.className = "il-message";
    bubble.textContent = last === null ? "Még senkit nem kérdeztél meg. Nyomd meg a gombot!" : `„A kedvenc sportom: ${SPORTS[last].name.toLowerCase()}.”`;
    const table = make("table", "il-table");
    table.style.width = "100%";
    const head = make("tr");
    ["Sport", "Strigula", "Gyakoriság", "Relatív gyakoriság"].forEach((text, i) => { const th = make("th", "", text); th.style.cssText = i === 1 ? "width:auto;text-align:left" : i === 3 ? "width:20ch" : "width:11ch"; head.append(th); });
    table.append(head);
    const order = SPORTS.map((_, i) => i);
    if (sorted) order.sort((a, b) => counts[b] - counts[a] || a - b);
    for (const i of order) {
      const row = make("tr");
      const name = make("td", "", SPORTS[i].name);
      name.style.cssText = `width:13ch;text-align:left;color:${SPORTS[i].color};font-weight:700`;
      const marks = make("td"); marks.style.cssText = "width:auto;text-align:left;padding:0 6px"; marks.append(tally(counts[i], SPORTS[i].color));
      const count = make("td", "", String(counts[i]));
      const relative = make("td");
      relative.append(slot(total ? `${counts[i]}/${total}` : "–", 8), " = ", slot(total ? `${formatNumber((counts[i] / total) * 100, 1)} %` : "–", 7));
      row.append(name, marks, count, relative);
      table.append(row);
    }
    const foot = make("tr");
    const label = make("td", "", "Összesen"); label.style.cssText = "width:13ch;text-align:left;font-weight:700";
    const empty = make("td"); empty.style.width = "auto";
    const sum = make("td", "", String(total)); sum.style.fontWeight = "700";
    const one = make("td"); one.append(slot(total ? `${total}/${total}` : "–", 8), " = ", slot(total ? "100 %" : "–", 7)); one.style.fontWeight = "700";
    foot.append(label, empty, sum, one);
    table.append(foot);
    tableBox.replaceChildren(make("div", "il-controls"), table);
    tableBox.firstChild.append(toggle("Rendezés gyakoriság szerint", sorted, () => { sorted = !sorted; render(); }));
    status.textContent = total >= MAX_ANSWERS ? `Elég adat: ${MAX_ANSWERS} válasz gyűlt össze. Kezdd újra, ha másik mintát szeretnél.` : total ? `${total} válasz eddig. Figyeld, hogyan áll be az arány, ahogy több adat gyűlik!` : "";
  }

  render();
  return () => scope.clearAll();
}
