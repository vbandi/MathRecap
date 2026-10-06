import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const pointsOf = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");
const still = { dx: 0, dy: 0, cx: 0, cy: 0, angle: 0 };
const transformOf = ({ dx, dy, cx, cy, angle }) => `translate(${dx + cx}px, ${dy + cy}px) rotate(${angle}deg) translate(${-cx}px, ${-cy}px)`;
const TRAPEZOID_OFFSET = 1;

// Tab definitions. Each one lists its sliders, builds the figure parts in unit coordinates
// (y down) and explains the area formula.
const TABS = [
  {
    name: "Paralelogramma",
    sliders: [
      { key: "a", label: "a (alap)", min: 4, max: 8, value: 6 },
      { key: "m", label: "m (magasság)", min: 1, max: 5, value: 4 },
      { key: "s", label: "dőlés", min: 0, max: 4, value: 2 },
    ],
    action: "Levágott háromszög áttolása",
    geometry: ({ a, m, s }) => ({
      width: a + s, height: m,
      outline: [[s, 0], [s + a, 0], [s + a, m], [s, m]],
      pieces: [
        { points: [[s, 0], [s + a, 0], [a, m], [s, m]], from: still, to: still },
        { points: [[0, m], [s, 0], [s, m]], from: still, to: { ...still, dx: a } },
      ],
    }),
    formula: ({ a, m }) => ["T = a · m", `${formatNumber(a)} · ${formatNumber(m)} = ${formatNumber(a * m)}`],
    before: "Ez egy paralelogramma. A bal szélén levágunk egy derékszögű háromszöget.",
    after: "A háromszöget a jobb oldalra toltuk: téglalap lett, amelynek oldalai a és m. Tehát a paralelogramma területe a · m.",
  },
  {
    name: "Trapéz",
    sliders: [
      { key: "a", label: "a (alsó oldal)", min: 3, max: 8, value: 6 },
      { key: "c", label: "c (felső oldal)", min: 1, max: 6, value: 3 },
      { key: "m", label: "m (magasság)", min: 1, max: 5, value: 4 },
    ],
    action: "Második trapéz hozzáillesztése",
    geometry: ({ a, c, m }) => {
      const o = TRAPEZOID_OFFSET, trapezoid = [[0, m], [a, m], [o + c, 0], [o, 0]];
      return {
        width: a + c + o, height: m,
        outline: [[0, m], [a + c, m], [a + c + o, 0], [o, 0]],
        pieces: [
          { points: trapezoid, from: still, to: still },
          { points: trapezoid, from: { ...still, cx: (a + o + c) / 2, cy: m / 2 }, to: { ...still, cx: (a + o + c) / 2, cy: m / 2, angle: 180 }, hiddenBefore: true },
        ],
      };
    },
    formula: ({ a, c, m }) => ["T = (a + c) · m / 2", `(${formatNumber(a)} + ${formatNumber(c)}) · ${formatNumber(m)} / 2 = ${formatNumber((a + c) * m / 2)}`],
    before: "Ez egy trapéz. Vegyünk mellé még egy ugyanilyet, és fordítsuk el az egyik szár felezőpontja körül fél fordulattal.",
    after: "A két trapéz együtt paralelogramma, amelynek alapja a + c, magassága m. A trapéz ennek a fele: (a + c) · m / 2.",
  },
  {
    name: "Deltoid és rombusz",
    sliders: [
      { key: "e", label: "e (vízszintes átló)", min: 2, max: 8, value: 6 },
      { key: "f", label: "f (függőleges átló)", min: 2, max: 6, value: 5 },
      { key: "t", label: "a metszéspont helye", min: 0.2, max: 0.8, step: 0.1, value: 0.4, format: (value) => `${Math.round(value * 100)}%` },
    ],
    action: "Téglalap az átlók körül",
    geometry: ({ e, f, t }) => {
      const y = t * f;
      const rectangle = [[0, 0], [e, 0], [e, f], [0, f]];
      return {
        width: e, height: f, outline: rectangle,
        pieces: [
          { points: [[e / 2, 0], [e, y], [e / 2, f], [0, y]], from: still, to: still, color: PALETTE.blue },
          { points: [[0, 0], [e / 2, 0], [0, y]], from: still, to: still, color: PALETTE.amber, hiddenBefore: true },
          { points: [[e / 2, 0], [e, 0], [e, y]], from: still, to: still, color: PALETTE.amber, hiddenBefore: true },
          { points: [[0, y], [0, f], [e / 2, f]], from: still, to: still, color: PALETTE.amber, hiddenBefore: true },
          { points: [[e, y], [e, f], [e / 2, f]], from: still, to: still, color: PALETTE.amber, hiddenBefore: true },
        ],
      };
    },
    formula: ({ e, f }) => ["T = e · f / 2", `${formatNumber(e)} · ${formatNumber(f)} / 2 = ${formatNumber(e * f / 2)}`],
    before: "A deltoid két átlója merőleges egymásra. Az átlók hosszát e-vel és f-fel jelöljük. A harmadik csúszkával a metszéspontot is mozgathatod: 50%-nál rombusz lesz.",
    after: "A deltoid köré téglalapot rajzoltunk (e · f). A sarkokban lévő négy háromszög pontosan kitölti a deltoidon kívüli részt, ezért a deltoid a téglalap fele.",
  },
];

export function mount(root) {
  const scope = createScope();
  const values = TABS.map((tab) => Object.fromEntries(tab.sliders.map((slider) => [slider.key, slider.value])));
  const state = { tab: 0, moved: false };
  let elements = [], geometry = null;

  root.append(lead("Minden négyszög területét visszavezethetjük a téglalapéra: valamit levágunk, áttolunk vagy megduplázunk. A képletek ezekből a képekből következnek."));
  const main = card("Négyszögek területe");
  const tabs = make("div", "il-controls");
  const tabToggles = TABS.map((tab, index) => toggle(tab.name, index === 0, () => { state.tab = index; state.moved = false; buildTab(); }));
  tabs.append(...tabToggles);
  const sliderBox = controls();
  const actionButton = button("", () => { state.moved = !state.moved; flip(); });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 290", role: "img", "aria-label": "Négyszög és az átdarabolása" });
  const formulaLine = make("div");
  const message = make("p", "il-message");
  main.append(tabs, sliderBox, figure, controls(actionButton), formulaLine, message);
  root.append(main, keyIdea("paralelogramma: a · m, trapéz: (a + c) · m / 2, deltoid és rombusz: e · f / 2. Mindháromnál ugyanaz a trükk: a darabokat úgy rakjuk át, hogy téglalap vagy paralelogramma keletkezzen."));

  function buildTab() {
    const tab = TABS[state.tab];
    tabToggles.forEach((element, index) => element.setAttribute("aria-pressed", String(index === state.tab)));
    sliderBox.replaceChildren(...tab.sliders.map((slider) => range({
      label: slider.label, min: slider.min, max: slider.max, step: slider.step ?? 1, value: values[state.tab][slider.key],
      format: slider.format ?? formatNumber, onInput: (value) => { values[state.tab][slider.key] = value; buildFigure(); },
    }).element));
    buildFigure();
  }

  function buildFigure() {
    scope.clearAll();
    const tab = TABS[state.tab];
    geometry = tab.geometry(values[state.tab]);
    figure.replaceChildren();
    const scale = Math.min(40, 540 / geometry.width, 240 / geometry.height);
    const group = svg("g", { transform: `translate(${(600 - geometry.width * scale) / 2} ${(290 - geometry.height * scale) / 2}) scale(${scale})` }, figure);
    svg("polygon", { points: pointsOf(geometry.outline), fill: "none", style: "stroke:var(--dim);stroke-width:2;stroke-dasharray:7 6", "vector-effect": "non-scaling-stroke" }, group);
    elements = geometry.pieces.map((piece, index) => svg("polygon", {
      class: "il-move", points: pointsOf(piece.points), "vector-effect": "non-scaling-stroke",
      style: `fill:${piece.color ?? [PALETTE.blue, PALETTE.violet][index % 2]};fill-opacity:.75;stroke:var(--input);stroke-width:2.5`,
    }, group));
    flip(true);
  }

  function flip(instant = false) {
    const tab = TABS[state.tab];
    if (instant) elements.forEach((element) => { element.style.transition = "none"; });
    geometry.pieces.forEach((piece, index) => {
      elements[index].style.transform = transformOf(state.moved ? piece.to : piece.from);
      elements[index].style.opacity = piece.hiddenBefore && !state.moved ? 0 : 1;
    });
    if (instant) scope.frame(() => scope.frame(() => elements.forEach((element) => { element.style.transition = ""; })));
    const [left, right] = tab.formula(values[state.tab]);
    formulaLine.replaceChildren(equation(left, slot(right, 26, { align: "left" })));
    actionButton.textContent = state.moved ? "Vissza" : tab.action;
    message.textContent = state.moved ? tab.after : tab.before;
  }

  buildTab();
  return () => scope.clearAll();
}
