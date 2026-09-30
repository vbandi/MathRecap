import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const CENTER = [300, 190], RADIUS = 160;

const vertex = (n, i) => {
  const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
  return [CENTER[0] + RADIUS * Math.cos(angle), CENTER[1] + RADIUS * Math.sin(angle)];
};

function wedgeAt(center, radius, u, v) {
  const a = Math.atan2(u[1], u[0]), b = Math.atan2(v[1], v[0]);
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const p = (angle) => `${center[0] + radius * Math.cos(angle)} ${center[1] + radius * Math.sin(angle)}`;
  return `M ${center[0]} ${center[1]} L ${p(a)} A ${radius} ${radius} 0 0 ${d > 0 ? 1 : 0} ${p(a + d)} Z`;
}

export function mount(root) {
  const state = { n: 6, wedges: true, outer: true, inner: true };

  root.append(lead("A szabályos sokszög minden oldala egyenlő, és minden szöge is egyenlő. Emiatt van egy középpontja, amelytől a csúcsai egyforma messze vannak, és az oldalai is egyforma messze. Nézd meg, mi történik, ha egyre több oldala van."));

  const main = card("Szabályos sokszög");
  const slider = range({ label: "Oldalak száma (n)", min: 3, max: 30, step: 1, value: state.n, format: (v) => `${v}`, onInput: (value) => { state.n = value; render(); } });
  const toggles = [
    ["Középponti szögek", "wedges", PALETTE.violet], ["Körülírt kör", "outer", PALETTE.blue], ["Beírt kör", "inner", PALETTE.green],
  ].map(([text, key, color]) => toggle(text, state[key], () => { state[key] = !state[key]; render(); }, color));
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 380", role: "img", "aria-label": "Szabályos sokszög beírt és körülírt körrel" });
  const formulas = make("div", "il-formula start");
  const message = make("p", "il-message");
  main.append(controls(slider.element), controls(...toggles), figure, formulas, message);

  root.append(main, keyIdea("az n oldalú szabályos sokszög középponti szöge 360°/n, belső szöge (n − 2) · 180°/n. A csúcsain át húzható egy körülírt kör, az oldalait belülről érinti egy beírt kör. Minél nagyobb n, annál jobban hasonlít a sokszög a körre."));

  function render() {
    const { n } = state;
    toggles.forEach((button, index) => button.setAttribute("aria-pressed", String(state[["wedges", "outer", "inner"][index]])));
    figure.replaceChildren();
    const points = Array.from({ length: n }, (_, i) => vertex(n, i));
    const apothem = RADIUS * Math.cos(Math.PI / n);
    if (state.wedges) {
      points.forEach((p, i) => {
        const q = points[(i + 1) % n];
        svg("polygon", { points: [CENTER, p, q].map((x) => x.join(",")).join(" "), style: `fill:${i % 2 ? PALETTE.violet : PALETTE.pink};fill-opacity:${i === 0 ? 0.75 : 0.28};stroke:none` }, figure);
      });
    }
    if (state.outer) svg("circle", { cx: CENTER[0], cy: CENTER[1], r: RADIUS, fill: "none", style: `stroke:${PALETTE.blue};stroke-width:2.5` }, figure);
    if (state.inner) svg("circle", { cx: CENTER[0], cy: CENTER[1], r: apothem, fill: "none", style: `stroke:${PALETTE.green};stroke-width:2.5` }, figure);
    svg("polygon", { points: points.map((p) => p.join(",")).join(" "), style: "fill:none;stroke:var(--fg);stroke-width:3.5;stroke-linejoin:round" }, figure);
    if (n <= 16) points.forEach((p) => svg("circle", { cx: p[0], cy: p[1], r: 4, style: "fill:var(--fg)" }, figure));
    svg("circle", { cx: CENTER[0], cy: CENTER[1], r: 4, style: "fill:var(--fg)" }, figure);
    svg("text", { x: CENTER[0] + 8, y: CENTER[1] + 20, text: "O", style: "font-weight:800" }, figure);

    // Interior angle at the top vertex.
    const top = points[0], next = points[1], previous = points[n - 1];
    svg("path", { d: wedgeAt(top, 30, [next[0] - top[0], next[1] - top[1]], [previous[0] - top[0], previous[1] - top[1]]), style: `fill:${PALETTE.amber};fill-opacity:.8;stroke:var(--input);stroke-width:1` }, figure);
    svg("text", { x: top[0] + 44, y: top[1] - 6, text: "belső szög", style: `font-weight:700;fill:${PALETTE.amber}` }, figure);
    if (state.wedges) svg("text", { x: CENTER[0] + 12 * 0, y: CENTER[1] - apothem * 0.55, "text-anchor": "middle", text: "középponti szög", style: "font-weight:700;font-size:12px;fill:var(--fg)" }, figure);

    const central = 360 / n, interior = ((n - 2) * 180) / n, ratio = Math.cos(Math.PI / n);
    formulas.replaceChildren(
      "középponti szög: 360°/n = ", slot(`${formatNumber(central, 2)}°`, 8, { align: "left" }), make("br"),
      "belső szög: (n − 2) · 180°/n = ", slot(`${formatNumber(interior, 2)}°`, 8, { align: "left" }), make("br"),
      "beírt kör sugara / körülírt kör sugara = ", slot(formatNumber(ratio, 3), 6, { align: "left" }));
    message.textContent = n < 6 ? "Kevés oldalnál a sokszög messze van a kör alakjától, a beírt és a körülírt kör között nagy a rés."
      : n < 16 ? "Ahogy nő az oldalak száma, a két kör egyre közelebb kerül egymáshoz, és a sokszög egyre gömbölyűbb."
        : "Ennyi oldalnál a sokszög szinte kör: a beírt és a körülírt kör majdnem egybeesik. A középponti szög pedig már alig néhány fok.";
  }

  render();
  return () => {};
}
