import { button, card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const WIDTH = 600, HEIGHT = 380, MARGIN = 20;
const COLORS = [PALETTE.violet, PALETTE.blue, PALETTE.amber];
const NAMES = ["α", "β", "γ"];
const RAD = Math.PI / 180;

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
const unit = (a) => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; };
const mathAngle = (v) => Math.atan2(-v[1], v[0]) / RAD; // degrees, counter-clockwise, y up

// Circular sector centred at the origin covering math angles start .. start + size.
function sectorPath(radius, start, size) {
  const p = (degrees) => `${radius * Math.cos(degrees * RAD)} ${-radius * Math.sin(degrees * RAD)}`;
  return `M 0 0 L ${p(start)} A ${radius} ${radius} 0 ${size > 180 ? 1 : 0} 0 ${p(start + size)} Z`;
}

// Shortest sector between two directions (screen vectors): returns its start angle and size.
function sectorBetween(u, v) {
  const a = mathAngle(u), b = mathAngle(v);
  let d = ((b - a) % 360 + 540) % 360 - 180;
  return d >= 0 ? { start: a, size: d } : { start: b, size: -d };
}

export function mount(root) {
  const state = { points: [[170, 210], [440, 230], [300, 60]], torn: false, parallel: false, sides: { a: 3, b: 4, c: 5 } };

  root.append(lead("A háromszögnek három szöge van. Bármilyen alakú háromszöget rajzolsz, a három szög összege mindig ugyanannyi: 180°. Az oldalaknak is van egy szabálya: nem lehet akármilyen három hosszból háromszöget építeni."));

  // ---------- Angle sum ----------
  const sumCard = card("A háromszög szögeinek összege");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Húzható háromszög a szögeivel" });
  const tearButton = button("Tépd le a sarkokat!", () => { state.torn = !state.torn; if (state.torn) state.parallel = false; render(); });
  const parallelToggle = toggle("Miért? Párhuzamos C-n át", false, () => { state.parallel = !state.parallel; if (state.parallel) state.torn = false; render(); }, PALETTE.green);
  const sumLine = make("div", "il-formula start");
  const sumMessage = make("p", "il-message");
  sumCard.append(controls(tearButton, parallelToggle), figure, sumLine, sumMessage);

  const baseLayer = svg("g", {}, figure);
  const wedges = COLORS.map((color) => svg("path", { class: "il-move", style: `fill:${color};fill-opacity:.75;stroke:var(--input);stroke-width:1.5` }, figure));
  const labelLayer = svg("g", { style: "pointer-events:none" }, figure);
  const handles = state.points.map((_, index) => {
    const group = svg("g", {}, figure);
    svg("circle", { r: 20, fill: "transparent" }, group);
    svg("circle", { r: 8, style: `fill:var(--fg);stroke:var(--input);stroke-width:2.5` }, group);
    svg("text", { y: index === 2 ? -14 : 24, "text-anchor": "middle", text: "ABC"[index], style: "font-weight:800;fill:var(--fg)" }, group);
    makeDraggable(figure, group, (x, y) => {
      state.points[index] = [clamp(x, MARGIN, WIDTH - MARGIN), clamp(y, MARGIN, 250)];
      state.torn = false;
      render();
    });
    return group;
  });

  function render() {
    const [A, B, C] = state.points;
    baseLayer.replaceChildren(); labelLayer.replaceChildren();
    tearButton.textContent = state.torn ? "Vissza a helyükre" : "Tépd le a sarkokat!";
    parallelToggle.setAttribute("aria-pressed", String(state.parallel));
    svg("polygon", { points: state.points.map((p) => p.join(",")).join(" "), style: "fill:var(--fg);fill-opacity:.06;stroke:var(--fg);stroke-width:3;stroke-linejoin:round" }, baseLayer);

    const vertexData = [[A, B, C], [B, C, A], [C, A, B]].map(([V, P, N]) => ({ V, ...sectorBetween(sub(P, V), sub(N, V)) }));
    const rawAngles = vertexData.map((v) => v.size);
    const alpha = Math.round(rawAngles[0]), beta = Math.round(rawAngles[1]), gamma = 180 - alpha - beta;
    const shown = [alpha, beta, gamma];

    // Corner wedges: at their vertices, or torn off and lined up along a straight line.
    const target = [300, 345];
    const order = [2, 1, 0]; // left to right along the line: α, β, γ from the left edge → γ first from the right
    let cursor = 0;
    const finalStart = []; // math angle where each wedge starts on the straight line (0..180)
    for (const index of [2, 1, 0]) { finalStart[index] = cursor; cursor += rawAngles[index]; }
    wedges.forEach((wedge, index) => {
      const v = vertexData[index];
      wedge.setAttribute("d", sectorPath(40, v.start, v.size));
      if (state.torn) {
        const rotation = -(finalStart[index] - v.start);
        wedge.style.transform = `translate(${target[0]}px, ${target[1]}px) rotate(${((rotation + 540) % 360) - 180}deg)`;
      } else wedge.style.transform = `translate(${v.V[0]}px, ${v.V[1]}px) rotate(0deg)`;
    });
    void order;

    if (state.torn) {
      svg("line", { x1: target[0] - 150, y1: target[1], x2: target[0] + 150, y2: target[1], style: "stroke:var(--fg);stroke-width:3" }, baseLayer);
      svg("text", { x: target[0], y: target[1] + 26, "text-anchor": "middle", text: "egyenesszög = 180°", style: "font-weight:700" }, baseLayer);
    }
    if (state.parallel) {
      const u = unit(sub(B, A));
      svg("line", { x1: C[0] - u[0] * 700, y1: C[1] - u[1] * 700, x2: C[0] + u[0] * 700, y2: C[1] + u[1] * 700, style: `stroke:${PALETTE.green};stroke-width:2.5;stroke-dasharray:8 6` }, baseLayer);
      const parts = [sectorBetween([-u[0], -u[1]], sub(A, C)), sectorBetween(sub(A, C), sub(B, C)), sectorBetween(sub(B, C), u)];
      parts.forEach((part, index) => {
        const sector = svg("path", { d: sectorPath(36, part.start, part.size), style: `fill:${COLORS[[0, 2, 1][index]]};fill-opacity:.75;stroke:var(--input);stroke-width:1.5`, transform: `translate(${C[0]} ${C[1]})` }, baseLayer);
        void sector;
      });
    }
    if (!state.torn) {
      vertexData.forEach((v, index) => {
        const mid = v.start + v.size / 2;
        svg("text", { x: v.V[0] + 62 * Math.cos(mid * RAD), y: v.V[1] - 62 * Math.sin(mid * RAD) + 5, "text-anchor": "middle", text: `${NAMES[index]} = ${shown[index]}°`, style: `font-weight:800;fill:${COLORS[index]}` }, labelLayer);
      });
    } else {
      finalStart.forEach((start, index) => {
        const mid = start + rawAngles[index] / 2;
        svg("text", { x: target[0] + 70 * Math.cos(mid * RAD), y: target[1] - 70 * Math.sin(mid * RAD), "text-anchor": "middle", text: NAMES[index], style: `font-weight:800;fill:${COLORS[index]}` }, labelLayer);
      });
    }
    handles.forEach((group, index) => group.setAttribute("transform", `translate(${state.points[index][0]} ${state.points[index][1]})`));
    sumLine.replaceChildren("α + β + γ = ", slot(String(alpha), 3), " + ", slot(String(beta), 3), " + ", slot(String(gamma), 3), " = ", slot(make("b", "", `${alpha + beta + gamma}°`), 5, { align: "left" }));
    sumMessage.textContent = state.torn ? "A három letépett sarok egymás mellé illeszkedik, és együtt pontosan egy egyenesszöget (180°-ot) töltenek ki."
      : state.parallel ? "A C csúcson át az AB-vel párhuzamos egyenest húztunk. A váltószögek egyenlők, ezért a C-nél lévő három szög az α, γ és β: együtt egyenesszög."
        : "Húzd az A, B, C pontokat: a szögek változnak, az összegük nem. Próbáld ki a leszakítást is!";
  }

  // ---------- Triangle inequality ----------
  const sticks = card("Háromszög-egyenlőtlenség: zárható a háromszög?");
  const stickFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} 300`, role: "img", "aria-label": "Három pálca háromszögnek összeállítva" });
  const sliders = ["a", "b", "c"].map((name) => range({ label: `${name} pálca`, min: 1, max: 10, step: 1, value: state.sides[name], format: (v) => `${v} egység`, onInput: (value) => { state.sides[name] = value; renderSticks(); } }));
  const checks = make("div", "il-formula start");
  const stickMessage = make("p", "il-message");
  sticks.append(make("p", "", "Három pálcából akkor lehet háromszöget hajlítani, ha bármelyik kettő együtt hosszabb a harmadiknál. Állítsd be a hosszakat, és nézd meg, mikor zárul a háromszög."), controls(...sliders.map((s) => s.element)), stickFigure, checks, stickMessage);

  function renderSticks() {
    const { a, b, c } = state.sides, unitPx = 45, P = [70, 250], Q = [70 + c * unitPx, 250];
    stickFigure.replaceChildren();
    const stick = (from, to, color, label) => {
      svg("line", { x1: from[0], y1: from[1], x2: to[0], y2: to[1], style: `stroke:${color};stroke-width:7;stroke-linecap:round` }, stickFigure);
      svg("text", { x: (from[0] + to[0]) / 2, y: (from[1] + to[1]) / 2 - 12, "text-anchor": "middle", text: label, style: `font-weight:800;fill:${color}` }, stickFigure);
    };
    const closes = a + b > c && a + c > b && b + c > a;
    stick(P, Q, PALETTE.violet, `c = ${c}`);
    if (closes) {
      const x = (b * b + c * c - a * a) / (2 * c), h = Math.sqrt(Math.max(0, b * b - x * x));
      const top = [P[0] + x * unitPx, P[1] - h * unitPx];
      stick(P, top, PALETTE.blue, `b = ${b}`); stick(Q, top, PALETTE.amber, `a = ${a}`);
      svg("circle", { cx: top[0], cy: top[1], r: 6, style: "fill:var(--fg)" }, stickFigure);
    } else {
      // The sticks cannot meet: lay them flat towards each other and show the gap or the overlap.
      stick([P[0], P[1] - 26], [P[0] + b * unitPx, P[1] - 26], PALETTE.blue, `b = ${b}`);
      stick([Q[0], Q[1] - 56], [Q[0] - a * unitPx, Q[1] - 56], PALETTE.amber, `a = ${a}`);
    }
    const rows = [["a + b", a + b, c, "c"], ["a + c", a + c, b, "b"], ["b + c", b + c, a, "a"]];
    checks.replaceChildren(...rows.map(([left, sum, other, name]) => {
      const ok = sum > other, row = make("div");
      row.style.color = ok ? "var(--accent)" : "var(--warn)";
      row.append(slot(ok ? "✓" : "✗", 2, { align: "left" }), slot(left, 6, { align: "left" }), ` = ${formatNumber(sum)}`.padEnd(6, " "), slot(ok ? ">" : "≤", 2), `${name} = ${other}`);
      return row;
    }));
    stickMessage.className = `il-message ${closes ? "good" : "warn"}`;
    stickMessage.textContent = closes ? "Mindhárom összeg nagyobb a harmadik oldalnál: a háromszög zárul."
      : a + b === c || a + c === b || b + c === a ? "Az egyik oldal pontosan egyenlő a másik kettő összegével: a pálcák egy egyenes szakaszba simulnak, nem lesz belőle háromszög."
        : "Az egyik oldal hosszabb, mint a másik kettő együtt: a két pálca nem ér össze, nem lesz háromszög.";
  }

  root.append(sumCard, sticks, keyIdea("a háromszög szögeinek összege mindig 180°. Három szakaszból akkor építhető háromszög, ha bármelyik kettő összege nagyobb a harmadiknál: a + b > c, a + c > b és b + c > a."));
  render();
  renderSticks();
  return () => {};
}
