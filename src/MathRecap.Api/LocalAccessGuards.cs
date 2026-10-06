namespace MathRecap.Api;

// Protections for running on the learner's own machine. Foreign Host headers (DNS rebinding) are
// rejected by host filtering, configured through AllowedHosts in appsettings.json.
public static class LocalAccessGuards
{
    public static void UseLocalAccessGuards(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            context.Response.Headers.XContentTypeOptions = "nosniff";
            // Other sites open in the browser must not be able to call the API.
            if (context.Request.Path.StartsWithSegments("/api") && !IsLocalOrigin(context.Request))
            {
                await ApiErrors.Create(StatusCodes.Status403Forbidden, "forbidden_origin", "Az API csak a helyi alkalmazásból hívható.").ExecuteAsync(context);
                return;
            }
            await next(context);
        });
    }

    private static bool IsLocalOrigin(HttpRequest request)
    {
        var origin = request.Headers.Origin;
        return origin.Count == 0 || (Uri.TryCreate(origin.ToString(), UriKind.Absolute, out var uri) && uri.IsLoopback);
    }
}
