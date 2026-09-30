import { button, card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

const VIEW = { width: 640, height: 300 }, UNIT = 40, B_SIDE = 5;
const A_POINT = { x: 220, y: 260 };
const STEPS = ["Elemzés", "Szerkesztés", "Bizonyítás", "Diszkusszió"];
const CONSTRUCTION = [
  "1. lépés: rajzolunk egy egyenest, ezen lesz az AB oldal. Kijelöljük rajta az A pontot.",
  "2. lépés: az A pontban felmérjük az α szöget. A szög szára az AC oldal iránya.",
  "3. lépés: a szögszáron A-tól b távolságra megjelöljük a C pontot.",
  "4. lépés: C körül a sugarú kört rajzolunk. Ahol ez elmetszi az egyenest, ott lehet a B pont.",
];

const toView = (x, y) => [A_POINT.x + x * UNIT, A_POINT.y - y * UNIT];

// Points B on the ray from A that are a away from C; the circle cuts the line in 0, 1 or 2 points.
function solve(a, alphaDegrees) {
  const alpha = alphaDegrees * Math.PI / 180;
  const height = B_SIDE * Math.sin(alpha), foot = B_SIDE * Math.cos(alpha);
  const gap = a * a - height * height;
  const roots = Math.abs(gap) < 1e-6 ? [foot] : gap < 0 ? [] : [foot - Math.sqrt(gap), foot + Math.sqrt(gap)];
  return { height, foot, solutions: roots.filter((x) => x > 1e-6).map((x) => ({ x, y: 0 })), tangent: Math.abs(gap) < 1e-6, reaches: gap > -1e-6 };
}

export function mount(root) {
  const state = { a: 4, alpha: 40, step: 1, substep: 4 };

  root.append(lead("Egy szerkesztési feladatnál nem elég megrajzolni egy háromszöget: végig kell gondolni azt is, hogy az adatokból hány különböző háromszög készíthető. Lehet, hogy egy sem, lehet, hogy egy, és az is előfordul, hogy kettő."));

  const main = card("Szerkessz háromszöget: b, α és a adott");
  const aSlider = range({ label: "a (BC oldal)", min: 1, max: 6, step: 0.5, value: state.a, format: (v) => `${formatNumber(v)} cm`, onInput: (value) => { state.a = value; render(); } });
  const alphaSlider = range({ label: "α", min: 20, max: 150, step: 5, value: state.alpha, format: (v) => `${v}°`, onInput: (value) => { state.alpha = value; render(); } });
  const task = make("p", "", "");
  const stepButtons = STEPS.map((name, index) => toggle(name, index === state.step, () => { state.step = index; state.substep = index === 1 ? 1 : 4; render(); }));
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${VIEW.width} ${VIEW.height}`, role: "img", "aria-label": "Háromszög szerkesztése: kör és egyenes metszéspontjai" });
  const layer = svg("g", {}, figure);
  const explanation = make("p", "il-message"); explanation.style.minHeight = "7.5em";
  const nextButton = button("Következő lépés", () => { state.substep = Math.min(4, state.substep + 1); render(); });
  const countBox = make("p", "");
  main.append(task, controls(aSlider.element, alphaSlider.element), controls(...stepButtons), figure, explanation, controls(nextButton), countBox);
  root.append(main, keyIdea("egy szerkesztési feladat négy részből áll: elemzés (mit tudunk, hogyan nézhet ki a megoldás), szerkesztés (lépésről lépésre), bizonyítás (tényleg jó lett-e) és diszkusszió (hány megoldás van, mikor). Az SSA adatoknál a kör és az egyenes metszéspontjainak száma dönti el."));

  function render() {
    const { a, alpha, step, substep } = state;
    const { height, solutions, tangent, reaches } = solve(a, alpha);
    const radians = alpha * Math.PI / 180;
    const c = toView(B_SIDE * Math.cos(radians), B_SIDE * Math.sin(radians));
    const origin = toView(0, 0);
    stepButtons.forEach((toggleButton, index) => toggleButton.setAttribute("aria-pressed", String(index === step)));
    task.textContent = `Feladat: szerkessz ABC háromszöget, ha b = ${B_SIDE} cm (AC), α = ${alpha}° (az A csúcsnál) és a = ${formatNumber(a)} cm (BC).`;
    layer.replaceChildren();
    const show = (n) => step !== 1 || substep >= n;
    const line = (from, to, style) => svg("line", { x1: from[0], y1: from[1], x2: to[0], y2: to[1], style }, layer);
    const text = (x, y, content, style = "") => svg("text", { x, y, text: content, style: `font-weight:700;fill:var(--fg);${style}` }, layer);
    if (show(1)) line([0, origin[1]], [VIEW.width, origin[1]], "stroke:var(--fg-soft);stroke-width:2");
    if (show(2)) {
      line(origin, toView(7.5 * Math.cos(radians), 7.5 * Math.sin(radians)), "stroke:var(--dim);stroke-width:1.5;stroke-dasharray:6 5");
      svg("path", { d: `M ${origin[0] + 34} ${origin[1]} A 34 34 0 0 0 ${origin[0] + 34 * Math.cos(radians)} ${origin[1] - 34 * Math.sin(radians)}`, fill: "none", style: `stroke:${PALETTE.amber};stroke-width:3` }, layer);
      text(origin[0] + 42, origin[1] - 10, "α", `fill:${PALETTE.amber}`);
    }
    if (step !== 0 && show(4)) {
      svg("circle", { cx: c[0], cy: c[1], r: a * UNIT, style: `fill:${PALETTE.blue};fill-opacity:.06;stroke:${PALETTE.blue};stroke-width:2;stroke-dasharray:8 6` }, layer);
    }
    if (show(3)) {
      line(origin, c, `stroke:${PALETTE.violet};stroke-width:3`);
      svg("circle", { cx: c[0], cy: c[1], r: 5, style: `fill:${PALETTE.violet}` }, layer);
      text(c[0] + 8, c[1] - 8, "C");
      text((origin[0] + c[0]) / 2 - 22, (origin[1] + c[1]) / 2, "b", `fill:${PALETTE.violet}`);
    }
    svg("circle", { cx: origin[0], cy: origin[1], r: 5, style: "fill:var(--fg)" }, layer);
    text(origin[0] - 18, origin[1] + 20, "A");
    if (show(4) || step === 0) {
      solutions.forEach((solution, index) => {
        const b = toView(solution.x, 0);
        if (step !== 1 || substep >= 4) {
          svg("polygon", { points: `${origin} ${b} ${c}`, style: `fill:${index ? PALETTE.pink : PALETTE.green};fill-opacity:.25;stroke:${index ? PALETTE.pink : PALETTE.green};stroke-width:2.5` }, layer);
        }
        svg("circle", { cx: b[0], cy: b[1], r: 6, style: `fill:${index ? PALETTE.pink : PALETTE.green};stroke:var(--fg);stroke-width:1.5` }, layer);
        text(b[0] - 4, b[1] + 22, solutions.length > 1 ? `B${index + 1}` : "B");
      });
    }
    nextButton.hidden = step !== 1;
    nextButton.disabled = substep >= 4;
    if (step === 1) nextButton.textContent = substep >= 4 ? "Kész a szerkesztés" : "Következő lépés";

    const count = solutions.length;
    const reason = count === 0
      ? (reaches ? "a körnek csak olyan metszéspontja van az egyenessel, amely az A-tól ellenkező irányban esik, így nem ad háromszöget" : `a = ${formatNumber(a)} cm kisebb, mint a C pont távolsága az egyenestől (b · sin α ≈ ${formatNumber(height, 2)} cm), a kör nem éri el az egyenest`)
      : tangent ? "a kör érinti az egyenest, ilyenkor a háromszög B-nél derékszögű"
      : count === 2 ? "a kör az egyenest két pontban metszi, és mindkét metszéspont az A-tól ugyanazon az oldalon van"
      : "a kör két metszéspontja közül csak az egyik esik az A-ból induló félegyenesre";
    explanation.className = "il-message";
    explanation.textContent = [
      "Elemzés: tegyük fel, hogy kész a háromszög. Az A, a C és a szög ismert. A B pont az AB egyenesen van, és C-től a távolságra. Tehát egy körnek és egy egyenesnek a metszéspontja.",
      CONSTRUCTION[Math.min(substep, 4) - 1],
      count === 0 ? "Bizonyítás: nincs megszerkesztett háromszög, így bizonyítani sincs mit." : "Bizonyítás: a kapott ABC háromszögben AC = b a C pont választása miatt, az A-nál levő szög α a szerkesztés miatt, BC = a pedig azért, mert B rajta van a C körüli a sugarú körön. Tehát megfelel az adatoknak.",
      `Diszkusszió: ${count} megoldás van, mert ${reason}.`,
    ][step];
    countBox.className = `il-message ${count ? "good" : "warn"}`;
    countBox.textContent = `Megoldások száma: ${count}. Változtasd az a-t és az α-t, és figyeld, mikor lesz 0, 1 vagy 2!`;
  }

  render();
  return () => {};
}
