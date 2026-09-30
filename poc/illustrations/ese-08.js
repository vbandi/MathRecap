import { button, card, controls, createScope, keyIdea, lead, make, PALETTE, stepper } from "./kit.js";

const LETTERS = "ABCDE";
const QUESTIONS = [
  { text: "Egy urnából egymás után kihúzunk 3 golyót, és minden húzás után visszatesszük.", answer: "with", why: "A golyó a húzás után visszakerül, ezért újra kihúzható." },
  { text: "Egy 32 lapos kártyacsomagból kihúzunk 5 lapot.", answer: "without", why: "Egy lap csak egyszer szerepelhet a kezünkben: a kihúzott lap nem kerül vissza." },
  { text: "Háromszor dobunk egy dobókockával.", answer: "with", why: "Minden dobásnál ugyanaz a hat lehetőség van, bármelyik szám ismétlődhet." },
  { text: "Egy 25 fős osztályból kiválasztunk 3 főt a diákbizottságba.", answer: "without", why: "Ugyanaz a diák nem lehet kétszer a bizottság tagja." },
  { text: "Négyjegyű PIN-kódot készítünk a 0–9 számjegyekből.", answer: "with", why: "A számjegyek ismétlődhetnek (pl. 1221), tehát minden helyre újra mind a 10 számjegy választható." },
  { text: "A lottón 90 számból 5-öt húznak ki.", answer: "without", why: "Egy kihúzott szám nem kerül vissza, nem húzhatják ki kétszer." },
  { text: "Egy zsákból húzunk egy cetlit, feljegyezzük, majd visszadobjuk, és újra húzunk.", answer: "with", why: "A szöveg kimondja, hogy a cetli visszakerül." },
  { text: "10 versenyző között kisorsoljuk az 1., 2. és 3. díjat, és egy versenyző csak egy díjat kaphat.", answer: "without", why: "Aki már kapott díjat, kiesik a további sorsolásból." },
];

function sequences(n, k, replacement) {
  const result = [];
  const recurse = (current) => {
    if (current.length === k) { result.push(current.map((i) => LETTERS[i]).join("")); return; }
    for (let i = 0; i < n; i++) if (replacement || !current.includes(i)) recurse([...current, i]);
  };
  recurse([]);
  return result;
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function mount(root) {
  const scope = createScope();
  let n = 4, k = 2;
  let order = shuffle(QUESTIONS), current = 0, correct = 0, asked = 0, answered = false;

  root.append(lead("Ha egymás után húzunk ki elemeket, az első kérdés mindig az: visszakerül-e a kihúzott elem, vagyis kihúzható-e újra? Ettől függ, hogy minden húzásnál ugyanannyi lehetőség marad-e, vagy egyre kevesebb."));

  const samples = card("Hány sorrendes minta lehetséges?");
  const grid = make("div");
  grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px";
  const columns = [true, false].map((replacement) => {
    const column = make("div");
    const heading = make("div", "", replacement ? "Visszatevéssel" : "Visszatevés nélkül");
    heading.style.cssText = `font-weight:700;color:${replacement ? PALETTE.blue : PALETTE.violet}`;
    const boxes = make("div", "il-controls");
    boxes.style.minHeight = "44px";
    const formula = make("div", "il-formula start");
    const list = make("div");
    list.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;max-height:210px;overflow:auto";
    column.append(heading, boxes, formula, list);
    grid.append(column);
    return { replacement, boxes, formula, list };
  });
  samples.append(controls(
    stepper({ label: "Elemek (n)", min: 3, max: 5, value: n, onChange: (value) => { n = value; renderSamples(); } }).element,
    stepper({ label: "Húzások (k)", min: 1, max: 3, value: k, onChange: (value) => { k = value; renderSamples(); } }).element,
  ), grid, make("p", "il-muted", "Visszatevéssel minden húzásnál ugyanannyi lehetőség marad (n · n · …). Visszatevés nélkül minden húzással eggyel kevesebb (n · (n − 1) · …). Az ábrán a minták sorrenddel értendők: AB és BA különböző."));

  const quiz = card("Melyiket írja le a szöveg?");
  const question = make("p", "", "");
  question.style.cssText = "font-size:16px;color:var(--fg);min-height:3.2em";
  const answerButtons = [
    button("Visszatevéssel", () => answer("with")),
    button("Visszatevés nélkül", () => answer("without")),
  ];
  const nextButton = button("Következő", nextQuestion, { ghost: true });
  const score = make("span", "il-muted");
  const feedback = make("p", "il-message");
  quiz.append(question, controls(...answerButtons, nextButton, score), feedback);

  root.append(samples, quiz, keyIdea("keresd a „visszatesszük”, „újra” szavakat, vagy azt, hogy ugyanaz az elem többször is szerepelhet-e (kockadobás, PIN-kód). Ha egy elem csak egyszer szerepelhet (lottó, bizottság, kártyahúzás), akkor visszatevés nélküli a mintavétel."));

  function renderSamples() {
    for (const { replacement, boxes, formula, list } of columns) {
      const factors = Array.from({ length: k }, (_, i) => (replacement ? n : n - i));
      boxes.replaceChildren();
      factors.forEach((value, i) => {
        if (i > 0) boxes.append(make("span", "il-muted", "·"));
        const box = make("div", "il-fade", String(value));
        box.style.cssText = `width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:2px solid ${replacement ? PALETTE.blue : PALETTE.violet};border-radius:10px;font:700 17px var(--font-mono);opacity:0`;
        boxes.append(box);
        scope.timeout(() => { box.style.opacity = "1"; }, 60 + i * 250);
      });
      const items = sequences(n, k, replacement);
      formula.replaceChildren(`${factors.join(" · ")} = `, make("b", "", String(items.length)), " minta");
      list.replaceChildren(...items.map((text) => {
        const chip = make("span", "", text);
        chip.style.cssText = `padding:1px 6px;border-radius:7px;border:1px solid var(--line-strong);border-left:4px solid ${replacement ? PALETTE.blue : PALETTE.violet};font:12px var(--font-mono);color:var(--fg-soft)`;
        return chip;
      }));
    }
  }

  function nextQuestion() {
    if (current >= order.length) { order = shuffle(QUESTIONS); current = 0; }
    answered = false;
    question.textContent = order[current].text;
    feedback.textContent = ""; feedback.className = "il-message";
    nextButton.disabled = true;
    answerButtons.forEach((b) => { b.disabled = false; });
  }

  function answer(choice) {
    if (answered) return;
    answered = true;
    const item = order[current], right = choice === item.answer;
    asked += 1; if (right) correct += 1;
    feedback.className = `il-message ${right ? "good" : "warn"}`;
    feedback.textContent = `${right ? "Helyes!" : "Nem egészen."} Ez ${item.answer === "with" ? "visszatevéses" : "visszatevés nélküli"} mintavétel. ${item.why}`;
    score.textContent = `${correct} / ${asked} helyes`;
    nextButton.disabled = false;
    answerButtons.forEach((b) => { b.disabled = true; });
    current += 1;
  }

  renderSamples();
  nextQuestion();
  return () => scope.clearAll();
}
