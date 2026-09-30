import { button, card, controls, createScope, formatNumber, keyIdea, lead, make, PALETTE, slot, svg, toggle } from "./kit.js";

const W = 720;
const EXPERIMENTS = {
  die: {
    label: "Dobókocka", sides: [1, 2, 3, 4, 5, 6],
    events: [
      { text: "hatost dobunk", short: "hatos", test: (x) => x === 6 },
      { text: "7-est dobunk", short: "7-es", test: (x) => x === 7 },
      { text: "1 és 6 közötti számot dobunk", short: "1 és 6 között", test: (x) => x >= 1 && x <= 6 },
      { text: "párosat dobunk", short: "páros", test: (x) => x % 2 === 0 },
      { text: "0-nál kisebb számot dobunk", short: "0-nál kisebb", test: (x) => x < 0 },
      { text: "5-nél nagyobbat dobunk", short: "5-nél nagyobb", test: (x) => x > 5 },
    ],
  },
  coin: {
    label: "Érme", sides: ["fej", "írás"],
    events: [
      { text: "fejet dobunk", short: "fej", test: (x) => x === "fej" },
      { text: "fejet vagy írást dobunk", short: "fej vagy írás", test: (x) => x === "fej" || x === "írás" },
      { text: "egyetlen dobással fejet és írást is dobunk", short: "fej és írás", test: () => false },
      { text: "nem fejet dobunk", short: "nem fej", test: (x) => x !== "fej" },
    ],
  },
};
const CATEGORIES = [["certain", "biztos"], ["possible", "lehetséges"], ["impossible", "lehetetlen"]];
const CATEGORY_COLORS = { certain: PALETTE.green, possible: PALETTE.amber, impossible: PALETTE.red };

const probabilityOf = (experiment, event) => experiment.sides.filter(event.test).length / experiment.sides.length;
const categoryOf = (p) => (p === 1 ? "certain" : p === 0 ? "impossible" : "possible");
const fractionText = (experiment, event) => {
  const k = experiment.sides.filter(event.test).length, n = experiment.sides.length;
  return k === 0 ? "0" : k === n ? "1" : `${k}/${n}`;
};

export function mount(root) {
  const scope = createScope();
  let key = "die", results = [], placed = {}, rolling = false;
  const experiment = () => EXPERIMENTS[key];
  const rand = (list) => list[Math.floor(Math.random() * list.length)];

  root.append(lead("A valószínűségi kísérlet olyan folyamat, amelynek kimenetelét előre nem tudjuk megmondani, például egy kockadobás. Egy esemény lehet biztos (mindig bekövetkezik), lehetetlen (soha nem következik be), vagy lehetséges (néha igen, néha nem)."));

  const rollCard = card("Kísérlet: dobjunk!");
  const pickControls = controls();
  const face = svg("svg", { viewBox: "0 0 80 80", width: 80, height: 80, role: "img", "aria-label": "A dobás eredménye", style: "flex:none" });
  const history = make("div", "il-formula start");
  history.style.minHeight = "3.4em";
  const rollButton = button("Dobás", () => roll(), { ghost: false });
  rollCard.append(pickControls, controls(face, rollButton, button("Nullázás", () => { results = []; renderRoll(); }, { ghost: true })), history);

  const sortCard = card("Soroljuk be az eseményeket");
  const sortRows = make("div");
  const sortMessage = make("p", "il-message");
  sortCard.append(make("p", "", "Melyik csoportba tartozik az esemény? Kattints a megfelelő gombra. Ha bizonytalan vagy, próbáld ki a dobásokkal."), sortRows, sortMessage);

  const scaleCard = card("Az esélyek a 0 és 1 közötti skálán");
  const scaleFigure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} 240`, role: "img", "aria-label": "A besorolt események a valószínűségi skálán" }, scaleCard);
  const scaleLayer = svg("g", {}, scaleFigure);
  scaleCard.append(scaleFigure, make("p", "il-muted", "A lehetetlen esemény valószínűsége 0, a biztosé 1. A lehetséges események ezek között vannak: minél nagyobb az esély, annál jobbra esnek."));

  root.append(rollCard, sortCard, scaleCard, keyIdea("a biztos esemény mindig bekövetkezik (valószínűsége 1), a lehetetlen soha (valószínűsége 0), a lehetséges esemény valószínűsége pedig 0 és 1 közé esik."));

  function drawFace(value) {
    face.replaceChildren();
    svg("rect", { x: 4, y: 4, width: 72, height: 72, rx: key === "die" ? 14 : 36, style: `fill:var(--surface);stroke:var(--line-strong);stroke-width:3` }, face);
    if (value === undefined) return;
    if (key === "coin") {
      svg("text", { x: 40, y: 49, "text-anchor": "middle", text: value === "fej" ? "F" : "Í", style: `fill:${PALETTE.amber};font-size:34px;font-weight:800` }, face);
      return;
    }
    const pips = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[value];
    pips.forEach(([dx, dy]) => svg("circle", { cx: 40 + dx * 18, cy: 40 + dy * 18, r: 6.5, style: "fill:var(--fg)" }, face));
  }

  function roll(times = 1) {
    if (rolling) return;
    rolling = true; rollButton.disabled = true;
    let frames = 0;
    const tick = () => {
      frames += 1;
      if (frames < 8) { drawFace(rand(experiment().sides)); scope.timeout(tick, 70); return; }
      const outcome = rand(experiment().sides);
      results.push(outcome);
      drawFace(outcome);
      rolling = false; rollButton.disabled = false;
      renderRoll(false);
    };
    tick();
  }

  function renderRoll(redraw = true) {
    pickControls.replaceChildren(...Object.entries(EXPERIMENTS).map(([id, item]) => toggle(item.label, id === key, () => { key = id; results = []; placed = {}; renderAll(); })));
    if (redraw) drawFace(results.at(-1));
    const last = results.slice(-24).join(" ");
    const summary = experiment().sides.map((side) => `${side}: ${results.filter((r) => r === side).length}`).join("   ");
    history.replaceChildren(make("div", "", `dobások (${results.length}): ${last || "még nem dobtunk"}`), make("div", "il-muted", summary));
  }

  function renderSort() {
    sortRows.replaceChildren();
    experiment().events.forEach((event, index) => {
      const p = probabilityOf(experiment(), event), answer = placed[index];
      const row = make("div", "il-controls");
      const text = make("span", "", `„${event.text}”`);
      text.style.flex = "1 1 220px";
      row.append(text);
      if (answer) {
        const chip = make("b", "", `${CATEGORIES.find(([id]) => id === answer)[1]}  (P = ${fractionText(experiment(), event)})`);
        chip.style.color = CATEGORY_COLORS[answer];
        row.append(chip);
      } else {
        for (const [id, name] of CATEGORIES) row.append(toggle(name, false, () => {
          if (id === categoryOf(p)) {
            placed[index] = id;
            sortMessage.className = "il-message good";
            sortMessage.textContent = id === "certain" ? "Jó! Ez mindig bekövetkezik, bármit dobunk." : id === "impossible" ? "Jó! Ez soha nem következhet be, egyik lehetséges dobás sem ilyen." : "Jó! Van olyan dobás, amelynél bekövetkezik, és olyan is, amelynél nem.";
            renderSort(); renderScale();
          } else {
            sortMessage.className = "il-message warn";
            sortMessage.textContent = `Nem ez a „${name}” csoport. Nézd végig a lehetséges kimeneteleket (${experiment().sides.join(", ")}): hányra teljesül az esemény?`;
          }
        }, CATEGORY_COLORS[id]));
        const trialSlot = slot("", 26, { align: "left" });
        row.append(button("Kipróbálom", () => {
          const hits = Array.from({ length: 50 }, () => event.test(rand(experiment().sides))).filter(Boolean).length;
          trialSlot.textContent = `50 dobásból sikeres: ${hits}`;
        }, { ghost: true }), trialSlot);
      }
      sortRows.append(row);
    });
  }

  function renderScale() {
    scaleLayer.replaceChildren();
    const left = 50, right = W - 50, y = 70, x = (p) => left + p * (right - left);
    svg("rect", { x: left, y: y - 6, width: right - left, height: 12, rx: 6, style: `fill:${PALETTE.amber};opacity:.35` }, scaleLayer);
    svg("circle", { cx: left, cy: y, r: 10, style: `fill:${PALETTE.red}` }, scaleLayer);
    svg("circle", { cx: right, cy: y, r: 10, style: `fill:${PALETTE.green}` }, scaleLayer);
    svg("text", { x: left, y: y - 20, "text-anchor": "start", text: "0: lehetetlen", style: `fill:${PALETTE.red};font-weight:700` }, scaleLayer);
    svg("text", { x: right, y: y - 20, "text-anchor": "end", text: "1: biztos", style: `fill:${PALETTE.green};font-weight:700` }, scaleLayer);
    svg("text", { x: (left + right) / 2, y: y - 20, "text-anchor": "middle", text: "lehetséges", style: `fill:${PALETTE.amber};font-weight:700` }, scaleLayer);
    const groups = {};
    experiment().events.forEach((event, index) => {
      if (!placed[index]) return;
      const p = probabilityOf(experiment(), event), level = groups[p] = (groups[p] ?? 0) + 1;
      const anchor = p === 0 ? "start" : p === 1 ? "end" : "middle";
      svg("circle", { cx: x(p), cy: y, r: 6, style: `fill:${CATEGORY_COLORS[placed[index]]};stroke:var(--input);stroke-width:2` }, scaleLayer);
      svg("text", { x: x(p), y: y + 14 + level * 18, "text-anchor": anchor, text: `${event.short} (${fractionText(experiment(), event)})`, style: "font-size:13px" }, scaleLayer);
    });
    if (!Object.keys(placed).length) svg("text", { x: (left + right) / 2, y: 150, "text-anchor": "middle", text: "Soroljd be az eseményeket, és itt megjelennek a helyükön.", style: "fill:var(--dim)" }, scaleLayer);
  }

  function renderAll() { scope.clearAll(); rolling = false; rollButton.disabled = false; renderRoll(); renderSort(); renderScale(); sortMessage.textContent = ""; sortMessage.className = "il-message"; }

  renderAll();
  return () => scope.clearAll();
}
