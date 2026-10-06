using System.Buffers.Text;
using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using MathRecap.Api.Accounts;
using MathRecap.Api.Tests.TestHost;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace MathRecap.Api.Tests;

// Signing up and signing in with an emailed code or link.
public sealed class SignInTests(MathRecapFactory factory) : IClassFixture<MathRecapFactory>
{
    [Fact]
    public async Task NewLearnerSignsUpWithTheEmailedCode()
    {
        var entered = $"New.Learner-{Guid.NewGuid():N}@Example.Test";
        var client = factory.CreateBrowserClient();

        var request = await client.RequestSignInAsync($"  {entered} ");

        Assert.Equal(HttpStatusCode.NoContent, request.StatusCode);
        var email = factory.LatestEmailTo(entered);
        var code = SignInSteps.CodeOf(email);
        Assert.Equal($"MathRecap belépési kód: {code}", email.Subject);
        Assert.Contains($"A MathRecap belépési kódod: {code}", email.Body);
        Assert.Contains($"http://localhost:3000/sign-in-link.html#token={SignInSteps.LinkTokenOf(email)}", email.Body);
        Assert.Contains("10 percig érvényes", email.Body);
        Assert.Contains("Ha nem te kérted, nyugodtan hagyd figyelmen kívül.", email.Body);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.MeAsync()).StatusCode);

        var verify = await client.VerifyCodeAsync(entered.ToUpperInvariant(), code);

        Assert.Equal(HttpStatusCode.OK, verify.StatusCode);
        Assert.Equal(entered, (await verify.Content.ReadFromJsonAsync<AccountResponse>(TestContext.Current.CancellationToken))!.Email);
        Assert.Equal(entered, (await (await client.MeAsync()).Content.ReadFromJsonAsync<AccountResponse>(TestContext.Current.CancellationToken))!.Email);
        await using var db = TestDatabase.CreateContext();
        var user = await db.Users.SingleAsync(user => user.NormalizedEmail == entered.ToLowerInvariant(), TestContext.Current.CancellationToken);
        Assert.Equal(entered, user.Email);
        Assert.NotNull(user.LastSignInAt);
    }

    [Fact]
    public async Task ReturningLearnerSignsInToTheSameAccount()
    {
        var email = SignInSteps.NewEmail();
        await factory.SignInWithCodeAsync(factory.CreateBrowserClient(), email);
        var laterClient = factory.CreateBrowserClient();

        await factory.SignInWithCodeAsync(laterClient, email.ToUpperInvariant());

        Assert.Equal(email, (await (await laterClient.MeAsync()).Content.ReadFromJsonAsync<AccountResponse>(TestContext.Current.CancellationToken))!.Email);
        await using var db = TestDatabase.CreateContext();
        Assert.Equal(1, await db.Users.CountAsync(user => user.NormalizedEmail == email, TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task SignInRequestsAnswerTheSameForNewAndExistingAddresses()
    {
        var existing = SignInSteps.NewEmail();
        await factory.SignInWithCodeAsync(factory.CreateBrowserClient(), existing);
        var client = factory.CreateBrowserClient();

        var forExisting = await client.RequestSignInAsync(existing);
        var forNew = await client.RequestSignInAsync(SignInSteps.NewEmail());

        Assert.Equal(HttpStatusCode.NoContent, forExisting.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, forNew.StatusCode);
        Assert.Equal(
            await forExisting.Content.ReadAsStringAsync(TestContext.Current.CancellationToken),
            await forNew.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-an-email")]
    [InlineData("learner@localhost")]
    [InlineData("two words@example.test")]
    [InlineData("learner@example.test\nBcc: other@example.test")]
    [InlineData("<script>@example.test")]
    public async Task ImplausibleAddressesAreRejected(string email)
    {
        var response = await factory.CreateBrowserClient().RequestSignInAsync(email);

        var error = await ApiAssert.ErrorAsync(response, HttpStatusCode.BadRequest, "invalid_email");
        Assert.Equal("Adj meg egy érvényes e-mail-címet.", error["message"]!.GetValue<string>());
    }

    [Fact]
    public async Task OverlongAddressesAreRejected()
    {
        var response = await factory.CreateBrowserClient().RequestSignInAsync($"{new string('a', 64)}@{new string('b', 63)}.{new string('c', 63)}.{new string('d', 60)}.test");

        await ApiAssert.ErrorAsync(response, HttpStatusCode.BadRequest, "invalid_email");
    }

    [Fact]
    public async Task TheLinkSignsInOnce()
    {
        var email = SignInSteps.NewEmail();
        var client = factory.CreateBrowserClient();
        await client.RequestSignInAsync(email);
        var token = SignInSteps.LinkTokenOf(factory.LatestEmailTo(email));

        var first = await client.VerifyLinkAsync(token);

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(email, (await first.Content.ReadFromJsonAsync<AccountResponse>(TestContext.Current.CancellationToken))!.Email);
        Assert.Equal(HttpStatusCode.OK, (await client.MeAsync()).StatusCode);
        var other = factory.CreateBrowserClient();
        var error = await ApiAssert.ErrorAsync(await other.VerifyLinkAsync(token), HttpStatusCode.BadRequest, "invalid_link");
        Assert.Equal("Ez a belépési link érvénytelen, lejárt vagy már felhasználták. Kérj új kódot.", error["message"]!.GetValue<string>());
        Assert.Equal(HttpStatusCode.Unauthorized, (await other.MeAsync()).StatusCode);
        await ApiAssert.ErrorAsync(await other.VerifyCodeAsync(email, SignInSteps.CodeOf(factory.LatestEmailTo(email))), HttpStatusCode.BadRequest, "code_expired");
    }

    [Fact]
    public async Task OpeningTheLinkPageDoesNotSignIn()
    {
        var email = SignInSteps.NewEmail();
        var client = factory.CreateBrowserClient();
        await client.RequestSignInAsync(email);
        var token = SignInSteps.LinkTokenOf(factory.LatestEmailTo(email));

        // A browser leaves the #token fragment out of the request; a link scanner may send anything.
        var page = await client.GetAsync("/sign-in-link.html", TestContext.Current.CancellationToken);
        var scanned = await client.GetAsync($"/sign-in-link.html?token={token}", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, page.StatusCode);
        Assert.Equal(HttpStatusCode.OK, scanned.StatusCode);
        Assert.Contains("Belépés", await page.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.MeAsync()).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.VerifyLinkAsync(token)).StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-a-token")]
    [InlineData("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")]
    public async Task UnknownLinksAreRejected(string token)
    {
        var response = await factory.CreateBrowserClient().VerifyLinkAsync(token);

        await ApiAssert.ErrorAsync(response, HttpStatusCode.BadRequest, "invalid_link");
    }

    [Fact]
    public async Task TheFifthWrongCodeLocksTheChallenge()
    {
        var email = SignInSteps.NewEmail();
        var client = factory.CreateBrowserClient();
        await client.RequestSignInAsync(email);
        var message = factory.LatestEmailTo(email);
        var code = SignInSteps.CodeOf(message);
        var wrong = OtherCodeThan(code);

        for (var remaining = 4; remaining > 0; remaining--)
        {
            var error = await ApiAssert.ErrorAsync(await client.VerifyCodeAsync(email, wrong), HttpStatusCode.BadRequest, "wrong_code");
            Assert.Equal($"Hibás kód. Még {remaining} próbálkozásod van.", error["message"]!.GetValue<string>());
        }
        var locked = await ApiAssert.ErrorAsync(await client.VerifyCodeAsync(email, wrong), HttpStatusCode.BadRequest, "code_locked");
        Assert.Equal("Túl sok hibás próbálkozás. Kérj új kódot.", locked["message"]!.GetValue<string>());

        await ApiAssert.ErrorAsync(await client.VerifyCodeAsync(email, code), HttpStatusCode.BadRequest, "code_locked");
        await ApiAssert.ErrorAsync(await client.VerifyLinkAsync(SignInSteps.LinkTokenOf(message)), HttpStatusCode.BadRequest, "invalid_link");
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.MeAsync()).StatusCode);

        await factory.SignInWithCodeAsync(client, email);
        Assert.Equal(HttpStatusCode.OK, (await client.MeAsync()).StatusCode);
    }

    [Fact]
    public async Task TheRightCodeStillWorksAfterFourWrongOnes()
    {
        var email = SignInSteps.NewEmail();
        var client = factory.CreateBrowserClient();
        await client.RequestSignInAsync(email);
        var code = SignInSteps.CodeOf(factory.LatestEmailTo(email));
        var wrong = OtherCodeThan(code);
        for (var attempt = 0; attempt < 4; attempt++) await client.VerifyCodeAsync(email, wrong);

        var response = await client.VerifyCodeAsync(email, code);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await using var db = TestDatabase.CreateContext();
        Assert.Equal(4, (await db.SignInChallenges.SingleAsync(challenge => challenge.NormalizedEmail == email, TestContext.Current.CancellationToken)).FailedAttempts);
    }

    [Theory]
    [InlineData("12345")]
    [InlineData("1234567")]
    [InlineData("12345a")]
    [InlineData(" ")]
    public async Task MalformedCodesAreNotCountedAsAttempts(string malformed)
    {
        var email = SignInSteps.NewEmail();
        var client = factory.CreateBrowserClient();
        await client.RequestSignInAsync(email);

        for (var attempt = 0; attempt < SignInChallenges.MaxFailedAttempts; attempt++)
        {
            var error = await ApiAssert.ErrorAsync(await client.VerifyCodeAsync(email, malformed), HttpStatusCode.BadRequest, "invalid_code");
            Assert.Equal("A belépési kód 6 számjegyből áll.", error["message"]!.GetValue<string>());
        }

        Assert.Equal(HttpStatusCode.OK, (await client.VerifyCodeAsync(email, SignInSteps.CodeOf(factory.LatestEmailTo(email)))).StatusCode);
    }

    [Fact]
    public async Task CodesAndLinksExpireAfterTenMinutes()
    {
        var clock = new FakeTimeProvider(DateTimeOffset.UtcNow);
        await using var timed = new MathRecapFactory { Clock = clock };
        var client = timed.CreateBrowserClient();
        var onTime = SignInSteps.NewEmail();
        var late = SignInSteps.NewEmail();
        await client.RequestSignInAsync(onTime);
        await client.RequestSignInAsync(late);

        clock.Advance(TimeSpan.FromMinutes(10) - TimeSpan.FromSeconds(1));
        Assert.Equal(HttpStatusCode.OK, (await client.VerifyCodeAsync(onTime, SignInSteps.CodeOf(timed.LatestEmailTo(onTime)))).StatusCode);
        clock.Advance(TimeSpan.FromSeconds(1));

        var code = await ApiAssert.ErrorAsync(await client.VerifyCodeAsync(late, SignInSteps.CodeOf(timed.LatestEmailTo(late))), HttpStatusCode.BadRequest, "code_expired");
        Assert.Equal("A kód lejárt vagy már nem érvényes. Kérj új kódot.", code["message"]!.GetValue<string>());
        await ApiAssert.ErrorAsync(await client.VerifyLinkAsync(SignInSteps.LinkTokenOf(timed.LatestEmailTo(late))), HttpStatusCode.BadRequest, "invalid_link");
    }

    [Fact]
    public async Task ANewerRequestInvalidatesTheOlderCodeAndLink()
    {
        var email = SignInSteps.NewEmail();
        var client = factory.CreateBrowserClient();
        await client.RequestSignInAsync(email);
        var older = factory.LatestEmailTo(email);
        await client.RequestSignInAsync(email);
        var newer = factory.LatestEmailTo(email);
        Assert.SkipWhen(SignInSteps.CodeOf(older) == SignInSteps.CodeOf(newer), "The two random codes happen to be equal.");

        await ApiAssert.ErrorAsync(await client.VerifyCodeAsync(email, SignInSteps.CodeOf(older)), HttpStatusCode.BadRequest, "wrong_code");
        await ApiAssert.ErrorAsync(await client.VerifyLinkAsync(SignInSteps.LinkTokenOf(older)), HttpStatusCode.BadRequest, "invalid_link");

        Assert.Equal(HttpStatusCode.OK, (await client.VerifyCodeAsync(email, SignInSteps.CodeOf(newer))).StatusCode);
    }

    [Fact]
    public async Task VerifyingWithoutARequestedCodeFails()
    {
        var response = await factory.CreateBrowserClient().VerifyCodeAsync(SignInSteps.NewEmail(), "123456");

        await ApiAssert.ErrorAsync(response, HttpStatusCode.BadRequest, "code_expired");
    }

    [Fact]
    public async Task CodesAndLinkTokensAreStoredOnlyAsHashes()
    {
        var email = SignInSteps.NewEmail();
        var client = factory.CreateBrowserClient();
        await client.RequestSignInAsync(email);
        var message = factory.LatestEmailTo(email);
        var code = SignInSteps.CodeOf(message);
        var token = SignInSteps.LinkTokenOf(message);
        var plainValues = new[] { code, token, Convert.ToHexString(Encoding.UTF8.GetBytes(code)), Convert.ToHexString(Base64Url.DecodeFromChars(token)) };

        var whileOpen = await StoredTextAsync(email);
        await client.VerifyLinkAsync(token);
        var afterUse = await StoredTextAsync(email);

        foreach (var stored in new[] { whileOpen, afterUse })
        {
            Assert.Contains(email, stored);
            Assert.All(plainValues, plain => Assert.DoesNotContain(plain, stored, StringComparison.OrdinalIgnoreCase));
        }
        await using var db = TestDatabase.CreateContext();
        var challenge = await db.SignInChallenges.SingleAsync(challenge => challenge.NormalizedEmail == email, TestContext.Current.CancellationToken);
        Assert.Equal(SHA256.HashData(Encoding.UTF8.GetBytes(token)), challenge.LinkTokenHash);
        Assert.Equal(32, challenge.CodeHash.Length);
        Assert.NotEqual(SHA256.HashData(Encoding.UTF8.GetBytes(code)), challenge.CodeHash);
    }

    [Fact]
    public async Task LogsCarryNoEmailAddressesCodesOrLinkTokens()
    {
        await using var logged = new MathRecapFactory();
        var email = $"Private.Learner-{Guid.NewGuid():N}@Example.Test";
        var client = logged.CreateBrowserClient();
        await client.RequestSignInAsync(email);
        var first = logged.LatestEmailTo(email);
        await client.VerifyCodeAsync(email, OtherCodeThan(SignInSteps.CodeOf(first)));
        await client.VerifyCodeAsync(email, SignInSteps.CodeOf(first));
        await client.PostAsync("/api/auth/sign-out", null, TestContext.Current.CancellationToken);
        await client.RequestSignInAsync(email);
        var second = logged.LatestEmailTo(email);
        await client.VerifyLinkAsync(SignInSteps.LinkTokenOf(second));
        await client.VerifyLinkAsync(SignInSteps.LinkTokenOf(second));
        await client.MeAsync();
        await (await logged.CreateSignedInClientAsync()).MeAsync();

        await using var db = TestDatabase.CreateContext();
        var userId = (await db.Users.SingleAsync(user => user.NormalizedEmail == email.ToLowerInvariant(), TestContext.Current.CancellationToken)).Id;
        var entries = logged.Logs.Entries.Select(entry => $"{entry.Message} {entry.Exception}").ToList();
        Assert.Contains(entries, entry => entry.Contains($"User {userId} signed in.", StringComparison.Ordinal));
        string[] secrets = [email, email.ToLowerInvariant(), MathRecapFactory.DevAccountEmail, SignInSteps.CodeOf(first), SignInSteps.LinkTokenOf(first), SignInSteps.CodeOf(second), SignInSteps.LinkTokenOf(second)];
        foreach (var secret in secrets)
        {
            Assert.DoesNotContain(entries, entry => entry.Contains(secret, StringComparison.OrdinalIgnoreCase));
        }
    }

    private static string OtherCodeThan(string code) =>
        ((int.Parse(code, CultureInfo.InvariantCulture) + 1) % 1_000_000).ToString("D6", CultureInfo.InvariantCulture);

    // Every column of the email's challenge and user rows, read with plain SQL: text as it is, binary
    // values as hex and as UTF-8 text.
    private static async Task<string> StoredTextAsync(string email)
    {
        await using var connection = new SqlConnection(TestDatabase.ConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        var text = new StringBuilder();
        foreach (var table in new[] { "SignInChallenges", "Users" })
        {
            await using var command = new SqlCommand($"SELECT * FROM [{table}] WHERE NormalizedEmail = @email", connection);
            command.Parameters.AddWithValue("@email", email);
            await using var reader = await command.ExecuteReaderAsync(TestContext.Current.CancellationToken);
            while (await reader.ReadAsync(TestContext.Current.CancellationToken))
            {
                for (var column = 0; column < reader.FieldCount; column++)
                {
                    text.AppendLine(reader.GetValue(column) is byte[] bytes ? $"{Convert.ToHexString(bytes)} {Encoding.UTF8.GetString(bytes)}" : reader.GetValue(column).ToString());
                }
            }
        }
        return text.ToString();
    }

}
