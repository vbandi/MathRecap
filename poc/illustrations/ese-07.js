import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, svg } from "./kit.js";

const ROWS = 10; // rows 0..9
const WIDTH = 640, HEIGHT = 330, DX = 56, DY = 31, TOP = 24;
const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";

function pascal(n, k) {
  let value = 1;
  for (let i = 1; i <= k; i++) value = (value * (n - k + i)) / i;
  return Math.round(value);
}
const sup = (power) => String(power).split("").map((d) => SUPERSCRIPT[Number(d)]).join("");

export function mount(root) {
  const scope = createScope();
  let visibleEntries = 15, selected = { n: 4, k: 2 }, flash = [], timer = null;
  const nodes = [];
  const total = (ROWS * (ROWS + 1)) / 2;
  const rowLength = (entries) => { let n = 0; while ((n * (n + 1)) / 2 <= entries) n += 1; return n; };

  root.append(lead("A Pascal-háromszög egy szám-piramis: a szélein 1-esek állnak, belül minden szám a fölötte lévő két szám összege. Számos számolás rejtőzik benne, például az, hogy hányféleképp választhatunk ki valamennyi dolgot egy csoportból."));

  const triangleCard = card("Építsd fel a háromszöget");
  const buildControls = make("div", "il-controls");
  const figure = svg("svg", { class: "il-svg", viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: "img", "aria-label": "Pascal-háromszög" });
  const messageLine = make("p", "il-message");
  triangleCard.append(buildControls, figure, messageLine);

  const pathCard = card("Egy szám, sokféle jelentés");
  const entryLine = make("div", "il-formula start");
  const latticeFigure = svg("svg", { class: "il-svg", viewBox: "0 0 360 220", role: "img", "aria-label": "Rácsutak száma" });
  latticeFigure.style.maxWidth = "360px";
  const latticeText = make("p", "il-muted");
  pathCard.append(entryLine, latticeFigure, latticeText);

  const rowCard = card("A kiválasztott sor");
  const expansion = make("div", "il-formula start");
  const sumLine = make("div", "il-formula start");
  rowCard.append(expansion, sumLine);

  root.append(triangleCard, pathCard, rowCard, keyIdea("a háromszög n-edik sorának k-adik száma a C(n, k) kombinációszám. Minden szám a fölötte lévő két szám összege, az n-edik sor összege 2ⁿ, a sor számai pedig az (a + b)ⁿ kifejtésének együtthatói."));

  const position = (n, k) => ({ x: WIDTH / 2 + (k - n / 2) * DX, y: TOP + n * DY });

  for (let n = 0; n < ROWS; n++) for (let k = 0; k <= n; k++) {
    const { x, y } = position(n, k);
    const group = svg("g", { class: "il-fade il-item", tabindex: 0, role: "button", "aria-label": `${n}. sor, ${k}. szám: ${pascal(n, k)}` }, figure);
    svg("rect", { x: x - 22, y: y - 12, width: 44, height: 24, rx: 12, fill: "var(--surface)", stroke: "var(--line-strong)" }, group);
    svg("text", { x, y: y + 4.5, "text-anchor": "middle", text: String(pascal(n, k)), style: "font-weight:600" }, group);
    const select = () => { selected = { n, k }; render(); };
    group.addEventListener("click", select);
    group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); } });
    nodes.push({ index: nodes.length, n, k, group, rect: group.querySelector("rect") });
  }

  buildControls.append(
    button("Következő sor", nextRow),
    button("Az összes sor", () => { stopTimer(); visibleEntries = total; flash = []; render(); }, { ghost: true }),
    button("Újrakezdés", () => { stopTimer(); visibleEntries = 3; selected = { n: Math.min(selected.n, 1), k: 0 }; flash = []; render(); }, { ghost: true }),
  );

  function stopTimer() { if (timer !== null) { scope.clearInterval(timer); timer = null; } }

  function nextRow() {
    if (timer !== null || visibleEntries >= total) return;
    const target = Math.min(total, visibleEntries + rowLength(visibleEntries));
    timer = scope.interval(() => {
      const node = nodes[visibleEntries];
      flash = node.n > 0 ? [[node.n - 1, node.k - 1], [node.n - 1, node.k]].filter(([a, b]) => b >= 0 && b <= a) : [];
      visibleEntries += 1;
      if (visibleEntries >= target) { stopTimer(); flash = []; }
      render();
    }, 380);
  }

  function render() {
    for (const node of nodes) {
      const visible = node.index < visibleEntries;
      node.group.style.opacity = visible ? 1 : 0;
      node.group.style.pointerEvents = visible ? "" : "none";
      const isSelected = node.n === selected.n && node.k === selected.k;
      const isParent = !isSelected && selected.n > 0 && node.n === selected.n - 1 && (node.k === selected.k || node.k === selected.k - 1);
      const isFlash = flash.some(([a, b]) => a === node.n && b === node.k);
      const inRow = node.n === selected.n;
      node.rect.setAttribute("stroke", isSelected ? "var(--accent)" : isFlash ? PALETTE.amber : isParent ? PALETTE.violet : "var(--line-strong)");
      node.rect.setAttribute("stroke-width", isSelected || isFlash || isParent ? 2.5 : 1);
      node.rect.setAttribute("fill", isSelected ? "var(--accent-soft)" : isFlash ? "rgba(232,163,61,.25)" : inRow ? "rgba(255,255,255,.07)" : "var(--surface)");
    }
    const { n, k } = selected;
    messageLine.textContent = n === 0
      ? "A csúcson az 1 áll. Kattints egy számra, hogy lásd, honnan jön!"
      : k === 0 || k === n
        ? `A ${n}. sor szélén mindig 1 áll: csak egy módon lehet a semmit, illetve mindent kiválasztani.`
        : `${pascal(n - 1, k - 1)} + ${pascal(n - 1, k)} = ${pascal(n, k)}: a kijelölt szám a fölötte lévő két szám (lila keret) összege.`;

    entryLine.replaceChildren(`C(${n}, ${k}) = `, make("b", "", String(pascal(n, k))), `  (a ${n}. sor ${k}. száma, a számozás 0-tól indul)`);
    drawLattice();

    expansion.replaceChildren(`(a + b)${sup(n)} = `);
    if (n === 0) expansion.append("1");
    for (let i = 0; i <= n; i++) {
      const coefficient = pascal(n, i);
      const aPower = n - i, bPower = i;
      const part = make("span", i === k ? "il-accent" : "", `${coefficient === 1 && n > 0 ? "" : coefficient}${aPower > 0 ? "a" + (aPower > 1 ? sup(aPower) : "") : ""}${bPower > 0 ? "b" + (bPower > 1 ? sup(bPower) : "") : ""}`);
      if (i === k) part.style.fontWeight = "700";
      if (i > 0) expansion.append(" + ");
      expansion.append(part);
    }
    const values = Array.from({ length: n + 1 }, (_, i) => pascal(n, i));
    sumLine.replaceChildren(`${values.join(" + ")} = `, make("b", "", String(2 ** n)), ` = 2${sup(n)}`);
  }

  function drawLattice() {
    latticeFigure.replaceChildren();
    const { n, k } = selected;
    const right = k, down = n - k;
    const cell = Math.min(54, 320 / Math.max(1, right), 170 / Math.max(1, down));
    const x0 = 20, y0 = 20;
    for (let r = 0; r <= down; r++) for (let c = 0; c <= right; c++) {
      const x = x0 + c * cell, y = y0 + r * cell;
      if (c < right) svg("line", { x1: x, y1: y, x2: x + cell, y2: y, stroke: "var(--line-strong)", "stroke-width": 1.5 }, latticeFigure);
      if (r < down) svg("line", { x1: x, y1: y, x2: x, y2: y + cell, stroke: "var(--line-strong)", "stroke-width": 1.5 }, latticeFigure);
    }
    for (let r = 0; r <= down; r++) for (let c = 0; c <= right; c++) {
      const x = x0 + c * cell, y = y0 + r * cell;
      const target = r === down && c === right;
      svg("circle", { cx: x, cy: y, r: 11, fill: target ? "var(--accent)" : "var(--surface)", stroke: target ? "none" : "var(--line-strong)" }, latticeFigure);
      svg("text", { x, y: y + 4, "text-anchor": "middle", text: String(pascal(r + c, c)), style: target ? "fill:var(--accent-ink);font-weight:700;font-size:11px" : "font-size:11px" }, latticeFigure);
    }
    latticeText.textContent = `Rácsút: a bal felső sarokból ${right} lépést jobbra és ${down} lépést lefelé teszünk, bármilyen sorrendben. Minden csomóponton az odavezető utak száma áll; a jobb alsó sarokba ${pascal(n, k)} út vezet. (Minden út ${n} lépés, ebből ${k} jobbra: C(${n}, ${k}).)`;
  }

  render();
  return () => { stopTimer(); scope.clearAll(); };
}
