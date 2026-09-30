import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const W = 720, MIN = 0, MAX = 20, AXIS_Y = 120, MAX_STACK = 6, MAX_VALUES = 16;
const px = (v) => 40 + ((v - MIN) / (MAX - MIN)) * (W - 80);

const medianOfSorted = (sorted) => { const mid = sorted.length >> 1; return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; };
// The median splits the data in two halves (the middle value of an odd-sized set belongs to neither); Q1 and Q3 are the medians of the halves.
function fiveNumbers(values) {
  const sorted = [...values].sort((a, b) => a - b), n = sorted.length;
  return { sorted, min: sorted[0], q1: medianOfSorted(sorted.slice(0, n >> 1)), median: medianOfSorted(sorted), q3: medianOfSorted(sorted.slice(Math.ceil(n / 2))), max: sorted[n - 1] };
}

const STEP_TEXT = [
  "Ezek az adatok: egy osztály dolgozatának pontszámai (20 pontból). Minden pont egy diák.",
  "Először megkeressük a legkisebb és a legnagyobb értéket. Ezek lesznek a „bajusz” végei.",
  "A medián kettéosztja az adatokat: az egyik fele alatta, a másik fele fölötte van.",
  "Az alsó és a felső fél mediánja az alsó (Q1) és a felső (Q3) kvartilis. Közöttük van az adatok középső fele.",
  "Kész a sodrófa-diagram: a doboz Q1-től Q3-ig tart, benne a medián vonala, a bajuszok a legkisebb és a legnagyobb értékig nyúlnak.",
];

export function mount(root) {
  const scope = createScope();
  const data = { A: [6, 8, 9, 10, 11, 11, 12, 13, 15], B: [3, 5, 8, 10, 12, 14, 16, 17, 19] };
  const colors = { A: PALETTE.blue, B: PALETTE.amber };
  let current = "A", step = 0;

  root.append(lead("A sodrófa-diagram (doboz-bajusz diagram) öt számmal mutatja meg egy adatsor alakját: a legkisebb értékkel, az alsó kvartilissel, a mediánnal, a felső kvartilissel és a legnagyobb értékkel. Így egy pillantással összehasonlíthatsz két csoportot."));

  const build = card("Az adatokból a diagram");
  const classControls = controls();
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 250`, role: "img", "aria-label": "Adatok pontdiagramja és a belőle készülő sodrófa-diagram" }, build);
  const dotsLayer = svg("g", {}, figure);
  const partLayer = svg("g", {}, figure);
  const stepText = make("p", "il-message");
  const backButton = button("Vissza", () => setStep(step - 1), { ghost: true });
  const nextButton = button("Következő lépés", () => setStep(step + 1));
  const playButton = button("Mutasd végig", play, { ghost: true });
  build.append(classControls, make("p", "il-muted", "Kattints egy szám fölé, hogy új pont (diák) kerüljön oda; egy pontra kattintva leveszed. Legalább 5 pont marad."), figure, stepText, controls(backButton, nextButton, playButton));

  const compare = card("Két osztály összehasonlítása");
  const compareFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 200`, role: "img", "aria-label": "Két osztály sodrófa-diagramja ugyanazon a tengelyen" }, compare);
  const compareLayer = svg("g", {}, compareFigure);
  const compareText = make("p", "il-message");
  compare.append(compareFigure, compareText, make("p", "il-muted", "Az A osztály a kék, a B osztály a narancs. Szerkeszd a fenti adatokat, és a két diagram azonnal változik."));

  root.append(build, compare, keyIdea("a doboz hossza mutatja, mennyire szórnak a középső 50 százaléknyi adatok, a doboz helye pedig azt, hogy a csoport hol van a számegyenesen. Két sodrófa-diagramot mindig ugyanazon a tengelyen érdemes összehasonlítani."));

  let parts = {};
  function axis(layer, y, withLabels = true) {
    svg("line", { x1: 30, x2: W - 30, y1: y, y2: y, class: "axis" }, layer);
    for (let v = MIN; v <= MAX; v += 2) if (withLabels) svg("text", { x: px(v), y: y + 17, "text-anchor": "middle", text: String(v), style: "font-size:11px;fill:var(--dim)" }, layer);
  }

  function drawBox(layer, f, y, color, fade, label) {
    const h = 34, out = {};
    out.whiskers = svg("g", { class: fade ? "il-fade" : "" }, layer);
    svg("path", { d: `M ${px(f.min)} ${y - 9} V ${y + 9} M ${px(f.min)} ${y} H ${px(f.q1)} M ${px(f.q3)} ${y} H ${px(f.max)} M ${px(f.max)} ${y - 9} V ${y + 9}`, fill: "none", style: `stroke:${color};stroke-width:2.5` }, out.whiskers);
    out.box = svg("g", { class: fade ? "il-fade" : "" }, layer);
    svg("rect", { x: px(f.q1), y: y - h / 2, width: Math.max(px(f.q3) - px(f.q1), 1), height: h, rx: 3, style: `fill:${color};fill-opacity:.25;stroke:${color};stroke-width:2.5` }, out.box);
    out.median = svg("line", { class: fade ? "il-fade" : "", x1: px(f.median), x2: px(f.median), y1: y - h / 2, y2: y + h / 2, style: `stroke:${color};stroke-width:5` }, layer);
    if (label) svg("text", { x: 34, y: y - 22, text: label, style: `fill:${color};font-weight:700` }, layer);
    return out;
  }

  function buildMain() {
    dotsLayer.replaceChildren(); partLayer.replaceChildren();
    const f = fiveNumbers(data[current]), color = colors[current];
    axis(dotsLayer, AXIS_Y);
    for (let v = MIN; v <= MAX; v++) {
      const hit = svg("rect", { x: px(v) - 15, y: 10, width: 30, height: AXIS_Y - 10, fill: "transparent", style: "cursor:pointer" }, dotsLayer);
      hit.addEventListener("click", () => { const list = data[current]; if (list.length < MAX_VALUES && list.filter((x) => x === v).length < MAX_STACK) { list.push(v); changed(); } });
    }
    const counts = {};
    f.sorted.forEach((v) => {
      const level = counts[v] = (counts[v] ?? 0) + 1;
      const dot = svg("circle", { cx: px(v), cy: AXIS_Y - 4 - level * 15, r: 6.5, style: `fill:${color};stroke:var(--input);stroke-width:1.5;cursor:pointer` }, dotsLayer);
      dot.addEventListener("click", (event) => { event.stopPropagation(); if (data[current].length > 5) { data[current].splice(data[current].lastIndexOf(v), 1); changed(); } });
    });
    const boxY = 180;
    parts = drawBox(partLayer, f, boxY, color, true);
    parts.guides = [];
    [["min", f.min, 1], ["Q1", f.q1, 3], ["medián", f.median, 2], ["Q3", f.q3, 3], ["max", f.max, 1]].forEach(([name, v, from], i) => {
      const g = svg("g", { class: "il-fade" }, partLayer);
      svg("line", { x1: px(v), x2: px(v), y1: AXIS_Y + 2, y2: boxY - 20, style: `stroke:${color};stroke-width:1.5;stroke-dasharray:4 4` }, g);
      svg("text", { x: px(v), y: 222 + (i % 2) * 15, "text-anchor": "middle", text: `${name} = ${formatNumber(v, 1)}`, style: `fill:${color};font-weight:700;font-size:12px` }, g);
      parts.guides.push({ g, from });
    });
  }

  function applyStep() {
    parts.guides.forEach(({ g, from }) => { g.style.opacity = step >= from ? "1" : "0"; });
    parts.box.style.opacity = step >= 4 ? "1" : "0";
    parts.whiskers.style.opacity = step >= 4 ? "1" : "0";
    parts.median.style.opacity = step >= 2 ? "1" : "0";
    stepText.textContent = STEP_TEXT[step];
    stepText.className = `il-message ${step === 4 ? "good" : ""}`;
    backButton.disabled = step === 0;
    nextButton.disabled = step === 4;
  }
  function setStep(next) { scope.clearAll(); step = Math.max(0, Math.min(4, next)); applyStep(); }
  function play() {
    scope.clearAll();
    step = 0; applyStep();
    const tick = () => { if (step < 4) { step += 1; applyStep(); scope.timeout(tick, 1400); } };
    scope.timeout(tick, 600);
  }

  function renderCompare() {
    compareLayer.replaceChildren();
    axis(compareLayer, 172);
    const a = fiveNumbers(data.A), b = fiveNumbers(data.B);
    drawBox(compareLayer, a, 50, colors.A, false, "A osztály");
    drawBox(compareLayer, b, 112, colors.B, false, "B osztály");
    const iqrA = a.q3 - a.q1, iqrB = b.q3 - b.q1;
    const higher = a.median === b.median ? "Mindkét osztályban ugyanannyi a medián" : `A ${a.median > b.median ? "A" : "B"} osztály mediánja magasabb (${formatNumber(Math.max(a.median, b.median), 1)} a ${formatNumber(Math.min(a.median, b.median), 1)} helyett)`;
    const wider = iqrA === iqrB ? "a dobozok egyforma hosszúak" : `a ${iqrA > iqrB ? "A" : "B"} osztály doboza hosszabb, vagyis ott szórtabbak az eredmények (${formatNumber(Math.max(iqrA, iqrB), 1)} a ${formatNumber(Math.min(iqrA, iqrB), 1)} helyett)`;
    compareText.textContent = `${higher}; ${wider}.`;
  }

  function changed() {
    scope.clearAll();
    classControls.replaceChildren(make("span", "", "Melyik osztály adatait szerkeszted?"), ...["A", "B"].map((c) => toggle(`${c} osztály`, c === current, () => { current = c; changed(); }, colors[c])));
    buildMain(); applyStep(); renderCompare();
  }

  changed();
  return () => scope.clearAll();
}
