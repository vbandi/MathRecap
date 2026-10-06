import { localReturnUrl } from "./return-url.mjs";
import { errorMessage, postJson } from "./session.js";

const RESEND_DELAY_SECONDS = 30;
const returnUrl = localReturnUrl(new URLSearchParams(window.location.search).get("returnUrl"));
const emailStep = document.getElementById("email-step");
const emailInput = document.getElementById("email");
const codeStep = document.getElementById("code-step");
const codeInput = document.getElementById("code");
const resendButton = document.getElementById("resend");
const resendHint = document.getElementById("resend-hint");
const status = document.getElementById("status");
let email = "";
let resendTimer = null;

function showStatus(message, kind = "info") {
  status.textContent = message;
  status.dataset.kind = kind;
}

function setBusy(form, busy) {
  form.querySelector("button[type=submit]").disabled = busy;
}

async function sendCode() {
  const result = await postJson("/api/auth/sign-in", { email }).catch(() => null);
  if (!result?.ok) showStatus(errorMessage(result, "A kódot most nem sikerült elküldeni. Próbáld újra."), "error");
  return Boolean(result?.ok);
}

function allowResend() {
  clearInterval(resendTimer);
  resendButton.disabled = false;
  resendHint.textContent = "";
}

function delayResend() {
  let remaining = RESEND_DELAY_SECONDS;
  const tick = () => {
    if (remaining === 0) { allowResend(); return; }
    resendHint.textContent = `Új kódot ${remaining} másodperc múlva kérhetsz.`;
    remaining -= 1;
  };
  clearInterval(resendTimer);
  resendButton.disabled = true;
  tick();
  resendTimer = setInterval(tick, 1000);
}

function showCodeStep() {
  emailStep.hidden = true;
  codeStep.hidden = false;
  codeInput.value = "";
  codeInput.focus();
  delayResend();
}

emailStep.addEventListener("submit", async (event) => {
  event.preventDefault();
  email = emailInput.value.trim();
  if (!email || !emailInput.checkValidity()) {
    showStatus("Adj meg egy érvényes e-mail-címet.", "error");
    emailInput.focus();
    return;
  }
  setBusy(emailStep, true);
  showStatus("Kód küldése...");
  const sent = await sendCode();
  setBusy(emailStep, false);
  if (!sent) return;
  showStatus(`Elküldtük a kódot és a belépési linket ide: ${email}. A levél néhány perc alatt megérkezik; nézd meg a levélszemét mappát is.`);
  showCodeStep();
});

codeStep.addEventListener("submit", async (event) => {
  event.preventDefault();
  const code = codeInput.value.trim();
  if (!/^[0-9]{6}$/.test(code)) {
    showStatus("A belépési kód 6 számjegyből áll.", "error");
    codeInput.focus();
    return;
  }
  setBusy(codeStep, true);
  showStatus("Belépés...");
  const result = await postJson("/api/auth/verify-code", { email, code }).catch(() => null);
  if (result?.ok) {
    window.location.assign(returnUrl);
    return;
  }
  setBusy(codeStep, false);
  showStatus(errorMessage(result, "A belépés most nem sikerült. Próbáld újra."), "error");
  if (["code_locked", "code_expired"].includes(result?.payload?.error?.code)) {
    allowResend();
    resendButton.focus();
  } else {
    codeInput.select();
    codeInput.focus();
  }
});

resendButton.addEventListener("click", async () => {
  resendButton.disabled = true;
  showStatus("Új kód küldése...");
  if (!(await sendCode())) {
    resendButton.disabled = false;
    return;
  }
  showStatus(`Új kódot küldtünk ide: ${email}. A korábbi kód és link már nem érvényes.`);
  showCodeStep();
});

document.getElementById("change-email").addEventListener("click", () => {
  allowResend();
  codeStep.hidden = true;
  emailStep.hidden = false;
  showStatus("");
  emailInput.focus();
  emailInput.select();
});

// Listed only when the server has dev accounts enabled (local testing).
async function showDevAccounts() {
  const response = await fetch("/api/dev/accounts").catch(() => null);
  if (!response?.ok) return;
  const { accounts } = await response.json();
  if (!accounts.length) return;
  const section = document.getElementById("dev-accounts");
  const heading = document.createElement("h2");
  heading.id = "dev-accounts-title";
  heading.textContent = "Fejlesztői belépés (csak helyi teszteléshez)";
  const note = document.createElement("p");
  note.textContent = "Ezek a fiókok e-mail nélkül, egy kattintással lépnek be.";
  const list = document.createElement("div");
  list.className = "dev-accounts";
  for (const account of accounts) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn ghost";
    const address = document.createElement("small");
    address.textContent = account.email;
    button.append(account.label, address);
    button.addEventListener("click", async () => {
      button.disabled = true;
      showStatus(`Belépés: ${account.label}...`);
      const result = await postJson("/api/dev/sign-in", { email: account.email }).catch(() => null);
      if (result?.ok) {
        window.location.assign(returnUrl);
        return;
      }
      button.disabled = false;
      showStatus(errorMessage(result, "A fejlesztői belépés most nem sikerült."), "error");
    });
    list.append(button);
  }
  section.replaceChildren(heading, note, list);
  section.hidden = false;
}

showDevAccounts();
