import { button, card, controls, createScope, gcd, keyIdea, lead, make, PALETTE, stepper, svg } from "./kit.js";

const divisorsOf = (n) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0);
const lcm = (a, b) => (a * b) / gcd(a, b);
const LINE_LIMIT = 60, FROG_LIMIT = 72, X0 = 24, X_SPAN = 552;

export function mount(root) {
  const scope = createScope();
  root.append(lead("Az osztó olyan szám, amellyel egy szám maradék nélkül osztható. A többszörös az, amit a szám szorzótáblájában találsz. A két fogalom egymás tükörképe: ha 3 osztója 12-nek, akkor 12 többszöröse 3-nak."));

  // --- Rectangles ---
  const rectangles = card("Osztók: téglalapok kirakása");
  let n = 12;
  const tileStepper = stepper({ label: "Kis négyzetek száma", min: 1, max: 36, value: n, onChange: (value) => { n = value; renderRectangles(); } });
  const shapes = make("div", "il-controls");
  shapes.style.cssText = "align-items:flex-end;gap:14px 26px;min-height:150px";
  const divisorLine = make("p", "il-message");
  rectangles.append(controls(tileStepper.element), make("p", "il-muted", "Hányféle téglalapot rakhatsz ki az összes négyzetből, hézag és maradék nélkül? (Az a × b és a b × a ugyanaz a téglalap elforgatva.)"), shapes, divisorLine);
  function renderRectangles() {
    const divisors = divisorsOf(n), cell = n > 24 ? 10 : 14;
    shapes.replaceChildren();
    divisors.filter((d) => d * d <= n).forEach((a) => {
      const b = n / a, box = make("div");
      box.style.textAlign = "center";
      const figure = svg("svg", { width: b * cell + 2, height: a * cell + 2, viewBox: `0 0 ${b * cell + 2} ${a * cell + 2}`, role: "img", "aria-label": `${a} sor, ${b} oszlop` }, box);
      for (let r = 0; r < a; r++) for (let c = 0; c < b; c++) svg("rect", { x: c * cell + 1, y: r * cell + 1, width: cell - 2, height: cell - 2, rx: 2, style: `fill:${PALETTE.blue};opacity:.9` }, figure);
      box.append(make("div", "il-muted", `${a} · ${b}`));
      shapes.append(box);
    });
    divisorLine.className = "il-message good";
    divisorLine.textContent = `${n} osztói: ${divisors.join(", ")}. Összesen ${divisors.length} osztó.${divisors.length === 2 ? ` Csak az 1 · ${n} téglalap fér ki, ezért ${n} prímszám.` : ""}`;
  }

  // --- Multiples as hops ---
  const hops = card("Többszörösök: ugrások a számegyenesen");
  let hopSize = 4;
  const hopStepper = stepper({ label: "Ugrás hossza", min: 1, max: 12, value: hopSize, onChange: (value) => { hopSize = value; renderHops(); } });
  const hopFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 150", role: "img" });
  const hopLine = make("p", "il-message");
  hops.append(controls(hopStepper.element, button("Ugorj!", () => renderHops(true))), hopFigure, hopLine);
  const xOf = (value, limit) => X0 + (value / limit) * X_SPAN;
  function renderHops(animate = false) {
    hopFigure.replaceChildren();
    const x = (value) => xOf(value, LINE_LIMIT);
    svg("line", { x1: X0 - 6, x2: X0 + X_SPAN + 6, y1: 100, y2: 100, class: "axis" }, hopFigure);
    for (let v = 0; v <= LINE_LIMIT; v += 5) {
      svg("line", { x1: x(v), x2: x(v), y1: 96, y2: 104, class: "axis" }, hopFigure);
      if (v % 10 === 0) svg("text", { x: x(v), y: 122, "text-anchor": "middle", text: v, style: "font-size:12px" }, hopFigure);
    }
    const multiples = [];
    for (let m = 0; m <= LINE_LIMIT; m += hopSize) multiples.push(m);
    const parts = [];
    multiples.forEach((m, index) => {
      const group = svg("g", { class: "il-fade", opacity: animate ? 0 : 1 }, hopFigure);
      if (index > 0) {
        const from = x(m - hopSize), to = x(m);
        svg("path", { d: `M ${from} 98 Q ${(from + to) / 2} ${100 - Math.min(70, (to - from) * 0.8)} ${to} 98`, style: `fill:none;stroke:${PALETTE.green};stroke-width:2.5` }, group);
      }
      svg("circle", { cx: x(m), cy: 100, r: 5.5, style: `fill:${PALETTE.amber}` }, group);
      svg("text", { x: x(m), y: 86, "text-anchor": "middle", text: m, style: `font-size:${hopSize > 2 ? 13 : 10}px;font-weight:700;fill:${PALETTE.amber}` }, group);
      parts.push(group);
    });
    if (animate) parts.forEach((group, index) => scope.timeout(() => group.setAttribute("opacity", 1), index * 320));
    hopLine.className = "il-message good";
    hopLine.textContent = `${hopSize} többszörösei: ${multiples.slice(1, 9).join(", ")}${multiples.length > 9 ? " és így tovább" : ""}. Ezekre érkezel, ha mindig ugyanakkorát ugrasz, nullától indulva.`;
  }

  // --- Two frogs ---
  const frogs = card("Két béka: közös többszörösök és közös osztók");
  const frogState = { a: 4, b: 6 };
  const frogFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 190", role: "img" });
  const frogInfo = make("p", "il-message");
  frogInfo.style.minHeight = "5.2em";
  frogs.append(controls(stepper({ label: "Piros béka ugrása", min: 2, max: 9, value: frogState.a, onChange: (v) => { frogState.a = v; renderFrogs(); } }).element, stepper({ label: "Kék béka ugrása", min: 2, max: 9, value: frogState.b, onChange: (v) => { frogState.b = v; renderFrogs(); } }).element), frogFigure, frogInfo);
  function renderFrogs() {
    const { a, b } = frogState, x = (value) => xOf(value, FROG_LIMIT), common = lcm(a, b);
    frogFigure.replaceChildren();
    const lines = [[a, 60, PALETTE.red], [b, 140, PALETTE.blue]];
    for (let v = common; v <= FROG_LIMIT; v += common) {
      svg("line", { x1: x(v), x2: x(v), y1: 34, y2: 170, style: `stroke:${PALETTE.amber};stroke-width:3;opacity:.5` }, frogFigure);
      svg("text", { x: x(v), y: 184, "text-anchor": "middle", text: v, style: `font-size:13px;font-weight:700;fill:${PALETTE.amber}` }, frogFigure);
    }
    for (const [step, y, color] of lines) {
      svg("line", { x1: X0 - 6, x2: X0 + X_SPAN + 6, y1: y, y2: y, class: "axis" }, frogFigure);
      for (let v = 0; v <= FROG_LIMIT; v += step) {
        const isCommon = v > 0 && v % common === 0;
        svg("circle", { cx: x(v), cy: y, r: isCommon ? 7 : 4.5, style: `fill:${isCommon ? PALETTE.amber : color}` }, frogFigure);
        if (v > 0) svg("text", { x: x(v), y: y - 13, "text-anchor": "middle", text: v, style: `font-size:11px;fill:${color}` }, frogFigure);
      }
    }
    const commonMultiples = []; for (let v = common; v <= FROG_LIMIT && commonMultiples.length < 4; v += common) commonMultiples.push(v);
    const commonDivisors = divisorsOf(gcd(a, b));
    frogInfo.className = "il-message good";
    frogInfo.textContent = `Ugyanoda ér mindkét béka: ${commonMultiples.join(", ")}${common * 4 <= FROG_LIMIT ? " és így tovább" : ""}. A legkisebb közös többszörös: ${common}. Közös osztók: ${commonDivisors.join(", ")}. A legnagyobb közös osztó: ${commonDivisors.at(-1)}.`;
  }

  root.append(rectangles, hops, frogs, keyIdea("az osztók és a többszörösök összetartoznak: ha a · b = n, akkor a és b is osztója n-nek, n pedig többszöröse mindkettőnek. Két szám közös többszörösei ott vannak, ahol mindkét béka leér, a közös osztói pedig azok a számok, amelyek mindkettőt maradék nélkül osztják."));
  renderRectangles(); renderHops(); renderFrogs();
  return () => scope.clearAll();
}
