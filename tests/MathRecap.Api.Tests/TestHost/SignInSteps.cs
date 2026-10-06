using System.Net.Http.Json;
using System.Text.RegularExpressions;
using MathRecap.Api.Dev;

namespace MathRecap.Api.Tests.TestHost;

// The steps of the email sign-in, as the sign-in page takes them. Codes and links are read from the dev outbox.
public static partial class SignInSteps
{
    public static string NewEmail() => $"learner-{Guid.NewGuid():N}@example.test";

    public static Task<HttpResponseMessage> RequestSignInAsync(this HttpClient client, string email) =>
        client.PostAsJsonAsync("/api/auth/sign-in", new { email }, TestContext.Current.CancellationToken);

    public static Task<HttpResponseMessage> VerifyCodeAsync(this HttpClient client, string email, string code) =>
        client.PostAsJsonAsync("/api/auth/verify-code", new { email, code }, TestContext.Current.CancellationToken);

    public static Task<HttpResponseMessage> VerifyLinkAsync(this HttpClient client, string token) =>
        client.PostAsJsonAsync("/api/auth/verify-link", new { token }, TestContext.Current.CancellationToken);

    public static Task<HttpResponseMessage> MeAsync(this HttpClient client) => client.GetAsync("/api/me", TestContext.Current.CancellationToken);

    public static OutboxMessage LatestEmailTo(this MathRecapFactory factory, string email) =>
        factory.Outbox.Messages.First(message => message.To == email);

    public static string CodeOf(OutboxMessage message) => Code().Match(message.Subject).Groups[1].Value;

    public static string LinkTokenOf(OutboxMessage message) => LinkToken().Match(message.Body).Groups[1].Value;

    // A browser client signed in as a new learner of its own, so that tests sharing the database do not
    // see each other's data.
    public static async Task<HttpClient> CreateLearnerClientAsync(this MathRecapFactory factory, string? email = null)
    {
        var client = factory.CreateBrowserClient();
        await factory.SignInWithCodeAsync(client, email ?? NewEmail());
        return client;
    }

    // Requests an email and signs in with its code.
    public static async Task SignInWithCodeAsync(this MathRecapFactory factory, HttpClient client, string email)
    {
        (await client.RequestSignInAsync(email)).EnsureSuccessStatusCode();
        (await client.VerifyCodeAsync(email, CodeOf(factory.LatestEmailTo(email)))).EnsureSuccessStatusCode();
    }

    [GeneratedRegex("^MathRecap belépési kód: ([0-9]{6})$")]
    private static partial Regex Code();

    [GeneratedRegex(@"/sign-in-link\.html#token=([A-Za-z0-9_-]+)")]
    private static partial Regex LinkToken();
}
