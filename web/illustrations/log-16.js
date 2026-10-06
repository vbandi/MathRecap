import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, range, svg, toggle } from "./kit.js";

const METHODS = [
  { id: "direct", name: "direkt" },
  { id: "indirect", name: "indirekt" },
  { id: "cases", name: "esetszétválasztás" },
  { id: "counter", name: "ellenpélda" },
];
const QUIZ = [
  { claim: "Az n(n + 1) szorzat mindig páros.", idea: "Külön nézzük azt az esetet, amikor n páros, és azt, amikor n páratlan.", method: "cases" },
  { claim: "Három egymást követő egész szám összege osztható 3-mal.", idea: "Felírjuk az n + (n + 1) + (n + 2) összeget, és addig alakítjuk, amíg 3 többszöröse nem lesz.", method: "direct" },
  { claim: "Ha n² páros, akkor n is páros.", idea: "Feltesszük az ellenkezőjét (n páratlan), és ellentmondásra jutunk.", method: "indirect" },
  { claim: "Minden prímszám páratlan.", idea: "Mutatunk egy prímszámot, amelyik páros: a 2.", method: "counter" },
];
const isPrime = (n) => n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, i) => i + 2).every((d) => n % d !== 0);
const smallestDivisor = (n) => { for (let d = 2; d * d <= n; d++) if (n % d === 0) return d; return n; };

export function mount(root) {
  const scope = createScope();
  const state = { tab: "direct" };

  root.append(lead("Egy állítást többféleképpen lehet igazolni vagy megcáfolni. Négy módszert ismersz meg: az egyenes levezetést, az ellentmondásra vezetést, az esetekre bontást és az ellenpéldát. Mindegyiket ki is próbálhatod."));

  const tabs = card("Négy módszer");
  const tabPicker = make("div", "il-controls");
  const panel = make("div");
  tabs.append(tabPicker, panel);
  const quiz = card("Melyik módszer illik hozzá?");
  const quizBox = make("div");
  quiz.append(quizBox);
  root.append(tabs, quiz, keyIdea("egy állítást bizonyítani kell, megcáfolni elég egy ellenpéldával. A bizonyítás lehet direkt (egyenesen), indirekt (az ellenkezőjét feltételezve), vagy esetekre bontva."));

  function renderTabs() {
    tabPicker.replaceChildren(...METHODS.map((m) => toggle(m.name, state.tab === m.id, () => { scope.clearAll(); state.tab = m.id; renderTabs(); })));
    panel.replaceChildren(({ direct, indirect, cases, counter }[state.tab])());
  }

  // ---- Direct: three consecutive numbers.
  function direct() {
    const box = make("div");
    const s = { n: 4, merged: false };
    const slider = range({ label: "n =", min: 1, max: 8, value: s.n, format: String, onInput: (v) => { s.n = v; s.merged = false; draw(); } });
    const figure = svg("svg", { class: "il-svg", viewBox: "0 0 620 280", role: "img", "aria-label": "Három oszlop pontokból" });
    const dots = Array.from({ length: 30 }, () => svg("circle", { r: 9, class: "il-move", style: "opacity:0" }, figure));
    const captions = svg("g", {}, figure);
    const message = make("p", "il-message");
    box.append(make("p", "il-muted", "Állítás: három egymást követő szám összege a középső szám háromszorosa, azaz 3(n + 1). Direkt bizonyítás: a feltételből indulunk, és lépésről lépésre eljutunk az állításig."), controls(slider.element, button("Rendezzük át!", () => { s.merged = true; draw(); }), button("Vissza", () => { s.merged = false; draw(); }, { ghost: true })), figure, message);
    function draw() {
      const { n, merged } = s;
      const heights = [n, n + 1, n + 2];
      let index = 0;
      const colours = [PALETTE.violet, PALETTE.blue, PALETTE.green];
      captions.replaceChildren();
      heights.forEach((height, col) => {
        for (let row = 0; row < height; row++) {
          const dot = dots[index++];
          const moved = merged && col === 2 && row === n + 1;
          const x = 110 + col * 150 + (moved ? -300 : 0), y = moved ? 250 - n * 23 : 250 - row * 23;
          dot.style.opacity = 1; dot.style.transform = `translate(${x}px, ${y}px)`;
          dot.style.fill = moved ? PALETTE.amber : colours[col];
        }
        svg("text", { x: 110 + col * 150, y: 272, "text-anchor": "middle", text: merged ? `${n + 1}` : col === 0 ? `n = ${n}` : `n + ${col} = ${height}`, style: "font-weight:700" }, captions);
      });
      while (index < dots.length) dots[index++].style.opacity = 0;
      message.textContent = merged ? `A legmagasabb oszlop tetejéről áttettünk egy pontot (sárga) a legalacsonyabbra: mindhárom oszlop ${n + 1} magas. Az összeg: ${n} + ${n + 1} + ${n + 2} = 3 · ${n + 1} = ${3 * (n + 1)}. Ez bármelyik n-re működik.` : `Az oszlopok magassága n, n + 1, n + 2. Összesen ${n} + ${n + 1} + ${n + 2} = ${3 * n + 3} pont.`;
      message.className = `il-message ${merged ? "good" : ""}`;
    }
    draw();
    return box;
  }

  // ---- Indirect: n² even => n even.
  function indirect() {
    const box = make("div");
    const s = { k: 3, step: 0 };
    const slider = range({ label: "n (páratlan) =", min: 0, max: 7, value: s.k, format: (v) => String(2 * v + 1), onInput: (v) => { s.k = v; draw(); } });
    const list = make("ol", "il-steps");
    const stepButton = button("Következő lépés", () => { s.step = Math.min(4, s.step + 1); draw(); });
    box.append(make("p", "il-muted", "Állítás: ha n² páros, akkor n is páros. Indirekt bizonyítás: tegyük fel az ellenkezőjét, vagyis hogy n páratlan, és nézzük meg, mi történik."), controls(stepButton, button("Elölről", () => { s.step = 0; draw(); }, { ghost: true }), slider.element), list);
    function draw() {
      const n = 2 * s.k + 1, square = n * n, half = (square - 1) / 2;
      const lines = [
        "Tegyük fel, hogy n páratlan, vagyis n = 2k + 1 valamilyen egész k-ra.",
        `Ekkor n² = (2k + 1)² = 4k² + 4k + 1 = 2 · (2k² + 2k) + 1. Például n = ${n}: ${n}² = ${square} = 2 · ${half} + 1.`,
        `Ez egy páros szám plusz 1, tehát n² páratlan. (${square} valóban páratlan.)`,
        "Ez ellentmond annak, hogy n² páros volt. Az ellenkező feltevés tehát hibás, így n nem lehet páratlan: n páros. ∎",
      ];
      list.replaceChildren(...lines.map((text, i) => { const li = make("li", "", text); li.style.opacity = i < s.step ? 1 : 0.18; return li; }));
      stepButton.disabled = s.step >= lines.length;
    }
    draw();
    return box;
  }

  // ---- Cases: n(n+1) is even.
  function cases() {
    const box = make("div");
    const s = { n: 7 };
    const slider = range({ label: "n =", min: 1, max: 12, value: s.n, format: String, onInput: (v) => { s.n = v; draw(); } });
    const caseBox = make("div");
    const strip = make("div");
    strip.style.cssText = "display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:10px 0";
    box.append(make("p", "il-muted", "Állítás: n(n + 1) mindig páros. Esetszétválasztás: minden egész szám vagy páros, vagy páratlan. Mindkét esetet külön megvizsgáljuk, és ha mindkettőben igaz az állítás, akkor mindig igaz."), controls(slider.element), caseBox, strip);
    function draw() {
      const n = s.n, even = n % 2 === 0;
      const k = even ? n / 2 : (n - 1) / 2;
      const rows = [
        { active: even, title: "1. eset: n páros", text: `n = 2k, ezért n(n + 1) = 2k · (2k + 1), ami 2 többszöröse.${even ? ` Most k = ${k}: ${n} · ${n + 1} = 2 · ${k * (n + 1)} = ${n * (n + 1)}.` : ""}` },
        { active: !even, title: "2. eset: n páratlan", text: `n = 2k + 1, ezért n + 1 = 2k + 2 = 2(k + 1), így n(n + 1) = (2k + 1) · 2(k + 1), ami szintén 2 többszöröse.${!even ? ` Most k = ${k}: ${n} · ${n + 1} = ${n} · 2 · ${k + 1} = ${n * (n + 1)}.` : ""}` },
      ];
      caseBox.replaceChildren(...rows.map((row) => {
        const item = make("div");
        item.style.cssText = `margin:8px 0;padding:10px 14px;border:2px solid ${row.active ? "var(--accent)" : "var(--line)"};border-radius:12px;background:var(--input);opacity:${row.active ? 1 : 0.55}`;
        item.append(make("b", "", row.title), make("div", "", row.text));
        return item;
      }));
      strip.replaceChildren(...Array.from({ length: 12 }, (_, i) => {
        const v = i + 1, cell = make("div", "", `${v}·${v + 1} = ${v * (v + 1)}`);
        cell.style.cssText = `padding:6px 2px;text-align:center;border-radius:8px;border:2px solid ${v === n ? "var(--accent)" : "var(--line)"};font:12px var(--font-mono);color:${v % 2 === 0 ? PALETTE.violet : PALETTE.blue}`;
        return cell;
      }));
    }
    draw();
    return box;
  }

  // ---- Counterexample: n² + n + 41.
  function counter() {
    const box = make("div");
    const s = { n: null, found: false, running: false };
    const grid = make("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(44px,1fr));gap:5px;margin:10px 0";
    const cells = Array.from({ length: 41 }, (_, n) => { const cell = make("div", "", String(n)); cell.style.cssText = "padding:6px 0;text-align:center;border-radius:8px;border:2px solid var(--line);font:600 13px var(--font-mono);color:var(--dim)"; grid.append(cell); return cell; });
    const line = make("div");
    line.style.cssText = "min-height:3.4em;padding:10px 14px;border:1px solid var(--line-strong);border-radius:12px;background:var(--input);font:15px/1.6 var(--font-mono);color:var(--fg-soft)";
    const message = make("p", "il-message");
    const go = button("Próbáljuk ki!", () => start());
    box.append(make("p", "il-muted", "Állítás: az n² + n + 41 kifejezés értéke minden n = 0, 1, 2, … esetén prímszám. Sok esetben igaz, de ez még nem bizonyítás: ha egyetlen n-re hamis, az állítás megdől."), controls(go), grid, line, message);
    function start() {
      scope.clearAll();
      s.running = true; go.disabled = true; message.textContent = ""; message.className = "il-message";
      cells.forEach((cell) => { cell.style.background = ""; cell.style.borderColor = "var(--line)"; cell.style.color = "var(--dim)"; });
      const step = (n) => {
        const value = n * n + n + 41, prime = isPrime(value);
        cells[n].style.background = prime ? "var(--il-green)" : "var(--il-red)";
        cells[n].style.borderColor = prime ? "var(--il-green)" : "var(--il-red)";
        cells[n].style.color = "#fff";
        line.textContent = `n = ${n}: ${n}² + ${n} + 41 = ${value}${prime ? "  prímszám ✓" : `  nem prím: ${value} = ${smallestDivisor(value)} · ${value / smallestDivisor(value)}`}`;
        if (!prime) { s.running = false; go.disabled = false; message.textContent = `Megvan az ellenpélda: n = ${n}. Az állítás hamis, bár ${n} esetben egymás után igaz volt.`; message.className = "il-message warn"; return; }
        if (n >= 40) { s.running = false; go.disabled = false; return; }
        scope.timeout(() => step(n + 1), 150);
      };
      step(0);
    }
    line.textContent = "Nyomd meg a gombot: sorban kipróbáljuk az n értékeket.";
    return box;
  }

  // ---- Quiz.
  const answers = new Map();
  function renderQuiz() {
    quizBox.replaceChildren(...QUIZ.map((item, i) => {
      const row = make("div");
      row.style.cssText = "margin:10px 0;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--input)";
      const picker = make("div", "il-controls");
      for (const method of METHODS) {
        const pressed = answers.get(i) === method.id;
        const colour = pressed ? (method.id === item.method ? "var(--il-green)" : "var(--il-red)") : undefined;
        const chip = toggle(method.name, pressed, () => { answers.set(i, method.id); renderQuiz(); }, colour);
        picker.append(chip);
      }
      const right = answers.get(i) === item.method;
      row.append(make("b", "", item.claim), make("div", "il-muted", item.idea), picker);
      if (answers.has(i)) row.append(make("div", right ? "il-accent" : "il-muted", right ? "Helyes. ✓" : "Nem ez a módszer, próbálj másikat."));
      return row;
    }));
  }

  renderTabs();
  renderQuiz();
  return () => scope.clearAll();
}
