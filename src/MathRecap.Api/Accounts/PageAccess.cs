using MathRecap.Api.Dev;
using Microsoft.AspNetCore.Authentication;

namespace MathRecap.Api.Accounts;

// HTML pages need a session, except the public ones listed here; without one they redirect to the
// sign-in page. Everything else the static files serve (scripts, styles, curriculum data, illustrations,
// KaTeX) is public, because none of it holds user data. API endpoints: see ApiEndpoints.
public static class PageAccess
{
    public const string SignInPage = "/sign-in.html";

    private static readonly string[] PublicPages = [SignInPage, "/sign-in-link.html", DevTools.OutboxPage];

    public static void UsePageAccess(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            var path = context.Request.Path;
            if (IsPage(path) && !PublicPages.Any(page => path.Equals(page, StringComparison.OrdinalIgnoreCase)) && !(await context.AuthenticateAsync()).Succeeded)
            {
                context.Response.Redirect($"{SignInPage}?returnUrl={Uri.EscapeDataString($"{path}{context.Request.QueryString}")}");
                return;
            }
            await next(context);
        });
    }

    // A path the static files answer with an HTML page: an .html file, or a folder's index.html.
    private static bool IsPage(PathString path) =>
        !path.StartsWithSegments("/api") && path.Value is { } value && (value.EndsWith('/') || value.EndsWith(".html", StringComparison.OrdinalIgnoreCase));
}
