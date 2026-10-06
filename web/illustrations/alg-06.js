import { card, controls, createScope, formatNumber, fraction, gcd, keyIdea, lead, make, PALETTE, range, rich, slot, svg, toggle, withInstrumental } from "./kit.js";

const CELL = 34, GRID_LEFT = 14, GRID_TOP = 14;
const ORIGINAL_PRICE = 8000;
const EXAMPLES = [
  { key: "battery", label: "Akkumulátor", p: 60 },
  { key: "sale", label: "Leárazás", p: 25 },
];

export function mount(root) {
  const scope = createScope();
  const state = { p: 25, example: "battery" };

  root.append(lead("A százalék azt mondja meg, hogy az egészből hány századrész van meg. 1 % az egész századrésze, ezért 100 %-nál éppen az egész van meg. Ha tudod, hogy 100 négyzetből hányat színeztünk ki, tudod a százalékot."));

  const main = card("Színezd ki a százalékot");
  const slider = range({ label: "Hány százalék?", min: 0, max: 100, step: 1, value: state.p, format: (v) => `${v} %`, onInput: (v) => { state.p = v; render(); } });
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${GRID_LEFT * 2 + 10 * CELL} ${GRID_TOP * 2 + 10 * CELL}`, role: "img", style: "max-width:420px;margin:0 auto" });
  const cells = [];
  for (let i = 0; i < 100; i++) {
    const row = Math.floor(i / 10), column = i % 10;
    cells.push(svg("rect", { x: GRID_LEFT + column * CELL + 1.5, y: GRID_TOP + (9 - row) * CELL + 1.5, width: CELL - 3, height: CELL - 3, rx: 4, style: "transition:fill .2s" }, figure));
  }
  const forms = make("div", "il-formula");
  const message = make("p", "il-message");
  main.append(controls(slider.element), figure, forms, message);

  const examples = card("Hol találkozol vele?");
  const picker = controls(...EXAMPLES.map(({ key, label, p }) => toggle(label, key === state.example, () => { state.example = key; state.p = p; slider.set(p); render(); })));
  const scene = svg("svg", { class: "il-svg", viewBox: "0 0 600 170", role: "img" });
  const sceneMessage = make("p", "il-message");
  examples.append(picker, scene, sceneMessage);

  root.append(main, examples, keyIdea("p % azt jelenti, hogy p a századrész, azaz p/100. Ezért a százalék mindig átírható törtté (p/100) és tizedes törtté (p : 100), és a tört egyszerűsíthető: 25 % = 25/100 = 1/4."));

  function render() {
    const { p } = state;
    cells.forEach((cell, index) => { cell.style.fill = index < p ? PALETTE.blue : "var(--surface)"; cell.style.stroke = index < p ? "none" : "var(--line)"; });
    figure.setAttribute("aria-label", `100 négyzetből ${p} kiszínezve`);
    const divisor = gcd(p, 100) || 1;
    const simplified = [p / divisor, 100 / divisor];
    forms.replaceChildren(rich(
      slot(`${p} %`, 6), " = ", slot(fraction(p, 100, { wide: true }), 6), " = ", slot(formatNumber(p / 100), 5, { align: "left" }), " = ", slot(fraction(...simplified, { wide: true }), 6),
    ));
    message.textContent = p === 0 ? "0 % azt jelenti, hogy semmi sincs meg az egészből."
      : p === 100 ? "100 % = az egész. Mind a 100 négyzet színes."
      : divisor === 1 ? `${p} négyzet a 100-ból, ez ${p}/100. Tovább már nem egyszerűsíthető.`
      : `${p} négyzet a 100-ból, ez ${p}/100. Mindkét számot ${withInstrumental(divisor)} osztva ${simplified[0]}/${simplified[1]} lesz: az egésznek ugyanakkora része, csak egyszerűbb alakban.`;
    picker.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(EXAMPLES[i].key === state.example)));
    renderScene();
  }

  function renderScene() {
    const { p } = state;
    scene.replaceChildren();
    if (state.example === "battery") {
      svg("rect", { x: 40, y: 40, width: 260, height: 90, rx: 12, style: "fill:none;stroke:var(--fg-soft);stroke-width:4" }, scene);
      svg("rect", { x: 300, y: 68, width: 16, height: 34, rx: 4, style: "fill:var(--fg-soft)" }, scene);
      svg("rect", { x: 48, y: 48, width: (244 * p) / 100, height: 74, rx: 7, style: `fill:${p <= 20 ? PALETTE.red : PALETTE.green};transition:width .2s` }, scene);
      svg("text", { x: 170, y: 93, "text-anchor": "middle", text: `${p} %`, style: "font-size:22px;font-weight:700;fill:var(--fg)" }, scene);
      svg("text", { x: 350, y: 80, text: "A telefon akkumulátora", style: "font-size:15px;fill:var(--fg)" }, scene);
      svg("text", { x: 350, y: 104, text: `${p} % töltöttségnél a teljes töltés ${p}/100 része van meg.`, style: "font-size:13px" }, scene);
      sceneMessage.textContent = p <= 20 ? "Ez már kevés: a töltő keresésének ideje van." : `A teljes akkumulátor 100 %, az ábrán ennek a ${p} százaléka van megtöltve.`;
    } else {
      const discount = (ORIGINAL_PRICE * p) / 100;
      svg("path", { d: "M 40 30 H 240 L 280 85 L 240 140 H 40 Z", style: "fill:var(--surface);stroke:var(--fg-soft);stroke-width:3" }, scene);
      svg("circle", { cx: 66, cy: 85, r: 7, style: "fill:var(--input);stroke:var(--fg-soft);stroke-width:2" }, scene);
      svg("text", { x: 90, y: 72, text: `${formatNumber(ORIGINAL_PRICE)} Ft`, style: "font-size:20px;font-weight:700;fill:var(--dim)" }, scene);
      svg("line", { x1: 88, x2: 192, y1: 66, y2: 66, style: `stroke:${PALETTE.red};stroke-width:2.5` }, scene);
      svg("text", { x: 90, y: 112, text: `${formatNumber(ORIGINAL_PRICE - discount)} Ft`, style: `font-size:22px;font-weight:700;fill:${PALETTE.green}` }, scene);
      svg("text", { x: 320, y: 70, text: `−${p} % kedvezmény`, style: `font-size:18px;font-weight:700;fill:${PALETTE.red}` }, scene);
      svg("text", { x: 320, y: 100, text: `${formatNumber(ORIGINAL_PRICE)} Ft ${p}/100 része = ${formatNumber(discount)} Ft`, style: "font-size:13px" }, scene);
      sceneMessage.textContent = `A kedvezmény ${formatNumber(discount)} Ft, az új ár ${formatNumber(ORIGINAL_PRICE - discount)} Ft.`;
    }
  }

  render();
  return () => scope.clearAll();
}
