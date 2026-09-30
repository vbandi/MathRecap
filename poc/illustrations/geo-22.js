import { card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const RAD = Math.PI / 180;

export function mount(root) {
  const state = { alpha: 90, r: 4, outer: 5, inner: 2, segmentAlpha: 120 };

  root.append(lead("A kör egy darabját többféleképpen is kivághatod: körcikket, körgyűrűt vagy körszeletet. Mindegyik mérete a teljes körből számolható ki."));

  // --- Card 1: arc and sector ---
  const sector = card("Körív és körcikk");
  const sliderAlpha = range({ label: "α (középponti szög)", min: 0, max: 360, step: 5, value: state.alpha, format: (value) => `${value}°`, onInput: (value) => { state.alpha = value; renderSector(); } });
  const sliderR = range({ label: "r (sugár)", min: 1, max: 5, value: state.r, onInput: (value) => { state.r = value; renderSector(); } });
  const sectorFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 320", role: "img", "aria-label": "Körcikk és körív a középponti szöggel" });
  const fractionLine = make("div"), arcLine = make("div"), areaLine = make("div");
  sector.append(controls(sliderAlpha.element, sliderR.element), sectorFigure, fractionLine, arcLine, areaLine);

  // --- Card 2: annulus ---
  const ring = card("Körgyűrű");
  const sliderOuter = range({ label: "R (külső sugár)", min: 2, max: 6, value: state.outer, onInput: (value) => { state.outer = value; if (state.inner >= value) { state.inner = value - 1; sliderInner.set(state.inner); } renderRing(); } });
  const sliderInner = range({ label: "r (belső sugár)", min: 1, max: 5, value: state.inner, onInput: (value) => { state.inner = Math.min(value, state.outer - 1); sliderInner.set(state.inner); renderRing(); } });
  const ringFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 320", role: "img", "aria-label": "Körgyűrű két sugárral" });
  const ringLine = make("div"), ringSplit = make("div");
  ring.append(controls(sliderOuter.element, sliderInner.element), ringFigure, ringLine, ringSplit);

  // --- Card 3: segment ---
  const segment = card("Körszelet");
  const sliderSegment = range({ label: "α (középponti szög)", min: 20, max: 180, step: 10, value: state.segmentAlpha, format: (value) => `${value}°`, onInput: (value) => { state.segmentAlpha = value; renderSegment(); } });
  const segmentFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 320", role: "img", "aria-label": "Körszelet: körcikk mínusz háromszög" });
  const sectorAreaLine = make("div"), triangleAreaLine = make("div"), segmentAreaLine = make("div");
  segment.append(controls(sliderSegment.element), segmentFigure, sectorAreaLine, triangleAreaLine, segmentAreaLine);

  root.append(sector, ring, segment, keyIdea("körcikk és körív: a teljes kör α/360° része. Körgyűrű: a nagy kör területéből kivonjuk a kis körét. Körszelet: a körcikkből kivonjuk a hozzá tartozó háromszöget."));

  const format2 = (value) => formatNumber(value, 2);

  function renderSector() {
    const { alpha, r } = state, s = 30, cx = 180, cy = 165;
    sectorFigure.replaceChildren();
    const at = (angle, radius = r) => [cx + radius * s * Math.cos(angle * RAD), cy - radius * s * Math.sin(angle * RAD)];
    svg("circle", { cx, cy, r: r * s, style: `fill:none;stroke:var(--line-strong);stroke-width:2` }, sectorFigure);
    if (alpha >= 360) svg("circle", { cx, cy, r: r * s, style: `fill:${PALETTE.blue};fill-opacity:.4` }, sectorFigure);
    else if (alpha > 0) {
      const [x, y] = at(alpha);
      svg("path", { d: `M ${cx} ${cy} L ${at(0)[0]} ${at(0)[1]} A ${r * s} ${r * s} 0 ${alpha > 180 ? 1 : 0} 0 ${x} ${y} Z`, style: `fill:${PALETTE.blue};fill-opacity:.4;stroke:var(--fg);stroke-width:2` }, sectorFigure);
      svg("path", { d: `M ${at(0)[0]} ${at(0)[1]} A ${r * s} ${r * s} 0 ${alpha > 180 ? 1 : 0} 0 ${x} ${y}`, fill: "none", style: `stroke:${PALETTE.red};stroke-width:5;stroke-linecap:round` }, sectorFigure);
      const [lx, ly] = at(alpha / 2, Math.min(0.6, r / 2));
      svg("text", { x: lx, y: ly + 5, "text-anchor": "middle", text: `${alpha}°`, style: "font-weight:700;fill:var(--fg)" }, sectorFigure);
    }
    svg("circle", { cx, cy, r: 4, style: "fill:var(--fg)" }, sectorFigure);
    const fractionValue = alpha / 360;
    const arcLength = fractionValue * 2 * Math.PI * r, sectorArea = fractionValue * Math.PI * r * r;
    // Whole-circle comparison bars on the right: the sector is a fraction of the full circle.
    const bar = (y, label, value, full, color) => {
      svg("text", { x: 380, y: y - 8, text: label, style: "fill:var(--dim)" }, sectorFigure);
      svg("rect", { x: 380, y, width: 190, height: 16, rx: 8, style: "fill:none;stroke:var(--line-strong)" }, sectorFigure);
      svg("rect", { x: 380, y, width: 190 * value / full, height: 16, rx: 8, style: `fill:${color}` }, sectorFigure);
    };
    bar(110, "a körív a teljes kerületből", arcLength, 2 * Math.PI * r, PALETTE.red);
    bar(180, "a körcikk a teljes körből", sectorArea, Math.PI * r * r, PALETTE.blue);
    fractionLine.replaceChildren(equation("α / 360°", slot(`${alpha} / 360 = ${format2(fractionValue)}`, 26, { align: "left" })));
    arcLine.replaceChildren(equation("i = α/360° · 2πr", slot(`${format2(fractionValue)} · 2 · π · ${r} = ${format2(arcLength)}`, 26, { align: "left" })));
    areaLine.replaceChildren(equation("T = α/360° · πr²", slot(`${format2(fractionValue)} · π · ${r}² = ${format2(sectorArea)}`, 26, { align: "left" })));
  }

  function renderRing() {
    const { outer, inner } = state, s = 25, cx = 180, cy = 165;
    ringFigure.replaceChildren();
    svg("path", {
      d: `M ${cx - outer * s} ${cy} a ${outer * s} ${outer * s} 0 1 0 ${2 * outer * s} 0 a ${outer * s} ${outer * s} 0 1 0 ${-2 * outer * s} 0 Z M ${cx - inner * s} ${cy} a ${inner * s} ${inner * s} 0 1 0 ${2 * inner * s} 0 a ${inner * s} ${inner * s} 0 1 0 ${-2 * inner * s} 0 Z`,
      "fill-rule": "evenodd", style: `fill:${PALETTE.violet};fill-opacity:.5;stroke:var(--fg);stroke-width:2`,
    }, ringFigure);
    svg("line", { x1: cx, y1: cy, x2: cx + outer * s, y2: cy, style: "stroke:var(--fg);stroke-width:2" }, ringFigure);
    svg("text", { x: cx + (inner + outer) * s / 2, y: cy - 8, "text-anchor": "middle", text: `${outer - inner}`, style: "font-weight:700;fill:var(--fg)" }, ringFigure);
    svg("text", { x: cx + inner * s / 2, y: cy + 18, "text-anchor": "middle", text: "r", style: "font-style:italic;font-weight:700;fill:var(--fg)" }, ringFigure);
    svg("text", { x: cx + (outer * s + inner * s) / 2, y: cy + 18, "text-anchor": "middle", text: "R", style: "font-style:italic;font-weight:700;fill:var(--fg)" }, ringFigure);
    svg("text", { x: 380, y: 150, text: "A gyűrű szélessége: R − r", style: "fill:var(--dim)" }, ringFigure);
    const big = Math.PI * outer * outer, small = Math.PI * inner * inner;
    ringLine.replaceChildren(equation("T = π · (R² − r²)", slot(`π · (${outer * outer} − ${inner * inner}) = ${format2(big - small)}`, 30, { align: "left" })));
    ringSplit.replaceChildren(equation("nagy kör − kis kör", slot(`${format2(big)} − ${format2(small)} = ${format2(big - small)}`, 30, { align: "left" })));
  }

  function renderSegment() {
    const alpha = state.segmentAlpha, r = 4, s = 34, cx = 180, cy = 210;
    segmentFigure.replaceChildren();
    const at = (angle) => [cx + r * s * Math.cos(angle * RAD), cy - r * s * Math.sin(angle * RAD)];
    const a = at(90 + alpha / 2), b = at(90 - alpha / 2);
    svg("circle", { cx, cy, r: r * s, style: "fill:none;stroke:var(--line-strong);stroke-width:2" }, segmentFigure);
    svg("path", { d: `M ${cx} ${cy} L ${a[0]} ${a[1]} A ${r * s} ${r * s} 0 0 1 ${b[0]} ${b[1]} Z`, style: `fill:${PALETTE.blue};fill-opacity:.25;stroke:none` }, segmentFigure);
    svg("polygon", { points: `${cx},${cy} ${a[0]},${a[1]} ${b[0]},${b[1]}`, style: `fill:${PALETTE.violet};fill-opacity:.35;stroke:var(--fg);stroke-width:2` }, segmentFigure);
    svg("path", { d: `M ${a[0]} ${a[1]} A ${r * s} ${r * s} 0 0 1 ${b[0]} ${b[1]} Z`, style: `fill:${PALETTE.amber};fill-opacity:.75;stroke:var(--fg);stroke-width:2.5` }, segmentFigure);
    svg("circle", { cx, cy, r: 4, style: "fill:var(--fg)" }, segmentFigure);
    svg("text", { x: cx, y: cy - 22, "text-anchor": "middle", text: `${alpha}°`, style: "font-weight:700;fill:var(--fg)" }, segmentFigure);
    [["körszelet", PALETTE.amber], ["háromszög", PALETTE.violet], ["körcikk", PALETTE.blue]].forEach(([name, color], index) => {
      svg("rect", { x: 380, y: 70 + index * 28, width: 16, height: 16, rx: 4, style: `fill:${color};fill-opacity:.8` }, segmentFigure);
      svg("text", { x: 404, y: 83 + index * 28, text: name }, segmentFigure);
    });
    const sectorArea = alpha / 360 * Math.PI * r * r, triangleArea = r * r / 2 * Math.sin(alpha * RAD);
    sectorAreaLine.replaceChildren(equation("körcikk (r = 4)", slot(`${alpha}/360 · π · 4² = ${format2(sectorArea)}`, 30, { align: "left" })));
    triangleAreaLine.replaceChildren(equation("háromszög", slot(`4 · 4 · sin ${alpha}° / 2 = ${format2(triangleArea)}`, 30, { align: "left" })));
    segmentAreaLine.replaceChildren(equation("körszelet = körcikk − háromszög", slot(`${format2(sectorArea)} − ${format2(triangleArea)} = ${format2(sectorArea - triangleArea)}`, 30, { align: "left" })));
  }

  renderSector();
  renderRing();
  renderSegment();
  return () => {};
}
