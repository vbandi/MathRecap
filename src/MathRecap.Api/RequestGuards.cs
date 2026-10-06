namespace MathRecap.Api;

// Protections that apply before anything else. Foreign Host headers (DNS rebinding) are rejected by
// host filtering, configured through AllowedHosts in appsettings.json.
public static class RequestGuards
{
    public static void UseRequestGuards(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            context.Response.Headers.XContentTypeOptions = "nosniff";
            // Other sites open in the browser must not be able to change anything through the API with
            // the learner's session. Browsers send Origin with every such request.
            if (context.Request.Path.StartsWithSegments("/api") && !IsSafeMethod(context.Request.Method) && !IsOwnOrigin(context.Request))
            {
                await ApiErrors.Create(StatusCodes.Status403Forbidden, "forbidden_origin", "Az API csak az alkalmazás saját oldalairól hívható.").ExecuteAsync(context);
                return;
            }
            await next(context);
        });
    }

    private static bool IsSafeMethod(string method) =>
        HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method) || HttpMethods.IsTrace(method);

    // The Origin header must be exactly the origin the request was sent to: its scheme, host and port.
    private static bool IsOwnOrigin(HttpRequest request)
    {
        var origin = request.Headers.Origin.ToString();
        return Uri.TryCreate(origin, UriKind.Absolute, out var sent)
            && sent.GetLeftPart(UriPartial.Authority) == origin
            && Uri.TryCreate($"{request.Scheme}://{request.Host}", UriKind.Absolute, out var own)
            && Uri.Compare(sent, own, UriComponents.SchemeAndServer, UriFormat.UriEscaped, StringComparison.OrdinalIgnoreCase) == 0;
    }
}
