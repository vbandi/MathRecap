import { button, card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const SQUARES_VIEW = { width: 600, height: 420, margin: 30 };
const PROOF_SIZE = 300;
const TRIANGLE_COLORS = [PALETTE.violet, PALETTE.blue, PALETTE.pink, PALETTE.amber];

// Rigid motions (translate x, y, rotate deg) placing the reference triangle (0,0), (a,0), (0,b)
// in the two arrangements of an (a+b)-sided square. Only translations differ between them.
function proofPlacements(a, b) {
  const s = a + b;
  return [
    { withHypotenuseSquare: [0, 0, 0], withLegSquares: [0, a, 0] },
    { withHypotenuseSquare: [s, 0, 90], withLegSquares: [s, 0, 90] },
    { withHypotenuseSquare: [s, s, 180], withLegSquares: [a, s, 180] },
    { withHypotenuseSquare: [0, s, -90], withLegSquares: [a, a, -90] },
  ];
}

const pointsAttribute = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");

export function mount(root) {
  const state = { a: 3, b: 4, arrangement: "withHypotenuseSquare" };

  root.append(lead("Derékszögű háromszögben a két rövidebb oldal (befogók: a és b) fölé rajzolt négyzetek területének összege pontosan akkora, mint a leghosszabb oldal (átfogó: c) fölé rajzolt négyzet területe."));

  // --- Squares on the sides ---
  const squares = card("Négyzetek a háromszög oldalain");
  const legA = range({ label: "a befogó", min: 1, max: 6, value: state.a, onInput: (value) => { state.a = value; render(); } });
  const legB = range({ label: "b befogó", min: 1, max: 6, value: state.b, onInput: (value) => { state.b = value; render(); } });
  const squaresFormula = make("div", "il-formula");
  const squaresFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${SQUARES_VIEW.width} ${SQUARES_VIEW.height}`, role: "img", "aria-label": "Derékszögű háromszög, oldalain négyzetekkel" });
  squares.append(controls(legA.element, legB.element), squaresFigure, squaresFormula,
    make("p", "il-muted", "A 3–4 párnál az átfogó is egész szám: 5. Ilyen még például a 6–8–10 és az 5–12–13 — ezek a pitagoraszi számhármasok."));

  // --- Proof by rearrangement ---
  const proof = card("Miért igaz? Bizonyítás átdarabolással");
  const proofFigure = svg("svg", { class: "il-svg", viewBox: `0 0 600 ${PROOF_SIZE + 60}`, role: "img", "aria-label": "Négy egybevágó háromszög kétféle elrendezése egy négyzetben" });
  const caption = make("p", "il-message");
  const rearrangeButton = button("Átrendezés", () => {
    state.arrangement = state.arrangement === "withHypotenuseSquare" ? "withLegSquares" : "withHypotenuseSquare";
    renderProof();
  });
  proof.append(proofFigure, controls(rearrangeButton), caption);
  root.append(squares, proof, keyIdea("a² + b² = c² csak derékszögű háromszögre igaz — és visszafelé is működik: ha egy háromszög oldalaira teljesül, akkor biztosan derékszögű. A képlettel két oldalból kiszámolható a harmadik."));

  const proofScale = svg("g", {}, proofFigure);
  const proofOutline = svg("rect", { fill: "none", style: "stroke:var(--fg-soft);stroke-width:2", "vector-effect": "non-scaling-stroke" }, proofScale);
  const triangles = TRIANGLE_COLORS.map((color) => svg("polygon", { class: "il-move", style: `fill:${color};fill-opacity:.8;stroke:var(--input);stroke-width:2`, "vector-effect": "non-scaling-stroke" }, proofScale));
  const proofLabels = svg("g", {}, proofFigure);

  function render() {
    renderSquares();
    renderProof();
  }

  function renderSquares() {
    const { a, b } = state;
    const cSquared = a * a + b * b, c = Math.sqrt(cSquared);
    const scale = Math.min((SQUARES_VIEW.width - 2 * SQUARES_VIEW.margin) / (2 * a + b), (SQUARES_VIEW.height - 2 * SQUARES_VIEW.margin) / (a + 2 * b));
    const offsetX = (SQUARES_VIEW.width - (2 * a + b) * scale) / 2 + a * scale;
    const offsetY = (SQUARES_VIEW.height - (a + 2 * b) * scale) / 2 + (a + b) * scale;
    // Math coordinates (y up) with the right angle at the origin, leg a on the y axis, leg b on the x axis.
    const map = ([x, y]) => [offsetX + x * scale, offsetY - y * scale];
    const polygon = (points, style) => svg("polygon", { points: pointsAttribute(points.map(map)), style }, squaresFigure);
    const line = (from, to, style) => { const [x1, y1] = map(from), [x2, y2] = map(to); svg("line", { x1, y1, x2, y2, style }, squaresFigure); };
    const label = (point, text, style = "") => { const [x, y] = map(point); svg("text", { x, y: y + 5, "text-anchor": "middle", text, style: `font-weight:700;${style}` }, squaresFigure); };
    const gridStyle = "stroke:rgba(14,17,32,.45);stroke-width:1";

    squaresFigure.replaceChildren();
    polygon([[0, 0], [b, 0], [b, -b], [0, -b]], `fill:${PALETTE.blue};fill-opacity:.75`);
    polygon([[0, 0], [0, a], [-a, a], [-a, 0]], `fill:${PALETTE.violet};fill-opacity:.75`);
    const hypotenuseSquare = [[b, 0], [0, a], [a, a + b], [a + b, b]];
    polygon(hypotenuseSquare, "fill:var(--accent);fill-opacity:.8");
    for (let t = 1; t < b; t++) { line([t, 0], [t, -b], gridStyle); line([0, -t], [b, -t], gridStyle); }
    for (let t = 1; t < a; t++) { line([0, t], [-a, t], gridStyle); line([-t, 0], [-t, a], gridStyle); }
    // Unit grid of the tilted square: u runs along the hypotenuse, v points outwards.
    const u = [-b / c, a / c], v = [a / c, b / c];
    const along = (start, direction, length) => [start[0] + direction[0] * length, start[1] + direction[1] * length];
    for (let t = 1; t < c - 1e-9; t++) {
      line(along([b, 0], u, t), along(along([b, 0], u, t), v, c), gridStyle);
      line(along([b, 0], v, t), along(along([b, 0], v, t), u, c), gridStyle);
    }
    polygon([[0, 0], [b, 0], [0, a]], "fill:var(--surface);stroke:var(--fg);stroke-width:2.5");
    const marker = Math.min(a, b, 1) * 0.35;
    const [mx, my] = map([0, 0]);
    svg("path", { d: `M ${mx} ${my - marker * scale} h ${marker * scale} v ${marker * scale}`, fill: "none", style: "stroke:var(--fg);stroke-width:1.5" }, squaresFigure);
    label([b / 2, -b / 2], `b² = ${b * b}`, "fill:#fff");
    label([-a / 2, a / 2], `a² = ${a * a}`, "fill:#fff");
    label([(a + b) / 2, (a + b) / 2], `c² = ${cSquared}`, "fill:var(--accent-ink)");
    label([b / 2, 0.35], "b", "fill:var(--fg)");
    label([0.35, a / 2], "a", "fill:var(--fg)");
    label([b / 2 - 0.3, a / 2 - 0.3], "c", "fill:var(--fg)");
    squaresFormula.replaceChildren(
      "a² + b² = c²  →  ", slot(String(a * a), 2), " + ", slot(String(b * b), 2), " = ", slot(make("b", "", String(cSquared)), 2),
      "  →  c = ", slot(Number.isInteger(c) ? String(c) : `√${cSquared} ≈ ${formatNumber(c, 2)}`, 10, { align: "left" }),
    );
  }

  function renderProof() {
    const { a, b, arrangement } = state;
    const s = a + b, scale = PROOF_SIZE / s;
    const originX = (600 - PROOF_SIZE) / 2, originY = 30;
    proofScale.setAttribute("transform", `translate(${originX} ${originY}) scale(${scale})`);
    Object.entries({ x: 0, y: 0, width: s, height: s }).forEach(([name, value]) => proofOutline.setAttribute(name, value));
    proofPlacements(a, b).forEach((placement, index) => {
      const [x, y, angle] = placement[arrangement];
      triangles[index].setAttribute("points", pointsAttribute([[0, 0], [a, 0], [0, b]]));
      triangles[index].style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    });

    const toView = (x, y) => [originX + x * scale, originY + y * scale];
    const area = (x, y, text, visible) => {
      const [px, py] = toView(x, y);
      svg("text", { x: px, y: py + 6, "text-anchor": "middle", text, class: "il-fade", opacity: visible ? 1 : 0, style: "font-size:18px;font-weight:800;fill:var(--fg)" }, proofLabels);
    };
    const edge = (from, to, text) => {
      const [x, y] = toView((from + to) / 2, 0);
      svg("text", { x, y: y - 8, "text-anchor": "middle", text, style: "fill:var(--dim);font-style:italic" }, proofLabels);
    };
    proofLabels.replaceChildren();
    const legSquares = arrangement === "withLegSquares";
    area(s / 2, s / 2, "c²", !legSquares);
    area(a / 2, a / 2, "a²", legSquares);
    area(a + b / 2, a + b / 2, "b²", legSquares);
    edge(0, a, "a"); edge(a, s, "b");
    rearrangeButton.textContent = legSquares ? "Vissza az első elrendezéshez" : "Átrendezés";
    caption.textContent = legSquares
      ? "Ugyanazt a 4 háromszöget csak eltoltuk. Most két négyzet maradt ki: a² és b². A nagy négyzet és a 4 háromszög nem változott, tehát a kimaradt terület is ugyanakkora: a² + b² = c²."
      : "Egy (a + b) oldalú négyzetben 4 egyforma derékszögű háromszög van. Ami kimarad közöttük, az egy c oldalú négyzet: a területe c².";
  }

  render();
  return () => {};
}
