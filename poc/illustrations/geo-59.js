import { card, controls, formatNumber, gcd, keyIdea, lead, make, PALETTE, slot, svg, toggle, uniqueId } from "./kit.js";

// ---- Coordinate plane helper: grid, dynamic layer, draggable handles (snap to grid). ----
function createPlane(parent, { xMin = -6, xMax = 6, yMin = -5, yMax = 5, unit = 40, pad = 24 } = {}) {
  const width = (xMax - xMin) * unit + 2 * pad, height = (yMax - yMin) * unit + 2 * pad;
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${width} ${height}`, role: "img" }, parent);
  const toX = (x) => pad + (x - xMin) * unit, toY = (y) => pad + (yMax - y) * unit;
  for (let x = xMin; x <= xMax; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: pad, y2: height - pad, class: x ? "grid" : "axis" }, figure);
    if (x && (x % 2 === 0 || xMax - xMin <= 12)) svg("text", { x: toX(x), y: toY(0) + 15, "text-anchor": "middle", text: formatNumber(x), style: "font-size:10px;fill:var(--dim)" }, figure);
  }
  for (let y = yMin; y <= yMax; y++) {
    svg("line", { x1: pad, x2: width - pad, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    if (y) svg("text", { x: toX(0) - 6, y: toY(y) + 4, "text-anchor": "end", text: formatNumber(y), style: "font-size:10px;fill:var(--dim)" }, figure);
  }
  svg("text", { x: width - pad - 4, y: toY(0) - 7, "text-anchor": "end", text: "x", style: "font-style:italic" }, figure);
  svg("text", { x: toX(0) + 8, y: pad + 12, text: "y", style: "font-style:italic" }, figure);
  const layer = svg("g", {}, figure);
  const handleLayer = svg("g", {}, figure);
  const toMath = (event) => {
    const p = figure.createSVGPoint();
    p.x = event.clientX; p.y = event.clientY;
    const q = p.matrixTransform(figure.getScreenCTM().inverse());
    return [(q.x - pad) / unit + xMin, yMax - (q.y - pad) / unit];
  };
  // point is {x, y}; it is mutated while dragging. name is drawn next to the handle.
  function addHandle(point, { color, name, step = 1, onChange }) {
    const group = svg("g", { style: "cursor:grab;touch-action:none" }, handleLayer);
    svg("circle", { r: 18, style: "fill:transparent" }, group);
    const dot = svg("circle", { r: 8, style: `fill:${color};stroke:var(--input);stroke-width:2.5` }, group);
    const label = svg("text", { style: `fill:${color};font-weight:700;font-size:15px` }, group);
    const refresh = () => {
      const cx = toX(point.x), cy = toY(point.y);
      group.firstChild.setAttribute("cx", cx); group.firstChild.setAttribute("cy", cy);
      dot.setAttribute("cx", cx); dot.setAttribute("cy", cy);
      label.setAttribute("x", cx + 12); label.setAttribute("y", cy - 11); label.textContent = name;
    };
    let dragging = false;
    group.addEventListener("pointerdown", (event) => { dragging = true; group.setPointerCapture(event.pointerId); event.preventDefault(); });
    group.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const [mx, my] = toMath(event);
      point.x = Math.min(xMax, Math.max(xMin, Math.round(mx / step) * step));
      point.y = Math.min(yMax, Math.max(yMin, Math.round(my / step) * step));
      onChange();
    });
    const end = () => { dragging = false; };
    group.addEventListener("pointerup", end);
    group.addEventListener("pointercancel", end);
    refresh();
    return { refresh, group };
  }
  return { figure, layer, toX, toY, unit, addHandle, xMin, xMax, yMin, yMax };
}


// Exact rational numbers: { n, d } with d > 0, reduced.
export function rational(n, d) {
  const g = gcd(n, d) || 1, sign = d < 0 ? -1 : 1;
  return { n: (sign * n) / g, d: (sign * d) / g };
}
const text = ({ n, d }) => (d === 1 ? (n < 0 ? `−${-n}` : String(n)) : `${n < 0 ? "−" : ""}${Math.abs(n)}/${d}`);

// Line through P with slope m (rational): y = m x + b. Vertical lines have slope null.
export function lineThrough(p, slope) {
  if (!slope) return { vertical: true, c: p.x };
  return { vertical: false, m: slope, b: rational(p.y * slope.d - slope.n * p.x, slope.d) };
}
export function slopeOf(a, b) { return a.x === b.x ? null : rational(b.y - a.y, b.x - a.x); }
export function perpendicularSlope(slope) {
  if (!slope) return rational(0, 1);
  return slope.n === 0 ? null : rational(-slope.d, slope.n);
}

function equationText(line) {
  if (line.vertical) return `x = ${text({ n: line.c, d: 1 })}`;
  const m = line.m, b = line.b;
  const coefficient = m.n === 0 ? "" : m.d === 1 ? (m.n === 1 ? "x" : m.n === -1 ? "−x" : `${text(m)}x`) : `(${text(m)})x`;
  if (!coefficient) return `y = ${text(b)}`;
  return b.n === 0 ? `y = ${coefficient}` : `y = ${coefficient} ${b.n < 0 ? "−" : "+"} ${text({ n: Math.abs(b.n), d: b.d })}`;
}

export function mount(root) {
  const A = { x: -3, y: -2 }, B = { x: 1, y: 2 }, C = { x: 2, y: -3 }, state = { perpendicular: true, parallel: false };
  const clipId = uniqueId("line-clip");

  root.append(lead("Az egyenes meredeksége megmondja, mennyit emelkedik (vagy süllyed) az egyenes, ha egyet lépsz jobbra. Két pont már pontosan megadja az egyenest: a két pont közötti lépéseket egy kis háromszögben láthatod, abból pedig az egyenes egyenlete is kiolvasható."));

  const main = card("Húzd az A és a B pontot");
  const toggles = [
    toggle("merőleges egyenes C-n át", state.perpendicular, () => { state.perpendicular = !state.perpendicular; render(); }, PALETTE.violet),
    toggle("párhuzamos egyenes C-n át", state.parallel, () => { state.parallel = !state.parallel; render(); }, PALETTE.amber),
  ];
  const plane = createPlane(main);
  svg("rect", { x: 24, y: 24, width: 12 * 40, height: 10 * 40 }, svg("clipPath", { id: clipId }, svg("defs", {}, plane.figure)));
  plane.layer.setAttribute("clip-path", `url(#${clipId})`);
  const table = make("div", "il-formula start");
  main.append(controls(...toggles), plane.figure, table);
  const handleA = plane.addHandle(A, { color: PALETTE.blue, name: "A", onChange: render });
  const handleB = plane.addHandle(B, { color: PALETTE.red, name: "B", onChange: render });
  const handleC = plane.addHandle(C, { color: PALETTE.green, name: "C", onChange: render });
  root.append(main, keyIdea("az egyenes meredeksége m = Δy / Δx, egyenlete y = mx + b (b az y tengelymetszet); a függőleges egyenesnek nincs meredeksége, egyenlete x = c. Párhuzamos egyenesek meredeksége egyenlő, merőlegeseké pedig olyan, hogy a szorzatuk −1."));

  function drawLine(layer, line, style) {
    const { xMin, xMax, yMin, yMax } = plane;
    const [x1, y1, x2, y2] = line.vertical ? [line.c, yMin - 1, line.c, yMax + 1] : [xMin - 1, (line.m.n / line.m.d) * (xMin - 1) + line.b.n / line.b.d, xMax + 1, (line.m.n / line.m.d) * (xMax + 1) + line.b.n / line.b.d];
    svg("line", { x1: plane.toX(x1), y1: plane.toY(y1), x2: plane.toX(x2), y2: plane.toY(y2), style }, layer);
  }

  function render() {
    handleA.refresh(); handleB.refresh(); handleC.refresh();
    toggles.forEach((button, i) => button.setAttribute("aria-pressed", String(i === 0 ? state.perpendicular : state.parallel)));
    const showC = state.perpendicular || state.parallel;
    handleC.group.style.display = showC ? "" : "none";
    const layer = plane.layer;
    layer.replaceChildren();
    const same = A.x === B.x && A.y === B.y;
    const slope = slopeOf(A, B), main = same ? null : lineThrough(A, slope);
    if (main) drawLine(layer, main, `stroke:var(--accent);stroke-width:3.5`);
    if (main && showC) {
      if (state.parallel) drawLine(layer, lineThrough(C, slope), `stroke:${PALETTE.amber};stroke-width:2.5;stroke-dasharray:8 5`);
      if (state.perpendicular) drawLine(layer, lineThrough(C, perpendicularSlope(slope)), `stroke:${PALETTE.violet};stroke-width:2.5;stroke-dasharray:8 5`);
    }
    // Slope triangle: run from the left point to the right point, then rise.
    if (main && !main.vertical) {
      const [p, q] = A.x < B.x ? [A, B] : [B, A];
      const dx = q.x - p.x, dy = q.y - p.y;
      svg("path", { d: `M ${plane.toX(p.x)} ${plane.toY(p.y)} H ${plane.toX(q.x)} V ${plane.toY(q.y)}`, fill: "none", style: "stroke:var(--fg);stroke-width:2.2;stroke-dasharray:6 4" }, layer);
      const label = (x, y, content, anchor = "middle") => svg("text", { x, y, "text-anchor": anchor, text: content, style: "fill:var(--fg);font-weight:700;font-size:14px;paint-order:stroke;stroke:var(--input);stroke-width:4px" }, layer);
      label(plane.toX((p.x + q.x) / 2), plane.toY(p.y) + (dy >= 0 ? 18 : -8), `Δx = ${dx}`);
      if (dy) label(plane.toX(q.x) + 8, plane.toY((p.y + q.y) / 2) + 5, `Δy = ${dy < 0 ? "−" : ""}${Math.abs(dy)}`, "start");
    }

    const row = (label, body, color) => { const line = make("div"); const l = slot(label, 15, { align: "left" }); if (color) l.style.color = color; line.append(l, slot(body, 40, { align: "left" })); return line; };
    const rows = [];
    if (same) rows.push(row("egyenes", "Az A és a B pont egybeesik — húzd szét őket!"));
    else {
      rows.push(row("meredekség", main.vertical ? "a függőleges egyenesnek nincs meredeksége" : `m = Δy / Δx = ${A.x < B.x ? B.y - A.y : A.y - B.y} / ${Math.abs(B.x - A.x)} = ${text(slope)}`));
      rows.push(row("egyenlet", equationText(main), "var(--accent)"));
      if (showC && state.parallel) rows.push(row("párhuzamos", equationText(lineThrough(C, slope)), PALETTE.amber));
      if (showC && state.perpendicular) {
        const perpendicular = perpendicularSlope(slope);
        rows.push(row("merőleges", equationText(lineThrough(C, perpendicular)), PALETTE.violet));
        rows.push(row("", slope && perpendicular ? `m₁ · m₂ = ${text(slope)} · (${text(perpendicular)}) = −1` : "egy vízszintes és egy függőleges egyenes"));
      }
    }
    while (rows.length < 5) rows.push(row("", ""));
    table.replaceChildren(...rows);
  }

  render();
  return () => {};
}
