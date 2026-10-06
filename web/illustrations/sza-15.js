import { button, card, controls, createScope, fraction, gcd, keyIdea, lead, make, PALETTE, rich, stepper, svg } from "./kit.js";

const lcm = (a, b) => (a * b) / gcd(a, b);
const ADD_EXAMPLES = [[1, 2, 1, 3], [1, 4, 2, 3], [2, 5, 1, 2], [1, 6, 1, 4], [3, 8, 1, 4], [1, 3, 1, 4], [2, 9, 1, 3]];
const simplified = (n, d) => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
const equalsSimplified = (n, d) => { const [sn, sd] = simplified(n, d); return sn === n && sd === d ? null : rich(" = ", fraction(sn, sd)); };

export function mount(root) {
  const scope = createScope();
  root.append(lead("A törteknél a műveletek képekkel is követhetők: a szorzás egy téglalap átfedő részét adja, az osztás azt számolja, hányszor fér bele valami, az összeadáshoz pedig azonos méretű részekre kell vágni a törteket."));

  // --- Multiplication as overlap ---
  const multiply = card("Szorzás: a két tört átfedése");
  const m = { a: 2, b: 3, c: 3, d: 4 };
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 250", role: "img" });
  const multiplyLine = make("div", "il-formula start"), multiplyMessage = make("p", "il-message");
  const control = (label, key, min, max) => stepper({ label, min, max, value: m[key], onChange: (v) => { m[key] = v; if (m.a > m.b) m.a = m.b; if (m.c > m.d) m.c = m.d; renderMultiply(); } }).element;
  multiply.append(controls(control("Első számláló", "a", 0, 8), control("Első nevező", "b", 1, 8)), controls(control("Második számláló", "c", 0, 8), control("Második nevező", "d", 1, 8)), figure, multiplyLine, multiplyMessage);
  function renderMultiply() {
    const a = Math.min(m.a, m.b), c = Math.min(m.c, m.d), { b, d } = m, width = 260, height = 200, x0 = 30, y0 = 28;
    figure.replaceChildren();
    for (let col = 0; col < b; col++) for (let row = 0; row < d; row++) {
      const inColumn = col < a, inRow = row < c;
      const fill = inColumn && inRow ? PALETTE.green : inColumn ? PALETTE.blue : inRow ? PALETTE.amber : "var(--surface)";
      svg("rect", { x: x0 + (col * width) / b + 1, y: y0 + (row * height) / d + 1, width: width / b - 2, height: height / d - 2, rx: 3, style: `fill:${fill};opacity:${inColumn || inRow ? 0.85 : 1};stroke:var(--line)` }, figure);
    }
    svg("rect", { x: x0, y: y0, width, height, fill: "none", style: "stroke:var(--fg-soft);stroke-width:2" }, figure);
    const note = (y, color, text) => svg("text", { x: 320, y, text, style: `fill:${color};font-size:15px;font-weight:700` }, figure);
    note(60, PALETTE.blue, `Kék: ${a}/${b} (${b} oszlopból ${a})`);
    note(95, PALETTE.amber, `Sárga: ${c}/${d} (${d} sorból ${c})`);
    note(140, PALETTE.green, `Zöld: ahol átfedik egymást, ${a * c} kis rész`);
    note(175, "var(--fg-soft)", `Az egész ${b * d} egyforma részből áll`);
    multiplyLine.replaceChildren(rich(fraction(a, b), " · ", fraction(c, d), " = ", fraction(a * c, b * d), equalsSimplified(a * c, b * d) ?? ""));
    multiplyMessage.className = "il-message good";
    multiplyMessage.textContent = "A szorzat számlálója a két számláló szorzata (az átfedő kis részek száma), a nevezője a két nevező szorzata (az összes kis rész száma).";
  }

  // --- Division as "how many fit" ---
  const divide = card("Osztás: hányszor fér bele?");
  const dv = { n: 3, p: 1, q: 4 };
  const divFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 190", role: "img" });
  const divLine = make("div", "il-formula start"), divMessage = make("p", "il-message");
  const dvControl = (label, key, min, max) => stepper({ label, min, max, value: dv[key], onChange: (v) => { dv[key] = v; if (dv.p > dv.q) dv.p = dv.q; renderDivide(); } }).element;
  divide.append(controls(dvControl("Egészek száma", "n", 1, 4), dvControl("Osztó számlálója", "p", 1, 8), dvControl("Osztó nevezője", "q", 2, 8)), divFigure, divLine, divMessage);
  function renderDivide() {
    const { n } = dv, q = dv.q, p = Math.min(dv.p, q), pieceWidth = 520 / (n * q), rows = n;
    divFigure.replaceChildren();
    // All pieces of size 1/q in a row, grouped into chunks of p pieces.
    const total = n * q, fullGroups = Math.floor(total / p), rest = total % p, colors = [PALETTE.blue, PALETTE.green];
    for (let i = 0; i < total; i++) {
      const group = Math.floor(i / p), leftover = group >= fullGroups;
      svg("rect", { x: 40 + i * pieceWidth + 1, y: 40, width: pieceWidth - 2, height: 60, rx: 3, style: `fill:${leftover ? "var(--surface)" : colors[group % 2]};stroke:${leftover ? PALETTE.red : "var(--bg)"};stroke-width:${leftover ? 2 : 1};opacity:.9` }, divFigure);
    }
    for (let k = 1; k < rows; k++) svg("line", { x1: 40 + k * q * pieceWidth, x2: 40 + k * q * pieceWidth, y1: 30, y2: 112, style: "stroke:var(--fg);stroke-width:3" }, divFigure);
    svg("text", { x: 300, y: 24, "text-anchor": "middle", text: `${n} egész, mindegyik ${q} egyenlő részre vágva`, style: "font-size:14px" }, divFigure);
    svg("text", { x: 300, y: 140, "text-anchor": "middle", text: `${fullGroups} teljes csoport (${p} rész = ${p}/${q})${rest ? `, és ${rest} rész marad` : ""}`, style: "font-size:15px;font-weight:700;fill:var(--fg-soft)" }, divFigure);
    const result = n * q;
    divLine.replaceChildren(rich(`${n} : `, fraction(p, q), ` = ${n} · `, fraction(q, p), " = ", fraction(result, p), equalsSimplified(result, p) ?? "", p === 1 ? ` = ${result}` : ""));
    divMessage.className = "il-message good";
    divMessage.textContent = p === 1
      ? `${n} egészben ${result} darab 1/${q} fér el, tehát ${n} : 1/${q} = ${result}. Osztani törttel annyi, mint a reciprokával szorozni.`
      : `${n} egész ${total} darab 1/${q}-ből áll, és ${p} darabonként csoportosítjuk őket: ${rest ? `${fullGroups} teljes csoport és még ${rest}/${p} csoport` : `${fullGroups} csoport`} lesz.`;
  }

  // --- Reciprocal ---
  const recip = card("Reciprok: megfordított tört");
  const r = { p: 2, q: 5 };
  const flipBox = make("div", "il-formula"), recipMessage = make("p", "il-message");
  let flipped = false;
  flipBox.style.cssText += ";font-size:30px;display:flex;justify-content:center;align-items:center;gap:1ch;min-height:4em;perspective:400px";
  const recipControl = (label, key) => stepper({ label, min: 1, max: 9, value: r[key], onChange: (v) => { r[key] = v; renderRecip(); } }).element;
  recip.append(controls(recipControl("Számláló", "p"), recipControl("Nevező", "q"), button("Fordítsd meg!", () => { flipped = !flipped; renderRecip(); })), flipBox, recipMessage);
  function renderRecip() {
    const { p, q } = r, shown = flipped ? [q, p] : [p, q];
    const fractionBox = make("span");
    fractionBox.style.cssText = "display:inline-block;transition:transform .6s;transform-origin:center";
    fractionBox.append(fraction(...shown));
    flipBox.replaceChildren(fractionBox, make("span", "il-muted", flipped ? "a reciproka" : "az eredeti"));
    recipMessage.className = "il-message good";
    recipMessage.replaceChildren(rich(fraction(p, q), " · ", fraction(q, p), " = ", fraction(p * q, p * q), " = 1. Két szám reciproka egymásnak, ha a szorzatuk 1. ", `Például 3/4 : ${p}/${q} = 3/4 · ${q}/${p} = ${3 * q}/${4 * p}${equalsSimplified(3 * q, 4 * p) ? ` = ${simplified(3 * q, 4 * p).join("/")}` : ""}.`));
  }

  // --- Addition via common denominator ---
  const add = card("Összeadás: közös nevező");
  let exampleIndex = 0, stage = 0;
  const addFigure = svg("svg", { class: "il-svg", viewBox: "0 0 600 210", role: "img" });
  const addLine = make("div", "il-formula start"), addMessage = make("p", "il-message");
  const addNext = button("Következő lépés", () => { stage = Math.min(2, stage + 1); renderAdd(); });
  add.append(controls(addNext, button("Új példa", () => { exampleIndex = (exampleIndex + 1) % ADD_EXAMPLES.length; stage = 0; renderAdd(); }, { ghost: true })), addFigure, addLine, addMessage);
  function bar(y, n, d, color) {
    svg("rect", { x: 40, y, width: 520, height: 38, rx: 6, style: "fill:var(--surface)" }, addFigure);
    svg("rect", { x: 40, y, width: (520 * n) / d, height: 38, rx: 6, style: `fill:${color};opacity:.9` }, addFigure);
    for (let i = 1; i < d; i++) svg("line", { x1: 40 + (520 * i) / d, x2: 40 + (520 * i) / d, y1: y, y2: y + 38, style: "stroke:var(--bg);stroke-width:2.5" }, addFigure);
    svg("rect", { x: 40, y, width: 520, height: 38, rx: 6, fill: "none", style: "stroke:var(--line-strong);stroke-width:2" }, addFigure);
  }
  function renderAdd() {
    const [n1, d1, n2, d2] = ADD_EXAMPLES[exampleIndex], common = lcm(d1, d2), f1 = common / d1, f2 = common / d2;
    const [a, b, c, d] = stage >= 1 ? [n1 * f1, common, n2 * f2, common] : [n1, d1, n2, d2];
    addFigure.replaceChildren();
    bar(12, a, b, PALETTE.violet); bar(62, c, d, PALETTE.green);
    if (stage === 2) bar(132, a + c, common, PALETTE.amber);
    svg("text", { x: 300, y: 122, "text-anchor": "middle", text: stage === 2 ? "összeadva" : "", style: "font-size:13px" }, addFigure);
    const parts = [fraction(n1, d1), " + ", fraction(n2, d2)];
    if (stage >= 1) parts.push(" = ", fraction(a, b), " + ", fraction(c, d));
    if (stage >= 2) parts.push(" = ", fraction(a + c, common), equalsSimplified(a + c, common) ?? "");
    addLine.replaceChildren(rich(...parts));
    addNext.disabled = stage === 2;
    addMessage.className = "il-message good";
    addMessage.textContent = stage === 0 ? `A nevezők különbözők (${d1} és ${d2}), ezért a részek nem egyforma nagyok, és nem adhatók össze. Olyan felosztás kell, amely mindkettőnek jó: a nevezők legkisebb közös többszöröse ${common}.`
      : stage === 1 ? `Mindkét sávot ${common} egyenlő részre vágtuk. A tört értéke nem változott, csak a számláló és a nevező is szorzódott (${f1}-szeresére, illetve ${f2}-szeresére).`
        : `Most már azonos méretű részeink vannak, ezért csak a részek számát adjuk össze: ${a} + ${c} = ${a + c}, a nevező marad ${common}.`;
  }

  root.append(multiply, divide, recip, add, keyIdea("törteket szorozni a számlálót a számlálóval, a nevezőt a nevezővel kell. Osztás helyett a reciprokkal szorzunk, az összeadáshoz pedig előbb közös nevezőre kell hozni a törteket, mert csak azonos méretű részeket lehet összeadni."));
  renderMultiply(); renderDivide(); renderRecip(); renderAdd();
  return () => scope.clearAll();
}
