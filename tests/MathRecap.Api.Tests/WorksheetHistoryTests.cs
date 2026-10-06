using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using MathRecap.Api.Tests.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace MathRecap.Api.Tests;

// Generated worksheets are saved per learner: listed newest first, opened and deleted.
public sealed class WorksheetHistoryTests : IAsyncDisposable
{
    private readonly FakeTimeProvider clock = new(DateTimeOffset.UtcNow);
    private readonly MathRecapFactory factory;

    public WorksheetHistoryTests() => factory = new MathRecapFactory { Clock = clock };

    public ValueTask DisposeAsync() => factory.DisposeAsync();

    [Fact]
    public async Task AGeneratedWorksheetIsSavedAndCanBeOpened()
    {
        var client = await factory.CreateLearnerClientAsync();

        var created = await GenerateAsync(client, "ALG-08", "Összevonás", "Kérek összevonást.");
        var opened = await client.GetFromJsonAsync<JsonNode>($"/api/worksheets/{Id(created)}", TestContext.Current.CancellationToken);

        Assert.Equal("ALG-08", created["skillId"]!.GetValue<string>());
        Assert.Equal("Összevonás", created["title"]!.GetValue<string>());
        Assert.Equal("Kérek összevonást.", created["request"]!.GetValue<string>());
        Assert.Equal(clock.GetUtcNow(), created["createdAt"]!.GetValue<DateTimeOffset>());
        Assert.Equal("Összevonás", created["worksheet"]!["title"]!.GetValue<string>());
        Assert.True(JsonNode.DeepEquals(created, opened));
        await using var db = TestDatabase.CreateContext();
        Assert.True(await db.Worksheets.AnyAsync(worksheet => worksheet.Id == Id(created), TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task TheListIsNewestFirstAndCanBeFilteredBySkill()
    {
        var client = await factory.CreateLearnerClientAsync();
        var oldest = await GenerateAsync(client, "ALG-08", "Első", "Első kérés");
        clock.Advance(TimeSpan.FromMinutes(1));
        var otherSkill = await GenerateAsync(client, "GEO-01", "Térelemek", "Második kérés");
        clock.Advance(TimeSpan.FromMinutes(1));
        var newest = await GenerateAsync(client, "ALG-08", "Harmadik", "Harmadik kérés");

        var forSkill = await ListAsync(client, "?skillId=ALG-08");
        var all = await ListAsync(client, "");

        Assert.Equal([Id(newest), Id(oldest)], forSkill.Select(Id));
        Assert.Equal([Id(newest), Id(otherSkill), Id(oldest)], all.Select(Id));
        Assert.True(JsonNode.DeepEquals(
            JsonNode.Parse($$"""{"id":"{{Id(newest)}}","skillId":"ALG-08","title":"Harmadik","request":"Harmadik kérés","createdAt":{{newest["createdAt"]!.ToJsonString()}}}"""),
            forSkill[0]));
    }

    [Fact]
    public async Task ADeletedWorksheetIsGone()
    {
        var client = await factory.CreateLearnerClientAsync();
        var kept = await GenerateAsync(client, "ALG-08", "Megmarad", "Kérés");
        var deleted = await GenerateAsync(client, "ALG-08", "Törlendő", "Kérés");

        var response = await client.DeleteAsync($"/api/worksheets/{Id(deleted)}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        await ApiAssert.ErrorAsync(await client.GetAsync($"/api/worksheets/{Id(deleted)}", TestContext.Current.CancellationToken), HttpStatusCode.NotFound, "worksheet_not_found");
        await ApiAssert.ErrorAsync(await client.DeleteAsync($"/api/worksheets/{Id(deleted)}", TestContext.Current.CancellationToken), HttpStatusCode.NotFound, "worksheet_not_found");
        Assert.Equal([Id(kept)], (await ListAsync(client, "?skillId=ALG-08")).Select(Id));
    }

    [Fact]
    public async Task AnotherLearnersWorksheetIsAnsweredAsMissing()
    {
        var owner = await factory.CreateLearnerClientAsync();
        var other = await factory.CreateLearnerClientAsync();
        var worksheet = await GenerateAsync(owner, "ALG-08", "Saját", "Kérés");

        var read = await other.GetAsync($"/api/worksheets/{Id(worksheet)}", TestContext.Current.CancellationToken);
        var deleted = await other.DeleteAsync($"/api/worksheets/{Id(worksheet)}", TestContext.Current.CancellationToken);
        var missing = await other.GetAsync($"/api/worksheets/{Guid.NewGuid()}", TestContext.Current.CancellationToken);

        var error = await ApiAssert.ErrorAsync(read, HttpStatusCode.NotFound, "worksheet_not_found");
        Assert.Equal("A feladatlap nem található.", error["message"]!.GetValue<string>());
        await ApiAssert.ErrorAsync(deleted, HttpStatusCode.NotFound, "worksheet_not_found");
        Assert.Equal(await missing.Content.ReadAsStringAsync(TestContext.Current.CancellationToken), await read.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Empty(await ListAsync(other, ""));
        Assert.Empty(await ListAsync(other, "?skillId=ALG-08"));
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync($"/api/worksheets/{Id(worksheet)}", TestContext.Current.CancellationToken)).StatusCode);
    }

    [Theory]
    [InlineData("?skillId=GEO-99")]
    [InlineData("?skillId=")]
    public async Task ListingAnUnknownSkillIsRejected(string query)
    {
        var client = await factory.CreateLearnerClientAsync();

        var response = await client.GetAsync($"/api/worksheets{query}", TestContext.Current.CancellationToken);

        var error = await ApiAssert.ErrorAsync(response, HttpStatusCode.BadRequest, "invalid_request");
        Assert.Equal("skillId", error["details"]![0]!["path"]!.GetValue<string>());
    }

    [Fact]
    public async Task AFailedGenerationSavesNothing()
    {
        var client = await factory.CreateLearnerClientAsync();
        factory.OpenRouter.RespondWithContent("not json");

        var response = await client.PostAsJsonAsync("/api/worksheets", new { skillId = "ALG-08", request = "Kérés" }, TestContext.Current.CancellationToken);

        await ApiAssert.ErrorAsync(response, HttpStatusCode.BadGateway, "invalid_upstream_response");
        Assert.Empty(await ListAsync(client, ""));
    }

    private async Task<JsonNode> GenerateAsync(HttpClient client, string skillId, string title, string request)
    {
        var worksheet = ModelOutputTests.Worksheet();
        worksheet["title"] = title;
        worksheet["diagnosticNotes"]![0]!["skillId"] = skillId;
        factory.OpenRouter.RespondWithJson(worksheet);
        var response = await client.PostAsJsonAsync("/api/worksheets", new { skillId, request }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonNode>(TestContext.Current.CancellationToken))!;
    }

    private static async Task<JsonArray> ListAsync(HttpClient client, string query) =>
        (await client.GetFromJsonAsync<JsonNode>($"/api/worksheets{query}", TestContext.Current.CancellationToken))!["worksheets"]!.AsArray();

    private static Guid Id(JsonNode? worksheet) => worksheet!["id"]!.GetValue<Guid>();
}
