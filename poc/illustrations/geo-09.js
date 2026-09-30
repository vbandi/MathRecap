import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const WIDTH = 600, HEIGHT = 330, MARGIN = 24;
const RAD = Math.PI / 180;
const VERTEX_COLORS = [PALETTE.violet, PALETTE.blue, PALETTE.amber];

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

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const mathAngle = (v) => Math.atan2(-v[1], v[0]) / RAD;

function sectorPath(radius, start, size) {
  const p = (degrees) => `${radius * Math.cos(degrees * RAD)} ${-radius * Math.sin(degrees * RAD)}`;
  return `M 0 0 L ${p(start)} A ${radius} ${radius} 0 ${size > 180 ? 1 : 0} 0 ${p(start + size)} Z`;
}

function sectorBetween(u, v) {
  const a = mathAngle(u), b = mathAngle(v);
  const d = ((b - a) % 360 + 540) % 360 - 180;
  return d >= 0 ? { start: a, size: d } : { start: b, size: -d };
}

// Interior angles rounded so that they always add up to 180°.
function interiorAngles(points) {
  const raw = points.map((V, i) => sectorBetween(sub(points[(i + 1) % 3], V), sub(points[(i + 2) % 3], V)).size);
  const a = Math.round(raw[0]), b = Math.round(raw[1]);
  return [a, b, 180 - a - b];
}

export function mount(root) {
  const scope = createScope();
  const state = { points: [[140, 250], [460, 270], [330, 60]], vertex: 2, moved: false };

  root.append(lead("Ha a háromszög egyik oldalát meghosszabbítod az egyik csúcsnál, a hosszabbítás és a másik oldal közti szög a háromszög külső szöge. Megmutatjuk, hogy ez mindig a másik két belső szög összege, és hogy a külső szögek együtt egy teljes kört adnak ki."));

  // ---------- Exterior angle = sum of the two other angles ----------
  const main = card("A külső szög a két szemközti belső szög összege");
  const vertexButtons = ["A", "B", "C"].map((name, index) => toggle(`${name} csúcsnál`, index === state.vertex, () => { state.vertex = index; state.moved = false; render(); }, VERTEX_COLORS[index]));
  const moveButton = button("Helyezd át a két belső szöget", () => { state.moved = !state.moved; render(); });
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Háromszög külső szöggel" });
  const equationLine = make("div", "il-formula start");
  const message = make("p", "il-message");
  main.append(controls(...vertexButtons, moveButton), figure, equationLine, message);
  const baseLayer = svg("g", {}, figure);
  const wedges = [0, 1].map(() => svg("path", { class: "il-move", style: "stroke:var(--input);stroke-width:1.5;fill-opacity:.8" }, figure));
  const labelLayer = svg("g", { style: "pointer-events:none" }, figure);
  const handles = state.points.map((_, index) => {
    const group = svg("g", {}, figure);
    svg("circle", { r: 20, fill: "transparent" }, group);
    svg("circle", { r: 8, style: "fill:var(--fg);stroke:var(--input);stroke-width:2.5" }, group);
    svg("text", { y: index === 2 ? -14 : 24, "text-anchor": "middle", text: "ABC"[index], style: "font-weight:800;fill:var(--fg)" }, group);
    makeDraggable(figure, group, (x, y) => { state.points[index] = [clamp(x, MARGIN, WIDTH - MARGIN), clamp(y, MARGIN, HEIGHT - MARGIN)]; state.moved = false; stopWalk(); render(); });
    return group;
  });

  // ---------- Walking around the triangle ----------
  const walkCard = card("Sétálj körbe a háromszögön");
  const walkFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Körbejárás a külső szögek szerinti fordulatokkal" });
  const walkButton = button("Indulhat a séta", () => startWalk());
  const walkSum = make("div", "il-formula start");
  const walkMessage = make("p", "il-message");
  walkCard.append(make("p", "", "Egy teknős végigmegy a háromszög oldalain, és minden csúcsnál annyit fordul, amennyi a külső szög. Mennyit fordult összesen, mire visszaért ugyanabba az irányba?"), controls(walkButton), walkFigure, walkSum, walkMessage);
  const walkLayer = svg("g", {}, walkFigure);

  root.append(main, walkCard, keyIdea("a háromszög bármelyik külső szöge egyenlő a két nem mellette lévő belső szög összegével. A három külső szög (csúcsonként egyet véve) összege mindig 360°, bármilyen háromszögről van szó."));

  function render() {
    const { points, vertex } = state, [P, V, N] = [points[(vertex + 2) % 3], points[vertex], points[(vertex + 1) % 3]];
    const angles = interiorAngles(points);
    const pIndex = (vertex + 2) % 3, nIndex = (vertex + 1) % 3;
    const exterior = angles[pIndex] + angles[nIndex];
    vertexButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === vertex)));
    moveButton.textContent = state.moved ? "Vissza a helyükre" : "Helyezd át a két belső szöget";
    baseLayer.replaceChildren(); labelLayer.replaceChildren();
    svg("polygon", { points: points.map((p) => p.join(",")).join(" "), style: "fill:var(--fg);fill-opacity:.06;stroke:var(--fg);stroke-width:3;stroke-linejoin:round" }, baseLayer);

    // Extension of side PV beyond V and the exterior angle wedge.
    const direction = sub(V, P), length = Math.hypot(...direction) || 1, unitDirection = [direction[0] / length, direction[1] / length];
    svg("line", { x1: V[0], y1: V[1], x2: V[0] + unitDirection[0] * 120, y2: V[1] + unitDirection[1] * 120, style: "stroke:var(--fg);stroke-width:2.5;stroke-dasharray:7 5" }, baseLayer);
    const outer = sectorBetween(direction, sub(N, V));
    svg("path", { d: sectorPath(58, outer.start, outer.size), transform: `translate(${V[0]} ${V[1]})`, style: `fill:${PALETTE.pink};fill-opacity:.25;stroke:${PALETTE.pink};stroke-width:2` }, baseLayer);
    const mid = outer.start + outer.size / 2;
    svg("text", { x: V[0] + 82 * Math.cos(mid * RAD), y: V[1] - 82 * Math.sin(mid * RAD) + 5, "text-anchor": "middle", text: `külső: ${exterior}°`, style: `font-weight:800;fill:${PALETTE.pink}` }, labelLayer);

    [[pIndex, P], [nIndex, N]].forEach(([index, vertexPoint], k) => {
      const prev = points[(index + 1) % 3], next = points[(index + 2) % 3];
      const wedge = sectorBetween(sub(prev, vertexPoint), sub(next, vertexPoint));
      wedges[k].setAttribute("d", sectorPath(36, wedge.start, wedge.size));
      wedges[k].style.fill = VERTEX_COLORS[index];
      const target = state.moved ? V : vertexPoint, rotation = state.moved && k === 1 ? 180 : 0;
      wedges[k].style.transform = `translate(${target[0]}px, ${target[1]}px) rotate(${rotation}deg)`;
      if (!state.moved) {
        const m = wedge.start + wedge.size / 2;
        svg("text", { x: vertexPoint[0] + 64 * Math.cos(m * RAD), y: vertexPoint[1] - 64 * Math.sin(m * RAD) + 5, "text-anchor": "middle", text: `${"αβγ"[index]} = ${angles[index]}°`, style: `font-weight:800;fill:${VERTEX_COLORS[index]}` }, labelLayer);
      }
    });
    if (!state.moved) {
      const own = sectorBetween(sub(N, V), sub(P, V)), m = own.start + own.size / 2;
      svg("text", { x: V[0] + 64 * Math.cos(m * RAD), y: V[1] - 64 * Math.sin(m * RAD) + 5, "text-anchor": "middle", text: `${"αβγ"[vertex]} = ${angles[vertex]}°`, style: "font-weight:800;fill:var(--fg-soft)" }, labelLayer);
    }
    handles.forEach((group, index) => group.setAttribute("transform", `translate(${points[index][0]} ${points[index][1]})`));
    equationLine.replaceChildren("külső szög = ", slot(`${"αβγ"[pIndex]} + ${"αβγ"[nIndex]}`, 5, { align: "left" }), " = ", slot(String(angles[pIndex]), 3), " + ", slot(String(angles[nIndex]), 3), " = ", slot(make("b", "", `${exterior}°`), 5, { align: "left" }));
    message.textContent = state.moved ? "A két belső szög pontosan kitölti a külső szöget: egymás mellé fekszenek benne, rés és átfedés nélkül."
      : `A ${"ABC"[vertex]} csúcsnál a külső szög ${exterior}°. A belső szög itt ${angles[vertex]}°, vagyis a kettő együtt 180° (mellékszögek). Kattints a gombra, és nézd meg, hogyan fér bele a másik két szög!`;
    drawWalk(null);
  }

  // ---------- Turtle ----------
  let walk = null;
  function stopWalk() { scope.clearAll(); walk = null; walkButton.disabled = false; }

  function walkGeometry() {
    const { points } = state, angles = interiorAngles(points);
    const turn = angles.map((a) => 180 - a); // exterior angle at A, B, C
    const edgeAngle = (i) => Math.atan2(points[(i + 1) % 3][1] - points[i][1], points[(i + 1) % 3][0] - points[i][0]) / RAD;
    const orientation = Math.sign((points[1][0] - points[0][0]) * (points[2][1] - points[1][1]) - (points[1][1] - points[0][1]) * (points[2][0] - points[1][0])) || 1;
    return { points, turn, orientation, startHeading: edgeAngle(0) };
  }

  function drawWalk(progress) {
    const g = walkGeometry();
    walkLayer.replaceChildren();
    svg("polygon", { points: g.points.map((p) => p.join(",")).join(" "), style: "fill:none;stroke:var(--dim);stroke-width:2.5;stroke-linejoin:round" }, walkLayer);
    g.points.forEach((p, i) => svg("text", { x: p[0], y: p[1] + (i === 2 ? -14 : 26), "text-anchor": "middle", text: "ABC"[i], style: "font-weight:800;fill:var(--fg-soft)" }, walkLayer));
    const gauge = [520, 90];
    svg("circle", { cx: gauge[0], cy: gauge[1], r: 52, fill: "none", style: "stroke:var(--line-strong);stroke-width:2" }, walkLayer);
    if (!progress) {
      svg("text", { x: gauge[0], y: gauge[1] + 5, "text-anchor": "middle", text: "0°", style: "font-weight:800;font-size:18px" }, walkLayer);
      walkSum.replaceChildren("Fordulatok összege: ", slot("0°", 5, { align: "left" }));
      return;
    }
    // Finished turns are drawn as coloured pie slices of the full-turn gauge.
    let turned = 0;
    progress.turns.forEach((amount, i) => {
      if (amount <= 0) return;
      const from = turned, to = turned + amount, p = (deg) => `${gauge[0] + 52 * Math.sin(deg * RAD)} ${gauge[1] - 52 * Math.cos(deg * RAD)}`;
      svg("path", { d: `M ${gauge.join(" ")} L ${p(from)} A 52 52 0 ${to - from > 180 ? 1 : 0} 1 ${p(Math.min(to, 359.99))} Z`, style: `fill:${VERTEX_COLORS[i]};fill-opacity:.8` }, walkLayer);
      turned = to;
    });
    svg("text", { x: gauge[0], y: gauge[1] + 5, "text-anchor": "middle", text: `${Math.round(turned)}°`, style: "font-weight:800;font-size:18px;fill:var(--fg)" }, walkLayer);
    const [x, y] = progress.position, heading = progress.heading * RAD;
    const tip = [x + 15 * Math.cos(heading), y + 15 * Math.sin(heading)], left = [x + 10 * Math.cos(heading + 2.5), y + 10 * Math.sin(heading + 2.5)], right = [x + 10 * Math.cos(heading - 2.5), y + 10 * Math.sin(heading - 2.5)];
    svg("polygon", { points: [tip, left, right].map((p) => p.join(",")).join(" "), style: `fill:${PALETTE.green};stroke:var(--input);stroke-width:1.5` }, walkLayer);
    const done = progress.turns.filter((t) => t > 0);
    walkSum.replaceChildren("Fordulatok összege: ", slot(done.length ? `${done.map((t) => `${t}°`).join(" + ")} = ${Math.round(turned)}°` : "0°", 26, { align: "left" }));
  }

  function startWalk() {
    stopWalk();
    const g = walkGeometry(), turns = [0, 0, 0];
    walkButton.disabled = true;
    walkMessage.className = "il-message";
    walkMessage.textContent = "A teknős megy és fordul…";
    let stage = 0; // 0,2,4: walking side 0,1,2; 1,3,5: turning at B, C, A
    let startTime = performance.now();
    const duration = (s) => (s % 2 === 0 ? 1100 : 700);
    const frame = (now) => {
      const t = Math.min(1, (now - startTime) / duration(stage)), side = Math.floor(stage / 2);
      const from = g.points[side], to = g.points[(side + 1) % 3];
      const heading = g.startHeading + g.orientation * turns.slice(1, side + 1).reduce((s, v) => s + v, 0);
      if (stage % 2 === 0) {
        drawWalk({ turns: [...turns], position: [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t], heading });
      } else {
        const turnIndex = (side + 1) % 3, current = [...turns];
        current[turnIndex] = Math.round(g.turn[turnIndex] * t);
        drawWalk({ turns: current, position: to, heading: heading + g.orientation * g.turn[turnIndex] * t });
      }
      if (t < 1) { scope.frame(frame); return; }
      if (stage % 2 === 1) turns[(side + 1) % 3] = g.turn[(side + 1) % 3];
      stage += 1;
      startTime = performance.now();
      if (stage < 6) scope.frame(frame);
      else {
        drawWalk({ turns: [...turns], position: g.points[0], heading: g.startHeading + g.orientation * 360 });
        walkButton.disabled = false;
        walkMessage.className = "il-message good";
        walkMessage.textContent = "A teknős egy teljes kört fordult, és újra az eredeti irányba néz: a három külső szög összege 360°.";
      }
    };
    scope.frame(frame);
  }

  render();
  return () => scope.clearAll();
}
