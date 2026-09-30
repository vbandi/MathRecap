import { button, card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const SIDE_A = 3, SIDE_B = 4, RADIANS = Math.PI / 180;
const FIGURE = { width: 640, height: 330, margin: 24 };
const AREAS = { unit: 22, baseline: 205, height: 220 };

export function mount(root) {
  const state = { gamma: 60 };

  root.append(lead("A Pitagorasz-tétel csak derékszögű háromszögben igaz. Ha a szög nem derékszög, a harmadik oldal négyzetéhez egy javítást kell hozzátenni vagy elvenni. A koszinusztétel megmondja, mekkorát. Állítsd a γ szöget, és figyeld a javító téglalapot!"));

  const main = card("Négyzetek az oldalakon");
  const gammaSlider = range({ label: "γ szög (a és b között)", min: 10, max: 170, step: 5, value: state.gamma, format: (v) => `${v}°`, onInput: (value) => { state.gamma = value; render(); } });
  const rightAngleButton = button("Derékszög (90°)", () => { state.gamma = 90; render(); }, { ghost: true });
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${FIGURE.width} ${FIGURE.height}`, role: "img", "aria-label": "Háromszög és négyzetek az oldalain" });
  const areasFigure = svg("svg", { class: "il-svg", viewBox: `0 0 640 ${AREAS.height}`, role: "img", "aria-label": "A négyzetek és a javító téglalap területe" });
  const formulas = make("div");
  const message = make("p", "il-message");
  main.append(controls(gammaSlider.element, rightAngleButton), figure, make("h3", "", "A területek egymás mellett"), areasFigure, formulas, message);
  root.append(main, keyIdea("a koszinusztétel: c² = a² + b² − 2ab · cos γ. Hegyesszögnél a javítás levonódik (c² kisebb, mint a² + b²), tompaszögnél hozzáadódik (c² nagyobb), derékszögnél nulla, ott marad a Pitagorasz-tétel. Két oldalból és a közbezárt szögből így a harmadik oldal kiszámolható."));

  function render() {
    const { gamma } = state;
    gammaSlider.set(gamma);
    const cos = Math.abs(Math.cos(gamma * RADIANS)) < 1e-12 ? 0 : Math.cos(gamma * RADIANS), sin = Math.sin(gamma * RADIANS);
    const a = SIDE_A, b = SIDE_B, correction = 2 * a * b * cos, cSquared = a * a + b * b - correction, c = Math.sqrt(cSquared);
    // Math coordinates (y up): C at the origin, B on the x axis, A at angle gamma.
    const C = [0, 0], B = [a, 0], A = [b * cos, b * sin];
    const outward = (p, q, away) => {
      const dx = q[0] - p[0], dy = q[1] - p[1];
      const normal = [-dy, dx], mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const sign = (normal[0] * (away[0] - mid[0]) + normal[1] * (away[1] - mid[1])) > 0 ? -1 : 1;
      return [p, q, [q[0] + sign * normal[0], q[1] + sign * normal[1]], [p[0] + sign * normal[0], p[1] + sign * normal[1]]];
    };
    const squares = [
      { points: outward(C, B, A), color: PALETTE.green, text: `a² = ${a * a}` },
      { points: outward(C, A, B), color: PALETTE.violet, text: `b² = ${b * b}` },
      { points: outward(A, B, C), color: PALETTE.amber, text: `c² = ${formatNumber(cSquared, 2)}` },
    ];
    const all = squares.flatMap((square) => square.points);
    const minX = Math.min(...all.map((p) => p[0])), maxX = Math.max(...all.map((p) => p[0]));
    const minY = Math.min(...all.map((p) => p[1])), maxY = Math.max(...all.map((p) => p[1]));
    const scale = Math.min((FIGURE.width - 2 * FIGURE.margin) / (maxX - minX), (FIGURE.height - 2 * FIGURE.margin) / (maxY - minY));
    const offsetX = (FIGURE.width - (maxX - minX) * scale) / 2 - minX * scale, offsetY = (FIGURE.height + (maxY - minY) * scale) / 2 + minY * scale;
    const toView = (p) => [offsetX + p[0] * scale, offsetY - p[1] * scale];
    figure.replaceChildren();
    squares.forEach((square) => {
      svg("polygon", { points: square.points.map((p) => toView(p).join(",")).join(" "), style: `fill:${square.color};fill-opacity:.4;stroke:${square.color};stroke-width:2` }, figure);
      const centre = toView([0, 1, 2, 3].reduce((sum, i) => [sum[0] + square.points[i][0] / 4, sum[1] + square.points[i][1] / 4], [0, 0]));
      svg("text", { x: centre[0], y: centre[1] + 5, "text-anchor": "middle", text: square.text, style: "font-weight:800;fill:var(--fg)" }, figure);
    });
    svg("polygon", { points: [A, B, C].map((p) => toView(p).join(",")).join(" "), style: "fill:var(--surface);stroke:var(--fg);stroke-width:2.5" }, figure);
    const [cx, cy] = toView(C);
    svg("path", { d: `M ${cx + 26} ${cy} A 26 26 0 0 0 ${cx + 26 * Math.cos(gamma * RADIANS)} ${cy - 26 * sin}`, fill: "none", style: `stroke:${PALETTE.red};stroke-width:3` }, figure);
    svg("text", { x: cx + 32, y: cy - 8, text: "γ", style: `font-weight:800;fill:${PALETTE.red}` }, figure);

    // Areas side by side: a² + b² ∓ rectangle (a · 2b|cos γ|) = c².
    areasFigure.replaceChildren();
    const u = AREAS.unit, base = AREAS.baseline;
    const box = (x, width, height, color, text) => {
      svg("rect", { x, y: base - height, width, height, style: `fill:${color};fill-opacity:.45;stroke:${color};stroke-width:2` }, areasFigure);
      svg("text", { x: x + width / 2, y: base + 16, "text-anchor": "middle", text, style: "font-weight:700;fill:var(--fg);font-size:12px" }, areasFigure);
    };
    const symbol = (x, text) => svg("text", { x, y: base - 10, "text-anchor": "middle", text, style: "font-size:24px;font-weight:800;fill:var(--accent)" }, areasFigure);
    const widthOfCorrection = a * u, heightOfCorrection = 2 * b * Math.abs(cos) * u;
    let x = 20;
    box(x, a * u, a * u, PALETTE.green, "a²"); x += a * u + 22; symbol(x - 11, "+");
    box(x, b * u, b * u, PALETTE.violet, "b²"); x += b * u + 22; symbol(x - 11, cos > 0 ? "−" : "+");
    if (cos === 0) svg("text", { x: x + 20, y: base - 6, "text-anchor": "middle", text: "0", style: "font-size:20px;font-weight:800;fill:var(--dim)" }, areasFigure);
    else box(x, widthOfCorrection, heightOfCorrection, PALETTE.red, "2ab·|cos γ|");
    x += (cos === 0 ? 40 : widthOfCorrection) + 22; symbol(x - 11, "=");
    box(x, c * u, c * u, PALETTE.amber, "c²");

    const line = (...parts) => { const row = make("div", "il-formula start"); row.style.whiteSpace = "pre-wrap"; row.append(...parts); return row; };
    formulas.replaceChildren(
      line("2ab · cos γ = 2 · ", String(a), " · ", String(b), " · ", slot(formatNumber(cos, 3), 6), " = ", slot(make("b", "", formatNumber(correction, 2)), 6)),
      line("c² = ", slot(String(a * a + b * b), 2), " ", slot(correction < 0 ? "+" : "−", 1), " ", slot(formatNumber(Math.abs(correction), 2), 5), " = ", slot(make("b", "", formatNumber(cSquared, 2)), 6), "  →  c = ", slot(formatNumber(c, 2), 5)),
    );
    message.className = `il-message ${cos === 0 ? "good" : ""}`;
    message.textContent = cos === 0 ? "γ = 90°: cos γ = 0, a javítás nulla. Ez éppen a Pitagorasz-tétel: c² = a² + b²."
      : cos > 0 ? "Hegyesszög: a javító téglalap területét le kell vonni, ezért c² kisebb, mint a² + b²."
      : "Tompaszög: cos γ negatív, ezért a −2ab · cos γ tag pozitív. A téglalap területét hozzá kell adni, c² nagyobb, mint a² + b².";
  }

  render();
  return () => {};
}
