using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http;
using MathRecap.Api.Tests.TestHost;

namespace MathRecap.Api.Tests;

public sealed class LocalAccessGuardsTests(MathRecapFactory factory) : IClassFixture<MathRecapFactory>
{
    private readonly HttpClient client = factory.CreateClient();

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
        var context = await SendWithHost(host, "/");

        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }

    [Theory]
    [InlineData("https://attacker.example")]
    [InlineData("http://localhost.attacker.example")]
    [InlineData("null")]
    public async Task ForeignOriginCannotCallTheApi(string origin)
    {
        var response = await SendWithOrigin(origin);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ApiErrorResponse>(TestContext.Current.CancellationToken);
        Assert.Equal(new ApiError("forbidden_origin", "Az API csak a helyi alkalmazásból hívható."), body?.Error);
    }

    [Theory]
    [InlineData("http://127.0.0.1:3000")]
    [InlineData("http://localhost:3000")]
    [InlineData("http://[::1]:3000")]
    public async Task LocalOriginCanCallTheApi(string origin)
    {
        var response = await SendWithOrigin(origin);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/tree.js")]
    [InlineData("/vendor/katex/katex.min.js")]
    [InlineData("/api/x")]
    public async Task ResponsesForbidContentSniffing(string path)
    {
        var response = await client.GetAsync(path, TestContext.Current.CancellationToken);

        Assert.Equal("nosniff", Assert.Single(response.Headers.GetValues("X-Content-Type-Options")));
    }

    private Task<HttpContext> SendWithHost(string host, string path) =>
        factory.Server.SendAsync(context =>
        {
            context.Request.Host = new HostString(host);
            context.Request.Path = path;
        }, TestContext.Current.CancellationToken);

    private async Task<HttpResponseMessage> SendWithOrigin(string origin)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/x");
        request.Headers.Add("Origin", origin);
        return await client.SendAsync(request, TestContext.Current.CancellationToken);
    }
}
