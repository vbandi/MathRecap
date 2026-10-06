using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using MathRecap.Api.Tests.TestHost;
using Microsoft.AspNetCore.Http;

namespace MathRecap.Api.Tests;

// Each test has its own app, so the limits it sets and the counts it reaches are its own.
public sealed class RateLimitTests
{
    private const string FirstAddress = "203.0.113.1";
    private const string SecondAddress = "203.0.113.2";

    [Fact]
    public async Task SignInRequestsAreLimitedPerMinutePerIpAddress()
    {
        await using var factory = new MathRecapFactory { Settings = new Dictionary<string, string?> { ["RateLimits:SignInPerMinute"] = "2" } };

        for (var request = 0; request < 2; request++)
        {
            Assert.Equal(StatusCodes.Status204NoContent, (await PostFromAsync(factory, FirstAddress, "/api/auth/sign-in", new { email = SignInSteps.NewEmail() })).StatusCode);
        }
        var limited = await PostFromAsync(factory, FirstAddress, "/api/auth/sign-in", new { email = SignInSteps.NewEmail() });

        Assert.Equal(StatusCodes.Status429TooManyRequests, limited.StatusCode);
        Assert.Equal("rate_limited", limited.Error!["code"]!.GetValue<string>());
        Assert.Equal("Túl sok kérés. Várj egy kicsit, és próbáld újra.", limited.Error["message"]!.GetValue<string>());
        Assert.True(limited.RetryAfterSeconds > 0);
        Assert.Equal(StatusCodes.Status204NoContent, (await PostFromAsync(factory, SecondAddress, "/api/auth/sign-in", new { email = SignInSteps.NewEmail() })).StatusCode);
    }

    [Fact]
    public async Task SignInRequestsAreLimitedPerHourPerIpAddress()
    {
        await using var factory = new MathRecapFactory { Settings = new Dictionary<string, string?> { ["RateLimits:SignInPerMinute"] = "100", ["RateLimits:SignInPerHour"] = "3" } };

        for (var request = 0; request < 3; request++) await PostFromAsync(factory, FirstAddress, "/api/auth/sign-in", new { email = SignInSteps.NewEmail() });
        var limited = await PostFromAsync(factory, FirstAddress, "/api/auth/sign-in", new { email = SignInSteps.NewEmail() });

        Assert.Equal(StatusCodes.Status429TooManyRequests, limited.StatusCode);
        Assert.Equal("rate_limited", limited.Error!["code"]!.GetValue<string>());
    }

    [Fact]
    public async Task VerifyAttemptsAreLimitedPerIpAddress()
    {
        await using var factory = new MathRecapFactory { Settings = new Dictionary<string, string?> { ["RateLimits:VerifyPerMinute"] = "3" } };
        var email = SignInSteps.NewEmail();
        await PostFromAsync(factory, FirstAddress, "/api/auth/sign-in", new { email });

        await PostFromAsync(factory, FirstAddress, "/api/auth/verify-code", new { email, code = "000000" });
        await PostFromAsync(factory, FirstAddress, "/api/auth/verify-link", new { token = "unknown" });
        await PostFromAsync(factory, FirstAddress, "/api/auth/verify-code", new { email, code = "000000" });
        var limited = await PostFromAsync(factory, FirstAddress, "/api/auth/verify-code", new { email, code = SignInSteps.CodeOf(factory.LatestEmailTo(email)) });

        Assert.Equal(StatusCodes.Status429TooManyRequests, limited.StatusCode);
        Assert.Equal("rate_limited", limited.Error!["code"]!.GetValue<string>());
        var elsewhere = await PostFromAsync(factory, SecondAddress, "/api/auth/verify-code", new { email, code = SignInSteps.CodeOf(factory.LatestEmailTo(email)) });
        Assert.Equal(StatusCodes.Status200OK, elsewhere.StatusCode);
    }

    [Fact]
    public async Task SignInEmailsAreLimitedPerAddress()
    {
        await using var factory = new MathRecapFactory { Settings = new Dictionary<string, string?> { ["RateLimits:SignInPerEmailPerHour"] = "2" } };
        var email = SignInSteps.NewEmail();

        await PostFromAsync(factory, FirstAddress, "/api/auth/sign-in", new { email });
        await PostFromAsync(factory, SecondAddress, "/api/auth/sign-in", new { email });
        var limited = await PostFromAsync(factory, "203.0.113.3", "/api/auth/sign-in", new { email = email.ToUpperInvariant() });

        Assert.Equal(StatusCodes.Status429TooManyRequests, limited.StatusCode);
        Assert.Equal("rate_limited", limited.Error!["code"]!.GetValue<string>());
        Assert.Equal(2, factory.Outbox.Messages.Count(message => message.To == email));
        Assert.Equal(StatusCodes.Status204NoContent, (await PostFromAsync(factory, FirstAddress, "/api/auth/sign-in", new { email = SignInSteps.NewEmail() })).StatusCode);
    }

    private sealed record Answer(int StatusCode, JsonNode? Error, int RetryAfterSeconds);

    // A same-origin JSON POST from the given client IP address.
    private static async Task<Answer> PostFromAsync(MathRecapFactory factory, string address, string path, object body)
    {
        var context = await factory.Server.SendAsync(context =>
        {
            context.Connection.RemoteIpAddress = IPAddress.Parse(address);
            context.Request.Method = HttpMethods.Post;
            context.Request.Path = path;
            context.Request.Headers.Origin = MathRecapFactory.Origin;
            context.Request.ContentType = "application/json";
            context.Request.Body = new MemoryStream(JsonSerializer.SerializeToUtf8Bytes(body));
        }, TestContext.Current.CancellationToken);
        var text = await new StreamReader(context.Response.Body).ReadToEndAsync(TestContext.Current.CancellationToken);
        var error = text.Length > 0 ? JsonNode.Parse(text)?["error"] : null;
        return new Answer(context.Response.StatusCode, error, int.TryParse(context.Response.Headers.RetryAfter, out var seconds) ? seconds : 0);
    }
}
