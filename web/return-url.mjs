const BASE = "http://return-url.invalid";

// Where to go after signing in: the returnUrl parameter if it is a path of this site, otherwise "/".
export function localReturnUrl(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  try {
    const url = new URL(value, BASE);
    return url.origin === BASE ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}
