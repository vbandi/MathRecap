import { button, card, controls, createScope, fraction, gcd, keyIdea, lead, make, PALETTE, range, rich, svg } from "./kit.js";

const COLORS = { 2: PALETTE.red, 3: PALETTE.blue, 5: PALETTE.green, 7: PALETTE.amber, 11: PALETTE.violet, 13: PALETTE.pink };
const FALLBACK_COLOR = "var(--dim)";
const EXAMPLES = [[12, 18], [48, 180], [84, 126], [35, 64], [90, 150]];
const CHIP_RADIUS = 16;
const REGIONS = { onlyA: { x: 160, columns: 3 }, common: { x: 300, columns: 2 }, onlyB: { x: 440, columns: 3 } };

const lcm = (a, b) => (a * b) / gcd(a, b);

// Prime factorisation as a Map prime -> exponent.
function factorize(n) {
  const factors = new Map();
  for (let p = 2; n > 1; p++) {
    while (n % p === 0) { factors.set(p, (factors.get(p) ?? 0) + 1); n /= p; }
  }
  return factors;
}

function productText(primes) {
  return primes.length ? primes.join(" · ") : "1";
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Minden egész szám (2-től kezdve) egyértelműen felbontható prímszámok szorzatára. Ha két szám prímtényezőit egymás mellé tesszük, látszik, mi közös bennük, és ebből megkapjuk a legnagyobb közös osztójukat (LNKO) és a legkisebb közös többszörösüket (LKKT)."));

  const state = { a: 12, b: 18 };
  const main = card("Két szám prímtényezői");
  const sliderA = range({ label: "Első szám", min: 2, max: 200, value: state.a, format: String, onInput: (v) => { state.a = v; render(); } });
  const sliderB = range({ label: "Második szám", min: 2, max: 200, value: state.b, format: String, onInput: (v) => { state.b = v; render(); } });
  const exampleButtons = EXAMPLES.map(([a, b]) => button(`${a} és ${b}`, () => { state.a = a; state.b = b; render(); }, { ghost: true }));
  main.append(controls(sliderA.element, sliderB.element), controls(make("span", "il-muted", "Példák:"), ...exampleButtons));

  const figure = svg("svg", { class: "il-svg", viewBox: "0 0 600 310", role: "img" }, main);
  svg("circle", { cx: 220, cy: 150, r: 125, style: `fill:${PALETTE.blue};fill-opacity:.12;stroke:${PALETTE.blue};stroke-width:2` }, figure);
  svg("circle", { cx: 380, cy: 150, r: 125, style: `fill:${PALETTE.green};fill-opacity:.12;stroke:${PALETTE.green};stroke-width:2` }, figure);
  const titleA = svg("text", { x: 130, y: 20, "text-anchor": "middle", style: "font-weight:700" }, figure);
  const titleB = svg("text", { x: 470, y: 20, "text-anchor": "middle", style: "font-weight:700" }, figure);
  svg("text", { x: 300, y: 302, "text-anchor": "middle", text: "közös prímtényezők", style: "font-size:12px" }, figure);
  const chipLayer = svg("g", {}, figure);
  const chips = new Map();

  const gcdLine = make("div", "il-formula start");
  const lcmLine = make("div", "il-formula start");
  const checkLine = make("p", "il-message");
  main.append(gcdLine, lcmLine, checkLine);

  const application = card("Mire jó? Törtek egyszerűsítése és közös nevező");
  const simplifyLine = make("div", "il-formula start");
  const commonLine = make("div", "il-formula start");
  application.append(simplifyLine, commonLine);
  root.append(main, application, keyIdea("ami mindkét számban megvan, az a közös osztó: ezek szorzata az LNKO. Ha mindent egyszer összeszedünk, amire legalább az egyiknek szüksége van, az a közös többszörös: ez az LKKT. Mindig igaz, hogy LNKO · LKKT = a · b."));

  // Places chips of one region in a centred grid; returns keyed positions.
  function layout(list, region) {
    const { x, columns } = REGIONS[region];
    const spacing = 38;
    const rows = Math.ceil(list.length / columns);
    return list.map((item, index) => {
      const row = Math.floor(index / columns), inRow = Math.min(columns, list.length - row * columns);
      const col = index % columns;
      return { ...item, x: x + (col - (inRow - 1) / 2) * spacing, y: 150 + (row - (rows - 1) / 2) * spacing };
    });
  }

  function placeChip(item) {
    let chip = chips.get(item.key);
    if (!chip) {
      chip = svg("g", { class: "il-move", style: `transform:translate(${item.x}px,${item.y}px);opacity:0` }, chipLayer);
      svg("circle", { r: CHIP_RADIUS, style: `fill:${COLORS[item.prime] ?? FALLBACK_COLOR};stroke:var(--input);stroke-width:2` }, chip);
      svg("text", { "text-anchor": "middle", y: 5, text: String(item.prime), style: "fill:#fff;font-weight:700;font-size:14px" }, chip);
      chips.set(item.key, chip);
      scope.frame(() => scope.frame(() => { chip.style.opacity = 1; }));
    } else {
      chip.style.transform = `translate(${item.x}px,${item.y}px)`;
      chip.style.opacity = 1;
    }
  }

  function render() {
    sliderA.set(state.a); sliderB.set(state.b);
    const { a, b } = state;
    const factorsA = factorize(a), factorsB = factorize(b);
    const primes = [...new Set([...factorsA.keys(), ...factorsB.keys()])].sort((x, y) => x - y);
    const onlyA = [], onlyB = [], common = [];
    for (const prime of primes) {
      const ea = factorsA.get(prime) ?? 0, eb = factorsB.get(prime) ?? 0, shared = Math.min(ea, eb);
      for (let i = 0; i < shared; i++) common.push({ prime, key: `c${prime}#${i}` });
      for (let i = shared; i < ea; i++) onlyA.push({ prime, key: `a${prime}#${i}` });
      for (let i = shared; i < eb; i++) onlyB.push({ prime, key: `b${prime}#${i}` });
    }
    const wanted = new Set();
    for (const [list, region] of [[onlyA, "onlyA"], [common, "common"], [onlyB, "onlyB"]]) {
      for (const item of layout(list, region)) { wanted.add(item.key); placeChip(item); }
    }
    for (const [key, chip] of chips) {
      if (wanted.has(key)) continue;
      chips.delete(key);
      chip.style.opacity = 0;
      scope.timeout(() => chip.remove(), 450);
    }
    titleA.textContent = `${a} = ${productText([...factorsA].flatMap(([p, e]) => Array(e).fill(p)))}`;
    titleB.textContent = `${b} = ${productText([...factorsB].flatMap(([p, e]) => Array(e).fill(p)))}`;

    const g = gcd(a, b), l = lcm(a, b);
    const union = [...common, ...onlyA, ...onlyB].map((item) => item.prime).sort((x, y) => x - y);
    gcdLine.textContent = `LNKO(${a}; ${b}) = ${common.length ? productText(common.map((c) => c.prime)) + " = " : ""}${g}`;
    lcmLine.textContent = `LKKT(${a}; ${b}) = ${productText(union)} = ${l}`;
    checkLine.className = "il-message good";
    checkLine.textContent = g === 1
      ? `A két számnak nincs közös prímtényezője, az LNKO 1 (relatív prímek). Ellenőrzés: ${g} · ${l} = ${g * l} = ${a} · ${b}.`
      : `Ellenőrzés: ${g} · ${l} = ${g * l} = ${a} · ${b}.`;

    simplifyLine.replaceChildren(g === 1
      ? rich(fraction(a, b), " már nem egyszerűsíthető: nincs közös prímtényező.")
      : rich(fraction(a, b), " = ", fraction(`${a / g} · ${g}`, `${b / g} · ${g}`), " = ", fraction(a / g, b / g), `   (a közös ${g}-t elhagyjuk)`));
    const numeratorSum = l / a + l / b;
    commonLine.replaceChildren(rich(fraction(1, a), " + ", fraction(1, b), " = ", fraction(l / a, l), " + ", fraction(l / b, l), " = ", fraction(numeratorSum, l), `   (közös nevező: az LKKT, ${l})`));
  }

  render();
  return () => scope.clearAll();
}
