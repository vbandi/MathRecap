import { button, card, controls, createScope, gcd, keyIdea, lead, make, PALETTE, range, stepper, svg, withInstrumental } from "./kit.js";

const SIZE = 20, CELL = 20, GRID_X = 34, GRID_Y = 8;
const PRIME_COLORS = { 2: PALETTE.red, 3: PALETTE.blue, 5: PALETTE.green, 7: PALETTE.amber, 11: PALETTE.violet, 13: PALETTE.pink };
const PRESETS = [[3, 4], [2, 6], [4, 6], [5, 8]];

const lcm = (a, b) => (a * b) / gcd(a, b);
function primeList(n) {
  const list = [];
  for (let p = 2; n > 1; p++) while (n % p === 0) { list.push(p); n /= p; }
  return list;
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Két szám relatív prím, ha nincs közös osztójuk az 1-en kívül, vagyis legnagyobb közös osztójuk 1. Ez akkor is igaz, ha egyik sem prím: a 8 és a 15 is relatív prím. Ezen múlik, hogy mikor elég két kisebb oszthatósági szabályt ellenőrizni."));

  const state = { a: 8, b: 15 };
  const main = card("Kattints egy párra a rácson");
  main.append(make("p", "il-muted", "A kék mezőkben a két szám relatív prím (LNKO = 1), a halványakban van közös osztó."));
  const aControl = stepper({ label: "a", min: 1, max: SIZE, value: state.a, onChange: (v) => { state.a = v; render(); } });
  const bControl = stepper({ label: "b", min: 1, max: SIZE, value: state.b, onChange: (v) => { state.b = v; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 440 420", role: "img", style: "max-width:460px" }, main);
  const cells = [];
  for (let a = 1; a <= SIZE; a++) for (let b = 1; b <= SIZE; b++) {
    const coprime = gcd(a, b) === 1;
    const cell = svg("rect", { x: GRID_X + (a - 1) * CELL, y: GRID_Y + (b - 1) * CELL, width: CELL - 1, height: CELL - 1, rx: 3, style: `fill:${coprime ? PALETTE.blue : "var(--surface)"};fill-opacity:${coprime ? 0.75 : 1};cursor:pointer` }, figure);
    cell.addEventListener("click", () => { state.a = a; state.b = b; render(); });
    cells.push({ a, b, cell });
  }
  for (const v of [1, 5, 10, 15, 20]) {
    svg("text", { x: GRID_X + (v - 1) * CELL + CELL / 2, y: GRID_Y + SIZE * CELL + 16, "text-anchor": "middle", text: String(v), style: "font-size:11px;fill:var(--dim)" }, figure);
    svg("text", { x: GRID_X - 6, y: GRID_Y + (v - 1) * CELL + 14, "text-anchor": "end", text: String(v), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  svg("text", { x: GRID_X + (SIZE * CELL) / 2, y: GRID_Y + SIZE * CELL + 34, "text-anchor": "middle", text: "a", style: "font-style:italic" }, figure);
  svg("text", { x: 8, y: GRID_Y + (SIZE * CELL) / 2, text: "b", style: "font-style:italic" }, figure);
  const selection = svg("rect", { width: CELL + 3, height: CELL + 3, rx: 4, fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3;pointer-events:none` }, figure);
  const chipFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 110", role: "img" }, main);
  const chipLayer = svg("g", {}, chipFigure);
  const message = make("p", "il-message");
  main.append(controls(aControl.element, bControl.element), figure, chipFigure, message);

  // --- Composite divisibility ---
  const checker = card("Összetett oszthatóság: elég-e két szabály?");
  checker.append(make("p", "", "Például egy szám akkor osztható 12-vel, ha 3-mal és 4-gyel is osztható. Miért nem jó ugyanez a 2 és a 6 esetén?"));
  const cState = { d1: 3, d2: 4, n: 36 };
  const d1Control = stepper({ label: "Első osztó", min: 2, max: 12, value: cState.d1, onChange: (v) => { cState.d1 = v; renderChecker(); } });
  const d2Control = stepper({ label: "Második osztó", min: 2, max: 12, value: cState.d2, onChange: (v) => { cState.d2 = v; renderChecker(); } });
  const nSlider = range({ label: "A szám", min: 1, max: 200, value: cState.n, format: String, onInput: (v) => { cState.n = v; renderChecker(); } });
  const presetButtons = PRESETS.map(([x, y]) => button(`${x} és ${y}`, () => { cState.d1 = x; cState.d2 = y; renderChecker(); }, { ghost: true }));
  const verdictLines = [make("div", "il-formula start"), make("div", "il-formula start"), make("div", "il-formula start")];
  const checkerMessage = make("p", "il-message");
  checker.append(controls(d1Control.element, d2Control.element), controls(make("span", "il-muted", "Példák:"), ...presetButtons), controls(nSlider.element),
    ...verdictLines, controls(button("Keress ellenpéldát", () => findCounterexample())), checkerMessage);
  root.append(main, checker, keyIdea("ha két szám relatív prím, akkor egy szám pontosan akkor osztható mindkettővel, ha a szorzatukkal is osztható (például 12 = 3 · 4). Ha van közös osztójuk, ez nem igaz: 18 osztható 2-vel és 6-tal is, de 12-vel nem."));

  function chipRow(list, y, other, label) {
    svg("text", { x: 14, y: y + 5, text: label, style: "font-weight:700;fill:var(--fg)" }, chipLayer);
    const remaining = [...other];
    if (!list.length) svg("text", { x: 130, y: y + 5, text: "(nincs prímtényező)", style: "font-size:12px" }, chipLayer);
    list.forEach((prime, index) => {
      const at = remaining.indexOf(prime);
      const shared = at >= 0;
      if (shared) remaining.splice(at, 1);
      const x = 135 + index * 36;
      svg("circle", { cx: x, cy: y, r: 14, style: `fill:${PRIME_COLORS[prime] ?? "var(--dim)"};stroke:${shared ? "var(--fg)" : "var(--input)"};stroke-width:${shared ? 3 : 2};stroke-dasharray:${shared ? "4 2" : "none"}` }, chipLayer);
      svg("text", { x, y: y + 5, "text-anchor": "middle", text: String(prime), style: "fill:#fff;font-weight:700;font-size:13px" }, chipLayer);
    });
  }

  function render() {
    aControl.set(state.a); bControl.set(state.b);
    const { a, b } = state;
    selection.setAttribute("x", GRID_X + (a - 1) * CELL - 1.5); selection.setAttribute("y", GRID_Y + (b - 1) * CELL - 1.5);
    const factorsA = primeList(a), factorsB = primeList(b);
    chipLayer.replaceChildren();
    chipRow(factorsA, 32, factorsB, `a = ${a}`);
    chipRow(factorsB, 80, factorsA, `b = ${b}`);
    const g = gcd(a, b);
    message.className = g === 1 ? "il-message good" : "il-message";
    message.textContent = g === 1
      ? `${a} és ${b} relatív prímek: a prímtényezőik között nincs átfedés, az LNKO 1.`
      : `${a} és ${b} nem relatív prímek: a szaggatott keretű prímtényezők közösek, közös prímtényezőik szorzata ${g}, ez az LNKO.`;
  }

  function renderChecker() {
    d1Control.set(cState.d1); d2Control.set(cState.d2); nSlider.set(cState.n);
    const { d1, d2, n } = cState;
    const product = d1 * d2, both = n % d1 === 0 && n % d2 === 0, byProduct = n % product === 0;
    verdictLines[0].textContent = `${n} ${n % d1 === 0 ? "osztható" : "nem osztható"} ${d1}-gyel`.replace(/(\d+)-gyel/, (m, x) => withInstrumental(Number(x)));
    verdictLines[1].textContent = `${n} ${n % d2 === 0 ? "osztható" : "nem osztható"} ${withInstrumental(d2)}`;
    verdictLines[2].textContent = `${n} ${byProduct ? "osztható" : "nem osztható"} ${withInstrumental(product)}  (${d1} · ${d2} = ${product})`;
    verdictLines[2].style.color = both && !byProduct ? PALETTE.red : "";
    const relative = gcd(d1, d2) === 1;
    checkerMessage.className = "il-message";
    checkerMessage.textContent = relative
      ? `${d1} és ${d2} relatív prímek, ezért a két szabály együtt pontosan ${withInstrumental(product)} való oszthatóságot jelenti.`
      : `${d1} és ${d2} nem relatív prímek (LNKO = ${gcd(d1, d2)}): a két szabály együtt csak azt jelenti, hogy a szám ${lcm(d1, d2)} többszöröse (LKKT). ${product} többszörösének ez kevés.`;
  }


  function findCounterexample() {
    const { d1, d2 } = cState;
    for (let n = 1; n <= 200; n++) {
      if (n % d1 === 0 && n % d2 === 0 && n % (d1 * d2) !== 0) {
        cState.n = n; renderChecker();
        checkerMessage.className = "il-message warn";
        checkerMessage.textContent = `Ellenpélda: ${n} osztható ${withInstrumental(d1)} és ${withInstrumental(d2)} is, de ${withInstrumental(d1 * d2)} nem. A közös osztó (${gcd(d1, d2)}) miatt a két szabály részben ugyanazt mondja.`;
        return;
      }
    }
    checkerMessage.className = "il-message good";
    checkerMessage.textContent = `200-ig nincs ellenpélda, és nem is lehet: ${d1} és ${d2} relatív prímek, ezért minden mindkettővel osztható szám osztható ${withInstrumental(d1 * d2)} is.`;
  }

  render();
  renderChecker();
  return () => scope.clearAll();
}
