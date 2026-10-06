import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

const X0 = 30, WIDTH = 540, INTERVALS = 10;
const STEPS = [100, 10, 1];
const STEP_NAMES = { 100: "százasával", 10: "tízesével", 1: "egyesével" };
const NBSP = " ";
const grouped = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const windowStart = (value, step) => Math.min(1000 - INTERVALS * step, Math.floor(value / (INTERVALS * step)) * INTERVALS * step);
const xOf = (value, start, step) => X0 + ((value - start) / (INTERVALS * step)) * WIDTH;

// Draws a number line window: 10 intervals of `step` starting at `start`; returns the svg and a redraw function.
function numberLine(parent, onClick) {
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 120", role: "img" }, parent);
  const layer = svg("g", {}, figure);
  const markers = svg("g", {}, figure);
  if (onClick) {
    figure.style.cursor = "crosshair";
    figure.addEventListener("click", (event) => {
      const box = figure.getBoundingClientRect();
      onClick(((event.clientX - box.left) / box.width) * 600);
    });
  }
  return {
    figure,
    draw(start, step, points = []) {
      layer.replaceChildren(); markers.replaceChildren();
      svg("line", { x1: X0 - 14, x2: X0 + WIDTH + 14, y1: 70, y2: 70, class: "axis" }, layer);
      for (let i = 0; i <= INTERVALS; i++) {
        const x = X0 + (i * WIDTH) / INTERVALS;
        svg("line", { x1: x, x2: x, y1: 62, y2: 78, class: "axis" }, layer);
        svg("text", { x, y: 98, "text-anchor": "middle", text: grouped(start + i * step) }, layer);
      }
      for (const point of points) {
        if (point.value < start || point.value > start + INTERVALS * step) continue;
        const x = xOf(point.value, start, step);
        svg("path", { d: `M ${x} 68 l -8 -18 h 16 Z`, style: `fill:${point.color ?? PALETTE.red}` }, markers);
        if (point.label) svg("text", { x, y: 42, "text-anchor": "middle", text: point.label, style: `fill:${point.color ?? PALETTE.red};font-weight:700` }, markers);
      }
    },
  };
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("A számegyenesen minden szám egy pont, és a nagyobb szám mindig jobbrább van. Ha ránagyítasz, a két jelölés közötti szakaszt újra tízfelé osztod, így bármelyik szám pontos helye megtalálható."));

  // --- Zoom ---
  const zoom = card("Nagyítás");
  let zoomValue = 437, zoomStep = 100;
  const zoomLine = numberLine(zoom);
  const zoomMessage = make("p", "il-message");
  const stepButtons = STEPS.map((step) => toggle(`${STEP_NAMES[step]}`, step === zoomStep, () => { zoomStep = step; renderZoom(); }));
  const slider = range({ label: "Szám", min: 0, max: 999, value: zoomValue, format: grouped, onInput: (value) => { zoomValue = value; renderZoom(); } });
  zoom.append(controls(slider.element), controls(make("span", "il-muted", "Egy jelölés:"), ...stepButtons), zoomLine.figure, zoomMessage);
  function renderZoom() {
    const start = windowStart(zoomValue, zoomStep);
    zoomLine.draw(start, zoomStep, [{ value: zoomValue, label: grouped(zoomValue) }]);
    stepButtons.forEach((element, index) => element.setAttribute("aria-pressed", String(STEPS[index] === zoomStep)));
    const low = Math.floor(zoomValue / zoomStep) * zoomStep;
    zoomMessage.textContent = zoomStep === 1 || low === zoomValue
      ? `${grouped(zoomValue)}: pontosan egy jelölésnél van. A jelölések ${STEP_NAMES[zoomStep]} követik egymást.`
      : `${grouped(zoomValue)}: ${grouped(low)} és ${grouped(low + zoomStep)} között van. Nagyíts rá, hogy lásd, hol pontosan.`;
  }

  // --- Place the number ---
  const place = card("Kihívás: told a helyére!");
  const placeState = { target: 0, step: 100, start: 0, done: false, reference: 0 };
  const placeLine = numberLine(place, (x) => {
    if (placeState.done) return;
    const { step, start } = placeState;
    const value = Math.round(start + ((x - X0) / WIDTH) * INTERVALS * step);
    if (value < start || value > start + INTERVALS * step) return;
    placeState.reference = value;
    const tolerance = step === 1 ? 0 : step / 5;
    const error = value - placeState.target;
    if (Math.abs(error) <= tolerance) {
      placeState.done = true;
      placeMessage.className = "il-message good";
      placeMessage.textContent = error === 0 ? `Pontosan! Ez a keresett szám.` : `Nagyon közel! A keresett szám kicsit ${error > 0 ? "balrább" : "jobbrább"} van, de ${STEP_NAMES[step]} ez már elég pontos. Nagyíts rá, ha pontosan akarod.`;
    } else {
      placeMessage.className = "il-message warn";
      placeMessage.textContent = `Ez a pont: ${grouped(value)}. A keresett szám ${error > 0 ? "kisebb, tehát balrább" : "nagyobb, tehát jobbrább"} van.`;
    }
    drawPlace(value);
  });
  const placeMessage = make("p", "il-message");
  const targetLabel = make("b", "il-accent");
  targetLabel.style.fontSize = "22px";
  const placeZoomButtons = STEPS.map((step) => toggle(STEP_NAMES[step], false, () => setPlaceStep(step)));
  const previous = button("◀ balra", () => shiftPlace(-1), { ghost: true });
  const next = button("jobbra ▶", () => shiftPlace(1), { ghost: true });
  place.append(controls(make("span", "", "Keresett szám: "), targetLabel, button("Új szám", newTarget, { ghost: true })), controls(make("span", "il-muted", "Egy jelölés:"), ...placeZoomButtons, previous, next), placeLine.figure, placeMessage);
  function newTarget() {
    placeState.target = randomInt(1, 998);
    placeState.done = false; placeState.reference = 0;
    setPlaceStep(100);
    placeMessage.className = "il-message";
    placeMessage.textContent = "Kattints a számegyenesre oda, ahová a szám szerinted kerül. Ha kell, nagyíts rá.";
  }
  function setPlaceStep(step) {
    placeState.step = step;
    placeState.start = windowStart(placeState.reference, step);
    drawPlace();
  }
  function shiftPlace(direction) {
    const span = INTERVALS * placeState.step;
    placeState.start = Math.max(0, Math.min(1000 - span, placeState.start + direction * span));
    drawPlace();
  }
  function drawPlace(value) {
    const { step, start } = placeState;
    const points = [];
    if (value !== undefined) points.push({ value, label: grouped(value) });
    if (placeState.done) points.push({ value: placeState.target, label: grouped(placeState.target), color: PALETTE.green });
    placeLine.draw(start, step, points);
    targetLabel.textContent = grouped(placeState.target);
    placeZoomButtons.forEach((element, index) => element.setAttribute("aria-pressed", String(STEPS[index] === step)));
    previous.disabled = start === 0; next.disabled = start + INTERVALS * step >= 1000;
  }

  // --- Ordering ---
  const order = card("Kihívás: növekvő sorrend");
  const chips = make("div", "il-controls");
  const orderMessage = make("p", "il-message");
  const orderLine = numberLine(order);
  let numbers = [], picked = [];
  order.append(make("p", "il-muted", "Kattints a számokra a legkisebbtől a legnagyobbig."), chips, orderMessage, orderLine.figure, controls(button("Új számok", newNumbers, { ghost: true })));
  function newNumbers() {
    const set = new Set();
    while (set.size < 5) set.add(randomInt(0, 999));
    numbers = [...set]; picked = [];
    orderMessage.className = "il-message"; orderMessage.textContent = "";
    renderOrder();
  }
  function renderOrder() {
    chips.replaceChildren(...numbers.map((value) => {
      const chip = toggle(grouped(value), picked.includes(value), () => pick(value));
      chip.disabled = picked.includes(value);
      chip.style.fontSize = "16px";
      return chip;
    }));
    orderLine.draw(0, 100, picked.length === numbers.length ? numbers.map((value) => ({ value, label: grouped(value) })) : []);
  }
  function pick(value) {
    const smallest = Math.min(...numbers.filter((other) => !picked.includes(other)));
    if (value !== smallest) {
      orderMessage.className = "il-message warn";
      orderMessage.textContent = `${grouped(value)} még nem következik: van nála kisebb szám is a megmaradtak között.`;
      return;
    }
    picked.push(value);
    const finished = picked.length === numbers.length;
    orderMessage.className = "il-message good";
    orderMessage.textContent = finished ? `Kész! ${picked.map(grouped).join(" < ")}. A számegyenesen is balról jobbra követik egymást.` : `Jó, ${grouped(value)}. Melyik a következő?`;
    renderOrder();
  }

  root.append(zoom, place, order, keyIdea("a számegyenesen a nagyobb szám jobbrább van. A két szomszédos jelölés között mindig van újabb szám, és ráközelítve tízesével, majd egyesével meg lehet találni a pontos helyét."));
  renderZoom();
  newTarget();
  newNumbers();
  return () => scope.clearAll();
}
