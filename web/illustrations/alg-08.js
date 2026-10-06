import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, stepper, svg } from "./kit.js";

const STICK = 62, STICK_LEFT = 26, STICK_TOP = 30;
const inBrackets = (value) => (value < 0 ? `(${formatNumber(value)})` : formatNumber(value));

export function mount(root) {
  const scope = createScope();
  const state = { x: 4, a: 3, b: 2, squares: 4, stage: 3 };

  root.append(lead("A betűs kifejezés olyan gép, amely egy számot kap, és a szabálya szerint másik számot ad vissza. A betű (például x) azt a számot jelöli, amit beleteszel. Ha betű helyére számot írsz, kiszámolhatod a kifejezés értékét: ezt hívjuk helyettesítési értéknek."));

  // --- Function machine ---
  const machine = card("Függvénygép");
  const aControl = stepper({ label: "Szorzó", min: 1, max: 5, value: state.a, onChange: (v) => { state.a = v; state.stage = 3; render(); } });
  const bControl = stepper({ label: "Hozzáadott szám", min: -5, max: 9, value: state.b, onChange: (v) => { state.b = v; state.stage = 3; render(); } });
  const xSlider = range({ label: "x értéke", min: -5, max: 10, step: 1, value: state.x, format: (v) => formatNumber(v), onInput: (v) => { state.x = v; state.stage = 3; render(); } });
  const labelLine = make("div", "il-formula");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 130", role: "img" });
  const substitution = make("div");
  const playButton = button("Lépésenként", play, { ghost: true });
  machine.append(controls(aControl.element, bControl.element), labelLine, controls(xSlider.element, playButton), figure, substitution);

  // --- Matchsticks ---
  const sticks = card("Gyufaszál-négyzetek");
  const nSlider = range({ label: "Négyzetek száma (n)", min: 1, max: 8, step: 1, value: state.squares, onInput: (v) => { state.squares = v; renderSticks(); } });
  const stickFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 130", role: "img" });
  const stickLine = make("div");
  const stickMessage = make("p", "il-message");
  sticks.append(make("p", "", "Négyzeteket rakunk egymás mellé úgy, hogy a szomszédos négyzetek közös oldalt használnak."), controls(nSlider.element), stickFigure, stickLine, stickMessage);

  root.append(machine, sticks, keyIdea("a betűs kifejezés egy szabály: a betű helyére bármely számot beírhatod, és a műveleteket a megszokott sorrendben elvégezve megkapod az értékét. A szám előtti szorzó az együttható, a betű nélküli szám az állandó."));

  function termLabels() {
    const { a, b } = state;
    const cell = (text, name, color) => {
      const box = make("span");
      box.style.cssText = "display:inline-flex;flex-direction:column;align-items:center;margin:0 2px;min-width:7ch";
      const top = make("span", "", text);
      top.style.cssText = `color:${color};font-weight:700;font-size:22px`;
      const small = make("span", "il-muted", name);
      small.style.color = color;
      box.append(top, small);
      return box;
    };
    const line = make("span");
    line.append(cell(a === 1 ? "1" : String(a), "együttható", PALETTE.amber), cell("x", "változó", PALETTE.green), cell(`${b < 0 ? "−" : "+"} ${Math.abs(b)}`, "állandó", PALETTE.blue));
    if (a === 1) line.firstChild.firstChild.style.opacity = 0.4;
    labelLine.replaceChildren(rich("y = ", line));
  }

  function render() {
    const { x, a, b, stage } = state;
    const middle = a * x, result = middle + b;
    termLabels();
    figure.replaceChildren();
    const boxes = [
      { x: 10, text: formatNumber(x), title: "bemenet", stage: 0, color: PALETTE.green },
      { x: 175, text: `· ${a}`, title: "szorzás", stage: 1, color: PALETTE.amber },
      { x: 340, text: `${b < 0 ? "−" : "+"} ${Math.abs(b)}`, title: "hozzáadás", stage: 2, color: PALETTE.blue },
      { x: 505, text: formatNumber(result), title: "kimenet", stage: 3, color: "var(--accent)" },
    ];
    boxes.forEach((box, index) => {
      const group = svg("g", { class: "il-fade", opacity: index === 1 || index === 2 ? 1 : (stage >= box.stage ? 1 : 0.25) }, figure);
      const machineBox = index === 1 || index === 2;
      svg("rect", { x: box.x, y: 34, width: 85, height: 56, rx: machineBox ? 6 : 28, style: `fill:${machineBox ? "var(--surface)" : "var(--input)"};stroke:${box.color};stroke-width:3` }, group);
      svg("text", { x: box.x + 42, y: 69, "text-anchor": "middle", text: box.text, style: "font-weight:700;font-size:21px;fill:var(--fg)" }, group);
      svg("text", { x: box.x + 42, y: 112, "text-anchor": "middle", text: box.title, style: "font-size:12px;fill:var(--dim)" }, group);
      if (index < 3) {
        const arrow = svg("g", { class: "il-fade", opacity: stage > index ? 1 : 0.25 }, figure);
        svg("path", { d: `M ${box.x + 92} 62 H ${box.x + 150}`, style: "stroke:var(--fg-soft);stroke-width:2.5" }, arrow);
        svg("path", { d: `M ${box.x + 148} 55 L ${box.x + 160} 62 L ${box.x + 148} 69 Z`, style: "fill:var(--fg-soft)" }, arrow);
        if (index === 1) svg("text", { x: box.x + 125, y: 50, "text-anchor": "middle", text: formatNumber(middle), style: "font-weight:700;fill:var(--fg)" }, arrow);
        if (index === 0) svg("text", { x: box.x + 125, y: 50, "text-anchor": "middle", text: formatNumber(x), style: "font-weight:700;fill:var(--fg)" }, arrow);
      }
    });
    const sign = b < 0 ? "−" : "+", absB = formatNumber(Math.abs(b));
    const details = make("div", "il-formula start");
    const parts = [`${a} · ${inBrackets(x)} ${sign} ${absB}`, `= ${formatNumber(middle)} ${sign} ${absB}`, `= ${formatNumber(result)}`];
    details.textContent = `x = ${formatNumber(x)} esetén: ${parts.slice(0, stage).join(" ")}`;
    substitution.replaceChildren(details);
  }

  function play() {
    scope.clearAll();
    playButton.disabled = true;
    state.stage = 0;
    render();
    [1, 2, 3].forEach((stage, index) => scope.timeout(() => {
      state.stage = stage;
      render();
      if (stage === 3) playButton.disabled = false;
    }, 800 * (index + 1)));
  }

  function renderSticks() {
    const n = state.squares;
    stickFigure.replaceChildren();
    const stick = (x1, y1, x2, y2, color) => {
      svg("line", { x1, y1, x2, y2, "stroke-linecap": "round", style: `stroke:${color};stroke-width:7` }, stickFigure);
      svg("circle", { cx: x1 + (x2 - x1) * 0.02, cy: y1 + (y2 - y1) * 0.02, r: 4.5, style: `fill:${PALETTE.red}` }, stickFigure);
    };
    stick(STICK_LEFT, STICK_TOP, STICK_LEFT, STICK_TOP + STICK, PALETTE.amber);
    for (let i = 0; i < n; i++) {
      const x0 = STICK_LEFT + i * STICK, x1 = x0 + STICK;
      stick(x0, STICK_TOP, x1, STICK_TOP, PALETTE.blue);
      stick(x0, STICK_TOP + STICK, x1, STICK_TOP + STICK, PALETTE.blue);
      stick(x1, STICK_TOP, x1, STICK_TOP + STICK, PALETTE.blue);
    }
    stickFigure.setAttribute("aria-label", `${n} négyzet egymás mellett, összesen ${3 * n + 1} gyufaszálból`);
    stickLine.replaceChildren(equation(rich("gyufaszálak száma = 3 · ", slot(n, 2), " + 1"), rich(slot(3 * n + 1, 3, { align: "left" }))));
    stickMessage.textContent = `Az első szál (narancs) egyszeri, minden négyzethez még 3 szál jön (kék): ${n} négyzet → 3 · ${n} + 1 = ${3 * n + 1} szál.`;
  }

  render();
  renderSticks();
  return () => scope.clearAll();
}
