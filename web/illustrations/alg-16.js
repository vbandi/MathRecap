import { button, card, controls, equation, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const BASE_SETS = [
  { id: "N", name: "ℕ", description: "természetes számok (0, 1, 2, …)", has: (v) => Number.isInteger(v) && v >= 0 },
  { id: "Z", name: "ℤ", description: "egész számok", has: (v) => Number.isInteger(v) },
  { id: "R", name: "ℝ", description: "valós számok", has: () => true },
];
const EQUATIONS = [
  { text: "x² = 4", roots: [{ v: -2, label: "−2" }, { v: 2, label: "2" }] },
  { text: "2x = 5", roots: [{ v: 2.5, label: "2,5" }] },
  { text: "x + 3 = 1", roots: [{ v: -2, label: "−2" }] },
  { text: "x² = 2", roots: [{ v: -Math.SQRT2, label: "−√2" }, { v: Math.SQRT2, label: "√2" }] },
];

const eq = (text, holds) => ({ text, holds });
const SCENARIOS = [
  {
    name: "Összevonás, osztás",
    start: eq("2x + 3 = 7", (x) => 2 * x + 3 === 7),
    steps: [
      { op: "Mindkét oldalból kivonunk 3-at", to: eq("2x = 4", (x) => 2 * x === 4), equivalent: true, why: "Mindkét oldalhoz ugyanazt adni vagy belőle ugyanazt elvenni mindig ekvivalens átalakítás." },
      { op: "Mindkét oldalt osztjuk 2-vel", to: eq("x = 2", (x) => x === 2), equivalent: true, why: "Nullától különböző számmal osztani (szorozni) mindkét oldalt ekvivalens átalakítás." },
    ],
  },
  {
    name: "Osztás x-szel",
    start: eq("x² = 3x", (x) => x * x === 3 * x),
    steps: [
      { op: "Mindkét oldalt osztjuk x-szel", to: eq("x = 3", (x) => x === 3), equivalent: false, why: "Elveszett egy gyök! Az x = 0 megoldása volt az eredetinek, de x-szel osztani nem szabad, mert x éppen 0 lehet. Helyesen: x² − 3x = 0, azaz x(x − 3) = 0." },
    ],
  },
  {
    name: "Négyzetre emelés",
    start: eq("√(x + 2) = x", (x) => x >= -2 && Math.abs(Math.sqrt(x + 2) - x) < 1e-9),
    steps: [
      { op: "Mindkét oldalt négyzetre emeljük", to: eq("x + 2 = x²", (x) => x + 2 === x * x), equivalent: false, why: "Hamis gyök keletkezett! A négyzetre emelés elveszi az előjelet: a −1 is megfelel az új egyenletnek, az eredetibe viszont √1 = −1 hamis állítás. Négyzetre emelés után mindig ellenőrizni kell." },
    ],
  },
  {
    name: "Szorzás x-szel",
    start: eq("x = 2", (x) => x === 2),
    steps: [
      { op: "Mindkét oldalt szorozzuk x-szel", to: eq("x² = 2x", (x) => x * x === 2 * x), equivalent: false, why: "Új gyök jött be: x = 0. Ha 0-val szorzunk, minden egyenlőség igazzá válik. Ismeretlent tartalmazó kifejezéssel szorozni csak vizsgálattal szabad." },
    ],
  },
];
const CANDIDATES = [-3, -2, -1, 0, 1, 2, 3, 4];
const fmtSet = (items) => (items.length ? `{${items.join("; ")}}` : "∅");
const solutions = (equationObject) => CANDIDATES.filter((x) => equationObject.holds(x)).map((x) => String(x).replace("-", "−"));

export function mount(root) {
  const state = { equationIndex: 0, baseId: "R", scenarioIndex: 0, stepIndex: 0, answered: null, history: [] };

  root.append(lead("Egy egyenlet megoldása attól is függ, hogy milyen számok közül keresünk: ugyanaz az egyenlet az egyik számhalmazon megoldható, a másikon nem. Az átalakításoknál pedig az a kérdés, hogy megőrzik-e a megoldásokat, vagy elvesznek vagy újak jönnek be."));

  // --- Base set ---
  const setCard = card("Alaphalmaz és megoldáshalmaz");
  const equationToggles = make("div", "il-controls");
  const baseToggles = make("div", "il-controls");
  const setLine = make("div");
  const line = svg("svg", { class: "il-svg", viewBox: "0 0 600 90", role: "img", "aria-label": "Számegyenes a megoldásokkal" });
  const setMessage = make("p", "il-message");
  setCard.append(make("p", "il-muted", "Válassz egyenletet, majd alaphalmazt:"), equationToggles, baseToggles, setLine, line, setMessage);

  // --- Step quiz ---
  const quiz = card("Ekvivalens-e az átalakítás?");
  const scenarioToggles = make("div", "il-controls");
  const startLine = make("div");
  const history = make("ol", "il-steps");
  const operation = make("p");
  const answerButtons = controls();
  const feedback = make("p", "il-message");
  const checkTable = make("table", "il-table");
  const nextButton = button("Következő lépés", () => { advance(); }, { ghost: true });
  quiz.append(make("p", "il-muted", "Két egyenlet ekvivalens, ha pontosan ugyanazok a megoldásai. Döntsd el minden lépésről, hogy megtartja-e a megoldáshalmazt."), scenarioToggles, startLine, history, operation, answerButtons, feedback, checkTable);
  root.append(setCard, quiz, keyIdea("az ekvivalens átalakítás nem változtat a megoldáshalmazon (összeadás, kivonás, nullától különböző számmal szorzás, osztás). Ha ismeretlent tartalmazó kifejezéssel osztunk vagy négyzetre emelünk, gyököt veszíthetünk vagy hamis gyököt kaphatunk — ilyenkor helyettesítéssel kell ellenőrizni."));

  const yes = button("Ekvivalens", () => answer(true));
  const no = button("Nem ekvivalens", () => answer(false));
  answerButtons.append(yes, no, nextButton);

  function renderSet() {
    const eqn = EQUATIONS[state.equationIndex], base = BASE_SETS.find((b) => b.id === state.baseId);
    equationToggles.replaceChildren(make("span", "il-muted", "Egyenlet:"), ...EQUATIONS.map((e, i) => toggle(e.text, i === state.equationIndex, () => { state.equationIndex = i; renderSet(); })));
    baseToggles.replaceChildren(make("span", "il-muted", "Alaphalmaz:"), ...BASE_SETS.map((b) => toggle(b.name, b.id === state.baseId, () => { state.baseId = b.id; renderSet(); })));
    const found = eqn.roots.filter((r) => base.has(r.v));
    setLine.replaceChildren(equation(`${eqn.text}  (${base.name})`, slot(`M = ${fmtSet(found.map((r) => r.label))}`, 18, { align: "left" }), "→"));
    line.replaceChildren();
    const toX = (v) => 300 + v * 65;
    svg("line", { x1: 20, x2: 580, y1: 50, y2: 50, class: "axis" }, line);
    for (let v = -4; v <= 4; v++) {
      svg("line", { x1: toX(v), x2: toX(v), y1: 44, y2: 56, class: "axis" }, line);
      svg("text", { x: toX(v), y: 76, "text-anchor": "middle", text: String(v).replace("-", "−") }, line);
    }
    for (const r of eqn.roots) {
      const ok = base.has(r.v);
      svg("circle", { cx: toX(r.v), cy: 50, r: 9, style: ok ? `fill:${PALETTE.green}` : `fill:none;stroke:${PALETTE.red};stroke-width:2;stroke-dasharray:3 3` }, line);
      svg("text", { x: toX(r.v), y: 28, "text-anchor": "middle", text: r.label, style: `font-weight:700;fill:${ok ? PALETTE.green : PALETTE.red}` }, line);
    }
    setMessage.textContent = found.length === eqn.roots.length
      ? `Az alaphalmaz (${base.description}) minden gyököt tartalmaz.`
      : found.length === 0
        ? `A gyökök nem elemei az alaphalmaznak (${base.description}), ezért a megoldáshalmaz üres.`
        : `Csak azok a gyökök számítanak, amelyek az alaphalmaz (${base.description}) elemei.`;
  }

  const scenario = () => SCENARIOS[state.scenarioIndex];
  const currentFrom = () => (state.stepIndex === 0 ? scenario().start : scenario().steps[state.stepIndex - 1].to);

  function renderQuiz() {
    scenarioToggles.replaceChildren(...SCENARIOS.map((s, i) => toggle(s.name, i === state.scenarioIndex, () => { Object.assign(state, { scenarioIndex: i, stepIndex: 0, answered: null }); renderQuiz(); })));
    startLine.replaceChildren(make("p", "il-formula start", `Kiindulás: ${scenario().start.text}`));
    history.replaceChildren(...scenario().steps.slice(0, state.stepIndex).map((s) => make("li", "", `${s.to.text}  | ${s.op}`)));
    const step = scenario().steps[state.stepIndex];
    const finished = !step;
    operation.textContent = finished ? "Minden lépésen végigmentél." : `Lépés: ${step.op}. Ekvivalens ez az átalakítás?`;
    yes.hidden = no.hidden = finished || state.answered !== null;
    yes.disabled = no.disabled = false;
    nextButton.hidden = finished || state.answered === null;
    nextButton.textContent = state.stepIndex + 1 < scenario().steps.length ? "Következő lépés" : "Vége";
    checkTable.replaceChildren();
    if (finished || state.answered === null) {
      feedback.className = "il-message";
      feedback.textContent = finished ? "Válassz másik példát, vagy gondold végig még egyszer, mit tartanak meg az ekvivalens átalakítások." : "";
      return;
    }
    const from = currentFrom(), to = step.to;
    const head = make("tr"), rowFrom = make("tr"), rowTo = make("tr");
    head.append(make("th", "", "x"));
    rowFrom.append(make("th", "", from.text));
    rowTo.append(make("th", "", to.text));
    for (const x of CANDIDATES) {
      const a = from.holds(x), b = to.holds(x);
      head.append(make("td", "", String(x).replace("-", "−")));
      for (const [row, ok] of [[rowFrom, a], [rowTo, b]]) {
        const cell = make("td", "", ok ? "✓" : "✗");
        cell.style.color = a !== b ? (ok ? PALETTE.green : PALETTE.red) : "var(--dim)";
        cell.style.fontWeight = a !== b ? "700" : "400";
        row.append(cell);
      }
    }
    checkTable.append(head, rowFrom, rowTo);
    const correct = state.answered === step.equivalent;
    feedback.className = `il-message ${correct ? "good" : "warn"}`;
    feedback.textContent = `${correct ? "Jól döntöttél. " : "Nem egészen. "}${step.why} Megoldások a próbált számok közül: ${fmtSet(solutions(from))} → ${fmtSet(solutions(to))}.`;
  }

  function answer(value) {
    state.answered = value;
    renderQuiz();
  }

  function advance() {
    state.stepIndex += 1;
    state.answered = null;
    renderQuiz();
  }

  renderSet();
  renderQuiz();
  return () => {};
}
