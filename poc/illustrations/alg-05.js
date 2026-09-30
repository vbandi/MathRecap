import { card, controls, createScope, equation, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle } from "./kit.js";

const WORK = 24; // worker-days needed for the whole job
const WORKERS = [1, 2, 3, 4, 6, 8, 12, 24];
const DIRECT_DAYS = 3;
const ORIGIN = { x: 76, y: 232 }, WIDTH_UNIT = 17, HEIGHT_UNIT = 8.5;

export function mount(root) {
  const scope = createScope();
  const state = { index: 3, mode: "inverse" };
  const shown = { workers: WORKERS[state.index], days: WORK / WORKERS[state.index] };
  let animationId = null;

  root.append(lead("Két mennyiség fordítottan arányos, ha az egyik többszörösére a másik ugyanannyiad részére csökken. Ha egy munkát több ember végez, kevesebb idő kell hozzá — de a teljes munka ugyanakkora marad."));

  const main = card("Munkások és napok");
  const modePicker = controls(
    toggle("Fordított arányosság: ugyanaz a munka", true, () => setMode("inverse"), PALETTE.blue),
    toggle("Egyenes arányosság: ugyanannyi nap", false, () => setMode("direct"), PALETTE.green),
  );
  const slider = range({ label: "Munkások száma", min: 0, max: WORKERS.length - 1, step: 1, value: state.index, format: (v) => String(WORKERS[v]), onInput: (v) => { state.index = v; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 260", role: "img" });
  const relation = make("div");
  const table = make("table", "il-table");
  const message = make("p", "il-message");
  main.append(modePicker, controls(slider.element), figure, relation, table, message);
  root.append(main, keyIdea("fordított arányosságnál a két mennyiség szorzata állandó (itt munkások · napok = 24), ezért a téglalap területe nem változik, csak az alakja. Egyenes arányosságnál a hányados állandó."));

  function setMode(mode) {
    state.mode = mode;
    modePicker.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String((i === 0) === (mode === "inverse"))));
    render();
  }

  function draw() {
    const { workers, days } = shown;
    const direct = state.mode === "direct";
    const heightUnit = direct ? 22 : HEIGHT_UNIT;
    figure.replaceChildren();
    const width = workers * WIDTH_UNIT, height = days * heightUnit;
    const top = ORIGIN.y - height;
    svg("rect", { x: ORIGIN.x, y: top, width, height, style: `fill:${direct ? PALETTE.green : PALETTE.blue};fill-opacity:.85;stroke:var(--fg-soft);stroke-width:2` }, figure);
    for (let i = 1; i < workers; i++) {
      const x = ORIGIN.x + i * WIDTH_UNIT;
      if (x < ORIGIN.x + width) svg("line", { x1: x, x2: x, y1: top, y2: ORIGIN.y, style: "stroke:var(--input);stroke-width:1;opacity:.6" }, figure);
    }
    for (let j = 1; j < days; j++) {
      const y = ORIGIN.y - j * heightUnit;
      if (y > top) svg("line", { x1: ORIGIN.x, x2: ORIGIN.x + width, y1: y, y2: y, style: "stroke:var(--input);stroke-width:1;opacity:.6" }, figure);
    }
    svg("line", { x1: ORIGIN.x, x2: 590, y1: ORIGIN.y, y2: ORIGIN.y, class: "axis" }, figure);
    svg("line", { x1: ORIGIN.x, x2: ORIGIN.x, y1: 10, y2: ORIGIN.y, class: "axis" }, figure);
    svg("text", { x: ORIGIN.x + width / 2, y: ORIGIN.y + 20, "text-anchor": "middle", text: `${Math.round(workers)} munkás`, style: "font-weight:700" }, figure);
    svg("text", { x: ORIGIN.x - 6, y: top + 5, "text-anchor": "end", text: `${+days.toFixed(1)} nap`.replace(".", ","), style: "font-weight:700" }, figure);
    const area = direct ? workers * DIRECT_DAYS : WORK;
    if (width > 60 && height > 28) svg("text", { x: ORIGIN.x + width / 2, y: top + height / 2 + 5, "text-anchor": "middle", text: direct ? `munka: ${Math.round(area)}` : `terület: ${WORK}`, style: "fill:#fff;font-weight:700;font-size:16px" }, figure);
  }

  function animateTo(workers, days) {
    if (animationId !== null) cancelAnimationFrame(animationId);
    const from = { ...shown }, start = performance.now(), duration = 450;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration), ease = t * t * (3 - 2 * t);
      shown.workers = from.workers + (workers - from.workers) * ease;
      shown.days = from.days + (days - from.days) * ease;
      draw();
      animationId = t < 1 ? scope.frame(tick) : null;
    };
    animationId = scope.frame(tick);
  }

  function render() {
    const workers = WORKERS[state.index], direct = state.mode === "direct";
    const days = direct ? DIRECT_DAYS : WORK / workers;
    animateTo(workers, days);
    const row = (heading, values) => {
      const tr = make("tr");
      tr.append(make("th", "", heading), ...values.map((v, i) => { const td = make("td", "", String(v)); if (i === state.index) td.style.cssText = "color:var(--accent);font-weight:700"; return td; }));
      return tr;
    };
    if (direct) {
      table.replaceChildren(row("munkások", WORKERS), row("munka", WORKERS.map((w) => w * DIRECT_DAYS)), row("munka : munkások", WORKERS.map(() => DIRECT_DAYS)));
      relation.replaceChildren(equation(rich(slot(workers, 2), " munkás"), rich(slot(workers * DIRECT_DAYS, 3, { align: "left" }), " munka"), "→"));
      message.textContent = `Ugyanannyi nap alatt kétszer annyi munkás kétszer annyi munkát végez el. A hányados (munka : munkások = ${DIRECT_DAYS}) állandó: ez az egyenes arányosság.`;
    } else {
      table.replaceChildren(row("munkások", WORKERS), row("napok", WORKERS.map((w) => WORK / w)), row("munkások · napok", WORKERS.map(() => WORK)));
      relation.replaceChildren(equation(rich(slot(workers, 2), " munkás"), rich(slot(WORK / workers, 3, { align: "left" }), " nap"), "·"));
      message.textContent = `${workers} munkás ${WORK / workers} nap alatt végez: ${workers} · ${WORK / workers} = ${WORK}. Kétszer annyi munkás feleannyi idő alatt végez, a szorzat állandó: ez a fordított arányosság.`;
    }
  }

  draw();
  render();
  return () => { scope.clearAll(); };
}
