import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const WIDTH = 600, HEIGHT = 320, UNIT = 40; // UNIT pixels = 1 cm in the distance figures

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

const RAD = Math.PI / 180;
const direction = (degrees) => [Math.cos(degrees * RAD), -Math.sin(degrees * RAD)]; // y axis points down
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

// Both end points of the line through `point` with the given unit direction, clipped to the figure.
function clippedLine(point, [dx, dy]) {
  const reach = (sign) => {
    const limits = [];
    const sx = dx * sign, sy = dy * sign;
    if (sx > 1e-9) limits.push((WIDTH - point[0]) / sx); else if (sx < -1e-9) limits.push(-point[0] / sx);
    if (sy > 1e-9) limits.push((HEIGHT - point[1]) / sy); else if (sy < -1e-9) limits.push(-point[1] / sy);
    const length = Math.min(...limits);
    return [point[0] + sx * length, point[1] + sy * length];
  };
  return [reach(-1), reach(1)];
}

function rightAngleMark(parent, corner, u, v, size, color) {
  const p1 = [corner[0] + u[0] * size, corner[1] + u[1] * size];
  const p2 = [p1[0] + v[0] * size, p1[1] + v[1] * size];
  const p3 = [corner[0] + v[0] * size, corner[1] + v[1] * size];
  svg("path", { d: `M ${p1} L ${p2} L ${p3}`, fill: "none", style: `stroke:${color};stroke-width:2` }, parent);
}

function handleDot(figure, color, onMove) {
  const group = svg("g", {}, figure);
  svg("circle", { r: 20, fill: "transparent" }, group);
  svg("circle", { r: 8, style: `fill:${color};stroke:var(--input);stroke-width:2.5` }, group);
  makeDraggable(figure, group, onMove);
  return group;
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Két egyenes vagy metszi egymást, vagy sosem találkozik. Ha sosem találkoznak és mindenütt ugyanolyan messze vannak, párhuzamosak. Ha éppen derékszöget zárnak be, merőlegesek. A távolságot mindig a legrövidebb úton mérjük, és az mindig merőleges."));

  // ---------- Card 1: two lines ----------
  const lines = [{ center: [190, 160], angle: 25 }, { center: [410, 160], angle: 115 }];
  const pair = card("Forgasd el az egyeneseket");
  const pairFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Két egyenes forgatható fogantyúkkal" });
  const pairReadout = make("div", "il-formula start");
  const pairMessage = make("p", "il-message");
  pair.append(pairFigure, pairReadout, pairMessage, make("p", "il-muted", "Húzd a pontokat. Ha majdnem párhuzamosra vagy merőlegesre állítod, az egyenes rátapad."));
  const pairLayer = svg("g", {}, pairFigure);
  const pairHandles = lines.map((line, index) => handleDot(pairFigure, index ? PALETTE.amber : PALETTE.blue, (x, y) => {
    let raw = (Math.atan2(line.center[1] - y, x - line.center[0]) / RAD + 360) % 360;
    const other = lines[1 - index].angle;
    for (const base of [0, 90, 180, 270].map((offset) => (other + offset) % 360)) {
      const gap = Math.abs(((raw - base + 540) % 360) - 180);
      if (180 - gap < 4) raw = base;
    }
    line.angle = Math.round(raw) % 360;
    renderPair();
  }));

  function renderPair() {
    pairLayer.replaceChildren();
    const colors = [PALETTE.blue, PALETTE.amber];
    lines.forEach((line, index) => {
      const [from, to] = clippedLine(line.center, direction(line.angle));
      svg("line", { x1: from[0], y1: from[1], x2: to[0], y2: to[1], style: `stroke:${colors[index]};stroke-width:3.5;stroke-linecap:round` }, pairLayer);
      svg("circle", { cx: line.center[0], cy: line.center[1], r: 3.5, style: "fill:var(--dim)" }, pairLayer);
      const [hx, hy] = direction(line.angle);
      pairHandles[index].setAttribute("transform", `translate(${line.center[0] + 95 * hx} ${line.center[1] + 95 * hy})`);
    });
    const difference = ((lines[1].angle - lines[0].angle) % 180 + 180) % 180;
    const angle = difference > 90 ? 180 - difference : difference;
    const kind = angle === 0 ? "párhuzamos" : angle === 90 ? "merőleges" : "metsző";
    if (angle !== 0) {
      const [d1, d2] = lines.map((line) => direction(line.angle));
      const [c1, c2] = lines.map((line) => line.center);
      const det = d1[0] * d2[1] - d1[1] * d2[0];
      const t = ((c2[0] - c1[0]) * d2[1] - (c2[1] - c1[1]) * d2[0]) / det;
      const cross = [c1[0] + d1[0] * t, c1[1] + d1[1] * t];
      if (cross[0] > 12 && cross[0] < WIDTH - 12 && cross[1] > 12 && cross[1] < HEIGHT - 12) {
        svg("circle", { cx: cross[0], cy: cross[1], r: 5, style: "fill:var(--fg)" }, pairLayer);
        if (angle === 90) rightAngleMark(pairLayer, cross, d1, d2, 14, "var(--fg)");
      }
    }
    pairReadout.replaceChildren("Az egyenesek: ", slot(make("b", "", kind), 11, { align: "left" }), slot(angle === 0 ? "" : `szögük: ${angle}°`, 14, { align: "left" }));
    pairMessage.className = `il-message ${angle === 0 || angle === 90 ? "good" : ""}`;
    pairMessage.textContent = angle === 0 ? "Párhuzamosak: nincs közös pontjuk, és bárhol mérjük, ugyanolyan messze vannak egymástól."
      : angle === 90 ? "Merőlegesek: a metszéspontban négy derékszöget zárnak be."
        : `Metszők: egy közös pontjuk van. Két szöget zárnak be: ${angle}° és ${180 - angle}° (a kettő összege 180°).`;
  }

  // ---------- Card 2: point-line distance ----------
  const dist = { p: [300, 70], sweep: null };
  const LINE_FROM = [0, 263.5], LINE_TO = [600, 211.6];
  const lineDirection = (() => { const l = Math.hypot(LINE_TO[0] - LINE_FROM[0], LINE_TO[1] - LINE_FROM[1]); return [(LINE_TO[0] - LINE_FROM[0]) / l, (LINE_TO[1] - LINE_FROM[1]) / l]; })();
  const pointCard = card("Mi a pont és az egyenes távolsága?");
  const pointFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Pont és egyenes távolsága" });
  const pointMessage = make("p", "il-message");
  const sweepButton = button("Mutasd meg: végigpróbáljuk", () => runSweep(), { ghost: true });
  pointCard.append(make("p", "", "Egy pontból sok szakasz húzható az egyenesig. Ezek közül a legrövidebb adja a távolságot. Húzd a P pontot, és hasonlítsd össze a hosszakat."), pointFigure, controls(sweepButton), pointMessage);
  const pointLayer = svg("g", {}, pointFigure);
  const pointHandle = handleDot(pointFigure, PALETTE.red, (x, y) => { dist.p = [clamp(x, 30, WIDTH - 30), clamp(y, 20, 190)]; dist.sweep = null; renderPoint(); });

  const footOf = (p) => {
    const s = (p[0] - LINE_FROM[0]) * lineDirection[0] + (p[1] - LINE_FROM[1]) * lineDirection[1];
    return { s, foot: [LINE_FROM[0] + lineDirection[0] * s, LINE_FROM[1] + lineDirection[1] * s] };
  };

  function renderPoint() {
    pointLayer.replaceChildren();
    svg("line", { x1: LINE_FROM[0], y1: LINE_FROM[1], x2: LINE_TO[0], y2: LINE_TO[1], style: "stroke:var(--fg);stroke-width:3.5;stroke-linecap:round" }, pointLayer);
    svg("text", { x: 552, y: 204, text: "e", style: "font-style:italic;font-weight:700;fill:var(--fg)" }, pointLayer);
    const { s, foot } = footOf(dist.p);
    const shortest = Math.hypot(dist.p[0] - foot[0], dist.p[1] - foot[1]);
    const segment = (point, style, label) => {
      svg("line", { x1: dist.p[0], y1: dist.p[1], x2: point[0], y2: point[1], style }, pointLayer);
      if (label !== undefined) svg("text", { x: (dist.p[0] + point[0]) / 2 + 6, y: (dist.p[1] + point[1]) / 2, text: label, style: "font-size:12px;fill:var(--dim)" }, pointLayer);
    };
    for (const offset of [-200, -120, -60, 70, 140, 220]) {
      const point = [foot[0] + lineDirection[0] * offset, foot[1] + lineDirection[1] * offset];
      if (point[0] < 10 || point[0] > WIDTH - 10) continue;
      segment(point, "stroke:var(--dim);stroke-width:1.5;stroke-dasharray:5 4", formatNumber(Math.hypot(dist.p[0] - point[0], dist.p[1] - point[1]) / UNIT, 1));
    }
    if (dist.sweep !== null) {
      const point = [foot[0] + lineDirection[0] * dist.sweep, foot[1] + lineDirection[1] * dist.sweep];
      segment(point, `stroke:${PALETTE.amber};stroke-width:3`);
      svg("circle", { cx: point[0], cy: point[1], r: 6, style: `fill:${PALETTE.amber}` }, pointLayer);
      svg("text", { x: point[0], y: point[1] + 26, "text-anchor": "middle", text: `${formatNumber(Math.hypot(dist.p[0] - point[0], dist.p[1] - point[1]) / UNIT, 2)} cm`, style: `font-weight:700;fill:${PALETTE.amber}` }, pointLayer);
    }
    const toPoint = [(dist.p[0] - foot[0]) / shortest, (dist.p[1] - foot[1]) / shortest];
    segment(foot, `stroke:${PALETTE.green};stroke-width:4`);
    rightAngleMark(pointLayer, foot, toPoint, [-lineDirection[0], -lineDirection[1]], 13, PALETTE.green);
    svg("text", { x: foot[0], y: foot[1] + 28, "text-anchor": "middle", text: `${formatNumber(shortest / UNIT, 2)} cm`, style: `font-weight:800;font-size:15px;fill:${PALETTE.green}` }, pointLayer);
    svg("circle", { cx: foot[0], cy: foot[1], r: 4.5, style: `fill:${PALETTE.green}` }, pointLayer);
    pointHandle.setAttribute("transform", `translate(${dist.p[0]} ${dist.p[1]})`);
    svg("text", { x: dist.p[0] + 14, y: dist.p[1] - 12, text: "P", style: `font-weight:700;fill:${PALETTE.red}` }, pointLayer);
    if (dist.sweep === null) {
      pointMessage.className = "il-message good";
      pointMessage.textContent = `A zöld szakasz merőleges az egyenesre, és ez a legrövidebb: ${formatNumber(shortest / UNIT, 2)} cm. A pont és az egyenes távolsága ennyi.`;
    }
    return s;
  }

  function runSweep() {
    scope.clearAll();
    const start = performance.now(), from = -230, to = 230, duration = 3600;
    let best = Infinity;
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      dist.sweep = from + (to - from) * progress;
      renderPoint();
      const length = Math.abs(Math.hypot(dist.sweep, Math.hypot(dist.p[0] - footOf(dist.p).foot[0], dist.p[1] - footOf(dist.p).foot[1])));
      best = Math.min(best, length);
      pointMessage.className = "il-message";
      pointMessage.textContent = `A narancs szakasz végigcsúszik az egyenesen. Eddigi legrövidebb hossza: ${formatNumber(best / UNIT, 2)} cm.`;
      if (progress < 1) scope.frame(step);
      else { dist.sweep = null; renderPoint(); }
    };
    scope.frame(step);
  }

  // ---------- Card 3: distance between parallel lines ----------
  const gap = { tilt: 15, offset: 100 };
  const parallelCard = card("Két párhuzamos egyenes távolsága");
  const tilt = range({ label: "Dőlésszög", min: -40, max: 40, step: 5, value: gap.tilt, format: (v) => `${v}°`, onInput: (value) => { gap.tilt = value; renderParallel(); } });
  const parallelFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Két párhuzamos egyenes és a távolságuk" });
  const parallelMessage = make("p", "il-message");
  parallelCard.append(make("p", "", "A távolságot mindig merőlegesen mérjük, és párhuzamos egyeneseknél ez mindenütt ugyanakkora. A ferde szakaszok hosszabbak."), controls(tilt.element), parallelFigure, parallelMessage);
  const parallelLayer = svg("g", {}, parallelFigure);
  const parallelHandle = handleDot(parallelFigure, PALETTE.violet, (x, y) => {
    const normal = direction(gap.tilt + 90), base = [300, 160];
    gap.offset = clamp((x - base[0]) * normal[0] + (y - base[1]) * normal[1], 30, 200);
    renderParallel();
  });

  function renderParallel() {
    parallelLayer.replaceChildren();
    const along = direction(gap.tilt), normal = direction(gap.tilt + 90); // normal points "up" on screen
    const base = [300, 160];
    const lowerCenter = [base[0] + normal[0] * 0, base[1] + normal[1] * 0];
    const shift = (point, amount) => [point[0] + normal[0] * amount, point[1] + normal[1] * amount];
    const upperCenter = shift(lowerCenter, gap.offset);
    for (const [center, label] of [[lowerCenter, "a"], [upperCenter, "b"]]) {
      const [from, to] = clippedLine(center, along);
      svg("line", { x1: from[0], y1: from[1], x2: to[0], y2: to[1], style: `stroke:${PALETTE.blue};stroke-width:3.5` }, parallelLayer);
      svg("text", { x: center[0] + along[0] * 240 + 6, y: center[1] + along[1] * 240 - 10, text: label, style: `font-style:italic;font-weight:700;fill:${PALETTE.blue}` }, parallelLayer);
    }
    const distance = gap.offset / UNIT;
    for (const position of [-150, 0, 150]) {
      const bottom = [lowerCenter[0] + along[0] * position, lowerCenter[1] + along[1] * position];
      const top = shift(bottom, gap.offset);
      svg("line", { x1: bottom[0], y1: bottom[1], x2: top[0], y2: top[1], style: `stroke:${PALETTE.green};stroke-width:3.5` }, parallelLayer);
      rightAngleMark(parallelLayer, bottom, along, normal, 11, PALETTE.green);
      svg("text", { x: (bottom[0] + top[0]) / 2 + 10, y: (bottom[1] + top[1]) / 2 + 5, text: `${formatNumber(distance, 2)} cm`, style: `font-weight:700;fill:${PALETTE.green}` }, parallelLayer);
    }
    const a = [lowerCenter[0] - along[0] * 125, lowerCenter[1] - along[1] * 125];
    const slantedTop = shift([a[0] + along[0] * 90, a[1] + along[1] * 90], gap.offset);
    svg("line", { x1: a[0], y1: a[1], x2: slantedTop[0], y2: slantedTop[1], style: `stroke:${PALETTE.red};stroke-width:2.5;stroke-dasharray:6 5` }, parallelLayer);
    svg("text", { x: (a[0] + slantedTop[0]) / 2 + 10, y: (a[1] + slantedTop[1]) / 2 + 4, text: `${formatNumber(Math.hypot(90, gap.offset) / UNIT, 2)} cm`, style: `fill:${PALETTE.red};font-weight:600` }, parallelLayer);
    const handlePoint = shift(upperCenter, 0);
    parallelHandle.setAttribute("transform", `translate(${handlePoint[0]} ${handlePoint[1]})`);
    parallelMessage.textContent = `A két párhuzamos egyenes távolsága ${formatNumber(distance, 2)} cm, bármelyik helyen mérjük merőlegesen. A piros szaggatott szakasz ferde, ezért hosszabb. Húzd a lila pontot a távolság változtatásához.`;
  }

  root.append(pair, pointCard, parallelCard, keyIdea("a két egyenes kölcsönös helyzete három eset lehet: párhuzamos (nincs közös pont), metsző (egy közös pont) és ezen belül merőleges (90°-os metszés). A távolság mindig a legrövidebb, vagyis a merőleges szakasz hossza."));
  renderPair();
  renderPoint();
  renderParallel();
  return () => scope.clearAll();
}
