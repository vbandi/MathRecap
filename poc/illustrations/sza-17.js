import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, range, svg, withInstrumental } from "./kit.js";

const LIMIT = 100;
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const superscript = (n) => String(n).split("").map((d) => SUPERSCRIPT[Number(d)]).join("");
const smallestFactor = (n) => { for (let d = 2; d * d <= n; d++) if (n % d === 0) return d; return n; };
const isPrime = (n) => n > 1 && smallestFactor(n) === n;

// Factor tree: strategy 0 splits off the smallest prime, strategy 1 splits into the two closest factors.
function buildTree(n, strategy) {
  if (isPrime(n)) return { value: n, prime: true };
  let a = smallestFactor(n);
  if (strategy === 1) for (let d = Math.floor(Math.sqrt(n)); d > 1; d--) if (n % d === 0) { a = d; break; }
  return { value: n, children: [buildTree(a, strategy), buildTree(n / a, strategy)] };
}
const leavesOf = (node) => (node.children ? node.children.flatMap(leavesOf) : [node.value]);
const depthOf = (node) => (node.children ? 1 + Math.max(...node.children.map(depthOf)) : 0);
function powerForm(primes) {
  const counts = new Map();
  primes.forEach((p) => counts.set(p, (counts.get(p) ?? 0) + 1));
  return [...counts].map(([p, e]) => (e > 1 ? `${p}${superscript(e)}` : String(p))).join(" · ");
}

function drawTree(figure, tree, width, height) {
  figure.replaceChildren();
  const depth = depthOf(tree), gap = Math.min(52, (height - 50) / Math.max(1, depth)), leafCount = leavesOf(tree).length, slotWidth = Math.min(46, (width - 20) / leafCount);
  let leaf = 0;
  const place = (node, level) => {
    if (node.children) { const kids = node.children.map((child) => place(child, level + 1)); node.x = (kids[0].x + kids[1].x) / 2; }
    else node.x = width / 2 + (leaf++ - (leafCount - 1) / 2) * slotWidth;
    node.y = 28 + level * gap;
    return node;
  };
  place(tree, 0);
  const draw = (node) => {
    for (const child of node.children ?? []) { svg("line", { x1: node.x, y1: node.y, x2: child.x, y2: child.y, style: "stroke:var(--line-strong);stroke-width:2" }, figure); draw(child); }
  };
  draw(tree);
  const nodes = (node) => [node, ...(node.children ?? []).flatMap(nodes)];
  for (const node of nodes(tree)) {
    svg("circle", { cx: node.x, cy: node.y, r: 16, style: `fill:${node.prime ? PALETTE.green : "var(--surface)"};stroke:${node.prime ? "none" : "var(--fg-soft)"};stroke-width:2` }, figure);
    svg("text", { x: node.x, y: node.y + 5, "text-anchor": "middle", text: node.value, style: `font-size:${String(node.value).length > 2 ? 12 : 14}px;font-weight:700;fill:${node.prime ? "#fff" : "var(--fg)"}` }, figure);
  }
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("A prímszám olyan szám, amelynek pontosan két osztója van: az 1 és önmaga. Minden más szám (az 1-et kivéve) prímszámokból összeszorozható, és ez a felbontás, bárhogyan is kezded, mindig ugyanaz."));

  // --- Sieve ---
  const sieve = card("Eratoszthenész szitája");
  const cellW = 54, cellH = 34;
  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 360", role: "img" });
  const message = make("p", "il-message");
  let primes, crossed, lastMultiples, finished;
  const nextButton = button("Következő prím", step);
  sieve.append(controls(nextButton, button("Az összes lépés", () => { while (!finished) step(); }, { ghost: true }), button("Újra", reset, { ghost: true })), figure, message);
  function reset() {
    primes = []; crossed = new Set([1]); lastMultiples = new Set(); finished = false;
    message.className = "il-message"; message.textContent = "Az 1 nem prím, ezért kihúztuk. A következő kihúzatlan szám a 2: prím. Nyomd meg a gombot, és húzzuk ki a többszöröseit!";
    renderSieve();
  }
  function step() {
    let p = 2;
    while (p <= LIMIT && (crossed.has(p) || primes.includes(p))) p++;
    if (p > LIMIT) { finished = true; renderSieve(); return; }
    primes.push(p);
    lastMultiples = new Set();
    for (let m = 2 * p; m <= LIMIT; m += p) if (!crossed.has(m)) { crossed.add(m); lastMultiples.add(m); }
    message.className = "il-message good";
    message.textContent = p * p > LIMIT
      ? `${p} prím. Mivel ${p}² > ${LIMIT}, innentől nincs több kihúzandó összetett szám: a kihúzatlan számok mind prímek. Haladj tovább, hogy lásd őket!`
      : `${p} prím (zöld). Kihúztuk a többszöröseit: ${[...lastMultiples].slice(0, 5).join(", ")}${lastMultiples.size > 5 ? " és így tovább" : ""}. Ezek oszthatók ${withInstrumental(p)}, tehát nem prímek.`;
    if (!lastMultiples.size && p * p <= LIMIT) message.textContent = `${p} prím, de a többszörösei már ki vannak húzva.`;
    if (nothingLeft()) finished = true;
    renderSieve();
  }
  function nothingLeft() { for (let k = 2; k <= LIMIT; k++) if (!crossed.has(k) && !primes.includes(k)) return false; return true; }
  function renderSieve() {
    figure.replaceChildren();
    for (let n = 1; n <= LIMIT; n++) {
      const col = (n - 1) % 10, row = Math.floor((n - 1) / 10), x = 30 + col * cellW, y = 10 + row * cellH;
      const isPrimeFound = primes.includes(n), isCrossed = crossed.has(n), fresh = lastMultiples.has(n), current = n === primes.at(-1);
      svg("rect", { x, y, width: cellW - 4, height: cellH - 4, rx: 6, style: `fill:${isPrimeFound ? PALETTE.green : fresh ? PALETTE.amber : "var(--surface)"};opacity:${isCrossed && !fresh ? 0.45 : 1};stroke:${current ? "var(--accent)" : "none"};stroke-width:3` }, figure);
      svg("text", { x: x + (cellW - 4) / 2, y: y + 21, "text-anchor": "middle", text: n, style: `font-size:15px;font-weight:700;fill:${isPrimeFound || fresh ? "#fff" : isCrossed ? "var(--dim)" : "var(--fg)"};${isCrossed && !fresh ? "text-decoration:line-through" : ""}` }, figure);
    }
    nextButton.disabled = finished;
    if (finished && primes.length && !message.textContent.includes("Kész")) {
      const remaining = []; for (let k = 2; k <= LIMIT; k++) if (!crossed.has(k)) remaining.push(k);
      message.className = "il-message good";
      message.textContent = `Kész! Ami megmaradt, mind prím: ${remaining.join(", ")} (${remaining.length} db).`;
    }
  }

  // --- Factor trees ---
  const trees = card("Prímtényezős felbontás: két különböző fa");
  let n = 360;
  const slider = range({ label: "Szám", min: 2, max: 360, value: n, format: String, onInput: (value) => { n = value; renderTrees(); } });
  const grid = make("div");
  grid.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px";
  const figures = [0, 1].map(() => svg("svg", { class: "il-svg", viewBox: "0 0 300 340", role: "img" }));
  const titles = ["Mindig a legkisebb prímmel osztunk", "Két közel egyforma szorzótényezőre bontunk"];
  figures.forEach((fig, i) => { const box = make("div"); box.append(make("div", "il-muted", titles[i]), fig); grid.append(box); });
  const treeMessage = make("p", "il-message"), treeLine = make("div", "il-formula start");
  treeLine.style.fontSize = "20px";
  trees.append(controls(slider.element, button("Véletlen szám", () => { n = randomInt(12, 360); slider.set(n); renderTrees(); }, { ghost: true })), grid, treeLine, treeMessage);
  function renderTrees() {
    const built = [0, 1].map((strategy) => buildTree(n, strategy));
    built.forEach((tree, i) => drawTree(figures[i], tree, 300, 340));
    const primesA = leavesOf(built[0]).sort((a, b) => a - b), primesB = leavesOf(built[1]).sort((a, b) => a - b);
    treeLine.textContent = `${n} = ${primesA.join(" · ")}${primesA.length > 1 ? ` = ${powerForm(primesA)}` : ""}`;
    treeMessage.className = "il-message good";
    treeMessage.textContent = primesA.length === 1
      ? `${n} prímszám, ezért nem bontható tovább.`
      : `Mindkét fa levelei (zöld körök) ugyanazok a prímszámok: ${primesB.join(", ")}. A sorrend más lehet, de a felbontás egyértelmű.`;
  }

  root.append(sieve, trees, keyIdea("minden 1-nél nagyobb egész szám felbontható prímszámok szorzatára, és ez a felbontás (a sorrendtől eltekintve) egyetlen. A prímek a számok építőkövei, a szita pedig azokat szűri ki, amelyeknek nincs kisebb osztójuk."));
  reset(); renderTrees();
  return () => scope.clearAll();
}
