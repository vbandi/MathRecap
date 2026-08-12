import { loadLocalState } from "./state.js";
import { needsInlineMathSeparator, orderedProblemPairs, studentProblems } from "./worksheet-model.mjs";

const nodes = window.TREE_NODES ?? [];
const skillId = new URLSearchParams(window.location.search).get("skill");
const skill = nodes.find((node) => node.id === skillId);
const state = loadLocalState(window.localStorage, nodes.map((node) => node.id));
const context = document.getElementById("skill-context");
const requestInput = document.getElementById("worksheet-request");
const generateButton = document.getElementById("generate-button");
const retryButton = document.getElementById("retry-button");
const status = document.getElementById("request-status");
const workspace = document.getElementById("workspace");
const worksheetView = document.getElementById("worksheet-view");
const answersView = document.getElementById("answers-view");
let worksheet = null;

function text(value) {
  return document.createTextNode(value);
}

function element(tag, value, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value) node.append(text(value));
  return node;
}

function renderContent(parts, target) {
  for (const [index, part] of parts.entries()) {
    const previousPart = parts[index - 1];
    const nextPart = parts[index + 1];
    if (part.type === "text") {
      if (previousPart?.type === "inlineMath" && needsInlineMathSeparator(previousPart, part)) target.append(text(" "));
      target.append(text(part.value));
    }
    else {
      if (part.type === "inlineMath" && previousPart?.type === "text" && needsInlineMathSeparator(previousPart, part)) target.append(text(" "));
      const holder = document.createElement(part.type === "displayMath" ? "div" : "span");
      try {
        window.katex.render(part.value, holder, { displayMode: part.type === "displayMath", throwOnError: false, trust: false });
      } catch {
        holder.textContent = part.value;
      }
      target.append(holder);
    }
  }
}

function section(target, heading, parts) {
  target.append(element("h2", heading));
  const content = document.createElement("div");
  renderContent(parts, content);
  target.append(content);
}

function renderWorksheet() {
  worksheetView.replaceChildren();
  worksheetView.append(element("h1", worksheet.title));
  section(worksheetView, "Rövid magyarázat", worksheet.explanation);

  worksheetView.append(element("h2", "Feltételezett előismeretek"));
  const prerequisites = document.createElement("ul");
  worksheet.assumedPrerequisites.forEach((prerequisite) => prerequisites.append(element("li", prerequisite)));
  worksheetView.append(prerequisites);

  worksheetView.append(element("h2", "Megoldott példák"));
  worksheet.workedExamples.forEach((example) => {
    const exampleNode = document.createElement("section");
    exampleNode.className = "worked-example";
    exampleNode.append(element("h3", example.title));
    const steps = document.createElement("div");
    renderContent(example.steps, steps);
    exampleNode.append(steps);
    worksheetView.append(exampleNode);
  });

  section(worksheetView, "Miért fontos ez?", worksheet.whyThisMatters);
  let lastGroupTitle = null;
  studentProblems(worksheet).forEach((problem, index) => {
    if (problem.groupTitle !== lastGroupTitle) {
      worksheetView.append(element("h2", problem.groupTitle));
      lastGroupTitle = problem.groupTitle;
    }
    const problemNode = document.createElement("section");
    problemNode.className = "problem";
    problemNode.append(element("div", `${index + 1}. feladat`, "problem-label"));
    const prompt = document.createElement("div");
    renderContent(problem.prompt, prompt);
    problemNode.append(prompt);
    worksheetView.append(problemNode);
  });

  worksheetView.append(element("h2", "Már tudom"));
  const checklist = document.createElement("ul");
  checklist.className = "checklist";
  worksheet.canChecklist.forEach((item) => checklist.append(element("li", item)));
  worksheetView.append(checklist);
}

function renderAnswers() {
  answersView.replaceChildren();
  answersView.append(element("h1", `${worksheet.title} - megoldókulcs`));
  orderedProblemPairs(worksheet).forEach(({ problem, answer }, index) => {
    const answerNode = document.createElement("section"); answerNode.className = "answer";
    answerNode.append(element("h2", `${index + 1}. feladat`));
    const prompt = document.createElement("p"); renderContent(problem.prompt, prompt); answerNode.append(prompt);
    answerNode.append(element("h3", "Megoldás")); const solution = document.createElement("div"); renderContent(answer.answer, solution); answerNode.append(solution);
    answerNode.append(element("h3", "Indoklás")); const reasoning = document.createElement("div"); renderContent(answer.reasoning, reasoning); answerNode.append(reasoning);
    answersView.append(answerNode);
  });
}

function showView(view) {
  const answers = view === "answers";
  worksheetView.hidden = answers;
  answersView.hidden = !answers;
  document.querySelectorAll("[data-view]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.view === view)));
}

function setRequestState(nextState, message = "") {
  document.body.dataset.requestState = nextState;
  status.textContent = message;
  generateButton.disabled = nextState === "loading";
  retryButton.hidden = nextState !== "error";
  retryButton.disabled = nextState === "loading";
  document.getElementById("new-worksheet").disabled = nextState === "loading";
}

async function generate() {
  if (!skill) return;
  if (!state.selectedModel) { setRequestState("error", "Előbb válassz OpenRouter modellt a fa Beállítások ablakában."); return; }
  const request = requestInput.value.trim();
  if (!request) { setRequestState("error", "Írd le röviden, mit gyakorolnál."); return; }
  setRequestState("loading", "Feladatlap készül...");
  try {
    const response = await fetch("/api/worksheets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: state.selectedModel, profile: state.profile, request, skill: { id: skill.id, nev: skill.nev, leiras: skill.leiras, prerequisites: skill.elofeltetel, relatedSkillIds: skill.utodok } }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || "A feladatlap most nem készült el.");
    worksheet = payload.worksheet; renderWorksheet(); renderAnswers(); workspace.hidden = false; showView("worksheet"); setRequestState("ready");
  } catch (error) {
    setRequestState("error", error.message || "A feladatlap most nem készült el.");
  }
}

if (!skill) {
  context.textContent = "A kiválasztott készség nem található. Térj vissza a fához, és válassz egy csomópontot.";
  generateButton.disabled = true;
} else {
  context.replaceChildren(element("p", `${skill.id} - ${skill.nev}`), element("p", skill.leiras));
}
generateButton.addEventListener("click", generate);
retryButton.addEventListener("click", generate);
document.getElementById("new-worksheet").addEventListener("click", generate);
document.querySelectorAll("[data-print]").forEach((button) => button.addEventListener("click", () => {
  showView(button.dataset.print);
  window.print();
}));
document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));