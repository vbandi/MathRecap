import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const VIEW = { width: 640, height: 310 }, CENTER = { x: 320, y: 270 }, RADIUS = 200;
const RADIANS = Math.PI / 180;
const clean = (value) => (Math.abs(value) < 1e-12 ? 0 : value);

// Pointer-based dragging for an SVG element; onMove receives SVG user-space coordinates.
function makeDraggable(figure, handle, onMove) {
  handle.style.cursor = "grab";
  handle.style.touchAction = "none";
  const toSvg = (event) => {
    const point = figure.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(figure.getScreenCTM().inverse());
  };
  handle.addEventListener("pointerdown", (event) => { handle.setPointerCapture(event.pointerId); event.preventDefault(); });
  handle.addEventListener("pointermove", (event) => {
    if (handle.hasPointerCapture(event.pointerId)) { const p = toSvg(event); onMove(p.x, p.y); }
  });
}

export function mount(root) {
  const state = { alpha: 50, mirror: false };

  root.append(lead("Rajzolj egy 1 sugarú kört, és mérj rajta egy α szöget az x tengelytől. A kör megfelelő pontjának vízszintes koordinátája a koszinusz, a függőleges koordinátája a szinusz. Így tompaszögekre is értelmezhetők: itt a pont már a bal oldalra kerül."));

  const main = card("Az egységkör");
  const alphaSlider = range({ label: "α szög", min: 0, max: 180, value: state.alpha, format: (v) => `${v}°`, onInput: (value) => { state.alpha = value; render(); } });
  const mirrorToggle = toggle("Tükörkép: 180° − α", false, () => { state.mirror = !state.mirror; render(); }, PALETTE.pink);
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, role: "img", "aria-label": "Egységkör az α szöghöz tartozó ponttal" });
  const layer = svg("g", {}, figure);
  const handle = svg("circle", { r: 13, style: `fill:${PALETTE.amber};stroke:var(--fg);stroke-width:2` }, figure);
  makeDraggable(figure, handle, (x, y) => {
    const degrees = Math.atan2(CENTER.y - y, x - CENTER.x) / RADIANS;
    state.alpha = Math.round(y > CENTER.y ? (x > CENTER.x ? 0 : 180) : Math.min(180, Math.max(0, degrees)));
    render();
  });
  const table = make("table", "il-table");
  const identity = make("div", "il-formula start");
  identity.style.whiteSpace = "pre-wrap";
  const message = make("p", "il-message");
  main.append(controls(alphaSlider.element, mirrorToggle), figure, table, identity, message);
  root.append(main, keyIdea("az egységkörön a pont koordinátái (cos α; sin α). Tompaszögnél a koszinusz negatív, a szinusz pozitív marad. Mivel a pont távolsága az origótól 1, mindig igaz: sin² α + cos² α = 1, és sin (180° − α) = sin α, cos (180° − α) = −cos α."));

  function render() {
    const { alpha, mirror } = state;
    alphaSlider.set(alpha);
    mirrorToggle.setAttribute("aria-pressed", String(mirror));
    const cos = clean(Math.cos(alpha * RADIANS)), sin = clean(Math.sin(alpha * RADIANS));
    const toView = (x, y) => ({ x: CENTER.x + x * RADIUS, y: CENTER.y - y * RADIUS });
    const p = toView(cos, sin), foot = toView(cos, 0), origin = toView(0, 0);
    handle.setAttribute("cx", p.x); handle.setAttribute("cy", p.y);
    layer.replaceChildren();
    svg("line", { x1: 40, y1: CENTER.y, x2: 600, y2: CENTER.y, class: "axis" }, layer);
    svg("line", { x1: CENTER.x, y1: CENTER.y, x2: CENTER.x, y2: 40, class: "axis" }, layer);
    svg("path", { d: `M ${CENTER.x - RADIUS} ${CENTER.y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER.x + RADIUS} ${CENTER.y}`, fill: "none", style: "stroke:var(--fg-soft);stroke-width:2" }, layer);
    const label = (x, y, content, color, anchor = "middle") => svg("text", { x, y, "text-anchor": anchor, text: content, style: `font-weight:800;font-size:15px;fill:${color}` }, layer);
    label(origin.x + RADIUS + 8, CENTER.y + 18, "1", "var(--dim)", "start"); label(origin.x - RADIUS - 8, CENTER.y + 18, "−1", "var(--dim)", "end");
    svg("polygon", { points: `${origin.x},${origin.y} ${foot.x},${foot.y} ${p.x},${p.y}`, style: `fill:${PALETTE.blue};fill-opacity:.18` }, layer);
    svg("line", { x1: foot.x, y1: foot.y, x2: p.x, y2: p.y, style: `stroke:${PALETTE.red};stroke-width:4` }, layer);
    svg("line", { x1: origin.x, y1: origin.y, x2: foot.x, y2: foot.y, style: `stroke:${PALETTE.green};stroke-width:4` }, layer);
    svg("line", { x1: origin.x, y1: origin.y, x2: p.x, y2: p.y, style: "stroke:var(--fg);stroke-width:2.5" }, layer);
    if (alpha > 0 && alpha < 180) svg("path", { d: `M ${origin.x + 36} ${origin.y} A 36 36 0 0 0 ${origin.x + 36 * cos} ${origin.y - 36 * sin}`, fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3` }, layer);
    label(origin.x + 46, origin.y - 12, "α", PALETTE.amber, "start");
    label(p.x + (cos >= 0 ? 10 : -10), (p.y + foot.y) / 2, "sin α", PALETTE.red, cos >= 0 ? "start" : "end");
    label((origin.x + foot.x) / 2, origin.y + 18, "cos α", PALETTE.green);
    if (mirror) {
      const q = toView(-cos, sin), qFoot = toView(-cos, 0);
      svg("line", { x1: p.x, y1: p.y, x2: q.x, y2: q.y, style: `stroke:${PALETTE.pink};stroke-width:1.5;stroke-dasharray:5 5` }, layer);
      svg("line", { x1: qFoot.x, y1: qFoot.y, x2: q.x, y2: q.y, style: `stroke:${PALETTE.red};stroke-width:3;stroke-opacity:.6` }, layer);
      svg("line", { x1: origin.x, y1: origin.y, x2: q.x, y2: q.y, style: `stroke:${PALETTE.pink};stroke-width:2.5` }, layer);
      svg("circle", { cx: q.x, cy: q.y, r: 7, style: `fill:${PALETTE.pink};stroke:var(--fg);stroke-width:1.5` }, layer);
      label(q.x + (cos >= 0 ? -10 : 10), q.y - 12, "180° − α", PALETTE.pink, cos >= 0 ? "end" : "start");
    }
    const beta = 180 - alpha, cosBeta = -cos;
    const tgText = (c, s) => (Math.abs(c) < 1e-9 ? "—" : formatNumber(s / c, 3));
    const row = (heading, values) => { const tr = make("tr"); tr.append(make("th", "", heading), ...values.map((v) => make("td", "", v))); return tr; };
    table.replaceChildren(
      row("", [`${alpha}°`, `${beta}°`]),
      row("sin", [formatNumber(sin, 3), formatNumber(sin, 3)]),
      row("cos", [formatNumber(cos, 3), formatNumber(cosBeta === 0 ? 0 : cosBeta, 3)]),
      row("tg", [tgText(cos, sin), tgText(cosBeta, sin)]),
    );
    identity.replaceChildren(
      "sin² α + cos² α = ", slot(formatNumber(sin * sin, 3), 6), " + ", slot(formatNumber(cos * cos, 3), 6), " = ", slot(make("b", "", formatNumber(sin * sin + cos * cos, 3)), 3),
    );
    message.className = "il-message";
    message.textContent = alpha === 90 ? "α = 90°: a pont az y tengelyen van, cos α = 0 és sin α = 1. A tangens (sin / cos) itt nem értelmezett, mert nullával kellene osztani."
      : alpha > 90 ? "Tompaszög: a pont a bal oldalon van, ezért cos α negatív. A sin α továbbra is pozitív."
      : alpha === 0 ? "α = 0°: a pont az (1; 0), sin α = 0 és cos α = 1." : "Hegyesszög: a pont a jobb oldalon van, sin α és cos α is pozitív.";
    if (alpha === 180) message.textContent = "α = 180°: a pont a (−1; 0), sin α = 0 és cos α = −1.";
  }

  render();
  return () => {};
}
