import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const W = 720;
const REGIONS = [{ name: "A városrész", rate: 0.15 }, { name: "B városrész", rate: 0.35 }, { name: "C városrész", rate: 0.55 }, { name: "D városrész", rate: 0.75 }];
const PER_REGION = 100, COLS = 10, SPACING = 15, REGION_W = 170, BINS = 20;
const METHODS = [
  { id: "random", label: "Véletlen minta", hint: "Mindenkinek ugyanakkora az esélye, hogy bekerül." },
  { id: "region", label: "Csak egy városrészből", hint: "Csak ott kérdezünk, ahol éppen vagyunk." },
  { id: "volunteer", label: "Önkéntesek", hint: "Az kerül a mintába, aki szívesen válaszol. Az igennel válaszolók nagyobb kedvvel jelentkeznek." },
];
const VOLUNTEER_CHANCE = { yes: 0.75, no: 0.25 };

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
}

export function mount(root) {
  const scope = createScope();
  // Every person: region index and opinion (true = supports the plan).
  const people = REGIONS.flatMap((region, r) => shuffle(Array.from({ length: PER_REGION }, (_, j) => j < region.rate * PER_REGION)).map((yes) => ({ region: r, yes })));
  const trueRate = people.filter((p) => p.yes).length / people.length;
  let method = METHODS[0], size = 30, regionIndex = 0, sample = [], estimates = [];

  root.append(lead("Egy város 400 lakosát szeretnénk megkérdezni egy új bicikliútról, de csak néhányan válaszolnak. A kérdés: honnan válasszuk ki őket? A rossz módszer olyan eredményt ad, amely messze áll az igazságtól, akárhányszor is ismételjük meg."));

  const town = card("A város: minden pont egy lakos");
  const methodControls = controls();
  const regionControls = controls();
  const townFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 215`, role: "img", "aria-label": "A város lakosai négy városrészben" }, town);
  const sizeSlider = range({ label: "A minta mérete:", min: 10, max: 100, step: 10, value: size, format: (n) => `${n} fő`, onInput: (n) => { size = n; resetAll(); } });
  const hint = make("p", "il-muted");
  const resultLine = make("div", "il-formula start");
  const sampleText = make("span"), trueText = make("span");
  resultLine.append(sampleText, make("br"), trueText);
  town.append(methodControls, regionControls, hint, townFigure,
    controls(sizeSlider.element, button("Egy minta", () => { takeSample(); renderTown(); }), button("Nullázás", resetAll, { ghost: true })), resultLine);

  const dots = [];
  REGIONS.forEach((region, r) => {
    const left = 25 + r * (REGION_W + 8);
    svg("rect", { x: left - 8, y: 8, width: REGION_W - 12, height: 178, rx: 10, style: "fill:none;stroke:var(--line-strong)" }, townFigure);
    svg("text", { x: left + (COLS * SPACING) / 2 - 7, y: 204, "text-anchor": "middle", text: region.name, style: "font-size:12px" }, townFigure);
    people.forEach((person, index) => {
      if (person.region !== r) return;
      const k = index % PER_REGION;
      const dot = svg("circle", { cx: left + (k % COLS) * SPACING + 4, cy: 28 + Math.floor(k / COLS) * SPACING + 4, r: 5.5 }, townFigure);
      dots[index] = dot;
    });
  });

  const histogramCard = card("Sok mintavétel: hol szóródnak a becslések?");
  const histogramFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 250`, role: "img", "aria-label": "A becslések hisztogramja" }, histogramCard);
  const histogramLayer = svg("g", {}, histogramFigure);
  const histogramText = make("p", "il-message");
  histogramCard.append(controls(button("200 mintavétel", () => { for (let i = 0; i < 200; i++) takeSample(); renderTown(); }), button("Nullázás", resetAll, { ghost: true })),
    histogramFigure, histogramText,
    make("p", "il-muted", "Minden oszlop azt számolja, hány mintából jött ki az adott százalékos becslés. A narancs vonal a valódi érték az egész városban."));

  root.append(town, histogramCard, keyIdea("csak az olyan minta vezet jó becsléshez, amelyben mindenkinek egyenlő az esélye a bekerülésre (véletlen minta). Ha a kiválasztás összefügg a véleménnyel vagy a helyszínnel, a becslés mindig ugyanabba az irányba téved, a minta méretének növelése sem segít."));

  function pickSample() {
    if (method.id === "random") return shuffle([...people.keys()]).slice(0, size);
    if (method.id === "region") return shuffle(people.map((p, i) => [p, i]).filter(([p]) => p.region === regionIndex).map(([, i]) => i)).slice(0, size);
    const order = shuffle([...people.keys()]), chosen = [];
    while (chosen.length < size) {
      for (const i of shuffle([...order])) {
        if (chosen.length >= size) break;
        if (!chosen.includes(i) && Math.random() < (people[i].yes ? VOLUNTEER_CHANCE.yes : VOLUNTEER_CHANCE.no)) chosen.push(i);
      }
    }
    return chosen;
  }

  function takeSample() {
    sample = pickSample();
    estimates.push(sample.filter((i) => people[i].yes).length / sample.length);
  }

  function resetAll() {
    scope.clearAll();
    sample = []; estimates = [];
    renderControls(); renderTown();
  }

  function renderControls() {
    methodControls.replaceChildren(...METHODS.map((item) => toggle(item.label, item === method, () => { method = item; resetAll(); })));
    regionControls.replaceChildren(make("span", "il-muted", "Ha egy városrészből kérdezünk, melyikből?"),
      ...REGIONS.map((region, r) => { const t = toggle(region.name, r === regionIndex, () => { regionIndex = r; resetAll(); }); t.disabled = method.id !== "region"; return t; }));
    hint.textContent = `${method.hint} (Zöld pont: támogatja a bicikliutat, piros: nem.)`;
  }

  function renderTown() {
    const inSample = new Set(sample);
    dots.forEach((dot, i) => {
      const yes = people[i].yes;
      dot.setAttribute("style", `fill:${yes ? PALETTE.green : PALETTE.red};opacity:${sample.length && !inSample.has(i) ? 0.22 : 1};${inSample.has(i) ? "stroke:var(--fg);stroke-width:2" : ""}`);
    });
    const last = estimates.at(-1);
    sampleText.replaceChildren("a minta becslése: ", slot(sample.length ? `${formatNumber(last * 100, 1)} % igen` : "–", 14, { align: "left" }));
    trueText.replaceChildren("a valódi arány:    ", slot(`${formatNumber(trueRate * 100, 1)} % igen`, 14, { align: "left" }));
    renderHistogram();
  }

  function renderHistogram() {
    histogramLayer.replaceChildren();
    const counts = Array(BINS).fill(0);
    estimates.forEach((e) => { counts[Math.min(BINS - 1, Math.floor(e * BINS))] += 1; });
    const maxCount = Math.max(10, ...counts), left = 50, right = W - 20, top = 15, bottom = 205, bw = (right - left) / BINS;
    const y = (c) => bottom - (c / maxCount) * (bottom - top);
    for (const c of [0, Math.round(maxCount / 2), maxCount]) {
      svg("line", { x1: left, x2: right, y1: y(c), y2: y(c), class: c ? "grid" : "axis" }, histogramLayer);
      svg("text", { x: left - 6, y: y(c) + 4, "text-anchor": "end", text: String(c), style: "font-size:11px;fill:var(--dim)" }, histogramLayer);
    }
    counts.forEach((c, i) => {
      if (c) svg("rect", { x: left + i * bw + 1, y: y(c), width: bw - 2, height: bottom - y(c), rx: 2, style: `fill:${PALETTE.blue}` }, histogramLayer);
    });
    for (let p = 0; p <= 100; p += 20) svg("text", { x: left + (p / 100) * (right - left), y: bottom + 16, "text-anchor": "middle", text: `${p} %`, style: "font-size:11px;fill:var(--dim)" }, histogramLayer);
    svg("text", { x: right, y: 243, "text-anchor": "end", text: "a minta becslése (az igennel válaszolók aránya)", style: "font-size:12px;fill:var(--dim)" }, histogramLayer);
    const tx = left + trueRate * (right - left);
    svg("line", { x1: tx, x2: tx, y1: top - 4, y2: bottom, style: `stroke:${PALETTE.amber};stroke-width:2.5;stroke-dasharray:6 4` }, histogramLayer);
    if (estimates.length) {
      const avg = estimates.reduce((a, b) => a + b, 0) / estimates.length, off = Math.abs(avg - trueRate) > 0.07;
      histogramText.className = `il-message ${off ? "warn" : "good"}`;
      histogramText.textContent = `${estimates.length} mintából a becslések átlaga ${formatNumber(avg * 100, 1)} %, a valódi érték ${formatNumber(trueRate * 100, 1)} %. ${off ? "A módszer hibás: a becslések következetesen az igazság mellé esnek." : "A becslések az igazság körül szóródnak."}`;
    } else {
      histogramText.className = "il-message";
      histogramText.textContent = "Még nincs minta. Válassz módszert, és kattints a mintavételre!";
    }
  }

  renderControls(); renderTown();
  return () => scope.clearAll();
}
