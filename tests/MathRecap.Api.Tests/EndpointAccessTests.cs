using System.Net;
using System.Net.Http.Json;
using MathRecap.Api.Accounts;
using MathRecap.Api.Tests.TestHost;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.Extensions.DependencyInjection;

namespace MathRecap.Api.Tests;

// The access decision of every endpoint and page. A new endpoint needs a session unless it is added to
// PublicEndpoints here, and a new page needs one unless it is in PageAccess.PublicPages; admin endpoints
// (/api/admin/*) also need an admin.
public sealed class EndpointAccessTests(MathRecapFactory factory) : IClassFixture<MathRecapFactory>
{
    // Method and route pattern of the endpoints anyone may call (the dev tools exist in Development only).
    private static readonly string[] PublicEndpoints =
    [
        "POST /api/auth/sign-in",
        "POST /api/auth/verify-code",
        "POST /api/auth/verify-link",
        "* /api/{**path}",
        "GET /api/dev/accounts",
        "POST /api/dev/sign-in",
        "GET /api/dev/outbox",
        "GET /dev/outbox.html",
    ];

    // Values for the route parameters when an endpoint is called.
    private static readonly Dictionary<string, string> RouteValues = new()
    {
        ["id"] = "7d6c3b2a-0000-4000-8000-000000000001",
        ["skillId"] = "ALG-08",
        ["path"] = "unknown",
    };

    [Fact]
    public void OnlyTheListedEndpointsArePublic()
    {
        var endpoints = Endpoints();
        var publicEndpoints = endpoints.Where(IsPublic).Select(Name).Order().ToList();

        Assert.True(publicEndpoints.SequenceEqual(PublicEndpoints.Order()), $"Public endpoints: {string.Join(", ", publicEndpoints)}. Decide the access of each new one.");
        Assert.All(endpoints.Where(endpoint => !IsPublic(endpoint)), endpoint => Assert.NotEmpty(endpoint.Metadata.GetOrderedMetadata<IAuthorizeData>()));
    }

    [Fact]
    public async Task EveryOtherEndpointAnswers401WithoutASession()
    {
        var protectedEndpoints = Endpoints().Where(endpoint => !IsPublic(endpoint)).ToList();
        Assert.True(protectedEndpoints.Count >= 15);

        foreach (var endpoint in protectedEndpoints)
        {
            var response = await factory.CreateBrowserClient().SendAsync(RequestTo(endpoint), TestContext.Current.CancellationToken);

            Assert.True(response.StatusCode == HttpStatusCode.Unauthorized, $"{Name(endpoint)} answered {(int)response.StatusCode} without a session.");
            await ApiAssert.ErrorAsync(response, HttpStatusCode.Unauthorized, "unauthorized");
        }
    }

    [Fact]
    public async Task AdminEndpointsAnswer403ToOtherLearners()
    {
        var adminEndpoints = Endpoints().Where(endpoint => endpoint.RoutePattern.RawText!.StartsWith("/api/admin/", StringComparison.OrdinalIgnoreCase)).ToList();
        Assert.True(adminEndpoints.Count >= 2);
        var learner = await factory.CreateLearnerClientAsync();

        foreach (var endpoint in adminEndpoints)
        {
            var response = await learner.SendAsync(RequestTo(endpoint), TestContext.Current.CancellationToken);

            Assert.True(response.StatusCode == HttpStatusCode.Forbidden, $"{Name(endpoint)} answered {(int)response.StatusCode} to a learner who is not an admin.");
            await ApiAssert.ErrorAsync(response, HttpStatusCode.Forbidden, "forbidden");
        }
    }

    [Fact]
    public async Task EveryPageIsPublicOrRedirectsToSignInWithoutASession()
    {
        var pages = WebPages();
        Assert.Contains("/index.html", pages);
        Assert.Contains("/privacy.html", pages);

        foreach (var page in pages)
        {
            var response = await factory.CreateBrowserClient().GetAsync(page, TestContext.Current.CancellationToken);

            if (PageAccess.PublicPages.Contains(page, StringComparer.OrdinalIgnoreCase))
            {
                Assert.True(response.StatusCode == HttpStatusCode.OK, $"The public page {page} answered {(int)response.StatusCode}.");
            }
            else
            {
                Assert.True(response.StatusCode == HttpStatusCode.Redirect, $"{page} answered {(int)response.StatusCode} without a session.");
                Assert.Equal($"/sign-in.html?returnUrl={Uri.EscapeDataString(page)}", response.Headers.Location?.OriginalString);
            }
        }
    }

    [Fact]
    public void EveryPublicPageExists()
    {
        var pages = WebPages();
        var endpoints = Endpoints().Select(endpoint => endpoint.RoutePattern.RawText).ToList();

        Assert.All(PageAccess.PublicPages, page => Assert.True(pages.Contains(page) || endpoints.Contains(page), $"The public page {page} is neither in web/ nor an endpoint."));
    }

    private List<RouteEndpoint> Endpoints() => [.. factory.Services.GetRequiredService<EndpointDataSource>().Endpoints.OfType<RouteEndpoint>()];

    // Without authorization metadata, or with AllowAnonymous.
    private static bool IsPublic(Endpoint endpoint) =>
        endpoint.Metadata.GetMetadata<IAllowAnonymous>() is not null || !endpoint.Metadata.GetOrderedMetadata<IAuthorizeData>().Any();

    private static string Name(RouteEndpoint endpoint) => $"{string.Join(",", Methods(endpoint))} {endpoint.RoutePattern.RawText}";

    private static IReadOnlyList<string> Methods(RouteEndpoint endpoint) => endpoint.Metadata.GetMetadata<IHttpMethodMetadata>()?.HttpMethods ?? ["*"];

    // A request like a page's: JSON body for POST and PUT (the client adds the app's Origin).
    private static HttpRequestMessage RequestTo(RouteEndpoint endpoint)
    {
        var method = Methods(endpoint)[0] is "*" ? "GET" : Methods(endpoint)[0];
        var path = string.Concat(endpoint.RoutePattern.PathSegments.Select(segment => "/" + string.Concat(segment.Parts.Select(PathPart))));
        return new HttpRequestMessage(new HttpMethod(method), path) { Content = method is "POST" or "PUT" ? JsonContent.Create(new { }) : null };
    }

    private static string PathPart(RoutePatternPart part) => part switch
    {
        RoutePatternLiteralPart literal => literal.Content,
        RoutePatternSeparatorPart separator => separator.Content,
        RoutePatternParameterPart parameter => RouteValues.TryGetValue(parameter.Name, out var value)
            ? value
            : throw new InvalidOperationException($"Add a value for the route parameter '{parameter.Name}' to RouteValues."),
        _ => throw new InvalidOperationException($"Unexpected route part {part}."),
    };

    // Every HTML file of the front end, as the path it is served at.
    private static List<string> WebPages()
    {
        var webRoot = Repository.PathOf("web");
        return [.. Directory.EnumerateFiles(webRoot, "*.html", SearchOption.AllDirectories).Select(file => "/" + Path.GetRelativePath(webRoot, file).Replace('\\', '/'))];
    }
}
