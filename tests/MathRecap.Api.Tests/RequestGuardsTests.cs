using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http;
using MathRecap.Api.Tests.TestHost;

namespace MathRecap.Api.Tests;

public sealed class RequestGuardsTests(MathRecapFactory factory) : IClassFixture<MathRecapFactory>
{
    [Theory]
    [InlineData("attacker.example", "/")]
    [InlineData("attacker.example:3000", "/api/x")]
    [InlineData("127.0.0.1.attacker.example", "/")]
    public async Task ForeignHostIsRejected(string host, string path)
    {
        var context = await SendWithHost(host, path);

        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
    }

    [Theory]
    [InlineData("127.0.0.1:3000")]
    [InlineData("localhost:3000")]
    [InlineData("[::1]:3000")]
    public async Task LoopbackHostIsAccepted(string host)
    {
        var context = await SendWithHost(host, "/sign-in.html");

        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }

    [Theory]
    [InlineData("POST", "https://attacker.example")]
    [InlineData("POST", "http://localhost.attacker.example")]
    [InlineData("POST", "http://localhost:3000")]
    [InlineData("POST", "https://localhost")]
    [InlineData("POST", "http://localhost/")]
    [InlineData("POST", "null")]
    [InlineData("POST", null)]
    [InlineData("PUT", "https://attacker.example")]
    [InlineData("PATCH", "https://attacker.example")]
    [InlineData("DELETE", "https://attacker.example")]
    [InlineData("DELETE", null)]
    public async Task CrossOriginWritesAreRejected(string method, string? origin)
    {
        // Signed in, but adds no Origin by itself.
        var client = factory.CreateClient();
        using var signIn = new HttpRequestMessage(HttpMethod.Post, "/api/dev/sign-in") { Content = JsonContent.Create(new { email = MathRecapFactory.DevAccountEmail }) };
        signIn.Headers.Add("Origin", MathRecapFactory.Origin);
        (await client.SendAsync(signIn, TestContext.Current.CancellationToken)).EnsureSuccessStatusCode();
        using var request = new HttpRequestMessage(new HttpMethod(method), "/api/auth/sign-out");
        if (origin is not null) request.Headers.Add("Origin", origin);

        var response = await client.SendAsync(request, TestContext.Current.CancellationToken);

        var error = await ApiAssert.ErrorAsync(response, HttpStatusCode.Forbidden, "forbidden_origin");
        Assert.Equal("Az API csak az alkalmazás saját oldalairól hívható.", error["message"]!.GetValue<string>());
        Assert.Equal(HttpStatusCode.OK, (await client.MeAsync()).StatusCode);
    }

    [Fact]
    public async Task CrossOriginSignInRequestsSendNoEmail()
    {
        var email = SignInSteps.NewEmail();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/sign-in") { Content = JsonContent.Create(new { email }) };
        request.Headers.Add("Origin", "https://attacker.example");

        var response = await factory.CreateBrowserClient().SendAsync(request, TestContext.Current.CancellationToken);

        await ApiAssert.ErrorAsync(response, HttpStatusCode.Forbidden, "forbidden_origin");
        Assert.DoesNotContain(factory.Outbox.Messages, message => message.To == email);
    }

    [Fact]
    public async Task SameOriginWritesAreAccepted()
    {
        var client = await factory.CreateSignedInClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/sign-out");
        request.Headers.Add("Origin", MathRecapFactory.Origin);

        var response = await client.SendAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task CrossOriginReadsAreNotBlocked()
    {
        var client = await factory.CreateSignedInClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        request.Headers.Add("Origin", "https://attacker.example");

        var response = await client.SendAsync(request, TestContext.Current.CancellationToken);

        // Browsers keep the answer from the other site: the API sends no CORS headers.
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/sign-in.html")]
    [InlineData("/tree.js")]
    [InlineData("/vendor/katex/katex.min.js")]
    [InlineData("/api/x")]
    public async Task ResponsesForbidContentSniffing(string path)
    {
        var response = await factory.CreateBrowserClient().GetAsync(path, TestContext.Current.CancellationToken);

        Assert.Equal("nosniff", Assert.Single(response.Headers.GetValues("X-Content-Type-Options")));
    }

    private Task<HttpContext> SendWithHost(string host, string path) =>
        factory.Server.SendAsync(context =>
        {
            context.Request.Host = new HostString(host);
            context.Request.Path = path;
        }, TestContext.Current.CancellationToken);
}
