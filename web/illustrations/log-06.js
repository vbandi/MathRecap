import { card, controls, equation, keyIdea, lead, make, PALETTE, rich, svg, toggle, uniqueId } from "./kit.js";

const NUMBERS = Array.from({ length: 20 }, (_, index) => index + 1);
const PROPERTIES = {
  even: { name: "páros", test: (n) => n % 2 === 0 },
  odd: { name: "páratlan", test: (n) => n % 2 === 1 },
  multipleOfThree: { name: "3-mal osztható", test: (n) => n % 3 === 0 },
  prime: { name: "prímszám", test: (n) => n > 1 && NUMBERS.slice(1, n - 1).every((divisor) => n % divisor !== 0) },
  greaterThanTen: { name: "10-nél nagyobb", test: (n) => n > 10 },
  square: { name: "négyzetszám", test: (n) => Number.isInteger(Math.sqrt(n)) },
};
const WIDTH = 600, HEIGHT = 330, RADIUS = 122;
const CIRCLE_A = { x: 245, y: 165 }, CIRCLE_B = { x: 355, y: 165 };
const CHIP = 13;

const distance = (point, center) => Math.hypot(point.x - center.x, point.y - center.y);

// Free slots per region: a grid classified by which circles contain it, with a margin
// so chips never sit on a circle's outline.
function regionSlots() {
  const slots = { onlyA: [], both: [], onlyB: [], outside: [] };
  for (let y = 26; y <= HEIGHT - 20; y += 30) {
    for (let x = 24; x <= WIDTH - 20; x += 30) {
      const point = { x, y };
      const dA = distance(point, CIRCLE_A), dB = distance(point, CIRCLE_B);
      const nearEdge = Math.abs(dA - RADIUS) < CHIP + 2 || Math.abs(dB - RADIUS) < CHIP + 2;
      if (nearEdge) continue;
      const inA = dA < RADIUS, inB = dB < RADIUS;
      slots[inA && inB ? "both" : inA ? "onlyA" : inB ? "onlyB" : "outside"].push(point);
    }
  }
  const anchors = { onlyA: { x: 175, y: 165 }, both: { x: 300, y: 165 }, onlyB: { x: 425, y: 165 }, outside: { x: 300, y: 330 } };
  for (const [region, points] of Object.entries(slots)) points.sort((p, q) => distance(p, anchors[region]) - distance(q, anchors[region]));
  return slots;
}

export function mount(root) {
  const state = { a: "even", b: "multipleOfThree", operation: "intersection" };
  const slots = regionSlots();
  const clipId = uniqueId("venn-clip");

  root.append(lead("Egy halmazt a tagjai határoznak meg. Itt az 1–20 számokat válogatjuk két tulajdonság szerint. A metszet azokat gyűjti, amelyek MINDKÉT tulajdonságnak megfelelnek, az unió azokat, amelyek LEGALÁBB AZ EGYIKNEK."));

  const setup = card("Válassz két tulajdonságot");
  const pickerA = make("div", "il-controls");
  const pickerB = make("div", "il-controls");
  const operationPicker = make("div", "il-controls");
  setup.append(pickerA, pickerB, operationPicker);

  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Halmazábra két egymásba érő halmazzal" });
  const defs = svg("defs", {}, figure);
  svg("circle", { cx: CIRCLE_A.x, cy: CIRCLE_A.y, r: RADIUS }, svg("clipPath", { id: clipId }, defs));
  const shade = svg("g", { class: "il-fade", opacity: 0.28 }, figure);
  svg("circle", { cx: CIRCLE_A.x, cy: CIRCLE_A.y, r: RADIUS, fill: "none", stroke: PALETTE.violet, "stroke-width": 2.5 }, figure);
  svg("circle", { cx: CIRCLE_B.x, cy: CIRCLE_B.y, r: RADIUS, fill: "none", stroke: PALETTE.blue, "stroke-width": 2.5 }, figure);
  const labelA = svg("text", { x: CIRCLE_A.x - 100, y: 34, "font-weight": 700, style: `fill:${PALETTE.violet}` }, figure);
  const labelB = svg("text", { x: CIRCLE_B.x + 100, y: 34, "text-anchor": "end", "font-weight": 700, style: `fill:${PALETTE.blue}` }, figure);
  const chips = new Map(NUMBERS.map((n) => {
    const group = svg("g", { class: "il-move" }, figure);
    svg("circle", { r: CHIP }, group);
    svg("text", { "text-anchor": "middle", dy: 4.5, text: String(n) }, group);
    return [n, group];
  }));
  setup.append(figure);

  const result = make("div");
  const counts = make("p", "il-muted");
  setup.append(result, counts);
  root.append(setup, keyIdea("a metszetben ", make("b", "", "és"), " kapcsolat van (mindkettő igaz), az unióban ", make("b", "", "vagy"), " (legalább az egyik igaz). Ezért a metszet sosem nagyobb egyik halmaznál sem, az unió pedig sosem kisebb."));

  function renderPickers() {
    const picker = (target, key, color, title) => {
      target.replaceChildren(make("span", "il-muted", title));
      for (const [id, property] of Object.entries(PROPERTIES)) {
        target.append(toggle(property.name, state[key] === id, () => { state[key] = id; render(); }, color));
      }
    };
    picker(pickerA, "a", PALETTE.violet, "A halmaz:");
    picker(pickerB, "b", PALETTE.blue, "B halmaz:");
    operationPicker.replaceChildren(
      toggle("Metszet: A ∩ B", state.operation === "intersection", () => { state.operation = "intersection"; render(); }),
      toggle("Unió: A ∪ B", state.operation === "union", () => { state.operation = "union"; render(); }),
    );
  }

  function render() {
    renderPickers();
    const inA = (n) => PROPERTIES[state.a].test(n), inB = (n) => PROPERTIES[state.b].test(n);
    const intersection = state.operation === "intersection";
    const selected = NUMBERS.filter((n) => (intersection ? inA(n) && inB(n) : inA(n) || inB(n)));

    shade.replaceChildren();
    if (intersection) svg("circle", { cx: CIRCLE_B.x, cy: CIRCLE_B.y, r: RADIUS, fill: "var(--accent)", "clip-path": `url(#${clipId})` }, shade);
    else [CIRCLE_A, CIRCLE_B].forEach((c) => svg("circle", { cx: c.x, cy: c.y, r: RADIUS, fill: "var(--accent)" }, shade));
    labelA.textContent = `A: ${PROPERTIES[state.a].name}`;
    labelB.textContent = `B: ${PROPERTIES[state.b].name}`;

    const used = { onlyA: 0, both: 0, onlyB: 0, outside: 0 };
    for (const n of NUMBERS) {
      const region = inA(n) && inB(n) ? "both" : inA(n) ? "onlyA" : inB(n) ? "onlyB" : "outside";
      const slot = slots[region][used[region]++];
      const chip = chips.get(n);
      chip.style.transform = `translate(${slot.x}px, ${slot.y}px)`;
      const isSelected = selected.includes(n);
      chip.querySelector("circle").style.cssText = isSelected ? "fill:var(--accent);stroke:none" : "fill:var(--surface);stroke:var(--line-strong)";
      chip.querySelector("text").style.cssText = isSelected ? "fill:var(--accent-ink);font-weight:700" : "fill:var(--dim)";
    }

    const symbol = intersection ? "∩" : "∪";
    result.replaceChildren(equation(`A ${symbol} B`, rich("{ ", make("span", "il-accent", selected.join("; ") || "∅"), " }")));
    const countA = NUMBERS.filter(inA).length, countB = NUMBERS.filter(inB).length, countBoth = NUMBERS.filter((n) => inA(n) && inB(n)).length;
    counts.textContent = intersection
      ? `A-ban ${countA}, B-ben ${countB} szám van; mindkettőben ${countBoth}.`
      : `|A ∪ B| = |A| + |B| − |A ∩ B| = ${countA} + ${countB} − ${countBoth} = ${countA + countB - countBoth}. A közös részt le kell vonni, különben kétszer számolnánk.`;
  }

  render();
  return () => {};
}
