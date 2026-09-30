import { button, card, controls, createScope, equation, keyIdea, lead, make, PALETTE, rich, svg, toggle } from "./kit.js";

const COLOURS = { red: { name: "piros", fill: PALETTE.red }, blue: { name: "kék", fill: PALETTE.blue }, green: { name: "zöld", fill: PALETTE.green } };
const SHAPES = { circle: "kör", square: "négyzet", triangle: "háromszög" };
const OBJECTS = [
  { id: "a", shape: "circle", colour: "red", big: true },
  { id: "b", shape: "circle", colour: "blue", big: false },
  { id: "c", shape: "square", colour: "red", big: false },
  { id: "d", shape: "square", colour: "blue", big: true },
  { id: "e", shape: "triangle", colour: "green", big: true },
  { id: "f", shape: "circle", colour: "green", big: true },
  { id: "g", shape: "triangle", colour: "red", big: false },
  { id: "h", shape: "square", colour: "green", big: false },
  { id: "i", shape: "triangle", colour: "blue", big: true },
  { id: "j", shape: "circle", colour: "red", big: false },
  { id: "k", shape: "square", colour: "red", big: true },
  { id: "l", shape: "circle", colour: "blue", big: true },
];
const RULES = [
  { name: "piros", test: (o) => o.colour === "red" },
  { name: "kör", test: (o) => o.shape === "circle" },
  { name: "nagy és kék", test: (o) => o.big && o.colour === "blue" },
];
const CELL = 68;
const poolSlot = (index) => ({ x: 14 + (index % 4) * CELL + CELL / 2, y: 30 + Math.floor(index / 4) * 88 + 36 });
const boxSlot = (index) => ({ x: 332 + (index % 4) * CELL + CELL / 2, y: 62 + Math.floor(index / 4) * 88 + 30 });

export function mount(root) {
  const scope = createScope();
  const state = { rule: 0, inBox: new Set(), order: [], checked: false, showOrder: false };

  root.append(lead("Halmaz az, amiben egyértelmű, hogy valami beletartozik-e vagy sem. Válogasd be a dobozba azokat az alakzatokat, amelyekre igaz a szabály. Amit beválogatsz, azok a halmaz elemei."));

  const play = card("Válogatás");
  const rulePicker = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 620 330", role: "img", "aria-label": "Alakzatok és egy halmazt jelölő doboz" });
  svg("text", { x: 14, y: 22, "font-weight": 700, text: "Minden alakzat" }, figure);
  svg("rect", { x: 320, y: 36, width: 288, height: 280, rx: 18, style: "fill:none;stroke:var(--accent);stroke-width:2.5;stroke-dasharray:7 5" }, figure);
  const boxLabel = svg("text", { x: 332, y: 58, "font-weight": 700, style: "fill:var(--accent)" }, figure);
  const shapes = new Map(OBJECTS.map((object, index) => {
    const group = svg("g", { class: "il-move il-item", role: "button", tabindex: 0, "aria-label": `${object.id} alakzat` }, figure);
    const hit = svg("rect", { x: -31, y: -38, width: 62, height: 76, rx: 10, style: "fill:transparent;stroke:transparent;stroke-width:2.5" }, group);
    const size = object.big ? 20 : 12;
    const style = `fill:${COLOURS[object.colour].fill}`;
    if (object.shape === "circle") svg("circle", { cx: 0, cy: -6, r: size, style }, group);
    else if (object.shape === "square") svg("rect", { x: -size, y: -6 - size, width: 2 * size, height: 2 * size, rx: 3, style }, group);
    else svg("polygon", { points: `0,${-6 - size - 2} ${size + 3},${-6 + size} ${-size - 3},${-6 + size}`, style }, group);
    svg("text", { y: 32, "text-anchor": "middle", "font-weight": 700, text: object.id }, group);
    const toggleMembership = () => { state.checked = false; state.inBox.has(object.id) ? state.inBox.delete(object.id) : state.inBox.add(object.id); render(); };
    group.addEventListener("click", toggleMembership);
    group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleMembership(); } });
    return [object.id, { group, hit, object, index }];
  }));
  const message = make("p", "il-message");
  const setLine = make("div");
  play.append(rulePicker, figure, message, controls(button("Ellenőrzés", check), button("Kiürítés", () => { state.inBox.clear(); state.checked = false; render(); }, { ghost: true })), make("p", "il-muted", "Kattints egy alakzatra, hogy a dobozba tedd, vagy onnan kivedd."));

  const writing = card("A halmaz leírása");
  const orderNote = make("p", "il-muted");
  writing.append(setLine, controls(toggle("Számít a sorrend és az ismétlés?", false, (event) => { state.showOrder = !state.showOrder; event.currentTarget.setAttribute("aria-pressed", String(state.showOrder)); render(); })), orderNote);
  root.append(play, writing, keyIdea("a halmazt az elemei adják meg — az számít, hogy egy dolog benne van-e, az nem, hogy hányszor vagy milyen sorrendben írjuk fel."));

  const isMember = (object) => RULES[state.rule].test(object);
  function check() {
    state.checked = true;
    render();
  }

  function render() {
    rulePicker.replaceChildren(make("span", "il-muted", "Szabály:"), ...RULES.map((rule, index) => toggle(rule.name, state.rule === index, () => { state.rule = index; state.inBox.clear(); state.checked = false; render(); })));
    boxLabel.textContent = `A halmaz: „${RULES[state.rule].name}”`;
    const wrongIn = [], missing = [];
    let poolIndex = 0, boxIndex = 0;
    for (const { object, group, hit } of shapes.values()) {
      const inBox = state.inBox.has(object.id);
      const pos = inBox ? boxSlot(boxIndex++) : poolSlot(poolIndex++);
      group.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      const wrong = inBox && !isMember(object), absent = !inBox && isMember(object);
      if (wrong) wrongIn.push(object.id);
      if (absent) missing.push(object.id);
      const flag = state.checked && (wrong || absent);
      hit.setAttribute("style", `fill:transparent;stroke:${flag ? "var(--warn)" : "transparent"};stroke-width:2.5;${absent ? "stroke-dasharray:5 4" : ""}`);
    }
    const members = OBJECTS.filter((o) => state.inBox.has(o.id)).map((o) => o.id);
    setLine.replaceChildren(equation("A", rich("{ ", make("span", "il-accent", members.join("; ") || "∅"), " }")));
    if (!state.checked) { message.textContent = ""; message.className = "il-message"; }
    else if (!wrongIn.length && !missing.length) { message.textContent = state.inBox.size ? `Helyes! Mindegyik benne van, ami ${RULES[state.rule].name}, és semmi más. ✓` : "Ez a halmaz üres: nincs ilyen alakzat."; message.className = "il-message good"; }
    else {
      const parts = [];
      if (wrongIn.length) parts.push(`Nem illik a dobozba: ${wrongIn.join(", ")} (keretezve).`);
      if (missing.length) parts.push(`Hiányzik még: ${missing.length} alakzat (szaggatott keret, kint van).`);
      message.textContent = parts.join(" "); message.className = "il-message warn";
    }
    if (state.showOrder) {
      const reversed = [...members].reverse();
      const repeated = members.length ? [members[0], ...members, members[members.length - 1]] : [];
      const forms = members.length >= 2 ? [members, reversed, repeated] : null;
      orderNote.textContent = forms ? `{${forms[0].join("; ")}} = {${forms[1].join("; ")}} = {${forms[2].join("; ")}} — mindhárom ugyanaz a halmaz, mert ugyanazok az elemek vannak benne.` : "Válogass be legalább két alakzatot, és megmutatjuk, hogy a felírás sorrendje nem változtat a halmazon.";
    } else orderNote.textContent = "Kapcsold be, hogy lásd: {a; b} és {b; a} ugyanaz.";
  }

  render();
  return () => scope.clearAll();
}
