import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, svg, toggle, uniqueId } from "./kit.js";

const n = (value, digits = 3) => formatNumber(value, digits);
const SUBSCRIPTS = { 2: "₂", 3: "₃" };
const POWERS = [{ base: 2, exponent: 3 }, { base: 3, exponent: 2 }, { base: 0.5, exponent: -2 }, { base: 2, exponent: -2 }];
const LOGS = [{ base: 2, shift: 1, value: 3 }, { base: 3, shift: 2, value: 2 }, { base: 2, shift: -1, value: 2 }];
const plus = (value) => `${value < 0 ? "−" : "+"} ${n(Math.abs(value))}`;

// Static coordinate frame; returns mappers and a layer that is cleared on every render.
function createFrame(parent, { xMin, xMax, yMin, yMax, xUnit, yUnit, label }) {
  const pad = 22, width = (xMax - xMin) * xUnit + 2 * pad, height = (yMax - yMin) * yUnit + 2 * pad;
  const toX = (x) => pad + (x - xMin) * xUnit, toY = (y) => pad + (yMax - y) * yUnit;
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": label }, parent);
  const clipId = uniqueId("exponential-clip");
  svg("rect", { x: pad, y: pad, width: width - 2 * pad, height: height - 2 * pad }, svg("clipPath", { id: clipId }, svg("defs", {}, figure)));
  for (let x = Math.ceil(xMin); x <= xMax; x++) {
    svg("line", { x1: toX(x), x2: toX(x), y1: pad, y2: height - pad, class: x ? "grid" : "axis" }, figure);
    if (x) svg("text", { x: toX(x), y: toY(0) + 15, "text-anchor": "middle", text: n(x), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  for (let y = Math.ceil(yMin); y <= yMax; y++) {
    svg("line", { x1: pad, x2: width - pad, y1: toY(y), y2: toY(y), class: y ? "grid" : "axis" }, figure);
    if (y && y % 2 === 0) svg("text", { x: toX(0) - 6, y: toY(y) + 4, "text-anchor": "end", text: n(y), style: "font-size:11px;fill:var(--dim)" }, figure);
  }
  const layer = svg("g", { "clip-path": `url(#${clipId})` }, figure);
  const top = svg("g", {}, figure);
  const curve = (fn, color, from = xMin) => {
    let d = "";
    for (let x = from; x <= xMax + 1e-9; x += (xMax - xMin) / 400) d += `${d ? "L" : "M"} ${toX(x)} ${toY(fn(x))} `;
    svg("path", { d, fill: "none", style: `stroke:${color};stroke-width:3.5` }, layer);
  };
  return { toX, toY, layer, top, curve, xMin, xMax, clear() { layer.replaceChildren(); top.replaceChildren(); } };
}

const intervalText = (from, fromClosed, to, toClosed) => `${fromClosed ? "[" : "]"}${from === -Infinity ? "−∞" : n(from)}; ${to === Infinity ? "∞" : n(to)}${toClosed ? "]" : "["}`;

export function mount(root) {
  const state = { power: 0, log: 0, logX: 4, base: 0.5, relation: ">", k: -2 };

  root.append(lead("Az exponenciális egyenletben az ismeretlen a kitevőben van, a logaritmusos egyenletben pedig egy logaritmus argumentumában. Mindkettőnél ugyanaz a fő ötlet: hozzuk azonos alapra, vagy használjuk ki, hogy az exponenciális és a logaritmusfüggvény egymás fordítottja."));

  // --- A: exponential equation ---
  const exponential = card("Exponenciális egyenlet: azonos alapra hozás");
  const powerToggles = make("div", "il-controls");
  const powerSteps = make("ol", "il-steps");
  const powerFrame = createFrame(exponential, { xMin: -4, xMax: 5, yMin: -1, yMax: 10, xUnit: 55, yUnit: 26, label: "Exponenciális függvény és vízszintes egyenes" });
  const powerMessage = make("p", "il-message");
  exponential.append(powerToggles, powerSteps, powerMessage);
  exponential.insertBefore(powerFrame.top.ownerSVGElement, powerMessage);

  // --- B: logarithmic equation ---
  const logarithmic = card("Logaritmusos egyenlet: értelmezési tartomány");
  const logToggles = make("div", "il-controls");
  const logSteps = make("ol", "il-steps");
  const logX = range({ label: "próbálj ki egy x-et", min: -3, max: 12, step: 0.5, value: state.logX, format: n, onInput: (v) => { state.logX = v; renderLog(); } });
  const logFrame = createFrame(logarithmic, { xMin: -3, xMax: 12, yMin: -3, yMax: 5, xUnit: 40, yUnit: 30, label: "Logaritmusfüggvény és vízszintes egyenes" });
  const logMessage = make("p", "il-message");
  logarithmic.append(logToggles, logSteps, controls(logX.element), logMessage);
  logarithmic.insertBefore(logFrame.top.ownerSVGElement, logSteps.nextSibling);

  // --- C: exponential inequality ---
  const inequality = card("Exponenciális egyenlőtlenség: mikor fordul a jel?");
  const inequalityToggles = make("div", "il-controls");
  const kSlider = range({ label: "k (a jobb oldal: alap^k)", min: -3, max: 3, value: state.k, format: n, onInput: (v) => { state.k = v; renderInequality(); } });
  const inequalitySteps = make("ol", "il-steps");
  const inequalityFrame = createFrame(inequality, { xMin: -4, xMax: 4, yMin: -1, yMax: 10, xUnit: 70, yUnit: 26, label: "Exponenciális függvény és vízszintes egyenes" });
  const inequalityMessage = make("p", "il-message");
  inequality.append(inequalityToggles, controls(kSlider.element), inequalitySteps, inequalityMessage);
  inequality.insertBefore(inequalityFrame.top.ownerSVGElement, inequalitySteps);

  root.append(exponential, logarithmic, inequality, keyIdea("azonos alapra hozás után a kitevőket lehet egyenlővé tenni, mert az exponenciális függvény kölcsönösen egyértelmű. Logaritmusnál előbb az értelmezési tartományt kell megnézni, és a kapott gyököt ellenőrizni. Egyenlőtlenségnél a 0 és 1 közötti alapú függvény csökkenő, ezért a relációjel megfordul."));

  const items = (list) => list.map(([text, note]) => { const li = make("li", "", text); li.append(make("span", "il-muted", `  | ${note}`)); return li; });

  function renderPower() {
    const { base, exponent } = POWERS[state.power], rhs = base ** exponent;
    powerToggles.replaceChildren(make("span", "il-muted", "Egyenlet:"), ...POWERS.map((p, i) => toggle(`${n(p.base)}ˣ = ${n(p.base ** p.exponent)}`, i === state.power, () => { state.power = i; renderPower(); })));
    powerSteps.replaceChildren(...items([
      [`${n(base)}ˣ = ${n(rhs)}`, "kiindulás"],
      [`${n(base)}ˣ = ${n(base)}^${exponent < 0 ? `(${n(exponent)})` : n(exponent)}`, `a jobb oldalt ${n(base)} hatványaként írjuk fel`],
      [`x = ${n(exponent)}`, "az azonos alapú hatványok csak akkor egyenlők, ha a kitevők egyenlők"],
    ]));
    powerFrame.clear();
    powerFrame.curve((x) => base ** x, PALETTE.blue);
    powerFrame.curve(() => rhs, PALETTE.amber);
    const dashed = "stroke:var(--fg);stroke-width:1.8;stroke-dasharray:6 5";
    svg("line", { x1: powerFrame.toX(exponent), x2: powerFrame.toX(exponent), y1: powerFrame.toY(rhs), y2: powerFrame.toY(0), style: dashed }, powerFrame.layer);
    svg("circle", { cx: powerFrame.toX(exponent), cy: powerFrame.toY(rhs), r: 7, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, powerFrame.layer);
    svg("circle", { cx: powerFrame.toX(exponent), cy: powerFrame.toY(0), r: 5, style: `fill:${PALETTE.green};stroke:var(--input);stroke-width:2` }, powerFrame.layer);
    svg("text", { x: powerFrame.toX(exponent) + 10, y: powerFrame.toY(0) - 10, text: `x = ${n(exponent)}`, style: `fill:${PALETTE.green};font-weight:700` }, powerFrame.top);
    powerMessage.className = "il-message good";
    powerMessage.textContent = `A kék görbe (${n(base)}ˣ) és a narancs egyenes (y = ${n(rhs)}) az x = ${n(exponent)} helyen metszi egymást — ugyanezt kaptuk algebrailag.`;
  }

  function renderLog() {
    const { base, shift, value } = LOGS[state.log], argument = `x ${plus(-shift)}`, solution = shift + base ** value;
    const b = `log${SUBSCRIPTS[base]}`;
    logToggles.replaceChildren(make("span", "il-muted", "Egyenlet:"), ...LOGS.map((l, i) => toggle(`log${SUBSCRIPTS[l.base]}(x ${plus(-l.shift)}) = ${n(l.value)}`, i === state.log, () => { state.log = i; renderLog(); })));
    logSteps.replaceChildren(...items([
      [`${b}(${argument}) = ${n(value)}`, "kiindulás"],
      [`${argument} > 0, azaz x > ${n(shift)}`, "értelmezési tartomány: a logaritmus argumentuma pozitív"],
      [`${argument} = ${n(base)}^${n(value)} = ${n(base ** value)}`, "a logaritmus definíciója"],
      [`x = ${n(solution)}`, `ellenőrzés: ${n(solution)} > ${n(shift)}, tehát megfelel`],
    ]));
    logFrame.clear();
    const fn = (x) => Math.log(x - shift) / Math.log(base);
    logFrame.curve(fn, PALETTE.blue, shift + 0.001);
    logFrame.curve(() => value, PALETTE.amber);
    svg("line", { x1: logFrame.toX(shift), x2: logFrame.toX(shift), y1: 0, y2: 400, style: `stroke:${PALETTE.red};stroke-width:2;stroke-dasharray:6 5` }, logFrame.layer);
    svg("text", { x: logFrame.toX(shift) + 6, y: 40, text: `x = ${n(shift)} (itt nem értelmezett)`, style: `fill:${PALETTE.red};font-size:12px` }, logFrame.top);
    svg("circle", { cx: logFrame.toX(solution), cy: logFrame.toY(value), r: 7, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, logFrame.layer);
    const x = state.logX, defined = x > shift;
    if (defined) svg("circle", { cx: logFrame.toX(x), cy: logFrame.toY(fn(x)), r: 6, style: `fill:${PALETTE.green};stroke:var(--input);stroke-width:2` }, logFrame.layer);
    else svg("line", { x1: logFrame.toX(x), x2: logFrame.toX(x), y1: 0, y2: 400, style: `stroke:${PALETTE.red};stroke-width:2` }, logFrame.layer);
    logMessage.className = `il-message ${defined ? "good" : "warn"}`;
    logMessage.textContent = defined
      ? `x = ${n(x)}: ${argument} = ${n(x - shift)} > 0, értelmezett; ${b} értéke ${n(fn(x), 2)}${x === solution ? " — ez a megoldás!" : "."}`
      : `x = ${n(x)}: ${argument} = ${n(x - shift)} ≤ 0, a logaritmus nem értelmezett. Az ilyen x nem lehet megoldás.`;
  }

  function renderInequality() {
    const { base, relation, k } = state, rhs = base ** k, decreasing = base < 1;
    inequalityToggles.replaceChildren(
      make("span", "il-muted", "Alap:"), ...[0.5, 2].map((v) => toggle(n(v), v === base, () => { state.base = v; renderInequality(); })),
      make("span", "il-muted", "Reláció:"), ...[">", "<"].map((r) => toggle(r, r === relation, () => { state.relation = r; renderInequality(); })),
    );
    const flipped = decreasing ? (relation === ">" ? "<" : ">") : relation;
    const greater = flipped === ">";
    inequalitySteps.replaceChildren(...items([
      [`${n(base)}ˣ ${relation} ${n(rhs)}`, "kiindulás"],
      [`${n(base)}ˣ ${relation} ${n(base)}^${k < 0 ? `(${n(k)})` : n(k)}`, `a jobb oldalt ${n(base)} hatványaként írjuk`],
      [`x ${flipped} ${n(k)}`, decreasing ? "0 < alap < 1: a függvény csökkenő, ezért a reláció megfordul" : "1-nél nagyobb alap: a függvény növekvő, a reláció marad"],
      [`x ∈ ${greater ? intervalText(k, false, Infinity, false) : intervalText(-Infinity, false, k, false)}`, "a megoldás intervallumként"],
    ]));
    inequalityFrame.clear();
    const { toX, toY, layer, curve } = inequalityFrame;
    curve((x) => base ** x, PALETTE.blue);
    curve(() => rhs, PALETTE.amber);
    const from = greater ? k : inequalityFrame.xMin, to = greater ? inequalityFrame.xMax : k;
    svg("line", { x1: toX(from), x2: toX(to), y1: toY(0), y2: toY(0), style: `stroke:${PALETTE.green};stroke-width:8;opacity:.85` }, layer);
    svg("line", { x1: toX(k), x2: toX(k), y1: toY(rhs), y2: toY(0), style: "stroke:var(--fg);stroke-width:1.8;stroke-dasharray:6 5" }, layer);
    svg("circle", { cx: toX(k), cy: toY(0), r: 7, style: `fill:var(--input);stroke:${PALETTE.green};stroke-width:3` }, layer);
    svg("circle", { cx: toX(k), cy: toY(rhs), r: 6, style: `fill:${PALETTE.pink};stroke:var(--input);stroke-width:2` }, layer);
    inequalityMessage.className = "il-message good";
    inequalityMessage.textContent = `A zöld szakaszon a kék görbe ${relation === ">" ? "a narancs egyenes fölött" : "a narancs egyenes alatt"} van. ${decreasing ? `A görbe jobbra lefelé megy, ezért a „${relation === ">" ? "fölötte" : "alatta"}" rész a bal oldalon (x ${flipped} ${n(k)}) található.` : "A görbe jobbra felfelé megy, ezért a jel iránya ugyanaz marad."}`;
  }

  renderPower();
  renderLog();
  renderInequality();
  return () => {};
}
