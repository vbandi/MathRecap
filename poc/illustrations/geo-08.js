import { card, createScope, formatNumber, keyIdea, lead, make, PALETTE, slot, svg } from "./kit.js";

const WIDTH = 600, HEIGHT = 300, MARGIN = 20, CM = 40;
const RAD = Math.PI / 180;
const ANGLE_ROWS = [{ id: "acute", name: "hegyesszögű" }, { id: "right", name: "derékszögű" }, { id: "obtuse", name: "tompaszögű" }];
const SIDE_COLUMNS = [{ id: "scalene", name: "általános" }, { id: "isosceles", name: "egyenlő szárú" }, { id: "equilateral", name: "szabályos" }];

const EXAMPLES = {
  "acute-scalene": [[110, 250], [420, 250], [300, 60]],
  "acute-isosceles": [[130, 250], [470, 250], [300, 50]],
  "acute-equilateral": [[160, 260], [440, 260], [300, 17.5]],
  "right-scalene": [[120, 250], [440, 250], [120, 90]],
  "right-isosceles": [[150, 250], [350, 250], [150, 50]],
  "obtuse-scalene": [[100, 250], [400, 250], [150, 170]],
  "obtuse-isosceles": [[100, 250], [500, 250], [300, 170]],
};

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
const distance = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

// Classifies a triangle given as three points (with small tolerances for dragging by hand).
export function classify(points) {
  const [A, B, C] = points;
  const sides = [distance(B, C), distance(A, C), distance(A, B)]; // a, b, c
  const similar = (x, y) => Math.abs(x - y) <= 0.03 * Math.max(x, y);
  const angleAt = (i) => {
    const [V, P, N] = [points[i], points[(i + 1) % 3], points[(i + 2) % 3]];
    const cos = ((P[0] - V[0]) * (N[0] - V[0]) + (P[1] - V[1]) * (N[1] - V[1])) / (distance(V, P) * distance(V, N) || 1);
    return Math.acos(clamp(cos, -1, 1)) / RAD;
  };
  const angles = [0, 1, 2].map(angleAt);
  const equalPairs = [similar(sides[0], sides[1]), similar(sides[1], sides[2]), similar(sides[0], sides[2])];
  const equalCount = equalPairs.filter(Boolean).length;
  const bySides = equalCount === 3 || (equalCount === 2 && equalPairs.every(Boolean)) ? "equilateral" : equalCount >= 1 ? "isosceles" : "scalene";
  const largest = Math.max(...angles);
  const byAngles = Math.abs(largest - 90) <= 1.5 ? "right" : largest > 90 ? "obtuse" : "acute";
  return { sides, angles, equalPairs, bySides, byAngles };
}

export function mount(root) {
  const scope = createScope();
  const state = { points: EXAMPLES["acute-scalene"].map((p) => [...p]) };

  root.append(lead("A háromszögeket kétféleképpen csoportosítjuk: aszerint, hogy az oldalai egyformák-e, és aszerint, hogy a legnagyobb szöge hegyes, derék vagy tompa. A két szempont együtt egy rácsot ad. Húzd a csúcsokat, és nézd meg, melyik mezőbe kerül a háromszög."));

  const main = card("Formáld át a háromszöget");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Húzható háromszög" });
  const readout = make("div", "il-formula start");
  main.append(figure, readout);
  const drawLayer = svg("g", {}, figure);
  const handles = state.points.map((_, index) => {
    const group = svg("g", {}, figure);
    svg("circle", { r: 20, fill: "transparent" }, group);
    svg("circle", { r: 8, style: "fill:var(--fg);stroke:var(--input);stroke-width:2.5" }, group);
    makeDraggable(figure, group, (x, y) => { scope.clearAll(); state.points[index] = [clamp(x, MARGIN, WIDTH - MARGIN), clamp(y, MARGIN, HEIGHT - MARGIN)]; render(); });
    return group;
  });

  // --- 3 x 3 grid ---
  const gridCard = card("Melyik mezőbe tartozik? Kattints egy mezőre példáért");
  const grid = make("table", "il-table");
  grid.style.cssText = "border-collapse:separate;border-spacing:6px;margin:8px auto 0;font-family:var(--font)";
  const cells = {};
  const headRow = make("tr");
  headRow.append(make("th"));
  for (const column of SIDE_COLUMNS) { const th = make("th", "", column.name); th.style.cssText = "width:auto;text-align:center;color:var(--dim)"; headRow.append(th); }
  grid.append(headRow);
  for (const row of ANGLE_ROWS) {
    const tr = make("tr"), th = make("th", "", row.name);
    th.style.cssText = "width:auto;text-align:right;color:var(--dim);font-weight:700";
    tr.append(th);
    for (const column of SIDE_COLUMNS) {
      const key = `${row.id}-${column.id}`, td = make("td"), cell = make("button", "il-toggle", EXAMPLES[key] ? "példa" : "nem létezik");
      cell.type = "button";
      td.style.cssText = "width:auto;padding:0;border:none";
      cell.style.cssText = "width:100%;min-width:16ch;height:54px;border-radius:12px";
      if (EXAMPLES[key]) cell.addEventListener("click", () => morphTo(EXAMPLES[key]));
      else { cell.disabled = true; cell.style.opacity = 0.3; cell.style.cursor = "not-allowed"; }
      cells[key] = cell;
      td.append(cell); tr.append(td);
    }
    grid.append(tr);
  }
  const gridMessage = make("p", "il-message");
  gridCard.append(grid, gridMessage);
  root.append(main, gridCard, keyIdea("az oldalak szerint háromféle háromszög van: általános (nincs egyenlő oldal), egyenlő szárú (legalább két oldal egyenlő) és szabályos (mind a három egyenlő). A szögek szerint lehet hegyes-, derék- vagy tompaszögű. A szabályos háromszög mindig hegyesszögű (minden szöge 60°), ezért két mező üres."));

  function morphTo(target) {
    scope.clearAll();
    const from = state.points.map((p) => [...p]), start = performance.now(), duration = 700;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration), e = t * t * (3 - 2 * t);
      state.points = from.map((p, i) => [p[0] + (target[i][0] - p[0]) * e, p[1] + (target[i][1] - p[1]) * e]);
      render();
      if (t < 1) scope.frame(step);
    };
    scope.frame(step);
  }

  function render() {
    const info = classify(state.points), [A, B, C] = state.points;
    drawLayer.replaceChildren();
    svg("polygon", { points: state.points.map((p) => p.join(",")).join(" "), style: `fill:${PALETTE.blue};fill-opacity:.15;stroke:var(--fg);stroke-width:3;stroke-linejoin:round` }, drawLayer);
    const sideInfo = [[B, C, 0], [A, C, 1], [A, B, 2]];
    const groups = info.bySides === "equilateral" ? [[0, 1, 2]] : [];
    if (info.bySides === "isosceles") {
      if (info.equalPairs[0]) groups.push([0, 1]); else if (info.equalPairs[1]) groups.push([1, 2]); else groups.push([0, 2]);
    }
    const centre = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
    sideInfo.forEach(([p, q, index]) => {
      const mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], d = [centre[0] - mid[0], centre[1] - mid[1]], l = Math.hypot(...d) || 1;
      svg("text", { x: mid[0] - (d[0] / l) * 20, y: mid[1] - (d[1] / l) * 20 + 4, "text-anchor": "middle", text: `${"abc"[index]} ≈ ${formatNumber(info.sides[index] / CM, 1)}`, style: "font-size:12px" }, drawLayer);
      if (groups.some((g) => g.includes(index))) {
        const ux = (q[0] - p[0]) / (info.sides[index] || 1), uy = (q[1] - p[1]) / (info.sides[index] || 1);
        svg("line", { x1: mid[0] - uy * 7, y1: mid[1] + ux * 7, x2: mid[0] + uy * 7, y2: mid[1] - ux * 7, style: `stroke:${PALETTE.green};stroke-width:3` }, drawLayer);
      }
    });
    state.points.forEach((V, i) => {
      const d = [centre[0] - V[0], centre[1] - V[1]], l = Math.hypot(...d) || 1;
      const isRight = info.byAngles === "right" && info.angles[i] === Math.max(...info.angles);
      svg("text", { x: V[0] + (d[0] / l) * 34, y: V[1] + (d[1] / l) * 34 + 4, "text-anchor": "middle", text: `${Math.round(info.angles[i])}°`, style: `font-size:12px;font-weight:700;fill:${isRight ? PALETTE.red : "var(--fg-soft)"}` }, drawLayer);
      if (isRight) {
        const P = state.points[(i + 1) % 3], N = state.points[(i + 2) % 3];
        const u = [(P[0] - V[0]) / distance(V, P), (P[1] - V[1]) / distance(V, P)], w = [(N[0] - V[0]) / distance(V, N), (N[1] - V[1]) / distance(V, N)];
        svg("path", { d: `M ${V[0] + u[0] * 14} ${V[1] + u[1] * 14} L ${V[0] + (u[0] + w[0]) * 14} ${V[1] + (u[1] + w[1]) * 14} L ${V[0] + w[0] * 14} ${V[1] + w[1] * 14}`, fill: "none", style: `stroke:${PALETTE.red};stroke-width:2` }, drawLayer);
      }
    });
    handles.forEach((group, index) => group.setAttribute("transform", `translate(${state.points[index][0]} ${state.points[index][1]})`));

    const sideName = SIDE_COLUMNS.find((c) => c.id === info.bySides).name, angleName = ANGLE_ROWS.find((r) => r.id === info.byAngles).name;
    readout.replaceChildren("Oldalai szerint: ", slot(make("b", "", sideName), 14, { align: "left" }), "  Szögei szerint: ", slot(make("b", "", angleName), 13, { align: "left" }));
    for (const [key, cell] of Object.entries(cells)) {
      const active = key === `${info.byAngles}-${info.bySides}`;
      cell.setAttribute("aria-pressed", String(active));
    }
    gridMessage.textContent = `Ez a háromszög a rács „${angleName} / ${sideName}” mezőjében van. Egy kis eltérést engedünk, mert kézzel nem lehet tökéletesen pontosan húzni.`;
  }

  render();
  return () => scope.clearAll();
}
