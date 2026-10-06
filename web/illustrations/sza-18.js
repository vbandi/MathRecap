import { button, card, controls, createScope, formatNumber, fraction, gcd, keyIdea, lead, make, PALETTE, range, rich, stepper, svg } from "./kit.js";

const LINE_X = 30, LINE_WIDTH = 540, LINE_Y = 95, MAX_DIGITS = 14;

// Long division of |p| by q: list of steps and where the repeating block starts (or -1 if it stops).
function longDivision(p, q) {
  const whole = Math.floor(Math.abs(p) / q);
  let remainder = Math.abs(p) % q;
  const steps = [{ whole, remainder }];
  const digits = [], seen = new Map();
  let repeatStart = -1;
  while (remainder !== 0 && digits.length < MAX_DIGITS) {
    if (seen.has(remainder)) { repeatStart = seen.get(remainder); break; }
    seen.set(remainder, digits.length);
    const scaled = remainder * 10;
    digits.push(Math.floor(scaled / q));
    steps.push({ scaled, digit: digits.at(-1), remainder: scaled % q });
    remainder = scaled % q;
  }
  return { whole, digits, steps, repeatStart, terminating: remainder === 0 };
}

function decimalNode({ whole, digits, repeatStart }, negative) {
  const node = make("span");
  node.append(`${negative ? "−" : ""}${whole}`);
  if (!digits.length) return node;
  node.append(",");
  digits.forEach((digit, index) => {
    const part = make("span", "", String(digit));
    if (repeatStart >= 0 && index >= repeatStart) part.style.cssText = `text-decoration:overline;color:${PALETTE.amber};`;
    node.append(part);
  });
  return node;
}

// Draws a number line of the window [from, to] with integer labels and optional 1/d tick marks.
function drawLine(layer, from, to, gridDenominator, highlight) {
  layer.replaceChildren();
  const toX = (value) => LINE_X + ((value - from) / (to - from)) * LINE_WIDTH;
  svg("line", { x1: LINE_X, x2: LINE_X + LINE_WIDTH, y1: LINE_Y, y2: LINE_Y, class: "axis" }, layer);
  if (gridDenominator && (to - from) * gridDenominator <= 130) {
    for (let k = Math.ceil(from * gridDenominator - 1e-9); k <= Math.floor(to * gridDenominator + 1e-9); k++) {
      svg("line", { x1: toX(k / gridDenominator), x2: toX(k / gridDenominator), y1: LINE_Y - 9, y2: LINE_Y + 9, style: `stroke:${PALETTE.violet};stroke-width:1.5;opacity:.7` }, layer);
    }
  }
  const span = to - from;
  const step = [0.00001, 0.00002, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10].find((s) => span / s <= 11);
  for (let k = Math.ceil(from / step - 1e-9); k <= Math.floor(to / step + 1e-9); k++) {
    const value = k * step;
    svg("line", { x1: toX(value), x2: toX(value), y1: LINE_Y - 14, y2: LINE_Y + 14, class: "axis" }, layer);
    svg("text", { x: toX(value), y: LINE_Y + 34, "text-anchor": "middle", text: formatNumber(value, 6), style: "font-size:11px;fill:var(--dim)" }, layer);
  }
  for (const { value, color, label, above = true } of highlight) {
    if (value < from - 1e-9 || value > to + 1e-9) continue;
    svg("circle", { cx: toX(value), cy: LINE_Y, r: 7, style: `fill:${color};stroke:var(--input);stroke-width:2` }, layer);
    if (label) svg("text", { x: toX(value), y: above ? LINE_Y - 20 : LINE_Y + 54, "text-anchor": "middle", text: label, style: `font-weight:700;fill:${color}` }, layer);
  }
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Racionális számnak hívjuk azt a számot, amely felírható két egész szám hányadosaként, p/q alakban (q nem nulla). Ilyen például a 3/4, a −5/2 és a 7 is (7/1). Mindegyiknek pontos helye van a számegyenesen."));

  const state = { p: 3, q: 8, zoom: 1, multiplier: 1 };
  const main = card("Törtből tizedes tört és számegyenes");
  const pControl = stepper({ label: "Számláló p", min: -20, max: 20, value: state.p, onChange: (v) => { state.p = v; render(); } });
  const qControl = stepper({ label: "Nevező q", min: 1, max: 12, value: state.q, onChange: (v) => { state.q = v; render(); } });
  const fractionLine = make("div", "il-formula start");
  fractionLine.style.fontSize = "22px";
  const stepsList = make("ol", "il-steps");
  stepsList.style.minHeight = "9em";
  const divisionButton = button("Mutasd az osztást", () => animateDivision());
  const divisionMessage = make("p", "il-message");
  main.append(controls(pControl.element, qControl.element), fractionLine, controls(divisionButton), stepsList, divisionMessage);

  const lineCard = card("Hol van a számegyenesen?");
  const zoomSlider = range({ label: "Nagyítás", min: 0, max: 3, value: 1, format: (v) => ["áttekintés", "közel", "közelebb", "még közelebb"][v], onInput: (v) => { state.zoom = v; renderLine(); } });
  const multiplierControl = stepper({ label: "Bővítés", min: 1, max: 5, value: 1, onChange: (v) => { state.multiplier = v; renderLine(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 170", role: "img" }, lineCard);
  const lineLayer = svg("g", {}, figure);
  const equalLine = make("div", "il-formula start");
  const lineMessage = make("p", "il-message");
  lineCard.append(controls(zoomSlider.element, multiplierControl.element), figure, equalLine, lineMessage);

  // Density: halving an interval again and again.
  const densityCard = card("Két racionális szám között mindig van másik");
  const density = { lo: [1, 3], hi: [1, 2], count: 0 };
  const densityFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 170", role: "img" }, densityCard);
  const densityLayer = svg("g", {}, densityFigure);
  const densityLine = make("div", "il-formula start");
  const densityMessage = make("p", "il-message");
  const leftButton = button("Nagyítás a bal felére", () => zoomHalf("lo"));
  const rightButton = button("Nagyítás a jobb felére", () => zoomHalf("hi"));
  densityCard.append(make("p", "", "Keressünk a két szám közt egy újat: a számtani közepüket, vagyis az összegük felét. Aztán nagyítsunk az egyik félre, és ismételjük!"), densityFigure, densityLine, controls(leftButton, rightButton, button("Újra", () => { density.lo = [1, 3]; density.hi = [1, 2]; density.count = 0; renderDensity(); }, { ghost: true })), densityMessage);
  root.append(main, lineCard, densityCard, keyIdea("a racionális számok p/q alakú számok; tizedes tört alakjuk vagy véges, vagy végtelen szakaszos. Egyenlő törtek (1/2 = 2/4 = 3/6) ugyanazt a pontot jelölik, és bármely két racionális szám között végtelen sok másik racionális szám van."));

  function animateDivision() {
    scope.clearAll();
    const result = longDivision(state.p, state.q);
    stepsList.replaceChildren();
    divisionButton.disabled = true;
    let index = 0;
    const addStep = () => {
      const item = result.steps[index];
      const li = make("li", "", index === 0
        ? `${Math.abs(state.p)} : ${state.q} = ${item.whole}, maradék ${item.remainder}`
        : `${item.scaled / 10} · 10 = ${item.scaled}, ${item.scaled} : ${state.q} = ${item.digit}, maradék ${item.remainder}`);
      stepsList.append(li);
      index += 1;
      if (index < result.steps.length) scope.timeout(addStep, 800);
      else scope.timeout(finish, 600);
    };
    const finish = () => {
      divisionButton.disabled = false;
      divisionMessage.className = "il-message good";
      divisionMessage.textContent = result.terminating ? "A maradék 0 lett, az osztás véget ért: a tizedes tört véges."
        : result.repeatStart >= 0 ? `A ${result.steps.at(-1).remainder} maradék már szerepelt, ezért innen ugyanazok a jegyek ismétlődnek (a húzott rész a szakasz).`
          : "Az osztás tovább folytatódik.";
    };
    divisionMessage.className = "il-message";
    divisionMessage.textContent = "";
    addStep();
  }

  function render() {
    scope.clearAll();
    divisionButton.disabled = false;
    const { p, q } = state;
    const result = longDivision(p, q);
    fractionLine.replaceChildren(rich(fraction(p < 0 ? `−${Math.abs(p)}` : p, q), " = ", decimalNode(result, p < 0), result.terminating ? "" : "…"));
    stepsList.replaceChildren();
    divisionMessage.className = "il-message";
    divisionMessage.textContent = "Nyomd meg a gombot, és nézd végig, hogyan jönnek ki a tizedesjegyek.";
    renderLine();
  }

  function renderLine() {
    zoomSlider.set(state.zoom);
    const value = state.p / state.q;
    const widths = [Math.max(6, 2 * Math.ceil(Math.abs(value)) + 2), 2, 0.4, 0.08];
    let from = value - widths[state.zoom] / 2, to = value + widths[state.zoom] / 2;
    if (state.zoom === 0) { from = -widths[0] / 2; to = widths[0] / 2; }
    const k = state.multiplier;
    drawLine(lineLayer, from, to, state.q * k, [{ value, color: PALETTE.red, label: `${state.p}/${state.q}` }]);
    const equalParts = [];
    for (let m = 1; m <= k; m++) equalParts.push(fraction(state.p * m, state.q * m));
    const chain = [];
    equalParts.forEach((part, index) => { if (index) chain.push(" = "); chain.push(part); });
    equalLine.replaceChildren(rich(...chain, ` = ${formatNumber(value, 4)}`));
    lineMessage.className = "il-message";
    lineMessage.textContent = k === 1
      ? `A lila vonalak a ${state.q}-ed részek. Bővíts a számlálóval és a nevezővel, és nézd, mi történik a ponttal!`
      : `Ha a számlálót és a nevezőt is ${k}-val szorozzuk, finomabb beosztást kapunk, de a piros pont ugyanott marad: ugyanaz a szám.`;
  }

  function mid([n1, d1], [n2, d2]) {
    const n = n1 * d2 + n2 * d1, d = 2 * d1 * d2, g = gcd(n, d);
    return [n / g, d / g];
  }

  function zoomHalf(side) {
    const m = mid(density.lo, density.hi);
    if (side === "lo") density.hi = m; else density.lo = m;
    density.count += 1;
    renderDensity();
  }

  function renderDensity() {
    const { lo, hi } = density;
    const m = mid(lo, hi);
    const value = ([n, d]) => n / d;
    drawLine(densityLayer, value(lo), value(hi), 0, [
      { value: value(lo), color: PALETTE.blue, label: `${lo[0]}/${lo[1]}` },
      { value: value(hi), color: PALETTE.green, label: `${hi[0]}/${hi[1]}` },
      { value: value(m), color: PALETTE.red, label: `${m[0]}/${m[1]}`, above: false },
    ]);
    densityLine.replaceChildren(rich("A közepük: (", fraction(...lo), " + ", fraction(...hi), ") : 2 = ", fraction(...m), ` ≈ ${formatNumber(value(m), 6)}`));
    leftButton.disabled = rightButton.disabled = density.count >= 12;
    densityMessage.className = "il-message";
    densityMessage.textContent = density.count >= 12
      ? "Ennyi nagyítás után már nem férne el a kép, de a módszer sosem fogy ki: mindig van újabb szám."
      : `${density.count} nagyítás után az intervallum hossza ${formatNumber(value(hi) - value(lo), 6)}, és még mindig van benne új racionális szám.`;
  }

  render();
  renderDensity();
  return () => scope.clearAll();
}
