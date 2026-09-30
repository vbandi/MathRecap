import { button, card, controls, createScope, equation, formatNumber, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle } from "./kit.js";

const BAR = { left: 20, width: 560 };
const signed = (value) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value))}`;
const approx = (value) => (Number.isInteger(Number(value.toFixed(6))) ? "=" : "≈");

export function mount(root) {
  const scope = createScope();
  const state = { unknown: "value", base: 200, rate: 25, value: 50, from: 20, to: 25, start: 100, first: 10, second: -10, shown: 3 };

  root.append(lead("A százalékszámításban mindig három adat szerepel: az alap (ez az egész, vagyis a 100 %), a százalékláb (hány százalékot veszünk) és a százalékérték (ennyi lesz belőle). Ha kettőt ismersz, a harmadikat ki tudod számolni."));

  // --- Three quantities on one bar ---
  const main = card("Alap, százalékláb, érték");
  const picker = controls(
    make("span", "il-muted", "Mi a keresett?"),
    ...[["value", "Érték"], ["base", "Alap"], ["rate", "Százalékláb"]].map(([key, label]) => toggle(label, key === state.unknown, () => { state.unknown = key; render(); })),
  );
  const baseSlider = range({ label: "Alap", min: 20, max: 400, step: 20, value: state.base, onInput: (v) => { state.base = v; render(); } });
  const rateSlider = range({ label: "Százalékláb", min: 5, max: 100, step: 5, value: state.rate, format: (v) => `${v} %`, onInput: (v) => { state.rate = v; render(); } });
  const valueSlider = range({ label: "Érték", min: 1, max: 400, step: 1, value: state.value, onInput: (v) => { state.value = v; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 150", role: "img" });
  const formulaLine = make("div", "il-formula");
  const message = make("p", "il-message");
  main.append(picker, controls(baseSlider.element, rateSlider.element, valueSlider.element), figure, formulaLine, message);

  // --- Percentage points vs percent ---
  const points = card("Százalékpont és százalék");
  const fromSlider = range({ label: "Régi arány", min: 5, max: 95, step: 5, value: state.from, format: (v) => `${v} %`, onInput: (v) => { state.from = v; renderPoints(); } });
  const toSlider = range({ label: "Új arány", min: 5, max: 95, step: 5, value: state.to, format: (v) => `${v} %`, onInput: (v) => { state.to = v; renderPoints(); } });
  const pointsFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 110", role: "img" });
  const pointsMessage = make("p", "il-message");
  points.append(controls(fromSlider.element, toSlider.element), pointsFigure, pointsMessage);

  // --- Successive changes ---
  const chain = card("Egymás utáni változások");
  const startSlider = range({ label: "Kiindulás", min: 50, max: 200, step: 10, value: state.start, onInput: (v) => { state.start = v; state.shown = 3; renderChain(); } });
  const firstSlider = range({ label: "Első változás", min: -50, max: 50, step: 5, value: state.first, format: (v) => `${signed(v)} %`, onInput: (v) => { state.first = v; state.shown = 3; renderChain(); } });
  const secondSlider = range({ label: "Második változás", min: -50, max: 50, step: 5, value: state.second, format: (v) => `${signed(v)} %`, onInput: (v) => { state.second = v; state.shown = 3; renderChain(); } });
  const chainFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 180", role: "img" });
  const playButton = button("Lejátszás", play, { ghost: true });
  const chainMessage = make("p", "il-message");
  chain.append(controls(startSlider.element, firstSlider.element, secondSlider.element, playButton), chainFigure, chainMessage);

  root.append(main, points, chain, keyIdea("a százalékláb mindig valamilyen alapra vonatkozik: érték = alap · százalékláb / 100. Ha az alap megváltozik, ugyanaz a százalék más mennyiséget jelent, ezért a +10 % utáni −10 % már nem ugyanarra az alapra vonatkozik, és nem hozza vissza a kezdőértéket."));

  function render() {
    const { unknown } = state;
    picker.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(["value", "base", "rate"][i] === unknown)));
    for (const [slider, key] of [[baseSlider, "base"], [rateSlider, "rate"], [valueSlider, "value"]]) {
      slider.input.disabled = unknown === key;
      slider.element.style.opacity = unknown === key ? 0.35 : 1;
    }
    let { base, rate, value } = state;
    if (unknown === "value") value = (base * rate) / 100;
    if (unknown === "base") base = (value * 100) / rate;
    if (unknown === "rate") { value = Math.min(value, base); rate = (value / base) * 100; }
    valueSlider.input.max = unknown === "rate" ? base : 400;
    const rateText = `${formatNumber(rate)} %`;

    figure.replaceChildren();
    svg("rect", { x: BAR.left, y: 50, width: BAR.width, height: 40, rx: 6, style: `fill:var(--surface);stroke:${PALETTE.blue};stroke-width:2` }, figure);
    svg("rect", { x: BAR.left, y: 50, width: (BAR.width * rate) / 100, height: 40, rx: 6, style: `fill:${PALETTE.green};fill-opacity:.9` }, figure);
    for (let i = 1; i < 100; i++) svg("line", { x1: BAR.left + (BAR.width * i) / 100, x2: BAR.left + (BAR.width * i) / 100, y1: i % 10 ? 76 : 62, y2: 90, style: "stroke:var(--input);stroke-width:1" }, figure);
    const bracket = (x1, x2, y, up) => svg("path", { d: `M ${x1} ${y + (up ? 6 : -6)} V ${y} H ${x2} V ${y + (up ? 6 : -6)}`, fill: "none", style: "stroke:var(--fg-soft);stroke-width:1.5" }, figure);
    bracket(BAR.left, BAR.left + BAR.width, 36, true);
    svg("text", { x: BAR.left + BAR.width / 2, y: 26, "text-anchor": "middle", text: `alap = ${unknown === "base" ? "?" : formatNumber(base)}  (100 %)`, style: `fill:${PALETTE.blue};font-weight:700;font-size:15px` }, figure);
    const shadedWidth = (BAR.width * rate) / 100;
    bracket(BAR.left, BAR.left + shadedWidth, 104, false);
    svg("text", { x: BAR.left + Math.max(shadedWidth / 2, 80), y: 128, "text-anchor": shadedWidth < 160 ? "start" : "middle", text: `érték = ${unknown === "value" ? "?" : formatNumber(value)}   százalékláb = ${unknown === "rate" ? "?" : rateText}`, style: `fill:${PALETTE.green};font-weight:700;font-size:15px` }, figure);

    const eq = unknown === "value" ? "=" : approx(unknown === "base" ? base : rate);
    formulaLine.replaceChildren(equation("érték", rich("alap · ", slot(formatNumber(rate), 5, { align: "left" }), " / 100")));
    message.className = "il-message good";
    message.textContent = {
      value: `${formatNumber(rate)} % az alapból (${formatNumber(base)}): ${formatNumber(base)} · ${formatNumber(rate)} / 100 = ${formatNumber(value)}.`,
      base: `Ha ${formatNumber(value)} a ${formatNumber(rate)} %, akkor 1 % = ${formatNumber(value)} : ${formatNumber(rate)}, az egész (100 %) pedig ${formatNumber(value)} · 100 / ${formatNumber(rate)} ${eq} ${formatNumber(base)}.`,
      rate: `Az érték (${formatNumber(value)}) az alapnak (${formatNumber(base)}) ennyi százaléka: ${formatNumber(value)} / ${formatNumber(base)} · 100 ${eq} ${rateText}.`,
    }[unknown];
  }

  function renderPoints() {
    const { from, to } = state;
    const diff = to - from, relative = (diff / from) * 100;
    pointsFigure.replaceChildren();
    [["régi", from, 16], ["új", to, 62]].forEach(([name, p, y]) => {
      svg("rect", { x: 70, y, width: 500, height: 28, rx: 5, style: "fill:var(--surface);stroke:var(--line-strong)" }, pointsFigure);
      svg("rect", { x: 70, y, width: 5 * p, height: 28, rx: 5, style: `fill:${name === "régi" ? PALETTE.blue : PALETTE.green}` }, pointsFigure);
      svg("text", { x: 62, y: y + 19, "text-anchor": "end", text: name, style: "font-weight:700" }, pointsFigure);
      svg("text", { x: 70 + 5 * p - 8, y: y + 19, "text-anchor": "end", text: `${p} %`, style: "fill:#fff;font-weight:700" }, pointsFigure);
    });
    if (diff !== 0) svg("rect", { x: 70 + 5 * Math.min(from, to), y: 62, width: 5 * Math.abs(diff), height: 28, rx: 3, style: `fill:${PALETTE.amber};opacity:${diff > 0 ? 1 : 0.6}` }, pointsFigure);
    pointsMessage.textContent = diff === 0
      ? "Nem változott az arány."
      : `${from} %-ról ${to} %-ra ${diff > 0 ? "nőtt" : "csökkent"}: ez ${formatNumber(Math.abs(diff))} százalékpont különbség, de a régi értékhez képest ${formatNumber(Math.abs(relative))} %-os ${diff > 0 ? "növekedés" : "csökkenés"} (${formatNumber(Math.abs(diff))} : ${from} · 100).`;
  }

  function renderChain() {
    const { start, first, second, shown } = state;
    const one = start * (1 + first / 100), two = one * (1 + second / 100);
    const maxValue = Math.max(start, one, two, 1) * 1.05;
    chainFigure.replaceChildren();
    const rows = [["kezdet", start, PALETTE.blue], [`${signed(first)} %`, one, PALETTE.green], [`${signed(second)} %`, two, PALETTE.amber]];
    rows.forEach(([name, value, color], index) => {
      const y = 12 + index * 52;
      const group = svg("g", { class: "il-fade", opacity: index < shown ? 1 : 0 }, chainFigure);
      svg("text", { x: 10, y: y + 26, text: name, style: "font-weight:700" }, group);
      svg("rect", { x: 80, y, width: Math.max(2, (480 * value) / maxValue), height: 38, rx: 5, style: `fill:${color}` }, group);
      svg("text", { x: 80 + (480 * value) / maxValue - 8, y: y + 25, "text-anchor": "end", text: formatNumber(value), style: "fill:#fff;font-weight:700;font-size:15px" }, group);
    });
    svg("line", { x1: 80 + (480 * start) / maxValue, x2: 80 + (480 * start) / maxValue, y1: 4, y2: 172, style: "stroke:var(--fg-soft);stroke-dasharray:5 4" }, chainFigure);
    const net = (two / start - 1) * 100;
    chainMessage.className = `il-message ${Math.abs(net) > 1e-9 && shown >= 3 ? "warn" : ""}`;
    chainMessage.textContent = shown < 3 ? "A második változás már az új értékre vonatkozik, nem a kezdőértékre."
      : Math.abs(net) < 1e-9 ? `${signed(first)} %, majd ${signed(second)} % után visszaértünk a kezdőértékhez.`
      : `${signed(first)} %, majd ${signed(second)} % után ${formatNumber(two)} lett, vagyis összesen ${signed(net)} % a változás a kezdőértékhez képest, nem 0 %.`;
  }

  function play() {
    scope.clearAll();
    playButton.disabled = true;
    state.shown = 1;
    renderChain();
    scope.timeout(() => { state.shown = 2; renderChain(); }, 900);
    scope.timeout(() => { state.shown = 3; renderChain(); playButton.disabled = false; }, 1900);
  }

  render();
  renderPoints();
  renderChain();
  return () => scope.clearAll();
}
