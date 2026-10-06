namespace MathRecap.Api.Ai;

public static class AiServices
{
    public static void AddAiServices(this IServiceCollection services)
    {
        services.AddOptions<OpenRouterOptions>()
            .BindConfiguration(OpenRouterOptions.SectionName)
            .PostConfigure<IConfiguration>((options, configuration) =>
            {
                if (string.IsNullOrEmpty(options.ApiKey)) options.ApiKey = configuration["OPENROUTER_API_KEY"];
            })
            .Validate(options => options.Model.Length > 0 && options.BaseUrl is not null && options.Timeout > TimeSpan.Zero, "OpenRouter:Model, OpenRouter:BaseUrl and OpenRouter:Timeout must be configured.")
            .ValidateOnStart();
        // Each attempt has its own timeout (OpenRouter:Timeout), so the client has none.
        services.AddHttpClient<OpenRouterClient>(client => client.Timeout = Timeout.InfiniteTimeSpan);
        services.AddSingleton<Prompts>();
        services.AddTransient<ContentGenerator>();
    }
}
