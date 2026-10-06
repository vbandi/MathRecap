import { button, card, controls, createScope, fraction, keyIdea, lead, make, PALETTE, rich, stepper, svg, toggle } from "./kit.js";

const SUPERSCRIPTS = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹", "-": "⁻" };
const CHIP = 22, STEP = 28, WIDTH = 600;

const sup = (n) => String(n).replace("-", "−").split("").map((c) => SUPERSCRIPTS[c === "−" ? "-" : c]).join("");
const power = (base, exponent) => `${base}${sup(exponent)}`;

export function mount(root) {
  const scope = createScope();
  root.append(lead("Az aⁿ hatvány n darab a tényezős szorzatot jelent. Ha a tényezőket láncnak képzeled el, a hatványozás azonosságai csak annyit mondanak: mit történik a lánccal, ha összeragasztod, leegyszerűsíted vagy csoportokba rendezed."));

  const state = { base: 2, m: 3, n: 2, operation: "product", cancelled: false };
  const main = card("Tényezőláncok");
  const baseControl = stepper({ label: "Alap (a)", min: 2, max: 5, value: state.base, onChange: (v) => { state.base = v; render(); } });
  const mControl = stepper({ label: "m", min: 0, max: 6, value: state.m, onChange: (v) => { state.m = v; state.cancelled = false; render(); } });
  const nControl = stepper({ label: "n", min: 0, max: 6, value: state.n, onChange: (v) => { state.n = v; state.cancelled = false; render(); } });
  const operations = [["product", "aᵐ · aⁿ"], ["quotient", "aᵐ : aⁿ"], ["nested", "(aᵐ)ⁿ"]];
  const operationToggles = operations.map(([key, label]) => toggle(label, key === state.operation, () => { state.operation = key; state.cancelled = false; render(); }));
  main.append(controls(...operationToggles), controls(baseControl.element, mControl.element, nControl.element));
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} 230`, role: "img" }, main);
  const layer = svg("g", {}, figure);
  const formulaLine = make("div", "il-formula start");
  const numbersLine = make("div", "il-formula start");
  const cancelButton = button("Egyszerűsíts", () => { state.cancelled = true; render(); });
  const message = make("p", "il-message");
  main.append(formulaLine, numbersLine, controls(cancelButton), message);

  // Permanence table: each step down divides by the base.
  const table = card("Mi legyen a 0. és a negatív kitevő? A minta folytatása");
  table.append(make("p", "", "Minden sorban eggyel csökken a kitevő, az érték pedig az alappal osztódik. Folytassuk a mintát akkor is, ha a kitevő már nem pozitív egész!"));
  const tableBody = make("table", "il-table");
  tableBody.style.fontSize = "16px";
  const tableMessage = make("p", "il-message");
  let revealed = 3;
  const nextRow = button("Következő sor", () => { revealed = Math.min(7, revealed + 1); renderTable(); });
  table.append(tableBody, controls(nextRow, button("Újra", () => { revealed = 3; renderTable(); }, { ghost: true })), tableMessage);
  root.append(main, table, keyIdea("a hatványok szorzásakor a kitevők összeadódnak, osztásakor kivonódnak, hatvány hatványozásakor összeszorzódnak. Ha a mintát folytatjuk, a⁰ = 1 és a⁻ⁿ = 1/aⁿ adódik."));

  function chip(x, y, color, faded = false) {
    const group = svg("g", { opacity: faded ? 0.25 : 1 }, layer);
    svg("circle", { cx: x, cy: y, r: CHIP / 2, style: `fill:${color}` }, group);
    svg("text", { x, y: y + 5, "text-anchor": "middle", text: "a", style: "fill:#fff;font-weight:700;font-size:14px;font-style:italic" }, group);
    return group;
  }

  function row(count, startX, y, color, cancelledCount = 0) {
    for (let i = 0; i < count; i++) chip(startX + i * STEP, y, color, i < cancelledCount);
  }

  function label(x, y, text, color) {
    svg("text", { x, y, "text-anchor": "middle", text, style: `fill:${color};font-weight:700;font-size:14px` }, layer);
  }

  function render() {
    const { base, m, n, operation, cancelled } = state;
    baseControl.set(base); mControl.set(m); nControl.set(n);
    operationToggles.forEach((t, i) => t.setAttribute("aria-pressed", String(operations[i][0] === operation)));
    layer.replaceChildren();
    cancelButton.style.visibility = operation === "quotient" ? "visible" : "hidden";
    cancelButton.disabled = cancelled || Math.min(m, n) === 0;
    message.className = "il-message";
    const a = base;
    if (operation === "product") {
      const x0 = 20;
      row(m, x0 + 12, 70, PALETTE.blue);
      row(n, x0 + 12 + (m + (m && n ? 0.6 : 0)) * STEP, 70, PALETTE.green);
      if (m) label(x0 + 12 + ((m - 1) * STEP) / 2, 105, `aᵐ: ${m} tényező`, PALETTE.blue);
      if (n) label(x0 + 12 + (m + 0.6) * STEP + ((n - 1) * STEP) / 2, 130, `aⁿ: ${n} tényező`, PALETTE.green);
      label(300, 190, `összesen ${m} + ${n} = ${m + n} tényező`, "var(--fg)");
      formulaLine.textContent = `a${sup(m)} · a${sup(n)} = a${sup(m + n)}`;
      numbersLine.textContent = `${power(a, m)} · ${power(a, n)} = ${a ** m} · ${a ** n} = ${a ** (m + n)} = ${power(a, m + n)}`;
      message.textContent = "A két láncot egymás mellé tesszük: a tényezők száma összeadódik.";
    } else if (operation === "quotient") {
      const cancelledCount = cancelled ? Math.min(m, n) : 0;
      row(m, 40, 50, PALETTE.blue, cancelledCount);
      svg("line", { x1: 20, x2: 20 + Math.max(m, n, 1) * STEP + 20, y1: 95, y2: 95, style: "stroke:var(--fg);stroke-width:2" }, layer);
      row(n, 40, 140, PALETTE.green, cancelledCount);
      if (cancelled) for (let i = 0; i < cancelledCount; i++) svg("line", { x1: 40 + i * STEP, x2: 40 + i * STEP, y1: 61, y2: 129, style: `stroke:${PALETTE.amber};stroke-width:2;stroke-dasharray:4 3` }, layer);
      label(300, 200, cancelled ? `maradt: ${Math.abs(m - n)} tényező ${m >= n ? "a számlálóban" : "a nevezőben"}` : "a számlálóban m, a nevezőben n tényező", "var(--fg)");
      formulaLine.textContent = `a${sup(m)} : a${sup(n)} = a${sup(m - n)}`;
      numbersLine.textContent = `${power(a, m)} : ${power(a, n)} = ${a ** m} : ${a ** n} = ${formatQuotient(a ** m, a ** n)}${m >= n ? ` = ${power(a, m - n)}` : ` = 1/${power(a, n - m)} = ${power(a, m - n)}`}`;
      message.textContent = cancelled
        ? (m >= n ? `Mindegyik nevezőbeli a-t egy számlálóbelivel egyszerűsítettük: ${m - n} tényező maradt.` : `A számlálóbeli tényezők elfogytak, a nevezőben ${n - m} maradt: ez a negatív kitevő (${power(a, m - n)}).`)
        : "Nyomd meg az Egyszerűsíts gombot: minden számlálóbeli a-t párosítunk egy nevezőbelivel.";
    } else {
      for (let group = 0; group < n; group++) {
        const gx = 20 + (group % 3) * 190, gy = 40 + Math.floor(group / 3) * 70;
        svg("rect", { x: gx - 10, y: gy - 18, width: Math.max(m, 1) * STEP + 4 + 12, height: 38, rx: 10, fill: "none", style: `stroke:${group % 2 ? PALETTE.green : PALETTE.blue};stroke-width:2` }, layer);
        row(m, gx + 10, gy, group % 2 ? PALETTE.green : PALETTE.blue);
      }
      label(300, 200, `${n} csoport · ${m} tényező = ${m * n} tényező`, "var(--fg)");
      formulaLine.textContent = `(a${sup(m)})${sup(n)} = a${sup(m * n)}`;
      numbersLine.textContent = `(${power(a, m)})${sup(n)} = ${a ** m}${sup(n)} = ${(a ** m) ** n} = ${power(a, m * n)}`;
      message.textContent = `Az aᵐ láncot n-szer vesszük: ${n} csoport lesz, mindegyikben ${m} tényező. Összesen ${m}·${n} tényező.`;
    }
  }

  function formatQuotient(top, bottom) {
    return top >= bottom ? String(top / bottom) : `${top}/${bottom}`;
  }

  function renderTable() {
    const rows = [3, 2, 1, 0, -1, -2, -3];
    const a = state.base;
    tableBody.replaceChildren();
    const head = make("tr");
    head.append(make("th", "", "hatvány"), make("th", "", "érték"), make("th", "", ""));
    tableBody.append(head);
    rows.forEach((k, index) => {
      const visible = index < revealed;
      const tr = make("tr");
      const valueCell = make("td");
      valueCell.append(k >= 0 ? String(a ** k) : fraction(1, a ** -k));
      const arrow = make("td", "", index ? `↓ : ${a}` : "");
      arrow.style.cssText = "color:var(--dim);white-space:nowrap;text-align:left;width:8ch";
      const name = make("td", "", power(a, k));
      name.style.textAlign = "left";
      tr.append(name, valueCell, arrow);
      const latest = index === revealed - 1 && index >= 3;
      [name, valueCell].forEach((cell) => { cell.className = visible ? "il-fade" : "il-fade il-dim"; if (!visible) { cell.style.opacity = 0.35; cell.replaceChildren("?"); } if (latest) cell.style.color = "var(--accent)"; });
      tableBody.append(tr);
    });
    nextRow.disabled = revealed >= 7;
    const last = rows[revealed - 1];
    tableMessage.className = revealed >= 7 ? "il-message good" : "il-message";
    tableMessage.textContent = revealed === 3 ? `Látod a mintát? Mindig elosztjuk ${a}-val. Mi jöhet a ${power(a, 1)} után?`
      : last === 0 ? `${a} : ${a} = 1, tehát ${power(a, 0)} = 1. Bármely nem nulla alapra igaz, hogy a⁰ = 1.`
        : last < 0 ? `${power(a, last)} = 1/${power(a, -last)}: a negatív kitevő a reciprok hatványát jelenti.` : "";
  }

  render();
  renderTable();
  return () => scope.clearAll();
}
