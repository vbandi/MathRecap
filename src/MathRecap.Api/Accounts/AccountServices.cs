using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace MathRecap.Api.Accounts;

public static class AccountServices
{
    public static void AddAccounts(this IServiceCollection services)
    {
        services.AddOptions<AppOptions>()
            .BindConfiguration(AppOptions.SectionName)
            .Validate(options => options.BaseUrl is { IsAbsoluteUri: true, Scheme: "http" or "https" }, "App:BaseUrl must be configured as an absolute http(s) URL.")
            .ValidateOnStart();
        services.AddOptions<SignInOptions>()
            .BindConfiguration(SignInOptions.SectionName)
            .Validate(options => options.CodeHashKey?.Length >= SignInOptions.MinimumKeyLength, $"SignIn:CodeHashKey must be configured, with at least {SignInOptions.MinimumKeyLength} characters.")
            .ValidateOnStart();
        services.AddOptions<AdminOptions>()
            .BindConfiguration(AdminOptions.SectionName)
            .Validate(options => options.Emails.All(email => EmailAddress.TryParse(email) is not null), "Every Admin:Emails entry must be a valid email address.")
            .ValidateOnStart();
        services.TryAddSingleton(TimeProvider.System);
        services.AddScoped<SignInChallenges>();
        services.AddScoped<UserAccounts>();
        services.AddScoped<Admins>();
        services.AddRateLimits();

        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options =>
        {
            options.Cookie.Name = "MathRecap.Session";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
            options.ExpireTimeSpan = TimeSpan.FromDays(30);
            options.SlidingExpiration = true;
            options.Events.OnValidatePrincipal = UserAccounts.ValidateSessionAsync;
            // Only API endpoints require authorization (pages redirect in PageAccess), so a missing
            // session is answered with JSON, never with a redirect.
            options.Events.OnRedirectToLogin = context =>
                ApiErrors.Create(StatusCodes.Status401Unauthorized, "unauthorized", "Ehhez be kell jelentkezned.").ExecuteAsync(context.HttpContext);
        });
        services.AddAuthorization();
    }
}
