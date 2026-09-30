import { card, keyIdea, lead, make, PALETTE, svg, toggle, uniqueId } from "./kit.js";

const OPERATIONS = [
  { label: "A ∧ B", fn: (a, b) => a && b, set: "A ∩ B", set_name: "metszet", logic_name: "és", text: "Metszet ⟷ „és”: a közös rész azokból áll, akikre A is és B is igaz." },
  { label: "A ∨ B", fn: (a, b) => a || b, set: "A ∪ B", set_name: "unió", logic_name: "vagy", text: "Unió ⟷ „vagy”: a két kör együtt azokból áll, akikre A vagy B (vagy mindkettő) igaz." },
  { label: "¬A", fn: (a) => !a, set: "Ā", set_name: "komplementer", logic_name: "nem", text: "Komplementer ⟷ „nem”: minden, ami az A körön kívül van (az alaphalmazon belül)." },
  { label: "A ∧ ¬B", fn: (a, b) => a && !b, set: "A \\ B", set_name: "különbség", logic_name: "és nem", text: "Különbség ⟷ „és nem”: az A kör azon része, amely a B körön kívül esik." },
];
const ROWS = [{ a: true, b: true, key: "AB", tag: "A ∩ B" }, { a: true, b: false, key: "A", tag: "A \\ B" }, { a: false, b: true, key: "B", tag: "B \\ A" }, { a: false, b: false, key: "", tag: "kívül" }];
const CA = { x: 185, y: 135 }, CB = { x: 295, y: 135 }, R = 90, W = 480, H = 270;
const TAG_POSITIONS = { AB: { x: 240, y: 140 }, A: { x: 140, y: 140 }, B: { x: 340, y: 140 }, "": { x: 240, y: 252 } };
const word = (value) => (value ? "I" : "H");

export function mount(root) {
  const state = { operation: 0, hover: null };
  const ids = { clipA: uniqueId("clip"), clipB: uniqueId("clip") };

  root.append(lead("A halmazok és az állítások ugyanazt a „nyelvet” beszélik. Az A halmaz azok a dolgok, amikre az A állítás igaz. Ezért minden halmazművelet megfelel egy logikai műveletnek, és a Venn-diagram régiói az igazságtábla soraival egyeznek."));

  const play = card("Venn-diagram és igazságtábla");
  const picker = make("div", "il-controls");
  const layout = make("div");
  layout.style.cssText = "display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start";
  const left = make("div"), right = make("div");
  left.style.cssText = "flex:1 1 320px;min-width:0";
  right.style.cssText = "flex:1 1 260px;min-width:0";
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Két halmaz Venn-diagramja" });
  const defs = svg("defs", {}, figure);
  svg("circle", { cx: CA.x, cy: CA.y, r: R }, svg("clipPath", { id: ids.clipA }, defs));
  svg("circle", { cx: CB.x, cy: CB.y, r: R }, svg("clipPath", { id: ids.clipB }, defs));
  svg("rect", { x: 4, y: 4, width: W - 8, height: H - 8, rx: 10, style: "fill:none;stroke:var(--fg-soft);stroke-width:1.5" }, figure);
  const regions = ROWS.map((row) => {
    const maskId = uniqueId("mask");
    const mask = svg("mask", { id: maskId }, defs);
    svg("rect", { x: 0, y: 0, width: W, height: H, fill: "#fff" }, mask);
    if (!row.a) svg("circle", { cx: CA.x, cy: CA.y, r: R, fill: "#000" }, mask);
    if (!row.b) svg("circle", { cx: CB.x, cy: CB.y, r: R, fill: "#000" }, mask);
    let parent = figure;
    if (row.a) parent = svg("g", { "clip-path": `url(#${ids.clipA})` }, parent);
    if (row.b) parent = svg("g", { "clip-path": `url(#${ids.clipB})` }, parent);
    const shape = svg("rect", { x: 0, y: 0, width: W, height: H, mask: `url(#${maskId})`, style: "fill:var(--accent);fill-opacity:0;pointer-events:none;transition:fill-opacity .2s" }, parent);
    return shape;
  });
  // Hit-testing by geometry: masks do not affect pointer events, so the region is computed from the pointer position.
  figure.addEventListener("mousemove", (event) => {
    const point = figure.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    const { x, y } = point.matrixTransform(figure.getScreenCTM().inverse());
    const inA = Math.hypot(x - CA.x, y - CA.y) < R, inB = Math.hypot(x - CB.x, y - CB.y) < R;
    const key = `${inA ? "A" : ""}${inB ? "B" : ""}`;
    if (state.hover !== key) { state.hover = key; paint(); }
  });
  figure.addEventListener("mouseleave", () => { state.hover = null; paint(); });
  svg("circle", { cx: CA.x, cy: CA.y, r: R, style: `fill:none;stroke:${PALETTE.violet};stroke-width:2.5;pointer-events:none` }, figure);
  svg("circle", { cx: CB.x, cy: CB.y, r: R, style: `fill:none;stroke:${PALETTE.blue};stroke-width:2.5;pointer-events:none` }, figure);
  svg("text", { x: CA.x - 60, y: 24, "font-weight": 700, text: "A", style: `fill:${PALETTE.violet};pointer-events:none` }, figure);
  svg("text", { x: CB.x + 60, y: 24, "font-weight": 700, "text-anchor": "end", text: "B", style: `fill:${PALETTE.blue};pointer-events:none` }, figure);
  ROWS.forEach((row) => svg("text", { x: TAG_POSITIONS[row.key].x, y: TAG_POSITIONS[row.key].y, "text-anchor": "middle", text: row.tag, style: "font-size:12px;pointer-events:none" }, figure));

  const table = make("table", "il-table");
  const head = make("tr");
  const headers = ["A", "B", ...OPERATIONS.map((o) => o.label)];
  headers.forEach((h) => { const th = make("th", "", h); th.style.cssText = "width:auto;text-align:center;padding:4px 10px;white-space:nowrap"; head.append(th); });
  table.append(head);
  const tableRows = ROWS.map((row) => {
    const tr = make("tr");
    [row.a, row.b, ...OPERATIONS.map((o) => o.fn(row.a, row.b))].forEach((value) => { const td = make("td", "", word(value)); td.style.cssText = "width:auto;text-align:center;padding:4px 10px"; tr.append(td); });
    tr.addEventListener("mouseenter", () => { state.hover = row.key; paint(); });
    tr.addEventListener("mouseleave", () => { state.hover = null; paint(); });
    table.append(tr);
    return tr;
  });
  const correspondence = make("p", "il-message");
  const pairs = make("div");
  pairs.style.cssText = "margin-top:10px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--input);color:var(--fg-soft);line-height:1.8";
  ["metszet ∩ ⟷ és ∧", "unió ∪ ⟷ vagy ∨", "komplementer Ā ⟷ nem ¬"].forEach((text) => pairs.append(make("div", "", text)));
  left.append(figure);
  right.append(table, pairs);
  layout.append(left, right);
  play.append(picker, layout, correspondence, make("p", "il-muted", "Vidd az egeret a diagram egy része vagy a tábla egy sora fölé: a kettő összetartozik. (I = igaz, H = hamis.)"));
  root.append(play, keyIdea("a metszet az „és”, az unió a „vagy”, a komplementer a „nem”. A Venn-diagram egy régiója és az igazságtábla egy sora ugyanazt az esetet írja le."));

  function paint() {
    const op = OPERATIONS[state.operation];
    picker.replaceChildren(...OPERATIONS.map((o, i) => toggle(`${o.label}  (${o.set_name})`, state.operation === i, () => { state.operation = i; paint(); })));
    ROWS.forEach((row, i) => {
      const on = op.fn(row.a, row.b), hover = state.hover === row.key;
      regions[i].style.fillOpacity = on ? (hover ? 0.65 : 0.4) : hover ? 0.15 : 0;
      const tr = tableRows[i];
      tr.style.background = hover ? "color-mix(in srgb, var(--fg) 14%, transparent)" : "";
      [...tr.children].forEach((td, c) => {
        const selected = c === state.operation + 2;
        td.style.color = selected ? (on ? "var(--accent)" : "var(--fg-soft)") : "";
        td.style.fontWeight = selected ? "700" : "";
        td.style.background = selected && on ? "color-mix(in srgb, var(--accent) 22%, transparent)" : "";
      });
    });
    [...head.children].forEach((th, c) => { th.style.color = c === state.operation + 2 ? "var(--accent)" : ""; });
    correspondence.textContent = `${op.set} ⟷ ${op.label}. ${op.text}`;
  }

  paint();
  return () => {};
}
