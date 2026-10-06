import { button, card, controls, createScope, formatNumber, fraction, keyIdea, lead, make, PALETTE, range, rich, stepper, svg } from "./kit.js";

const largestSquareFactor = (n) => {
  for (let k = Math.floor(Math.sqrt(n)); k >= 1; k--) if (n % (k * k) === 0) return k;
  return 1;
};
const isPerfectSquare = (n) => Number.isInteger(Math.sqrt(n));

export function mount(root) {
  const scope = createScope();
  root.append(lead("A gyökvonásnál a szorzat gyöke egyenlő a gyökök szorzatával (nemnegatív számokra). Ezt arra használjuk, hogy a gyökjel alól kihúzzuk a négyzetszám-tényezőket, és hogy a nevezőből eltüntessük a gyököt."));

  // --- Pulling a square out ---
  const state = { n: 72, shown: 4 };
  const pull = card("Négyzetszám kihúzása a gyökjel alól");
  const nSlider = range({ label: "A szám", min: 2, max: 200, value: state.n, format: String, onInput: (v) => { state.n = v; state.shown = 4; render(); } });
  const playButton = button("Mutasd lépésenként", () => play());
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 150", role: "img" }, pull);
  const tiles = svg("g", {}, figure);
  const lines = [0, 1, 2, 3].map(() => { const line = make("div", "il-formula start il-fade"); line.style.fontSize = "20px"; return line; });
  const note = make("p", "il-message");
  const check = make("p", "il-muted");
  pull.append(controls(nSlider.element, playButton), figure, ...lines, note, check);

  function drawTiles(n, k, m) {
    tiles.replaceChildren();
    // k-by-k square (k^2 unit squares, scaled to fit) and m smaller "remaining" tiles.
    const side = 100, cell = side / k;
    svg("rect", { x: 20, y: 25, width: side, height: side, style: `fill:${PALETTE.blue};fill-opacity:.25;stroke:${PALETTE.blue};stroke-width:2` }, tiles);
    if (k > 1 && k <= 12) for (let i = 1; i < k; i++) {
      svg("line", { x1: 20 + i * cell, x2: 20 + i * cell, y1: 25, y2: 25 + side, style: `stroke:${PALETTE.blue};stroke-opacity:.5` }, tiles);
      svg("line", { y1: 25 + i * cell, y2: 25 + i * cell, x1: 20, x2: 20 + side, style: `stroke:${PALETTE.blue};stroke-opacity:.5` }, tiles);
    }
    svg("text", { x: 70, y: 145, "text-anchor": "middle", text: `${k}² = ${k * k}`, style: `fill:${PALETTE.blue};font-weight:700` }, tiles);
    svg("text", { x: 150, y: 82, text: "·", style: "font-size:28px;fill:var(--fg)" }, tiles);
    svg("rect", { x: 175, y: 25, width: side, height: side, style: `fill:${PALETTE.green};fill-opacity:.25;stroke:${PALETTE.green};stroke-width:2` }, tiles);
    svg("text", { x: 225, y: 82, "text-anchor": "middle", text: String(m), style: `fill:${PALETTE.green};font-weight:700;font-size:26px` }, tiles);
    svg("text", { x: 225, y: 145, "text-anchor": "middle", text: "a maradék", style: `fill:${PALETTE.green};font-weight:700` }, tiles);
    svg("text", { x: 330, y: 70, text: `${n} = ${k * k} · ${m}`, style: "font-weight:700;font-size:20px;fill:var(--fg)" }, tiles);
    svg("text", { x: 330, y: 100, text: k > 1 ? `A legnagyobb négyzetszám osztó: ${k * k}` : "Nincs 1-nél nagyobb négyzetszám osztó", style: "font-size:13px" }, tiles);
  }

  function render() {
    scope.clearAll();
    playButton.disabled = false;
    nSlider.set(state.n);
    const n = state.n, k = largestSquareFactor(n), m = n / (k * k);
    drawTiles(n, k, m);
    const coloured = (text, color) => { const s = make("span", "", text); s.style.cssText = `color:${color};font-weight:700;`; return s; };
    const contents = [
      rich(`√${n}`),
      rich("= √(", coloured(String(k * k), PALETTE.blue), " · ", coloured(String(m), PALETTE.green), ")"),
      rich("= √", coloured(String(k * k), PALETTE.blue), " · √", coloured(String(m), PALETTE.green)),
      rich("= ", coloured(String(k), PALETTE.blue), m === 1 ? "" : rich("√", coloured(String(m), PALETTE.green))),
    ];
    lines.forEach((line, index) => { line.replaceChildren(contents[index]); line.style.opacity = index < state.shown ? 1 : 0; });
    if (m === 1) lines[3].replaceChildren(rich("= ", coloured(String(k), PALETTE.blue), "   (négyzetszám, a gyök egész)"));
    if (k === 1 && m > 1) lines[3].replaceChildren(rich("= √", coloured(String(m), PALETTE.green), "   (nem egyszerűsíthető tovább)"));
    note.className = "il-message";
    note.textContent = m === 1 ? `${n} négyzetszám, ezért a gyök ki is jön: √${n} = ${k}.`
      : k === 1 ? `${n} osztói között nincs 1-nél nagyobb négyzetszám, ezért √${n} már a legegyszerűbb alakban van.`
        : `${k * k} négyzetszám, gyöke ${k}: ez kijön a gyökjel elé. A maradék ${m} marad alatta.`;
    check.textContent = `Ellenőrzés számmal: √${n} ≈ ${formatNumber(Math.sqrt(n), 4)}, ${k > 1 && m > 1 ? `${k} · √${m} ≈ ${k} · ${formatNumber(Math.sqrt(m), 4)} ≈ ${formatNumber(k * Math.sqrt(m), 4)}` : `${k} ${m > 1 ? `· √${m}` : ""} ≈ ${formatNumber(k * Math.sqrt(m), 4)}`}.`;
  }

  function play() {
    render();
    state.shown = 1;
    lines.forEach((line, index) => { line.style.opacity = index < 1 ? 1 : 0; });
    playButton.disabled = true;
    let step = 1;
    const advance = () => {
      if (step >= 4) { state.shown = 4; playButton.disabled = false; return; }
      scope.timeout(() => { lines[step].style.opacity = 1; step += 1; advance(); }, 1100);
    };
    advance();
  }

  // --- Rationalising ---
  const rationalise = card("Gyöktelenítés: szorzás 1-gyel");
  const rState = { numerator: 1, radicand: 2 };
  const numeratorControl = stepper({ label: "Számláló", min: 1, max: 9, value: 1, onChange: (v) => { rState.numerator = v; renderRationalise(); } });
  const radicandControl = stepper({ label: "Gyök alatt", min: 2, max: 20, value: 2, onChange: (v) => { rState.radicand = v; renderRationalise(); } });
  const rLines = [make("div", "il-formula start"), make("div", "il-formula start"), make("div", "il-formula start")];
  rLines.forEach((line) => { line.style.fontSize = "20px"; });
  const rNote = make("p", "il-message");
  rationalise.append(controls(numeratorControl.element, radicandControl.element), ...rLines, rNote);

  function renderRationalise() {
    const { numerator: c, radicand: a } = rState;
    const exact = Math.sqrt(a);
    rLines[0].replaceChildren(rich(fraction(c, `√${a}`), " = ", fraction(c, `√${a}`), " · ", fraction(`√${a}`, `√${a}`), "   (ez 1-gyel szorzás)"));
    if (isPerfectSquare(a)) {
      rLines[1].replaceChildren(rich(fraction(c, `√${a}`), " = ", fraction(c, exact)));
      rLines[2].textContent = "";
      rNote.textContent = `${a} négyzetszám, így √${a} = ${exact} egész, nincs mit gyöktelenítenünk.`;
    } else {
      rLines[1].replaceChildren(rich("= ", fraction(`${c}·√${a}`, `√${a}·√${a}`), " = ", fraction(`${c === 1 ? "" : c}√${a}`, a)));
      rLines[2].textContent = `Számmal: ${c}/√${a} ≈ ${formatNumber(c / exact, 4)}, ${c === 1 ? "" : `${c}·`}√${a}/${a} ≈ ${formatNumber((c * exact) / a, 4)}.`;
      rNote.textContent = `A √${a} · √${a} = ${a}, ezért a nevezőből eltűnt a gyök. Az érték nem változott, mert 1-gyel szoroztunk.`;
    }
  }

  // --- Numeric check of the product rule ---
  const numeric = card("Ellenőrizd: mikor igaz az azonosság?");
  const nState = { a: 8, b: 18 };
  const aControl = stepper({ label: "a", min: 1, max: 50, value: 8, onChange: (v) => { nState.a = v; renderNumeric(); } });
  const bControl = stepper({ label: "b", min: 1, max: 50, value: 18, onChange: (v) => { nState.b = v; renderNumeric(); } });
  const numericLines = [make("div", "il-formula start"), make("div", "il-formula start"), make("div", "il-formula start")];
  numeric.append(controls(aControl.element, bControl.element), ...numericLines);
  root.append(pull, rationalise, numeric, keyIdea("√(a · b) = √a · √b (a, b ≥ 0), és √(a : b) = √a : √b (b > 0). Összeadásra ilyen azonosság nincs: √(a + b) általában nem egyenlő √a + √b-vel."));

  function renderNumeric() {
    const { a, b } = nState;
    numericLines[0].textContent = `√${a} · √${b} ≈ ${formatNumber(Math.sqrt(a) * Math.sqrt(b), 4)}`;
    numericLines[1].textContent = `√(${a} · ${b}) = √${a * b} ≈ ${formatNumber(Math.sqrt(a * b), 4)}   → egyenlők`;
    numericLines[2].textContent = `Viszont √(${a} + ${b}) ≈ ${formatNumber(Math.sqrt(a + b), 4)}, és √${a} + √${b} ≈ ${formatNumber(Math.sqrt(a) + Math.sqrt(b), 4)}   → nem egyenlők`;
    numericLines[2].style.color = PALETTE.amber;
  }

  render();
  renderRationalise();
  renderNumeric();
  return () => scope.clearAll();
}
