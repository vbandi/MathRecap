import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const MAP = { width: 600, height: 300, pxPerCm: 30 };
const SCALES = [1000, 5000, 10000, 50000];
const TOWNS = { school: { x: 110, y: 210, name: "Iskola" }, station: { x: 480, y: 90, name: "Állomás" } };

const groupNumber = (n) => Math.round(n).toLocaleString("hu-HU").replace(/ /g, " ");

function realLengthText(cm) {
  const meters = cm / 100;
  return meters >= 1000 ? `${formatNumber(meters / 1000, 2)} km` : `${formatNumber(meters, 1)} m`;
}

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
  const state = { scale: 10000, p1: { x: 110, y: 210 }, p2: { x: 290, y: 150 }, widthPercent: 100, heightPercent: 100, proportional: true };

  root.append(lead("A térkép a valóságot kicsinyítve mutatja: minden távolság ugyanannyiszor rövidebb a papíron. A kicsinyítés mértékét a méretarány mondja meg, például az 1 : 10 000 azt jelenti, hogy 1 cm a térképen 10 000 cm a valóságban."));

  // --- Map and ruler ---
  const mapCard = card("Mérj a térképen vonalzóval");
  const scaleButtons = SCALES.map((scale) => toggle(`1 : ${groupNumber(scale)}`, scale === state.scale, () => { state.scale = scale; renderMap(); }));
  const mapFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${MAP.width} ${MAP.height}`, role: "img", "aria-label": "Térkép vonalzóval" });
  svg("rect", { x: 0, y: 0, width: MAP.width, height: MAP.height, style: "fill:rgba(0,160,133,.10)" }, mapFigure);
  svg("path", { d: "M 0 60 C 150 120 250 20 380 130 S 520 250 600 230", fill: "none", style: `stroke:${PALETTE.blue};stroke-width:16;opacity:.35` }, mapFigure);
  svg("polyline", { points: "110,210 230,240 360,170 480,90", fill: "none", style: "stroke:var(--dim);stroke-width:5;stroke-dasharray:14 6;opacity:.6" }, mapFigure);
  for (const town of Object.values(TOWNS)) {
    svg("rect", { x: town.x - 9, y: town.y - 9, width: 18, height: 18, rx: 3, style: `fill:${PALETTE.red}` }, mapFigure);
    svg("text", { x: town.x, y: town.y + 28, "text-anchor": "middle", text: town.name, style: "font-weight:700" }, mapFigure);
  }
  const scaleBar = svg("g", {}, mapFigure);
  const ruler = svg("g", {}, mapFigure);
  const rulerLine = svg("line", { style: `stroke:${PALETTE.amber};stroke-width:5;stroke-linecap:round` }, ruler);
  const ticks = svg("g", {}, ruler);
  const rulerLabel = svg("text", { "text-anchor": "middle", style: "font-weight:800;fill:var(--fg)" }, ruler);
  const handles = [state.p1, state.p2].map((point) => {
    const handle = svg("circle", { r: 12, style: `fill:${PALETTE.amber};stroke:var(--fg);stroke-width:2` }, ruler);
    makeDraggable(mapFigure, handle, (x, y) => {
      point.x = Math.min(MAP.width - 6, Math.max(6, x)); point.y = Math.min(MAP.height - 6, Math.max(6, y));
      renderMap();
    });
    return handle;
  });
  const measuredBox = make("div", "il-formula start"); measuredBox.style.whiteSpace = "pre-wrap";
  mapCard.append(controls(make("b", "", "Méretarány:"), ...scaleButtons), mapFigure, measuredBox,
    make("p", "il-muted", "Húzd a vonalzó két végét (a narancs köröket) az Iskola és az Állomás fölé, aztán válts méretarányt: a papíron mért hossz marad, a valódi távolság változik."));

  // --- Photo resizing ---
  const photoCard = card("Fénykép átméretezése");
  const widthSlider = range({ label: "Szélesség", min: 50, max: 150, step: 10, value: 100, format: (v) => `${v}%`, onInput: (v) => { state.widthPercent = v; if (state.proportional) state.heightPercent = v; photoRender(); } });
  const heightSlider = range({ label: "Magasság", min: 50, max: 150, step: 10, value: 100, format: (v) => `${v}%`, onInput: (v) => { state.heightPercent = v; if (state.proportional) state.widthPercent = v; photoRender(); } });
  const lockToggle = toggle("Arányok megtartása", true, () => { state.proportional = !state.proportional; if (state.proportional) state.heightPercent = state.widthPercent; photoRender(); });
  const photoFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 290", role: "img", "aria-label": "Eredeti és átméretezett kép" });
  const originalPhoto = photoScene(photoFigure, 30, 260, 1, 1, false);
  const scaledPhoto = photoScene(photoFigure, 260, 260, 1, 1, true);
  const photoRatios = make("div", "il-formula start");
  const photoMessage = make("p", "il-message");
  photoCard.append(controls(lockToggle, widthSlider.element, heightSlider.element), photoFigure, photoRatios, photoMessage);

  root.append(mapCard, photoCard, keyIdea("egy kicsinyítés vagy nagyítás minden hosszt ugyanannyiszorosára változtat, ezért az alak megmarad (a két ábra hasonló). Ha a szélességet és a magasságot különböző arányban nyújtod, az alak torzul."));

  // A little scene (frame, sun, house) in a 160 x 120 box, scaled from its bottom-left corner.
  function photoScene(parent, x, y, kx, ky, filled) {
    const group = svg("g", {}, parent);
    const inner = svg("g", {}, group);
    svg("rect", { x: 0, y: -120, width: 160, height: 120, style: `fill:${filled ? "rgba(11,132,214,.14)" : "none"};stroke:var(--fg-soft);stroke-width:2` }, inner);
    svg("circle", { cx: 120, cy: -85, r: 18, style: `fill:${PALETTE.amber}` }, inner);
    svg("rect", { x: 25, y: -55, width: 60, height: 55, style: `fill:${PALETTE.red}` }, inner);
    svg("polygon", { points: "18,-55 55,-90 92,-55", style: `fill:${PALETTE.violet}` }, inner);
    svg("rect", { x: 47, y: -30, width: 16, height: 30, style: "fill:var(--input)" }, inner);
    const setScale = (sx, sy) => group.setAttribute("transform", `translate(${x} ${y}) scale(${sx} ${sy})`);
    setScale(kx, ky);
    return { setScale };
  }

  function photoRender() {
    const kx = state.widthPercent / 100, ky = state.heightPercent / 100;
    scaledPhoto.setScale(kx, ky);
    widthSlider.set(state.widthPercent); heightSlider.set(state.heightPercent);
    lockToggle.setAttribute("aria-pressed", String(state.proportional));
    const similar = kx === ky;
    photoRatios.replaceChildren("szélesség ×", slot(formatNumber(kx, 2), 5), "  magasság ×", slot(formatNumber(ky, 2), 5));
    photoMessage.className = `il-message ${similar ? "good" : "warn"}`;
    photoMessage.textContent = similar
      ? (kx === 1 ? "Ugyanakkora, mint az eredeti." : `Minden hossz ${formatNumber(kx, 2)}-szeresére változott, a kép hasonló az eredetihez.`)
      : "A szélesség és a magasság különböző arányban változott: a kép torz, a nap már nem kör. Ez nem hasonló az eredetihez.";
  }

  function renderMap() {
    const { p1, p2, scale } = state;
    scaleButtons.forEach((button, index) => button.setAttribute("aria-pressed", String(SCALES[index] === scale)));
    handles.forEach((handle, index) => { const p = index ? p2 : p1; handle.setAttribute("cx", p.x); handle.setAttribute("cy", p.y); });
    for (const [name, value] of Object.entries({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })) rulerLine.setAttribute(name, value);
    const pixels = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const cm = Math.round(pixels / MAP.pxPerCm * 10) / 10;
    const ux = pixels ? (p2.x - p1.x) / pixels : 1, uy = pixels ? (p2.y - p1.y) / pixels : 0;
    ticks.replaceChildren();
    for (let t = 0; t * MAP.pxPerCm <= pixels; t++) {
      const cx = p1.x + ux * t * MAP.pxPerCm, cy = p1.y + uy * t * MAP.pxPerCm;
      svg("line", { x1: cx - uy * 7, y1: cy + ux * 7, x2: cx + uy * 7, y2: cy - ux * 7, style: "stroke:var(--fg);stroke-width:1.5" }, ticks);
    }
    rulerLabel.setAttribute("x", (p1.x + p2.x) / 2 - uy * 24); rulerLabel.setAttribute("y", (p1.y + p2.y) / 2 + ux * 24 + 4);
    rulerLabel.textContent = `${formatNumber(cm, 1)} cm`;
    scaleBar.replaceChildren();
    const barCm = 2;
    svg("rect", { x: 20, y: MAP.height - 26, width: barCm * MAP.pxPerCm, height: 8, style: "fill:var(--fg)" }, scaleBar);
    svg("text", { x: 20 + barCm * MAP.pxPerCm + 8, y: MAP.height - 18, text: `2 cm = ${realLengthText(barCm * scale)}`, style: "font-weight:700;fill:var(--fg)" }, scaleBar);
    const realCm = cm * scale;
    measuredBox.replaceChildren(
      "térképen: ", slot(formatNumber(cm, 1), 5), " cm   valóságban: ", slot(formatNumber(cm, 1), 5), " · ", slot(groupNumber(scale), 6),
      " = ", slot(groupNumber(realCm), 9), " cm = ", slot(make("b", "", realLengthText(realCm)), 9, { align: "left" }),
    );
  }

  renderMap();
  photoRender();
  return () => {};
}
