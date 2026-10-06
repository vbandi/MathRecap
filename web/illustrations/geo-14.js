import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const WIDTH = 600, HEIGHT = 380, CENTER = [300, 190], RADIUS = 140, CM = 40;
const RAD = Math.PI / 180;

const PARTS = [
  { id: "radius", name: "sugár", color: PALETTE.red, handles: ["p"], text: "A sugár a kör középpontját köti össze a kör egy pontjával. A körben minden sugár egyforma hosszú." },
  { id: "diameter", name: "átmérő", color: PALETTE.blue, handles: ["p"], text: "Az átmérő a középponton átmenő húr. Hossza a sugár kétszerese: d = 2r." },
  { id: "chord", name: "húr", color: PALETTE.green, handles: ["p", "q"], text: "A húr a kör két pontját összekötő szakasz. A leghosszabb húr az átmérő." },
  { id: "secant", name: "szelő", color: PALETTE.amber, handles: ["p", "q"], text: "A szelő olyan egyenes, amely a kört két pontban metszi. A húr a szelő körön belüli darabja." },
  { id: "tangent", name: "érintő", color: PALETTE.violet, handles: ["p"], text: "Az érintő a kört egyetlen pontban érinti, és az érintési pontba húzott sugárra merőleges." },
  { id: "arc", name: "körív", color: PALETTE.pink, handles: ["p", "q"], text: "A körív a körvonal két pont közötti darabja. Két pont két ívet határoz meg: egy rövidebbet és egy hosszabbat." },
  { id: "sector", name: "körcikk", color: PALETTE.red, handles: ["p", "q"], text: "A körcikket két sugár és a közöttük lévő körív határolja, mint egy tortaszeletet." },
  { id: "segment", name: "körszelet", color: PALETTE.blue, handles: ["p", "q"], text: "A körszeletet egy húr és a hozzá tartozó körív határolja. Az átmérő két egyforma félkörre vágja a kört." },
];

function toSvgPoint(figure, event) {
  const point = figure.createSVGPoint();
  point.x = event.clientX; point.y = event.clientY;
  const mapped = point.matrixTransform(figure.getScreenCTM().inverse());
  return [mapped.x, mapped.y];
}

function makeDraggable(figure, handle, onMove) {
  handle.style.cursor = "grab";
  handle.style.touchAction = "none";
  handle.addEventListener("pointerdown", (event) => { handle.setPointerCapture(event.pointerId); event.preventDefault(); });
  handle.addEventListener("pointermove", (event) => {
    if (handle.hasPointerCapture(event.pointerId)) onMove(...toSvgPoint(figure, event));
  });
}

const onCircle = (degrees) => [CENTER[0] + RADIUS * Math.cos(degrees * RAD), CENTER[1] - RADIUS * Math.sin(degrees * RAD)];
const wrap = (degrees) => ((degrees % 360) + 360) % 360;

export function mount(root) {
  const state = { part: "radius", p: 35, q: 140 };

  root.append(lead("A kör minden pontja ugyanolyan messze van a középpontjától. A körhöz tartozó vonalaknak és síkidomoknak külön nevük van. Kattints egy névre, és megmutatjuk, melyik az."));

  const main = card("A kör részei");
  const buttons = PARTS.map((part) => toggle(part.name, part.id === state.part, () => { state.part = part.id; render(); }, part.color));
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Kör és részei" });
  const info = make("div", "il-formula start");
  const message = make("p", "il-message");
  main.append(controls(...buttons), figure, info, message, make("p", "il-muted", "Húzd a kör pontjait (P és Q), hogy lásd, mi marad állandó és mi változik."));
  const drawLayer = svg("g", {}, figure);
  const handles = {};
  for (const key of ["p", "q"]) {
    const group = svg("g", {}, figure);
    svg("circle", { r: 20, fill: "transparent" }, group);
    svg("circle", { r: 8, style: "fill:var(--fg);stroke:var(--input);stroke-width:2.5" }, group);
    svg("text", { y: -14, "text-anchor": "middle", text: key.toUpperCase(), style: "font-weight:800;fill:var(--fg)" }, group);
    makeDraggable(figure, group, (x, y) => {
      const degrees = Math.round(wrap(Math.atan2(CENTER[1] - y, x - CENTER[0]) / RAD));
      const other = key === "p" ? state.q : state.p;
      const gap = Math.abs(((degrees - other + 540) % 360) - 180);
      if (180 - gap < 12 && currentPart().handles.length > 1) return; // keep P and Q apart
      state[key] = degrees;
      render();
    });
    handles[key] = group;
  }
  root.append(main, keyIdea("a sugár a középpontból a körvonalra megy, az átmérő a legnagyobb húr (2r), a szelő két pontban metszi a kört, az érintő csak egyben, és merőleges az érintési ponthoz tartozó sugárra. A körív, a körcikk és a körszelet pedig a kör darabjai."));

  const currentPart = () => PARTS.find((part) => part.id === state.part);

  function render() {
    const part = currentPart(), color = part.color;
    buttons.forEach((button, index) => button.setAttribute("aria-pressed", String(PARTS[index].id === state.part)));
    drawLayer.replaceChildren();
    const P = onCircle(state.p), Q = onCircle(state.q), O = CENTER;
    const line = (a, b, width = 4, extra = "") => svg("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], style: `stroke:${color};stroke-width:${width};stroke-linecap:round;${extra}` }, drawLayer);
    const span = wrap(state.q - state.p), large = span > 180 ? 1 : 0;
    const arcTo = `A ${RADIUS} ${RADIUS} 0 ${large} 0 ${Q[0]} ${Q[1]}`;
    if (part.id === "sector") svg("path", { d: `M ${O[0]} ${O[1]} L ${P[0]} ${P[1]} ${arcTo} Z`, style: `fill:${color};fill-opacity:.35;stroke:${color};stroke-width:3` }, drawLayer);
    if (part.id === "segment") svg("path", { d: `M ${P[0]} ${P[1]} ${arcTo} Z`, style: `fill:${color};fill-opacity:.35;stroke:${color};stroke-width:3` }, drawLayer);
    svg("circle", { cx: O[0], cy: O[1], r: RADIUS, fill: "none", style: "stroke:var(--fg);stroke-width:3" }, drawLayer);
    if (part.id === "arc") svg("path", { d: `M ${P[0]} ${P[1]} ${arcTo}`, fill: "none", style: `stroke:${color};stroke-width:7;stroke-linecap:round` }, drawLayer);
    svg("circle", { cx: O[0], cy: O[1], r: 4.5, style: "fill:var(--fg)" }, drawLayer);
    svg("text", { x: O[0] + 8, y: O[1] + 18, text: "O", style: "font-weight:800" }, drawLayer);

    let measure = "";
    if (part.id === "radius") { line(O, P); measure = `r = ${formatNumber(RADIUS / CM, 1)} cm`; }
    if (part.id === "diameter") { const P2 = onCircle(state.p + 180); line(P, P2); svg("circle", { cx: P2[0], cy: P2[1], r: 4.5, style: `fill:${color}` }, drawLayer); measure = `d = 2r = ${formatNumber((2 * RADIUS) / CM, 1)} cm`; }
    if (part.id === "chord") { line(P, Q); measure = `a húr hossza: ${formatNumber(Math.hypot(P[0] - Q[0], P[1] - Q[1]) / CM, 2)} cm (az átmérő ${formatNumber((2 * RADIUS) / CM, 1)} cm)`; }
    if (part.id === "secant") {
      const d = [Q[0] - P[0], Q[1] - P[1]], l = Math.hypot(...d);
      line([P[0] - (d[0] / l) * 600, P[1] - (d[1] / l) * 600], [P[0] + (d[0] / l) * 600, P[1] + (d[1] / l) * 600]);
      measure = "két közös pont: P és Q";
    }
    if (part.id === "tangent") {
      const d = [-(P[1] - O[1]) / RADIUS, (P[0] - O[0]) / RADIUS], out = [(P[0] - O[0]) / RADIUS, (P[1] - O[1]) / RADIUS];
      line([P[0] - d[0] * 600, P[1] - d[1] * 600], [P[0] + d[0] * 600, P[1] + d[1] * 600]);
      svg("line", { x1: O[0], y1: O[1], x2: P[0], y2: P[1], style: `stroke:var(--fg-soft);stroke-width:2;stroke-dasharray:6 5` }, drawLayer);
      const m = [P[0] - out[0] * 14, P[1] - out[1] * 14], a = [m[0] + d[0] * 14, m[1] + d[1] * 14], b = [P[0] + d[0] * 14, P[1] + d[1] * 14];
      svg("path", { d: `M ${m[0]} ${m[1]} L ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`, fill: "none", style: `stroke:${color};stroke-width:2` }, drawLayer);
      measure = "az érintő és a sugár szöge: 90°";
    }
    if (part.id === "arc" || part.id === "sector") measure = `a hozzá tartozó középponti szög: ${span}°`;
    if (part.id === "segment") measure = `a húr a kört ${span}°-os és ${360 - span}°-os ívre osztja`;
    info.replaceChildren(make("b", "", part.name), ": ", measure);
    handles.p.setAttribute("transform", `translate(${P[0]} ${P[1]})`);
    handles.q.setAttribute("transform", `translate(${Q[0]} ${Q[1]})`);
    handles.q.style.display = part.handles.includes("q") ? "" : "none";
    message.textContent = part.text;
  }

  render();
  return () => {};
}
