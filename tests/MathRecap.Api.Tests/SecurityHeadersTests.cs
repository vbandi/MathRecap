using System.Net;
using System.Net.Http.Json;
using MathRecap.Api.Tests.TestHost;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Hosting;

namespace MathRecap.Api.Tests;

// The browser protections of every response (see SecurityHeaders).
public sealed class SecurityHeadersTests(MathRecapFactory factory) : IClassFixture<MathRecapFactory>
{
    private const string Policy =
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; " +
        "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

    [Theory]
    [InlineData("/sign-in.html", HttpStatusCode.OK)]
    [InlineData("/privacy.html", HttpStatusCode.OK)]
    [InlineData("/dev/outbox.html", HttpStatusCode.OK)]
    [InlineData("/tree.js", HttpStatusCode.OK)]
    [InlineData("/vendor/katex/katex.min.css", HttpStatusCode.OK)]
    [InlineData("/worksheet.html", HttpStatusCode.Redirect)]
    [InlineData("/missing.png", HttpStatusCode.NotFound)]
    [InlineData("/api/me", HttpStatusCode.Unauthorized)]
    [InlineData("/api/unknown", HttpStatusCode.NotFound)]
    [InlineData("/api/dev/accounts", HttpStatusCode.OK)]
    public async Task EveryResponseCarriesTheSecurityHeaders(string path, HttpStatusCode status)
    {
        var response = await factory.CreateBrowserClient().GetAsync(path, TestContext.Current.CancellationToken);

        Assert.Equal(status, response.StatusCode);
        AssertSecurityHeaders(response);
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/worksheet.html?skill=ALG-08")]
    [InlineData("/api/me")]
    [InlineData("/api/me/export")]
    [InlineData("/api/worksheets")]
    [InlineData("/api/usefulness/ALG-08")]
    public async Task SignedInResponsesCarryTheSecurityHeaders(string path)
    {
        var client = await factory.CreateLearnerClientAsync();

        var response = await client.GetAsync(path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertSecurityHeaders(response);
    }

    [Fact]
    public async Task TheNoAccessPageCarriesTheSecurityHeadersAndNoInlineCode()
    {
        var learner = await factory.CreateSignedInClientAsync();

        var response = await learner.GetAsync("/review.html", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        AssertSecurityHeaders(response);
        Assert.True(response.Headers.CacheControl?.NoStore);
        AssertNoInlineCode(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task TheDevOutboxPageIsNotCachedAndHasNoInlineCode()
    {
        var client = factory.CreateBrowserClient();
        await client.RequestSignInAsync(SignInSteps.NewEmail());

        var response = await client.GetAsync("/dev/outbox.html", TestContext.Current.CancellationToken);

        Assert.True(response.Headers.CacheControl?.NoStore);
        AssertNoInlineCode(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    // Answers of the endpoints and of the guards in front of them (session, origin, rate limit).
    [Fact]
    public async Task NoApiAnswerIsCached()
    {
        var learner = await factory.CreateLearnerClientAsync();
        using var crossOrigin = new HttpRequestMessage(HttpMethod.Post, "/api/me/onboarding-complete");
        crossOrigin.Headers.Add("Origin", "https://attacker.example");
        await using var limited = new MathRecapFactory { Settings = new Dictionary<string, string?> { ["RateLimits:VerifyPerMinute"] = "1" } };
        var limitedClient = limited.CreateBrowserClient();
        await limitedClient.VerifyLinkAsync("unknown");

        HttpResponseMessage[] responses =
        [
            await learner.GetAsync("/api/me", TestContext.Current.CancellationToken),
            await learner.GetAsync("/api/me/export", TestContext.Current.CancellationToken),
            await learner.PutAsJsonAsync("/api/me/levels", new { levels = new { } }, TestContext.Current.CancellationToken),
            await learner.PostAsJsonAsync("/api/usefulness", new { skillId = "GEO-99" }, TestContext.Current.CancellationToken),
            await learner.GetAsync("/api/unknown", TestContext.Current.CancellationToken),
            await learner.SendAsync(crossOrigin, TestContext.Current.CancellationToken),
            await factory.CreateBrowserClient().GetAsync("/api/me", TestContext.Current.CancellationToken),
            await limitedClient.VerifyLinkAsync("unknown"),
            await factory.CreateBrowserClient().PostAsJsonAsync("/api/dev/sign-in", new { email = MathRecapFactory.DevAccountEmail }, TestContext.Current.CancellationToken),
        ];

        Assert.Equal(
            [HttpStatusCode.OK, HttpStatusCode.OK, HttpStatusCode.NoContent, HttpStatusCode.BadRequest, HttpStatusCode.NotFound, HttpStatusCode.Forbidden, HttpStatusCode.Unauthorized, HttpStatusCode.TooManyRequests, HttpStatusCode.OK],
            responses.Select(response => response.StatusCode));
        Assert.All(responses, response => Assert.True(response.Headers.CacheControl?.NoStore, $"{response.RequestMessage?.RequestUri} ({(int)response.StatusCode}) may be cached."));
    }

    [Fact]
    public async Task DevelopmentDoesNotEnforceHttps()
    {
        var response = await factory.CreateBrowserClient().GetAsync("/sign-in.html", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(response.Headers.Contains("Strict-Transport-Security"));
    }

    // The app itself cannot start outside Development yet (no email sender), so the middleware is tested
    // on its own, as Program.cs uses it.
    [Fact]
    public async Task OutsideDevelopmentHttpsIsEnforced()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = Environments.Production });
        builder.WebHost.UseTestServer();
        builder.WebHost.UseSetting("https_port", "443");
        builder.Configuration["AllowedHosts"] = "*";
        await using var app = builder.Build();
        app.UseSecurityHeaders();
        app.MapGet("/", () => "ok");
        await app.StartAsync(TestContext.Current.CancellationToken);
        var client = app.GetTestClient();

        var overHttp = await client.GetAsync("http://mathrecap.test/sign-in.html", TestContext.Current.CancellationToken);
        var overHttps = await client.GetAsync("https://mathrecap.test/", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.TemporaryRedirect, overHttp.StatusCode);
        Assert.Equal("https://mathrecap.test/sign-in.html", overHttp.Headers.Location?.OriginalString);
        Assert.Equal(HttpStatusCode.OK, overHttps.StatusCode);
        Assert.StartsWith("max-age=", Assert.Single(overHttps.Headers.GetValues("Strict-Transport-Security")));
        AssertSecurityHeaders(overHttps);
    }

    private static void AssertSecurityHeaders(HttpResponseMessage response)
    {
        string Header(string name) => Assert.Single(response.Headers.GetValues(name));

        Assert.Equal(Policy, Header("Content-Security-Policy"));
        Assert.Equal("nosniff", Header("X-Content-Type-Options"));
        Assert.Equal("DENY", Header("X-Frame-Options"));
        Assert.Equal("no-referrer", Header("Referrer-Policy"));
        Assert.Equal("same-origin", Header("Cross-Origin-Opener-Policy"));
        var permissions = Header("Permissions-Policy");
        foreach (var feature in new[] { "camera", "microphone", "geolocation", "payment" }) Assert.Contains($"{feature}=()", permissions);
        if (response.RequestMessage!.RequestUri!.AbsolutePath.StartsWith("/api/", StringComparison.Ordinal)) Assert.True(response.Headers.CacheControl?.NoStore);
    }

    private static void AssertNoInlineCode(string html)
    {
        Assert.DoesNotContain("<style", html, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("style=", html, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("<script", html, StringComparison.OrdinalIgnoreCase);
    }
}
