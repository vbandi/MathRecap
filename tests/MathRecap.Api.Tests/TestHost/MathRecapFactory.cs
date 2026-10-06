using System.Net.Http.Json;
using MathRecap.Api.Ai;
using MathRecap.Api.Dev;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Mvc.Testing.Handlers;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;

namespace MathRecap.Api.Tests.TestHost;

// The app as every test runs it: in Development (dev accounts and the dev outbox on) against the test
// run's database. FakeOpenRouter is the primary handler of every HttpClient, so no test can reach the
// network, and the API key is a test value rather than the developer's own.
public sealed class MathRecapFactory : WebApplicationFactory<Program>
{
    public const string TestApiKey = "test-only-key";
    public const string Origin = "http://localhost";
    public const string DevAccountEmail = "tanulo1@mathrecap.local";

    // High enough for tests that share a factory; rate-limit tests set their own.
    private static readonly Dictionary<string, string?> DefaultSettings = new()
    {
        ["RateLimits:SignInPerMinute"] = "1000",
        ["RateLimits:SignInPerHour"] = "1000",
        ["RateLimits:VerifyPerMinute"] = "1000",
        ["RateLimits:SignInPerEmailPerHour"] = "1000",
    };

    public FakeOpenRouter OpenRouter { get; } = new();

    public CapturingLoggerProvider Logs { get; } = new();

    public string? ApiKey { get; init; } = TestApiKey;

    public TimeSpan? Timeout { get; init; }

    // Replaces the system clock, so tests can move time forward. Never more than an hour: the challenge
    // cleanup would then delete other tests' rows in the shared database.
    public FakeTimeProvider? Clock { get; init; }

    public string Environment { get; init; } = Environments.Development;

    // Configuration over the environment's appsettings files and the defaults above.
    public IReadOnlyDictionary<string, string?> Settings { get; init; } = new Dictionary<string, string?>();

    public DevOutbox Outbox => Services.GetRequiredService<DevOutbox>();

    // A client like the app's pages in a browser: it keeps cookies, sends the app's Origin with unsafe
    // requests, and does not follow redirects.
    public HttpClient CreateBrowserClient() => CreateDefaultClient(new CookieContainerHandler(), new SameOriginHandler());

    public async Task<HttpClient> CreateSignedInClientAsync(string email = DevAccountEmail)
    {
        var client = CreateBrowserClient();
        var response = await client.PostAsJsonAsync("/api/dev/sign-in", new { email }, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        return client;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // A Development app migrates the database at startup; creating it first keeps parallel apps from
        // racing to create it. Other environments do not touch the database.
        if (Environment == Environments.Development) TestDatabase.EnsureCreatedAsync().GetAwaiter().GetResult();
        builder.UseEnvironment(Environment);
        // UseSetting, unlike ConfigureAppConfiguration, is visible to Program.cs before it builds the app.
        builder.UseSetting("ConnectionStrings:Database", TestDatabase.ConnectionString);
        foreach (var (key, value) in DefaultSettings.Concat(Settings)) builder.UseSetting(key, value);
        // Every level of every category, whatever the appsettings filters.
        builder.ConfigureLogging(logging => logging.AddProvider(Logs).AddFilter<CapturingLoggerProvider>(_ => true));
        builder.ConfigureTestServices(services =>
        {
            services.ConfigureHttpClientDefaults(client => client.ConfigurePrimaryHttpMessageHandler(OpenRouter.CreateHandler));
            services.PostConfigure<OpenRouterOptions>(options =>
            {
                options.ApiKey = ApiKey;
                if (Timeout is { } timeout) options.Timeout = timeout;
            });
            if (Clock is not null) services.AddSingleton<TimeProvider>(Clock);
        });
    }

    private sealed class SameOriginHandler : DelegatingHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (!HttpMethods.IsGet(request.Method.Method) && !HttpMethods.IsHead(request.Method.Method) && !request.Headers.Contains("Origin"))
            {
                request.Headers.Add("Origin", Origin);
            }
            return base.SendAsync(request, cancellationToken);
        }
    }
}
