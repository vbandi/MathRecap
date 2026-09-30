import { button, card, controls, equation, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const VIEW = { width: 600, height: 330, top: 26, size: 270 };
const MODES = [
  { id: "sum", name: "(a + b)²", product: "(a + b)²", expanded: "a² + 2ab + b²" },
  { id: "difference", name: "(a − b)²", product: "(a − b)²", expanded: "a² − 2ab + b²" },
  { id: "squares", name: "a² − b²", product: "(a + b)(a − b)", expanded: "a² − b²" },
];
const minus = (n) => String(n).replace("-", "−");

// Pieces in units; `t(apart)` gives [dx, dy, rotationDegrees, opacity] in units for the "apart"
// (expanded, sum) state or for the assembled (product) state.
function layout(mode, a, b) {
  if (mode === "sum") {
    const g = 0.5;
    return { scale: VIEW.size / (a + b + 2 * g), side: a + b, pieces: [
      { x: 0, y: 0, w: a, h: a, color: PALETTE.blue, label: "a²", t: (p) => [p ? -g : 0, p ? -g : 0, 0, 1] },
      { x: a, y: 0, w: b, h: a, color: PALETTE.green, label: "ab", t: (p) => [p ? g : 0, p ? -g : 0, 0, 1] },
      { x: 0, y: a, w: a, h: b, color: PALETTE.green, label: "ab", t: (p) => [p ? -g : 0, p ? g : 0, 0, 1] },
      { x: a, y: a, w: b, h: b, color: PALETTE.amber, label: "b²", t: (p) => [p ? g : 0, p ? g : 0, 0, 1] },
    ] };
  }
  if (mode === "difference") {
    const c = a - b;
    const away = (p, dx, dy) => (p ? [0, 0, 0, 1] : [dx, dy, 0, 0.12]);
    return { scale: VIEW.size / (a + 2), side: a, pieces: [
      { x: c, y: c, w: b, h: b, color: PALETTE.amber, label: "b²", t: (p) => away(p, 1.2, 1.2) },
      { x: c, y: 0, w: b, h: c, color: PALETTE.red, label: "", t: (p) => away(p, 1.2, 0) },
      { x: 0, y: c, w: c, h: b, color: PALETTE.red, label: "", t: (p) => away(p, 0, 1.2) },
      { x: 0, y: 0, w: c, h: c, color: PALETTE.blue, label: "(a − b)²", t: () => [0, 0, 0, 1] },
    ] };
  }
  const c = a - b;
  return { scale: VIEW.size / (a + b), side: a + b, pieces: [
    { x: 0, y: 0, w: a, h: c, color: PALETTE.blue, label: "a · (a − b)", t: () => [0, 0, 0, 1] },
    { x: 0, y: c, w: c, h: b, color: PALETTE.violet, label: "b(a − b)", t: (p) => (p ? [0, 0, 0, 1] : [a + b, -c, 90, 1]) },
  ] };
}

export function mount(root) {
  const state = { modeIndex: 0, a: 5, b: 2, direction: "expand", apart: false };

  root.append(lead("A nevezetes azonosságok nem trükkök, hanem területek: egy négyzetet vagy téglalapot kétféleképpen is felosztunk, és a két felosztás területe ugyanaz. Az egyik oldalán a szorzat áll, a másikon az összeg."));

  const main = card("Tedd ki a területekből");
  const modeToggles = make("div", "il-controls");
  const aSlider = range({ label: "a", min: 2, max: 8, value: state.a, format: String, onInput: (v) => { state.a = v; render(); } });
  const bSlider = range({ label: "b", min: 1, max: 8, value: state.b, format: String, onInput: (v) => { state.b = v; render(); } });
  const directionToggles = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, role: "img", "aria-label": "Területekből kirakott nevezetes azonosság" });
  const pieceLayer = svg("g", {}, figure);
  const overlay = svg("g", {}, figure);
  const symbolic = make("div");
  const numeric = make("div");
  const message = make("p", "il-message");
  const flip = button("Átrendezés", () => { state.apart = !state.apart; update(true); });
  main.append(modeToggles, controls(aSlider.element, bSlider.element), directionToggles, figure, symbolic, numeric, message, controls(flip));
  root.append(main, keyIdea("az azonosság két különböző módon leírt ugyanaz a terület. Kifejtésnél a szorzatból összeget csinálsz, szorzattá alakításnál visszafelé haladsz — a nevezetes azonosságok azt segítenek felismerni, hogy mikor lehet az összeget szorzatként látni."));

  let groups = [], geometry = null;

  function render() {
    const mode = MODES[state.modeIndex];
    bSlider.input.max = mode.id === "sum" ? 8 : state.a - 1;
    if (state.b > Number(bSlider.input.max)) { state.b = Number(bSlider.input.max); bSlider.set(state.b); }
    modeToggles.replaceChildren(...MODES.map((m, i) => toggle(m.name, i === state.modeIndex, () => { state.modeIndex = i; state.apart = state.direction === "factor"; render(); })));
    directionToggles.replaceChildren(
      toggle("Kifejtés: szorzatból összeg", state.direction === "expand", () => { state.direction = "expand"; state.apart = false; render(); }),
      toggle("Szorzattá alakítás: összegből szorzat", state.direction === "factor", () => { state.direction = "factor"; state.apart = true; render(); }),
    );
    geometry = layout(mode.id, state.a, state.b);
    const { scale, side, pieces } = geometry;
    const ox = (VIEW.width - side * scale) / 2, oy = VIEW.top + (mode.id === "sum" ? 0.5 * scale : 0);
    pieceLayer.replaceChildren();
    groups = pieces.map((piece) => {
      const group = svg("g", { class: "il-move" }, pieceLayer);
      group.dataset.ox = ox; group.dataset.oy = oy;
      svg("rect", { x: 0, y: 0, width: piece.w * scale, height: piece.h * scale, style: `fill:${piece.color};fill-opacity:.85;stroke:var(--input);stroke-width:2` }, group);
      if (piece.label && piece.w * scale > 34 && piece.h * scale > 22) {
        svg("text", { x: piece.w * scale / 2, y: piece.h * scale / 2 + 5, "text-anchor": "middle", text: piece.label, style: "fill:#fff;font-weight:700;font-size:15px" }, group);
      }
      return group;
    });
    overlay.replaceChildren();
    if (mode.id === "difference") {
      const { a, b } = state, c = a - b;
      const dashed = "fill:none;stroke:var(--fg);stroke-width:2;stroke-dasharray:6 4";
      svg("rect", { x: ox + c * scale, y: oy, width: b * scale, height: a * scale, style: dashed, class: "il-fade", "data-when": "apart" }, overlay);
      svg("rect", { x: ox, y: oy + c * scale, width: a * scale, height: b * scale, style: dashed, class: "il-fade", "data-when": "apart" }, overlay);
      svg("text", { x: ox + a * scale + 8, y: oy + a * scale / 2, text: "ab", "data-when": "apart", class: "il-fade", style: "font-weight:700" }, overlay);
      svg("text", { x: ox + a * scale / 2 - 8, y: oy + a * scale + 18, text: "ab", "data-when": "apart", class: "il-fade", style: "font-weight:700" }, overlay);
    }
    if (mode.id === "squares") {
      const { a, b } = state, c = a - b;
      svg("rect", { x: ox + c * scale, y: oy + c * scale, width: b * scale, height: b * scale, class: "il-fade", "data-when": "apart", style: "fill:none;stroke:var(--fg);stroke-width:2;stroke-dasharray:6 4" }, overlay);
      svg("text", { x: ox + (c + b / 2) * scale, y: oy + (c + b / 2) * scale + 5, "text-anchor": "middle", text: "b²", class: "il-fade", "data-when": "apart", style: "font-weight:700" }, overlay);
    }
    update(false);
  }

  function update(animate) {
    const mode = MODES[state.modeIndex], { a, b } = state;
    geometry.pieces.forEach((piece, i) => {
      const [dx, dy, rotation, opacity] = piece.t(state.apart);
      const group = groups[i];
      const x = Number(group.dataset.ox) + (piece.x + dx) * geometry.scale, y = Number(group.dataset.oy) + (piece.y + dy) * geometry.scale;
      if (!animate) group.style.transition = "none";
      group.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
      group.style.opacity = opacity;
      if (!animate) { group.getBoundingClientRect(); group.style.transition = ""; }
    });
    for (const node of overlay.querySelectorAll("[data-when]")) node.style.opacity = state.apart ? 1 : 0;
    const product = mode.product, expanded = mode.expanded;
    symbolic.replaceChildren(equation(slot(state.direction === "expand" ? product : expanded, 16), slot(state.direction === "expand" ? expanded : product, 16, { align: "left" })));
    const values = {
      sum: [`(${a} + ${b})² = ${(a + b) ** 2}`, `${a}² + 2·${a}·${b} + ${b}² = ${a * a} + ${2 * a * b} + ${b * b} = ${(a + b) ** 2}`],
      difference: [`(${a} − ${b})² = ${(a - b) ** 2}`, `${a}² − 2·${a}·${b} + ${b}² = ${a * a} − ${2 * a * b} + ${b * b} = ${(a - b) ** 2}`],
      squares: [`(${a} + ${b})(${a} − ${b}) = ${a + b}·${a - b} = ${a * a - b * b}`, `${a}² − ${b}² = ${a * a} − ${b * b} = ${a * a - b * b}`],
    }[mode.id];
    const pair = state.direction === "expand" ? values : [values[1], values[0]];
    numeric.replaceChildren(equation(slot(pair[0], 34, { align: "right" }), slot(pair[1], 44, { align: "left" }), "|"));
    numeric.firstChild.style.fontSize = "13px";
    message.textContent = {
      sum: state.apart ? "A nagy négyzet négy darabra esik szét: egy a oldalú négyzet, két a · b téglalap és egy b oldalú négyzet. Ezért jön ki a középső tag, a 2ab." : "Egy a + b oldalú négyzet területe (a + b)². Kattints az Átrendezésre, hogy szétessen.",
      difference: state.apart ? "Az a oldalú négyzetből két ab csíkot vágunk le (szaggatott), de a b² sarkot ezzel kétszer vettük el — vissza kell tenni. Innen a képletben a + b²." : "A kék négyzet oldala a − b, területe (a − b)². Az Átrendezés megmutatja, mit kellett levágni az a² területből.",
      squares: state.apart ? "Az a oldalú négyzetből kivágtunk egy b oldalú sarkot: a² − b² területű L alakzat maradt." : "Az L alakzat egyik darabját elforgatva és áttolva (a + b) · (a − b) téglalapot kapunk — ugyanaz a terület, mint az L-nek.",
    }[mode.id];
  }

  render();
  return () => {};
}
