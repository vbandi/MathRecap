import { button, card, controls, createScope, equation, keyIdea, lead, make, PALETTE, rich, svg, toggle } from "./kit.js";

const isPrime = (n) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d !== 0);
const EXAMPLES = [
  { name: "páros számok 10-ig", test: (n) => n % 2 === 0 && n <= 10, rule: "{ x | x egész, 1 ≤ x ≤ 10 és x páros }" },
  { name: "12 osztói", test: (n) => 12 % n === 0, rule: "{ x | x pozitív egész és x osztója 12-nek }" },
  { name: "prímszámok 12-ig", test: (n) => isPrime(n) && n <= 12, rule: "{ x | x prímszám és x ≤ 12 }" },
];
const CRITERIA = [
  { name: "maradék 3-mal osztva", partition: true, bins: [{ label: "maradék 0", test: (n) => n % 3 === 0 }, { label: "maradék 1", test: (n) => n % 3 === 1 }, { label: "maradék 2", test: (n) => n % 3 === 2 }] },
  { name: "számjegyek száma", partition: true, bins: [{ label: "egyjegyű", test: (n) => n < 10 }, { label: "kétjegyű", test: (n) => n >= 10 }] },
  { name: "paritás", partition: true, bins: [{ label: "páros", test: (n) => n % 2 === 0 }, { label: "páratlan", test: (n) => n % 2 === 1 }] },
  { name: "„páros” / „3-mal osztható”", partition: false, bins: [{ label: "páros", test: (n) => n % 2 === 0 }, { label: "3-mal osztható", test: (n) => n % 3 === 0 }] },
];
const NUMBERS = Array.from({ length: 24 }, (_, i) => i + 1);
const W = 620, H = 310;

export function mount(root) {
  const scope = createScope();
  const state = { example: 0, view: "list", criterion: 0, placed: 0, running: false };

  root.append(lead("Egy halmazt kétféleképpen adhatunk meg: felsorolhatjuk az elemeit, vagy megmondhatjuk, milyen tulajdonság választja ki őket. Ha egy halmaz elemeit szétosztjuk részekre úgy, hogy mindenki pontosan egy részbe kerül, az osztályozás."));

  const first = card("Ugyanaz a halmaz kétféleképpen");
  const examplePicker = make("div", "il-controls"), viewPicker = make("div", "il-controls");
  const chipRow = make("div");
  chipRow.style.cssText = "display:flex;flex-wrap:wrap;gap:6px;margin:10px 0";
  const definition = make("div");
  first.append(examplePicker, viewPicker, chipRow, definition);

  const second = card("Osztályozás 1-től 24-ig");
  const criterionPicker = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Számok szétválogatása dobozokba" });
  const binLayer = svg("g", {}, figure);
  const chips = NUMBERS.map((n) => [0, 1].map((k) => {
    const group = svg("g", { class: "il-move", opacity: 0 }, figure);
    const circle = svg("circle", { r: 12 }, group);
    const text = svg("text", { "text-anchor": "middle", dy: 4, text: String(n), style: "font-size:12px" }, group);
    return { group, circle, text };
  }));
  const verdict = make("p", "il-message");
  second.append(criterionPicker, figure, controls(button("Szétválogatás", run), button("Visszaállítás", () => reset(), { ghost: true })), verdict);
  root.append(first, second, keyIdea("egy osztályozásnál minden elem pontosan egy részbe kerül: nincs átfedés és nincs kimaradó elem. Ha van átfedés vagy maradék, az nem osztályozás, nem diszjunkt felbontás."));

  const memberships = (n) => { const list = CRITERIA[state.criterion].bins.map((b, i) => (b.test(n) ? i : -1)).filter((i) => i >= 0); return list; };
  const needsLeftover = () => !CRITERIA[state.criterion].partition;

  function reset() { scope.clearAll(); state.placed = 0; state.running = false; verdict.textContent = ""; verdict.className = "il-message"; renderSecond(); }

  function run() {
    reset();
    state.running = true;
    const step = () => {
      if (state.placed >= NUMBERS.length) { state.running = false; renderSecond(); return finish(); }
      state.placed += 1;
      renderSecond();
      scope.timeout(step, 160);
    };
    scope.timeout(step, 300);
  }

  function finish() {
    const counts = NUMBERS.map((n) => memberships(n).length);
    const overlap = NUMBERS.filter((n, i) => counts[i] > 1), left = NUMBERS.filter((n, i) => counts[i] === 0);
    if (!overlap.length && !left.length) {
      const sizes = CRITERIA[state.criterion].bins.map((b) => NUMBERS.filter(b.test).length);
      verdict.textContent = `Ellenőrzés: mind a 24 szám pontosan egy dobozban van (${sizes.join(" + ")} = ${sizes.reduce((s, x) => s + x, 0)}). Ez osztályozás. ✓`;
      verdict.className = "il-message good";
    } else {
      verdict.textContent = `Ez nem osztályozás. Kétszer szerepel: ${overlap.join(", ")} (átfedés). Egyik dobozba sem került: ${left.join(", ")} (maradék).`;
      verdict.className = "il-message warn";
    }
  }

  function renderFirst() {
    examplePicker.replaceChildren(...EXAMPLES.map((e, i) => toggle(e.name, state.example === i, () => { state.example = i; renderFirst(); })));
    viewPicker.replaceChildren(toggle("Felsorolással", state.view === "list", () => { state.view = "list"; renderFirst(); }), toggle("Tulajdonsággal", state.view === "rule", () => { state.view = "rule"; renderFirst(); }));
    const example = EXAMPLES[state.example];
    const members = NUMBERS.filter((n) => n <= 12).filter(example.test);
    chipRow.replaceChildren(...NUMBERS.filter((n) => n <= 12).map((n) => {
      const chip = make("span", "", String(n));
      const inSet = example.test(n);
      chip.style.cssText = `display:inline-block;min-width:34px;padding:6px 0;text-align:center;border-radius:999px;border:1px solid ${inSet ? "var(--accent)" : "var(--line-strong)"};background:${inSet ? "var(--accent)" : "var(--input)"};color:${inSet ? "var(--accent-ink)" : "var(--dim)"};font:600 14px var(--font-mono)`;
      return chip;
    }));
    const text = state.view === "list" ? `{ ${members.join("; ")} }` : example.rule;
    definition.replaceChildren(equation("A", rich(make("span", "il-accent", text))));
    const hint = make("p", "il-muted", state.view === "list" ? "Felsorolás: minden elemet leírunk. Hosszú vagy végtelen halmaznál ez már nem megy." : "Tulajdonsággal: a függőleges vonal után az áll, milyen x kerül be a halmazba. Ugyanezek az elemek, rövidebben.");
    definition.append(hint);
  }

  function renderSecond() {
    const criterion = CRITERIA[state.criterion];
    criterionPicker.replaceChildren(make("span", "il-muted", "Szempont:"), ...CRITERIA.map((c, i) => toggle(c.name, state.criterion === i, () => { state.criterion = i; reset(); })));
    const columns = criterion.bins.length + (needsLeftover() ? 1 : 0);
    const labels = [...criterion.bins.map((b) => b.label), ...(needsLeftover() ? ["egyikben sem"] : [])];
    const width = (W - 20) / columns;
    const perRow = Math.max(1, Math.floor((width - 14) / 30));
    binLayer.replaceChildren();
    labels.forEach((label, i) => {
      svg("rect", { x: 10 + i * width + 3, y: 112, width: width - 6, height: H - 122, rx: 12, style: `fill:none;stroke:${i < criterion.bins.length ? PALETTE.blue : "var(--dim)"};stroke-width:2;stroke-dasharray:${i < criterion.bins.length ? "" : "5 4"}` }, binLayer);
      svg("text", { x: 10 + i * width + width / 2, y: 106, "text-anchor": "middle", "font-weight": 700, text: label }, binLayer);
    });
    const fill = new Array(columns).fill(0);
    NUMBERS.forEach((n, index) => {
      const [main, copy] = chips[index];
      const bins = memberships(n);
      const targets = bins.length ? bins : [columns - 1];
      const sorted = index < state.placed;
      const pool = { x: 30 + (index % 12) * 48, y: 26 + Math.floor(index / 12) * 34 };
      [main, copy].forEach((chip, k) => {
        const target = targets[k];
        let position = pool;
        if (sorted && target !== undefined) {
          const slot = fill[target]++;
          position = { x: 10 + target * width + 16 + (slot % perRow) * 30 + 6, y: 138 + Math.floor(slot / perRow) * 30 };
        }
        const visible = k === 0 || (sorted && target !== undefined);
        chip.group.setAttribute("opacity", visible ? 1 : 0);
        chip.group.style.transform = `translate(${position.x}px, ${position.y}px)`;
        const duplicate = sorted && targets.length > 1;
        const leftover = sorted && !bins.length;
        chip.circle.setAttribute("style", `fill:${duplicate ? "var(--il-amber)" : leftover ? "var(--il-red)" : sorted ? "var(--accent)" : "var(--surface)"};stroke:${sorted ? "none" : "var(--line-strong)"}`);
        chip.text.setAttribute("style", `font-size:12px;font-weight:700;fill:${sorted ? "var(--accent-ink)" : "var(--fg-soft)"}`);
        if (duplicate || leftover) chip.text.style.fill = "#fff";
      });
    });
  }

  renderFirst();
  renderSecond();
  return () => scope.clearAll();
}
