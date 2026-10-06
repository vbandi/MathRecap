using MathRecap.Api.Dev;
using Microsoft.AspNetCore.Authentication;

namespace MathRecap.Api.Accounts;

// HTML pages need a session, except the public ones listed here; without one they redirect to the
// sign-in page. Admin pages answer everyone else with a 403 page. Everything else the static files
// serve (scripts, styles, curriculum data, illustrations, KaTeX) is public, because none of it holds
// user data. API endpoints: see ApiEndpoints.
public static class PageAccess
{
    public const string SignInPage = "/sign-in.html";

    private static readonly string[] PublicPages = [SignInPage, "/sign-in-link.html", DevTools.OutboxPage];

    private static readonly string[] AdminPages = ["/review.html"];

    private const string NoAccessPage = """
        <!DOCTYPE html>
        <html lang="hu">
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>MathRecap - nincs hozzáférés</title>
        <link rel="stylesheet" href="/theme.css">
        <style>
          main { max-width: 560px; margin: 48px auto; padding: 0 16px; }
          h1 { margin: 6px 0 10px; font: 800 28px/1.15 var(--font-display); }
          p { color: var(--fg-soft); }
        </style>
        </head>
        <body>
        <header class="topbar"><a class="brand" href="/"><span class="logo" aria-hidden="true">√</span>MathRecap</a></header>
        <main>
        <p class="eyebrow">Nincs hozzáférés</p>
        <h1>Ezt az oldalt csak az adminisztrátorok nyithatják meg.</h1>
        <p>Ha szerinted ez tévedés, kérd meg az alkalmazás üzemeltetőjét, hogy vegyen fel az adminisztrátorok közé.</p>
        <p><a class="btn" href="/">Vissza a készségfához</a></p>
        </main>
        </body>
        </html>

        """;

    public static void UsePageAccess(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            var path = context.Request.Path;
            if (IsPage(path) && !IsOneOf(path, PublicPages))
            {
                var session = await context.AuthenticateAsync();
                if (!session.Succeeded)
                {
                    context.Response.Redirect($"{SignInPage}?returnUrl={Uri.EscapeDataString($"{path}{context.Request.QueryString}")}");
                    return;
                }
                if (IsOneOf(path, AdminPages) && !await context.RequestServices.GetRequiredService<Admins>().IsAdminAsync(session.Principal, context.RequestAborted))
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.Headers.CacheControl = "no-store";
                    context.Response.ContentType = "text/html; charset=utf-8";
                    await context.Response.WriteAsync(NoAccessPage, context.RequestAborted);
                    return;
                }
            }
            await next(context);
        });
    }

    // A path the static files answer with an HTML page: an .html file, or a folder's index.html.
    private static bool IsPage(PathString path) =>
        !path.StartsWithSegments("/api") && path.Value is { } value && (value.EndsWith('/') || value.EndsWith(".html", StringComparison.OrdinalIgnoreCase));

    private static bool IsOneOf(PathString path, string[] pages) => pages.Any(page => path.Equals(page, StringComparison.OrdinalIgnoreCase));
}
