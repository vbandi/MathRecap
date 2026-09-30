import { button, card, controls, createScope, formatNumber, gcd, keyIdea, lead, make, PALETTE, svg, toggle } from "./kit.js";

const SETS = ["ℕ", "ℤ", "ℚ", "ℝ"];
const OPERATIONS = ["+", "−", "·", ":", "√"];
const REGION_COLORS = [PALETTE.green, PALETTE.blue, PALETTE.violet, PALETTE.amber];
// Concentric regions, outermost first: [set index, rx, ry].
const REGIONS = [[3, 285, 140], [2, 222, 108], [1, 158, 76], [0, 92, 44]];
const CENTER_X = 300, CENTER_Y = 150;
// Numbers to classify: text, smallest set index, explanation.
const NUMBERS = [
  ["5", 0, "5 természetes szám."], ["−3", 1, "−3 egész szám, de negatív, ezért nem természetes."], ["1/2", 2, "1/2 tört, nem egész szám, de racionális."],
  ["√2", 3, "√2 nem írható fel törtként, tehát irracionális: csak a valós számok közé tartozik."], ["0", 0, "A 0 természetes szám."], ["0,75", 2, "0,75 = 3/4, racionális."],
  ["√9", 0, "√9 = 3, ez természetes szám."], ["π", 3, "π irracionális szám."], ["−√4", 1, "−√4 = −2, egész szám."], ["0,(3)", 2, "0,(3) = 1/3, racionális."], ["−7", 1, "−7 egész szám."], ["√10", 3, "√10 nem négyzetszám gyöke, irracionális."],
];
// Spots (x, y) for placed numbers inside each ring, by set index.
const SPOTS = [
  [[250, 145], [300, 145], [350, 145], [275, 168], [325, 168], [275, 128], [325, 128]],
  [[165, 150], [435, 150], [185, 120], [415, 120], [185, 180], [415, 180]],
  [[110, 150], [490, 150], [120, 110], [480, 110], [120, 190], [480, 190]],
  [[45, 150], [555, 150], [60, 105], [540, 105], [60, 195], [540, 195]],
];

const pick = (n) => Math.floor(Math.random() * n);
const rational = (n, d = 1) => { const g = gcd(n, d) || 1; return { kind: "rat", n: (d < 0 ? -n : n) / g, d: Math.abs(d) / g }; };
const ratText = ({ n, d }) => `${String(n).replace("-", "−")}${d === 1 ? "" : `/${d}`}`;
const ratValue = ({ n, d }) => n / d;

function randomOperand(setIndex, operation) {
  if (setIndex === 0) return rational(operation === "√" ? pick(31) : pick(13));
  if (setIndex === 1) return rational(operation === "√" ? pick(40) - 8 : pick(19) - 9);
  if (setIndex === 2) return rational(pick(15) - 7, 1 + pick(6));
  const pool = [{ text: "√2", value: Math.SQRT2 }, { text: "√3", value: Math.sqrt(3) }, { text: "π", value: Math.PI }, { text: "2", value: 2 }, { text: "−1", value: -1 }, { text: "1/2", value: 0.5 }, { text: "−√5", value: -Math.sqrt(5) }, { text: "3", value: 3 }];
  return { kind: "real", ...pool[pick(pool.length)] };
}

function compute(setIndex, operation, a, b) {
  if (setIndex === 3) {
    const x = a.value, y = b?.value;
    const value = operation === "+" ? x + y : operation === "−" ? x - y : operation === "·" ? x * y : operation === ":" ? x / y : Math.sqrt(x);
    return Number.isFinite(value) ? { kind: "irr", value } : { kind: "undefined" };
  }
  if (operation === "√") {
    if (a.n < 0) return { kind: "undefined" };
    const rn = Math.round(Math.sqrt(a.n)), rd = Math.round(Math.sqrt(a.d));
    return rn * rn === a.n && rd * rd === a.d ? rational(rn, rd) : { kind: "irr", value: Math.sqrt(ratValue(a)) };
  }
  if (operation === "+") return rational(a.n * b.d + b.n * a.d, a.d * b.d);
  if (operation === "−") return rational(a.n * b.d - b.n * a.d, a.d * b.d);
  if (operation === "·") return rational(a.n * b.n, a.d * b.d);
  return rational(a.n * b.d, a.d * b.n);
}

function smallestSet(result) {
  if (result.kind === "undefined") return -1;
  if (result.kind === "irr") return 3;
  return result.d === 1 ? (result.n >= 0 ? 0 : 1) : 2;
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("A számokat halmazokba soroljuk: a természetes számoktól (ℕ) az egész (ℤ), a racionális (ℚ) és végül a valós számokig (ℝ). Minden halmaz tartalmazza az előzőt. Egy halmaz akkor zárt egy műveletre, ha a művelet eredménye sosem lép ki belőle."));

  // --- Nested regions ---
  const regionCard = card("Hova tartozik a szám? Kattints a legszűkebb halmazra");
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 300", role: "img" }, regionCard);
  REGIONS.forEach(([index, rx, ry]) => {
    const region = svg("ellipse", { cx: CENTER_X, cy: CENTER_Y, rx, ry, style: `fill:${REGION_COLORS[index]};fill-opacity:.14;stroke:${REGION_COLORS[index]};stroke-width:2;cursor:pointer`, tabindex: 0, role: "button", "aria-label": `${SETS[index]} halmaz` }, figure);
    region.addEventListener("click", () => answer(index));
    region.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); answer(index); } });
    svg("text", { x: CENTER_X, y: CENTER_Y - ry + 18, "text-anchor": "middle", text: ["ℕ természetes", "ℤ egész", "ℚ racionális", "ℝ valós"][index], style: `fill:${REGION_COLORS[index]};font-weight:700;pointer-events:none` }, figure);
  });
  const placedLayer = svg("g", { style: "pointer-events:none" }, figure);
  const current = make("div", "il-formula");
  current.style.cssText += "font-size:28px;";
  const regionMessage = make("p", "il-message");
  let order = NUMBERS.map((_, i) => i).sort(() => Math.random() - 0.5), position = 0, placedCounts = [0, 0, 0, 0];
  regionCard.append(current, regionMessage, controls(button("Új sorozat", () => restartPlacement(), { ghost: true })));

  function answer(index) {
    if (position >= order.length) return;
    const [text, correct, explanation] = NUMBERS[order[position]];
    if (index !== correct) {
      regionMessage.className = "il-message warn";
      regionMessage.textContent = index > correct ? `Ennél szűkebb halmazba is belefér. ${correct === 0 ? "Gondolj a legkisebb számokra: 0, 1, 2, …" : ""}` : `Ebbe a halmazba nem tartozik bele. ${explanation}`;
      return;
    }
    const spot = SPOTS[correct][placedCounts[correct] % SPOTS[correct].length];
    placedCounts[correct] += 1;
    svg("text", { x: spot[0], y: spot[1] + 5, "text-anchor": "middle", text: text, style: `fill:var(--fg);font-weight:700;font-size:15px` }, placedLayer);
    regionMessage.className = "il-message good";
    regionMessage.textContent = `Helyes! ${explanation}`;
    position += 1;
    showCurrent();
  }

  function showCurrent() {
    current.textContent = position < order.length ? NUMBERS[order[position]][0] : "Kész!";
  }

  function restartPlacement() {
    order = NUMBERS.map((_, i) => i).sort(() => Math.random() - 0.5); position = 0; placedCounts = [0, 0, 0, 0];
    placedLayer.replaceChildren(); regionMessage.className = "il-message"; regionMessage.textContent = "";
    showCurrent();
  }

  // --- Operation tester ---
  const tester = card("Zárt-e a halmaz a műveletre?");
  const testState = { set: 0, operation: "−" };
  const tally = new Map();
  const setToggles = SETS.map((name, index) => toggle(name, index === 0, () => { testState.set = index; renderTester(true); }, REGION_COLORS[index]));
  const operationToggles = OPERATIONS.map((symbol) => toggle(symbol, symbol === testState.operation, () => { testState.operation = symbol; renderTester(true); }));
  const exampleLine = make("div", "il-formula");
  exampleLine.style.cssText += "font-size:22px;min-height:1.6em;";
  const testMessage = make("p", "il-message");
  const matrix = make("table", "il-table");
  tester.append(controls(make("span", "il-muted", "Halmaz:"), ...setToggles), controls(make("span", "il-muted", "Művelet:"), ...operationToggles), exampleLine, testMessage,
    controls(button("Új példa", () => newExample()), button("10 próba", () => { for (let i = 0; i < 10; i++) newExample(true); renderMatrix(); }, { ghost: true })), make("p", "il-muted", "✓: eddig nem találtunk ellenpéldát; ✗: találtunk, tehát a halmaz nem zárt."), matrix);
  root.append(regionCard, tester, keyIdea("egy halmaz zárt egy műveletre, ha bármely két elemén elvégezve a műveletet az eredmény is a halmazban marad. ℕ nem zárt a kivonásra, ℤ nem zárt az osztásra, ℚ nem zárt a gyökvonásra. Ezért bővítettük a számköröket: ℕ → ℤ → ℚ → ℝ."));

  function newExample(silent = false) {
    const { set, operation } = testState;
    let a = randomOperand(set, operation), b = operation === "√" ? null : randomOperand(set, operation);
    if (operation === ":" && b && (b.kind === "rat" ? b.n === 0 : b.value === 0)) b = set === 3 ? { kind: "real", text: "2", value: 2 } : rational(1 + pick(6));
    const result = compute(set, operation, a, b);
    const text = (x) => (x.kind === "rat" ? ratText(x) : x.text);
    const expression = operation === "√" ? `√(${text(a)})` : `${text(a)} ${operation} ${text(b)}`;
    const resultText = result.kind === "undefined" ? "nincs valós érték" : result.kind === "rat" ? ratText(result) : `≈ ${formatNumber(result.value, 4)}`;
    const smallest = smallestSet(result);
    const inside = smallest !== -1 && smallest <= set;
    const key = `${set}${operation}`;
    const record = tally.get(key) ?? { tried: 0, left: 0 };
    record.tried += 1; if (!inside) record.left += 1;
    tally.set(key, record);
    if (silent) return;
    exampleLine.textContent = `${expression} = ${resultText}`;
    testMessage.className = inside ? "il-message good" : "il-message warn";
    testMessage.textContent = inside ? `Ez az eredmény eleme ${SETS[set]}-nek: bent maradtunk. Próbálj másik példát: lehet, hogy van ellenpélda.`
      : result.kind === "undefined" ? `Az eredmény nem létezik a valós számok között, tehát kilépett: ${SETS[set]} nem zárt erre a műveletre.`
        : `Az eredmény ∉ ${SETS[set]}, hanem ${SETS[smallest]} eleme: kilépett! Ez egy ellenpélda, tehát ${SETS[set]} nem zárt erre a műveletre. ${smallest > set ? "Ezért kellett a számkört bővíteni." : ""}`;
    renderMatrix();
  }

  function renderMatrix() {
    const header = make("tr");
    header.append(make("th", "", ""), ...OPERATIONS.map((op) => make("th", "", op)));
    const rows = SETS.map((name, index) => {
      const tr = make("tr");
      tr.append(make("th", "", name));
      OPERATIONS.forEach((op) => {
        const record = tally.get(`${index}${op}`);
        const cell = make("td", "", !record ? "?" : record.left ? "✗" : "✓");
        cell.style.textAlign = "center";
        cell.style.color = !record ? "var(--dim)" : record.left ? PALETTE.red : PALETTE.green;
        tr.append(cell);
      });
      return tr;
    });
    matrix.replaceChildren(header, ...rows);
  }

  function renderTester(reset = false) {
    setToggles.forEach((t, i) => t.setAttribute("aria-pressed", String(i === testState.set)));
    operationToggles.forEach((t, i) => t.setAttribute("aria-pressed", String(OPERATIONS[i] === testState.operation)));
    if (reset) { exampleLine.textContent = ""; testMessage.className = "il-message"; testMessage.textContent = "Nyomd meg az Új példa gombot: véletlen elemeket választunk a halmazból."; }
    renderMatrix();
  }

  showCurrent();
  renderTester(true);
  return () => scope.clearAll();
}
