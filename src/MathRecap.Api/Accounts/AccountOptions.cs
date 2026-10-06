namespace MathRecap.Api.Accounts;

public sealed class AppOptions
{
    public const string SectionName = "App";

    // Where the app is reached from a browser; the emailed sign-in links point here.
    public Uri? BaseUrl { get; set; }
}

public sealed class SignInOptions
{
    public const string SectionName = "SignIn";
    public const int MinimumKeyLength = 32;

    // The HMAC key of the stored sign-in code hashes. A secret outside Development.
    public string? CodeHashKey { get; set; }
}

public sealed class RateLimitOptions
{
    public const string SectionName = "RateLimits";

    // Sign-in emails requested from one IP address.
    public int SignInPerMinute { get; set; }

    public int SignInPerHour { get; set; }

    // Code and link checks from one IP address.
    public int VerifyPerMinute { get; set; }

    // Sign-in emails sent to one address.
    public int SignInPerEmailPerHour { get; set; }
}
