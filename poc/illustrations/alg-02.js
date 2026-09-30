import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const BAR_PROBLEMS = [
  { title: "Matricák", text: "Anna háromszor annyi matricát gyűjtött, mint Bence. Együtt 48 matricájuk van. Hány matricája van mindkettőjüknek?",
    bars: [{ name: "Bence", units: 1, extra: 0 }, { name: "Anna", units: 3, extra: 0 }], total: 48, thing: "matrica" },
  { title: "Életkor", text: "Dóra 5 évvel idősebb a testvérénél. Együtt 27 évesek. Hány évesek külön-külön?",
    bars: [{ name: "Testvér", units: 1, extra: 0 }, { name: "Dóra", units: 1, extra: 5 }], total: 27, thing: "év" },
];
const BACKWARD = { title: "Visszafelé gondolkodás", text: "Egy számot megszoroztam 3-mal, hozzáadtam 5-öt, és 26 lett az eredmény. Melyik számra gondoltam?", factor: 3, add: 5, result: 26 };
const PROBLEMS = [...BAR_PROBLEMS, BACKWARD];
const UNIT_WIDTH = 82, EXTRA_WIDTH = 41, LEFT = 90;

function barSteps(problem) {
  const unitCount = problem.bars.reduce((sum, bar) => sum + bar.units, 0);
  const extra = problem.bars.reduce((sum, bar) => sum + bar.extra, 0);
  const unit = (problem.total - extra) / unitCount;
  const [first, second] = problem.bars;
  const values = problem.bars.map((bar) => bar.units * unit + bar.extra);
  return {
    unit, values,
    texts: [
      "Rajzoljuk le a mennyiségeket szakaszokkal: minden egyenlő rész ugyanakkora. A kérdéses rész mérete egyelőre ismeretlen.",
      `A két szakasz együtt ${problem.total}. Ezt jelöli a zárójel a jobb oldalon.`,
      extra
        ? `Van egy ${extra} hosszú, biztosan ismert darab. Ha ezt levesszük, ${problem.total} − ${extra} = ${problem.total - extra} marad, és ezen ${unitCount} egyenlő rész osztozik.`
        : `Az egyenlő részekből összesen ${unitCount} darab van, és ezek együtt ${problem.total} értékűek.`,
      `Egy rész értéke: ${problem.total - extra} : ${unitCount} = ${unit}.`,
      `${first.name}: ${values[0]}, ${second.name}: ${values[1]}. Ellenőrzés: ${values[0]} + ${values[1]} = ${problem.total}${extra ? `, és ${values[1]} − ${values[0]} = ${extra}` : `, és ${values[1]} = ${second.units} · ${values[0]}`}. ✓`,
    ],
  };
}

function backwardSteps({ factor, add, result }) {
  const middle = result - add, start = middle / factor;
  return [
    "Előre haladva: a számot megszorozzuk 3-mal, majd hozzáadunk 5-öt, és 26 lesz. Az elejét nem ismerjük, de a végét igen.",
    `Indulj el visszafelé! Az utolsó lépés +${add} volt, ennek a fordítottja a −${add}: ${result} − ${add} = ${middle}.`,
    `Az előző lépés ·${factor} volt, ennek a fordítottja az osztás: ${middle} : ${factor} = ${start}.`,
    `Ellenőrzés előrefelé: ${start} · ${factor} = ${middle}, ${middle} + ${add} = ${result}. ✓ A gondolt szám: ${start}.`,
  ];
}

export function mount(root) {
  const scope = createScope();
  const state = { problem: 0, step: 0 };

  root.append(lead("A szöveges feladatokban gyakran nem tudod rögtön, mit kell számolni. Segít, ha lerajzolod: a szakaszok hossza mutatja a mennyiségeket, így látszik, mi mivel egyenlő."));

  const main = card("Szakaszos modell lépésről lépésre");
  const picker = controls(...PROBLEMS.map((problem, index) => toggle(problem.title, index === 0, () => { state.problem = index; state.step = 0; render(); })));
  const text = make("p", "", "");
  text.style.fontWeight = "600";
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 230", role: "img" });
  const message = make("p", "il-message");
  const nextButton = button("Következő lépés", () => { state.step += 1; render(); });
  const backButton = button("Vissza", () => { state.step = Math.max(0, state.step - 1); render(); }, { ghost: true });
  const progress = make("span", "il-muted");
  main.append(picker, text, figure, message, controls(nextButton, backButton, progress));
  root.append(main, keyIdea("egy szöveges feladatot nem kell fejben megoldani: rajzold le szakaszokkal, keresd meg az egy egyenlő részhez tartozó értéket, és mindig ellenőrizd a választ az eredeti szöveg alapján. Ha ismert az eredmény, a műveleteket visszafelé, a fordított műveletekkel is végigjárhatod."));

  function drawBars(problem, steps) {
    const { step } = state;
    const count = problem.bars.length;
    const rowHeight = 50, top = 26;
    problem.bars.forEach((bar, row) => {
      const y = top + row * (rowHeight + 18);
      svg("text", { x: 10, y: y + 30, text: bar.name, style: "font-weight:700" }, figure);
      for (let i = 0; i < bar.units; i++) {
        svg("rect", { x: LEFT + i * UNIT_WIDTH, y, width: UNIT_WIDTH - 4, height: rowHeight, rx: 6, style: `fill:${row ? PALETTE.blue : PALETTE.green}` }, figure);
        svg("text", { x: LEFT + i * UNIT_WIDTH + UNIT_WIDTH / 2 - 2, y: y + 31, "text-anchor": "middle", text: step >= 3 ? String(steps.unit) : "?", style: "fill:#fff;font-weight:700;font-size:17px" }, figure);
      }
      if (bar.extra) {
        const x = LEFT + bar.units * UNIT_WIDTH;
        svg("rect", { x, y, width: EXTRA_WIDTH - 4, height: rowHeight, rx: 6, style: `fill:${PALETTE.amber}` }, figure);
        svg("text", { x: x + EXTRA_WIDTH / 2 - 2, y: y + 31, "text-anchor": "middle", text: String(bar.extra), style: "fill:#2a1a00;font-weight:700;font-size:17px" }, figure);
      }
      if (step >= 4) svg("text", { x: LEFT + 4 * UNIT_WIDTH + 14, y: y + 31, text: `= ${steps.values[row]}`, style: "fill:var(--accent);font-weight:700;font-size:17px" }, figure);
    });
    if (step >= 1) {
      const bottom = top + count * rowHeight + (count - 1) * 18, x = 560;
      svg("path", { d: `M ${x - 10} ${top} H ${x} V ${bottom} H ${x - 10}`, fill: "none", style: "stroke:var(--fg-soft);stroke-width:2" }, figure);
      svg("text", { x: x - 6, y: (top + bottom) / 2 + 5, "text-anchor": "end", text: String(problem.total), style: "font-weight:700;font-size:17px;fill:var(--fg)" }, figure);
    }
    if (step === 2) {
      const bottom = top + count * rowHeight + (count - 1) * 18;
      svg("text", { x: LEFT, y: bottom + 34, text: "↑ egyenlő részek", style: "fill:var(--dim)" }, figure);
    }
  }

  function drawBackward(problem) {
    const { step } = state;
    const middle = problem.result - problem.add, start = middle / problem.factor;
    const values = [step >= 2 ? String(start) : "?", step >= 1 ? String(middle) : "?", String(problem.result)];
    const ops = [`· ${problem.factor}`, `+ ${problem.add}`];
    const inverse = [`: ${problem.factor}`, `− ${problem.add}`];
    const xs = [30, 250, 470];
    xs.forEach((x, i) => {
      svg("rect", { x: x - 28, y: 40, width: 76, height: 50, rx: 10, style: `fill:var(--surface);stroke:${i === 2 ? PALETTE.amber : "var(--line-strong)"};stroke-width:2` }, figure);
      svg("text", { x: x + 10, y: 72, "text-anchor": "middle", text: values[i], style: "font-weight:700;font-size:20px;fill:var(--fg)" }, figure);
    });
    for (let i = 0; i < 2; i++) {
      const from = xs[i] + 52, to = xs[i + 1] - 32, mid = (from + to) / 2;
      svg("path", { d: `M ${from} 58 H ${to - 6}`, style: "stroke:var(--fg-soft);stroke-width:2.5", "marker-end": "none" }, figure);
      svg("path", { d: `M ${to - 12} 52 L ${to} 58 L ${to - 12} 64 Z`, style: "fill:var(--fg-soft)" }, figure);
      svg("text", { x: mid, y: 44, "text-anchor": "middle", text: ops[i], style: "font-weight:700;font-size:16px;fill:var(--fg)" }, figure);
      const shown = step >= 1 + (1 - i);
      if (shown) {
        svg("path", { d: `M ${to} 122 H ${from + 6}`, style: `stroke:${PALETTE.pink};stroke-width:2.5` }, figure);
        svg("path", { d: `M ${from + 12} 116 L ${from} 122 L ${from + 12} 128 Z`, style: `fill:${PALETTE.pink}` }, figure);
        svg("text", { x: mid, y: 148, "text-anchor": "middle", text: inverse[i], style: `font-weight:700;font-size:16px;fill:${PALETTE.pink}` }, figure);
      }
    }
    svg("text", { x: 10, y: 20, text: "előre", style: "fill:var(--dim)" }, figure);
    svg("text", { x: 10, y: 118, text: "visszafelé", style: `fill:${PALETTE.pink}` }, figure);
  }

  function render() {
    const problem = PROBLEMS[state.problem];
    picker.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === state.problem)));
    text.textContent = problem.text;
    figure.replaceChildren();
    let texts;
    if (problem === BACKWARD) { texts = backwardSteps(problem); drawBackward(problem); }
    else { const steps = barSteps(problem); texts = steps.texts; drawBars(problem, steps); }
    state.step = Math.min(state.step, texts.length - 1);
    message.textContent = texts[state.step];
    message.className = `il-message ${state.step === texts.length - 1 ? "good" : ""}`;
    nextButton.disabled = state.step >= texts.length - 1;
    backButton.disabled = state.step === 0;
    progress.textContent = `${state.step + 1}. lépés / ${texts.length}`;
  }

  render();
  return () => scope.clearAll();
}
