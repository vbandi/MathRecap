import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const W = 720, H = 250, LEFT = 60, BOTTOM = 215, TOP = 20;

// Small multiple-choice check shared by the three panels.
function quiz(question, options, correctIndex, explanation) {
  const box = make("div");
  const message = make("p", "il-message");
  const row = controls();
  let solved = false;
  options.forEach((text, index) => {
    const choice = button(text, () => {
      solved = index === correctIndex;
      message.className = `il-message ${solved ? "good" : "warn"}`;
      message.textContent = solved ? `Így van! ${explanation}` : "Nem ez a fő hiba, nézd meg újra az ábrát, és próbáld a javító vezérlővel is!";
    }, { ghost: true });
    row.append(choice);
  });
  box.append(make("p", "", question), row, message);
  return box;
}

export function mount(root) {
  const scope = createScope();

  root.append(lead("Ugyanabból az adatból készíthetünk olyan ábrát, amelyik őszintén mutat, és olyat is, amelyik félrevezet. A trükkök többnyire apróságok: levágott tengely, felnagyított ikon, összenyomott idővonal. Ha ismered őket, nem fognak becsapni."));

  // ---- Panel 1: truncated axis ----
  const scores = [["A osztály", 78], ["B osztály", 80], ["C osztály", 83]], TOP_VALUE = 90;
  const axisCard = card("1. A levágott tengely");
  let base = 70;
  const baseSlider = range({ label: "Az y-tengely innen indul:", min: 0, max: 75, step: 5, value: base, format: (n) => String(n), onInput: (n) => { base = n; renderBars(); } });
  const barFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Oszlopdiagram az osztályok átlagpontjairól" }, axisCard);
  const barLayer = svg("g", {}, barFigure);
  const barLine = make("div", "il-formula start");
  const ratioVisual = make("span"), ratioReal = make("span");
  barLine.append(ratioVisual, make("br"), ratioReal);
  axisCard.append(make("p", "", "Három osztály átlagpontszáma egy dolgozaton. Húzd a csúszkát, és figyeld, hogyan változik a látszat!"),
    controls(baseSlider.element, button("Javítás: nullától indul", () => { base = 0; baseSlider.set(0); renderBars(); }, { ghost: true })), barFigure, barLine,
    quiz("Mi a megtévesztő ebben az ábrában?", ["A színek", "Az y-tengely nem nullától indul", "Túl kevés oszlop van"], 1, "Ha a tengely nem nullától indul, az oszlopok magassága nem arányos az értékkel."));

  function renderBars() {
    barLayer.replaceChildren();
    const plotHeight = BOTTOM - TOP, scale = plotHeight / (TOP_VALUE - base);
    const ticks = [base];
    for (let v = Math.floor(base / 10) * 10 + 10; v <= TOP_VALUE; v += 10) if (v > base + 2) ticks.push(v);
    for (const v of ticks) {
      const y = BOTTOM - (v - base) * scale;
      svg("line", { x1: LEFT, x2: W - 20, y1: y, y2: y, class: v === base ? "axis" : "grid" }, barLayer);
      svg("text", { x: LEFT - 8, y: y + 4, "text-anchor": "end", text: String(v), style: "font-size:12px;fill:var(--dim)" }, barLayer);
    }
    const colors = [PALETTE.blue, PALETTE.green, PALETTE.amber];
    const heights = scores.map(([, v]) => (v - base) * scale);
    scores.forEach(([name, v], i) => {
      const x = LEFT + 50 + i * 190;
      svg("rect", { x, y: BOTTOM - heights[i], width: 110, height: heights[i], rx: 4, style: `fill:${colors[i]}` }, barLayer);
      svg("text", { x: x + 55, y: BOTTOM - heights[i] - 6, "text-anchor": "middle", text: String(v), style: "font-weight:700" }, barLayer);
      svg("text", { x: x + 55, y: BOTTOM + 18, "text-anchor": "middle", text: name }, barLayer);
    });
    const visual = heights[2] / heights[0];
    ratioVisual.replaceChildren("az ábrán: C oszlopa ", slot(`${formatNumber(visual, 2)}-szor`, 8, { align: "left" }), " olyan magas, mint A oszlopa");
    ratioReal.replaceChildren("valójában: 83 : 78 = ", slot(formatNumber(83 / 78, 2), 8, { align: "left" }), " (csak ", slot(`${formatNumber((83 / 78 - 1) * 100, 1)} %`, 6, { align: "left" }), "-kal több)");
  }

  // ---- Panel 2: pictogram ----
  const pictoCard = card("2. A felnagyított ikon");
  let oneBigIcon = true;
  const pictoFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Képdiagram eladott telefonokról" }, pictoCard);
  const pictoLayer = svg("g", {}, pictoFigure);
  const pictoLine = make("div", "il-formula start");
  const pictoData = make("span"), pictoArea = make("span");
  pictoLine.append(pictoData, make("br"), pictoArea);
  const pictoToggle = toggle("Javítás: annyi ikon, ahányszoros az érték", false, () => { oneBigIcon = !oneBigIcon; renderPicto(); });
  pictoCard.append(make("p", "", "Egy bolt 2020-ban 100, 2021-ben 200 telefont adott el. Az eladások duplázódtak. A képdiagram ezt az ikon méretével akarja megmutatni."),
    controls(pictoToggle), pictoFigure, pictoLine,
    quiz("Mi a hiba az ikonos ábrában?", ["Az ikon túl sötét", "A kétszeres érték kétszeres magasságú ikonnal van jelölve, így a terület négyszeres", "Nincs cím az ábrán"], 1, "Ha egy ikon magasságát megduplázod, a szélessége is nő, így a területe 2 · 2 = 4-szeres lesz."));

  function phone(layer, x, y, scale, color) {
    const g = svg("g", { transform: `translate(${x} ${y}) scale(${scale})` }, layer);
    svg("rect", { width: 34, height: 60, rx: 7, style: `fill:${color}` }, g);
    svg("rect", { x: 4, y: 7, width: 26, height: 40, rx: 2, style: "fill:var(--input);opacity:.85" }, g);
    svg("circle", { cx: 17, cy: 53, r: 3, style: "fill:var(--input)" }, g);
  }
  function renderPicto() {
    pictoLayer.replaceChildren();
    pictoToggle.setAttribute("aria-pressed", String(!oneBigIcon));
    const baseY = 225;
    svg("line", { x1: 30, x2: W - 30, y1: baseY, y2: baseY, class: "axis" }, pictoLayer);
    svg("text", { x: 130, y: baseY + 18, "text-anchor": "middle", text: "2020: 100 db" }, pictoLayer);
    svg("text", { x: 430, y: baseY + 18, "text-anchor": "middle", text: "2021: 200 db" }, pictoLayer);
    phone(pictoLayer, 113, baseY - 60, 1, PALETTE.blue);
    if (oneBigIcon) {
      phone(pictoLayer, 396, baseY - 120, 2, PALETTE.blue);
    } else {
      phone(pictoLayer, 396 - 25, baseY - 60, 1, PALETTE.blue);
      phone(pictoLayer, 396 + 25, baseY - 60, 1, PALETTE.blue);
    }
    const areaRatio = oneBigIcon ? 4 : 2;
    pictoData.replaceChildren("az adat: 200 : 100 = ", slot("2-szeres", 10, { align: "left" }));
    pictoArea.replaceChildren("az ikonok területe: ", slot(`${areaRatio}-szeres`, 10, { align: "left" }), oneBigIcon ? "  ← túl sok!" : "  ← stimmel");
  }

  // ---- Panel 3: time axis ----
  const years = [2014, 2015, 2016, 2020, 2024], visitors = [50, 54, 58, 62, 66];
  const timeCard = card("3. Az idővonal nyújtása");
  let equalSpacing = true, stretch = 0.45;
  const stretchSlider = range({ label: "Az ábra szélessége:", min: 30, max: 100, step: 5, value: stretch * 100, format: (n) => `${n} %`, onInput: (n) => { stretch = n / 100; renderTime(); } });
  const timeFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Vonaldiagram a látogatók számáról" }, timeCard);
  const timeLayer = svg("g", {}, timeFigure);
  const timeMessage = make("p", "il-message");
  const spacingToggle = toggle("Javítás: az évek aránya a valóságos legyen", false, () => { equalSpacing = !equalSpacing; renderTime(); });
  timeCard.append(make("p", "", "Egy múzeum látogatói (ezer fő) öt mérési évben. Két trükk lehetséges: az évek egyforma távolságra kerülnek, pedig nem egyforma időközök telnek el, és az ábra szélességével a meredekség is átállítható."),
    controls(spacingToggle, stretchSlider.element), timeFigure, timeMessage,
    quiz("Mi az, ami az idővonalon nem helyes?", ["Az évek egyforma távolságra vannak, pedig az időközök különbözők", "A vonal színe", "Az értékek nem egész számok"], 0, "Az x-tengelyen az időnek arányosan kell futnia, különben a változás üteme torzul."));

  function renderTime() {
    timeLayer.replaceChildren();
    spacingToggle.setAttribute("aria-pressed", String(!equalSpacing));
    const width = (W - LEFT - 40) * stretch, y = (v) => BOTTOM - ((v - 40) / 30) * (BOTTOM - TOP);
    const x = (i) => LEFT + (equalSpacing ? i / (years.length - 1) : (years[i] - years[0]) / (years.at(-1) - years[0])) * width;
    for (const v of [40, 50, 60, 70]) {
      svg("line", { x1: LEFT, x2: W - 20, y1: y(v), y2: y(v), class: v === 40 ? "axis" : "grid" }, timeLayer);
      svg("text", { x: LEFT - 8, y: y(v) + 4, "text-anchor": "end", text: String(v), style: "font-size:12px;fill:var(--dim)" }, timeLayer);
    }
    svg("polyline", { points: years.map((_, i) => `${x(i)},${y(visitors[i])}`).join(" "), fill: "none", style: `stroke:${PALETTE.blue};stroke-width:3;stroke-linejoin:round` }, timeLayer);
    years.forEach((year, i) => {
      svg("circle", { cx: x(i), cy: y(visitors[i]), r: 5.5, style: `fill:${PALETTE.blue}` }, timeLayer);
      svg("text", { x: x(i), y: BOTTOM + 18, "text-anchor": "middle", text: String(year), style: "font-size:12px" }, timeLayer);
    });
    timeMessage.className = `il-message ${equalSpacing ? "warn" : "good"}`;
    timeMessage.textContent = equalSpacing
      ? "Az ábrán úgy tűnik, mintha egyenletesen nőne a látogatószám. Valójában 2014 és 2016 között évente 4 ezerrel nőtt, utána évente csak 1 ezerrel."
      : "Az arányos idővonalon látszik, hogy 2016 után a növekedés lelassult. A szélesség csúszkával a meredekséget még mindig ki lehet simítani vagy kihegyezni.";
  }

  root.append(axisCard, pictoCard, timeCard, keyIdea("egy ábrát mindig ellenőrizz: a tengely nullától indul-e, az ikonok területe arányos-e az adattal, és az idővonal egyenletesen van-e beosztva."));
  renderBars(); renderPicto(); renderTime();
  return () => scope.clearAll();
}
