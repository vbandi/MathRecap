import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const UNIT = 44, OX = 70, OY = 210;
const RAD = Math.PI / 180;
const toView = ([x, y]) => [OX + x * UNIT, OY - y * UNIT];
const pointsOf = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const distance = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const angleAt = (vertex, p, q) => {
  const v1 = [p[0] - vertex[0], p[1] - vertex[1]], v2 = [q[0] - vertex[0], q[1] - vertex[1]];
  return Math.acos(clamp((v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1), -1, 1)) / RAD;
};
const A = [0, 0], B_FIXED = [6, 0];

function addHandle(figure, parent, color, onMove) {
  const group = svg("g", { style: "cursor:grab;touch-action:none" }, parent);
  svg("circle", { r: 20, fill: "transparent" }, group);
  svg("circle", { r: 9, style: `fill:${color};stroke:var(--input);stroke-width:2.5` }, group);
  group.addEventListener("pointerdown", (event) => { group.setPointerCapture(event.pointerId); event.preventDefault(); });
  group.addEventListener("pointermove", (event) => {
    if (!group.hasPointerCapture(event.pointerId)) return;
    const point = figure.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(figure.getScreenCTM().inverse());
    onMove(local.x, local.y);
  });
  return { place(x, y) { group.setAttribute("transform", `translate(${x} ${y})`); } };
}

// Case definitions. "free" cases: A and B are fixed and the learner places C.
// The SsA cases fix A and C, and the learner slides B along the base line.
const cases = [
  {
    name: "SSS: három oldal", kind: "free", given: [["a = BC", 4, (t) => distance(t.B, t.C), "", 1], ["b = AC", 5, (t) => distance(t.A, t.C), "", 1], ["c = AB", 6, (t) => distance(t.A, t.B), "", 1]],
    solutions: () => { const x = (25 + 36 - 16) / 12, y = Math.sqrt(25 - x * x); return [[x, y], [x, -y]]; },
    guides: [{ circle: [A, 5] }, { circle: [B_FIXED, 4] }],
    done: "Három oldalhoz két hely is van C-nek, de a két háromszög egymás tükörképe, tehát egybevágó. A három oldal egyértelműen meghatározza a háromszöget.",
  },
  {
    name: "SAS: két oldal és a közbezárt szög", kind: "free", given: [["c = AB", 6, (t) => distance(t.A, t.B), "", 1], ["α (A-nál)", 50, (t) => angleAt(t.A, t.B, t.C), "°", 0.05], ["b = AC", 4, (t) => distance(t.A, t.C), "", 1]],
    solutions: () => [[4 * Math.cos(50 * RAD), 4 * Math.sin(50 * RAD)], [4 * Math.cos(50 * RAD), -4 * Math.sin(50 * RAD)]],
    guides: [{ ray: [A, 50] }, { circle: [A, 4] }],
    done: "A két oldal és a közbezárt szög is egyértelműen megszabja a háromszöget (a másik megoldás az AB-re vett tükörkép, tehát egybevágó).",
  },
  {
    name: "ASA: egy oldal és a rajta fekvő két szög", kind: "free", given: [["c = AB", 6, (t) => distance(t.A, t.B), "", 1], ["α (A-nál)", 60, (t) => angleAt(t.A, t.B, t.C), "°", 0.05], ["β (B-nél)", 50, (t) => angleAt(t.B, t.A, t.C), "°", 0.05]],
    solutions: () => {
      const b = 6 * Math.sin(50 * RAD) / Math.sin(110 * RAD);
      return [[b * Math.cos(60 * RAD), b * Math.sin(60 * RAD)], [b * Math.cos(60 * RAD), -b * Math.sin(60 * RAD)]];
    },
    guides: [{ ray: [A, 60] }, { ray: [B_FIXED, 130] }],
    done: "Az oldal és a két szög egyértelműen meghatározza a háromszöget: a két félegyenes csak egy pontban metszi egymást (a másik megoldás tükörkép).",
  },
  ...[4, 6].map((a) => ({
    name: a < 5 ? "SsA: a szög a rövidebb oldallal szemben" : "SsA: a szög a hosszabb oldallal szemben", kind: "slide",
    given: [["α (A-nál)", 40, (t) => angleAt(t.A, t.B, t.C), "°", 0.05], ["b = AC", 5, (t) => distance(t.A, t.C), "", 1], [`a = BC`, a, (t) => distance(t.B, t.C), "", 1]],
    fixedC: [5 * Math.cos(40 * RAD), 5 * Math.sin(40 * RAD)],
    solutions() {
      const [cx, cy] = this.fixedC, h = Math.sqrt(a * a - cy * cy);
      return [cx + h, cx - h].filter((x) => x > 0.05).sort((p, q) => p - q).map((x) => [x, 0]);
    },
    guides: [{ ray: [A, 0] }],
    circleAroundC: a,
    done: a < 5
      ? "Két különböző háromszög is létezik ugyanazokkal az adatokkal, mert a-val szemben rövidebb oldal áll. Ezért az SsA nem egybevágósági alapeset, ha a szöggel szemközti oldal a rövidebb."
      : "Itt csak egy háromszög van: a másik metszéspont az A csúcs mögé esne, ott nem háromszöget kapnánk. Ha a szöggel szemközti oldal hosszabb, az SsA egyértelmű.",
  })),
];

export function mount(root) {
  const scope = createScope();
  const state = { index: 0, free: [1.5, 1.5], sliderX: 1, found: new Set() };

  root.append(lead("Két háromszög egybevágó, ha van egy mozgás, amely az egyiket a másikra viszi. Hogy ehhez hány adat elég, azt úgy fedezheted fel, hogy megpróbálod megszerkeszteni a háromszöget a megadott adatokból."));

  const main = card("Szerkeszd meg a háromszöget az adatokból");
  const tabs = cases.map((entry, index) => toggle(entry.name, index === 0, () => { scope.clearAll(); animating = false; state.index = index; state.found = new Set(); state.free = [1.5, 1.5]; state.sliderX = 1; render(); }));
  const guideToggle = toggle("Segédvonalak", false, () => { guideOn = !guideOn; guideToggle.setAttribute("aria-pressed", String(guideOn)); render(); });
  const animateButton = button("Mutasd végig", animate, { ghost: true });
  let guideOn = false, animating = false;
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 400", role: "img", "aria-label": "Háromszög szerkesztése a megadott adatokból" });
  const layer = svg("g", {}, figure);
  const handle = addHandle(figure, figure, PALETTE.amber, (x, y) => {
    const entry = cases[state.index];
    if (entry.kind === "free") {
      let point = [clamp((x - OX) / UNIT, -1.5, 11), clamp((OY - y) / UNIT, -4.6, 4.6)];
      const hit = entry.solutions().findIndex((solution) => distance(solution, point) < 0.3);
      if (hit >= 0) { point = entry.solutions()[hit]; state.found.add(hit); }
      state.free = point;
    } else {
      let px = clamp((x - OX) / UNIT, -1.5, 11);
      const hit = entry.solutions().findIndex((solution) => Math.abs(solution[0] - px) < 0.15);
      if (hit >= 0) { px = entry.solutions()[hit][0]; state.found.add(hit); }
      state.sliderX = px;
    }
    render();
  });
  const dataLines = [make("div"), make("div"), make("div")];
  const message = make("p", "il-message");
  main.append(controls(...tabs.slice(0, 3)), controls(...tabs.slice(3)), controls(guideToggle, animateButton), figure, ...dataLines, message);

  function animate() {
    scope.clearAll();
    const entry = cases[state.index];
    if (entry.kind !== "slide") { state.free = [1.5, 1.5]; render(); return; }
    animating = true;
    let start = null;
    const step = (time) => {
      start ??= time;
      const progress = Math.min(1, (time - start) / 4500);
      state.sliderX = -0.5 + progress * 10;
      entry.solutions().forEach((solution, index) => { if (Math.abs(solution[0] - state.sliderX) < 0.12) state.found.add(index); });
      render();
      if (progress < 1) scope.frame(step); else { animating = false; render(); }
    };
    scope.frame(step);
  }

  function render() {
    const entry = cases[state.index];
    tabs.forEach((element, index) => element.setAttribute("aria-pressed", String(index === state.index)));
    layer.replaceChildren();
    const slide = entry.kind === "slide";
    const solutions = entry.solutions();
    const triangleOf = (p) => (slide ? { A, B: p, C: entry.fixedC } : { A, B: B_FIXED, C: p });
    const current = triangleOf(slide ? [state.sliderX, 0] : state.free);
    if (guideOn) {
      entry.guides.forEach((guide) => {
        if (guide.circle) { const [cx, cy] = toView(guide.circle[0]); svg("circle", { cx, cy, r: guide.circle[1] * UNIT, fill: "none", style: "stroke:var(--dim);stroke-width:1.5;stroke-dasharray:6 6" }, layer); }
        if (guide.ray) {
          const [from, angle] = guide.ray, [x1, y1] = toView(from), [x2, y2] = toView([from[0] + 14 * Math.cos(angle * RAD), from[1] + 14 * Math.sin(angle * RAD)]);
          svg("line", { x1, y1, x2, y2, style: "stroke:var(--dim);stroke-width:1.5;stroke-dasharray:6 6" }, layer);
        }
      });
      if (entry.circleAroundC) { const [cx, cy] = toView(entry.fixedC); svg("circle", { cx, cy, r: entry.circleAroundC * UNIT, fill: "none", style: "stroke:var(--dim);stroke-width:1.5;stroke-dasharray:6 6" }, layer); }
      solutions.forEach((solution) => { const [x, y] = toView(solution); svg("circle", { cx: x, cy: y, r: 4, style: "fill:var(--dim)" }, layer); });
    }
    svg("line", { x1: 10, y1: OY, x2: 590, y2: OY, class: "axis" }, layer);
    // Triangles that have been found are kept on screen.
    const colors = [PALETTE.green, PALETTE.violet];
    [...state.found].forEach((index) => {
      const solution = solutions[index];
      const tri = triangleOf(solution);
      svg("polygon", { points: pointsOf([tri.A, tri.B, tri.C].map(toView)), style: `fill:${colors[index % 2]};fill-opacity:.25;stroke:${colors[index % 2]};stroke-width:3` }, layer);
    });
    svg("polygon", { points: pointsOf([current.A, current.B, current.C].map(toView)), style: `fill:${PALETTE.blue};fill-opacity:.2;stroke:var(--fg);stroke-width:2.5` }, layer);
    [["A", current.A], ["B", current.B], ["C", current.C]].forEach(([name, point]) => {
      const [x, y] = toView(point);
      svg("text", { x: x + (name === "A" ? -18 : 10), y: y + (point[1] >= 0 && name === "C" ? -10 : 20), text: name, style: "font-weight:700;font-size:16px;fill:var(--fg)" }, layer);
    });
    handle.place(...toView(slide ? current.B : current.C));

    const matches = entry.given.map(([, value, measure, unit]) => Math.abs(measure(current) - value) < (unit === "°" ? 0.3 : 0.03));
    entry.given.forEach(([label, value, measure, unit], index) => {
      const measured = measure(current);
      dataLines[index].replaceChildren(equation(`${label} = ${formatNumber(value)}${unit}`, slot(`most: ${formatNumber(measured, 2)}${unit}  ${matches[index] ? "✓" : "✗"}`, 22, { align: "left" })));
    });
    const solved = matches.every(Boolean);
    const foundAll = slide ? state.found.size === solutions.length : state.found.size > 0;
    animateButton.disabled = !slide || animating;
    message.className = `il-message ${foundAll ? "good" : ""}`;
    message.textContent = foundAll && state.found.size > 0 ? entry.done
      : solved ? (slide ? "Ez az egyik megfelelő háromszög. Van másik is? Húzd tovább a B pontot, vagy nyomd meg a „Mutasd végig” gombot." : "Megvan! Még egy helyet megtalálhatsz: nézd a tükörképet.")
        : slide ? "Húzd a sárga pontot (B) az alapegyenes mentén úgy, hogy mindhárom adat teljesüljön (✓). A segédvonalak megmutatják, hol metszi a körív az egyenest."
          : "Húzd a sárga pontot (C) úgy, hogy mindhárom adat teljesüljön (✓). Ha elakadsz, kapcsold be a segédvonalakat.";
  }

  root.append(main, keyIdea("két háromszög egybevágó, ha három oldaluk (SSS), két oldaluk és a közbezárt szögük (SAS), egy oldaluk és az azon fekvő két szög (ASA), vagy két oldaluk és a nagyobbikkal szemközti szögük (SsA) egyenlő. Két oldal és a rövidebbikkel szemközti szög nem elég."));
  render();
  return () => scope.clearAll();
}
