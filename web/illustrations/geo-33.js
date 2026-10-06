import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const RAYS = { vertex: { x: 60, y: 330 }, pixelsPerUnit: 50, factor: 0.85 };
const toUnit = (angleDegrees) => ({ x: Math.cos(angleDegrees * Math.PI / 180), y: -Math.sin(angleDegrees * Math.PI / 180) });
const RAY_UPPER = toUnit(28), RAY_LOWER = toUnit(4);
const STICK = { height: 2, pyramidHeight: 140, pyramidHalfBase: 115 };

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
  const state = { near: 140, far: 330, stickShadow: 2 };

  root.append(lead("Ha két félegyenest párhuzamos egyenesekkel elmetszünk, akkor a keletkező háromszögek alakja ugyanaz, csak a méretük különbözik. Ezért a megfelelő szakaszok aránya megegyezik. Ebből olyan távolságokat is ki lehet számolni, amelyeket nem tudunk lemérni."));

  // --- Parallel intercepts ---
  const cut = card("Húzd a párhuzamos egyeneseket");
  const cutFigure = svg("svg", { class: "il-svg", viewBox: "0 0 640 360", role: "img", "aria-label": "Két félegyenes és két párhuzamos metsző egyenes" });
  const { vertex } = RAYS;
  const along = (direction, distance) => ({ x: vertex.x + direction.x * distance, y: vertex.y + direction.y * distance });
  for (const [direction, color] of [[RAY_UPPER, PALETTE.violet], [RAY_LOWER, PALETTE.green]]) {
    const end = along(direction, 560);
    svg("line", { x1: vertex.x, y1: vertex.y, x2: end.x, y2: end.y, style: `stroke:${color};stroke-width:3` }, cutFigure);
  }
  const parallels = svg("g", {}, cutFigure);
  const parallelLines = [0, 1].map(() => svg("line", { style: `stroke:${PALETTE.amber};stroke-width:2.5` }, parallels));
  const pointLabels = svg("g", {}, cutFigure);
  svg("circle", { cx: vertex.x, cy: vertex.y, r: 5, style: "fill:var(--fg)" }, cutFigure);
  svg("text", { x: vertex.x - 16, y: vertex.y + 20, text: "S", style: "font-weight:800;fill:var(--fg)" }, cutFigure);
  const handles = ["near", "far"].map((key) => {
    const handle = svg("circle", { r: 12, style: `fill:${PALETTE.amber};stroke:var(--fg);stroke-width:2` }, cutFigure);
    makeDraggable(cutFigure, handle, (x, y) => {
      const distance = (x - vertex.x) * RAY_UPPER.x + (y - vertex.y) * RAY_UPPER.y;
      state[key] = Math.min(500, Math.max(50, distance));
      render();
    });
    return handle;
  });
  const cutReadout = make("div", "il-formula start"); cutReadout.style.whiteSpace = "pre-wrap";
  cut.append(cutFigure, cutReadout, make("p", "il-muted", "Fogd meg a narancs köröket a felső félegyenesen, és húzd őket. A szakaszok hossza változik, az arányuk nem."));

  // --- Shadow measurement ---
  const shadow = card("Hogyan mérte meg Thalész a piramis magasságát?");
  const shadowSlider = range({ label: "A bot árnyéka (a nap állása)", min: 1, max: 4, step: 0.5, value: state.stickShadow, format: (v) => `${formatNumber(v)} m`, onInput: (value) => { state.stickShadow = value; renderShadow(); } });
  const shadowFigure = svg("svg", { class: "il-svg", viewBox: "0 0 720 300", role: "img", "aria-label": "Bot és piramis árnyéka hasonló háromszögeket alkot" });
  const shadowReadout = make("div", "il-formula start");
  shadow.append(controls(shadowSlider.element), shadowFigure, shadowReadout,
    make("p", "il-muted", "Az ábra nem méretarányos: a bot a valóságban sokkal kisebb, a bal oldali kép ezért van nagyítva."));
  root.append(cut, shadow, keyIdea("ha két háromszög szögei egyenlők, akkor hasonlók, és a megfelelő oldalak aránya állandó. Így egy ismert hosszból (bot és árnyéka) kiszámolható egy ismeretlen (a piramis magassága)."));

  function render() {
    const { near, far } = state;
    const points = { A: along(RAY_UPPER, near), B: along(RAY_UPPER, far) };
    const lowerPoints = { A: along(RAY_LOWER, near * RAYS.factor), B: along(RAY_LOWER, far * RAYS.factor) };
    handles[0].setAttribute("cx", points.A.x); handles[0].setAttribute("cy", points.A.y);
    handles[1].setAttribute("cx", points.B.x); handles[1].setAttribute("cy", points.B.y);
    [["A", 0], ["B", 1]].forEach(([name, index]) => {
      const line = parallelLines[index], p = points[name], q = lowerPoints[name];
      // Extend each cutting line a little beyond the two rays.
      const dx = q.x - p.x, dy = q.y - p.y;
      for (const [attribute, value] of Object.entries({ x1: p.x - dx * 0.3, y1: p.y - dy * 0.3, x2: q.x + dx * 0.3, y2: q.y + dy * 0.3 })) line.setAttribute(attribute, value);
    });
    pointLabels.replaceChildren();
    for (const [name, p, q] of [["A", points.A, lowerPoints.A], ["B", points.B, lowerPoints.B]]) {
      svg("text", { x: p.x + 12, y: p.y - 10, text: name, style: "font-weight:800;fill:var(--fg)" }, pointLabels);
      svg("text", { x: q.x + 10, y: q.y + 22, text: `${name}'`, style: "font-weight:800;fill:var(--fg)" }, pointLabels);
      svg("circle", { cx: q.x, cy: q.y, r: 4.5, style: `fill:${PALETTE.green}` }, pointLabels);
    }
    const unit = RAYS.pixelsPerUnit;
    const upper = { SA: near / unit, SB: far / unit }, lower = { SA: near * RAYS.factor / unit, SB: far * RAYS.factor / unit };
    const gap = { upper: Math.abs(upper.SB - upper.SA), lower: Math.abs(lower.SB - lower.SA) };
    const ratioText = (numerator, denominator) => (denominator < 0.01 ? "—" : formatNumber(numerator / denominator, 3));
    const pair = (name, upperValue, lowerValue) => [`${name} = `, slot(formatNumber(upperValue, 2), 5), `   ${name}' = `, slot(formatNumber(lowerValue, 2), 5), make("br")];
    cutReadout.replaceChildren(
      ...pair("SA", upper.SA, lower.SA), ...pair("SB", upper.SB, lower.SB),
      "SA : SB = ", slot(ratioText(upper.SA, upper.SB), 6), "  SA' : SB' = ", slot(ratioText(lower.SA, lower.SB), 6), make("br"),
      "SA : AB = ", slot(ratioText(upper.SA, gap.upper), 6), "  SA' : A'B' = ", slot(ratioText(lower.SA, gap.lower), 6),
    );
  }

  function renderShadow() {
    const { stickShadow } = state;
    const groundY = 270, stickScale = 55, pyramidScale = 0.85, stickX = 30, pyramidX = 400;
    const pyramidShadow = STICK.pyramidHeight * stickShadow / STICK.height;
    const angle = Math.atan(STICK.height / stickShadow) * 180 / Math.PI;
    shadowFigure.replaceChildren();
    svg("line", { x1: 0, y1: groundY, x2: 720, y2: groundY, class: "axis" }, shadowFigure);
    // The sun is on the left; its rays are parallel, so both shadow triangles have the same angle.
    const stickTop = { x: stickX, y: groundY - STICK.height * stickScale }, stickTip = { x: stickX + stickShadow * stickScale, y: groundY };
    svg("polygon", { points: `${stickX},${groundY} ${stickTop.x},${stickTop.y} ${stickTip.x},${stickTip.y}`, style: `fill:${PALETTE.violet};fill-opacity:.35;stroke:${PALETTE.violet};stroke-width:2.5` }, shadowFigure);
    const apex = { x: pyramidX, y: groundY - STICK.pyramidHeight * pyramidScale }, pyramidTip = { x: pyramidX + pyramidShadow * pyramidScale, y: groundY };
    svg("polygon", { points: `${pyramidX - STICK.pyramidHalfBase * pyramidScale},${groundY} ${pyramidX + STICK.pyramidHalfBase * pyramidScale},${groundY} ${apex.x},${apex.y}`, style: "fill:rgba(232,163,61,.35);stroke:var(--il-amber);stroke-width:2.5" }, shadowFigure);
    svg("polygon", { points: `${pyramidX},${groundY} ${apex.x},${apex.y} ${pyramidTip.x},${pyramidTip.y}`, style: `fill:${PALETTE.violet};fill-opacity:.25;stroke:${PALETTE.violet};stroke-width:2.5` }, shadowFigure);
    svg("text", { x: stickX + 8, y: stickTop.y + 18, text: `${STICK.height} m`, style: "font-weight:700;fill:var(--fg)" }, shadowFigure);
    svg("text", { x: (stickX + stickTip.x) / 2, y: groundY + 22, "text-anchor": "middle", text: `${formatNumber(stickShadow)} m`, style: "font-weight:700;fill:var(--fg)" }, shadowFigure);
    svg("text", { x: apex.x + 8, y: (apex.y + groundY) / 2, text: "H = ?", style: "font-weight:800;fill:var(--fg)" }, shadowFigure);
    svg("text", { x: (pyramidX + pyramidTip.x) / 2, y: groundY + 22, "text-anchor": "middle", text: `${formatNumber(pyramidShadow)} m`, style: "font-weight:700;fill:var(--fg)" }, shadowFigure);
    svg("text", { x: 10, y: 24, text: `A napsugarak hajlásszöge: ${formatNumber(angle, 1)}°`, style: "fill:var(--dim)" }, shadowFigure);
    const result = pyramidShadow * STICK.height / stickShadow;
    shadowReadout.replaceChildren(
      "H : ", slot(formatNumber(pyramidShadow), 5), " = ", slot(String(STICK.height), 1), " : ", slot(formatNumber(stickShadow), 3),
      make("br"),
      "H = ", slot(formatNumber(pyramidShadow), 5), " · ", slot(String(STICK.height), 1), " / ", slot(formatNumber(stickShadow), 3), " = ", make("b", "", `${formatNumber(result)} m`),
    );
  }

  render();
  renderShadow();
  return () => {};
}
