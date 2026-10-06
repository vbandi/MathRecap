// Review checklist for the skill illustrations. Flags were collected from the authoring
// agents' reports and the integration pass; review state lives in localStorage.
import { skills } from "./curriculum.mjs";
import { mountAccountMenu } from "./session.js";

mountAccountMenu(document.getElementById("account"));

const STORAGE_KEY = "mathrecap.illustrationReview.v1";
const BRANCHES = { LOG: "Logika", SZA: "Számok", ALG: "Algebra", FUG: "Függvények", GEO: "Geometria", ESE: "Esély" };
const FLAG_TYPES = { wording: "Nyelv", math: "Matek", check: "Nem ellenőrzött", ux: "Felület" };
const STATUSES = { todo: "Átnézendő", ok: "Rendben", fix: "Javítandó" };

const QUESTIONS = [
  { id: "GEO-11", text: "Trapéz és deltoid: a modul a tágabb definíciót használja (a paralelogramma is trapéz, a rombusz és a négyzet is deltoid). Ezt tanítják az iskolában?" },
  { id: "ESE-19", text: "Kvartilisek: a két fél mediánja, a középső adat egyik félhez sem tartozik. Szórás: n-nel osztunk (nem n − 1-gyel). Megfelel a tankönyveknek?" },
  { id: "SZA-01", text: "Számnév: 1 001 000 most „egymillió-ezer”. Helyesen „egymillió-egyezer”?" },
  { id: "ESE-07", text: "A binomiális együttható jelölése C(n, k). Maradjon, vagy legyen a magyar „n alatt a k” zárójeles alak?" },
  { id: "GEO-48", text: "Az Euler-összefüggés angol betűkkel szerepel (V − E + F = 2). Legyen inkább csúcsok + lapok − élek = 2?" },
];

const GENERAL_NOTES = [
  "Érintéses (telefon/tablet) húzást egyik modulban sem próbáltuk ki, és telefonszélességen sem néztük meg őket.",
  "A modulok szövegét modell írta; anyanyelvi ellenőrzés még egyiken sem volt.",
];

// [type, text] pairs per skill.
const FLAGS = {
  "LOG-02": [["check", "Csak szkriptből kattintva ellenőrizve, képernyőképen nem."]],
  "LOG-05": [["check", "Csak szkriptből kattintva ellenőrizve, képernyőképen nem."]],
  "LOG-07": [["wording", "„Kérsz tejet vagy cukrot a teába?” és a műveletekhez írt hétköznapi példák."]],
  "LOG-08": [["ux", "Az első megjelenéskor néhány korong a bal felső sarokból repül be."]],
  "LOG-11": [["wording", "Az eső/úttest jelenetek szövegei."]],
  "LOG-12": [["check", "Csak szkriptből ellenőrizve."], ["wording", "Változó számokkal összerakott mondatok („Nincs benne B-ben: …”, „a … páros”)."]],
  "LOG-13": [["ux", "Első megjelenéskor a korongok a sarokból repülnek be; három halmaznál a hármas metszet kicsi, a korongok átfedhetnek."]],
  "LOG-14": [["wording", "A bizonyítási lépések megfogalmazása."]],
  "LOG-16": [["wording", "A bizonyítási lépések megfogalmazása mind a négy fülön."]],

  "SZA-01": [["wording", "Számnevek (lásd a nyitott kérdést: egymillió-egyezer)."]],
  "SZA-03": [["wording", "A kivonás át lett írva pótlásra — az új lépésszövegeket érdemes átolvasni."], ["math", "Kétjegyű szorzónál a tízesekkel szorzott részeredmény van felül. Osztás csak egyjegyű osztóval."]],
  "SZA-04": [["wording", "A műveleti sorrend lépéseinek indoklásai."]],
  "SZA-08": [["check", "Az ugrálós animációt csak félúton látta a szerző."]],
  "SZA-11": [["check", "A jelölő animációját csak félúton látta a szerző."]],
  "SZA-14": [["check", "Az utolsó apró módosítás után nem készült képernyőkép."]],
  "SZA-15": [["check", "Az utolsó apró módosítás után nem készült képernyőkép."]],
  "SZA-17": [["check", "Az utolsó módosítások (fa magassága) után csak szintaxis-ellenőrzés volt."]],
  "SZA-22": [["wording", "Két üzenetet átírtam (a √20 értéke …; toldalék helyett egyenlőtlenség) — átolvasandó."]],
  "SZA-25": [["ux", "Unicode felső indexeket használ; betűtípustól függően furcsán nézhetnek ki."]],
  "SZA-26": [["check", "A húzást csak szimulált eseményekkel próbálta a szerző."]],
  "SZA-29": [["math", "A valós számok zártságát lebegőpontosan ellenőrzi, az eredmények ≈ jellel jelennek meg."]],
  "SZA-30": [["math", "A 2 és 6 párnál az első talált ellenpélda 6, a kulcsgondolat viszont 18-at említ (helyes, csak nem egyezik)."]],
  "SZA-31": [["wording", "A bevezető mondat („x az a szám n-edik gyöke”) nehézkes."]],
  "SZA-32": [["wording", "„3. hatvány”, „2. gyök” merev; a kulcsgondolatot átírtam, és a gyökjel indexét javítottam — átolvasandó."]],
  "SZA-33": [["ux", "Unicode alsó/felső indexek."]],

  "ALG-01": [["check", "A színkeverést átírtam (kék + sárga most zöld) — érdemes ránézni."]],
  "ALG-04": [["check", "Ezres tagolás (50 000 000) bekerült — érdemes ránézni."]],
  "ALG-07": [["wording", "„%-os növekedés”, „%-ról” alakok."]],
  "ALG-09": [["wording", "„egynemű” a tanulói szövegben — érthető-e?"]],
  "ALG-10": [["wording", "„kék tarifa / piros tarifa” elnevezések."]],
  "ALG-12": [["wording", "„Az előre végzett · 3 művelet fordítottját használtuk.”"]],
  "ALG-14": [["wording", "„főegyüttható” a tanulói szövegben."]],
  "ALG-15": [["ux", "A két kártya egy animációt használ: a tartály indítása megállítja az autókat."]],
  "ALG-16": [["math", "A kvízben a behelyettesítéses ellenőrzés egy rögzített jelöltlistán (−3…4) fut, nem a valódi megoldáshalmazon."]],
  "ALG-18": [["check", "A számegyenesre kattintást csak szimulált eseménnyel próbálta a szerző."]],
  "ALG-19": [["wording", "A lépésjegyzetek („I. × 1, II. × −1 …”) tömörek."]],
  "ALG-20": [["math", "A lapos szemléltetés csak nemnegatív, páros b-re működik."]],
  "ALG-23": [["ux", "A lapok képe lépésenként újrarajzolódik, nincs animáció; telefonon a táblázat szűkös."]],
  "ALG-26": [["ux", "Az x² → y csere nincs animálva, csak átszíneződik."]],

  "FUG-01": [["wording", "„Ezzel a szabállyal (x + 3) az 1-hez 4 tartozna.”"]],
  "FUG-03": [["wording", "„a kincs jobbrább/balrább van”."]],
  "FUG-04": [["ux", "Tipp-módban a tengelyek tartománya elárulhatja a szabályt."]],
  "FUG-05": [["wording", "„Egy órától másfél óráig állt”; t = 0-nál „0,0 km-re”."]],
  "FUG-06": [["ux", "Az x és y tengely léptéke eltér."]],
  "FUG-08": [["wording", "„x = …-nél” — tizedes szám utáni toldalék hibás lehet."]],
  "FUG-11": [["wording", "„A tükörkép …” mondatok."]],
  "FUG-12": [["check", "Csak konzolhibára ellenőrizve, képernyőkép nélkül; a morph animációt nem nézte végig a szerző."]],
  "FUG-13": [["check", "Csak konzolhibára ellenőrizve; a hajtogatás animációt nem nézte végig a szerző."]],
  "FUG-14": [["check", "A tükrözés animációt nem nézte végig a szerző."]],
  "FUG-15": [["check", "Csak konzolhibára ellenőrizve, képernyőkép nélkül."]],
  "FUG-16": [["wording", "A „Meglepetés” kiemelés szövege."]],
  "FUG-18": [["check", "A tükrözés animációt nem nézte végig a szerző."]],
  "FUG-21": [["ux", "Az alsó indexes címkék (a₁) kis méretben „a1”-nek látszanak."]],
  "FUG-22": [["wording", "„minden tag az előzőnek ugyanannyiszorosa”, „q-szorosa”, „Mező sorszáma”."]],
  "FUG-23": [["wording", "„a kamat a befizetések X%-a”."], ["math", "Egyszerűsített modell: havi kamat = éves / 12, befizetés hónap végén (az oldalon jelezve)."]],

  "GEO-02": [["wording", "„homorú szög”, „nullszög”."], ["ux", "Nagyon gyors húzásnál a 0°/360° határon a rossz végre ugorhat."]],
  "GEO-04": [["math", "A 3. szerkesztésnél a segédívek kisebb sugarúak, hogy a pont a képen maradjon (helyes szerkesztés)."]],
  "GEO-05": [["wording", "„társszög” (a megbízáson túl került bele); a váltószög a külső párokra is vonatkozik."], ["ux", "Telefonszélességen nem ellenőrizve."]],
  "GEO-07": [["wording", "A háromszög-egyenlőtlenség üzenetei."]],
  "GEO-08": [["math", "Egyenlő oldal: 3% tűrés, derékszög: 1,5° tűrés (az oldalon jelezve)."]],
  "GEO-11": [["math", "Tágabb trapéz/deltoid definíció (lásd a nyitott kérdést)."], ["ux", "Telefonszélességen nem ellenőrizve."]],
  "GEO-12": [["wording", "„Ez együtt …” mondat."]],
  "GEO-16": [["check", "A szerző böngészőben nem látta (csak kódszintű teszt volt)."]],
  "GEO-17": [["check", "A szerző nem látta; én megnéztem: az átrendezés működik."]],
  "GEO-18": [["check", "A szerző böngészőben nem látta; a húzás és a duplázó forgatás nincs ellenőrizve."]],
  "GEO-19": [["check", "A szerző böngészőben nem látta."], ["ux", "A deltoid sarokháromszögei nincsenek animálva."]],
  "GEO-20": [["check", "A szerző böngészőben nem látta."], ["math", "Konkáv alakzatnál a legyező egyik háromszöge negatív területtel, pirosan jelenik meg (így jön ki az összeg)."]],
  "GEO-21": [["check", "A szerző nem látta; én a szeletelős kártyát megnéztem, a guruló kereket nem."]],
  "GEO-22": [["check", "A szerző böngészőben nem látta."]],
  "GEO-23": [["check", "A szerző böngészőben nem látta."], ["math", "Az egybevágóság-ellenőrzés csak a beépített alakzatokra megbízható."]],
  "GEO-24": [["check", "A szerző böngészőben nem látta; a húzás nincs ellenőrizve."]],
  "GEO-25": [["check", "A szerző böngészőben nem látta."], ["wording", "„egyenlő szárú” vagy „szimmetrikus” trapéz?"]],
  "GEO-26": [["check", "A szerző böngészőben nem látta."], ["math", "Matematikai koordináták (y felfelé, pozitív szög az óramutatóval ellentétesen)."]],
  "GEO-27": [["check", "A szerző böngészőben nem látta."]],
  "GEO-28": [["check", "A szerző böngészőben nem látta."], ["wording", "„fej-láb módszer”."]],
  "GEO-29": [["check", "A szerző böngészőben nem látta."], ["wording", "„csúsztatva tükrözés”."]],
  "GEO-30": [["check", "A szerző nem látta; én megnéztem az alapnézetet."], ["wording", "Az SsA eset magyarázatai."]],
  "GEO-31": [["wording", "„-szeresére” alakok."]],
  "GEO-32": [["check", "Egérrel húzást nem próbált a szerző."]],
  "GEO-33": [["check", "Egérrel húzást nem próbált a szerző."]],
  "GEO-35": [["math", "Csak az oldal-oldal-szög változat készült el; az oldal + magasság változat hiányzik."], ["wording", "A hosszabb magyarázó szövegek."]],
  "GEO-37": [["wording", "A bizonyítás szövege; „kerületi szög”."]],
  "GEO-38": [["check", "Egérrel húzást nem próbált a szerző."]],
  "GEO-39": [["check", "Egérrel húzást nem próbált a szerző."]],
  "GEO-41": [["check", "Az utolsó két javítás után nem nézte meg böngészőben a szerző."]],
  "GEO-42": [["math", "sin = 0-nál 0°-ot és 180°-ot ajánl fel, amelyek nem lehetnek háromszög szögei; erre nincs külön üzenet."], ["wording", "sin⁻¹ / cos⁻¹ jelölés."]],
  "GEO-43": [["wording", "„bezárt szög”."]],
  "GEO-44": [["wording", "A bizonyítás szövege; „kerületi szög”, „látószög”."]],
  "GEO-45": [["ux", "Egyes szögeknél a c oldalra rajzolt négyzet kissé rálóg a γ feliratra."]],
  "GEO-46": [["wording", "„3 × 2 szemközti lap”."]],
  "GEO-47": [["wording", "„Hajtogasd!” felirat."]],
  "GEO-48": [["wording", "Euler-összefüggés angol betűkkel (lásd a nyitott kérdést)."]],
  "GEO-49": [["wording", "„É/D/K/Ny” rövidítések."]],
  "GEO-52": [["wording", "„kitérő”, „metsző” magyarázatok."]],
  "GEO-55": [["ux", "A kártyacímek nagybetűsítése miatt a λ Λ-ként jelenik meg."]],

  "ESE-01": [["wording", "Színnevek főnévként („piros”, „kék”)."]],
  "ESE-02": [["ux", "Az AABBC előbeállításnál akár 120 korong: nagyon hosszú oldal."]],
  "ESE-03": [["wording", "A szereplők nevei."]],
  "ESE-05": [["ux", "n = 6-nál 720 korong: nehéz oldal."]],
  "ESE-07": [["wording", "C(n, k) jelölés (lásd a nyitott kérdést)."]],
  "ESE-10": [["wording", "„Mind a 8 útvonal”."]],
  "ESE-11": [["wording", "„1-gyel nőtt”."]],
  "ESE-13": [["ux", "A pontdiagram (nap sorszáma – oldalszám) kicsit mesterkélt; a szöveg jelzi."]],
  "ESE-18": [["check", "A jelmagyarázat-tipp az utolsó képernyőkép után került be."], ["wording", "„városrész”."]],
  "ESE-19": [["math", "Kvartilis- és szórásmódszer (lásd a nyitott kérdést)."], ["wording", "„a négyzetek területének átlaga”."]],
  "ESE-20": [["wording", "„sodrófa-diagram (doboz-bajusz)”."]],
  "ESE-21": [["wording", "„Kipróbálom” gomb."]],
  "ESE-23": [["check", "Az utolsó apró módosítás után csak szintaxis-ellenőrzés volt."]],
  "ESE-28": [["wording", "A találkozási feladat megfogalmazása („legfeljebb ennyit vár a másikra”)."]],
};

function loadReview() {
  try { return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) ?? {}; } catch { return {}; }
}

function saveReview(review) {
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(review)); } catch { /* private mode: keep in memory */ }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const nodes = skills;
const nameOf = new Map(nodes.map((node) => [node.id, node.name]));
const review = loadReview();
const filters = { flaggedOnly: false, status: "all" };
const list = document.getElementById("review-list");
const summary = document.getElementById("review-summary");

const entryOf = (id) => review[id] ?? { status: "todo", note: "" };
const pageUrl = (id) => `worksheet.html?skill=${encodeURIComponent(id)}`;

function renderQuestions() {
  const target = document.getElementById("review-questions");
  for (const question of QUESTIONS) {
    const item = element("li");
    const link = element("a", "", `${question.id} ${nameOf.get(question.id) ?? ""}`);
    link.href = pageUrl(question.id);
    link.target = "_blank";
    item.append(link, element("span", "", ` — ${question.text}`));
    target.append(item);
  }
  const general = document.getElementById("review-general");
  GENERAL_NOTES.forEach((text) => general.append(element("li", "", text)));
}

function renderSummary() {
  const counts = { todo: 0, ok: 0, fix: 0 };
  nodes.forEach((node) => { counts[entryOf(node.id).status] += 1; });
  summary.textContent = `${counts.ok} rendben · ${counts.fix} javítandó · ${counts.todo} átnézendő (összesen ${nodes.length})`;
}

function renderList() {
  list.replaceChildren();
  for (const [branch, branchName] of Object.entries(BRANCHES)) {
    const skills = nodes.filter((node) => node.branch === branch).filter((node) => {
      if (filters.flaggedOnly && !FLAGS[node.id]) return false;
      return filters.status === "all" || entryOf(node.id).status === filters.status;
    });
    if (!skills.length) continue;
    const section = element("section", "branch");
    section.append(element("h2", "", `${branchName} (${skills.length})`));
    skills.forEach((node) => section.append(renderSkill(node)));
    list.append(section);
  }
  renderSummary();
}

function renderSkill(node) {
  const entry = entryOf(node.id);
  const row = element("article", `skill status-${entry.status}`);
  const header = element("div", "skill-header");
  const link = element("a", "", `${node.id} · ${node.name}`);
  link.href = pageUrl(node.id);
  link.target = "_blank";
  const status = element("div", "segmented");
  for (const [value, label] of Object.entries(STATUSES)) {
    const option = element("button", "", label);
    option.type = "button";
    option.setAttribute("aria-pressed", String(entry.status === value));
    option.addEventListener("click", () => { update(node.id, { status: value }); renderList(); });
    status.append(option);
  }
  header.append(link, status);
  row.append(header);

  const flags = FLAGS[node.id] ?? [];
  if (flags.length) {
    const flagList = element("ul", "flags");
    flags.forEach(([type, text]) => {
      const item = element("li");
      item.append(element("span", `tag tag-${type}`, FLAG_TYPES[type]), element("span", "", text));
      flagList.append(item);
    });
    row.append(flagList);
  }
  const note = element("textarea", "note");
  note.placeholder = "Megjegyzés (pl. mit kell javítani)…";
  note.value = entry.note;
  note.rows = entry.note ? 3 : 1;
  note.addEventListener("input", () => update(node.id, { note: note.value }));
  row.append(note);
  return row;
}

function update(id, changes) {
  review[id] = { ...entryOf(id), ...changes };
  saveReview(review);
  renderSummary();
}

function exportMarkdown() {
  const lines = ["# Illusztrációk átnézése", ""];
  for (const node of nodes) {
    const entry = entryOf(node.id);
    if (entry.status === "todo" && !entry.note.trim()) continue;
    lines.push(`- **${node.id}** ${node.name} — ${STATUSES[entry.status]}${entry.note.trim() ? `: ${entry.note.trim().replace(/\n+/g, " ")}` : ""}`);
  }
  return lines.join("\n");
}

document.getElementById("filter-flagged").addEventListener("change", (event) => { filters.flaggedOnly = event.target.checked; renderList(); });
document.getElementById("filter-status").addEventListener("change", (event) => { filters.status = event.target.value; renderList(); });
document.getElementById("export-copy").addEventListener("click", async (event) => {
  try {
    await navigator.clipboard.writeText(exportMarkdown());
    event.target.textContent = "Kimásolva ✓";
  } catch {
    event.target.textContent = "Nem sikerült — használd a letöltést";
  }
});
document.getElementById("export-download").addEventListener("click", () => {
  const link = element("a");
  link.href = URL.createObjectURL(new Blob([exportMarkdown()], { type: "text/markdown" }));
  link.download = "illusztracio-atnezes.md";
  link.click();
  URL.revokeObjectURL(link.href);
});

renderQuestions();
renderList();
