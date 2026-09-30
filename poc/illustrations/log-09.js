import { button, card, controls, createScope, equation, keyIdea, lead, make, PALETTE, rich, svg, toggle } from "./kit.js";

const COLOURS = ["red", "blue", "green"];
const COLOUR_INFO = { red: { name: "piros", fill: PALETTE.red }, blue: { name: "kék", fill: PALETTE.blue }, green: { name: "zöld", fill: PALETTE.green } };
const INITIAL = [["circle", "red"], ["circle", "red"], ["circle", "blue"], ["square", "green"], ["square", "red"], ["triangle", "blue"], ["circle", "red"], ["triangle", "red"], ["square", "green"], ["triangle", "blue"]];
const STATEMENTS = [
  { text: "Minden kör piros", kind: "all", shape: "circle", colour: "red", negation: "Van olyan kör, amely nem piros" },
  { text: "Van olyan négyzet, amely kék", kind: "exists", shape: "square", colour: "blue", negation: "Egyetlen négyzet sem kék" },
  { text: "Nincs zöld háromszög", kind: "none", shape: "triangle", colour: "green", negation: "Van zöld háromszög" },
];
const SPACING = 60, MARGIN = 40;

function isTrue(statement, shapes) {
  const related = shapes.filter((s) => s.shape === statement.shape);
  const holds = (s) => s.colour === statement.colour;
  if (statement.kind === "all") return related.every(holds);
  if (statement.kind === "exists") return related.some(holds);
  return !related.some(holds);
}
const negationIsTrue = (statement, shapes) => !isTrue(statement, shapes);

export function mount(root) {
  const scope = createScope();
  const shapes = INITIAL.map(([shape, colour]) => ({ shape, colour }));
  const state = { statement: 0, scanning: false, found: null, current: null };
  const nodes = [];

  root.append(lead("„Minden…” és „van olyan…” állításokat más módon kell ellenőrizni. A „minden” állítást egyetlen rossz példa megdönti. A „van olyan” állítást egyetlen jó példa igazolja. Tippelj, aztán nézd meg, mit talál a vizsgálat. A színezéshez kattints egy alakzatra."));

  const play = card("Igaz-e az állítás ezekre az alakzatokra?");
  const picker = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 620 130", role: "img", "aria-label": "Színes alakzatok sora" });
  shapes.forEach((shape, index) => {
    const group = svg("g", { transform: `translate(${MARGIN + index * SPACING}, 62)`, style: "cursor:pointer", tabindex: 0, role: "button", "aria-label": "Alakzat átszínezése" }, figure);
    const ring = svg("circle", { r: 29, style: "fill:none;stroke:transparent;stroke-width:3" }, group);
    const body = svg(shape.shape === "circle" ? "circle" : shape.shape === "square" ? "rect" : "polygon", shape.shape === "circle" ? { r: 20 } : shape.shape === "square" ? { x: -19, y: -19, width: 38, height: 38, rx: 3 } : { points: "0,-23 22,17 -22,17" }, group);
    const recolour = () => { if (state.scanning) return; shape.colour = COLOURS[(COLOURS.indexOf(shape.colour) + 1) % COLOURS.length]; state.found = null; state.current = null; message.textContent = ""; message.className = "il-message"; render(); };
    group.addEventListener("click", recolour);
    group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); recolour(); } });
    nodes.push({ ring, body });
  });
  const message = make("p", "il-message");
  const guessRow = controls(make("span", "il-muted", "Szerinted az állítás:"), button("igaz", () => guess(true)), button("hamis", () => guess(false)));
  play.append(picker, figure, make("div", "il-muted", "Kattints egy alakzatra, hogy másik színt kapjon."), guessRow, message);

  const negation = card("A tagadás");
  const negLines = make("div");
  negation.append(negLines);
  root.append(play, negation, keyIdea("a „minden” tagadása „van olyan, amelyre nem”, a „van olyan” tagadása pedig „egyikre sem”. A tagadás mindig megfordítja az igazságértéket."));

  const statement = () => STATEMENTS[state.statement];

  function guess(value) {
    if (state.scanning) return;
    const truth = isTrue(statement(), shapes);
    state.scanning = true;
    message.className = "il-message";
    message.textContent = "Nézzük végig az alakzatokat egyenként…";
    render();
    const { kind, shape, colour } = statement();
    let index = 0;
    const step = () => {
      if (index >= shapes.length) return finish(null);
      const item = shapes[index];
      state.current = index;
      const relevant = item.shape === shape;
      const match = relevant && item.colour === colour;
      const stop = kind === "all" ? relevant && !match : match;
      render();
      if (stop) return scope.timeout(() => finish(index), 500);
      index += 1;
      scope.timeout(step, relevant ? 650 : 250);
    };
    const finish = (at) => {
      state.scanning = false; state.current = null; state.found = at;
      const why = at === null
        ? (kind === "all" ? "Mindegyik megfelel, nincs ellenpélda, tehát igaz." : kind === "exists" ? "Egyik sem jó, nincs ilyen alakzat, tehát hamis." : "Nincs ilyen alakzat, tehát igaz.")
        : (kind === "all" ? "Ellenpélda! Ez nem megfelelő, ezért az állítás hamis." : kind === "exists" ? "Találtunk ilyet, ezért az állítás igaz." : "Itt van egy ilyen alakzat, ezért az állítás hamis.");
      message.textContent = `${why} ${guessCheck(value, truth)}`;
      message.className = `il-message ${value === truth ? "good" : "warn"}`;
      render();
    };
    scope.timeout(step, 400);
  }
  const guessCheck = (value, truth) => (value === truth ? "A tipped helyes volt. ✓" : "A tipped most nem egyezett.");

  function render() {
    picker.replaceChildren(...STATEMENTS.map((s, i) => toggle(s.text, state.statement === i, () => { if (state.scanning) return; state.statement = i; state.found = null; state.current = null; message.textContent = ""; message.className = "il-message"; render(); })));
    const { shape: selectedShape, colour: selectedColour, kind } = statement();
    shapes.forEach((shape, index) => {
      const { ring, body } = nodes[index];
      body.setAttribute("style", `fill:${COLOUR_INFO[shape.colour].fill};opacity:${shape.shape === selectedShape ? 1 : 0.45}`);
      const scanningHere = state.current === index;
      const foundHere = state.found === index;
      const stroke = foundHere ? (kind === "exists" ? "var(--accent)" : "var(--il-red)") : scanningHere ? "var(--il-amber)" : "transparent";
      ring.setAttribute("style", `fill:none;stroke:${stroke};stroke-width:4`);
    });
    guessRow.querySelectorAll("button").forEach((b) => { b.disabled = state.scanning; });
    const truth = isTrue(statement(), shapes), negTruth = negationIsTrue(statement(), shapes);
    const word = (v) => (v ? "igaz" : "hamis");
    negLines.replaceChildren(
      equation(statement().text, make("b", v(truth), word(truth))),
      equation(`Nem igaz, hogy: ${statement().text.charAt(0).toLowerCase()}${statement().text.slice(1)}`, make("b", v(negTruth), word(negTruth)), "="),
      equation("Ugyanaz, mint:", make("b", v(negTruth), `${statement().negation} (${word(negTruth)})`), "≡"),
    );
    function v(value) { return value ? "il-accent" : ""; }
  }

  render();
  return () => scope.clearAll();
}
