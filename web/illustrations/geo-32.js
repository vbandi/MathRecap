import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const VIEW = { width: 640, height: 400, unit: 20 };
const SHAPE = [{ name: "A", dx: 30, dy: 30 }, { name: "B", dx: 90, dy: 45 }, { name: "C", dx: 50, dy: -15 }];

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

const angleAt = (p, q, r) => {
  const ux = q.x - p.x, uy = q.y - p.y, vx = r.x - p.x, vy = r.y - p.y;
  return Math.acos((ux * vx + uy * vy) / Math.hypot(ux, uy) / Math.hypot(vx, vy)) * 180 / Math.PI;
};

export function mount(root) {
  const state = { lambda: 2, center: { x: 240, y: 200 } };

  root.append(lead("Válassz egy pontot (a középpontot, O), és egy számot (az arányt, λ). Minden pontot az O-tól mért távolságának λ-szorosára viszünk: ugyanazon az O-ból induló sugáron. Így az alakzat nagyobb, kisebb, vagy ha λ negatív, az O másik oldalára kerül."));

  const main = card("Mozgasd a középpontot, állítsd az arányt");
  const lambdaSlider = range({ label: "λ", min: -2, max: 3, step: 0.5, value: state.lambda, onInput: (value) => { state.lambda = value; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, role: "img", "aria-label": "Középpontos hasonlóság: az ABC háromszög és képe az O középpont körül" });
  const rays = svg("g", {}, figure);
  const image = svg("polygon", { style: `fill:${PALETTE.blue};fill-opacity:.35;stroke:${PALETTE.blue};stroke-width:2.5` }, figure);
  const original = svg("polygon", { style: "fill:rgba(217,79,69,.25);stroke:var(--il-red);stroke-width:2.5" }, figure);
  const labels = svg("g", {}, figure);
  const centerHandle = svg("circle", { r: 13, style: `fill:${PALETTE.amber};stroke:var(--fg);stroke-width:2` }, figure);
  svg("text", { "text-anchor": "middle", style: "font-weight:800;fill:var(--fg);pointer-events:none", text: "O" }, figure);
  const centerLabel = figure.lastChild;
  makeDraggable(figure, centerHandle, (x, y) => {
    state.center = { x: Math.min(VIEW.width - 20, Math.max(20, x)), y: Math.min(VIEW.height - 20, Math.max(20, y)) };
    render();
  });
  const readout = make("div", "il-formula start"); readout.style.whiteSpace = "pre-wrap";
  const message = make("p", "il-message");
  main.append(controls(lambdaSlider.element, make("span", "il-muted", "Húzd az O pontot is!")), figure, readout, message);
  root.append(main, keyIdea("a középpontos hasonlóság minden hosszt |λ|-szorosára változtat, a szögeket viszont nem. Ezért a kép hasonló az eredetihez. Negatív λ-nál a kép az O másik oldalára kerül."));

  function render() {
    const { lambda, center } = state;
    const originals = SHAPE.map(({ name, dx, dy }) => ({ name, x: center.x + dx, y: center.y + dy }));
    const images = originals.map(({ name, x, y }) => ({ name: `${name}'`, x: center.x + lambda * (x - center.x), y: center.y + lambda * (y - center.y) }));
    const toPoints = (points) => points.map((p) => `${p.x},${p.y}`).join(" ");
    original.setAttribute("points", toPoints(originals));
    image.setAttribute("points", toPoints(images));
    rays.replaceChildren();
    labels.replaceChildren();
    originals.forEach((p, index) => {
      const q = images[index];
      svg("line", { x1: p.x, y1: p.y, x2: q.x, y2: q.y, style: "stroke:var(--dim);stroke-width:1.5;stroke-dasharray:6 5" }, rays);
      // The ray continues through O so that a negative ratio visibly passes through the centre.
      svg("line", { x1: center.x, y1: center.y, x2: center.x + (p.x - center.x) * 4, y2: center.y + (p.y - center.y) * 4, style: "stroke:var(--line-strong);stroke-width:1" }, rays);
      for (const [point, color] of [[p, PALETTE.red], [q, PALETTE.blue]]) {
        svg("circle", { cx: point.x, cy: point.y, r: 4.5, style: `fill:${color}` }, labels);
        svg("text", { x: point.x + 8, y: point.y - 8, text: point.name, style: "font-weight:700;fill:var(--fg)" }, labels);
      }
    });
    centerHandle.setAttribute("cx", center.x); centerHandle.setAttribute("cy", center.y);
    centerLabel.setAttribute("x", center.x); centerLabel.setAttribute("y", center.y + 5);

    const side = (points) => Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) / VIEW.unit;
    const lengthA = side(originals), lengthImage = side(images);
    const angleOriginal = angleAt(originals[0], originals[1], originals[2]);
    const angleImage = angleAt(images[0], images[1], images[2]);
    readout.replaceChildren(
      "AB = ", slot(formatNumber(lengthA, 1), 5), "  A'B' = ", slot(formatNumber(lengthImage, 1), 5),
      "  A'B' : AB = ", slot(make("b", "", lambda === 0 ? "0" : formatNumber(lengthImage / lengthA, 2)), 4),
      make("br"),
      "∠BAC = ", slot(`${formatNumber(angleOriginal, 1)}°`, 7), "  ∠B'A'C' = ", slot(lambda === 0 ? "—" : `${formatNumber(angleImage, 1)}°`, 7),
    );
    message.className = "il-message";
    message.textContent =
      lambda === 0 ? "λ = 0: minden pont az O-ba esik, az alakzat egyetlen ponttá zsugorodik."
      : lambda === 1 ? "λ = 1: a kép megegyezik az eredetivel, semmi sem mozdul."
      : lambda === -1 ? "λ = −1: a kép ugyanakkora, csak az O-n túl, fejjel lefelé áll (ez a középpontos tükrözés)."
      : lambda < 0 ? `A pontok az O másik oldalára kerültek, és a hosszak ${formatNumber(-lambda)}-szeresükre változtak. A kép elfordítva áll, de hasonló.`
      : lambda > 1 ? `Nagyítás: minden hossz ${formatNumber(lambda)}-szeresére nőtt, a szögek ugyanazok.`
      : `Kicsinyítés: minden hossz ${formatNumber(lambda)}-szeresére csökkent, a szögek ugyanazok.`;
  }

  render();
  return () => {};
}
