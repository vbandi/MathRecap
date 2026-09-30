import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const EXAMPLES = [
  [["x", 2], ["one", 3], ["x", 1], ["one", -1], ["sq", 1]],
  [["sq", 2], ["x", -3], ["one", 4], ["x", 1], ["sq", -1], ["one", -2]],
];
const SIZE = { sq: [46, 46], x: [46, 16], one: [16, 16] };
const COLOR = { sq: PALETTE.green, x: PALETTE.blue, one: PALETTE.amber };
const NEGATIVE_COLOR = PALETTE.red;
const SUFFIX = { sq: "x²", x: "x", one: "" };
const ORDER = ["sq", "x", "one"];

// Term text of a polynomial given as coefficients per tile type, highest degree first.
function polynomialText(coefficients, list = ORDER) {
  const parts = [];
  for (const type of list) {
    const c = coefficients[type];
    if (!c) continue;
    const body = type === "one" ? String(Math.abs(c)) : `${Math.abs(c) === 1 ? "" : Math.abs(c)}${SUFFIX[type]}`;
    parts.push(parts.length ? ` ${c < 0 ? "−" : "+"} ${body}` : `${c < 0 ? "−" : ""}${body}`);
  }
  return parts.join("") || "0";
}

function expressionText(terms) {
  return terms.map(([type, c], index) => {
    const body = type === "one" ? String(Math.abs(c)) : `${Math.abs(c) === 1 ? "" : Math.abs(c)}${SUFFIX[type]}`;
    return index ? ` ${c < 0 ? "−" : "+"} ${body}` : `${c < 0 ? "−" : ""}${body}`;
  }).join("");
}

function buildTiles(terms) {
  const tiles = [];
  let seed = 7;
  const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (const [type, coefficient] of terms) {
    for (let i = 0; i < Math.abs(coefficient); i++) {
      tiles.push({ type, sign: Math.sign(coefficient), removed: false, pile: { x: 20 + random() * 500, y: 10 + random() * 100, rotation: (random() - 0.5) * 80 } });
    }
  }
  return tiles;
}

// Slot positions for the sorted layout: each type has a positive and a negative column, so pairs line up in rows.
function sortedPosition(tile, index) {
  if (tile.type === "sq") return { x: 20 + (index % 3) * 54, y: tile.sign > 0 ? 18 : 82, rotation: 0 };
  if (tile.type === "x") return { x: tile.sign > 0 ? 230 : 290, y: 18 + index * 20, rotation: 0 };
  return { x: (tile.sign > 0 ? 410 : 500) + Math.floor(index / 6) * 20, y: 18 + (index % 6) * 20, rotation: 0 };
}

export function mount(root) {
  const scope = createScope();
  const state = { example: 0, phase: 0, tiles: [], busy: false };

  root.append(lead("Az egynemű tagok betűs része azonos, például x és 3x. Ilyen tagokat össze lehet vonni, mint az egyforma alakú lapokat. Az algebrai lapkák ezt mutatják: az x² négyzet, az x téglalap, az 1 pedig egy kis négyzet. A piros lapka a negatív."));

  const main = card("Lapkák összevonása");
  const picker = controls(...EXAMPLES.map((terms, index) => toggle(expressionText(terms), index === 0, () => { state.example = index; reset(); })));
  const expressionLine = make("div", "il-formula");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 150", role: "img" });
  const mergeButton = button("Összevonás", merge);
  const tryButton = button("Próbáld: x és x² egy csoportba", tryCombine, { ghost: true });
  const resetButton = button("Újra", reset, { ghost: true });
  const message = make("p", "il-message");
  main.append(picker, expressionLine, figure, controls(mergeButton, tryButton, resetButton), message);

  root.append(main, keyIdea("csak az egynemű tagok vonhatók össze: az x-ek az x-ekkel, az 1-esek az 1-esekkel, az x²-ek az x²-ekkel. Az ellentétes előjelű párok kiesnek (x + (−x) = 0). Az x és az x² más alakú, ezért az összegük marad két tag."));

  let groups = [];

  function expectedCoefficients() {
    const c = { sq: 0, x: 0, one: 0 };
    for (const [type, value] of EXAMPLES[state.example]) c[type] += value;
    return c;
  }

  function reset() {
    scope.clearAll();
    state.phase = 0; state.busy = false;
    state.tiles = buildTiles(EXAMPLES[state.example]);
    picker.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === state.example)));
    figure.replaceChildren();
    groups = state.tiles.map((tile) => {
      const [w, h] = SIZE[tile.type];
      const group = svg("g", { class: "il-move" }, figure);
      svg("rect", { width: w, height: h, rx: 3, style: `fill:${tile.sign > 0 ? COLOR[tile.type] : NEGATIVE_COLOR};stroke:var(--input);stroke-width:1.5` }, group);
      if (tile.type !== "one") svg("text", { x: w / 2, y: h / 2 + 4, "text-anchor": "middle", text: `${tile.sign < 0 ? "−" : ""}${SUFFIX[tile.type]}`, style: "fill:#fff;font-weight:700;font-size:13px" }, group);
      return group;
    });
    place();
    expressionLine.textContent = expressionText(EXAMPLES[state.example]);
    message.className = "il-message";
    message.textContent = "Kupacban vannak a lapkák. Az Összevonás gomb csoportosítja, majd kiejti az ellentétes párokat.";
    mergeButton.disabled = false; tryButton.disabled = false;
  }

  function place() {
    const counters = {};
    state.tiles.forEach((tile, index) => {
      const key = `${tile.type}${tile.sign}`;
      const slotIndex = counters[key] ?? 0;
      if (!(state.phase >= 3 && tile.removed)) counters[key] = slotIndex + 1;
      const target = state.phase === 0 ? tile.pile : sortedPosition(tile, slotIndex);
      groups[index].style.transform = `translate(${target.x}px, ${target.y}px) rotate(${target.rotation}deg)`;
      groups[index].style.opacity = tile.removed ? 0 : 1;
    });
  }

  function merge() {
    if (state.busy || state.phase > 0) return;
    state.busy = true;
    mergeButton.disabled = true; tryButton.disabled = true;
    state.phase = 1;
    place();
    message.textContent = "Először rendezzük: az azonos alakú lapkák kerülnek egymás mellé.";
    scope.timeout(() => {
      state.phase = 2;
      for (const type of ORDER) {
        const positives = state.tiles.filter((t) => t.type === type && t.sign > 0), negatives = state.tiles.filter((t) => t.type === type && t.sign < 0);
        for (let i = 0; i < Math.min(positives.length, negatives.length); i++) { positives[i].removed = true; negatives[i].removed = true; }
      }
      place();
      const removed = state.tiles.filter((t) => t.removed).length / 2;
      message.textContent = removed ? `Az ellentétes párok (egy piros és egy nem piros azonos alakú lapka) összege 0, ezért kiesnek: ${removed} pár.` : "Nincs ellentétes pár, semmi sem esik ki.";
    }, 1500);
    scope.timeout(() => {
      state.phase = 3;
      place();
      expressionLine.textContent = `${expressionText(EXAMPLES[state.example])} = ${polynomialText(expectedCoefficients())}`;
      message.className = "il-message good";
      message.textContent = "A megmaradt lapkák adják az összevont alakot. Az x² és az x külön marad, mert nem egyforma alakúak.";
      state.busy = false;
    }, 3300);
  }

  function tryCombine() {
    const squares = groups.filter((_, i) => state.tiles[i].type === "sq" && !state.tiles[i].removed);
    const xs = groups.filter((_, i) => state.tiles[i].type === "x" && !state.tiles[i].removed);
    for (const group of [...squares, ...xs]) group.firstChild.style.stroke = PALETTE.pink;
    scope.timeout(() => groups.forEach((group) => { group.firstChild.style.stroke = ""; }), 1800);
    message.className = "il-message warn";
    message.textContent = "Nem megy: az x² négyzet, az x téglalap, nincs olyan oldaluk, amely mindkettőn egyformán illeszkedne. Ezért x² + x nem vonható össze egyetlen taggá.";
  }

  reset();
  return () => scope.clearAll();
}
