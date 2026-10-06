namespace MathRecap.Api.Ai;

// The OpenRouter configuration section. The API key comes from OpenRouter:ApiKey or, as documented
// in the README, from the OPENROUTER_API_KEY environment variable.
public sealed class OpenRouterOptions
{
    public const string SectionName = "OpenRouter";

    public string? ApiKey { get; set; }

    public string Model { get; set; } = "";

    public Uri? BaseUrl { get; set; }

    public TimeSpan Timeout { get; set; }
}
