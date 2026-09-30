import { card, controls, keyIdea, lead, make, PALETTE, svg, toggle, uniqueId } from "./kit.js";

const WIDTH = 620;
const ATTRIBUTES = [
  { key: "S", verb: "sportol", color: PALETTE.violet },
  { key: "Z", verb: "zenél", color: PALETTE.blue },
  { key: "R", verb: "rajzol", color: PALETTE.amber },
];
const STUDENTS = [
  { name: "Anna", attrs: "SZ" }, { name: "Bence", attrs: "S" }, { name: "Csilla", attrs: "Z" }, { name: "Dani", attrs: "" },
  { name: "Emma", attrs: "SZR" }, { name: "Feri", attrs: "R" }, { name: "Gabi", attrs: "ZR" }, { name: "Hanna", attrs: "SR" },
];
const LAYOUTS = {
  2: { height: 330, radius: 128, centers: [{ x: 240, y: 165 }, { x: 380, y: 165 }], chipWidth: 62 },
  3: { height: 370, radius: 108, centers: [{ x: 250, y: 130 }, { x: 370, y: 130 }, { x: 310, y: 232 }], chipWidth: 56 },
};
const CHIP_HEIGHT = 24;

const joinList = (items) => (items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} és ${items[items.length - 1]}`);

function describeRegion(key, letters) {
  const verb = (letter) => ATTRIBUTES.find((attribute) => attribute.key === letter).verb;
  const positiveList = letters.filter((l) => key.includes(l)).map(verb);
  const positive = joinList(positiveList);
  const negative = joinList(letters.filter((l) => !key.includes(l)).map((l) => `nem ${verb(l)}`));
  if (!positive) return negative;
  return negative ? `${positive}, de ${negative}` : positive;
}

export function mount(root) {
  const state = { sets: 2, placed: new Map(), selected: null, hover: null };
  const clipIds = ATTRIBUTES.map(() => uniqueId("venn-clip"));
  const maskId = uniqueId("venn-mask");

  root.append(lead("A Venn-diagram azt mutatja meg, ki melyik csoportba tartozik. Egy kör egy tulajdonság: aki bent van, az teljesíti. Ahol a körök átfedik egymást, ott mindkét tulajdonság igaz. Tedd a diákokat a megfelelő helyre!"));

  const play = card("Hová tartoznak a diákok?");
  const modePicker = make("div", "il-controls");
  const pool = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", role: "img", "aria-label": "Venn-diagram a diákok elhelyezéséhez" });
  const defs = svg("defs", {}, figure);
  ATTRIBUTES.forEach((_, i) => svg("circle", {}, svg("clipPath", { id: clipIds[i] }, defs)));
  const mask = svg("mask", { id: maskId, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: WIDTH, height: 400 }, defs);
  const outline = svg("g", {}, figure);
  const highlight = svg("g", { style: "pointer-events:none" }, figure);
  const chipLayer = svg("g", {}, figure);
  const hoverLine = make("p", "il-muted");
  const message = make("p", "il-message");
  play.append(modePicker, make("div", "il-muted", "Válassz egy diákot, aztán kattints a diagram azon részére, ahova szerinted tartozik:"), pool, figure, hoverLine, message);
  root.append(play, keyIdea("a Venn-diagram minden része egy mondat: a metszet az „és”, a körön kívüli rész a „sem ez, sem az”. Minden diáknak pontosan egy helye van."));

  const layout = () => LAYOUTS[state.sets];
  const letters = () => ATTRIBUTES.slice(0, state.sets).map((a) => a.key);
  const regionAt = (x, y) => letters().map((letter, i) => (Math.hypot(x - layout().centers[i].x, y - layout().centers[i].y) < layout().radius ? letter : "")).join("");
  const studentRegion = (student) => letters().filter((l) => student.attrs.includes(l)).join("");

  // Greedy chip slots for each region, packed around the region's centre of mass.
  function regionSlots() {
    const { height, radius, centers, chipWidth } = layout();
    const samples = new Map();
    for (let y = 14; y < height - 6; y += 4) {
      for (let x = 10; x < WIDTH - 10; x += 4) {
        const key = regionAt(x, y);
        const edge = Math.min(...centers.map((c) => Math.abs(Math.hypot(x - c.x, y - c.y) - radius)));
        if (!samples.has(key)) samples.set(key, []);
        samples.get(key).push({ x, y, edge });
      }
    }
    const slots = new Map();
    for (const [key, points] of samples) {
      const cx = points.reduce((s, p) => s + p.x, 0) / points.length, cy = points.reduce((s, p) => s + p.y, 0) / points.length;
      const inner = key === "" ? { x: WIDTH / 2, y: height - 26 } : { x: cx, y: cy };
      const chosen = [];
      const ordered = points.filter((p) => p.edge > 8 && (key !== "" || p.y > height - 50)).sort((p, q) => Math.hypot(p.x - inner.x, p.y - inner.y) - Math.hypot(q.x - inner.x, q.y - inner.y));
      for (const p of ordered) {
        if (chosen.every((c) => Math.abs(c.x - p.x) >= chipWidth + 4 || Math.abs(c.y - p.y) >= CHIP_HEIGHT + 4)) chosen.push(p);
        if (chosen.length >= 6) break;
      }
      slots.set(key, chosen.length ? chosen : [inner]);
    }
    return slots;
  }

  function setMode(sets) { state.sets = sets; state.placed.clear(); state.selected = null; state.hover = null; message.textContent = ""; message.className = "il-message"; render(); }

  function place(region) {
    const student = STUDENTS.find((s) => s.name === state.selected);
    if (!student) { message.textContent = "Előbb válassz egy diákot a fenti gombok közül (vagy kattints egy már kitett névre)."; message.className = "il-message"; return; }
    state.placed.set(student.name, region);
    state.selected = null;
    const correct = studentRegion(student) === region;
    const ownList = letters().filter((l) => student.attrs.includes(l)).map((l) => ATTRIBUTES.find((a) => a.key === l).verb);
    const own = joinList(ownList);
    const about = own ? `${student.name} ${own}` : `${student.name} egyiket sem csinálja`;
    const rest = letters().filter((l) => !student.attrs.includes(l)).map((l) => `nem ${ATTRIBUTES.find((a) => a.key === l).verb}`);
    const fact = `${about}${own && rest.length ? `, de ${joinList(rest)}` : ""}`;
    if (correct) {
      message.textContent = `${fact} — ez a hely pontosan ezt jelenti. ✓`;
      message.className = "il-message good";
    } else {
      message.textContent = `${student.name} nem ide való. Ez a rész azt jelenti: ${describeRegion(region, letters()) || "semmit sem csinál"}. ${fact}.`;
      message.className = "il-message warn";
    }
    if (STUDENTS.every((s) => state.placed.get(s.name) === studentRegion(s))) {
      message.textContent = "Mind a nyolc diák a helyén van. Minden diák a diagram pontosan egy részébe került. ✓";
      message.className = "il-message good";
    }
    render();
  }

  function pointer(event) {
    const point = figure.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    return point.matrixTransform(figure.getScreenCTM().inverse());
  }
  figure.addEventListener("mousemove", (event) => {
    const point = pointer(event), region = regionAt(point.x, point.y);
    if (state.hover !== region) { state.hover = region; renderHighlight(); }
  });
  figure.addEventListener("mouseleave", () => { state.hover = null; renderHighlight(); });
  figure.addEventListener("click", (event) => { if (!event.target.closest("[data-name]")) { const point = pointer(event); place(regionAt(point.x, point.y)); } });

  function renderHighlight() {
    const { radius, centers, height } = layout();
    highlight.replaceChildren();
    if (state.hover === null) { hoverLine.textContent = "Vidd az egeret a diagram egy része fölé: megmondjuk, kik tartoznak oda."; return; }
    const region = state.hover;
    hoverLine.textContent = `Ez a rész: ${describeRegion(region, letters()) || "egyik tulajdonsága sincs"}.`;
    mask.replaceChildren(svg("rect", { x: 0, y: 0, width: WIDTH, height: 400, fill: "#fff" }));
    letters().forEach((l, i) => { if (!region.includes(l)) svg("circle", { cx: centers[i].x, cy: centers[i].y, r: radius, fill: "#000" }, mask); });
    let parent = highlight;
    letters().forEach((l, i) => { if (region.includes(l)) parent = svg("g", { "clip-path": `url(#${clipIds[i]})` }, parent); });
    svg("rect", { x: 0, y: 0, width: WIDTH, height, mask: `url(#${maskId})`, style: "fill:var(--accent);opacity:.22" }, parent);
  }

  function render() {
    const { height, radius, centers, chipWidth } = layout();
    figure.setAttribute("viewBox", `0 0 ${WIDTH} ${height}`);
    modePicker.replaceChildren(toggle("2 tulajdonság", state.sets === 2, () => setMode(2)), toggle("3 tulajdonság", state.sets === 3, () => setMode(3)));
    ATTRIBUTES.forEach((_, i) => {
      const clip = defs.children[i].firstChild;
      if (centers[i]) { clip.setAttribute("cx", centers[i].x); clip.setAttribute("cy", centers[i].y); clip.setAttribute("r", radius); }
    });
    outline.replaceChildren();
    letters().forEach((letter, i) => {
      const attribute = ATTRIBUTES[i];
      svg("circle", { cx: centers[i].x, cy: centers[i].y, r: radius, style: `fill:${attribute.color};fill-opacity:.1;stroke:${attribute.color};stroke-width:2.5` }, outline);
      const above = centers[i].y - radius - 6;
      svg("text", { x: i === 2 ? centers[i].x + radius + 8 : centers[i].x + (i === 0 ? -radius * 0.55 : radius * 0.55), y: i === 2 ? centers[i].y + radius * 0.6 : above, "text-anchor": i === 2 ? "start" : "middle", "font-weight": 700, text: attribute.verb, style: `fill:${attribute.color}` }, outline);
    });
    const slots = regionSlots();
    const used = new Map();
    chipLayer.replaceChildren();
    for (const student of STUDENTS) {
      const region = state.placed.get(student.name);
      if (region === undefined) continue;
      const list = slots.get(region) ?? [{ x: 60, y: 30 }];
      const index = used.get(region) ?? 0;
      used.set(region, index + 1);
      const slot = list[index % list.length];
      const ok = studentRegion(student) === region;
      const group = svg("g", { "data-name": student.name, style: "cursor:pointer", transform: `translate(${slot.x + (index >= list.length ? 6 : 0)}, ${slot.y + (index >= list.length ? 6 : 0)})` }, chipLayer);
      svg("rect", { x: -chipWidth / 2, y: -CHIP_HEIGHT / 2, width: chipWidth, height: CHIP_HEIGHT, rx: 12, style: `fill:var(--surface);stroke:${ok ? "var(--il-green)" : "var(--il-red)"};stroke-width:2.5` }, group);
      svg("text", { "text-anchor": "middle", dy: 4.5, text: student.name, style: "font-size:12px;font-weight:600" }, group);
      group.addEventListener("click", () => { state.selected = student.name; state.placed.delete(student.name); message.textContent = `${student.name} fel van véve: kattints arra a részre, ahova szerinted tartozik.`; message.className = "il-message"; render(); });
    }
    pool.replaceChildren();
    for (const student of STUDENTS) {
      if (state.placed.has(student.name)) continue;
      const facts = letters().filter((l) => student.attrs.includes(l)).map((l) => ATTRIBUTES.find((a) => a.key === l).verb).join(", ") || "semmit sem";
      pool.append(toggle(`${student.name}: ${facts}`, state.selected === student.name, () => { state.selected = state.selected === student.name ? null : student.name; render(); }));
    }
    if (!pool.children.length) pool.append(make("span", "il-muted", "Mindenki el van helyezve."));
    renderHighlight();
  }

  render();
  return () => {};
}
