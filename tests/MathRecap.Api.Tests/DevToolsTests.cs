using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using MathRecap.Api.Dev;
using MathRecap.Api.Email;
using MathRecap.Api.Tests.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace MathRecap.Api.Tests;

public sealed class DevToolsTests(MathRecapFactory factory) : IClassFixture<MathRecapFactory>
{
    [Fact]
    public async Task DevAccountsAreListed()
    {
        var response = await factory.CreateBrowserClient().GetFromJsonAsync<JsonNode>("/api/dev/accounts", TestContext.Current.CancellationToken);

        Assert.Equal(
            """{"accounts":[{"email":"tanulo1@mathrecap.local","label":"1. tanuló"},{"email":"tanulo2@mathrecap.local","label":"2. tanuló"},{"email":"admin@mathrecap.local","label":"Admin"}]}""",
            response!.ToJsonString(new() { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
    }

    [Fact]
    public async Task DevSignInSignsInListedAccountsInstantly()
    {
        var client = factory.CreateBrowserClient();

        var response = await client.PostAsJsonAsync("/api/dev/sign-in", new { email = " TANULO2@mathrecap.local " }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("tanulo2@mathrecap.local", (await (await client.MeAsync()).Content.ReadFromJsonAsync<JsonNode>(TestContext.Current.CancellationToken))!["email"]!.GetValue<string>());
    }

    [Fact]
    public async Task ParallelFirstSignInsCreateOneUser()
    {
        var emails = Enumerable.Range(0, 3).Select(_ => SignInSteps.NewEmail()).ToList();
        await using var listed = new MathRecapFactory
        {
            Settings = emails.SelectMany((email, index) => new[]
            {
                KeyValuePair.Create($"DevAccounts:Accounts:{index + 3}:Email", (string?)email),
                KeyValuePair.Create($"DevAccounts:Accounts:{index + 3}:Label", (string?)$"Párhuzamos {index}"),
            }).ToDictionary(),
        };

        // Each address signs in for the first time from ten browsers at once.
        var responses = await Task.WhenAll(emails.SelectMany(email => Enumerable.Range(0, 10).Select(_ =>
            listed.CreateBrowserClient().PostAsJsonAsync("/api/dev/sign-in", new { email }, TestContext.Current.CancellationToken))));

        Assert.All(responses, response => Assert.Equal(HttpStatusCode.OK, response.StatusCode));
        await using var db = TestDatabase.CreateContext();
        foreach (var email in emails)
        {
            Assert.Equal(1, await db.Users.CountAsync(user => user.NormalizedEmail == email, TestContext.Current.CancellationToken));
        }
    }

    [Theory]
    [InlineData("someone@example.test")]
    [InlineData("tanulo3@mathrecap.local")]
    [InlineData("not-an-email")]
    [InlineData("")]
    public async Task DevSignInRejectsOtherAddresses(string email)
    {
        var client = factory.CreateBrowserClient();

        var response = await client.PostAsJsonAsync("/api/dev/sign-in", new { email }, TestContext.Current.CancellationToken);

        var error = await ApiAssert.ErrorAsync(response, HttpStatusCode.Forbidden, "not_dev_account");
        Assert.Equal("Ez a cím nem fejlesztői fiók.", error["message"]!.GetValue<string>());
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.MeAsync()).StatusCode);
    }

    [Fact]
    public async Task OutboxShowsTheSignInEmails()
    {
        var email = $"o'neil&co-{Guid.NewGuid():N}@example.test";
        var client = factory.CreateBrowserClient();
        await client.RequestSignInAsync(email);
        var sent = factory.LatestEmailTo(email);

        var listed = (await client.GetFromJsonAsync<JsonNode>("/api/dev/outbox", TestContext.Current.CancellationToken))!["messages"]!.AsArray()
            .Single(message => message!["to"]!.GetValue<string>() == email)!;
        var page = await client.GetAsync("/dev/outbox.html", TestContext.Current.CancellationToken);
        var html = await page.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.Equal(sent.Subject, listed["subject"]!.GetValue<string>());
        Assert.Equal(sent.Body, listed["body"]!.GetValue<string>());
        Assert.NotNull(listed["sentAt"]);
        Assert.Equal(HttpStatusCode.OK, page.StatusCode);
        Assert.Equal("text/html", page.Content.Headers.ContentType?.MediaType);
        Assert.Contains(sent.Subject, html);
        Assert.Contains("o&#x27;neil&amp;co", html);
        Assert.DoesNotContain("o'neil&co", html);
        var link = $"http://localhost:3000/sign-in-link.html#token={SignInSteps.LinkTokenOf(sent)}";
        Assert.Contains($"<a href=\"{link}\">{link}</a>", html);
    }

    [Fact]
    public async Task OutboxKeepsTheNewestMessages()
    {
        var outbox = new DevOutbox(new FakeTimeProvider());

        for (var index = 0; index <= DevOutbox.Capacity; index++) await outbox.SendAsync(new EmailMessage("a@example.test", $"{index}", ""), TestContext.Current.CancellationToken);

        Assert.Equal(DevOutbox.Capacity, outbox.Messages.Count);
        Assert.Equal($"{DevOutbox.Capacity}", outbox.Messages[0].Subject);
        Assert.Equal("1", outbox.Messages[^1].Subject);
    }

    [Fact]
    public async Task DisabledDevToolsDoNotExist()
    {
        await using var disabled = new MathRecapFactory
        {
            Settings = new Dictionary<string, string?> { ["DevOutbox:Enabled"] = "false", ["DevAccounts:Enabled"] = "false" },
        };
        var client = disabled.CreateBrowserClient();

        foreach (var path in new[] { "/api/dev/accounts", "/api/dev/outbox", "/dev/outbox.html" })
        {
            Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(path, TestContext.Current.CancellationToken)).StatusCode);
        }
        var signIn = await client.PostAsJsonAsync("/api/dev/sign-in", new { email = MathRecapFactory.DevAccountEmail }, TestContext.Current.CancellationToken);
        await ApiAssert.ErrorAsync(signIn, HttpStatusCode.NotFound, "not_found");
        // Without the outbox, Development has no email sender.
        var emailSignIn = await client.RequestSignInAsync(SignInSteps.NewEmail());
        await ApiAssert.ErrorAsync(emailSignIn, HttpStatusCode.ServiceUnavailable, "email_unavailable");
    }
}
