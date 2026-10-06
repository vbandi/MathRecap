import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const AXIS_MIN = -10, AXIS_MAX = 10, X0 = 30, WIDTH = 540, AXIS_Y = 80, VIEW_WIDTH = 600;
const toX = (value) => X0 + ((value - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * WIDTH;

// Interval notation with the Hungarian convention: [a; b], ]a; b[ ...
export function intervalText(spec) {
  const { a, b, leftInfinite, rightInfinite, leftClosed, rightClosed } = spec;
  const lo = leftInfinite ? "]−∞" : `${leftClosed ? "[" : "]"}${formatNumber(a)}`;
  const hi = rightInfinite ? "∞[" : `${formatNumber(b)}${rightClosed ? "]" : "["}`;
  return `${lo}; ${hi}`;
}

function setBuilderText(spec) {
  const { a, b, leftInfinite, rightInfinite, leftClosed, rightClosed } = spec;
  if (leftInfinite && rightInfinite) return "{x ∈ ℝ}";
  if (leftInfinite) return `{x ∈ ℝ | x ${rightClosed ? "≤" : "<"} ${formatNumber(b)}}`;
  if (rightInfinite) return `{x ∈ ℝ | x ${leftClosed ? "≥" : ">"} ${formatNumber(a)}}`;
  return `{x ∈ ℝ | ${formatNumber(a)} ${leftClosed ? "≤" : "<"} x ${rightClosed ? "≤" : "<"} ${formatNumber(b)}}`;
}

function isEmpty(spec) {
  return !spec.leftInfinite && !spec.rightInfinite && (spec.a > spec.b || (spec.a === spec.b && !(spec.leftClosed && spec.rightClosed)));
}

// Draws the axis and the highlighted interval into a group.
function drawAxis(layer, spec) {
  layer.replaceChildren();
  svg("line", { x1: X0 - 10, x2: X0 + WIDTH + 10, y1: AXIS_Y, y2: AXIS_Y, class: "axis" }, layer);
  for (let v = AXIS_MIN; v <= AXIS_MAX; v++) {
    svg("line", { x1: toX(v), x2: toX(v), y1: AXIS_Y - (v % 5 === 0 ? 8 : 4), y2: AXIS_Y + (v % 5 === 0 ? 8 : 4), class: "axis" }, layer);
    if (v % 2 === 0) svg("text", { x: toX(v), y: AXIS_Y + 26, "text-anchor": "middle", text: formatNumber(v), style: "font-size:11px;fill:var(--dim)" }, layer);
  }
  if (isEmpty(spec)) return;
  const from = spec.leftInfinite ? X0 - 10 : toX(spec.a), to = spec.rightInfinite ? X0 + WIDTH + 10 : toX(spec.b);
  svg("line", { x1: from, x2: to, y1: AXIS_Y, y2: AXIS_Y, style: `stroke:${PALETTE.blue};stroke-width:7;stroke-linecap:butt` }, layer);
  const end = (x, closed) => svg("circle", { cx: x, cy: AXIS_Y, r: 8, style: `fill:${closed ? PALETTE.blue : "var(--input)"};stroke:${PALETTE.blue};stroke-width:3` }, layer);
  if (!spec.leftInfinite) end(toX(spec.a), spec.leftClosed);
  else svg("path", { d: `M ${X0 - 10} ${AXIS_Y - 10} l -10 10 l 10 10`, fill: "none", style: `stroke:${PALETTE.blue};stroke-width:3` }, layer);
  if (!spec.rightInfinite) end(toX(spec.b), spec.rightClosed);
  else svg("path", { d: `M ${X0 + WIDTH + 10} ${AXIS_Y - 10} l 10 10 l -10 10`, fill: "none", style: `stroke:${PALETTE.blue};stroke-width:3` }, layer);
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Az intervallum a számegyenes összefüggő darabja: az összes szám két végpont között. Meg kell mondani, hogy a végpontok beletartoznak-e (zárt, tömör pont) vagy sem (nyílt, üres pont). A végtelen sosem tartozik bele, mert nem szám."));

  const spec = { a: -2, b: 3, leftInfinite: false, rightInfinite: false, leftClosed: true, rightClosed: false };
  const main = card("Állítsd be az intervallumot");
  main.append(make("p", "il-muted", "Húzd a pontokat! A pontra kattintva nyílt/zárt között válthatsz."));
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW_WIDTH} 130`, role: "img", style: "touch-action:none" }, main);
  const axisLayer = svg("g", {}, figure);
  const handleLayer = svg("g", {}, figure);
  const toggles = {
    leftClosed: toggle("Bal vég zárt", spec.leftClosed, () => { spec.leftClosed = !spec.leftClosed; render(); }),
    rightClosed: toggle("Jobb vég zárt", spec.rightClosed, () => { spec.rightClosed = !spec.rightClosed; render(); }),
    leftInfinite: toggle("−∞ felé nyitott", false, () => { spec.leftInfinite = !spec.leftInfinite; render(); }, PALETTE.violet),
    rightInfinite: toggle("+∞ felé nyitott", false, () => { spec.rightInfinite = !spec.rightInfinite; render(); }, PALETTE.violet),
  };
  const intervalLine = make("div", "il-formula start");
  const setLine = make("div", "il-formula start");
  [intervalLine, setLine].forEach((line) => { line.style.fontSize = "20px"; });
  const note = make("p", "il-message");
  main.append(controls(...Object.values(toggles)), intervalLine, setLine, note);

  const challenge = card("Kihívás: olvasd le az intervallumot");
  const target = { spec: null, options: [] };
  const challengeFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW_WIDTH} 130`, role: "img" }, challenge);
  const challengeLayer = svg("g", {}, challengeFigure);
  const optionBox = controls();
  const challengeMessage = make("p", "il-message");
  challenge.append(optionBox, challengeMessage);
  root.append(main, challenge, keyIdea("szögletes zárójel a beletartozó (zárt) végpontnál, kifelé fordított zárójel a nem beletartozó (nyílt) végpontnál. A ±∞ mindig nyílt: ]−∞; 3[. A halmazjelölés ugyanezt mondja egyenlőtlenségekkel."));

  function makeHandle(side) {
    const handle = svg("circle", { r: 15, style: "fill:transparent;cursor:grab" }, handleLayer);
    let dragging = false, moved = false;
    const valueAt = (event) => {
      const rect = figure.getBoundingClientRect();
      const x = ((event.clientX - rect.left) * VIEW_WIDTH) / rect.width;
      return Math.max(AXIS_MIN + 1, Math.min(AXIS_MAX - 1, Math.round(((x - X0) / WIDTH * (AXIS_MAX - AXIS_MIN) + AXIS_MIN) * 2) / 2));
    };
    handle.addEventListener("pointerdown", (event) => { dragging = true; moved = false; handle.setPointerCapture(event.pointerId); });
    handle.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const value = valueAt(event);
      if (value !== spec[side]) { moved = true; spec[side] = value; render(); }
    });
    handle.addEventListener("pointerup", () => {
      dragging = false;
      if (!moved) { const key = side === "a" ? "leftClosed" : "rightClosed"; spec[key] = !spec[key]; render(); }
    });
    return handle;
  }
  const handles = { a: makeHandle("a"), b: makeHandle("b") };

  function render() {
    drawAxis(axisLayer, spec);
    for (const side of ["a", "b"]) {
      const infinite = side === "a" ? spec.leftInfinite : spec.rightInfinite;
      handles[side].setAttribute("cx", toX(spec[side])); handles[side].setAttribute("cy", AXIS_Y);
      handles[side].style.display = infinite ? "none" : "";
    }
    for (const [key, element] of Object.entries(toggles)) element.setAttribute("aria-pressed", String(spec[key]));
    toggles.leftClosed.disabled = spec.leftInfinite; toggles.rightClosed.disabled = spec.rightInfinite;
    const empty = isEmpty(spec);
    const single = !spec.leftInfinite && !spec.rightInfinite && spec.a === spec.b && spec.leftClosed && spec.rightClosed;
    if (empty) { intervalLine.textContent = "Intervallum: ∅ (üres halmaz)"; setLine.textContent = `Halmazjelöléssel: ${setBuilderText(spec)}`; }
    else { intervalLine.textContent = `Intervallum: ${intervalText(spec)}`; setLine.textContent = `Halmazjelöléssel: ${setBuilderText(spec)}`; }
    note.className = "il-message";
    note.textContent = empty ? "Ehhez a beállításhoz nincs szám: az intervallum üres (nyílt végpontoknál az a = b esetén sincs benne semmi)."
      : single ? "Egyetlen pontot kaptunk: [a; a] = {a}." : `A bal végpont ${spec.leftInfinite ? "nincs: balra végtelenbe nyúlik" : spec.leftClosed ? "benne van (zárt, [ jel)" : "nincs benne (nyílt, ] jel)"}; a jobb végpont ${spec.rightInfinite ? "nincs: jobbra végtelenbe nyúlik" : spec.rightClosed ? "benne van (zárt, ] jel)" : "nincs benne (nyílt, [ jel)"}.`;
  }

  function newChallenge() {
    const pick = (n) => Math.floor(Math.random() * n);
    let a = pick(11) - 6, b = a + 1 + pick(6);
    const spec2 = { a, b, leftInfinite: pick(6) === 0, rightInfinite: false, leftClosed: pick(2) === 0, rightClosed: pick(2) === 0 };
    if (!spec2.leftInfinite) spec2.rightInfinite = pick(6) === 0;
    target.spec = spec2;
    const variants = new Map([[intervalText(spec2), true]]);
    const tweaks = [
      (s) => ({ ...s, leftClosed: !s.leftClosed }), (s) => ({ ...s, rightClosed: !s.rightClosed }),
      (s) => ({ ...s, a: s.a + 1 }), (s) => ({ ...s, b: s.b - 1 }), (s) => ({ ...s, leftClosed: !s.leftClosed, rightClosed: !s.rightClosed }),
    ];
    for (const tweak of tweaks.sort(() => Math.random() - 0.5)) {
      const candidate = tweak(spec2);
      if (!variants.has(intervalText(candidate)) && variants.size < 4 && candidate.a <= candidate.b) variants.set(intervalText(candidate), false);
    }
    target.options = [...variants.entries()].sort(() => Math.random() - 0.5);
    drawAxis(challengeLayer, spec2);
    optionBox.replaceChildren(...target.options.map(([text, correct]) => button(text, () => {
      challengeMessage.className = correct ? "il-message good" : "il-message warn";
      challengeMessage.textContent = correct ? `Jó! ${text} = ${setBuilderText(spec2)}.` : "Nem ez. Nézd meg a pontokat: a tömör pont beletartozik (szögletes zárójel), az üres nem (kifelé fordított zárójel).";
    }, { ghost: true })), button("Új kép", newChallenge));
    challengeMessage.className = "il-message"; challengeMessage.textContent = "";
  }

  render();
  newChallenge();
  return () => scope.clearAll();
}
