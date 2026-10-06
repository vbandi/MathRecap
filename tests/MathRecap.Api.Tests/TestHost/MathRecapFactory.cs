using MathRecap.Api.Ai;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace MathRecap.Api.Tests.TestHost;

// The app as every test runs it. FakeOpenRouter is the primary handler of every HttpClient, so no test
// can reach the network, and the API key is a test value rather than the developer's own.
public sealed class MathRecapFactory : WebApplicationFactory<Program>
{
    public const string TestApiKey = "test-only-key";

    public FakeOpenRouter OpenRouter { get; } = new();

    public CapturingLoggerProvider Logs { get; } = new();

    public string? ApiKey { get; init; } = TestApiKey;

    public TimeSpan? Timeout { get; init; }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureLogging(logging => logging.AddProvider(Logs));
        builder.ConfigureTestServices(services =>
        {
            services.ConfigureHttpClientDefaults(client => client.ConfigurePrimaryHttpMessageHandler(OpenRouter.CreateHandler));
            services.PostConfigure<OpenRouterOptions>(options =>
            {
                options.ApiKey = ApiKey;
                if (Timeout is { } timeout) options.Timeout = timeout;
            });
        });
    }
}
