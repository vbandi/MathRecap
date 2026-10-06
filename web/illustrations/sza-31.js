import { card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, svg, uniqueId } from "./kit.js";

const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n) => String(n).split("").map((c) => SUPERSCRIPTS[Number(c)]).join("");
const PLOT = { x0: 30, y0: 10, width: 540, height: 290, xMin: -6, xMax: 6, yMin: -30, yMax: 30 };
const toX = (x) => PLOT.x0 + ((x - PLOT.xMin) / (PLOT.xMax - PLOT.xMin)) * PLOT.width;
const toY = (y) => PLOT.y0 + ((PLOT.yMax - y) / (PLOT.yMax - PLOT.yMin)) * PLOT.height;

const rootOf = (value, n) => (value < 0 ? -(Math.abs(value) ** (1 / n)) : value ** (1 / n));
const isExact = (root, value, n) => Math.abs(root - Math.round(root)) < 1e-9 && Math.round(root) ** n === value;
const describe = (root, value, n) => (isExact(root, value, n) ? formatNumber(Math.round(root)) : `≈ ${formatNumber(root, 4)}`);

export function mount(root) {
  const scope = createScope();
  root.append(lead("Az n-edik gyök a hatványozás megfordítása: ha xⁿ = a, akkor x az a szám n-edik gyöke. A négyzetgyök és a köbgyök az n = 2 és n = 3 eset. Az, hogy hány megoldása van az xⁿ = a egyenletnek, attól függ, hogy n páros vagy páratlan."));

  const state = { n: 3, a: 8 };
  const clipId = uniqueId("root-clip");
  const main = card("Hol metszi a vízszintes egyenes az y = xⁿ görbét?");
  const nSlider = range({ label: "n", min: 2, max: 5, value: state.n, format: String, onInput: (v) => { state.n = v; render(); } });
  const aSlider = range({ label: "a", min: -30, max: 30, value: state.a, format: (v) => formatNumber(v), onInput: (v) => { state.a = v; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 310", role: "img" }, main);
  svg("rect", { x: PLOT.x0, y: PLOT.y0, width: PLOT.width, height: PLOT.height }, svg("clipPath", { id: clipId }, svg("defs", {}, figure)));
  for (let x = PLOT.xMin; x <= PLOT.xMax; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: PLOT.y0, y2: PLOT.y0 + PLOT.height, class: x ? "grid" : "axis" }, figure);
    if (x && x % 2 === 0) svg("text", { x: toX(x), y: toY(0) + 14, "text-anchor": "middle", text: formatNumber(x), style: "font-size:10px;fill:var(--dim)" }, figure);
  }
  for (let y = PLOT.yMin; y <= PLOT.yMax; y += 10) {
    svg("line", { x1: PLOT.x0, x2: PLOT.x0 + PLOT.width, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    if (y) svg("text", { x: toX(0) + 4, y: toY(y) - 3, text: formatNumber(y), style: "font-size:10px;fill:var(--dim)" }, figure);
  }
  const plot = svg("g", { "clip-path": `url(#${clipId})` }, figure);
  const curve = svg("path", { fill: "none", style: `stroke:${PALETTE.blue};stroke-width:3` }, plot);
  const level = svg("line", { x1: PLOT.x0, x2: PLOT.x0 + PLOT.width, style: `stroke:${PALETTE.amber};stroke-width:2.5;stroke-dasharray:8 6` }, plot);
  const points = svg("g", {}, figure);
  const formulaLine = make("div", "il-formula start");
  formulaLine.style.fontSize = "20px";
  const message = make("p", "il-message");
  main.append(controls(nSlider.element, aSlider.element), figure, formulaLine, message);

  // --- Cube with volume V ---
  const cube = card("Köbgyök: a kocka éle");
  cube.append(make("p", "", "Egy kocka térfogata az élhossz köbe. Ha ismerjük a térfogatot, az élt a köbgyök adja meg."));
  const cubeState = { volume: 27 };
  const volumeSlider = range({ label: "Térfogat V", min: 1, max: 125, value: cubeState.volume, format: String, onInput: (v) => { cubeState.volume = v; renderCube(); } });
  const cubeFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 230", role: "img" }, cube);
  const cubeLayer = svg("g", {}, cubeFigure);
  const cubeMessage = make("p", "il-message");
  cube.append(controls(volumeSlider.element), cubeFigure, cubeMessage);
  root.append(main, cube, keyIdea("ⁿ√a az a szám, amelynek n-edik hatványa a. Páratlan n-re mindig pontosan egy ilyen szám van (negatív a-ra is). Páros n-re negatív a-nak nincs valós gyöke, pozitív a-ra két megoldás van (±x), de a gyök jele a nemnegatívat jelenti."));

  function render() {
    const { n, a } = state;
    nSlider.set(n); aSlider.set(a);
    let d = "";
    for (let i = 0; i <= 480; i++) {
      const x = PLOT.xMin + (i / 480) * (PLOT.xMax - PLOT.xMin);
      d += `${i ? "L" : "M"} ${toX(x).toFixed(1)} ${toY(x ** n).toFixed(1)} `;
    }
    curve.setAttribute("d", d);
    level.setAttribute("y1", toY(a)); level.setAttribute("y2", toY(a));
    points.replaceChildren();
    const even = n % 2 === 0;
    const solutions = [];
    if (even) { if (a > 0) solutions.push(-(a ** (1 / n)), a ** (1 / n)); else if (a === 0) solutions.push(0); }
    else solutions.push(rootOf(a, n));
    solutions.forEach((x) => {
      const isRoot = x >= 0;
      svg("line", { x1: toX(x), x2: toX(x), y1: toY(a), y2: toY(0), style: `stroke:${PALETTE.red};stroke-width:1.5;stroke-dasharray:4 3` }, points);
      svg("circle", { cx: toX(x), cy: toY(a), r: 7, style: `fill:${isRoot ? PALETTE.red : "var(--input)"};stroke:${PALETTE.red};stroke-width:2.5` }, points);
      svg("text", { x: toX(x), y: toY(0) + (a > 0 ? 28 : -14), "text-anchor": "middle", text: `x ${isExact(x, a, n) || Math.abs(x - Math.round(x)) < 1e-9 ? "=" : "≈"} ${formatNumber(x, 3)}`, style: `fill:${PALETTE.red};font-weight:700` }, points);
    });
    const name = n === 2 ? "√" : `${sup(n)}√`;
    const rootText = even && a < 0 ? null : describe(rootOf(a, n), a, n);
    formulaLine.textContent = rootText === null ? `${name}${formatNumber(a)} = nincs valós szám` : `${name}${formatNumber(a)} ${rootText.startsWith("≈") ? rootText : `= ${rootText}`}   (mert x${sup(n)} = ${formatNumber(a)})`;
    message.className = "il-message";
    message.textContent = !even
      ? `${n} páratlan: az y = x${sup(n)} görbe mindig felfelé halad, ezért a vízszintes egyenest pontosan egyszer metszi, negatív a-nál is.`
      : a < 0 ? `${n} páros: x${sup(n)} sosem negatív, ezért az y = ${formatNumber(a)} egyenes nem metszi a görbét: nincs valós gyök.`
        : a === 0 ? "Az egyetlen megoldás x = 0." : `${n} páros: két metszéspont van (±x), mert a negatív szám páros hatványa is pozitív. A gyök jele ${name} a nemnegatív megoldást jelenti: a tömör pont.`;
  }

  function renderCube() {
    const { volume } = cubeState;
    const edge = Math.cbrt(volume), exact = Number.isInteger(Math.round(edge)) && Math.round(edge) ** 3 === volume;
    const size = edge * 25, depth = size * 0.5, x = 60, y = 205;
    cubeLayer.replaceChildren();
    const face = (points, opacity) => svg("polygon", { points, style: `fill:${exact ? PALETTE.green : PALETTE.blue};fill-opacity:${opacity};stroke:${exact ? PALETTE.green : PALETTE.blue};stroke-width:2` }, cubeLayer);
    face(`${x},${y} ${x + size},${y} ${x + size},${y - size} ${x},${y - size}`, 0.3);
    face(`${x},${y - size} ${x + depth},${y - size - depth} ${x + size + depth},${y - size - depth} ${x + size},${y - size}`, 0.5);
    face(`${x + size},${y} ${x + size + depth},${y - depth} ${x + size + depth},${y - size - depth} ${x + size},${y - size}`, 0.18);
    if (exact) for (let i = 1; i < Math.round(edge); i++) {
      const p = i * 25;
      svg("line", { x1: x + p, x2: x + p, y1: y, y2: y - size, style: `stroke:${PALETTE.green};stroke-opacity:.6` }, cubeLayer);
      svg("line", { x1: x, x2: x + size, y1: y - p, y2: y - p, style: `stroke:${PALETTE.green};stroke-opacity:.6` }, cubeLayer);
    }
    svg("text", { x: x + size / 2, y: y + 16, "text-anchor": "middle", text: exact ? `él = ${Math.round(edge)}` : `él ≈ ${formatNumber(edge, 3)}`, style: "font-weight:700;fill:var(--fg)" }, cubeLayer);
    svg("text", { x: 340, y: 100, text: `V = ${volume}`, style: "font-weight:700;font-size:22px;fill:var(--fg)" }, cubeLayer);
    svg("text", { x: 340, y: 135, text: exact ? `³√${volume} = ${Math.round(edge)}` : `³√${volume} ≈ ${formatNumber(edge, 4)}`, style: `font-weight:700;font-size:22px;fill:${exact ? PALETTE.green : PALETTE.amber}` }, cubeLayer);
    cubeMessage.className = exact ? "il-message good" : "il-message";
    cubeMessage.textContent = exact ? `${Math.round(edge)} · ${Math.round(edge)} · ${Math.round(edge)} = ${volume}: ez kockaszám, az él egész, és a kocka pontosan kirakható egységkockákból.`
      : `Az él ${Math.floor(edge)} és ${Math.floor(edge) + 1} között van, mert ${Math.floor(edge)}³ = ${Math.floor(edge) ** 3} és ${Math.floor(edge) + 1}³ = ${(Math.floor(edge) + 1) ** 3}. Nem egész szám.`;
  }

  render();
  renderCube();
  return () => scope.clearAll();
}
