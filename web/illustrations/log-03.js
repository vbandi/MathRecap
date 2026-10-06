import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const PRESETS = [
  { name: "∅ (üres)", members: [] },
  { name: "{4; 8; 12}", members: [4, 8, 12] },
  { name: "{12; 4; 8}", members: [12, 4, 8] },
  { name: "6-tal osztható", members: [6, 12] },
  { name: "páros", members: [2, 4, 6, 8, 10, 12] },
  { name: "3-mal osztható", members: [3, 6, 9, 12] },
  { name: "négyzetszám", members: [1, 4, 9] },
  { name: "prímszám", members: [2, 3, 5, 7, 11] },
  { name: "1-től 6-ig", members: [1, 2, 3, 4, 5, 6] },
];
const B_CENTER = { x: 440, y: 150 }, B_RADIUS = 130, A_HOME = { x: 125, y: 150 }, CHIP = 12;
const UNIVERSE = Array.from({ length: 12 }, (_, i) => i + 1);

// Slot offsets for a cluster of chips: centre, then a ring of 6, then a ring of 12.
const CLUSTER = [{ x: 0, y: 0 }, ...Array.from({ length: 6 }, (_, i) => ({ x: 28 * Math.cos((i * Math.PI) / 3), y: 28 * Math.sin((i * Math.PI) / 3) })),
  ...Array.from({ length: 12 }, (_, i) => ({ x: 56 * Math.cos((i * Math.PI) / 6 + 0.26), y: 56 * Math.sin((i * Math.PI) / 6 + 0.26) }))];
const clusterRadius = (count) => (count === 0 ? 30 : count === 1 ? 26 : count <= 7 ? 50 : 76);

function hexPoints() {
  const points = [];
  for (let row = -4; row <= 4; row++) {
    for (let col = -4; col <= 4; col++) {
      const point = { x: col * 30 + (Math.abs(row) % 2) * 15, y: row * 26 };
      if (Math.hypot(point.x, point.y) < B_RADIUS - CHIP - 6) points.push(point);
    }
  }
  return points;
}
const HEX = hexPoints();

export function mount(root) {
  const scope = createScope();
  const state = { a: 1, b: 4, inside: false, running: false };
  const marks = new Map();

  root.append(lead("A halmaz részhalmaza B-nek, ha A minden eleme benne van B-ben is. Választ két halmazt, és nézd meg elemenként, hogy teljesül-e ez. Az üres halmaznak nincs eleme, amit ki kellene mutatnod B-n kívül — ezért az minden halmaznak részhalmaza."));

  const play = card("Két halmaz 1-től 12-ig");
  const pickerA = make("div", "il-controls"), pickerB = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 620 300", role: "img", "aria-label": "A és B halmaz halmazábrája" });
  svg("circle", { cx: B_CENTER.x, cy: B_CENTER.y, r: B_RADIUS, style: `fill:none;stroke:${PALETTE.blue};stroke-width:2.5` }, figure);
  svg("text", { x: 440, y: 290, "text-anchor": "middle", "font-weight": 700, text: "B", style: `fill:${PALETTE.blue}` }, figure);
  const groupA = svg("g", { class: "il-move" }, figure);
  const circleA = svg("circle", { cx: 0, cy: 0, style: `fill:rgba(108,92,231,.12);stroke:${PALETTE.violet};stroke-width:2.5` }, groupA);
  const labelA = svg("text", { x: 0, "text-anchor": "middle", "font-weight": 700, text: "A", style: `fill:${PALETTE.violet}` }, groupA);
  const chipsA = new Map(), chipsB = new Map();
  const makeChip = (n, parent, cls) => {
    const group = svg("g", { class: cls }, parent);
    const circle = svg("circle", { r: CHIP }, group);
    svg("text", { "text-anchor": "middle", dy: 4.5, text: String(n) }, group);
    return { group, circle };
  };
  for (const n of UNIVERSE) chipsB.set(n, makeChip(n, figure, "il-move"));
  const chipLayerA = svg("g", {}, groupA);
  for (const n of UNIVERSE) chipsA.set(n, makeChip(n, chipLayerA, "il-move"));

  const question = make("p", "il-message");
  const verdict = make("div");
  verdict.style.cssText = "font:15px/1.7 var(--font-mono);color:var(--fg-soft)";
  const checkButton = button("Elemenkénti ellenőrzés", runCheck);
  play.append(make("div", "il-muted", "Az A halmaz:"), pickerA, make("div", "il-muted", "A B halmaz:"), pickerB, figure, question, controls(checkButton), verdict);
  root.append(play, keyIdea("A ⊆ B azt jelenti: ami A-ban van, az B-ben is. Az üres halmaz minden halmaz részhalmaza, és két halmaz pontosan akkor egyenlő, ha kölcsönösen részhalmazai egymásnak."));

  const members = (index) => PRESETS[index].members;
  const isSubset = (x, y) => members(x).every((n) => members(y).includes(n));

  function choose(key, index) { state[key] = index; reset(); }
  function reset() { scope.clearAll(); state.inside = false; state.running = false; marks.clear(); question.textContent = ""; question.className = "il-message"; render(); }

  function runCheck() {
    reset();
    state.running = true;
    const elements = members(state.a);
    render();
    const step = (i) => {
      if (i >= elements.length) return scope.timeout(conclude, 600);
      const n = elements[i], inB = members(state.b).includes(n);
      marks.set(n, inB);
      question.textContent = `${n}: benne van B-ben? ${inB ? "Igen ✓" : "Nem ✗"}`;
      question.className = `il-message ${inB ? "" : "warn"}`;
      render();
      scope.timeout(() => step(i + 1), 900);
    };
    if (!elements.length) question.textContent = "Az A halmaznak nincs eleme. Nincs mit ellenőrizni, és nincs olyan elem sem, ami kilógna B-ből.";
    scope.timeout(() => step(0), 500);
    if (!elements.length) scope.timeout(conclude, 1800);
  }

  function conclude() {
    state.running = false;
    const subset = isSubset(state.a, state.b);
    state.inside = subset;
    const missing = members(state.a).filter((n) => !members(state.b).includes(n));
    question.textContent = !members(state.a).length ? "Az üres halmaz minden halmaznak részhalmaza: nincs egyetlen olyan eleme sem, ami kilógna B-ből." : subset ? "Minden elem benne van B-ben, tehát A ⊆ B. Az A kör belefér B-be." : `Nincs benne B-ben: ${missing.join(", ")}. Ezért A nem részhalmaza B-nek.`;
    question.className = `il-message ${subset ? "good" : "warn"}`;
    render();
  }

  function render() {
    for (const [target, key] of [[pickerA, "a"], [pickerB, "b"]]) {
      target.replaceChildren(...PRESETS.map((preset, index) => toggle(preset.name, state[key] === index, () => choose(key, index), key === "a" ? PALETTE.violet : PALETTE.blue)));
    }
    const a = members(state.a), b = members(state.b);
    const equal = isSubset(state.a, state.b) && isSubset(state.b, state.a);
    const radiusA = state.inside && equal ? B_RADIUS - 6 : clusterRadius(a.length);
    const inside = state.inside;
    const center = inside ? (equal ? B_CENTER : { x: B_CENTER.x - Math.min(50, B_RADIUS - 4 - radiusA), y: B_CENTER.y }) : A_HOME;
    groupA.style.transform = `translate(${center.x}px, ${center.y}px)`;
    circleA.setAttribute("r", radiusA);
    circleA.style.strokeDasharray = a.length ? "" : "6 5";
    labelA.setAttribute("y", -radiusA - 8);
    labelA.textContent = a.length ? "A" : "A = ∅";

    for (const n of UNIVERSE) {
      const chip = chipsA.get(n);
      const index = a.indexOf(n);
      chip.group.style.opacity = index >= 0 ? 1 : 0;
      if (index >= 0) chip.group.style.transform = `translate(${CLUSTER[index].x}px, ${CLUSTER[index].y}px)`;
      const mark = marks.get(n);
      paint(chip.circle, mark, index >= 0);
    }
    // Elements of B: those already covered by the A circle are not drawn twice.
    const visibleB = b.filter((n) => !(inside && a.includes(n)));
    const obstacle = inside ? { x: center.x - B_CENTER.x, y: center.y - B_CENTER.y, r: radiusA } : null;
    const free = HEX.filter((p) => !obstacle || Math.hypot(p.x - obstacle.x, p.y - obstacle.y) > obstacle.r + CHIP + 4).sort((p, q) => Math.hypot(p.x, p.y) - Math.hypot(q.x, q.y));
    let used = 0;
    for (const n of UNIVERSE) {
      const chip = chipsB.get(n);
      const show = visibleB.includes(n);
      chip.group.style.opacity = show ? 1 : 0;
      if (show) { const slot = free[used++]; chip.group.style.transform = `translate(${B_CENTER.x + slot.x}px, ${B_CENTER.y + slot.y}px)`; }
      paint(chip.circle, undefined, show);
    }
    checkButton.disabled = state.running;

    const row = (label, ok) => `${label}  ${ok ? "✓ igaz " : "✗ hamis"}`;
    const relation = equal ? "A = B: ugyanazok az elemek vannak bennük." : isSubset(state.a, state.b) ? "A ⊂ B: A részhalmaz, de B-nek több eleme is van." : isSubset(state.b, state.a) ? "B ⊂ A: B részhalmaz, de A-nak több eleme is van." : "Egyik sem részhalmaza a másiknak.";
    verdict.replaceChildren(...[row("A ⊆ B", isSubset(state.a, state.b)), row("B ⊆ A", isSubset(state.b, state.a)), relation].map((text) => make("div", "", text)));
  }

  function paint(circle, mark, visible) {
    const fill = mark === true ? "var(--il-green)" : mark === false ? "var(--il-red)" : "var(--surface)";
    circle.style.cssText = `fill:${fill};stroke:${mark === undefined ? "var(--line-strong)" : "none"}`;
    circle.nextElementSibling.style.cssText = mark === undefined ? "fill:var(--fg-soft)" : "fill:#fff;font-weight:700";
    if (!visible) circle.parentNode.style.pointerEvents = "none";
  }

  render();
  return () => scope.clearAll();
}
