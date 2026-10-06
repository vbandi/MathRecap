// Resolves to { ok, status, payload }; payload is the JSON answer, or null when there is none.
export async function postJson(path, body = {}) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, payload };
}

export function errorMessage(result, fallback) {
  return result?.payload?.error?.message || fallback;
}

export function signInPageUrl(returnUrl = `${window.location.pathname}${window.location.search}`) {
  return `/sign-in.html?returnUrl=${encodeURIComponent(returnUrl)}`;
}

// A failed API call; the message is the server's Hungarian message, or a general one.
export class ApiError extends Error {
  constructor(message, status, code = null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Calls the API of the signed-in pages and resolves to the JSON answer (null for 204). Failures reject
// with an ApiError; without a session (it may have ended since the page loaded) the page goes to the
// sign-in page.
export async function api(method, path, body, { keepalive = false } = {}) {
  let response;
  try {
    response = await fetch(path, {
      method,
      keepalive,
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Nem sikerült elérni a kiszolgálót. Ellenőrizd a kapcsolatot, és próbáld újra.", 0);
  }
  if (response.status === 401) {
    window.location.replace(signInPageUrl());
    throw new ApiError("Lejárt a munkamenet. Lépj be újra.", 401, "unauthorized");
  }
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(payload?.error?.message || "A kérés nem sikerült. Próbáld újra.", response.status, payload?.error?.code);
  return payload;
}

let noticeTimer = null;

// Shows a message at the bottom of the page, for problems that have no place of their own.
export function showNotice(message) {
  let notice = document.getElementById("notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "notice";
    notice.className = "notice";
    notice.setAttribute("role", "alert");
    const text = document.createElement("span");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "notice-close";
    close.setAttribute("aria-label", "Üzenet bezárása");
    close.textContent = "×";
    close.addEventListener("click", () => { notice.hidden = true; });
    notice.append(text, close);
    document.body.append(notice);
  }
  notice.firstChild.textContent = message;
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.hidden = true; }, 12000);
}

function menuItem(tag, text, className = "account-menu-item") {
  const item = document.createElement(tag);
  item.className = className;
  item.textContent = text;
  if (tag === "button") item.type = "button";
  return item;
}

// The account menu of the page header: the signed-in address, the review page for admins, the data
// export, account deletion and signing out. `me` is the answer of GET /api/me.
export function mountAccountMenu(container, me) {
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "btn ghost account-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "account-menu");
  const caret = menuItem("span", "▾", "account-caret");
  caret.setAttribute("aria-hidden", "true");
  toggle.append(menuItem("span", me.email, "account-email"), menuItem("span", "Fiók", "account-short"), caret);
  toggle.title = me.email;

  const menu = document.createElement("div");
  menu.id = "account-menu";
  menu.className = "account-menu";
  menu.hidden = true;
  menu.append(menuItem("p", `Belépve: ${me.email}`, "account-menu-email"));
  if (me.isAdmin) {
    const review = menuItem("a", "Átnézés");
    review.href = "review.html";
    menu.append(review);
  }
  const download = menuItem("a", "Adataim letöltése");
  download.href = "/api/me/export";
  download.setAttribute("download", "");
  const deleteAccount = menuItem("button", "Fiók törlése");
  const signOut = menuItem("button", "Kijelentkezés");
  menu.append(download, deleteAccount, signOut);

  const setOpen = (open) => {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => setOpen(menu.hidden));
  document.addEventListener("click", (event) => {
    if (!menu.hidden && !container.contains(event.target)) setOpen(false);
  });
  container.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      event.stopPropagation();
      setOpen(false);
      toggle.focus();
    }
  });
  download.addEventListener("click", () => setOpen(false));
  deleteAccount.addEventListener("click", () => {
    setOpen(false);
    openAccountDeletion(toggle);
  });
  signOut.addEventListener("click", async () => {
    signOut.disabled = true;
    try {
      await api("POST", "/api/auth/sign-out");
      window.location.assign("/sign-in.html");
    } catch (error) {
      signOut.disabled = false;
      showNotice(`A kijelentkezés nem sikerült: ${error.message}`);
    }
  });
  container.replaceChildren(toggle, menu);
}

// Asks for confirmation in the page, then deletes the account and goes to the sign-in page.
function openAccountDeletion(returnFocusTo) {
  const dialog = document.createElement("dialog");
  dialog.setAttribute("aria-labelledby", "delete-account-title");
  dialog.innerHTML = `
    <div class="modal-body">
      <h2 id="delete-account-title">Fiók törlése</h2>
      <p>A fiókod törlésével véglegesen törlődik minden adatod: a profilod, a tudásszintjeid, a mentett feladatlapjaid és a személyre szabott indoklásaid. A törlés nem vonható vissza.</p>
      <p>Ha meg szeretnéd őrizni őket, előbb töltsd le az adataidat a fiókmenüben.</p>
      <p class="form-error" role="alert"></p>
      <div class="modal-actions">
        <button type="button" class="ghost" data-action="cancel" autofocus>Mégse</button>
        <button type="button" class="danger" data-action="delete">Fiók végleges törlése</button>
      </div>
    </div>`;
  const error = dialog.querySelector(".form-error");
  const buttons = dialog.querySelectorAll("button");
  dialog.addEventListener("close", () => {
    dialog.remove();
    returnFocusTo.focus();
  });
  dialog.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "cancel") dialog.close();
    if (action !== "delete") return;
    buttons.forEach((button) => { button.disabled = true; });
    error.textContent = "";
    try {
      await api("DELETE", "/api/me");
      window.location.assign("/sign-in.html?accountDeleted=1");
    } catch (failure) {
      error.textContent = `A fiók törlése nem sikerült: ${failure.message}`;
      buttons.forEach((button) => { button.disabled = false; });
    }
  });
  document.body.append(dialog);
  dialog.showModal();
}
