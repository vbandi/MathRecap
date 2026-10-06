import { button, card, controls, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const WIDTH = 600, HEIGHT = 380;
const CENTER = [300, 190], ARM = 168, RING = 122;

const ANGLE_TYPES = [
  { test: (a) => a === 0, name: "nullszög", color: PALETTE.violet, hint: "a két szár egybeesik" },
  { test: (a) => a < 90, name: "hegyes szög", color: PALETTE.green, hint: "kisebb a derékszögnél" },
  { test: (a) => a === 90, name: "derékszög", color: PALETTE.blue, hint: "pontosan negyed fordulat" },
  { test: (a) => a < 180, name: "tompa szög", color: PALETTE.amber, hint: "90° és 180° között" },
  { test: (a) => a === 180, name: "egyenesszög", color: PALETTE.pink, hint: "a két szár egy egyenest alkot" },
  { test: (a) => a < 360, name: "homorú szög", color: PALETTE.red, hint: "180° és 360° között" },
  { test: () => true, name: "teljesszög", color: PALETTE.violet, hint: "egy teljes fordulat" },
];
const typeOf = (degrees) => ANGLE_TYPES.find((type) => type.test(degrees));

function toSvgPoint(figure, event) {
  const point = figure.createSVGPoint();
  point.x = event.clientX; point.y = event.clientY;
  const mapped = point.matrixTransform(figure.getScreenCTM().inverse());
  return [mapped.x, mapped.y];
}

function makeDraggable(figure, handle, onMove) {
  handle.style.cursor = "grab";
  handle.style.touchAction = "none";
  handle.addEventListener("pointerdown", (event) => { handle.setPointerCapture(event.pointerId); event.preventDefault(); });
  handle.addEventListener("pointermove", (event) => {
    if (handle.hasPointerCapture(event.pointerId)) onMove(...toSvgPoint(figure, event));
  });
}

// Point at the given angle (degrees, counter-clockwise from the right) and distance from the vertex.
const polar = (degrees, radius) => [CENTER[0] + radius * Math.cos(degrees * Math.PI / 180), CENTER[1] - radius * Math.sin(degrees * Math.PI / 180)];

function wedgePath(degrees, radius) {
  if (degrees <= 0) return "";
  if (degrees >= 360) return `M ${CENTER[0] + radius} ${CENTER[1]} A ${radius} ${radius} 0 1 0 ${CENTER[0] - radius} ${CENTER[1]} A ${radius} ${radius} 0 1 0 ${CENTER[0] + radius} ${CENTER[1]} Z`;
  const [x, y] = polar(degrees, radius);
  return `M ${CENTER[0]} ${CENTER[1]} L ${CENTER[0] + radius} ${CENTER[1]} A ${radius} ${radius} 0 ${degrees > 180 ? 1 : 0} 0 ${x} ${y} Z`;
}

export function mount(root) {
  const state = { angle: 50, protractor: true, target: null, guess: 90, checked: false };

  root.append(lead("Ha két félegyenes ugyanabból a pontból indul, szöget zár be. A szög azt mutatja, mennyire kell elfordítani az egyik szárat, hogy ráfeküdjön a másikra. A fordulatot fokban (°) mérjük: egy teljes kör 360°."));

  const main = card("Forgasd a szárat");
  const protractorToggle = toggle("Szögmérő", state.protractor, () => { state.protractor = !state.protractor; render(); }, PALETTE.blue);
  const readout = make("div", "il-formula start");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Szög szögmérővel" });
  main.append(controls(protractorToggle), readout, figure, make("p", "il-muted", "Húzd a nagy pontot a csúcs körül. A szögmérőt a vízszintes szárhoz igazítjuk: onnan olvasunk, ahol a 0° van."));

  const wedge = svg("path", {}, figure);
  const protractorLayer = svg("g", {}, figure);
  svg("line", { x1: CENTER[0], y1: CENTER[1], x2: CENTER[0] + ARM, y2: CENTER[1], style: "stroke:var(--fg);stroke-width:3.5;stroke-linecap:round" }, figure);
  const arm = svg("line", { style: "stroke:var(--fg);stroke-width:3.5;stroke-linecap:round" }, figure);
  svg("circle", { cx: CENTER[0], cy: CENTER[1], r: 5, style: "fill:var(--fg)" }, figure);
  svg("text", { x: CENTER[0] - 16, y: CENTER[1] + 20, text: "csúcs", style: "font-size:12px;fill:var(--dim)" }, figure);
  const handle = svg("g", {}, figure);
  svg("circle", { r: 22, fill: "transparent" }, handle);
  const handleDot = svg("circle", { r: 9, style: "stroke:var(--input);stroke-width:3" }, handle);
  const valueLabel = svg("text", { "text-anchor": "middle", style: "font-weight:800;font-size:17px" }, figure);

  for (let degrees = 0; degrees < 360; degrees += 5) {
    const major = degrees % 10 === 0, length = degrees % 30 === 0 ? 14 : major ? 9 : 5;
    const [x1, y1] = polar(degrees, RING), [x2, y2] = polar(degrees, RING - length);
    svg("line", { x1, y1, x2, y2, style: "stroke:var(--dim);stroke-width:1.2" }, protractorLayer);
    if (degrees % 30 === 0) {
      const [tx, ty] = polar(degrees, RING - 28);
      svg("text", { x: tx, y: ty + 4, "text-anchor": "middle", text: `${degrees}`, style: "font-size:11px;fill:var(--dim)" }, protractorLayer);
    }
  }
  svg("circle", { cx: CENTER[0], cy: CENTER[1], r: RING, fill: "none", style: "stroke:var(--dim);stroke-width:1.5" }, protractorLayer);

  makeDraggable(figure, handle, (x, y) => {
    if (state.target) return;
    const raw = (Math.atan2(CENTER[1] - y, x - CENTER[0]) * 180 / Math.PI + 360) % 360;
    let next = Math.round(raw) % 360;
    if (Math.abs(next - state.angle) > 180) next = state.angle > 180 ? 360 : 0; // do not jump across 0°/360°
    state.angle = next;
    render();
  });

  // --- Legend ---
  const legend = make("div");
  legend.style.cssText = "display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:10px;font-size:13px";
  const legendItems = ANGLE_TYPES.map((type) => {
    const item = make("span", "", `● ${type.name}`);
    item.style.cssText = `color:${type.color};white-space:nowrap`;
    legend.append(item);
    return item;
  });
  main.append(legend);

  // --- Estimation challenge ---
  const challenge = card("Kihívás: becsüld meg a szöget");
  const guess = range({ label: "A te tipped", min: 0, max: 360, step: 5, value: state.guess, format: (v) => `${v}°`, onInput: (value) => { state.guess = value; state.checked = false; render(); } });
  const startButton = button("Új feladvány", () => {
    do state.target = 5 * (2 + Math.floor(Math.random() * 68)); while (state.target === 90 || state.target === 180);
    state.checked = false; state.protractor = false; render();
  });
  const checkButton = button("Ellenőrzöm", () => { state.checked = true; render(); }, { ghost: true });
  const stopButton = button("Vissza a szabad forgatáshoz", () => { state.target = null; state.checked = false; render(); }, { ghost: true });
  const message = make("p", "il-message");
  challenge.append(make("p", "", "A program megmutat egy szöget szögmérő nélkül. Becsüld meg fokban, aztán nézd meg, mennyit tévedtél."),
    controls(startButton, guess.element, checkButton, stopButton), message);

  root.append(main, challenge, keyIdea("a szöget a szárak közötti elfordulás nagyságával mérjük. 90° a derékszög, ennél kisebb a hegyes, nagyobb (180°-ig) a tompa szög; 180° az egyenesszög, e fölött 360°-ig a homorú szög."));

  function render() {
    const inChallenge = state.target !== null;
    const degrees = inChallenge ? state.target : state.angle;
    const type = typeOf(degrees);
    const color = inChallenge && !state.checked ? PALETTE.amber : type.color;
    const [x, y] = polar(degrees, ARM);
    arm.setAttribute("x1", CENTER[0]); arm.setAttribute("y1", CENTER[1]); arm.setAttribute("x2", x); arm.setAttribute("y2", y);
    wedge.setAttribute("d", wedgePath(degrees, 62));
    wedge.style.cssText = `fill:${color};fill-opacity:.35;stroke:${color};stroke-width:2`;
    handle.setAttribute("transform", `translate(${x} ${y})`);
    handle.style.display = inChallenge ? "none" : "";
    handleDot.style.fill = color;
    protractorLayer.setAttribute("opacity", state.protractor ? 1 : 0);
    protractorToggle.setAttribute("aria-pressed", String(state.protractor));
    const [lx, ly] = polar(degrees / 2, 40);
    valueLabel.setAttribute("x", degrees >= 360 || degrees === 0 ? CENTER[0] + 30 : lx);
    valueLabel.setAttribute("y", degrees >= 360 || degrees === 0 ? CENTER[1] - 30 : ly + 6);
    valueLabel.textContent = inChallenge && !state.checked ? "?" : `${degrees}°`;
    valueLabel.style.fill = color;

    readout.replaceChildren("Szög: ", slot(inChallenge && !state.checked ? "?" : `${degrees}°`, 5), " → ",
      slot(make("b", "", inChallenge && !state.checked ? "—" : type.name), 14, { align: "left" }),
      slot(inChallenge && !state.checked ? "" : `(${type.hint})`, 30, { align: "left" }));
    legendItems.forEach((item, index) => { item.style.fontWeight = ANGLE_TYPES[index] === type && !(inChallenge && !state.checked) ? 800 : 400; item.style.opacity = ANGLE_TYPES[index] === type && !(inChallenge && !state.checked) ? 1 : 0.6; });

    guess.input.disabled = !inChallenge;
    checkButton.disabled = !inChallenge || state.checked;
    stopButton.disabled = !inChallenge;
    guess.set(state.guess);
    if (!inChallenge) { message.className = "il-message"; message.textContent = ""; return; }
    if (!state.checked) { message.className = "il-message"; message.textContent = "Mekkora a narancssárga szög? Állítsd be a tippedet a csúszkával, majd kattints az Ellenőrzöm gombra."; return; }
    const error = Math.abs(state.guess - state.target);
    message.className = `il-message ${error <= 10 ? "good" : "warn"}`;
    message.textContent = error === 0 ? `Pontos! A szög ${state.target}° (${type.name}).`
      : `A szög ${state.target}° (${type.name}), a tipped és a valódi szög különbsége ${error}°. ${error <= 10 ? "Nagyon jó becslés!" : "Próbáld újra egy új feladvánnyal."}`;
  }

  render();
  return () => {};
}
