using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.Extensions.Options;

namespace MathRecap.Api.Accounts;

// Per-IP limits of the sign-in endpoints, from the RateLimits configuration section. The per-email limit
// is counted in the database (SignInChallenges).
public static class RateLimits
{
    public const string SignInPolicy = "sign-in";
    public const string VerifyPolicy = "verify";

    public static ApiException Exceeded() =>
        new(StatusCodes.Status429TooManyRequests, "rate_limited", "Túl sok kérés. Várj egy kicsit, és próbáld újra.");

    public static void AddRateLimits(this IServiceCollection services)
    {
        services.AddOptions<RateLimitOptions>()
            .BindConfiguration(RateLimitOptions.SectionName)
            .Validate(options => options is { SignInPerMinute: > 0, SignInPerHour: > 0, VerifyPerMinute: > 0, SignInPerEmailPerHour: > 0 }, "Every RateLimits value must be configured and positive.")
            .ValidateOnStart();
        services.AddRateLimiter(options =>
        {
            options.OnRejected = (context, _) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter = ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString(CultureInfo.InvariantCulture);
                }
                var error = Exceeded();
                return new ValueTask(ApiErrors.Create(error.StatusCode, error.Error).ExecuteAsync(context.HttpContext));
            };
            options.AddPolicy(SignInPolicy, context =>
            {
                var limits = LimitsOf(context);
                return RateLimitPartition.Get(ClientAddress(context), _ => RateLimiter.CreateChained(
                    new FixedWindowRateLimiter(Window(limits.SignInPerMinute, TimeSpan.FromMinutes(1))),
                    new FixedWindowRateLimiter(Window(limits.SignInPerHour, TimeSpan.FromHours(1)))));
            });
            options.AddPolicy(VerifyPolicy, context =>
                RateLimitPartition.GetFixedWindowLimiter(ClientAddress(context), _ => Window(LimitsOf(context).VerifyPerMinute, TimeSpan.FromMinutes(1))));
        });
    }

    private static RateLimitOptions LimitsOf(HttpContext context) => context.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;

    private static string ClientAddress(HttpContext context) => context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    private static FixedWindowRateLimiterOptions Window(int permits, TimeSpan window) => new() { PermitLimit = permits, Window = window, QueueLimit = 0 };
}
