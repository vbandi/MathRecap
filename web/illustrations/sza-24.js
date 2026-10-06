import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

const UNIT = 200, ORIGIN_X = 40, AXIS_Y = 235, DIAGONAL = Math.SQRT2 * UNIT;
const PI_DIGITS = "314159265358979323846264338327950288419716939937510582097494459";
const DIGIT_COUNT = 60;

// Decimal digits of sqrt(2) computed exactly with BigInt: "14142135..." (the integer part 1 is included).
function sqrtTwoDigits(count) {
  const target = 2n * 10n ** BigInt(2 * (count - 1));
  let low = 0n, high = 10n ** BigInt(count);
  while (low < high) {
    const middle = (low + high + 1n) / 2n;
    if (middle * middle <= target) low = middle; else high = middle - 1n;
  }
  return low.toString();
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Az irracionális szám olyan szám, amely nem írható fel két egész szám hányadosaként. Ilyen a √2 és a π. A racionális és az irracionális számok együtt alkotják a valós számokat: a számegyenes minden pontja egy valós szám."));

  // --- Card 1: the diagonal of the unit square becomes a point on the number line ---
  const compassCard = card("A négyzet átlója a számegyenesen");
  compassCard.append(make("p", "", "Az 1 oldalú négyzet átlója Pitagorasz tétele szerint √(1² + 1²) = √2. Tegyük a körző hegyét a 0-ba, és forgassuk az átlót a számegyenesre!"));
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 270", role: "img" }, compassCard);
  svg("rect", { x: ORIGIN_X, y: AXIS_Y - UNIT, width: UNIT, height: UNIT, style: `fill:${PALETTE.blue};fill-opacity:.12;stroke:${PALETTE.blue};stroke-width:2` }, figure);
  svg("line", { x1: 20, x2: 580, y1: AXIS_Y, y2: AXIS_Y, class: "axis" }, figure);
  for (let i = 0; i <= 2; i++) {
    svg("line", { x1: ORIGIN_X + i * UNIT, x2: ORIGIN_X + i * UNIT, y1: AXIS_Y - 6, y2: AXIS_Y + 6, class: "axis" }, figure);
    svg("text", { x: ORIGIN_X + i * UNIT, y: AXIS_Y + 24, "text-anchor": "middle", text: String(i), style: "font-size:13px" }, figure);
  }
  svg("text", { x: ORIGIN_X + UNIT / 2, y: AXIS_Y - UNIT / 2 + 5, "text-anchor": "middle", text: "1", style: `font-weight:700;fill:${PALETTE.blue}` }, figure);
  svg("text", { x: ORIGIN_X + UNIT / 2, y: AXIS_Y - UNIT - 8, "text-anchor": "middle", text: "1", style: `font-weight:700;fill:${PALETTE.blue}` }, figure);
  svg("line", { x1: ORIGIN_X, y1: AXIS_Y, x2: ORIGIN_X + UNIT, y2: AXIS_Y - UNIT, style: `stroke:${PALETTE.amber};stroke-width:2;stroke-dasharray:6 5;opacity:.6` }, figure);
  const arc = svg("path", { fill: "none", style: `stroke:${PALETTE.violet};stroke-width:2.5` }, figure);
  const diagonal = svg("line", { x1: ORIGIN_X, y1: AXIS_Y, style: `stroke:${PALETTE.amber};stroke-width:4;stroke-linecap:round` }, figure);
  const landing = svg("circle", { r: 8, cy: AXIS_Y, cx: ORIGIN_X + DIAGONAL, opacity: 0, class: "il-fade", style: `fill:${PALETTE.red};stroke:var(--input);stroke-width:2` }, figure);
  const landingLabel = svg("text", { x: ORIGIN_X + DIAGONAL, y: AXIS_Y - 20, "text-anchor": "middle", opacity: 0, class: "il-fade", text: "√2 ≈ 1,41421…", style: `fill:${PALETTE.red};font-weight:700` }, figure);
  const compassMessage = make("p", "il-message");
  const playButton = button("Forgasd a körzőt", () => animate());
  compassCard.append(controls(playButton, button("Újra", () => { scope.clearAll(); setAngle(45, false); playButton.disabled = false; }, { ghost: true })), compassMessage);

  function setAngle(degrees, done) {
    const radians = (degrees * Math.PI) / 180;
    const endX = ORIGIN_X + DIAGONAL * Math.cos(radians), endY = AXIS_Y - DIAGONAL * Math.sin(radians);
    diagonal.setAttribute("x2", endX); diagonal.setAttribute("y2", endY);
    const startX = ORIGIN_X + DIAGONAL * Math.cos(Math.PI / 4), startY = AXIS_Y - DIAGONAL * Math.sin(Math.PI / 4);
    arc.setAttribute("d", degrees >= 45 ? "" : `M ${startX} ${startY} A ${DIAGONAL} ${DIAGONAL} 0 0 1 ${endX} ${endY}`);
    landing.setAttribute("opacity", done ? 1 : 0); landingLabel.setAttribute("opacity", done ? 1 : 0);
    compassMessage.className = done ? "il-message good" : "il-message";
    compassMessage.textContent = done ? "A körző az átló hosszát a számegyenesre vitte: ez a pont √2, körülbelül 1,414. Van helye a számegyenesen, pedig nem tört." : "Az átló √2 hosszú. Nyomd meg a gombot, és nézd, hol ér földet a számegyenesen.";
  }

  function animate() {
    scope.clearAll();
    playButton.disabled = true;
    const start = performance.now(), duration = 1800;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration), eased = t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
      setAngle(45 * (1 - eased), t >= 1);
      if (t < 1) scope.frame(step); else playButton.disabled = false;
    };
    scope.frame(step);
  }

  // --- Card 2: digits that never settle into a pattern ---
  const digitsCard = card("Végtelen tizedes tört, amelyben nincs ismétlődés");
  const sqrtDigits = sqrtTwoDigits(DIGIT_COUNT);
  const digitState = { count: 10, running: false };
  const sqrtLine = make("div", "il-formula start"), piLine = make("div", "il-formula start"), sevenLine = make("div", "il-formula start");
  [sqrtLine, piLine, sevenLine].forEach((line) => { line.style.cssText += "overflow-wrap:anywhere;font-size:16px;"; });
  const runToggle = toggle("Jegyek görgetése", false, () => { digitState.running ? stopDigits() : startDigits(); });
  const digitMessage = make("p", "il-message");
  digitsCard.append(controls(runToggle, button("Újra", () => { stopDigits(); digitState.count = 10; renderDigits(); }, { ghost: true })), sqrtLine, piLine, sevenLine, digitMessage);

  function startDigits() {
    if (digitState.count >= DIGIT_COUNT) digitState.count = 10;
    digitState.running = true; runToggle.setAttribute("aria-pressed", "true");
    const id = scope.interval(() => {
      digitState.count += 1; renderDigits();
      if (digitState.count >= DIGIT_COUNT) { scope.clearInterval(id); stopDigits(); }
    }, 140);
  }
  function stopDigits() { digitState.running = false; runToggle.setAttribute("aria-pressed", "false"); scope.clearAll(); }

  function renderDigits() {
    const n = digitState.count;
    sqrtLine.textContent = `√2 = ${sqrtDigits[0]},${sqrtDigits.slice(1, n)}…`;
    piLine.textContent = `π = ${PI_DIGITS[0]},${PI_DIGITS.slice(1, n)}…`;
    const seven = "142857".repeat(11).slice(0, n - 1);
    sevenLine.textContent = `1/7 = 0,${seven}…`;
    digitMessage.textContent = `Az 1/7 jegyei ugyanazt a 142857 csoportot ismétlik. A √2 és a π jegyeiben nincs ismétlődő csoport, bármeddig folytatjuk.`;
  }

  // --- Card 3: rationals are dense, yet leave gaps ---
  const zoomCard = card("Sűrű, de mégis vannak rések");
  zoomCard.append(make("p", "", "A tizedes törtek (racionális számok) egyre sűrűbben állnak a számegyenesen. Nagyítsunk rá a √2 környékére: a két szomszédos tizedes tört között mindig ott a √2, de egyik jelölt pont sem ő."));
  const levelSlider = range({ label: "Nagyítás", min: 0, max: 6, value: 0, format: (v) => `${v + 1} tizedesjegy`, onInput: () => renderZoom() });
  const zoomFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 140", role: "img" }, zoomCard);
  const zoomLayer = svg("g", {}, zoomFigure);
  const zoomLine = make("div", "il-formula start");
  zoomLine.style.fontSize = "15px";
  const zoomMessage = make("p", "il-message");
  zoomCard.append(controls(levelSlider.element), zoomFigure, zoomLine, zoomMessage);
  root.append(compassCard, digitsCard, zoomCard, keyIdea("az irracionális számoknak végtelen, nem szakaszos tizedes tört alakjuk van, és nem írhatók p/q alakban. A racionális számok között „rések” vannak; a rések kitöltésével kapjuk a valós számokat, amelyek a számegyenes összes pontját lefedik."));

  function renderZoom() {
    const k = levelSlider.input.valueAsNumber;
    const scale = 10 ** k;
    const lowInt = Number(sqrtDigits.slice(0, k + 1));
    const from = lowInt / scale, to = (lowInt + 1) / scale;
    zoomLayer.replaceChildren();
    const x0 = 30, width = 540, y = 70;
    svg("line", { x1: x0, x2: x0 + width, y1: y, y2: y, class: "axis" }, zoomLayer);
    for (let i = 0; i <= 10; i++) {
      const x = x0 + (width * i) / 10;
      svg("circle", { cx: x, cy: y, r: 4, style: `fill:${PALETTE.violet}` }, zoomLayer);
      svg("text", { x, y: y + 26, "text-anchor": "middle", text: formatNumber((lowInt * 10 + i) / (scale * 10), k + 1), style: "font-size:10px;fill:var(--dim)" }, zoomLayer);
    }
    const position = Math.SQRT2 * scale - lowInt;
    const x = x0 + width * position;
    svg("circle", { cx: x, cy: y, r: 7, fill: "none", style: `stroke:${PALETTE.red};stroke-width:3` }, zoomLayer);
    svg("text", { x, y: y - 20, "text-anchor": "middle", text: "√2", style: `fill:${PALETTE.red};font-weight:700` }, zoomLayer);
    const low2 = (lowInt * lowInt) / scale ** 2, high2 = ((lowInt + 1) * (lowInt + 1)) / scale ** 2;
    zoomLine.textContent = `${formatNumber(from, k)}² = ${formatNumber(low2, 2 * k)} < 2 < ${formatNumber(high2, 2 * k)} = ${formatNumber(to, k)}²`;
    zoomMessage.textContent = `A lila pontok tizedes törtek (${k + 1} tizedesjeggyel). A √2 két lila pont között van, és nem esik egybe egyikkel sem: bármeddig nagyítunk, marad „rés” a racionális pontok között.`;
  }

  setAngle(45, false);
  renderDigits();
  renderZoom();
  return () => scope.clearAll();
}
