using System.Security.Cryptography;
using System.Text;
using MathRecap.Api.Data;
using MathRecap.Api.Email;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MathRecap.Api.Accounts;

// Emails a sign-in code and link, and checks them. Signing up and signing in are the same: whoever
// proves they read the email is signed in, and the account is created at the first sign-in.
public sealed class SignInChallenges(
    AppDbContext db,
    TimeProvider time,
    IOptions<SignInOptions> signInOptions,
    IOptions<AppOptions> appOptions,
    IOptions<RateLimitOptions> rateLimitOptions,
    ILogger<SignInChallenges> logger,
    IEmailSender? emailSender = null)
{
    public const int MaxFailedAttempts = 5;
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    // Challenges are kept this long after they are created, because the per-email limit counts them.
    private static readonly TimeSpan Retention = TimeSpan.FromHours(1);

    // Answers the same whether or not the address has an account.
    public async Task SendAsync(EmailAddress email, CancellationToken cancellationToken)
    {
        if (emailSender is null) throw new ApiException(StatusCodes.Status503ServiceUnavailable, "email_unavailable", "A kiszolgáló most nem tud belépési e-mailt küldeni.");
        var now = time.GetUtcNow();
        var cutoff = now - Retention;
        await db.SignInChallenges.Where(challenge => challenge.CreatedAt < cutoff).ExecuteDeleteAsync(cancellationToken);
        if (await db.SignInChallenges.CountAsync(challenge => challenge.NormalizedEmail == email.Normalized, cancellationToken) >= rateLimitOptions.Value.SignInPerEmailPerHour)
        {
            throw RateLimits.Exceeded();
        }

        // Only the newest code and link work.
        await db.SignInChallenges
            .Where(challenge => challenge.NormalizedEmail == email.Normalized && challenge.ConsumedAt == null && challenge.ExpiresAt > now)
            .ExecuteUpdateAsync(setters => setters.SetProperty(challenge => challenge.ExpiresAt, now), cancellationToken);
        var code = SignInSecrets.NewCode();
        var token = SignInSecrets.NewLinkToken();
        var id = Guid.NewGuid();
        db.SignInChallenges.Add(new SignInChallenge
        {
            Id = id,
            Email = email.Value,
            NormalizedEmail = email.Normalized,
            CodeHash = SignInSecrets.HashCode(CodeHashKey, id, code),
            LinkTokenHash = SignInSecrets.HashLinkToken(token),
            CreatedAt = now,
            ExpiresAt = now + Lifetime,
        });
        await db.SaveChangesAsync(cancellationToken);

        await emailSender.SendAsync(SignInEmail.Create(email.Value, code, LinkFor(token)), cancellationToken);
        logger.LogInformation("Sign-in challenge {ChallengeId} sent.", id);
    }

    // Checks the code against the email's open challenge and consumes the challenge. Returns the
    // address to sign in.
    public async Task<EmailAddress> VerifyCodeAsync(EmailAddress email, string? code, CancellationToken cancellationToken)
    {
        if (!SignInSecrets.IsCode(code)) throw new ApiException(StatusCodes.Status400BadRequest, "invalid_code", "A belépési kód 6 számjegyből áll.");
        var now = time.GetUtcNow();
        var challenge = await db.SignInChallenges.AsNoTracking()
            .Where(challenge => challenge.NormalizedEmail == email.Normalized && challenge.ConsumedAt == null && challenge.ExpiresAt > now)
            .OrderByDescending(challenge => challenge.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken) ?? throw CodeExpired();

        // The attempt is counted before the comparison, so parallel guesses cannot get past the limit;
        // the right code takes it back.
        var counted = await db.SignInChallenges
            .Where(entry => entry.Id == challenge.Id && entry.FailedAttempts < MaxFailedAttempts)
            .ExecuteUpdateAsync(setters => setters.SetProperty(entry => entry.FailedAttempts, entry => entry.FailedAttempts + 1), cancellationToken);
        if (counted == 0) throw CodeLocked();
        if (!CryptographicOperations.FixedTimeEquals(challenge.CodeHash, SignInSecrets.HashCode(CodeHashKey, challenge.Id, code!)))
        {
            var remaining = MaxFailedAttempts - challenge.FailedAttempts - 1;
            logger.LogInformation("Wrong code for sign-in challenge {ChallengeId}.", challenge.Id);
            throw remaining > 0
                ? new ApiException(StatusCodes.Status400BadRequest, "wrong_code", $"Hibás kód. Még {remaining} próbálkozásod van.")
                : CodeLocked();
        }

        var consumed = await db.SignInChallenges
            .Where(entry => entry.Id == challenge.Id && entry.ConsumedAt == null && entry.ExpiresAt > now)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(entry => entry.ConsumedAt, now)
                .SetProperty(entry => entry.FailedAttempts, entry => entry.FailedAttempts - 1), cancellationToken);
        if (consumed == 0) throw CodeExpired();
        return new EmailAddress(challenge.Email, challenge.NormalizedEmail);
    }

    // Consumes the challenge of an emailed link. Returns the address to sign in.
    public async Task<EmailAddress> VerifyLinkAsync(string? token, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(token) || token.Length > 100) throw LinkInvalid();
        var hash = SignInSecrets.HashLinkToken(token);
        var now = time.GetUtcNow();
        var challenge = await db.SignInChallenges.AsNoTracking().SingleOrDefaultAsync(challenge => challenge.LinkTokenHash == hash, cancellationToken) ?? throw LinkInvalid();
        var consumed = await db.SignInChallenges
            .Where(entry => entry.Id == challenge.Id && entry.ConsumedAt == null && entry.ExpiresAt > now && entry.FailedAttempts < MaxFailedAttempts)
            .ExecuteUpdateAsync(setters => setters.SetProperty(entry => entry.ConsumedAt, now), cancellationToken);
        if (consumed == 0) throw LinkInvalid();
        return new EmailAddress(challenge.Email, challenge.NormalizedEmail);
    }

    private byte[] CodeHashKey => Encoding.UTF8.GetBytes(signInOptions.Value.CodeHashKey!);

    private Uri LinkFor(string token) => new($"{appOptions.Value.BaseUrl!.GetLeftPart(UriPartial.Path).TrimEnd('/')}/sign-in-link.html#token={token}");

    private static ApiException CodeExpired() =>
        new(StatusCodes.Status400BadRequest, "code_expired", "A kód lejárt vagy már nem érvényes. Kérj új kódot.");

    private static ApiException CodeLocked() =>
        new(StatusCodes.Status400BadRequest, "code_locked", "Túl sok hibás próbálkozás. Kérj új kódot.");

    private static ApiException LinkInvalid() =>
        new(StatusCodes.Status400BadRequest, "invalid_link", "Ez a belépési link érvénytelen, lejárt vagy már felhasználták. Kérj új kódot.");
}
