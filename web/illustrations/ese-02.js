import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, range, slot, stepper, svg, toggle, withInstrumental } from "./kit.js";

const LETTERS = "ABCDE";
const COLORS = [PALETTE.red, PALETTE.blue, PALETTE.green, PALETTE.amber, PALETTE.violet];
const SUFFIX = { A: "val", B: "vel", C: "vel", D: "vel", E: "vel" };
const SUBSCRIPTS = "₁₂₃₄₅";
const PRESETS = [
  { name: "A A B B", word: [0, 0, 1, 1] },
  { name: "A A A B", word: [0, 0, 0, 1] },
  { name: "A A B", word: [0, 0, 1] },
  { name: "A A B B C", word: [0, 0, 1, 1, 2] },
];

const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
function permutations(items) {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]));
}
const word = (order) => order.map((token) => LETTERS[token]).join("");

function chip(text, color, extraStyle = "") {
  const element = make("span", "", text);
  element.style.cssText = `display:inline-block;min-width:2.2ch;padding:2px 7px;border-radius:8px;border:1px solid var(--line-strong);font:13px var(--font-mono);text-align:center;color:var(--fg-soft);${color ? `border-left:4px solid ${color};` : ""}${extraStyle}`;
  return element;
}

export function mount(root) {
  const scope = createScope();
  let mode = "line";
  let cleanup = () => {};

  root.append(lead("Sorbarendezésnél az számít, ki melyik helyre kerül: az ABC és a BAC két különböző sorrend. Hogy egyet se hagyjunk ki, rendszerben haladunk. Két csavar is lesz: körben ülve az elforgatás nem számít, és ha két elem egyforma, a cseréjük nem új sorrend."));
  const modeControls = controls();
  const body = make("div");
  root.append(modeControls, body, keyIdea("n különböző elemet n! = n · (n − 1) · … · 1 féleképp lehet sorba rakni. Körben n-szer annyi sorrend számít egynek (az n elforgatás), ezért (n − 1)! a körök száma. Ismétlődő elemeknél a sorrendek számát osztani kell az egyforma elemek cseréinek számával."));

  const modes = [["line", "Sorban", mountLine], ["circle", "Körben", mountCircle], ["repeat", "Ismétlődő elemekkel", mountRepeat]];
  function render() {
    cleanup(); scope.clearAll();
    body.replaceChildren();
    modeControls.replaceChildren(...modes.map(([id, label]) => toggle(label, mode === id, () => { mode = id; render(); })));
    cleanup = modes.find(([id]) => id === mode)[2](body);
  }

  // ---------- row of n different items ----------
  function mountLine(target) {
    let n = 4, all = [], index = 0, playing = true, speed = 6, timer = null;
    const chips = [];
    const setup = card("Az összes sorrend, rendszerben");
    const nControls = make("div", "il-controls");
    const figure = svg("svg", { class: "il-svg", viewBox: "0 0 380 70", role: "img", "aria-label": "Sorba rendezett golyók" });
    figure.style.maxWidth = "380px";
    const counter = make("div", "il-formula start");
    const playControls = make("div", "il-controls");
    const list = make("div");
    const formula = make("div", "il-formula start");
    setup.append(nControls, figure, counter, playControls, make("p", "il-muted", "A sorrendeket az első elem szerint csoportosítjuk, azon belül a másodikkal és így tovább. Kattints egy sorrendre, hogy lásd a golyókon."), list, formula);
    target.append(setup);
    let tokens = [];

    nControls.append(stepper({ label: "Elemek száma", min: 3, max: 5, value: n, onChange: (value) => { n = value; rebuild(); } }).element);
    const playButton = button("Szünet", () => { playing = !playing; schedule(); });
    playControls.append(playButton, button("Következő sorrend", () => { playing = false; schedule(); step(); }, { ghost: true }),
      range({ label: "Sebesség", min: 1, max: 10, value: speed, format: (v) => String(v), onInput: (v) => { speed = v; schedule(); } }).element);

    function schedule() {
      if (timer !== null) scope.clearInterval(timer);
      timer = null;
      playButton.textContent = playing ? "Szünet" : "Lejátszás";
      if (playing) timer = scope.interval(step, 1300 - speed * 110);
    }
    function step() { index = (index + 1) % all.length; place(); }
    function place() {
      all[index].forEach((token, position) => { tokens[token].style.transform = `translate(${40 + position * 75}px, 35px)`; });
      chips.forEach((element, i) => {
        element.style.background = i === index ? "var(--accent-soft)" : "";
        element.style.color = i === index ? "var(--accent)" : "var(--fg-soft)";
      });
      counter.replaceChildren(slot(String(index + 1), 3), ". sorrend / ", slot(String(all.length), 3, { align: "left" }), ` : ${word(all[index])}`);
    }
    function rebuild() {
      all = permutations([...Array(n).keys()]);
      index = 0;
      figure.replaceChildren();
      tokens = Array.from({ length: n }, (_, i) => {
        const group = svg("g", { class: "il-move" }, figure);
        svg("circle", { r: 24, fill: COLORS[i] }, group);
        svg("text", { "text-anchor": "middle", dy: 6, text: LETTERS[i], style: "fill:#fff;font-weight:700;font-size:18px" }, group);
        return group;
      });
      list.replaceChildren(); chips.length = 0;
      for (let first = 0; first < n; first++) {
        const row = make("div", "il-controls");
        row.style.cssText = "align-items:center;gap:6px;margin:6px 0";
        const label = make("span", "il-muted", `${LETTERS[first]}-${SUFFIX[LETTERS[first]]} kezdődők: ${factorial(n - 1)}`);
        label.style.cssText = "flex:0 0 15ch";
        row.append(chip(LETTERS[first], COLORS[first], "font-weight:700"), label);
        all.forEach((order, i) => {
          if (order[0] !== first) return;
          const element = make("button", "", word(order));
          element.type = "button";
          element.style.cssText = "padding:2px 7px;border-radius:8px;border:1px solid var(--line-strong);background:transparent;font:13px var(--font-mono);cursor:pointer";
          element.addEventListener("click", () => { playing = false; schedule(); index = i; place(); });
          chips[i] = element;
          row.append(element);
        });
        list.append(row);
      }
      const product = Array.from({ length: n }, (_, i) => n - i).join(" · ");
      formula.replaceChildren(`${n}! = ${product} = `, make("b", "", String(all.length)), ` (az első helyre ${n}, a másodikra ${n - 1}, … lehetőség)`);
      place(); schedule();
    }
    rebuild();
    return () => {};
  }

  // ---------- round table ----------
  function mountCircle(target) {
    let n = 4, circleIndex = 0, rotation = 0, seen = new Set(), circles = [];
    const setup = card("Kerek asztal: az elforgatás ugyanaz a kör");
    const nControls = make("div", "il-controls");
    const figure = svg("svg", { class: "il-svg", viewBox: "0 0 360 230", role: "img", "aria-label": "Körben ülő golyók" });
    figure.style.maxWidth = "360px";
    const rotateControls = make("div", "il-controls");
    const reading = make("div", "il-formula start");
    const seenLine = make("p", "il-message");
    const list = make("div", "il-controls");
    const summary = make("div", "il-formula start");
    setup.append(nControls, figure, rotateControls, reading, seenLine, make("p", "il-muted", "Válassz egy kört (A mindig ugyanott indul, hiszen az elforgatások ugyanazt a kört adják):"), list, summary);
    target.append(setup);
    svg("circle", { cx: 180, cy: 115, r: 50, fill: "none", style: "stroke:var(--line-strong);stroke-width:2" }, figure);
    let tokens = [];
    const seat = (s) => { const angle = -Math.PI / 2 + (s * 2 * Math.PI) / n; return { x: 180 + 88 * Math.cos(angle), y: 115 + 88 * Math.sin(angle) }; };

    nControls.append(stepper({ label: "Személyek száma", min: 3, max: 5, value: n, onChange: (value) => { n = value; rebuild(); } }).element);
    rotateControls.append(button("Forgasd el egy hellyel", () => { rotation = (rotation + 1) % n; place(true); }), button("Vissza", () => { rotation = 0; seen = new Set(); place(false); }, { ghost: true }));

    const arrangement = () => circles[circleIndex];
    const readingFromTop = () => Array.from({ length: n }, (_, s) => arrangement()[(s - rotation + n) % n]);
    function place(record) {
      const order = arrangement();
      order.forEach((token, j) => {
        const { x, y } = seat((j + rotation) % n);
        tokens[token].style.transform = `translate(${x}px, ${y}px)`;
      });
      if (record || seen.size === 0) seen.add(word(readingFromTop()));
      reading.replaceChildren(`Felülről, óramutató szerint olvasva: `, make("b", "", word(readingFromTop())));
      seenLine.textContent = seen.size >= n
        ? `Mind ${n} elforgatás ugyanaz a kör, de egyenes sorban ${n} különböző sorrendnek látszana: ${[...seen].join(", ")}. Ezért osztunk ${withInstrumental(n)}.`
        : `Eddig ${seen.size} sorrend: ${[...seen].join(", ")}. Forgasd tovább: mind ugyanaz a kör.`;
      [...list.children].forEach((element, i) => {
        element.style.background = i === circleIndex ? "var(--accent-soft)" : "transparent";
        element.style.color = i === circleIndex ? "var(--accent)" : "var(--fg-soft)";
      });
    }
    function rebuild() {
      circles = permutations([...Array(n - 1).keys()].map((i) => i + 1)).map((rest) => [0, ...rest]);
      circleIndex = 0; rotation = 0; seen = new Set();
      [...figure.querySelectorAll("g")].forEach((g) => g.remove());
      tokens = Array.from({ length: n }, (_, i) => {
        const group = svg("g", { class: "il-move" }, figure);
        svg("circle", { r: 20, fill: COLORS[i] }, group);
        svg("text", { "text-anchor": "middle", dy: 6, text: LETTERS[i], style: "fill:#fff;font-weight:700;font-size:17px" }, group);
        return group;
      });
      list.replaceChildren(...circles.map((order, i) => {
        const element = make("button", "", word(order));
        element.type = "button";
        element.style.cssText = "padding:3px 9px;border-radius:8px;border:1px solid var(--line-strong);font:13px var(--font-mono);cursor:pointer";
        element.addEventListener("click", () => { circleIndex = i; rotation = 0; seen = new Set(); place(false); });
        return element;
      }));
      summary.replaceChildren(`${n}! ÷ ${n} = ${factorial(n)} ÷ ${n} = `, make("b", "", String(factorial(n - 1))), ` különböző kör (= ${n - 1}!). A tükörkép (ellenkező körbejárás) már másik körnek számít.`);
      place(false);
    }
    rebuild();
    return () => {};
  }

  // ---------- repeated elements ----------
  function mountRepeat(target) {
    let preset = 0, merged = false;
    const setup = card("Amikor az egyforma elemek cseréje nem számít");
    const presetControls = make("div", "il-controls");
    const actions = make("div", "il-controls");
    const grid = make("div");
    const explanation = make("div", "il-formula start");
    setup.append(presetControls, actions, make("p", "il-muted", "Először megkülönböztetjük az egyformákat (A₁, A₂ …), és felsoroljuk az összes n! sorrendet. Utána összevonjuk azokat, amelyek az indexek nélkül ugyanúgy néznek ki."), grid, explanation);
    target.append(setup);
    const mergeButton = button("Vonjuk össze az egyformákat!", () => { merged = true; render(); });
    const backButton = button("Vissza", () => { merged = false; render(); }, { ghost: true });
    actions.append(mergeButton, backButton);

    function render() {
      presetControls.replaceChildren(make("span", "il-muted", "Elemek:"), ...PRESETS.map((p, i) => toggle(p.name, preset === i, () => { preset = i; merged = false; render(); })));
      const letters = PRESETS[preset].word;
      const total = letters.length;
      const seenCounts = {};
      const tagged = letters.map((token) => { seenCounts[token] = (seenCounts[token] ?? 0) + 1; return { token, label: `${LETTERS[token]}${SUBSCRIPTS[seenCounts[token] - 1]}`, plain: LETTERS[token] }; });
      const hasCopies = (t) => letters.filter((x) => x === t).length > 1;
      const orders = permutations(tagged.map((_, i) => i));
      const groups = new Map();
      for (const order of orders) {
        const key = order.map((i) => tagged[i].plain).join("");
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(order);
      }
      grid.replaceChildren();
      grid.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";
      let groupIndex = 0;
      for (const [key, members] of groups) {
        const box = make("div");
        box.style.cssText = "display:grid;grid-template-columns:repeat(2,max-content);gap:3px;padding:5px;border:1px solid var(--line);border-radius:10px;align-content:start;";
        members.forEach((order, i) => {
          const text = order.map((j) => (hasCopies(tagged[j].token) ? tagged[j].label : tagged[j].plain)).join("");
          const color = COLORS[groupIndex % COLORS.length];
          const element = chip(merged && i === 0 ? key : text, null, `border-left:4px solid ${color};`);
          element.className = "il-fade";
          element.style.opacity = merged && i > 0 ? "0.12" : "1";
          if (merged && i === 0) element.style.cssText += ";color:var(--accent);font-weight:700;border-color:var(--accent)";
          box.append(element);
        });
        grid.append(box);
        groupIndex += 1;
      }
      const counts = [...new Set(letters)].map((t) => letters.filter((x) => x === t).length);
      const divisor = counts.map(factorial).reduce((a, b) => a * b, 1);
      const parts = counts.filter((c) => c > 1);
      explanation.replaceChildren(merged
        ? `${total}! ÷ (${counts.map((c) => `${c}!`).join(" · ")}) = ${factorial(total)} ÷ ${divisor} = `
        : `${total}! = ${factorial(total)} sorrend, ha minden elemet megkülönböztetünk. `,
      make("b", "", merged ? String(groups.size) : ""),
      merged ? ` különböző sor. Mindegyik ${divisor}-féleképp jelent meg (${parts.map((c) => `${c}!`).join(" · ") || "1"} csere).` : "");
      mergeButton.disabled = merged; backButton.disabled = !merged;
    }
    render();
    return () => {};
  }

  render();
  return () => { cleanup(); scope.clearAll(); };
}
