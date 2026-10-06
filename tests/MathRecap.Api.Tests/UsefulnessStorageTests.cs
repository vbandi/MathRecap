using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using MathRecap.Api.Tests.TestHost;

namespace MathRecap.Api.Tests;

// POST /api/usefulness stores the text per learner and skill, and asks the model again only when the
// profile changed or the learner asks for a new text. GET /api/usefulness/{skillId} reads the stored text
// and never asks the model.
public sealed class UsefulnessStorageTests : IAsyncDisposable
{
    private const string SkillId = "ALG-08";
    private readonly MathRecapFactory factory = new();

    public ValueTask DisposeAsync() => factory.DisposeAsync();

    [Fact]
    public async Task AStoredTextIsServedWithoutAskingTheModelAgain()
    {
        var client = await factory.CreateLearnerClientAsync();
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "Első szöveg." });

        var first = await UsefulnessAsync(client);
        var second = await UsefulnessAsync(client);

        Assert.Equal("Első szöveg.", first);
        Assert.Equal("Első szöveg.", second);
        Assert.Single(factory.OpenRouter.Requests);
    }

    [Fact]
    public async Task AProfileChangeMakesTheStoredTextStale()
    {
        var client = await factory.CreateLearnerClientAsync();
        await SetProfileAsync(client, "zene");
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "Zenés szöveg." });
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "Sportos szöveg." });
        await UsefulnessAsync(client);

        await SetProfileAsync(client, "zene");
        var unchanged = await UsefulnessAsync(client);
        await SetProfileAsync(client, "sport");
        var changed = await UsefulnessAsync(client);
        var again = await UsefulnessAsync(client);

        Assert.Equal("Zenés szöveg.", unchanged);
        Assert.Equal("Sportos szöveg.", changed);
        Assert.Equal("Sportos szöveg.", again);
        Assert.Equal(2, factory.OpenRouter.Requests.Count);
        Assert.Contains("sport", factory.OpenRouter.Requests[1].Body["messages"]![1]!["content"]!.GetValue<string>());
    }

    [Fact]
    public async Task RefreshAsksForANewTextAndStoresIt()
    {
        var client = await factory.CreateLearnerClientAsync();
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "Régi szöveg." });
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "Új szöveg." });
        await UsefulnessAsync(client);

        var refreshed = await UsefulnessAsync(client, refresh: true);
        var stored = await UsefulnessAsync(client);

        Assert.Equal("Új szöveg.", refreshed);
        Assert.Equal("Új szöveg.", stored);
        Assert.Equal(2, factory.OpenRouter.Requests.Count);
    }

    [Fact]
    public async Task AFailedRefreshKeepsTheStoredText()
    {
        var client = await factory.CreateLearnerClientAsync();
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "Megmaradó szöveg." });
        factory.OpenRouter.RespondWithStatus(HttpStatusCode.InternalServerError);
        await UsefulnessAsync(client);

        var failed = await client.PostAsJsonAsync("/api/usefulness", new { skillId = SkillId, refresh = true }, TestContext.Current.CancellationToken);
        var stored = await UsefulnessAsync(client);

        await ApiAssert.ErrorAsync(failed, HttpStatusCode.BadGateway, "upstream_error");
        Assert.Equal("Megmaradó szöveg.", stored);
        Assert.Equal(2, factory.OpenRouter.Requests.Count);
    }

    [Fact]
    public async Task TextsAreStoredPerLearnerAndSkill()
    {
        var first = await factory.CreateLearnerClientAsync();
        var second = await factory.CreateLearnerClientAsync();
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "Az első tanulóé." });
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "A második tanulóé." });
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "Másik készség." });

        var firstText = await UsefulnessAsync(first);
        var secondText = await UsefulnessAsync(second);
        var otherSkill = await UsefulnessAsync(first, skillId: "GEO-01");

        Assert.Equal("Az első tanulóé.", firstText);
        Assert.Equal("A második tanulóé.", secondText);
        Assert.Equal("Másik készség.", otherSkill);
        Assert.Equal("Az első tanulóé.", await UsefulnessAsync(first));
        Assert.Equal("A második tanulóé.", await UsefulnessAsync(second));
        Assert.Equal(3, factory.OpenRouter.Requests.Count);
    }

    [Fact]
    public async Task TheStoredTextIsReadWithoutAskingTheModel()
    {
        var client = await factory.CreateLearnerClientAsync();
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "Tárolt szöveg." });
        var before = await StoredAsync(client);
        await UsefulnessAsync(client);

        var stored = await StoredAsync(client);
        var otherSkill = await StoredAsync(client, "GEO-01");

        Assert.Null(before);
        Assert.Equal("Tárolt szöveg.", stored);
        Assert.Null(otherSkill);
        Assert.Single(factory.OpenRouter.Requests);
    }

    [Fact]
    public async Task AnotherLearnersTextIsNotRead()
    {
        var first = await factory.CreateLearnerClientAsync();
        var second = await factory.CreateLearnerClientAsync();
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "Az első tanulóé." });
        await UsefulnessAsync(first);

        Assert.Null(await StoredAsync(second));
        Assert.Equal("Az első tanulóé.", await StoredAsync(first));
        Assert.Single(factory.OpenRouter.Requests);
    }

    [Fact]
    public async Task AStaleTextIsNotRead()
    {
        var client = await factory.CreateLearnerClientAsync();
        await SetProfileAsync(client, "zene");
        factory.OpenRouter.RespondWithJson(new JsonObject { ["text"] = "Zenés szöveg." });
        await UsefulnessAsync(client);

        await SetProfileAsync(client, "sport");
        var stale = await StoredAsync(client);
        await SetProfileAsync(client, "zene");
        var current = await StoredAsync(client);

        Assert.Null(stale);
        Assert.Equal("Zenés szöveg.", current);
        Assert.Single(factory.OpenRouter.Requests);
    }

    [Fact]
    public async Task ReadingAnUnknownSkillIsRejected()
    {
        var client = await factory.CreateLearnerClientAsync();

        var response = await client.GetAsync("/api/usefulness/GEO-99", TestContext.Current.CancellationToken);

        var error = await ApiAssert.ErrorAsync(response, HttpStatusCode.BadRequest, "invalid_request");
        Assert.Equal("skillId", error["details"]![0]!["path"]!.GetValue<string>());
        Assert.Empty(factory.OpenRouter.Requests);
    }

    // The text of GET /api/usefulness/{skillId}, or null.
    private static async Task<string?> StoredAsync(HttpClient client, string skillId = SkillId)
    {
        var response = await client.GetAsync($"/api/usefulness/{skillId}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = (await response.Content.ReadFromJsonAsync<JsonNode>(TestContext.Current.CancellationToken))!.AsObject();
        Assert.True(body.ContainsKey("usefulness"));
        return body["usefulness"]?["text"]!.GetValue<string>();
    }

    private static async Task<string> UsefulnessAsync(HttpClient client, bool refresh = false, string skillId = SkillId)
    {
        var response = await client.PostAsJsonAsync("/api/usefulness", new { skillId, refresh }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonNode>(TestContext.Current.CancellationToken))!["usefulness"]!["text"]!.GetValue<string>();
    }

    private static async Task SetProfileAsync(HttpClient client, string interests) =>
        (await client.PutAsJsonAsync("/api/me/profile", new { interests }, TestContext.Current.CancellationToken)).EnsureSuccessStatusCode();
}
