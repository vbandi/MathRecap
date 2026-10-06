import { button, card, controls, createScope, equation, gcd, keyIdea, lead, make, PALETTE, rich, slot, stepper, svg, toggle, withInstrumental } from "./kit.js";

const PRESETS = [[6, 9], [8, 12], [10, 15], [5, 7]];

export function mount(root) {
  const scope = createScope();
  const state = { k: 3, c: 4, split: false, preset: 0, height: 1 };

  root.append(lead("Egy téglalap területét kétféleképpen is kiszámolhatod: egyben, vagy részekre vágva. Ebből jön a zárójel felbontása, és ugyanez visszafelé a kiemelés, amikor egy összegből kivesszük a közös szorzót."));

  // --- Expanding ---
  const expand = card("Zárójel felbontása: k · (x + c)");
  const kControl = stepper({ label: "k (a téglalap magassága)", min: 1, max: 5, value: state.k, onChange: (v) => { state.k = v; renderExpand(); } });
  const cControl = stepper({ label: "c (az állandó rész)", min: 1, max: 6, value: state.c, onChange: (v) => { state.c = v; renderExpand(); } });
  const splitButton = button("Vágd ketté", () => { state.split = !state.split; renderExpand(); }, { ghost: true });
  const expandFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 190", role: "img" });
  const expandLine = make("div");
  expand.append(controls(kControl.element, cControl.element, splitButton), expandFigure, expandLine);

  // --- Factoring out ---
  const factor = card("Kiemelés: melyik közös szorzót vehetjük ki?");
  const presetPicker = controls(...PRESETS.map(([a, b], index) => toggle(`${a}x + ${b}`, index === 0, () => { state.preset = index; state.height = 1; renderFactor(); })));
  const heightPicker = make("div", "il-controls");
  const factorFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 200", role: "img" });
  const factorLine = make("div");
  const factorMessage = make("p", "il-message");
  factor.append(make("p", "", "Válassz egy magasságot. A téglalap csak akkor áll össze hézagmentesen, ha a magasság mindkét tagot egyenletesen felosztja, vagyis mindkettőnek osztója."), presetPicker, heightPicker, factorFigure, factorLine, factorMessage);

  root.append(expand, factor, keyIdea("k · (x + c) = k · x + k · c: a zárójel felbontásakor a számmal minden tagot megszorzunk. A kiemelés ennek a fordítottja, és a legnagyobb közös osztó (LNKO) kiemelésével kapod a legegyszerűbb alakot."));

  function renderExpand() {
    const { k, c, split } = state;
    const row = 28, xWidth = 170, unit = 28, gap = split ? 22 : 0, left = 40, top = 34;
    expandFigure.replaceChildren();
    svg("rect", { x: left, y: top, width: xWidth, height: k * row, rx: 3, style: `fill:${PALETTE.green};stroke:var(--input);stroke-width:2` }, expandFigure);
    svg("text", { x: left + xWidth / 2, y: top + (k * row) / 2 + 6, "text-anchor": "middle", text: `${k === 1 ? "" : k}x`, style: "fill:#fff;font-weight:700;font-size:18px" }, expandFigure);
    for (let i = 0; i < c; i++) for (let j = 0; j < k; j++) {
      svg("rect", { x: left + xWidth + gap + i * unit, y: top + j * row, width: unit, height: row, rx: 2, style: `fill:${PALETTE.amber};stroke:var(--input);stroke-width:2` }, expandFigure);
    }
    svg("text", { x: left + xWidth / 2, y: top - 10, "text-anchor": "middle", text: "x", style: "font-weight:700;fill:var(--fg)" }, expandFigure);
    svg("text", { x: left + xWidth + gap + (c * unit) / 2, y: top - 10, "text-anchor": "middle", text: String(c), style: "font-weight:700;fill:var(--fg)" }, expandFigure);
    svg("text", { x: left - 10, y: top + (k * row) / 2 + 5, "text-anchor": "end", text: String(k), style: "font-weight:700;fill:var(--fg)" }, expandFigure);
    svg("text", { x: left + xWidth + gap + (c * unit) / 2, y: top + k * row + 24, "text-anchor": "middle", text: `${k} · ${c} = ${k * c}`, style: `fill:${PALETTE.amber};font-weight:700` }, expandFigure);
    splitButton.textContent = split ? "Illeszd össze" : "Vágd ketté";
    expandLine.replaceChildren(equation(
      rich(slot(k, 2), " · (x + ", slot(c, 2), ")"),
      rich(slot(k === 1 ? "x" : `${k}x`, 3, { align: "left" }), " + ", slot(k * c, 3, { align: "left" })),
    ));
  }

  function renderFactor() {
    const [a, b] = PRESETS[state.preset];
    const best = gcd(a, b), { height } = state;
    presetPicker.querySelectorAll("button").forEach((btn, i) => btn.setAttribute("aria-pressed", String(i === state.preset)));
    heightPicker.replaceChildren(make("span", "il-muted", "Magasság:"), ...Array.from({ length: 9 }, (_, i) => i + 1).map((h) => {
      const valid = a % h === 0 && b % h === 0;
      const t = toggle(String(h), h === height, () => { state.height = h; renderFactor(); }, valid ? PALETTE.green : undefined);
      if (valid) t.style.borderColor = PALETTE.green;
      return t;
    }));
    factorFigure.replaceChildren();
    const valid = a % height === 0 && b % height === 0;
    const row = 20, xCol = 30, unitCol = 12, left = 20, top = 20;
    if (valid) {
      const xCols = a / height, unitCols = b / height;
      for (let j = 0; j < height; j++) {
        for (let i = 0; i < xCols; i++) svg("rect", { x: left + i * xCol, y: top + j * row, width: xCol, height: row, rx: 2, style: `fill:${PALETTE.green};stroke:var(--input);stroke-width:2` }, factorFigure);
        for (let i = 0; i < unitCols; i++) svg("rect", { x: left + xCols * xCol + i * unitCol, y: top + j * row, width: unitCol, height: row, rx: 2, style: `fill:${PALETTE.amber};stroke:var(--input);stroke-width:2` }, factorFigure);
      }
      svg("text", { x: left - 6 + 0, y: top + (height * row) / 2 + 5, "text-anchor": "end", text: String(height), style: "font-weight:700;fill:var(--fg)" }, factorFigure);
      svg("text", { x: left + (xCols * xCol) / 2, y: top + height * row + 20, "text-anchor": "middle", text: `${xCols}x`, style: `font-weight:700;fill:${PALETTE.green}` }, factorFigure);
      svg("text", { x: left + xCols * xCol + (unitCols * unitCol) / 2, y: top + height * row + 20, "text-anchor": "middle", text: String(unitCols), style: `font-weight:700;fill:${PALETTE.amber}` }, factorFigure);
    } else {
      svg("text", { x: 300, y: 100, "text-anchor": "middle", text: `${height} magasságú téglalap nem áll össze`, style: `fill:${PALETTE.red};font-weight:700;font-size:16px` }, factorFigure);
    }
    const inside = `${a / height === 1 ? "" : a / height}x + ${b / height}`;
    factorLine.replaceChildren(equation(rich(`${a}x + ${b}`), valid ? rich(`${height} · (${inside})`) : rich("?"), "="));
    factorMessage.className = `il-message ${valid && height === best ? "good" : valid ? "" : "warn"}`;
    factorMessage.textContent = valid
      ? height === best ? `${height} a legnagyobb olyan szám, amely mind ${a}, mind ${b} osztója: ez a legnagyobb közös osztó (LNKO). Ennyit kell kiemelni.` : `Ez is jó, de még nagyobb közös osztó is van (${best}), így a zárójelben lévő kifejezés még tovább egyszerűsíthető.`
      : `${a % height ? a : b} nem osztható ${withInstrumental(height)} maradék nélkül, így nem lehet hézagmentesen felosztani.`;
  }

  renderExpand();
  renderFactor();
  return () => scope.clearAll();
}
