import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const op = (kind, n) => {
  if (kind === "mul") return { label: `· ${n}`, inverse: `: ${n}`, forward: (v) => v * n, backward: (v) => v / n };
  if (kind === "div") return { label: `: ${n}`, inverse: `· ${n}`, forward: (v) => v / n, backward: (v) => v * n };
  if (kind === "add") return { label: `+ ${n}`, inverse: `− ${n}`, forward: (v) => v + n, backward: (v) => v - n };
  return { label: `− ${n}`, inverse: `+ ${n}`, forward: (v) => v - n, backward: (v) => v + n };
};
const EQUATIONS = [
  { text: "(3x + 5) : 2 = 10", ops: [op("mul", 3), op("add", 5), op("div", 2)], x: 5 },
  { text: "2x − 3 = 9", ops: [op("mul", 2), op("sub", 3)], x: 6 },
  { text: "(x − 4) · 5 = 30", ops: [op("sub", 4), op("mul", 5)], x: 10 },
  { text: "3x + 2 = x + 10", both: true, left: [op("mul", 3), op("add", 2)], right: [op("add", 10)] },
];
const NODE = { width: 70, height: 44 };

export function mount(root) {
  const scope = createScope();
  const state = { equation: 0, step: 0 };

  root.append(lead("Ha az ismeretlen egyszer szerepel az egyenletben, képzelheted gépsornak: az x végigmegy néhány művelet-gépen, és a végén kijön az eredmény. A megoldáshoz fordítva kell végigmenni a soron, minden műveletnek a fordítottját használva."));

  const main = card("Lebontogatás visszafelé");
  const picker = controls(...EQUATIONS.map((equation, index) => toggle(equation.text, index === 0, () => { state.equation = index; state.step = 0; scope.clearAll(); render(); })));
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 230", role: "img" });
  const message = make("p", "il-message");
  const nextButton = button("Következő lépés", () => { state.step += 1; render(); });
  const demoButton = button("Mutasd meg", demo, { ghost: true });
  const resetButton = button("Újra", () => { scope.clearAll(); state.step = 0; render(); }, { ghost: true });
  main.append(picker, figure, message, controls(nextButton, demoButton, resetButton));
  root.append(main, keyIdea("ha az x csak egyszer szerepel, az egyenletet megoldhatod úgy, hogy az eredménytől indulva sorban visszacsinálod a műveleteket: a szorzás fordítottja az osztás, az összeadás fordítottja a kivonás. Ha az x két helyen is szerepel, ez a módszer nem elég, ott a mérlegelvre van szükség."));

  function drawChain(y, ops, values, backSteps) {
    const count = ops.length + 1;
    const gap = (560 - count * NODE.width) / (count - 1);
    const left = (i) => 20 + i * (NODE.width + gap);
    values.forEach((value, i) => {
      const known = value !== null;
      svg("rect", { x: left(i), y, width: NODE.width, height: NODE.height, rx: 22, style: `fill:var(--input);stroke:${i === 0 ? PALETTE.green : i === count - 1 ? PALETTE.amber : "var(--line-strong)"};stroke-width:2.5` }, figure);
      svg("text", { x: left(i) + NODE.width / 2, y: y + 29, "text-anchor": "middle", text: value === "x" ? "x" : known ? formatNumber(value) : "?", style: `font-weight:700;font-size:19px;fill:${known ? "var(--fg)" : "var(--dim)"}` }, figure);
    });
    ops.forEach((operation, i) => {
      const from = left(i) + NODE.width + 6, to = left(i + 1) - 8, middle = (from + to) / 2;
      svg("path", { d: `M ${from} ${y + 15} H ${to - 10}`, style: "stroke:var(--fg-soft);stroke-width:2.5" }, figure);
      svg("path", { d: `M ${to - 12} ${y + 8} L ${to} ${y + 15} L ${to - 12} ${y + 22} Z`, style: "fill:var(--fg-soft)" }, figure);
      svg("text", { x: middle, y: y + 4, "text-anchor": "middle", text: operation.label, style: "font-weight:700;font-size:16px;fill:var(--fg)" }, figure);
      if (backSteps > ops.length - 1 - i) {
        svg("path", { d: `M ${to} ${y + 32} H ${from + 10}`, style: `stroke:${PALETTE.pink};stroke-width:2.5` }, figure);
        svg("path", { d: `M ${from + 12} ${y + 25} L ${from} ${y + 32} L ${from + 12} ${y + 39} Z`, style: `fill:${PALETTE.pink}` }, figure);
        svg("text", { x: middle, y: y + 58, "text-anchor": "middle", text: operation.inverse, style: `font-weight:700;font-size:16px;fill:${PALETTE.pink}` }, figure);
      }
    });
  }

  function render() {
    const equation = EQUATIONS[state.equation];
    picker.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === state.equation)));
    figure.replaceChildren();
    if (equation.both) {
      drawChain(24, equation.left, ["x", null, null], 0);
      drawChain(134, equation.right, ["x", null], 0);
      svg("text", { x: 590, y: 120, "text-anchor": "end", text: "az eredményeknek egyenlőnek kell lenniük, de egyik sem ismert", style: "fill:var(--warn)" }, figure);
      message.className = "il-message warn";
      message.textContent = "Itt az x két gépsoron is átmegy, és a két vég egyik értékét sem ismerjük. Nincs honnan elindulni visszafelé: ezt a módszert itt nem tudjuk alkalmazni. Ehhez a mérlegelv kell (előbb mindkét oldalról elveszünk x-et).";
      nextButton.disabled = true; demoButton.disabled = true;
      return;
    }
    const { ops, x } = equation;
    const forwardValues = [x];
    for (const operation of ops) forwardValues.push(operation.forward(forwardValues.at(-1)));
    const step = Math.min(state.step, ops.length);
    const values = forwardValues.map((value, index) => (index === 0 ? (step === ops.length ? x : "x") : index >= ops.length - step ? value : null));
    values[ops.length] = forwardValues[ops.length];
    drawChain(70, ops, values, step);
    svg("text", { x: 20, y: 40, text: "előre", style: "fill:var(--dim)" }, figure);
    svg("text", { x: 20, y: 185, text: "visszafelé: a végeredménytől indulunk", style: `fill:${PALETTE.pink}` }, figure);
    if (step === 0) message.textContent = `A gépsor: az x végigmegy a műveleteken, és ${formatNumber(forwardValues.at(-1))} jön ki. Az utolsó lépéstől kezdve megfordítjuk a műveleteket.`;
    else if (step <= ops.length) {
      const operation = ops[ops.length - step], from = forwardValues[ops.length - step + 1], to = forwardValues[ops.length - step];
      const line = `${formatNumber(from)} ${operation.inverse} = ${formatNumber(to)}. Az előre végzett ${operation.label} művelet fordítottját használtuk.`;
      message.textContent = line;
    }
    if (step === ops.length) {
      const check = forwardValues.map((value, i) => formatNumber(value)).join(" → ");
      message.textContent = `${message.textContent} x = ${formatNumber(x)}. Ellenőrzés előrefelé: ${check}, az eredmény tényleg ${formatNumber(forwardValues.at(-1))}. ✓`;
    }
    message.className = `il-message ${step === ops.length ? "good" : ""}`;
    nextButton.disabled = step >= ops.length;
    demoButton.disabled = false;
  }

  function demo() {
    scope.clearAll();
    const steps = EQUATIONS[state.equation].ops.length;
    state.step = 0;
    render();
    for (let i = 1; i <= steps; i++) scope.timeout(() => { state.step = i; render(); }, 1000 * i);
  }

  render();
  return () => scope.clearAll();
}
