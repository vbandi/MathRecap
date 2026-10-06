import { button, card, controls, equation, formatNumber, gcd, keyIdea, lead, make, PALETTE, range, slot, svg, toggle, uniqueId } from "./kit.js";

const UNIT = 28, X_MAX = 10, Y_MAX = 6, PAD = 20;
const WIDTH = 2 * X_MAX * UNIT + 2 * PAD, HEIGHT = 2 * Y_MAX * UNIT + 2 * PAD;
const toX = (x) => PAD + (x + X_MAX) * UNIT;
const toY = (y) => PAD + (Y_MAX - y) * UNIT;
const PRESETS = [
  { name: "Egy megoldás", values: [1, 1, 5, 1, -1, 1] },
  { name: "Párhuzamos", values: [1, 1, 5, 2, 2, 4] },
  { name: "Egybeeső", values: [1, 1, 5, 2, 2, 10] },
];
const n = (value) => formatNumber(value, 2);
const approx = (value) => (Math.abs(value * 100 - Math.round(value * 100)) < 1e-9 ? "" : "≈ ");
const lcm = (p, q) => Math.abs(p * q) / gcd(p, q);

// "2x − 3y = 4", leaving out zero terms and writing coefficient 1 as nothing.
function equationText(a, b, c) {
  const terms = [];
  for (const [coefficient, name] of [[a, "x"], [b, "y"]]) {
    if (!coefficient) continue;
    const size = Math.abs(coefficient) === 1 ? "" : String(Math.abs(coefficient));
    terms.push(terms.length ? ` ${coefficient < 0 ? "−" : "+"} ${size}${name}` : `${coefficient < 0 ? "−" : ""}${size}${name}`);
  }
  return `${terms.join("") || "0"} = ${n(c)}`;
}

function classify([a1, b1, c1, a2, b2, c2]) {
  if ((!a1 && !b1) || (!a2 && !b2)) return { kind: "degenerate" };
  const det = a1 * b2 - a2 * b1;
  if (det !== 0) return { kind: "one", x: (c1 * b2 - c2 * b1) / det, y: (a1 * c2 - a2 * c1) / det };
  return a1 * c2 === a2 * c1 && b1 * c2 === b2 * c1 ? { kind: "same" } : { kind: "parallel" };
}

// Equal-coefficients method on the current system, as a list of text lines.
function solutionSteps([a1, b1, c1, a2, b2, c2], solution) {
  const steps = [{ text: `I.  ${equationText(a1, b1, c1)}\nII. ${equationText(a2, b2, c2)}`, note: "a rendszer" }];
  const x = solution.x, y = solution.y;
  const resultLine = `x = ${approx(x)}${n(x)},  y = ${approx(y)}${n(y)}`;
  if (b1 && b2 || a1 && a2) {
    const eliminateY = Boolean(b1 && b2);
    const [p1, p2, q1, q2] = eliminateY ? [b1, b2, a1, a2] : [a1, a2, b1, b2];
    const L = lcm(p1, p2), m1 = L / p1, m2 = L / p2;
    const [e1, e2] = eliminateY ? [equationText(a1 * m1, b1 * m1, c1 * m1), equationText(a2 * m2, b2 * m2, c2 * m2)] : [equationText(a1 * m1, b1 * m1, c1 * m1), equationText(a2 * m2, b2 * m2, c2 * m2)];
    steps.push({ text: `I.  ${e1}\nII. ${e2}`, note: `I. × ${n(m1)}, II. × ${n(m2)}: ${eliminateY ? "y" : "x"} együtthatója ugyanaz (${n(L)}) lesz` });
    const k = q1 * m1 - q2 * m2, r = c1 * m1 - c2 * m2, other = r / k;
    const name = eliminateY ? "x" : "y", eliminated = eliminateY ? "y" : "x";
    steps.push({ text: `(I. − II.):  ${n(k)}${name} = ${n(r)}   →   ${name} = ${approx(other)}${n(other)}`, note: `kivonás: ${eliminated} eltűnik` });
    const back = eliminateY ? y : x;
    steps.push({ text: `I.-be helyettesítve: ${eliminateY ? `${n(a1)}·${n(other)} + ${n(b1)}y` : `${n(a1)}x + ${n(b1)}·${n(other)}`} = ${n(c1)}   →   ${eliminated} = ${approx(back)}${n(back)}`, note: "visszahelyettesítés" });
  } else {
    steps.push({ text: resultLine, note: "mindkét egyenletben csak egy ismeretlen szerepel, közvetlenül leolvasható" });
  }
  steps.push({ text: resultLine, note: "a megoldás, a két egyenes metszéspontja" });
  return steps;
}

export function mount(root) {
  const state = { values: [1, 1, 5, 1, -1, 1], step: 0 };
  const clipId = uniqueId("system-clip");

  root.append(lead("Egy egyenlet két ismeretlennel végtelen sok (x; y) párral teljesül, és ezek egy egyenesen vannak. Két egyenletnél olyan pár kell, amely mindkettőt kielégíti — vagyis a két egyenes közös pontja."));

  const main = card("Két egyenes, egy megoldás?");
  const names = ["a₁", "b₁", "c₁", "a₂", "b₂", "c₂"];
  const sliders = names.map((label, i) => range({ label, min: i % 3 === 2 ? -10 : -5, max: i % 3 === 2 ? 10 : 5, value: state.values[i], format: String, onInput: (v) => { state.values[i] = v; state.step = 0; render(); } }));
  const presetRow = controls(make("span", "il-muted", "Példák:"), ...PRESETS.map((preset) => button(preset.name, () => { state.values = [...preset.values]; state.step = 0; sliders.forEach((s, i) => s.set(state.values[i])); render(); }, { ghost: true })));
  const rowOne = controls(make("span", "il-muted", "I.:"), ...sliders.slice(0, 3).map((s) => s.element));
  const rowTwo = controls(make("span", "il-muted", "II.:"), ...sliders.slice(3).map((s) => s.element));
  const equationOne = make("div"), equationTwo = make("div");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Két egyenes a koordináta-rendszerben" });
  svg("rect", { x: PAD, y: PAD, width: WIDTH - 2 * PAD, height: HEIGHT - 2 * PAD }, svg("clipPath", { id: clipId }, svg("defs", {}, figure)));
  for (let x = -X_MAX; x <= X_MAX; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: PAD, y2: HEIGHT - PAD, class: x ? "grid" : "axis" }, figure);
    if (x && x % 2 === 0) svg("text", { x: toX(x), y: toY(0) + 15, "text-anchor": "middle", text: formatNumber(x), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  for (let y = -Y_MAX; y <= Y_MAX; y++) {
    svg("line", { x1: PAD, x2: WIDTH - PAD, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    if (y && y % 2 === 0) svg("text", { x: toX(0) - 6, y: toY(y) + 4, "text-anchor": "end", text: formatNumber(y), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  const plot = svg("g", { "clip-path": `url(#${clipId})` }, figure);
  const lines = [PALETTE.blue, PALETTE.amber].map((color) => svg("line", { style: `stroke:${color};stroke-width:3.5` }, plot));
  const marker = svg("g", {}, figure);
  const message = make("p", "il-message");
  main.append(presetRow, rowOne, rowTwo, equationOne, equationTwo, figure, message);

  const method = card("Egyenlő együtthatók módszere");
  const steps = make("ol", "il-steps");
  const nextButton = button("Következő lépés", () => { state.step += 1; renderSteps(); });
  const restartButton = button("Újra", () => { state.step = 0; renderSteps(); }, { ghost: true });
  const methodNote = make("p", "il-message");
  method.append(make("p", "il-muted", "Az egyik ismeretlen együtthatóját ugyanakkorára hozzuk mindkét egyenletben, kivonjuk őket egymásból, és így eltűnik az ismeretlen."), steps, controls(nextButton, restartButton), methodNote);
  root.append(main, method, keyIdea("a megoldás a két egyenes metszéspontja. Ha az egyenesek metszik egymást, pontosan egy megoldás van; ha párhuzamosak, nincs; ha egybeesnek, végtelen sok. Az algebrai módszer ugyanazt a pontot találja meg, amit a rajz mutat."));

  function render() {
    const { values } = state, result = classify(values);
    equationOne.replaceChildren(equation(slot("I.", 4), slot(equationText(values[0], values[1], values[2]), 16, { align: "left" })));
    equationTwo.replaceChildren(equation(slot("II.", 4), slot(equationText(values[3], values[4], values[5]), 16, { align: "left" })));
    equationOne.firstChild.style.color = PALETTE.blue; equationTwo.firstChild.style.color = PALETTE.amber;
    [0, 3].forEach((offset, index) => {
      const [a, b, c] = values.slice(offset, offset + 3), line = lines[index];
      line.style.opacity = a || b ? 1 : 0;
      if (b) {
        line.setAttribute("x1", toX(-X_MAX)); line.setAttribute("y1", toY((c + a * X_MAX) / b));
        line.setAttribute("x2", toX(X_MAX)); line.setAttribute("y2", toY((c - a * X_MAX) / b));
      } else if (a) {
        line.setAttribute("x1", toX(c / a)); line.setAttribute("x2", toX(c / a));
        line.setAttribute("y1", toY(-Y_MAX)); line.setAttribute("y2", toY(Y_MAX));
      }
    });
    lines[1].style.strokeDasharray = result.kind === "same" ? "10 10" : "";
    marker.replaceChildren();
    if (result.kind === "one") {
      const { x, y } = result, inside = Math.abs(x) <= X_MAX && Math.abs(y) <= Y_MAX;
      if (inside) {
        const dashed = "stroke:var(--fg);stroke-width:1.5;stroke-dasharray:5 4";
        svg("line", { x1: toX(x), x2: toX(x), y1: toY(y), y2: toY(0), style: dashed }, marker);
        svg("line", { x1: toX(x), x2: toX(0), y1: toY(y), y2: toY(y), style: dashed }, marker);
        svg("circle", { cx: toX(x), cy: toY(y), r: 7, style: `fill:${PALETTE.green};stroke:var(--input);stroke-width:2` }, marker);
        svg("text", { x: toX(x) + 10, y: toY(y) - 10, text: `(${n(x)}; ${n(y)})`, style: "fill:var(--fg);font-weight:700" }, marker);
      }
      message.className = "il-message good";
      message.textContent = `Egy közös pont van: x = ${approx(x)}${n(x)}, y = ${approx(y)}${n(y)}.${inside ? "" : " A metszéspont a rajzon kívül esik."}`;
    } else {
      message.className = "il-message warn";
      message.textContent = { parallel: "Az egyenesek párhuzamosak: nincs közös pontjuk, tehát az egyenletrendszernek nincs megoldása.", same: "Az egyenesek egybeesnek (a második szaggatott): minden pontjuk közös, végtelen sok megoldás van.", degenerate: "Az egyik egyenletben a és b is 0, ez nem egyenes." }[result.kind];
    }
    renderSteps();
  }

  function renderSteps() {
    const result = classify(state.values);
    steps.replaceChildren();
    if (result.kind !== "one") {
      methodNote.className = "il-message warn";
      methodNote.textContent = result.kind === "degenerate" ? "Előbb állíts be két igazi egyenletet." : "Itt a módszer ellentmondásra (nincs megoldás) vagy azonosságra (végtelen sok megoldás) vezet: az ismeretlenek együtt tűnnek el. Próbáld ki a Példák egyikével!";
      nextButton.disabled = true;
      return;
    }
    const all = solutionSteps(state.values, result);
    for (const step of all.slice(0, state.step + 1)) {
      const item = make("li");
      const pre = make("span", "", step.text);
      pre.style.whiteSpace = "pre";
      item.append(pre, make("div", "il-muted", step.note));
      steps.append(item);
    }
    nextButton.disabled = state.step >= all.length - 1;
    methodNote.className = `il-message ${state.step >= all.length - 1 ? "good" : ""}`;
    methodNote.textContent = state.step >= all.length - 1 ? "Ellenőrzés: ez a pont a rajzon mindkét egyenesen rajta van." : "";
  }

  render();
  return () => {};
}
