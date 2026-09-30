import { button, card, controls, keyIdea, lead, make } from "./kit.js";

const isPrime = (n) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d !== 0);
const NUMBERS = Array.from({ length: 30 }, (_, i) => i + 1);
const DECK = [
  { text: "A 12 osztható 4-gyel.", answer: "true", why: "12 = 4 · 3, tehát igaz." },
  { text: "Hány óra van?", answer: "none", why: "Kérdés, nem lehet rá azt mondani, hogy igaz vagy hamis." },
  { text: "Minden prímszám páratlan.", answer: "false", why: "Egyetlen ellenpélda elég, hogy az állítás hamis legyen.", universal: { pre: isPrime, post: (n) => n % 2 === 1, preName: "prímszám", postName: "páratlan" } },
  { text: "x > 3", answer: "none", why: "Amíg nem tudjuk, mennyi x, nem lehet eldönteni, igaz-e. Ez még nem állítás, hanem nyitott mondat." },
  { text: "Minden néggyel osztható szám páros.", answer: "true", why: "Ha egy szám 4-gyel osztható, akkor 2-vel is (4 = 2 · 2). Az 1–30 között egyetlen ellenpélda sincs.", universal: { pre: (n) => n % 4 === 0, post: (n) => n % 2 === 0, preName: "néggyel osztható", postName: "páros" } },
  { text: "Minden 5-tel osztható szám páros.", answer: "false", why: "Több ellenpélda is van: a 15 és a 25 is ilyen.", universal: { pre: (n) => n % 5 === 0, post: (n) => n % 2 === 0, preName: "5-tel osztható", postName: "páros" } },
  { text: "Legyen szép napod!", answer: "none", why: "Kívánság, nem lehet igaz vagy hamis." },
  { text: "A 27 prímszám.", answer: "false", why: "27 = 3 · 9, tehát nem prím. Az állítás hamis, de attól még állítás." },
  { text: "Minden 3-mal osztható szám osztható 6-tal.", answer: "false", why: "Több ellenpélda is van: a 9, a 15, a 21 és a 27 is ilyen.", universal: { pre: (n) => n % 3 === 0, post: (n) => n % 6 === 0, preName: "3-mal osztható", postName: "6-tal osztható" } },
];
const LABELS = { true: "Igaz", false: "Hamis", none: "Nem állítás" };

export function mount(root) {
  const state = { index: 0, phase: "answer", score: 0, tried: false };
  const cells = new Map();

  root.append(lead("Állításnak azt a mondatot nevezzük, amiről el lehet dönteni, hogy igaz-e vagy hamis. Kérdés, kívánság vagy egy ismeretlent tartalmazó kifejezés még nem állítás. Ha egy „minden…” állítás hamis, elég egyetlen példát mutatni, amire nem igaz."));

  const play = card("Melyik kártya melyik?");
  const progress = make("p", "il-muted");
  const sentence = make("p", "", "");
  sentence.style.cssText = "margin:10px 0;padding:16px;min-height:3.4em;border:1px solid var(--line-strong);border-radius:12px;background:var(--input);font:600 19px/1.4 var(--font);color:var(--fg)";
  const answerButtons = controls(...Object.keys(LABELS).map((key) => button(LABELS[key], () => answer(key), { ghost: true })));
  const strip = make("div");
  strip.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(34px,1fr));gap:5px;margin:8px 0";
  for (const n of NUMBERS) {
    const cell = make("button", "il-toggle", String(n));
    cell.type = "button";
    cell.style.cssText = "padding:5px 0;text-align:center;border-radius:8px";
    cell.addEventListener("click", () => pickCounterexample(n));
    cells.set(n, cell);
    strip.append(cell);
  }
  const stripHint = make("p", "il-muted");
  const message = make("p", "il-message");
  const nextButton = button("Következő kártya", next);
  play.append(progress, sentence, answerButtons, stripHint, strip, message, controls(nextButton));
  root.append(play, keyIdea("egy „minden…” állítást egyetlen ellenpélda megdönt, de igazolni csak úgy lehet, hogy minden esetre megnézzük."));

  const current = () => DECK[state.index];
  const setMessage = (text, tone = "") => { message.textContent = text; message.className = `il-message ${tone}`; };

  function answer(key) {
    if (state.phase !== "answer") return;
    const card = current();
    if (key !== card.answer) {
      state.tried = true;
      return setMessage(`Nem egészen. ${hint(card, key)}`, "warn");
    }
    if (card.answer === "false" && card.universal) {
      state.phase = "counterexample";
      setMessage("Így van, hamis. Bizonyítsd be: kattints egy számra az 1–30 között, amire a „minden” állítás nem igaz.", "good");
    } else finish(card.why);
    render();
  }

  function hint(card, key) {
    if (card.answer === "none") return "Gondold végig: el lehet dönteni róla, hogy igaz vagy hamis?";
    if (key === "none") return "Ebből a mondatból el lehet dönteni, igaz-e, tehát állítás.";
    return key === "true" ? "Nézd meg pontosabban, tényleg mindig igaz?" : "Próbáld ki néhány példával, tényleg hamis?";
  }

  function pickCounterexample(n) {
    const card = current();
    if (state.phase !== "counterexample") return;
    const { pre, post, preName, postName } = card.universal;
    if (pre(n) && !post(n)) {
      cells.get(n).style.background = "var(--il-red)";
      cells.get(n).style.color = "#fff";
      finish(`A ${n} ${preName}, de nem ${postName}. ${card.why}`);
      render();
    } else if (!pre(n)) setMessage(`A ${n} nem ${preName}, ezért nem az állításról szól. Olyan szám kell, ami ${preName}.`, "warn");
    else setMessage(`A ${n} ${preName} és ${postName} is, ez az állítást nem cáfolja. Keress másikat!`, "warn");
  }

  function finish(text) {
    state.phase = "done";
    if (!state.tried) state.score += 1;
    setMessage(`${text} ✓`, "good");
  }

  function next() {
    state.index += 1;
    state.phase = "answer";
    state.tried = false;
    setMessage("");
    if (state.index >= DECK.length) { state.index = 0; state.score = 0; }
    render();
  }

  function render() {
    const card = current();
    progress.textContent = `${state.index + 1}. kártya a ${DECK.length}-ből · elsőre eltalált: ${state.score}`;
    sentence.textContent = `„${card.text}”`;
    answerButtons.querySelectorAll("button").forEach((b) => { b.disabled = state.phase !== "answer"; });
    const showing = card.universal && state.phase !== "answer";
    stripHint.textContent = card.universal ? (showing ? "Hol van ellenpélda? Kattints egy számra." : "Számegyenes az ellenpéldákhoz (hamis „minden” állításnál használjuk).") : "";
    for (const [n, cell] of cells) {
      cell.disabled = state.phase !== "counterexample";
      const satisfied = state.phase === "done" && card.universal && card.answer === "true" && card.universal.pre(n);
      const isCounter = state.phase === "done" && card.universal && card.answer === "false" && card.universal.pre(n) && !card.universal.post(n);
      cell.style.opacity = card.universal ? "1" : "0.35";
      cell.style.background = isCounter ? "var(--il-red)" : satisfied ? "var(--il-green)" : "";
      cell.style.color = isCounter || satisfied ? "#fff" : "";
    }
    nextButton.disabled = state.phase !== "done";
    nextButton.textContent = state.index === DECK.length - 1 ? "Újra az elejéről" : "Következő kártya";
  }

  render();
  return () => {};
}
