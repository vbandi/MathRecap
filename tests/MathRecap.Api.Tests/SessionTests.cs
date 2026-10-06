using System.Net;
using System.Net.Http.Json;
using MathRecap.Api.Tests.TestHost;
using Microsoft.EntityFrameworkCore;

namespace MathRecap.Api.Tests;

// Who needs a session, and how sessions end.
public sealed class SessionTests(MathRecapFactory factory) : IClassFixture<MathRecapFactory>
{
    [Theory]
    [InlineData("GET", "/api/auth/me")]
    [InlineData("POST", "/api/auth/sign-out")]
    [InlineData("POST", "/api/worksheets")]
    [InlineData("POST", "/api/usefulness")]
    public async Task ApiCallsWithoutASessionGetJson401(string method, string path)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), path) { Content = method == "POST" ? JsonContent.Create(new { }) : null };

        var response = await factory.CreateBrowserClient().SendAsync(request, TestContext.Current.CancellationToken);

        var error = await ApiAssert.ErrorAsync(response, HttpStatusCode.Unauthorized, "unauthorized");
        Assert.Equal("Ehhez be kell jelentkezned.", error["message"]!.GetValue<string>());
        Assert.Null(response.Headers.Location);
        Assert.Empty(factory.OpenRouter.Requests);
    }

    [Theory]
    [InlineData("/", "%2F")]
    [InlineData("/index.html", "%2Findex.html")]
    [InlineData("/worksheet.html?skill=ALG-08", "%2Fworksheet.html%3Fskill%3DALG-08")]
    [InlineData("/review.html", "%2Freview.html")]
    [InlineData("/Worksheet.HTML", "%2FWorksheet.HTML")]
    [InlineData("/illustrations/", "%2Fillustrations%2F")]
    public async Task PagesRedirectToSignInWithoutASession(string path, string returnUrl)
    {
        var response = await factory.CreateBrowserClient().GetAsync(path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
        Assert.Equal($"/sign-in.html?returnUrl={returnUrl}", response.Headers.Location?.OriginalString);
    }

    [Theory]
    [InlineData("/sign-in.html")]
    [InlineData("/sign-in-link.html")]
    [InlineData("/dev/outbox.html")]
    [InlineData("/theme.css")]
    [InlineData("/tree.js")]
    [InlineData("/sign-in.js")]
    [InlineData("/data/curriculum.json")]
    [InlineData("/illustrations/registry.js")]
    [InlineData("/vendor/katex/katex.min.js")]
    public async Task SignInPagesAndStaticAssetsArePublic(string path)
    {
        var response = await factory.CreateBrowserClient().GetAsync(path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData("/")]
    [InlineData("/worksheet.html?skill=ALG-08")]
    [InlineData("/review.html")]
    public async Task PagesAreServedWithASession(string path)
    {
        var client = await factory.CreateSignedInClientAsync();

        var response = await client.GetAsync(path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task SessionCookieIsHttpOnlyLaxAndKeptForThirtyDays()
    {
        var response = await factory.CreateBrowserClient().PostAsJsonAsync("/api/dev/sign-in", new { email = MathRecapFactory.DevAccountEmail }, TestContext.Current.CancellationToken);

        var cookie = Assert.Single(response.Headers.GetValues("Set-Cookie"));
        Assert.StartsWith("MathRecap.Session=", cookie);
        Assert.Contains("httponly", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=lax", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("; secure", cookie, StringComparison.OrdinalIgnoreCase);
        var expires = DateTimeOffset.Parse(cookie.Split("expires=", StringSplitOptions.None)[1].Split(';')[0], System.Globalization.CultureInfo.InvariantCulture);
        Assert.InRange(expires - DateTimeOffset.UtcNow, TimeSpan.FromDays(29.9), TimeSpan.FromDays(30.1));
    }

    [Fact]
    public async Task SessionCookieIsSecureOverHttps()
    {
        using var client = factory.CreateDefaultClient(new Uri("https://localhost"));
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/dev/sign-in") { Content = JsonContent.Create(new { email = MathRecapFactory.DevAccountEmail }) };
        request.Headers.Add("Origin", "https://localhost");

        var response = await client.SendAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("; secure", Assert.Single(response.Headers.GetValues("Set-Cookie")), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task SigningOutEndsOnlyThisSession()
    {
        var email = SignInSteps.NewEmail();
        var thisDevice = factory.CreateBrowserClient();
        var otherDevice = factory.CreateBrowserClient();
        await factory.SignInWithCodeAsync(thisDevice, email);
        await factory.SignInWithCodeAsync(otherDevice, email);

        var response = await thisDevice.PostAsync("/api/auth/sign-out", null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await thisDevice.MeAsync()).StatusCode);
        Assert.Equal(HttpStatusCode.Redirect, (await thisDevice.GetAsync("/", TestContext.Current.CancellationToken)).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await otherDevice.MeAsync()).StatusCode);
    }

    [Fact]
    public async Task ChangingTheSecurityStampEndsEverySession()
    {
        var email = SignInSteps.NewEmail();
        var first = factory.CreateBrowserClient();
        var second = factory.CreateBrowserClient();
        await factory.SignInWithCodeAsync(first, email);
        await factory.SignInWithCodeAsync(second, email);

        await using (var db = TestDatabase.CreateContext())
        {
            await db.Users.Where(user => user.NormalizedEmail == email)
                .ExecuteUpdateAsync(setters => setters.SetProperty(user => user.SecurityStamp, Guid.NewGuid()), TestContext.Current.CancellationToken);
        }

        Assert.Equal(HttpStatusCode.Unauthorized, (await first.MeAsync()).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await second.MeAsync()).StatusCode);
        Assert.Equal(HttpStatusCode.Redirect, (await second.GetAsync("/", TestContext.Current.CancellationToken)).StatusCode);
        await factory.SignInWithCodeAsync(first, email);
        Assert.Equal(HttpStatusCode.OK, (await first.MeAsync()).StatusCode);
    }
}
