import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

const RULES = [
  { key: "double", formula: "y = 2x", f: (x) => 2 * x, xMax: 6, yMax: 12, yStep: 2, xUnit: "perc", yUnit: "liter", story: "Kádat töltesz: percenként 2 liter víz folyik bele." },
  { key: "square", formula: "y = x²", f: (x) => x * x, xMax: 5, yMax: 25, yStep: 5, xUnit: "cm", yUnit: "cm²", story: "Egy négyzet oldala x centiméter, y a területe." },
  { key: "rest", formula: "y = 10 − x", f: (x) => 10 - x, xMax: 10, yMax: 10, yStep: 2, xUnit: "perc", yUnit: "liter", story: "Egy 10 literes kulacsból percenként 1 liter víz folyik ki." },
];

const GX = 250, GY = 20, GW = 320, GH = 250; // graph box inside the 600 x 320 view

export function mount(root) {
  const scope = createScope();
  const state = { rule: 0, x: 0, connected: false, hidden: false, secret: 0, playing: false };
  const rule = () => RULES[state.hidden ? state.secret : state.rule];

  root.append(lead("Egy függvény értékeit táblázatba lehet írni, a táblázat sorait pedig pontokként ábrázolni. Ha sok pontot felveszel, és összekötöd őket, megkapod a függvény grafikonját."));

  const main = card("Teljen az idő");
  const ruleRow = make("div", "il-controls");
  const story = make("p");
  const clock = range({ label: "x (idő / méret)", min: 0, max: 6, value: 0, format: (v) => String(v), onInput: (v) => { stop(); state.x = v; render(); } });
  const playButton = button("Indítsd el", play);
  const connectButton = toggle("Kösd össze a pontokat", false, () => { state.connected = !state.connected; render(); });
  const tableBox = make("div");
  tableBox.style.overflowX = "auto";
  const table = make("table", "il-table");
  tableBox.append(table);
  const message = make("p", "il-message");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 320", role: "img" });
  const view = svg("g", {}, figure);
  main.append(ruleRow, story, controls(clock.element, playButton, connectButton, button("Találd ki a szabályt", startGuess, { ghost: true })), tableBox, figure, message);
  root.append(main, keyIdea("a táblázat minden oszlopa egy pont a grafikonon: az x megmondja, milyen messze van jobbra, az y pedig azt, milyen magasan. A grafikon a végtelen sok pont összekötve — a szabály alakját mutatja."));

  const gx = (x) => GX + (x / rule().xMax) * GW;
  const gy = (y) => GY + GH - (y / rule().yMax) * GH;

  function stop() { state.playing = false; scope.clearAll(); playButton.textContent = state.x >= rule().xMax ? "Újra" : "Indítsd el"; }

  function play() {
    if (state.playing) return stop();
    if (state.x >= rule().xMax) state.x = 0;
    state.playing = true;
    playButton.textContent = "Megállít";
    const tick = () => {
      if (!state.playing) return;
      if (state.x >= rule().xMax) return stop();
      state.x += 1;
      render();
      scope.timeout(tick, 700);
    };
    scope.timeout(tick, 400);
    render();
  }

  function selectRule(index) {
    stop();
    if (state.hidden) return guess(index);
    state.rule = index; state.x = 0; state.connected = false;
    message.textContent = ""; message.className = "il-message";
    render();
  }

  function startGuess() {
    stop();
    state.hidden = true; state.secret = Math.floor(Math.random() * RULES.length); state.x = 0; state.connected = false;
    message.className = "il-message";
    message.textContent = "A szabályt elrejtettük. Állítsd az idővel végig az értékeket, nézd a táblázatot és a grafikont, aztán válaszd ki a szabályt!";
    render();
  }

  function guess(index) {
    const secret = RULES[state.secret], picked = RULES[index];
    if (index === state.secret) {
      state.hidden = false; state.rule = index; state.connected = true; state.x = secret.xMax;
      message.className = "il-message good";
      message.textContent = `Eltaláltad: ${secret.formula}.`;
    } else {
      const known = Math.min(state.x, secret.xMax);
      message.className = "il-message warn";
      message.textContent = state.x === 0
        ? "Még nincs mit összehasonlítani: állítsd az x-et legalább 2-re, és nézd meg a táblázatot."
        : `Nem ez. Ha ${picked.formula} lenne a szabály, akkor x = ${known} mellett y = ${formatNumber(picked.f(known))} állna a táblázatban, de ott ${formatNumber(secret.f(known))} van.`;
    }
    render();
  }

  function picture(current) {
    const y = current.f(state.x);
    const base = svg("g", {}, view);
    if (current.key === "double" || current.key === "rest") {
      const full = current.key === "double" ? 12 : 10, height = (y / full) * 170;
      const top = 70, bottom = 250, left = current.key === "double" ? 20 : 60, width = current.key === "double" ? 190 : 100;
      svg("rect", { x: left + 2, y: bottom - height, width: width - 4, height, style: `fill:${PALETTE.blue};opacity:.75` }, base);
      svg("path", { d: `M ${left} ${top} V ${bottom} H ${left + width} V ${top}`, fill: "none", style: "stroke:var(--fg-soft);stroke-width:3" }, base);
    } else {
      const side = state.x * 34;
      svg("rect", { x: 30, y: 250 - side, width: side, height: side, style: `fill:${PALETTE.green};opacity:.75;stroke:var(--fg-soft);stroke-width:2` }, base);
    }
    svg("text", { x: 110, y: 290, "text-anchor": "middle", text: `x = ${state.x} ${current.xUnit}, y = ${formatNumber(y)} ${current.yUnit}`, style: "fill:var(--fg);font-weight:600" }, base);
  }

  function render() {
    const current = rule();
    if (clock.input.max !== String(current.xMax)) clock.input.max = current.xMax;
    clock.set(state.x);
    connectButton.setAttribute("aria-pressed", String(state.connected));
    ruleRow.replaceChildren(...RULES.map((option, index) => toggle(option.formula, !state.hidden && index === state.rule, () => selectRule(index))));
    story.textContent = state.hidden ? "Titkos szabály — ki kell találnod." : current.story;
    playButton.textContent = state.playing ? "Megállít" : state.x >= current.xMax ? "Újra" : "Indítsd el";

    const row = (heading, cell) => {
      const tr = make("tr");
      tr.append(make("th", "", heading));
      for (let x = 0; x <= current.xMax; x++) tr.append(make("td", "", cell(x)));
      return tr;
    };
    const cells = [row("x", (x) => String(x)), row("y", (x) => (x <= state.x ? formatNumber(current.f(x)) : "?"))];
    table.replaceChildren(...cells);
    [...cells[0].children].slice(1).forEach((td, x) => { if (x === state.x) { td.style.color = "var(--accent)"; cells[1].children[x + 1].style.color = "var(--accent)"; } });

    view.replaceChildren();
    if (!state.hidden) picture(current);
    for (let v = 0; v <= current.xMax; v++) {
      svg("line", { x1: gx(v), x2: gx(v), y1: GY, y2: GY + GH, class: v ? "grid" : "axis" }, view);
      svg("text", { x: gx(v), y: GY + GH + 16, "text-anchor": "middle", text: String(v), style: "font-size:11px;fill:var(--dim)" }, view);
    }
    for (let v = 0; v <= current.yMax; v += current.yStep) {
      svg("line", { x1: GX, x2: GX + GW, y1: gy(v), y2: gy(v), class: v ? "grid" : "axis" }, view);
      svg("text", { x: GX - 6, y: gy(v) + 4, "text-anchor": "end", text: String(v), style: "font-size:11px;fill:var(--dim)" }, view);
    }
    svg("text", { x: GX + GW, y: GY + GH + 34, "text-anchor": "end", text: state.hidden ? "x" : `x (${current.xUnit})`, style: "font-style:italic" }, view);
    svg("text", { x: GX + 4, y: GY - 6, text: state.hidden ? "y" : `y (${current.yUnit})`, style: "font-style:italic" }, view);
    if (state.connected) {
      const steps = Math.max(1, state.x * 20);
      const d = Array.from({ length: steps + 1 }, (_, i) => { const x = (state.x * i) / steps; return `${i ? "L" : "M"} ${gx(x)} ${gy(current.f(x))}`; }).join(" ");
      svg("path", { d, fill: "none", style: "stroke:var(--accent);stroke-width:3" }, view);
    }
    for (let x = 0; x <= state.x; x++) {
      svg("circle", { cx: gx(x), cy: gy(current.f(x)), r: x === state.x ? 8 : 6, style: `fill:${x === state.x ? PALETTE.amber : PALETTE.pink};stroke:var(--input);stroke-width:2` }, view);
    }
  }

  render();
  return () => scope.clearAll();
}
