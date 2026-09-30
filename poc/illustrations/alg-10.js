import { card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, stepper, svg, toggle } from "./kit.js";

const signed = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${formatNumber(Math.abs(v))}`;
const ft = (v) => `${formatNumber(Math.round(v * 100) / 100)} Ft`;
const PRICE_A = 2400, PRICE_B = 3600; // coffee prices per kg
const PLAN_B = { fee: 5000, perMinute: 4 }, PLAN_A_FEE = 2000, MAX_MINUTES = 1000, MAX_COST = 12000;

export function mount(root) {
  const scope = createScope();
  const state = { start: 10000, up: 20, down: 20, principal: 100000, rate: 5, years: 6, kgA: 3, kgB: 2, rateA: 10, minutes: 300 };

  root.append(lead("A pénzügyekben a százalék, az átlag és az egyenletek együtt dolgoznak: árat módosítunk, kamatot számolunk, keveréket árazunk, és két ajánlat közül választunk. Négy kis kísérletet találsz itt."));

  // --- Successive price changes ---
  const price = card("Árcédula: emelés, majd csökkentés");
  const up = range({ label: "Emelés", min: 0, max: 50, step: 5, value: state.up, format: (v) => `+${v} %`, onInput: (v) => { state.up = v; renderPrice(); } });
  const down = range({ label: "Csökkentés", min: 0, max: 50, step: 5, value: state.down, format: (v) => `−${v} %`, onInput: (v) => { state.down = v; renderPrice(); } });
  const priceFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 120", role: "img" });
  const priceMessage = make("p", "il-message");
  price.append(controls(up.element, down.element), priceFigure, priceMessage);

  // --- Simple interest ---
  const interest = card("Egyszerű kamat");
  const rate = range({ label: "Éves kamat", min: 1, max: 10, step: 1, value: state.rate, format: (v) => `${v} %`, onInput: (v) => { state.rate = v; renderInterest(); } });
  const years = range({ label: "Évek", min: 1, max: 10, step: 1, value: state.years, onInput: (v) => { state.years = v; renderInterest(); } });
  const interestFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 200", role: "img" });
  const interestMessage = make("p", "il-message");
  interest.append(make("p", "", "100 000 Ft-ot teszel be. Egyszerű kamatnál minden évben ugyanannyi kamatot kapsz az eredeti összeg után."), controls(rate.element, years.element), interestFigure, interestMessage);

  // --- Weighted average ---
  const coffee = card("Kávékeverék ára");
  const kgA = stepper({ label: `Olcsóbb kávé, ${PRICE_A} Ft/kg (kg)`, min: 1, max: 10, value: state.kgA, onChange: (v) => { state.kgA = v; renderCoffee(); } });
  const kgB = stepper({ label: `Drágább kávé, ${PRICE_B} Ft/kg (kg)`, min: 1, max: 10, value: state.kgB, onChange: (v) => { state.kgB = v; renderCoffee(); } });
  const coffeeFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 100", role: "img" });
  const coffeeMessage = make("p", "il-message");
  coffee.append(controls(kgA.element, kgB.element), coffeeFigure, coffeeMessage);

  // --- Phone plans ---
  const plans = card("Két mobiltarifa: hol egyenlő a költségük?");
  const rateButtons = controls(make("span", "il-muted", "A kék tarifa percdíja (Ft/perc):"), ...[7, 8, 9, 10, 12, 14].map((value) => toggle(String(value), value === state.rateA, () => { state.rateA = value; renderPlans(); })));
  const minutes = range({ label: "Havi percek", min: 0, max: MAX_MINUTES, step: 20, value: state.minutes, onInput: (v) => { state.minutes = v; renderPlans(); } });
  const planFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 250", role: "img" });
  const planMessage = make("p", "il-message");
  plans.append(make("p", "", `Kék tarifa: ${PLAN_A_FEE} Ft havidíj + percdíj. Piros tarifa: ${PLAN_B.fee} Ft havidíj + ${PLAN_B.perMinute} Ft/perc.`), rateButtons, controls(minutes.element), planFigure, planMessage);

  root.append(price, interest, coffee, plans, keyIdea("a +20 % és a −20 % nem oltja ki egymást, mert a második változás már az új árra vonatkozik. Az egyszerű kamat egyenletesen, egyenes vonalban növekszik. A keverék ára súlyozott átlag, a két egyenes metszéspontja pedig megmutatja, mikor egyenlő a két ajánlat."));

  function renderPrice() {
    const { start, up: u, down: d } = state;
    const one = start * (1 + u / 100), two = one * (1 - d / 100);
    priceFigure.replaceChildren();
    const tags = [[start, "eredeti ár", PALETTE.blue], [one, `+${u} % (· ${formatNumber(1 + u / 100)})`, PALETTE.green], [two, `−${d} % (· ${formatNumber(1 - d / 100)})`, PALETTE.amber]];
    tags.forEach(([value, caption, color], index) => {
      const x = 14 + index * 200;
      svg("path", { d: `M ${x} 20 H ${x + 130} L ${x + 160} 50 L ${x + 130} 80 H ${x} Z`, style: `fill:var(--surface);stroke:${color};stroke-width:3` }, priceFigure);
      svg("text", { x: x + 62, y: 56, "text-anchor": "middle", text: ft(value), style: "font-weight:700;font-size:16px;fill:var(--fg)" }, priceFigure);
      svg("text", { x: x + 62, y: 106, "text-anchor": "middle", text: caption, style: "font-size:12px" }, priceFigure);
    });
    const net = (two / start - 1) * 100;
    priceMessage.className = `il-message ${Math.abs(net) > 1e-9 ? "warn" : "good"}`;
    priceMessage.textContent = Math.abs(net) < 1e-9
      ? "Itt a két változás kioltja egymást, mert az egyik 0 %, vagy nincs is változás."
      : `A végső ár ${ft(two)}, ez ${signed(Math.round(net * 100) / 100)} % az eredetihez képest. A csökkentés már az emelt árra vonatkozott.`;
  }

  function renderInterest() {
    const { principal, rate: r, years: n } = state;
    interestFigure.replaceChildren();
    const max = principal * (1 + 10 * 10 / 100);
    const barWidth = 34, gap = 12;
    for (let year = 0; year <= n; year++) {
      const x = 40 + year * (barWidth + gap), total = principal + (principal * r * year) / 100;
      const heightTotal = (total / max) * 150, heightBase = (principal / max) * 150;
      svg("rect", { x, y: 170 - heightBase, width: barWidth, height: heightBase, style: `fill:${PALETTE.blue}` }, interestFigure);
      if (year) svg("rect", { x, y: 170 - heightTotal, width: barWidth, height: heightTotal - heightBase, style: `fill:${PALETTE.amber}` }, interestFigure);
      svg("text", { x: x + barWidth / 2, y: 188, "text-anchor": "middle", text: String(year), style: "font-size:12px" }, interestFigure);
    }
    svg("text", { x: 590, y: 16, "text-anchor": "end", text: "kék: tőke   narancs: kamat   (alul: évek)", style: "font-size:12px" }, interestFigure);
    const interestSum = (principal * r * n) / 100;
    interestMessage.textContent = `${n} év alatt ${formatNumber(principal)} · ${r} / 100 · ${n} = ${formatNumber(interestSum)} Ft kamat, összesen ${formatNumber(principal + interestSum)} Ft. Évente ${formatNumber((principal * r) / 100)} Ft jön hozzá, ezért a bárok lépcsősen, egyenletesen nőnek.`;
  }

  function renderCoffee() {
    const { kgA: a, kgB: b } = state;
    const average = (a * PRICE_A + b * PRICE_B) / (a + b);
    coffeeFigure.replaceChildren();
    const toX = (value) => 40 + ((value - PRICE_A) / (PRICE_B - PRICE_A)) * 520;
    svg("line", { x1: 40, x2: 560, y1: 50, y2: 50, style: "stroke:var(--line-strong);stroke-width:4" }, coffeeFigure);
    [[PRICE_A, PALETTE.green, "olcsó"], [PRICE_B, PALETTE.red, "drága"]].forEach(([value, color, name]) => {
      svg("circle", { cx: toX(value), cy: 50, r: 9, style: `fill:${color}` }, coffeeFigure);
      svg("text", { x: toX(value), y: 82, "text-anchor": value === PRICE_A ? "start" : "end", text: `${name}: ${value} Ft/kg` }, coffeeFigure);
    });
    svg("path", { d: `M ${toX(average)} 40 l -9 -16 h 18 Z`, style: "fill:var(--accent)" }, coffeeFigure);
    svg("text", { x: toX(average), y: 18, "text-anchor": "middle", text: `keverék: ${ft(average)}/kg`, style: "font-weight:700;fill:var(--fg)" }, coffeeFigure);
    coffeeMessage.textContent = `(${a} · ${PRICE_A} + ${b} · ${PRICE_B}) : (${a} + ${b}) = ${formatNumber(a * PRICE_A + b * PRICE_B)} : ${a + b} = ${formatNumber(Math.round(average * 100) / 100)} Ft/kg. Az átlag ahhoz az árhoz van közelebb, amelyikből több kg van.`;
  }

  function renderPlans() {
    const { rateA, minutes: m } = state;
    planFigure.replaceChildren();
    rateButtons.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String([7, 8, 9, 10, 12, 14][i] === rateA)));
    const toX = (v) => 50 + (v / MAX_MINUTES) * 520, toY = (v) => 220 - (v / MAX_COST) * 200;
    for (let v = 0; v <= MAX_COST; v += 3000) {
      svg("line", { x1: 50, x2: 570, y1: toY(v), y2: toY(v), class: v ? "grid" : "axis" }, planFigure);
      svg("text", { x: 44, y: toY(v) + 4, "text-anchor": "end", text: formatNumber(v) }, planFigure);
    }
    for (let v = 0; v <= MAX_MINUTES; v += 250) svg("text", { x: toX(v), y: 238, "text-anchor": "middle", text: String(v) }, planFigure);
    const costA = (x) => PLAN_A_FEE + rateA * x, costB = (x) => PLAN_B.fee + PLAN_B.perMinute * x;
    const clipEnd = (fn) => { const x = Math.min(MAX_MINUTES, (MAX_COST - fn(0)) / ((fn(1) - fn(0)) || 1)); return [x, fn(x)]; };
    [[costA, PALETTE.blue], [costB, PALETTE.red]].forEach(([fn, color]) => {
      const [x2, y2] = clipEnd(fn);
      svg("line", { x1: toX(0), y1: toY(fn(0)), x2: toX(x2), y2: toY(y2), style: `stroke:${color};stroke-width:3` }, planFigure);
    });
    const meet = (PLAN_B.fee - PLAN_A_FEE) / (rateA - PLAN_B.perMinute);
    svg("circle", { cx: toX(meet), cy: toY(costA(meet)), r: 7, style: "fill:none;stroke:var(--fg);stroke-width:3" }, planFigure);
    svg("line", { x1: toX(m), x2: toX(m), y1: toY(0), y2: toY(Math.max(costA(m), costB(m))), style: "stroke:var(--accent);stroke-width:2;stroke-dasharray:6 5" }, planFigure);
    svg("text", { x: 60, y: 18, text: "○ itt egyenlő a két tarifa költsége", style: "font-size:12px" }, planFigure);
    const cheaper = costA(m) < costB(m) ? "a kék tarifa" : costA(m) > costB(m) ? "a piros tarifa" : "egyforma";
    planMessage.className = "il-message";
    planMessage.textContent = `${m} percnél: kék = ${formatNumber(costA(m))} Ft, piros = ${formatNumber(costB(m))} Ft, olcsóbb: ${cheaper}. Egyenlet: ${PLAN_A_FEE} + ${rateA}x = ${PLAN_B.fee} + ${PLAN_B.perMinute}x, ebből x = ${formatNumber(PLAN_B.fee - PLAN_A_FEE)} : ${rateA - PLAN_B.perMinute} = ${formatNumber(meet)} perc (${formatNumber(costA(meet))} Ft).`;
  }

  renderPrice();
  renderInterest();
  renderCoffee();
  renderPlans();
  return () => scope.clearAll();
}
