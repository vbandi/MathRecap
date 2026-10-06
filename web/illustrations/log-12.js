import { button, card, controls, createScope, equation, keyIdea, lead, make, rich, toggle } from "./kit.js";

const NUMBERS = Array.from({ length: 16 }, (_, i) => i + 1);
const by4 = (n) => n % 4 === 0, even = (n) => n % 2 === 0;
const YES_NO = (value) => (value ? "igen" : "nem");
const OPTIONS = [
  { text: "Ha egy szám osztható 4-gyel, akkor nem páros.", correct: false, why: "Ez nem a tagadás, hanem egy másik „ha…, akkor…” állítás, és hamis is: a 4 osztható 4-gyel, és páros. A „ha…, akkor…” tagadása nem „ha…, akkor…”." },
  { text: "Van olyan szám, amely osztható 4-gyel, de nem páros.", correct: true, why: "Helyes! Az állítás pontosan akkor hamis, ha van olyan szám, amelyre az előtag igaz, az utótag viszont hamis. Itt az eredeti állítás igaz, ezért ez a tagadás hamis: nincs ilyen szám." },
  { text: "Ha egy szám nem osztható 4-gyel, akkor nem páros.", correct: false, why: "Ez az eredeti állítás megfordítása mindkét részének tagadásával, és hamis: a 6 nem osztható 4-gyel, mégis páros. Nem ez a tagadás." },
];
const GRID = Array.from({ length: 12 }, (_, i) => i + 1);
const isA = (n) => n % 2 === 0, isB = (n) => n > 5;
const LAWS = [
  { name: "nem (A és B)  =  nem A vagy nem B", left: "nem (A és B)", right: "nem A vagy nem B", l: (n) => !(isA(n) && isB(n)), r: (n) => !isA(n) || !isB(n) },
  { name: "nem (A vagy B)  =  nem A és nem B", left: "nem (A vagy B)", right: "nem A és nem B", l: (n) => !(isA(n) || isB(n)), r: (n) => !isA(n) && !isB(n) },
];

function numberRow(test, { active = null, flagged = null, current = null } = {}) {
  const row = make("div");
  row.style.cssText = "display:flex;flex-wrap:wrap;gap:5px;margin:6px 0";
  for (const n of (active ?? GRID)) {
    const cell = make("span", "", String(n));
    const on = test(n), flag = flagged === n, now = current === n;
    cell.style.cssText = `display:inline-block;min-width:32px;padding:6px 0;text-align:center;border-radius:9px;border:2px solid ${flag ? "var(--il-red)" : now ? "var(--il-amber)" : on ? "var(--accent)" : "var(--line-strong)"};background:${on ? "color-mix(in srgb, var(--accent) 28%, transparent)" : "transparent"};color:${on ? "var(--fg)" : "var(--dim)"};font:600 14px var(--font-mono)`;
    row.append(cell);
  }
  return row;
}

export function mount(root) {
  const scope = createScope();
  const state = { converse: false, scanning: false, scanIndex: null, found: null, done: false, chosen: null, law: 0 };

  root.append(lead("Egy „ha…, akkor…” állításból többféle új állítás készíthető, és nem mindegyik mond ugyanazt. A megfordítás felcseréli a két részt. A tagadás azt mondja, hogy az eredeti állítás NEM igaz. A kettőt nagyon könnyű összekeverni."));

  const reverse = card("Megfordítás");
  const statementLine = make("p");
  statementLine.style.cssText = "margin:8px 0;padding:12px 14px;border:1px solid var(--line-strong);border-radius:12px;background:var(--input);font:600 17px/1.4 var(--font);color:var(--fg)";
  const cellHolder = make("div");
  const scanLine = make("p", "il-message");
  const flipButton = button("Megfordítás", () => { state.converse = !state.converse; resetScan(); }, { ghost: false });
  const scanButton = button("Ellenőrzés számokon (1–16)", scan, { ghost: true });
  reverse.append(statementLine, controls(flipButton, scanButton), cellHolder, scanLine);

  const negate = card("Tagadás: melyik a helyes?");
  const optionBox = make("div");
  optionBox.style.cssText = "display:flex;flex-direction:column;gap:8px;margin:8px 0";
  const negateMessage = make("p", "il-message");
  negateMessage.style.minHeight = "6.4em";
  negate.append(make("p", "il-muted", "Eredeti állítás: „Ha egy szám osztható 4-gyel, akkor páros.” Melyik mondat a tagadása?"), optionBox, negateMessage);

  const morgan = card("De Morgan: az „és” és a „vagy” tagadása");
  const lawPicker = make("div", "il-controls");
  const morganBox = make("div");
  morgan.append(make("p", "il-muted", "A: „a szám páros”, B: „a szám nagyobb 5-nél”. Zölddel látszik, mely számokra igaz az állítás."), lawPicker, morganBox);
  root.append(reverse, negate, morgan, keyIdea("a „ha A, akkor B” tagadása: „van olyan, amire A igaz, de B nem”. A megfordítása („ha B, akkor A”) nem ugyanaz, mint az eredeti. Az „és” és a „vagy” tagadásakor a műveletet meg kell cserélni: nem (A és B) = nem A vagy nem B."));

  const counterexampleTest = () => (state.converse ? (n) => even(n) && !by4(n) : (n) => by4(n) && !even(n));

  function resetScan() { scope.clearAll(); state.scanning = false; state.scanIndex = null; state.found = null; state.done = false; scanLine.textContent = ""; scanLine.className = "il-message"; renderReverse(); }

  function scan() {
    resetScan();
    state.scanning = true;
    const bad = counterexampleTest();
    const step = (i) => {
      if (i >= NUMBERS.length) { state.scanning = false; state.done = true; scanLine.textContent = "Egyetlen ellenpéldát sem találtunk 16-ig. Az állítás igaz (és be is bizonyítható: a 4-gyel osztható számok 2 · 2 · k alakúak, tehát párosak)."; scanLine.className = "il-message good"; return renderReverse(); }
      const n = NUMBERS[i];
      state.scanIndex = i;
      const p = state.converse ? even(n) : by4(n), q = state.converse ? by4(n) : even(n);
      scanLine.textContent = `${n}: ${state.converse ? "páros" : "osztható 4-gyel"}? ${YES_NO(p)}${p ? `, ${state.converse ? "osztható 4-gyel" : "páros"}? ${YES_NO(q)}` : " — erre az állítás nem mond semmit."}`;
      scanLine.className = "il-message";
      renderReverse();
      if (bad(n)) {
        state.found = n; state.scanning = false; state.done = true;
        const all = NUMBERS.filter(bad);
        scanLine.textContent = `Ellenpélda: a ${n} páros, de nem osztható 4-gyel. A megfordított állítás tehát hamis (további ellenpéldák: ${all.slice(1, 4).join(", ")}). Az eredeti igaz volt, a megfordítása mégsem.`;
        scanLine.className = "il-message warn";
        return renderReverse();
      }
      scope.timeout(() => step(i + 1), 520);
    };
    scope.timeout(() => step(0), 300);
  }

  function renderReverse() {
    statementLine.textContent = state.converse ? "Ha egy szám páros, akkor osztható 4-gyel." : "Ha egy szám osztható 4-gyel, akkor páros.";
    flipButton.textContent = state.converse ? "Vissza az eredetihez" : "Megfordítás";
    flipButton.disabled = scanButton.disabled = state.scanning;
    const premise = state.converse ? even : by4;
    cellHolder.replaceChildren(numberRow(premise, { active: NUMBERS, flagged: state.found, current: state.scanning ? NUMBERS[state.scanIndex] : null }), make("p", "il-muted", `Kiemelve: ${state.converse ? "a páros" : "a 4-gyel osztható"} számok (az állítás „ha” része).`));
  }

  function renderNegation() {
    optionBox.replaceChildren(...OPTIONS.map((option, i) => {
      const item = toggle(option.text, state.chosen === i, () => {
        state.chosen = i;
        negateMessage.textContent = option.why;
        negateMessage.className = `il-message ${option.correct ? "good" : "warn"}`;
        renderNegation();
      }, option.correct ? "var(--il-green)" : "var(--il-red)");
      item.style.cssText = "text-align:left;border-radius:12px;padding:9px 14px;font-size:14px";
      return item;
    }));
  }

  function renderMorgan() {
    lawPicker.replaceChildren(...LAWS.map((law, i) => toggle(law.name, state.law === i, () => { state.law = i; renderMorgan(); })));
    const law = LAWS[state.law];
    const left = GRID.filter(law.l), right = GRID.filter(law.r);
    const same = left.join() === right.join();
    const part = (label, test, list) => { const box = make("div"); box.append(make("div", "il-muted", label), numberRow(test), equation("igaz erre", rich("{ ", make("span", "il-accent", list.join("; ") || "∅"), " }"), "→")); return box; };
    morganBox.replaceChildren(part(law.left, law.l, left), part(law.right, law.r, right), make("p", "il-message " + (same ? "good" : "warn"), same ? "A két állítás pontosan ugyanazokra a számokra igaz, tehát egyenértékűek. ✓" : "Eltér!"));
  }

  resetScan();
  renderNegation();
  renderMorgan();
  return () => scope.clearAll();
}
