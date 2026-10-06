import { errorMessage, postJson } from "./session.js";

// The token is in the fragment (#token=...), which browsers do not send to the server.
const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
const confirmButton = document.getElementById("confirm");
const status = document.getElementById("status");

function fail(message) {
  confirmButton.hidden = true;
  status.textContent = message;
  status.dataset.kind = "error";
  document.getElementById("restart").hidden = false;
}

if (!token) fail("Ebből a linkből hiányzik a belépési azonosító. Másold be a teljes linket a levélből, vagy kérj új kódot.");

confirmButton.addEventListener("click", async () => {
  confirmButton.disabled = true;
  status.textContent = "Belépés...";
  const result = await postJson("/api/auth/verify-link", { token }).catch(() => null);
  if (result?.ok) {
    window.location.replace("/");
    return;
  }
  if (result?.payload?.error?.code === "invalid_link") {
    fail(errorMessage(result, ""));
    return;
  }
  confirmButton.disabled = false;
  status.textContent = errorMessage(result, "A belépés most nem sikerült. Próbáld újra.");
  status.dataset.kind = "error";
});
