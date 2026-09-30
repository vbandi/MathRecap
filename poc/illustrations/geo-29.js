import { button, card, controls, equation, formatNumber, keyIdea, lead, make, PALETTE, slot, svg } from "./kit.js";

const UNIT = 40, CX = 300, CY = 170, MAX_STEPS = 3;
const toView = ([x, y]) => [CX + x * UNIT, CY - y * UNIT];
const pointsOf = (points) => points.map(([x, y]) => `${x},${y}`).join(" ");
const clean = (value) => (Math.abs(value) < 1e-9 ? 0 : value);
const num = (value) => formatNumber(clean(Number(value.toFixed(2))), 2);
const FLAG = [[1, 0.5], [1.5, 0.5], [1.5, 2], [3, 2.75], [1.5, 3.5], [1, 3.5]];

// An isometry is x -> M x + t with M = [[a, b], [c, d]].
const IDENTITY = { a: 1, b: 0, c: 0, d: 1, x: 0, y: 0 };
const apply = (map, [px, py]) => [map.a * px + map.b * py + map.x, map.c * px + map.d * py + map.y];
// The motion "first, then second": M = M2 M1, t = M2 t1 + t2.
function compose(first, second) {
  const [x, y] = apply(second, [first.x, first.y]);
  return {
    a: second.a * first.a + second.b * first.c, b: second.a * first.b + second.b * first.d,
    c: second.c * first.a + second.d * first.c, d: second.c * first.b + second.d * first.d, x, y,
  };
}

const LIBRARY = [
  { name: "Eltolás (3; 0)", map: { ...IDENTITY, x: 3 } },
  { name: "Eltolás (0; −2)", map: { ...IDENTITY, y: -2 } },
  { name: "Forgatás 90°-kal O körül", map: { a: 0, b: -1, c: 1, d: 0, x: 0, y: 0 } },
  { name: "Forgatás 180°-kal O körül", map: { a: -1, b: 0, c: 0, d: -1, x: 0, y: 0 } },
  { name: "Tükrözés az x tengelyre", map: { a: 1, b: 0, c: 0, d: -1, x: 0, y: 0 } },
  { name: "Tükrözés az y tengelyre", map: { a: -1, b: 0, c: 0, d: 1, x: 0, y: 0 } },
  { name: "Tükrözés az y = x egyenesre", map: { a: 0, b: 1, c: 1, d: 0, x: 0, y: 0 } },
];

// Names the single motion that equals the composed isometry and returns drawing hints.
function describe(map) {
  const determinant = map.a * map.d - map.b * map.c;
  if (determinant > 0) {
    if (Math.abs(map.a - 1) < 1e-9 && Math.abs(map.c) < 1e-9) {
      if (Math.hypot(map.x, map.y) < 1e-9) return { text: "helybenhagyás: az alakzat visszaért a kiindulási helyére." };
      return { text: `eltolás a (${num(map.x)}; ${num(map.y)}) vektorral.`, translation: [map.x, map.y] };
    }
    const angle = Math.atan2(map.c, map.a) * 180 / Math.PI;
    // Centre c solves (I - M) c = t.
    const n11 = 1 - map.a, n12 = -map.b, n21 = -map.c, n22 = 1 - map.d, det = n11 * n22 - n12 * n21;
    const centre = [(map.x * n22 - n12 * map.y) / det, (n11 * map.y - n21 * map.x) / det];
    return { text: `forgatás ${num(angle)}°-kal a (${num(centre[0])}; ${num(centre[1])}) pont körül.`, centre };
  }
  const phi = Math.atan2(map.c, map.a) / 2;
  const u = [Math.cos(phi), Math.sin(phi)], normal = [-Math.sin(phi), Math.cos(phi)];
  const along = map.x * u[0] + map.y * u[1], across = map.x * normal[0] + map.y * normal[1];
  const point = [normal[0] * across / 2, normal[1] * across / 2];
  const axisAngle = ((phi * 180 / Math.PI) % 180 + 180) % 180;
  const axisText = `az (${num(point[0])}; ${num(point[1])}) ponton átmenő, ${num(axisAngle)}°-os irányszögű egyenes`;
  if (Math.abs(along) < 1e-9) return { text: `tengelyes tükrözés: a tengely ${axisText}.`, axis: { point, direction: u } };
  return { text: `csúsztatva tükrözés: tükrözés ${axisText} mentén, és eltolás ${num(Math.abs(along))} egységgel a tengely irányában.`, axis: { point, direction: u } };
}

export function mount(root) {
  const chain = [];
  root.append(lead("Az egybevágósági transzformációk (eltolás, forgatás, tükrözés) egymás után is végrehajthatók. Az eredmény mindig olyan mozgás, amelyet egyetlen lépésben is el lehet érni: másik eltolás, forgatás, tükrözés vagy csúsztatva tükrözés."));

  const main = card("Láncolj össze legfeljebb három mozgást");
  const buttons = LIBRARY.map((entry) => button(entry.name, () => { if (chain.length < MAX_STEPS) { chain.push(entry); render(); } }, { ghost: true }));
  const undoButton = button("Utolsó lépés törlése", () => { chain.pop(); render(); });
  const clearButton = button("Mind törlése", () => { chain.length = 0; render(); }, { ghost: true });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Zászló és a transzformációk láncával kapott képei" });
  for (let i = -7; i <= 7; i++) svg("line", { class: i ? "grid" : "axis", x1: CX + i * UNIT, x2: CX + i * UNIT, y1: 0, y2: 340 }, figure);
  for (let i = -4; i <= 4; i++) svg("line", { class: i ? "grid" : "axis", x1: 0, x2: 600, y1: CY - i * UNIT, y2: CY - i * UNIT }, figure);
  const layer = svg("g", {}, figure);
  const chainLine = make("div");
  const message = make("p", "il-message");
  main.append(controls(...buttons), controls(undoButton, clearButton), figure, chainLine, message);

  function render() {
    layer.replaceChildren();
    buttons.forEach((element) => { element.disabled = chain.length >= MAX_STEPS; });
    undoButton.disabled = clearButton.disabled = chain.length === 0;
    let total = IDENTITY;
    const colors = [PALETTE.violet, PALETTE.pink, PALETTE.amber];
    const maps = chain.map((entry) => (total = compose(total, entry.map)));
    const summary = describe(total);
    if (summary.axis) {
      const { point, direction } = summary.axis;
      const [x1, y1] = toView([point[0] - 12 * direction[0], point[1] - 12 * direction[1]]), [x2, y2] = toView([point[0] + 12 * direction[0], point[1] + 12 * direction[1]]);
      svg("line", { x1, y1, x2, y2, style: `stroke:${PALETTE.red};stroke-width:2.5;stroke-dasharray:8 6` }, layer);
    }
    svg("polygon", { points: pointsOf(FLAG.map(toView)), style: `fill:${PALETTE.blue};fill-opacity:.5;stroke:var(--fg);stroke-width:2.5` }, layer);
    maps.forEach((map, index) => {
      const last = index === maps.length - 1;
      const image = FLAG.map((p) => apply(map, p));
      svg("polygon", { points: pointsOf(image.map(toView)), style: `fill:${colors[index]};fill-opacity:${last ? 0.6 : 0.3};stroke:var(--fg);stroke-width:${last ? 2.5 : 1.5};stroke-dasharray:${last ? "0" : "5 4"}` }, layer);
      const [x, y] = toView(image[0]);
      svg("text", { x: x - 6, y: y + 18, text: String(index + 1), "text-anchor": "end", style: "font-weight:700;font-size:15px;fill:var(--fg)" }, layer);
    });
    if (summary.translation) {
      const [sx, sy] = toView(FLAG[0]), [ex, ey] = toView(apply(total, FLAG[0]));
      svg("line", { x1: sx, y1: sy, x2: ex, y2: ey, style: `stroke:${PALETTE.red};stroke-width:2.5;stroke-dasharray:8 6` }, layer);
    }
    if (summary.centre) {
      const [x, y] = toView(summary.centre);
      svg("circle", { cx: x, cy: y, r: 6, style: `fill:${PALETTE.red};stroke:var(--input);stroke-width:2` }, layer);
    }
    const [ox, oy] = toView([0, 0]);
    svg("text", { x: ox + 6, y: oy + 16, text: "O", style: "font-weight:700;fill:var(--fg)" }, layer);
    chainLine.replaceChildren(equation("lánc", slot(chain.length ? chain.map((entry, index) => `${index + 1}. ${entry.name.split(" ")[0].toLowerCase()}`).join("  →  ") : "még nincs lépés", 46, { align: "left", dim: !chain.length })));
    message.className = `il-message ${chain.length ? "good" : ""}`;
    message.textContent = chain.length
      ? `Az egész lánc egyetlen mozgással is elérhető: ${summary.text}`
      : "Kattints a gombokra: a zászlót egymás után mozgatjuk, és megmutatjuk, mi a hatásuk együtt. A forgatások középpontja az O pont.";
  }

  // --- Card 2: tiling ---
  const tiling = card("Parkettázás egyetlen lapból");
  const STEPS = [
    "Egy tetszőleges háromszög lap. Ebből fogunk parkettát rakni.",
    "Fél fordulattal (180°) elforgatjuk az egyik oldal felezőpontja körül: a másolat kiegészíti a lapot paralelogrammává.",
    "A paralelogrammát eltoljuk az egyik oldalvektorral: sor keletkezik.",
    "Eltoljuk a másik oldalvektorral is: a lapok hézag és átfedés nélkül lefedik a síkot.",
  ];
  const state = { step: 0 };
  const nextButton = button("Következő lépés", () => { state.step = (state.step + 1) % STEPS.length; renderTiling(); });
  const tilingFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 300", role: "img", "aria-label": "Háromszög alakú lapokból rakott parketta" });
  const tilingMessage = make("p", "il-message");
  tiling.append(controls(nextButton), tilingFigure, tilingMessage);
  const S = 60, origin = [150, 270];
  const P0 = [0, 0], P1 = [2, 0], P2 = [0.8, 1.5], midpoint = [(P1[0] + P2[0]) / 2, (P1[1] + P2[1]) / 2];
  const point = (p, i, j) => [origin[0] + (p[0] + 2 * i + 0.8 * j) * S, origin[1] - (p[1] + 1.5 * j) * S];
  const tiles = [];
  let pivot = [0, 0];
  for (let j = 0; j <= 2; j++) for (let i = -3; i <= 4; i++) {
    const original = [P0, P1, P2].map((p) => point(p, i, j));
    const rotated = [P0, P1, P2].map((p) => point([P1[0] + P2[0] - p[0], P1[1] + P2[1] - p[1]], i, j));
    const base = i === 0 && j === 0;
    const a = svg("polygon", { points: pointsOf(original), class: "il-fade", style: `fill:${PALETTE.blue};fill-opacity:.7;stroke:var(--input);stroke-width:2` }, tilingFigure);
    const b = svg("polygon", { points: pointsOf(base ? original : rotated), class: base ? "il-move" : "il-fade", style: `fill:${PALETTE.amber};fill-opacity:.7;stroke:var(--input);stroke-width:2` }, tilingFigure);
    if (base) {
      pivot = point(midpoint, 0, 0);
    }
    tiles.push({ i, j, a, b, base });
  }

  function renderTiling() {
    const { step } = state;
    tiles.forEach(({ i, j, a, b, base }) => {
      const visible = base || (step >= 2 && j === 0) || step >= 3;
      a.setAttribute("opacity", visible ? 1 : 0);
      b.setAttribute("opacity", visible && step >= 1 ? 1 : 0);
      if (base) {
        const [mx, my] = pivot;
        b.style.transform = `translate(${mx}px, ${my}px) rotate(${step >= 1 ? 180 : 0}deg) translate(${-mx}px, ${-my}px)`;
      }
    });
    nextButton.textContent = step === STEPS.length - 1 ? "Újrakezdés" : "Következő lépés";
    tilingMessage.textContent = STEPS[step];
  }

  root.append(main, tiling, keyIdea("az eltolás, a forgatás és a tükrözés egymás utáni végrehajtása is egybevágósági transzformáció, és az eredménye mindig egyetlen eltolás, forgatás, tükrözés vagy csúsztatva tükrözés. Ezekkel a mozgásokkal lehet egy lapból parkettát rakni."));
  render();
  renderTiling();
  return () => {};
}
