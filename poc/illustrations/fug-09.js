import { card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

const W = 600, H = 380, PAD = 32, X_MIN = -5, X_MAX = 5, Y_MIN = -6, Y_MAX = 6;
const toX = (x) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - 2 * PAD);
const toY = (y) => H - PAD - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (H - 2 * PAD);

const CURVES = [
  {
    label: "f(x) = x² − 4", f: (x) => x * x - 4, from: -3, to: 3, zeros: [-2, 2],
    maxima: [-3, 3], minima: [0], segments: [{ from: -3, to: 0, dir: "dec" }, { from: 0, to: 3, dir: "inc" }], range: [-4, 5],
  },
  {
    label: "g(x) = 4 − (x − 1)²", f: (x) => 4 - (x - 1) ** 2, from: -2, to: 4, zeros: [-1, 3],
    maxima: [1], minima: [-2, 4], segments: [{ from: -2, to: 1, dir: "inc" }, { from: 1, to: 4, dir: "dec" }], range: [-5, 4],
  },
  {
    label: "h(x) = 2 · sin(πx / 2)", f: (x) => 2 * Math.sin((Math.PI * x) / 2), from: -3, to: 3, zeros: [-2, 0, 2],
    maxima: [-3, 1], minima: [-1, 3], segments: [{ from: -3, to: -1, dir: "dec" }, { from: -1, to: 1, dir: "inc" }, { from: 1, to: 3, dir: "dec" }], range: [-2, 2],
  },
];
const FEATURES = [
  ["zeros", "Zérushelyek", PALETTE.violet],
  ["extremes", "Maximum és minimum", PALETTE.amber],
  ["monotone", "Növekvő / csökkenő", PALETTE.green],
  ["range", "Értékkészlet", PALETTE.blue],
];

export function mount(root) {
  const scope = createScope();
  const state = { curve: 0, x: -3, show: new Set(["monotone"]) };

  root.append(lead("A függvény grafikonjáról sok mindent le lehet olvasni: hol metszi az x tengelyt, hol a legmagasabb vagy legalacsonyabb, hol megy felfelé és hol lefelé. Mozgasd a pontot a görbén, és kapcsold be a megfigyeléseket."));

  const main = card("Függvénytulajdonságok felfedezése");
  const curveRow = make("div", "il-controls");
  const featureRow = make("div", "il-controls");
  const slider = range({ label: "x", min: -3, max: 3, step: 0.05, value: -3, format: (v) => formatNumber(v, 2), onInput: (v) => { state.x = v; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img" });
  const message = make("p", "il-message");
  main.append(curveRow, featureRow, figure, controls(slider.element), message);
  root.append(main, keyIdea("a grafikonról leolvasható: a zérushely az x tengelyen lévő metszéspont (ott f(x) = 0), a maximum és a minimum a legnagyobb és legkisebb érték, a növekvő szakaszon jobbra haladva emelkedik a görbe, a csökkenőn süllyed. Az értékkészlet az y értékek összessége."));

  const curve = () => CURVES[state.curve];
  const path = (from, to) => {
    const c = curve(), parts = [];
    for (let i = 0; i <= 160; i++) { const x = from + ((to - from) * i) / 160; parts.push(`${i ? "L" : "M"} ${toX(x)} ${toY(c.f(x))}`); }
    return parts.join(" ");
  };
  const tag = (x, y, text, color, dx = 10, dy = -10) => svg("text", { x: toX(x) + dx, y: toY(y) + dy, text, style: `fill:${color};font-weight:700;font-size:12px` }, figure);

  function render() {
    const c = curve(), x = state.x, y = c.f(x);
    curveRow.replaceChildren(...CURVES.map((item, i) => toggle(item.label, i === state.curve, () => { state.curve = i; state.x = item.from; slider.input.min = item.from; slider.input.max = item.to; slider.set(item.from); render(); })));
    featureRow.replaceChildren(...FEATURES.map(([key, text, color]) => toggle(text, state.show.has(key), () => { state.show.has(key) ? state.show.delete(key) : state.show.add(key); render(); }, color)));

    figure.replaceChildren();
    for (let v = X_MIN; v <= X_MAX; v++) {
      svg("line", { x1: toX(v), x2: toX(v), y1: PAD, y2: H - PAD, class: v ? "grid" : "axis" }, figure);
      if (v) svg("text", { x: toX(v), y: toY(0) + 15, "text-anchor": "middle", text: formatNumber(v), style: "font-size:10px;fill:var(--dim)" }, figure);
    }
    for (let v = Y_MIN; v <= Y_MAX; v++) {
      svg("line", { x1: PAD, x2: W - PAD, y1: toY(v), y2: toY(v), class: v ? "grid" : "axis" }, figure);
      if (v) svg("text", { x: toX(0) - 6, y: toY(v) + 4, "text-anchor": "end", text: formatNumber(v), style: "font-size:10px;fill:var(--dim)" }, figure);
    }
    svg("text", { x: W - PAD - 2, y: toY(0) - 7, "text-anchor": "end", text: "x", style: "font-style:italic" }, figure);
    svg("text", { x: toX(0) + 7, y: PAD - 8, text: "y", style: "font-style:italic" }, figure);

    if (state.show.has("range")) {
      const [lo, hi] = c.range;
      svg("line", { x1: toX(0), x2: toX(0), y1: toY(lo), y2: toY(hi), style: `stroke:${PALETTE.blue};stroke-width:9;opacity:.55;stroke-linecap:round` }, figure);
      for (const v of c.range) svg("line", { x1: toX(0), x2: toX(c.to) + 0, y1: toY(v), y2: toY(v), style: `stroke:${PALETTE.blue};stroke-width:1.5;stroke-dasharray:4 5;opacity:.6` }, figure);
    }
    const monotone = state.show.has("monotone");
    if (!monotone) svg("path", { d: path(c.from, c.to), fill: "none", style: "stroke:var(--accent);stroke-width:3.5" }, figure);
    else for (const s of c.segments) svg("path", { d: path(s.from, s.to), fill: "none", style: `stroke:${s.dir === "inc" ? PALETTE.green : PALETTE.red};stroke-width:4.5;stroke-linecap:round` }, figure);
    if (state.show.has("zeros")) for (const z of c.zeros) {
      svg("circle", { cx: toX(z), cy: toY(0), r: 8, style: `fill:${PALETTE.violet};stroke:var(--input);stroke-width:2` }, figure);
      tag(z, 0, `x = ${formatNumber(z)}`, PALETTE.violet, 0, 24);
    }
    if (state.show.has("extremes")) {
      for (const [list, name] of [[c.maxima, "max"], [c.minima, "min"]]) for (const mx of list) {
        svg("circle", { cx: toX(mx), cy: toY(c.f(mx)), r: 8, fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3.5` }, figure);
        tag(mx, c.f(mx), `${name}: ${formatNumber(c.f(mx), 2)}`, PALETTE.amber, -28, name === "max" ? -14 : 24);
      }
    }
    svg("line", { x1: toX(x), x2: toX(x), y1: toY(y), y2: toY(0), style: "stroke:var(--fg-soft);stroke-width:1.5;stroke-dasharray:4 4" }, figure);
    svg("circle", { cx: toX(x), cy: toY(y), r: 7.5, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2.5` }, figure);

    const segment = c.segments.find((s) => x >= s.from && x <= s.to);
    const epsilon = 1e-9;
    const atBoundary = c.segments.some((s) => Math.abs(x - s.from) < epsilon || Math.abs(x - s.to) < epsilon);
    const trend = atBoundary && c.segments.some((s) => Math.abs(x - s.from) < epsilon && s.from !== c.from) ? "itt vált a függvény iránya" : segment ? (segment.dir === "inc" ? "itt a függvény növekszik: jobbra haladva nő az érték" : "itt a függvény csökken: jobbra haladva kisebb az érték") : "";
    message.className = "il-message";
    message.textContent = `x = ${formatNumber(x, 2)}, f(x) = ${formatNumber(y, 2)}. ${trend ? `${trend[0].toUpperCase()}${trend.slice(1)}.` : ""}${state.show.has("range") ? ` Az értékkészlet: [${formatNumber(c.range[0])}; ${formatNumber(c.range[1])}].` : ""}`;
  }

  render();
  return () => scope.clearAll();
}
