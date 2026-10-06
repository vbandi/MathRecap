using System.Net;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MathRecap.Api.Tests;

public sealed class StaticHostingTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task IndexPageIsServedAtRoot()
    {
        var response = await client.GetAsync("/", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("utf-8", response.Content.Headers.ContentType?.CharSet);
        Assert.Contains("MathRecap", await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    [Theory]
    [InlineData("/worksheet.html", "text/html", "utf-8")]
    [InlineData("/worksheet-model.mjs", "text/javascript", "utf-8")]
    [InlineData("/tree.js", "text/javascript", "utf-8")]
    [InlineData("/theme.css", "text/css", "utf-8")]
    [InlineData("/data/curriculum.json", "application/json", "utf-8")]
    [InlineData("/vendor/katex/katex.min.js", "text/javascript", "utf-8")]
    [InlineData("/vendor/katex/katex.min.css", "text/css", "utf-8")]
    [InlineData("/vendor/katex/fonts/KaTeX_Main-Regular.woff2", "font/woff2", null)]
    public async Task StaticFilesAreServedWithTheirContentType(string path, string mediaType, string? charSet)
    {
        var response = await client.GetAsync(path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(mediaType, response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(charSet, response.Content.Headers.ContentType?.CharSet);
    }

    // Sent through the test server directly, because HttpClient would normalize these paths.
    // Kestrel leaves an encoded slash (%2F) undecoded, so it reaches the app as in these paths.
    [Theory]
    [InlineData("/../package.json")]
    [InlineData("/..%2Fpackage.json")]
    [InlineData("/..%2fpackage.json")]
    [InlineData("/..\\package.json")]
    [InlineData("/..%2fserver.mjs")]
    [InlineData("/vendor/katex/../package.json")]
    [InlineData("/vendor/katex/../../../package.json")]
    [InlineData("/vendor/katex/..%2F..%2F..%2Fpackage.json")]
    [InlineData("/vendor/katex/..\\..\\..\\package.json")]
    [InlineData("/vendor/../package.json")]
    public async Task PathTraversalNeverLeavesTheStaticRoots(string path)
    {
        var context = await factory.Server.SendAsync(request => request.Request.Path = path, TestContext.Current.CancellationToken);

        Assert.Equal(StatusCodes.Status404NotFound, context.Response.StatusCode);
    }
}
