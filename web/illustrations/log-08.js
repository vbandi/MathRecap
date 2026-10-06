import { card, equation, keyIdea, lead, make, PALETTE, rich, svg, toggle, uniqueId } from "./kit.js";

const PROPERTIES = {
  even: { name: "páros", test: (n) => n % 2 === 0 },
  threes: { name: "3-mal osztható", test: (n) => n % 3 === 0 },
  prime: { name: "prímszám", test: (n) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d !== 0) },
  big: { name: "5-nél nagyobb", test: (n) => n > 5 },
  square: { name: "négyzetszám", test: (n) => Number.isInteger(Math.sqrt(n)) },
};
const UNIVERSES = [10, 20, 30];
const range = (max) => Array.from({ length: max }, (_, i) => i + 1);
const setText = (list) => `{ ${list.join("; ")} }`.replace("{  }", "∅");
const CHIP = 13;

function chipGroup(parent, n, scale = 1) {
  const group = svg("g", { class: "il-move", opacity: 0 }, parent);
  const circle = svg("circle", { r: CHIP * scale }, group);
  const text = svg("text", { "text-anchor": "middle", dy: 4.5, text: String(n) }, group);
  return { group, circle, text };
}
function paintChip(chip, highlighted) {
  chip.circle.setAttribute("style", highlighted ? "fill:var(--accent);stroke:none" : "fill:var(--surface);stroke:var(--line-strong)");
  chip.text.setAttribute("style", highlighted ? "fill:var(--accent-ink);font-weight:700" : "fill:var(--dim)");
}

export function mount(root) {
  root.append(lead("Ha azt kérdezzük, mi NEM páros, a válasz attól függ, miből válogatunk: az 1–10 számokból vagy az 1–30 számokból. Azt a halmazt, amiből válogatunk, alaphalmaznak nevezzük. A komplementer az alaphalmaz azon elemei, amelyek nincsenek A-ban."));
  root.append(complementCard(), differenceCard());
  root.append(keyIdea("a komplementer mindig egy alaphalmazhoz tartozik, enélkül nincs értelme. A különbség viszont nem szimmetrikus: A \\ B általában más, mint B \\ A."));
  return () => {};
}

function complementCard() {
  const state = { universe: 10, property: "even" };
  const section = card("Komplementer: mi marad az alaphalmazban?");
  const pickerU = make("div", "il-controls"), pickerA = make("div", "il-controls");
  const W = 620, H = 300, OVAL = { cx: 200, cy: 150, rx: 172, ry: 112 };
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Alaphalmaz téglalapja A halmaz ovális tartományával" });
  svg("rect", { x: 6, y: 6, width: W - 12, height: H - 12, rx: 10, style: "fill:none;stroke:var(--fg-soft);stroke-width:2" }, figure);
  svg("text", { x: W - 18, y: 28, "text-anchor": "end", "font-weight": 700, text: "alaphalmaz (U)" }, figure);
  svg("ellipse", { cx: OVAL.cx, cy: OVAL.cy, rx: OVAL.rx, ry: OVAL.ry, style: `fill:none;stroke:${PALETTE.violet};stroke-width:2.5` }, figure);
  svg("text", { x: OVAL.cx, y: OVAL.cy - OVAL.ry - 6, "text-anchor": "middle", "font-weight": 700, text: "A", style: `fill:${PALETTE.violet}` }, figure);
  const chips = new Map(range(30).map((n) => [n, chipGroup(figure, n)]));
  const lines = make("div");
  const note = make("p", "il-muted");
  section.append(make("div", "il-muted", "Alaphalmaz:"), pickerU, make("div", "il-muted", "Az A halmaz tagjai az alaphalmaz azon elemei, amelyek:"), pickerA, figure, lines, note);

  const slots = { inside: [], outside: [] };
  for (let y = 30; y < H - 16; y += 32) {
    for (let x = 28; x < W - 20; x += 34) {
      const r = Math.hypot((x - OVAL.cx) / OVAL.rx, (y - OVAL.cy) / OVAL.ry);
      const margin = CHIP / Math.min(OVAL.rx, OVAL.ry) + 0.06;
      if (Math.abs(r - 1) < margin + 0.04) continue;
      slots[r < 1 ? "inside" : "outside"].push({ x, y, r });
    }
  }
  slots.inside.sort((p, q) => p.r - q.r);
  slots.outside.sort((p, q) => Math.hypot(p.x - 500, p.y - 150) - Math.hypot(q.x - 500, q.y - 150));

  function render() {
    pickerU.replaceChildren(...UNIVERSES.map((max) => toggle(`U = 1–${max}`, state.universe === max, () => { state.universe = max; render(); })));
    pickerA.replaceChildren(...Object.entries(PROPERTIES).map(([id, p]) => toggle(p.name, state.property === id, () => { state.property = id; render(); })));
    const test = PROPERTIES[state.property].test;
    const universe = range(state.universe);
    const inA = universe.filter(test), outside = universe.filter((n) => !test(n));
    let a = 0, o = 0;
    for (const [n, chip] of chips) {
      if (n > state.universe) { chip.group.setAttribute("opacity", 0); continue; }
      const member = test(n);
      const slot = member ? slots.inside[a++] : slots.outside[o++];
      chip.group.setAttribute("opacity", 1);
      chip.group.style.transform = `translate(${slot.x}px, ${slot.y}px)`;
      paintChip(chip, !member);
    }
    lines.replaceChildren(
      equation("A", rich(make("span", "il-accent", setText(inA)))),
      equation("Ā", rich(make("span", "il-accent", setText(outside)))),
    );
    note.textContent = `Ā = U \\ A: minden, ami U-ban van, de A-ban nincs. Állítsd át az alaphalmazt: ugyanaz a tulajdonság más komplementert ad (most ${outside.length} elem van benne).`;
  }
  render();
  return section;
}

function differenceCard() {
  const state = { a: "even", b: "threes", shown: "AB" };
  const section = card("Különbség: A \\ B és B \\ A");
  const UNIVERSE = range(12), W = 600, H = 330, R = 122, CA = { x: 245, y: 165 }, CB = { x: 355, y: 165 };
  const clipId = uniqueId("diff-clip"), maskId = uniqueId("diff-mask");
  const pickerA = make("div", "il-controls"), pickerB = make("div", "il-controls"), pickerShown = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Két halmaz különbsége" });
  const defs = svg("defs", {}, figure);
  svg("circle", { cx: CA.x, cy: CA.y, r: R }, svg("clipPath", { id: clipId }, defs));
  const mask = svg("mask", { id: maskId }, defs);
  const shade = svg("g", { class: "il-fade" }, figure);
  svg("circle", { cx: CA.x, cy: CA.y, r: R, fill: "none", stroke: PALETTE.violet, "stroke-width": 2.5 }, figure);
  svg("circle", { cx: CB.x, cy: CB.y, r: R, fill: "none", stroke: PALETTE.blue, "stroke-width": 2.5 }, figure);
  const labelA = svg("text", { x: CA.x - 100, y: 34, "font-weight": 700, style: `fill:${PALETTE.violet}` }, figure);
  const labelB = svg("text", { x: CB.x + 100, y: 34, "text-anchor": "end", "font-weight": 700, style: `fill:${PALETTE.blue}` }, figure);
  const chips = new Map(UNIVERSE.map((n) => [n, chipGroup(figure, n)]));
  const lines = make("div");
  const note = make("p", "il-message");
  section.append(make("div", "il-muted", "A halmaz:"), pickerA, make("div", "il-muted", "B halmaz:"), pickerB, pickerShown, figure, lines, note);

  const d = (p, c) => Math.hypot(p.x - c.x, p.y - c.y);
  const slots = { onlyA: [], both: [], onlyB: [], outside: [] };
  for (let y = 26; y <= H - 20; y += 30) {
    for (let x = 24; x <= W - 20; x += 30) {
      const p = { x, y }, dA = d(p, CA), dB = d(p, CB);
      if (Math.abs(dA - R) < CHIP + 2 || Math.abs(dB - R) < CHIP + 2) continue;
      slots[dA < R && dB < R ? "both" : dA < R ? "onlyA" : dB < R ? "onlyB" : "outside"].push(p);
    }
  }
  const anchors = { onlyA: { x: 175, y: 165 }, both: { x: 300, y: 165 }, onlyB: { x: 425, y: 165 }, outside: { x: 300, y: 330 } };
  for (const [k, list] of Object.entries(slots)) list.sort((p, q) => d(p, anchors[k]) - d(q, anchors[k]));

  function render() {
    const pick = (target, key, color) => target.replaceChildren(...Object.entries(PROPERTIES).map(([id, p]) => toggle(p.name, state[key] === id, () => { state[key] = id; render(); }, color)));
    pick(pickerA, "a", PALETTE.violet);
    pick(pickerB, "b", PALETTE.blue);
    pickerShown.replaceChildren(toggle("A \\ B", state.shown === "AB", () => { state.shown = "AB"; render(); }), toggle("B \\ A", state.shown === "BA", () => { state.shown = "BA"; render(); }));
    const inA = (n) => PROPERTIES[state.a].test(n), inB = (n) => PROPERTIES[state.b].test(n);
    const aMinusB = UNIVERSE.filter((n) => inA(n) && !inB(n)), bMinusA = UNIVERSE.filter((n) => inB(n) && !inA(n));
    const shown = state.shown === "AB" ? aMinusB : bMinusA;
    labelA.textContent = `A: ${PROPERTIES[state.a].name}`;
    labelB.textContent = `B: ${PROPERTIES[state.b].name}`;

    // Shaded region: one circle minus the other, drawn with a mask.
    mask.replaceChildren(svg("rect", { x: 0, y: 0, width: W, height: H, fill: "#fff" }));
    const keep = state.shown === "AB" ? CA : CB, remove = state.shown === "AB" ? CB : CA;
    svg("circle", { cx: remove.x, cy: remove.y, r: R, fill: "#000" }, mask);
    shade.replaceChildren(svg("circle", { cx: keep.x, cy: keep.y, r: R, mask: `url(#${maskId})`, style: "fill:var(--accent);opacity:.3" }));

    const used = { onlyA: 0, both: 0, onlyB: 0, outside: 0 };
    for (const n of UNIVERSE) {
      const region = inA(n) && inB(n) ? "both" : inA(n) ? "onlyA" : inB(n) ? "onlyB" : "outside";
      const slot = slots[region][used[region]++];
      const chip = chips.get(n);
      chip.group.setAttribute("opacity", 1);
      chip.group.style.transform = `translate(${slot.x}px, ${slot.y}px)`;
      paintChip(chip, shown.includes(n));
    }
    const line = (label, list, active) => {
      const element = equation(label, rich(make("span", active ? "il-accent" : "", setText(list))));
      element.style.opacity = active ? 1 : 0.55;
      return element;
    };
    lines.replaceChildren(line("A \\ B", aMinusB, state.shown === "AB"), line("B \\ A", bMinusA, state.shown === "BA"));
    const same = aMinusB.join() === bMinusA.join();
    note.textContent = same ? "Itt a két különbség történetesen egyforma (mindkettő üres), de ez ritka." : "A két különbség más: A \\ B azokat veszi, amik A-ban vannak, de B-ben nincsenek, B \\ A pedig fordítva. A sorrend számít!";
  }
  render();
  return section;
}
