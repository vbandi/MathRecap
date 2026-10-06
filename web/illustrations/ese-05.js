import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, range, slot, svg } from "./kit.js";

const LETTERS = "ABCDEF";
const COLORS = [PALETTE.red, PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.violet, PALETTE.pink];
const SUFFIX = { A: "val", B: "vel", C: "vel", D: "vel", E: "vel", F: "fel" };
const STEP = 62;

const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
const formatInteger = (value) => value.toLocaleString("hu-HU");
function permute(items) {
  return items.length <= 1 ? [items] : items.flatMap((item, i) => permute([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));
}

export function mount(root) {
  const scope = createScope();
  let n = 3, all = [], index = 0, playing = true, speed = 4, timer = null;
  let tokens = [], chips = [];

  root.append(lead("Hányféleképp állíthatunk sorba néhány különböző dolgot? Az első helyre bárki kerülhet, a másodikra már eggyel kevesebb jelölt marad, és így tovább. Ezeket a lehetőségeket kell összeszorozni. A végeredmény neve faktoriális."));

  const slotsCard = card("Hányféle sorrend?");
  const nRange = range({ label: "Elemek száma (n):", min: 1, max: 6, value: n, format: (v) => String(v), onInput: (value) => { n = value; rebuild(); } });
  const slotRow = make("div", "il-controls");
  slotRow.style.minHeight = "44px";
  const formula = make("div", "il-formula start");
  slotsCard.append(controls(nRange.element), slotRow, formula);

  const listCard = card("Az összes sorrend");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 400 60", role: "img", "aria-label": "Sorba rendezett elemek" });
  figure.style.maxWidth = "400px";
  const counter = make("div", "il-formula start");
  const playButton = button("Szünet", () => { playing = !playing; schedule(); });
  const listBox = make("div");
  listCard.append(figure, counter, controls(
    playButton, button("Következő sorrend", () => { playing = false; schedule(); step(); }, { ghost: true }),
    range({ label: "Sebesség", min: 1, max: 10, value: speed, format: (v) => String(v), onInput: (v) => { speed = v; schedule(); } }).element,
  ), make("p", "il-muted", "A sorrendeket rendszerben soroltuk fel: először az A-val kezdődők, azon belül a B-vel kezdődők, és így tovább. Minden szinten eggyel kevesebb elemből választhatunk, ezért szorzunk. Kattints egy sorrendre: a fenti golyók is úgy állnak majd fel!"), listBox);

  const tableCard = card("A faktoriális gyorsan nő");
  const table = make("table", "il-table");
  tableCard.append(table);
  root.append(slotsCard, listCard, tableCard, keyIdea("n! = n · (n − 1) · … · 2 · 1, és megegyezés szerint 0! = 1 (az üres sorba állításnak pontosan egy módja van). n különböző elem összes sorrendjeinek száma n!."));

  function buildTable() {
    table.replaceChildren();
    const head = make("tr");
    head.append(make("th", "", "n!"), make("th", "", "érték"));
    table.append(head);
    [...Array(9).keys(), 10].forEach((value) => {
      const row = make("tr");
      const on = value === n;
      row.append(make("td", "", `${value}!`), make("td", "", formatInteger(factorial(value))));
      row.style.cssText = on ? "color:var(--accent);font-weight:700" : "";
      row.style.opacity = value > 6 ? "0.7" : "1";
      table.append(row);
    });
    table.querySelectorAll("td:last-child").forEach((cell) => { cell.style.width = "12ch"; });
  }

  function buildSlots() {
    slotRow.replaceChildren();
    for (let i = 0; i < n; i++) {
      if (i > 0) slotRow.append(make("span", "il-muted", "·"));
      const box = make("div", "il-fade", String(n - i));
      box.style.cssText = "width:38px;height:38px;display:flex;align-items:center;justify-content:center;border:2px solid var(--accent);border-radius:10px;font:700 18px var(--font-mono);color:var(--accent);opacity:0";
      slotRow.append(box);
      scope.timeout(() => { box.style.opacity = "1"; }, 120 + i * 300);
    }
    const product = Array.from({ length: n }, (_, i) => n - i).join(" · ");
    formula.replaceChildren(`${n}! = ${product} = `, make("b", "", formatInteger(factorial(n))));
  }

  function buildList() {
    listBox.replaceChildren();
    chips = [];
    const orderIndex = new Map(all.map((order, i) => [order.join(""), i]));
    const chipRow = (prefix, remaining) => {
      const row = make("div");
      row.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;margin:4px 0";
      permute(remaining).forEach((rest) => {
        const full = [...prefix, ...rest];
        const order = orderIndex.get(full.join(""));
        const chip = make("button", "", full.map((t) => LETTERS[t]).join(""));
        chip.type = "button";
        chip.style.cssText = "padding:2px 7px;border-radius:8px;border:1px solid var(--line-strong);background:transparent;color:var(--fg-soft);font:13px var(--font-mono);cursor:pointer";
        chip.addEventListener("click", () => { playing = false; schedule(); index = order; place(); });
        chips[order] = chip;
        row.append(chip);
      });
      return row;
    };
    const group = (prefix, remaining) => {
      const last = LETTERS[prefix[prefix.length - 1]];
      const element = make("div");
      element.style.cssText = `margin:6px 0 6px ${prefix.length > 1 ? 14 : 0}px;padding-left:10px;border-left:4px solid ${COLORS[prefix[prefix.length - 1]]}`;
      const count = factorial(remaining.length);
      const heading = prefix.length === 1 ? `${last}-${SUFFIX[last]} kezdődik` : `azon belül ${last}-${SUFFIX[last]} kezdődik (${prefix.map((t) => LETTERS[t]).join("")}…)`;
      element.append(make("div", "il-muted", `${heading}: ${count === 1 ? "1 sorrend" : `${count} sorrend`}`));
      if (remaining.length <= 4) element.append(chipRow(prefix, remaining));
      else remaining.forEach((next, i) => element.append(group([...prefix, next], [...remaining.slice(0, i), ...remaining.slice(i + 1)])));
      return element;
    };
    const all0 = [...Array(n).keys()];
    if (n <= 4) listBox.append(chipRow([], all0));
    else all0.forEach((first, i) => listBox.append(group([first], [...all0.slice(0, i), ...all0.slice(i + 1)])));
  }

  function place() {
    all[index].forEach((token, position) => { tokens[token].style.transform = `translate(${32 + position * STEP}px, 30px)`; });
    chips.forEach((chip, i) => {
      chip.style.background = i === index ? "var(--accent-soft)" : "transparent";
      chip.style.color = i === index ? "var(--accent)" : "var(--fg-soft)";
    });
    counter.replaceChildren(slot(String(index + 1), 3), ". sorrend / ", slot(String(all.length), 3, { align: "left" }));
  }

  function step() { index = (index + 1) % all.length; place(); }
  function schedule() {
    if (timer !== null) scope.clearInterval(timer);
    timer = null;
    playButton.textContent = playing ? "Szünet" : "Lejátszás";
    if (playing && all.length > 1) timer = scope.interval(step, 1300 - speed * 110);
  }

  function rebuild() {
    all = permute([...Array(n).keys()]);
    index = 0;
    figure.replaceChildren();
    tokens = Array.from({ length: n }, (_, i) => {
      const group = svg("g", { class: "il-move" }, figure);
      svg("circle", { r: 22, fill: COLORS[i] }, group);
      svg("text", { "text-anchor": "middle", dy: 6, text: LETTERS[i], style: "fill:#fff;font-weight:700;font-size:17px" }, group);
      return group;
    });
    buildSlots(); buildList(); buildTable(); place(); schedule();
  }

  rebuild();
  return () => scope.clearAll();
}
