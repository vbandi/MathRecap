using MathRecap.Api.Email;

namespace MathRecap.Api.Accounts;

public static class SignInEmail
{
    public static EmailMessage Create(string to, string code, Uri link) => new(
        to,
        $"MathRecap belépési kód: {code}",
        $"""
        Szia!

        A MathRecap belépési kódod: {code}

        Vagy lépj be ezzel a linkkel:
        {link}

        A kód és a link {SignInChallenges.Lifetime.TotalMinutes} percig érvényes, és csak egyszer használható.

        Ha nem te kérted, nyugodtan hagyd figyelmen kívül.
        """);
}
