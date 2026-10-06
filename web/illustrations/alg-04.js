import { card, controls, createScope, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle } from "./kit.js";

// Each system lists units from the largest to the smallest; `steps` are the multipliers
// (as powers of ten) when going to the next smaller unit.
const SYSTEMS = {
  length: { name: "Hosszúság", units: ["km", "m", "dm", "cm", "mm"], steps: [3, 1, 1, 1], color: PALETTE.blue },
  area: { name: "Terület", units: ["m²", "dm²", "cm²", "mm²"], steps: [2, 2, 2], color: PALETTE.green },
  volume: { name: "Térfogat", units: ["m³", "dm³", "cm³", "mm³"], steps: [3, 3, 3], color: PALETTE.violet },
};

// Moves the decimal comma of the number digits/10^decimals by `shift` places (positive: to the right).
function shiftDecimal(digits, decimals, shift) {
  let whole = digits, fraction = decimals;
  fraction -= shift;
  if (fraction < 0) { whole += "0".repeat(-fraction); fraction = 0; }
  let text = whole.padStart(fraction + 1, "0");
  const integerPart = text.slice(0, text.length - fraction).replace(/^0+(?=\d)/, "");
  const fractionPart = text.slice(text.length - fraction).replace(/0+$/, "");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return fractionPart ? `${grouped},${fractionPart}` : grouped;
}

export function mount(root) {
  const scope = createScope();
  const state = { system: "length", from: 1, to: 3, tenths: 35, layers: 4 };

  root.append(lead("Ugyanazt a mennyiséget többféle mértékegységgel is kifejezhetjük. Ha kisebb egységre váltasz, több darab kell belőle, ezért a szám nagyobb lesz. Nagyobb egységre váltva a szám kisebb lesz."));

  const converter = card("Mértékegység-átváltó");
  const systemPicker = controls(...Object.entries(SYSTEMS).map(([key, system]) => toggle(system.name, key === state.system, () => { state.system = key; state.from = 1; state.to = SYSTEMS[key].units.length - 1; render(); }, system.color)));
  const valueSlider = range({ label: "Érték", min: 1, max: 999, step: 1, value: state.tenths, format: (v) => String(v / 10).replace(".", ","), onInput: (v) => { state.tenths = v; render(); } });
  const fromPicker = make("div", "il-controls");
  const toPicker = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 200", role: "img" });
  const resultLine = make("div", "il-formula");
  const message = make("p", "il-message");
  converter.append(systemPicker, controls(valueSlider.element), make("p", "il-muted", "Ebből a mértékegységből:"), fromPicker, make("p", "il-muted", "Ebbe:"), toPicker, figure, resultLine, message);

  const cube = card("1 dm³ = 1 liter = 1000 cm³");
  const layerSlider = range({ label: "Megtöltött rétegek", min: 0, max: 10, step: 1, value: state.layers, onInput: (v) => { state.layers = v; renderCube(); } });
  const cubeFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 290", role: "img", "aria-label": "Egy 1 dm élű kocka, amit 10 × 10 × 10 darab 1 cm élű kocka tölt ki" });
  const cubeLine = make("div", "il-formula start");
  cube.append(make("p", "", "Egy 1 dm élű kocka éle 10 cm. Egy rétegben 10 · 10 = 100 darab 1 cm³-es kocka fér el, és 10 réteg van."), controls(layerSlider.element), cubeFigure, cubeLine);

  root.append(converter, cube, keyIdea("a szomszédos mértékegységek között hosszúságnál 10, területnél 100, térfogatnál 1000 az átváltószám (a kilométer és a méter között hosszúságnál 1000). Átváltáskor nem kell számolni: a tizedesvessző ugrik annyit, ahány nullát az átváltószám tartalmaz."));

  function render() {
    const system = SYSTEMS[state.system];
    state.from = Math.min(state.from, system.units.length - 1);
    state.to = Math.min(state.to, system.units.length - 1);
    systemPicker.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(Object.keys(SYSTEMS)[i] === state.system)));
    const pickers = [[fromPicker, "from"], [toPicker, "to"]];
    for (const [container, key] of pickers) {
      container.replaceChildren(...system.units.map((unit, index) => toggle(unit, state[key] === index, () => { state[key] = index; render(); }, system.color)));
    }
    const { from, to } = state;
    // Power of ten between the two units: positive when going to a smaller unit.
    const sumSteps = (a, b) => system.steps.slice(a, b).reduce((sum, v) => sum + v, 0);
    const shift = from <= to ? sumSteps(from, to) : -sumSteps(to, from);
    const digits = String(state.tenths), decimals = 1;
    const valueText = String(state.tenths / 10).replace(".", ",");
    const resultText = shiftDecimal(digits, decimals, shift);

    figure.replaceChildren();
    const boxWidth = 88, gap = (560 - system.units.length * boxWidth) / (system.units.length - 1);
    const pos = (index) => ({ x: 20 + index * (boxWidth + gap), y: 18 + index * 26 });
    system.units.forEach((unit, index) => {
      const { x, y } = pos(index);
      const active = index === from || index === to;
      svg("rect", { x, y, width: boxWidth, height: 44, rx: 8, style: `fill:var(--surface);stroke:${active ? system.color : "var(--line-strong)"};stroke-width:${active ? 3 : 1.5}` }, figure);
      svg("text", { x: x + boxWidth / 2, y: y + 29, "text-anchor": "middle", text: unit, style: `font-weight:700;font-size:18px;fill:${active ? "var(--fg)" : "var(--fg-soft)"}` }, figure);
      if (index < system.units.length - 1) {
        const next = pos(index + 1);
        const inPath = Math.min(from, to) <= index && index < Math.max(from, to);
        const mx = (x + boxWidth + next.x) / 2;
        svg("path", { d: `M ${x + boxWidth + 4} ${y + 22} H ${next.x + boxWidth / 2} V ${next.y - 4}`, fill: "none", style: `stroke:${inPath ? PALETTE.pink : "var(--line-strong)"};stroke-width:${inPath ? 3 : 1.5}` }, figure);
        svg("text", { x: mx + 4, y: y + 16, "text-anchor": "middle", text: `· ${10 ** system.steps[index]}`, style: `font-size:13px;fill:${inPath ? PALETTE.pink : "var(--dim)"};font-weight:${inPath ? 700 : 400}` }, figure);
      }
    });
    svg("text", { x: 590, y: 192, "text-anchor": "end", text: "egyre kisebb egységek, egyre nagyobb számok →", style: "fill:var(--dim);font-size:12px" }, figure);

    const fromUnit = system.units[from], toUnit = system.units[to];
    resultLine.replaceChildren(rich(slot(valueText, 8), ` ${fromUnit} = `, slot(resultText, 19, { align: "left" }), ` ${toUnit}`));
    if (shift === 0) message.textContent = "Ugyanaz a mértékegység, a szám nem változik.";
    else {
      const places = Math.abs(shift);
      message.textContent = `A tizedesvessző ${places} hellyel ${shift > 0 ? "jobbra" : "balra"} lép (az átváltószám ${10 ** places}), mert ${shift > 0 ? `a ${toUnit} kisebb egység, mint a ${fromUnit}, ezért több kell belőle` : `a ${toUnit} nagyobb egység, mint a ${fromUnit}, ezért kevesebb kell belőle`}.`;
    }
  }

  function renderCube() {
    const { layers } = state;
    const size = 200, depth = 7, left = 30, top = 70;
    cubeFigure.replaceChildren();
    for (let layer = 9; layer >= 0; layer--) {
      const filled = layer < layers;
      const x = left + layer * depth, y = top - layer * depth;
      svg("rect", { x, y, width: size, height: size, rx: 2, style: `fill:${filled ? PALETTE.violet : "var(--surface)"};fill-opacity:${filled ? 0.85 : 0.35};stroke:${filled ? "var(--input)" : "var(--line-strong)"};stroke-width:1.5` }, cubeFigure);
    }
    if (layers > 0) {
      for (let i = 1; i < 10; i++) {
        const offset = (size / 10) * i;
        svg("line", { x1: left + offset, x2: left + offset, y1: top, y2: top + size, style: "stroke:var(--input);stroke-width:1" }, cubeFigure);
        svg("line", { x1: left, x2: left + size, y1: top + offset, y2: top + offset, style: "stroke:var(--input);stroke-width:1" }, cubeFigure);
      }
    }
    svg("text", { x: left + size / 2, y: top + size + 22, "text-anchor": "middle", text: "10 cm", style: "font-weight:700" }, cubeFigure);
    const count = layers * 100;
    const lines = [["egy réteg: 100 cm³", false], [`${layers} réteg: ${count} cm³`, true], [`${count} cm³ = ${String(count / 1000).replace(".", ",")} dm³ = ${String(count / 1000).replace(".", ",")} liter`, true]];
    lines.forEach(([text, strong], index) => svg("text", { x: 340, y: 110 + index * 34, text, style: `font-size:16px;font-weight:${strong ? 700 : 400};fill:${strong ? "var(--fg)" : "var(--fg-soft)"}` }, cubeFigure));
    cubeLine.textContent = layers === 10 ? "Tele a kocka: 10 · 10 · 10 = 1000 cm³ = 1 dm³ = 1 liter." : "Húzd jobbra a csúszkát, amíg tele nem lesz a kocka!";
  }

  render();
  renderCube();
  return () => scope.clearAll();
}
