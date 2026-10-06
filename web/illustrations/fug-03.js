import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

const UNIT = 30, R = 6, PAD = 24, SIZE = 2 * R * UNIT + 2 * PAD;
const toX = (x) => PAD + (x + R) * UNIT;
const toY = (y) => PAD + (R - y) * UNIT;
const point = (x, y) => `(${formatNumber(x)}; ${formatNumber(y)})`;

const QUADRANTS = [
  { name: "I. negyed", article: "Az", sx: 1, sy: 1, color: PALETTE.green, label: "(+; +)" },
  { name: "II. negyed", article: "A", sx: -1, sy: 1, color: PALETTE.blue, label: "(−; +)" },
  { name: "III. negyed", article: "A", sx: -1, sy: -1, color: PALETTE.violet, label: "(−; −)" },
  { name: "IV. negyed", article: "A", sx: 1, sy: -1, color: PALETTE.amber, label: "(+; −)" },
];

function describe(x, y) {
  if (x === 0 && y === 0) return "Ez az origó, a két tengely metszéspontja.";
  if (x === 0) return "Az y tengelyen van: az első koordinátája 0.";
  if (y === 0) return "Az x tengelyen van: a második koordinátája 0.";
  const quadrant = QUADRANTS.find((q) => Math.sign(x) === q.sx && Math.sign(y) === q.sy);
  return `${quadrant.article} ${quadrant.name} pontja, a koordináták előjele ${quadrant.label}.`;
}

function randomPoint(avoid) {
  let x, y;
  do { x = Math.floor(Math.random() * (2 * R - 1)) - (R - 1); y = Math.floor(Math.random() * (2 * R - 1)) - (R - 1); }
  while (avoid && avoid.x === x && avoid.y === y);
  return { x, y };
}

export function mount(root) {
  const scope = createScope();
  const state = { mode: "explore", target: null, tries: [], solved: false, guessX: 0, guessY: 0, hover: null };

  root.append(lead("Két egymásra merőleges számegyenes, a tengelyek kifeszítenek egy síkot, és a sík minden pontjának két száma van. Az első (x) azt mondja meg, hány lépést kell menni jobbra vagy balra, a második (y) azt, hány lépést fel vagy le."));

  const main = card("Kincskeresés a koordináta-rendszerben");
  const modes = make("div", "il-controls");
  const prompt = make("p", "il-message");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${SIZE} ${SIZE}`, role: "img", style: "max-width:460px;margin:0 auto;touch-action:none;cursor:crosshair" });
  const actions = make("div");
  main.append(modes, prompt, figure, actions);
  root.append(main, keyIdea("egy pont koordinátái (x; y): először a vízszintes, aztán a függőleges irányban kell lépni, az origótól indulva. A negyedeket az előjelek különböztetik meg."));

  // Static background: coloured quadrants, grid, axes.
  for (const q of QUADRANTS) {
    svg("rect", { x: q.sx > 0 ? toX(0) : toX(-R), y: q.sy > 0 ? toY(R) : toY(0), width: R * UNIT, height: R * UNIT, style: `fill:${q.color};opacity:.13` }, figure);
    svg("text", { x: toX(q.sx * (R - 0.4)), y: toY(q.sy * (R - 0.8)), "text-anchor": q.sx > 0 ? "end" : "start", text: `${q.name} ${q.label}`, style: `fill:${q.color};font-weight:700;font-size:12px` }, figure);
  }
  for (let v = -R; v <= R; v++) {
    svg("line", { x1: toX(v), x2: toX(v), y1: PAD, y2: SIZE - PAD, class: v ? "grid" : "axis" }, figure);
    svg("line", { x1: PAD, x2: SIZE - PAD, y1: toY(v), y2: toY(v), class: v ? "grid" : "axis" }, figure);
    if (v) {
      svg("text", { x: toX(v), y: toY(0) + 15, "text-anchor": "middle", text: formatNumber(v), style: "font-size:10px;fill:var(--dim)" }, figure);
      svg("text", { x: toX(0) - 6, y: toY(v) + 4, "text-anchor": "end", text: formatNumber(v), style: "font-size:10px;fill:var(--dim)" }, figure);
    }
  }
  svg("text", { x: SIZE - PAD - 2, y: toY(0) - 7, "text-anchor": "end", text: "x", style: "font-style:italic" }, figure);
  svg("text", { x: toX(0) + 7, y: PAD - 6, text: "y", style: "font-style:italic" }, figure);
  const dynamic = svg("g", {}, figure);

  function projections(x, y, color, group) {
    svg("line", { x1: toX(x), y1: toY(y), x2: toX(x), y2: toY(0), style: `stroke:${color};stroke-width:2;stroke-dasharray:5 4` }, group);
    svg("line", { x1: toX(x), y1: toY(y), x2: toX(0), y2: toY(y), style: `stroke:${color};stroke-width:2;stroke-dasharray:5 4` }, group);
  }

  function label(x, y, text, color) {
    const flip = x > 2;
    svg("text", { x: toX(x) + (flip ? -10 : 10), y: toY(y) - 10, "text-anchor": flip ? "end" : "start", text, style: `fill:${color};font-weight:700;font-size:14px` }, dynamic);
  }

  function render() {
    dynamic.replaceChildren();
    if (state.mode === "explore" && state.hover) {
      const { x, y } = state.hover;
      projections(x, y, "var(--fg-soft)", dynamic);
      svg("circle", { cx: toX(x), cy: toY(y), r: 6, style: "fill:var(--accent)" }, dynamic);
      label(x, y, point(x, y), "var(--fg)");
    }
    if (state.mode === "place") {
      for (const t of state.tries) {
        svg("path", { d: `M ${toX(t.x) - 6} ${toY(t.y) - 6} l 12 12 m 0 -12 l -12 12`, style: `stroke:${PALETTE.red};stroke-width:3;stroke-linecap:round` }, dynamic);
        label(t.x, t.y, point(t.x, t.y), PALETTE.red);
      }
      if (state.solved) {
        projections(state.target.x, state.target.y, PALETTE.amber, dynamic);
        treasure(state.target);
      }
    }
    if (state.mode === "read") {
      treasure(state.target);
      svg("circle", { cx: toX(state.guessX), cy: toY(state.guessY), r: 9, fill: "none", style: `stroke:var(--accent);stroke-width:3;stroke-dasharray:4 3` }, dynamic);
      if (state.solved) projections(state.target.x, state.target.y, PALETTE.amber, dynamic);
    }
  }

  function treasure({ x, y }) {
    svg("circle", { cx: toX(x), cy: toY(y), r: 11, style: `fill:${PALETTE.amber};stroke:var(--input);stroke-width:2` }, dynamic);
    svg("text", { x: toX(x), y: toY(y) + 5, "text-anchor": "middle", text: "★", style: "fill:#2a1a00;font-size:15px;font-weight:700" }, dynamic);
  }

  function setPrompt(text, tone = "") { prompt.textContent = text; prompt.className = `il-message ${tone}`; }

  function setMode(mode) {
    state.mode = mode; state.tries = []; state.solved = false; state.hover = null;
    state.target = mode === "explore" ? null : randomPoint();
    modes.replaceChildren(...[["explore", "Fedezd fel"], ["place", "Ásd el a kincset"], ["read", "Olvasd le a helyét"]].map(([key, text]) => toggle(text, key === mode, () => setMode(key))));
    actions.replaceChildren();
    if (mode === "explore") setPrompt("Mozgasd az egeret (vagy érintsd meg) a rácson: látod a pont koordinátáit és azt, melyik negyedben van.");
    if (mode === "place") {
      setPrompt(`A kincs helye ${point(state.target.x, state.target.y)}. Kattints a rács megfelelő pontjára!`);
      actions.append(controls(button("Új kincs", () => setMode("place"), { ghost: true })));
    }
    if (mode === "read") {
      state.guessX = 0; state.guessY = 0;
      setPrompt("Hol van a csillag? Állítsd be a két koordinátát a csúszkákkal, amíg a szaggatott kör a csillagra nem kerül.");
      const sliderX = range({ label: "x", min: -R + 1, max: R - 1, value: 0, format: formatNumber, onInput: (v) => { state.guessX = v; state.solved = false; render(); } });
      const sliderY = range({ label: "y", min: -R + 1, max: R - 1, value: 0, format: formatNumber, onInput: (v) => { state.guessY = v; state.solved = false; render(); } });
      actions.append(controls(sliderX.element, sliderY.element, button("Ellenőrzés", checkReading), button("Új kincs", () => setMode("read"), { ghost: true })));
    }
    render();
  }

  function checkReading() {
    const { x, y } = state.target;
    if (state.guessX === x && state.guessY === y) {
      state.solved = true;
      setPrompt(`Megvan! A kincs helye ${point(x, y)}. ${describe(x, y)}`, "good");
    } else if (state.guessX !== x) {
      setPrompt("Az első koordináta (x) még nem jó: nézd meg, hány lépést kell tenni jobbra vagy balra az origótól!", "warn");
    } else {
      setPrompt("Az első koordináta jó, de a második (y) még nem: hány lépést kell fel vagy le menni?", "warn");
    }
    render();
  }

  function locate(event) {
    const box = figure.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * SIZE, py = ((event.clientY - box.top) / box.height) * SIZE;
    const x = Math.round((px - PAD) / UNIT) - R, y = R - Math.round((py - PAD) / UNIT);
    return { x: Math.max(-R, Math.min(R, x)), y: Math.max(-R, Math.min(R, y)) };
  }

  function updateHover(event) {
    if (state.mode !== "explore") return;
    state.hover = locate(event);
    setPrompt(`${point(state.hover.x, state.hover.y)}: ${describe(state.hover.x, state.hover.y)}`);
    render();
  }
  figure.addEventListener("pointermove", updateHover);
  figure.addEventListener("pointerdown", updateHover);
  figure.addEventListener("pointerleave", () => { if (state.mode === "explore") { state.hover = null; render(); } });
  figure.addEventListener("click", (event) => {
    if (state.mode !== "place" || state.solved) return;
    const { x, y } = locate(event), target = state.target;
    if (x === target.x && y === target.y) {
      state.solved = true;
      setPrompt(`Megtaláltad! A kincs a ${point(x, y)} pontban van. ${describe(x, y)}`, "good");
    } else {
      state.tries.push({ x, y });
      const which = x !== target.x ? "Az első koordináta (x) nem egyezik: a kincs " + (target.x > x ? "jobbrább" : "balrább") + " van." : "Az első koordináta jó, de a kincs " + (target.y > y ? "feljebb" : "lejjebb") + " van.";
      setPrompt(`Ez a ${point(x, y)} pont, nem a ${point(target.x, target.y)}. ${which}`, "warn");
    }
    render();
  });

  setMode("explore");
  return () => scope.clearAll();
}
