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

// Shows the signed-in email address and a sign-out button in the page header. Without a session (it
// may have ended since the page loaded) it goes to the sign-in page.
export async function mountAccountMenu(container) {
  const response = await fetch("/api/auth/me").catch(() => null);
  if (response?.status === 401) {
    window.location.replace(signInPageUrl());
    return;
  }
  if (!response?.ok) return;
  const { email } = await response.json();
  const label = document.createElement("span");
  label.className = "account-email";
  label.textContent = email;
  label.title = email;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn ghost";
  button.textContent = "Kijelentkezés";
  button.addEventListener("click", async () => {
    button.disabled = true;
    const result = await postJson("/api/auth/sign-out").catch(() => null);
    if (result?.ok || result?.status === 401) window.location.assign("/sign-in.html");
    else button.disabled = false;
  });
  container.replaceChildren(label, button);
}
