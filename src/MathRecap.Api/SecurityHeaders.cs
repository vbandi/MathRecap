namespace MathRecap.Api;

// Browser protections on every response, and HTTPS outside Development. The pages load scripts, styles
// and fonts only from the app itself and have no inline scripts, inline styles or event handler
// attributes (styles that scripts set go through element.style, which the policy allows).
public static class SecurityHeaders
{
    public const string ContentSecurityPolicy =
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; " +
        "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

    // Features the app never uses.
    public const string PermissionsPolicy = "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()";

    public static void UseSecurityHeaders(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
            app.UseHttpsRedirection();
        }
        app.Use(async (context, next) =>
        {
            var headers = context.Response.Headers;
            headers.ContentSecurityPolicy = ContentSecurityPolicy;
            headers.XContentTypeOptions = "nosniff";
            headers.XFrameOptions = "DENY";
            headers["Referrer-Policy"] = "no-referrer";
            headers["Permissions-Policy"] = PermissionsPolicy;
            headers["Cross-Origin-Opener-Policy"] = "same-origin";
            // API answers carry the learner's data; no cache may keep them.
            if (context.Request.Path.StartsWithSegments("/api")) headers.CacheControl = "no-store";
            await next(context);
        });
    }
}
