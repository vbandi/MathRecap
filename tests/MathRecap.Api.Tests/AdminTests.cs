using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Nodes;
using MathRecap.Api.Tests.TestHost;
using Microsoft.EntityFrameworkCore;

namespace MathRecap.Api.Tests;

// Admins (Admin:Emails; admin@mathrecap.local in Development) review the illustrations on review.html.
public sealed class AdminTests(MathRecapFactory factory) : IClassFixture<MathRecapFactory>
{
    private const string AdminEmail = "admin@mathrecap.local";

    [Fact]
    public async Task MeTellsWhoIsAnAdmin()
    {
        var admin = await factory.CreateSignedInClientAsync(AdminEmail);
        var learner = await factory.CreateSignedInClientAsync();

        Assert.True((await MeAsync(admin))["isAdmin"]!.GetValue<bool>());
        Assert.False((await MeAsync(learner))["isAdmin"]!.GetValue<bool>());
    }

    [Fact]
    public async Task AdminAddressesAreMatchedLikeSignInAddresses()
    {
        var email = SignInSteps.NewEmail();
        await using var configured = new MathRecapFactory { Settings = new Dictionary<string, string?> { ["Admin:Emails:0"] = $" {email.ToUpperInvariant()} " } };

        var client = await configured.CreateLearnerClientAsync(email);

        Assert.True((await MeAsync(client))["isAdmin"]!.GetValue<bool>());
    }

    [Fact]
    public async Task OthersGet403FromTheReviewApiAndChangeNothing()
    {
        var learner = await factory.CreateSignedInClientAsync();

        var read = await learner.GetAsync("/api/admin/illustration-reviews", TestContext.Current.CancellationToken);
        var write = await learner.PutAsJsonAsync("/api/admin/illustration-reviews/GEO-13", new { status = "ok", note = "" }, TestContext.Current.CancellationToken);

        var error = await ApiAssert.ErrorAsync(read, HttpStatusCode.Forbidden, "forbidden");
        Assert.Equal("Ehhez nincs jogosultságod.", error["message"]!.GetValue<string>());
        await ApiAssert.ErrorAsync(write, HttpStatusCode.Forbidden, "forbidden");
        await using var db = TestDatabase.CreateContext();
        Assert.False(await db.IllustrationReviews.AnyAsync(review => review.SkillId == "GEO-13", TestContext.Current.CancellationToken));
    }

    [Theory]
    [InlineData("/review.html")]
    [InlineData("/REVIEW.html")]
    public async Task OthersCannotOpenTheReviewPage(string path)
    {
        var learner = await factory.CreateSignedInClientAsync();

        var response = await learner.GetAsync(path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        var page = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("Ezt az oldalt csak az adminisztrátorok nyithatják meg.", page);
        Assert.DoesNotContain("review.js", page);
    }

    [Fact]
    public async Task AdminsOpenTheReviewPage()
    {
        var admin = await factory.CreateSignedInClientAsync(AdminEmail);

        var response = await admin.GetAsync("/review.html", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("review.js", await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task AdminsShareTheReviews()
    {
        var secondAdminEmail = SignInSteps.NewEmail();
        await using var admins = new MathRecapFactory { Settings = new Dictionary<string, string?> { ["Admin:Emails:1"] = secondAdminEmail } };
        var first = await admins.CreateSignedInClientAsync(AdminEmail);
        var second = await admins.CreateLearnerClientAsync(secondAdminEmail);

        var saved = await first.PutAsJsonAsync("/api/admin/illustration-reviews/GEO-11", new { status = "fix", note = "  A deltoid definíciója kérdéses. " }, TestContext.Current.CancellationToken);
        var seenBySecond = await ReviewsAsync(second);
        var changed = await second.PutAsJsonAsync("/api/admin/illustration-reviews/GEO-11", new { status = "ok", note = "Megbeszéltük, maradhat." }, TestContext.Current.CancellationToken);
        var seenByFirst = await ReviewsAsync(first);

        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var savedReview = (await saved.Content.ReadFromJsonAsync<JsonNode>(TestContext.Current.CancellationToken))!;
        Assert.Equal("fix", savedReview["status"]!.GetValue<string>());
        Assert.Equal("A deltoid definíciója kérdéses.", savedReview["note"]!.GetValue<string>());
        Assert.Equal(AdminEmail, savedReview["updatedBy"]!.GetValue<string>());
        Assert.True(JsonNode.DeepEquals(savedReview, seenBySecond["GEO-11"]));
        Assert.Equal(HttpStatusCode.OK, changed.StatusCode);
        Assert.Equal("ok", seenByFirst["GEO-11"]!["status"]!.GetValue<string>());
        Assert.Equal("Megbeszéltük, maradhat.", seenByFirst["GEO-11"]!["note"]!.GetValue<string>());
        Assert.Equal(secondAdminEmail, seenByFirst["GEO-11"]!["updatedBy"]!.GetValue<string>());
        Assert.True(seenByFirst["GEO-11"]!["updatedAt"]!.GetValue<DateTimeOffset>() >= savedReview["updatedAt"]!.GetValue<DateTimeOffset>());
    }

    [Theory]
    [InlineData("GEO-99", """{"status":"ok","note":""}""", "skillId")]
    [InlineData("GEO-12", """{"status":"done","note":""}""", "status")]
    [InlineData("GEO-12", """{"status":"ok"}""", "note")]
    [InlineData("GEO-12", """{"status":"ok","note":"","reviewer":"x"}""", "")]
    public async Task InvalidReviewsAreRejected(string skillId, string body, string issuePath)
    {
        var admin = await factory.CreateSignedInClientAsync(AdminEmail);

        var response = await admin.PutAsync($"/api/admin/illustration-reviews/{skillId}", new StringContent(body, Encoding.UTF8, "application/json"), TestContext.Current.CancellationToken);

        var error = await ApiAssert.ErrorAsync(response, HttpStatusCode.BadRequest, "invalid_request");
        Assert.Equal(issuePath, error["details"]![0]!["path"]!.GetValue<string>());
        Assert.False((await ReviewsAsync(admin)).ContainsKey("GEO-12"));
    }

    private static async Task<JsonNode> MeAsync(HttpClient client) =>
        (await (await client.MeAsync()).Content.ReadFromJsonAsync<JsonNode>(TestContext.Current.CancellationToken))!;

    private static async Task<JsonObject> ReviewsAsync(HttpClient client) =>
        (await client.GetFromJsonAsync<JsonNode>("/api/admin/illustration-reviews", TestContext.Current.CancellationToken))!["reviews"]!.AsObject();
}
