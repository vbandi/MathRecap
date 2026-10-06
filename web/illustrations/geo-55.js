import { card, controls, formatNumber, keyIdea, lead, make, PALETTE, range, slot, svg, toggle } from "./kit.js";

const MODEL_RATIOS = [2, 3, 6];
const REAL_EDGE = 6; // metres

export function scaleFactors(lambda) { return { length: lambda, area: lambda ** 2, volume: lambda ** 3 }; }

export function mount(root) {
  const state = { lambda: 2, exploded: false, ratio: 3 };

  root.append(lead("Ha egy testet minden irányban λ-szorosára nagyítunk, vagyis minden hossza λ-szorosára nő, akkor az eredeti és a nagyított test hasonló. A felszín és a térfogat azonban nem λ-szorosára nő! Rakd ki a nagyított kockát egységkockákból, és számold meg."));

  const main = card("Kocka λ-szoros nagyítása");
  const lambdaSlider = range({ label: "λ (nagyítás)", min: 1, max: 4, value: state.lambda, onInput: (value) => { state.lambda = value; render(); } });
  const explode = toggle("Szedd szét a kockákat", false, () => { state.exploded = !state.exploded; render(); });
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 340", role: "img", "aria-label": "Az eredeti egységkocka és a λ-szorosra nagyított kocka" });
  const table = make("div", "il-formula start");
  main.append(controls(lambdaSlider.element, explode), figure, table);

  const model = card("Makett: kicsinyítés");
  const ratioButtons = MODEL_RATIOS.map((k) => toggle(`1 : ${k}`, k === state.ratio, () => { state.ratio = k; renderModel(); }));
  const modelLine = make("div", "il-formula start");
  model.append(make("p", "", `Egy ${REAL_EDGE} méter élű kocka alakú tartályról makettet készítünk. Mekkora festék- és mekkora vízmennyiség kell a makettnél?`), controls(make("span", "il-muted", "A makett mérete:"), ...ratioButtons), modelLine);
  root.append(main, model, keyIdea("hasonló testeknél, ha a hosszak aránya λ, akkor a felszínek aránya λ², a térfogatok aránya λ³. Kétszeres nagyításnál tehát a felszín 4-szeres, a térfogat 8-szoros lesz."));

  function render() {
    const { lambda, exploded } = state, n = lambda;
    explode.setAttribute("aria-pressed", String(exploded));
    figure.replaceChildren();
    const gap = exploded ? 0.45 : 0, extent = n * (1 + gap), cos = Math.cos(Math.PI / 6);
    const s = Math.min(44, 290 / (extent * 1.5 + 1)), ox = 380, baseline = 300;
    const at = (x, y, z, dx = ox) => [dx + (x + y - extent) * cos * s, baseline - (extent + 0.0) * 0.5 * s + ((x - y) * 0.5) * s - z * s + (n * 0) ];
    const position = (i) => i * (1 + gap);
    const poly = (points, color, dx) => svg("polygon", { points: points.map((p) => at(...p, dx).join(",")).join(" "), style: `fill:${color};stroke:var(--input);stroke-width:1.2;stroke-linejoin:round` }, figure);
    const cube = (x, y, z, dx, palette) => {
      poly([[x, y, z], [x + 1, y, z], [x + 1, y, z + 1], [x, y, z + 1]], palette[0], dx);
      poly([[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]], palette[1], dx);
      poly([[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], palette[2], dx);
    };
    cube(0, 0, 0, 120 - (1 - extent) * 0, [PALETTE.amber, "#c98a2b", "#f3c36f"]);
    for (let y = n - 1; y >= 0; y--) for (let x = 0; x < n; x++) for (let z = 0; z < n; z++) cube(position(x), position(y), position(z), ox, [PALETTE.blue, PALETTE.violet, PALETTE.green]);
    svg("text", { x: 120, y: 328, "text-anchor": "middle", text: "eredeti (él = 1)", style: "fill:var(--dim)" }, figure);
    svg("text", { x: ox, y: 328, "text-anchor": "middle", text: `nagyított (él = ${n})`, style: "fill:var(--dim)" }, figure);

    const f = scaleFactors(n);
    const row = (name, unit, before, after, factor, color) => [slot(name, 9, { align: "left" }), slot(`${before} → ${after} ${unit}`, 22, { align: "left" }), slot(make("b", "", factor), 12, { align: "left" })].map((x, i) => { if (i === 2) x.style.color = color; return x; });
    table.replaceChildren(
      ...row("hossz", "egység", 1, n, `× ${f.length}  (λ)`, "var(--accent)"), make("br"),
      ...row("felszín", "négyzet", 6, 6 * f.area, `× ${f.area}  (λ²)`, PALETTE.blue), make("br"),
      ...row("térfogat", "kocka", 1, f.volume, `× ${f.volume}  (λ³)`, PALETTE.violet),
    );
  }

  function renderModel() {
    const k = state.ratio;
    ratioButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(MODEL_RATIOS[i] === k)));
    const edge = REAL_EDGE / k, area = 6 * REAL_EDGE ** 2, volume = REAL_EDGE ** 3;
    const line = (label, real, unit, factorText, model) => [slot(label, 10, { align: "left" }), slot(`${formatNumber(real)} ${unit}`, 10, { align: "left" }), slot(`→ ${formatNumber(model, 3)} ${unit}`, 14, { align: "left" }), slot(factorText, 16, { align: "left" }), make("br")];
    modelLine.replaceChildren(
      ...line("él", REAL_EDGE, "m", `(1 : ${k})`, edge),
      ...line("felszín", area, "m²", `(1 : ${k * k})`, area / (k * k)),
      ...line("térfogat", volume, "m³", `(1 : ${k ** 3})`, volume / k ** 3),
    );
  }

  render();
  renderModel();
  return () => {};
}
