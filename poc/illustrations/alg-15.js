import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, stepper, svg } from "./kit.js";

const DISTANCE = 300;
const ROAD = { left: 50, right: 550, y: 96 };

export function mount(root) {
  const scope = createScope();
  const state = { v1: 60, v2: 90, carStep: 0, progress: 0, a: 3, b: 6, tankStep: 0, tankProgress: 1 };
  let runningFrame = null;

  root.append(lead("A szöveges feladatokat egyenlettel is megoldhatod: az ismeretlent betűvel jelölöd, a szöveg állításait felírod a betűvel, és az egyenletet megoldod. A végén az eredményt a szöveggel is össze kell vetni."));

  // --- Two cars ---
  const cars = card("Két autó szemben");
  const v1 = range({ label: "Az első autó sebessége (km/h)", min: 30, max: 120, step: 10, value: state.v1, onInput: (v) => { state.v1 = v; state.carStep = 0; state.progress = 0; renderCars(); } });
  const v2 = range({ label: "A második autó sebessége (km/h)", min: 30, max: 120, step: 10, value: state.v2, onInput: (v) => { state.v2 = v; state.carStep = 0; state.progress = 0; renderCars(); } });
  const timeSlider = range({ label: "Eltelt idő (óra)", min: 0, max: 100, step: 1, value: 0, format: () => formatNumber(state.progress * meetingTime()), onInput: (v) => { stopRunning(); state.progress = v / 100; renderCars(); } });
  const carFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 150", role: "img" });
  const carEquation = make("div", "il-formula start");
  carEquation.style.minHeight = "4.8em";
  const carMessage = make("p", "il-message");
  const carNext = button("Következő lépés", () => { state.carStep = Math.min(4, state.carStep + 1); renderCars(); });
  const carPlay = button("Indítás", () => playCars(), { ghost: true });
  cars.append(make("p", "", `Két város ${DISTANCE} km-re van egymástól. Egyszerre indul egy-egy autó a másik felé. Mikor találkoznak?`), controls(v1.element, v2.element), carFigure, controls(timeSlider.element, carPlay), carEquation, carMessage, controls(carNext));

  // --- Working together ---
  const work = card("Közös munka: a medence megtöltése");
  const aControl = stepper({ label: "Az első cső egyedül (óra)", min: 2, max: 12, value: state.a, onChange: (v) => { state.a = v; state.tankStep = 0; state.tankProgress = 1; renderTank(); } });
  const bControl = stepper({ label: "A második cső egyedül (óra)", min: 2, max: 12, value: state.b, onChange: (v) => { state.b = v; state.tankStep = 0; state.tankProgress = 1; renderTank(); } });
  const tankFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 190", role: "img" });
  const tankEquation = make("div", "il-formula start");
  tankEquation.style.minHeight = "3.4em";
  const tankMessage = make("p", "il-message");
  const tankNext = button("Következő lépés", () => { state.tankStep = Math.min(3, state.tankStep + 1); renderTank(); });
  const tankPlay = button("Indítás", () => playTank(), { ghost: true });
  work.append(make("p", "", "Az első cső egyedül a beállított számú óra alatt tölti meg a tartályt, a második cső is a saját beállított idő alatt. Ha egyszerre folyik mindkettő, mennyi idő alatt lesz tele?"), controls(aControl.element, bControl.element), tankFigure, tankEquation, tankMessage, controls(tankNext, tankPlay));

  root.append(cars, work, keyIdea("a szöveges feladat megoldása: jelöld az ismeretlent, fejezd ki vele a szöveg adatait, írd fel az egyenletet, oldd meg, és ellenőrizd a szöveg alapján. Közös munkánál nem az időket, hanem az egy óra alatt elvégzett részeket kell összeadni."));

  function meetingTime() { return DISTANCE / (state.v1 + state.v2); }

  function stopRunning() {
    if (runningFrame !== null) scope.clearAll();
    runningFrame = null;
  }

  function animate(durationMs, onProgress) {
    stopRunning();
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / durationMs);
      onProgress(p);
      runningFrame = p < 1 ? scope.frame(tick) : null;
    };
    runningFrame = scope.frame(tick);
  }

  function playCars() { animate(3500, (p) => { state.progress = p; state.carStep = Math.max(state.carStep, p === 1 ? 4 : 0); renderCars(); }); }
  function playTank() { animate(3500, (p) => { state.tankProgress = p; state.tankStep = Math.max(state.tankStep, p === 1 ? 3 : 0); renderTank(); }); }

  function car(x, y, color, label, facingRight) {
    const group = svg("g", {}, carFigure);
    svg("rect", { x: x - 22, y: y - 22, width: 44, height: 18, rx: 6, style: `fill:${color}` }, group);
    svg("rect", { x: x - 12 + (facingRight ? 4 : -4), y: y - 32, width: 24, height: 12, rx: 4, style: `fill:${color}` }, group);
    svg("circle", { cx: x - 12, cy: y - 3, r: 5, style: "fill:var(--fg)" }, group);
    svg("circle", { cx: x + 12, cy: y - 3, r: 5, style: "fill:var(--fg)" }, group);
    svg("text", { x, y: y - 40, "text-anchor": "middle", text: label, style: "font-weight:700;font-size:12px" }, group);
  }

  function renderCars() {
    const { v1: s1, v2: s2, carStep: step, progress } = state;
    const t = meetingTime(), now = progress * t;
    const span = ROAD.right - ROAD.left, toX = (km) => ROAD.left + (km / DISTANCE) * span;
    const d1 = s1 * now, d2 = s2 * now;
    carFigure.replaceChildren();
    svg("line", { x1: ROAD.left, x2: ROAD.right, y1: ROAD.y, y2: ROAD.y, style: "stroke:var(--line-strong);stroke-width:6;stroke-linecap:round" }, carFigure);
    svg("text", { x: ROAD.left, y: 130, "text-anchor": "middle", text: "A város" }, carFigure);
    svg("text", { x: ROAD.right, y: 130, "text-anchor": "middle", text: "B város" }, carFigure);
    const meetX = toX(s1 * t);
    if (step >= 3) {
      svg("line", { x1: meetX, x2: meetX, y1: 30, y2: ROAD.y + 8, style: `stroke:${PALETTE.pink};stroke-dasharray:5 4;stroke-width:2` }, carFigure);
      svg("text", { x: meetX, y: 22, "text-anchor": "middle", text: `találkozás: ${formatNumber(s1 * t)} km`, style: `fill:${PALETTE.pink};font-weight:700` }, carFigure);
    }
    car(toX(d1), ROAD.y, PALETTE.blue, `${s1} km/h`, true);
    car(toX(DISTANCE - d2), ROAD.y, PALETTE.red, `${s2} km/h`, false);
    const texts = [
      "Jelöld t-vel az eltelt időt órában, amíg találkoznak.",
      `Az első autó t óra alatt ${s1} · t km-t tesz meg.`,
      `A második autó ${s2} · t km-t tesz meg. Amikor találkoznak, együtt az egész utat megtették.`,
      `Az egyenlet: ${s1} · t + ${s2} · t = ${DISTANCE}. Kiemelve: ${s1 + s2} · t = ${DISTANCE}, tehát t = ${DISTANCE} : ${s1 + s2} = ${formatNumber(t)} óra.`,
      `Ellenőrzés: ${formatNumber(t)} óra alatt az első ${formatNumber(s1 * t)} km-t, a második ${formatNumber(s2 * t)} km-t tett meg, együtt ${formatNumber(s1 * t + s2 * t)} km. Az animációban pontosan itt találkoznak. ✓`,
    ];
    const lines = [
      "t: az idő, amíg találkoznak",
      `első autó: ${s1} · t`,
      `második autó: ${s2} · t`,
      `${s1} · t + ${s2} · t = ${DISTANCE}  →  t = ${formatNumber(t)}`,
    ];
    carEquation.replaceChildren(make("span", "", lines.slice(0, Math.min(4, step + 1)).join("\n")));
    carEquation.style.whiteSpace = "pre-line";
    carMessage.className = `il-message ${step >= 4 ? "good" : ""}`;
    carMessage.textContent = texts[step];
    carNext.disabled = step >= 4;
    timeSlider.set(Math.round(progress * 100));
    carFigure.setAttribute("aria-label", `Két autó közeledik egymáshoz, az idő ${formatNumber(now)} óra`);
  }

  function renderTank() {
    const { a, b, tankStep: step, tankProgress: progress } = state;
    const rate = 1 / a + 1 / b, t = 1 / rate, now = progress * t;
    const level = Math.min(1, rate * now);
    tankFigure.replaceChildren();
    svg("rect", { x: 210, y: 20, width: 180, height: 140, rx: 6, style: "fill:none;stroke:var(--fg-soft);stroke-width:3" }, tankFigure);
    svg("rect", { x: 213, y: 160 - 137 * level, width: 174, height: 137 * level, style: `fill:${PALETTE.blue};fill-opacity:.8` }, tankFigure);
    svg("text", { x: 300, y: 184, "text-anchor": "middle", text: `${formatNumber(now)} óra után: ${formatNumber(Math.round(level * 1000) / 10)} %`, style: "font-weight:700" }, tankFigure);
    [["1. cső", 70, PALETTE.green, `${fractionLabel(1, a)} / óra`], ["2. cső", 530, PALETTE.amber, `${fractionLabel(1, b)} / óra`]].forEach(([name, x, color, rateText]) => {
      svg("rect", { x: x - 30, y: 50, width: 60, height: 24, rx: 5, style: `fill:${color}` }, tankFigure);
      svg("text", { x, y: 67, "text-anchor": "middle", text: name, style: "fill:#fff;font-weight:700" }, tankFigure);
      svg("text", { x, y: 100, "text-anchor": "middle", text: rateText }, tankFigure);
      svg("path", { d: `M ${x < 300 ? x + 34 : x - 34} 62 H ${x < 300 ? 205 : 395}`, style: `stroke:${color};stroke-width:4` }, tankFigure);
    });
    const texts = [
      `Egy óra alatt az első cső a tartály 1/${a} részét, a második 1/${b} részét tölti meg.`,
      `Ha t óráig folyik mindkettő, az első t/${a}, a második t/${b} részt tölt meg.`,
      `Együtt az egész tartályt (1 egész) töltik meg: (1/${a} + 1/${b}) · t = 1.`,
      `1/${a} + 1/${b} = ${b + a}/${a * b}, ezért t = ${a * b}/${a + b} = ${formatNumber(t)} óra. Ellenőrzés: ${formatNumber(t)} · ${formatNumber(Math.round(rate * 1e6) / 1e6)} = 1, az animációban ekkor lesz tele a tartály. ✓`,
    ];
    const lines = ["egy óra alatt: 1/" + a + " + 1/" + b, `(1/${a} + 1/${b}) · t = 1`, `t = ${formatNumber(t)} óra`];
    tankEquation.replaceChildren(make("span", "", lines.slice(0, Math.min(3, step)).join("\n")));
    tankEquation.style.whiteSpace = "pre-line";
    tankMessage.className = `il-message ${step >= 3 ? "good" : ""}`;
    tankMessage.textContent = texts[step];
    tankNext.disabled = step >= 3;
  }

  const fractionLabel = (n, d) => `${n}/${d}`;

  renderCars();
  renderTank();
  return () => scope.clearAll();
}
