import { button, card, controls, createScope, formatNumber, gcd, keyIdea, lead, make, PALETTE, stepper } from "./kit.js";

const AMBER_BACKGROUND = "background:rgba(232,163,61,.22);";

// Long division of p by q (p % q taken as the first remainder). Stops at remainder 0 or at a repeated remainder.
function divide(p, q) {
  let remainder = p % q;
  const rows = [], seen = new Map();
  let cycleStart = -1;
  while (remainder !== 0) {
    if (seen.has(remainder)) { cycleStart = seen.get(remainder); break; }
    seen.set(remainder, rows.length);
    const scaled = remainder * 10;
    rows.push({ before: remainder, scaled, digit: Math.floor(scaled / q), after: scaled % q });
    remainder = scaled % q;
  }
  return { whole: Math.floor(p / q), rows, cycleStart };
}

function primeFactors(n) {
  const list = [];
  for (let p = 2; n > 1; p++) while (n % p === 0) { list.push(p); n /= p; }
  return list;
}

export function mount(root) {
  const scope = createScope();
  root.append(lead("Ha egy törtet tizedes törtté osztással alakítasz, háromféle eredmény jöhet ki: az osztás véget ér (véges tizedes tört), vagy ugyanaz a számcsoport újra meg újra előjön (végtelen szakaszos), vagy soha nem lesz ismétlődés (nem szakaszos). Törtekből csak az első kettő adódik."));

  const state = { p: 1, q: 7, shown: 0 };
  const main = card("Osztás maradékokkal");
  const pControl = stepper({ label: "Számláló", min: 1, max: 60, value: state.p, onChange: (v) => { state.p = v; restart(true); } });
  const qControl = stepper({ label: "Nevező", min: 2, max: 30, value: state.q, onChange: (v) => { state.q = v; restart(true); } });
  const playButton = button("Számoljuk ki lépésenként", () => play());
  const allButton = button("Mutasd egyszerre", () => { scope.clearAll(); state.shown = divide(state.p, state.q).rows.length; render(); }, { ghost: true });
  const resultLine = make("div", "il-formula start");
  resultLine.style.fontSize = "20px";
  const table = make("table", "il-table");
  table.style.minWidth = "min(100%, 34rem)";
  const tableWrap = make("div");
  tableWrap.style.cssText = "max-height:15rem;overflow-y:auto;";
  tableWrap.append(table);
  const message = make("p", "il-message");
  const facts = make("p", "il-muted");
  main.append(controls(pControl.element, qControl.element), resultLine, tableWrap, controls(playButton, allButton), message, facts);

  const nonRepeating = card("Olyan tizedes tört, amelyben nincs ismétlődő szakasz");
  nonRepeating.append(make("p", "", "Írjunk le egy 1-est, utána egy 0-t és 1-est, aztán két 0-t és 1-est, három 0-t és 1-est és így tovább. Bármeddig folytatod, a nullák száma mindig nő, tehát semmi sem ismétlődik."));
  const sequenceLine = make("div", "il-formula start");
  sequenceLine.style.cssText += "font-size:20px;word-break:break-all;";
  const sequenceMessage = make("p", "il-message");
  let blocks = 3;
  nonRepeating.append(sequenceLine, controls(button("Még egy csoport", () => { blocks = Math.min(7, blocks + 1); renderSequence(); }), button("Vissza", () => { blocks = 3; renderSequence(); }, { ghost: true })), sequenceMessage);
  root.append(main, nonRepeating, keyIdea("a maradékok mind kisebbek az osztónál, így a nevezőnél legfeljebb q − 1 különböző nem nulla maradék lehet: az osztás vagy 0-ra fut ki, vagy előbb-utóbb ismétlődik. Ezért minden tört tizedes alakja véges vagy szakaszos. A nem szakaszos tizedes törtek nem írhatók fel törtként."));

  function restart(fullView = false) {
    scope.clearAll();
    state.shown = fullView ? divide(state.p, state.q).rows.length : state.shown;
    render();
  }

  function play() {
    scope.clearAll();
    state.shown = 0;
    render();
    const total = divide(state.p, state.q).rows.length;
    playButton.disabled = true;
    const tick = () => {
      state.shown += 1;
      render();
      if (state.shown < total) scope.timeout(tick, 600);
    };
    if (total) scope.timeout(tick, 400);
  }

  function render() {
    const { p, q } = state;
    playButton.disabled = false;
    const { whole, rows, cycleStart } = divide(p, q);
    const shown = Math.min(state.shown, rows.length);
    const finished = shown === rows.length && rows.length > 0;
    const header = make("tr");
    ["lépés", "maradék", "· 10", "jegy", "új maradék"].forEach((text) => header.append(make("th", "", text)));
    const tbody = [header];
    rows.slice(0, shown).forEach((row, index) => {
      const inCycle = finished && cycleStart >= 0 && index >= cycleStart;
      const tr = make("tr");
      [index + 1, row.before, row.scaled, row.digit, row.after].forEach((value, cellIndex) => {
        const td = make("td", "", String(value));
        td.style.textAlign = "right";
        if (inCycle) td.style.cssText += AMBER_BACKGROUND;
        if (cellIndex === 3) td.style.cssText += `color:${PALETTE.blue};font-weight:700;`;
        tr.append(td);
      });
      tbody.push(tr);
    });
    table.replaceChildren(...tbody);
    tableWrap.scrollTop = tableWrap.scrollHeight;

    // Decimal expansion built from the digits seen so far.
    const node = make("span");
    node.append(`${p} : ${q} = ${whole}`);
    if (rows.length && shown) node.append(",");
    rows.slice(0, shown).forEach((row, index) => {
      const digit = make("span", "", String(row.digit));
      if (finished && cycleStart >= 0 && index >= cycleStart) digit.style.cssText = `text-decoration:overline;color:${PALETTE.amber};font-weight:700;`;
      node.append(digit);
    });
    if (!rows.length) node.append(" (egész szám)");
    else if (finished && cycleStart >= 0) node.append(make("span", "il-muted", `   (${rows.length - cycleStart} jegyű szakasz ismétlődik)`));
    else if (finished) node.append(make("span", "il-muted", "   (véges)"));
    else node.append("…");
    resultLine.replaceChildren(node);

    const reduced = q / gcd(p, q);
    const factors = primeFactors(reduced);
    const onlyTwoFive = factors.every((f) => f === 2 || f === 5);
    facts.textContent = `Egyszerűsített nevező: ${reduced}${factors.length ? ` = ${factors.join(" · ")}` : ""}. ${onlyTwoFive ? "Csak 2-es és 5-ös prímtényező van benne, ezért a tizedes tört véges: a nevező bővíthető 10-hatvánnyá." : "Van benne 2-től és 5-től különböző prímtényező, ezért a tizedes tört nem lehet véges."} Nem nulla maradék legfeljebb ${q - 1} féle lehet (1-től ${q - 1}-ig).`;
    if (!rows.length) { message.className = "il-message good"; message.textContent = `${p} osztható ${q}-val, az eredmény egész szám.`; }
    else if (!finished) { message.className = "il-message"; message.textContent = shown ? `A ${rows[shown - 1].after} maradék ${rows.slice(0, shown - 1).some((r) => r.before === rows[shown - 1].after) ? "már volt" : "új"}.` : "Nyomd meg a gombot: minden lépésben a maradékot megszorozzuk 10-zel, és elosztjuk."; }
    else if (cycleStart >= 0) {
      message.className = "il-message good";
      message.textContent = `A ${rows.at(-1).after} maradék már szerepelt a(z) ${cycleStart + 1}. lépésnél, ezért onnan minden megismétlődik: a jegyek a ${cycleStart + 1}. lépéstől szakaszosak (sárga rész). ${rows.length} lépés telt el, a lehetséges ${q - 1} közül.`;
    } else { message.className = "il-message good"; message.textContent = `A ${rows.at(-1).after} maradék 0 lett: az osztás véget ért, a tizedes tört véges (${formatNumber(p / q, 10)}).`; }
  }

  function renderSequence() {
    let text = "0,1";
    for (let k = 1; k <= blocks; k++) text += `${"0".repeat(k)}1`;
    sequenceLine.textContent = `${text}…`;
    sequenceMessage.textContent = `Az 1-esek között egyre hosszabb nullasor áll, ezért nincs ismétlődő szakasz. Ez egy végtelen, nem szakaszos tizedes tört: nem írható fel két egész szám hányadosaként.`;
  }

  restart(true);
  renderSequence();
  return () => scope.clearAll();
}
