using System.Security.Claims;
using MathRecap.Api.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

namespace MathRecap.Api.Accounts;

// Users and their session cookies. The cookie carries the user ID and the user's security stamp;
// changing the stamp ends every session of the user.
public sealed class UserAccounts(AppDbContext db, TimeProvider time, ILogger<UserAccounts> logger)
{
    private const string SecurityStampClaim = "security_stamp";

    // Signs in the user with this address on a new session cookie, creating the user at the first sign-in.
    public async Task<User> SignInAsync(HttpContext context, EmailAddress email, CancellationToken cancellationToken)
    {
        var now = time.GetUtcNow();
        var user = await FindAsync(email, cancellationToken) ?? await TryCreateAsync(email, now, cancellationToken)
            // Another request created the user in the meantime.
            ?? await db.Users.SingleAsync(user => user.NormalizedEmail == email.Normalized, cancellationToken);
        user.LastSignInAt = now;
        await db.SaveChangesAsync(cancellationToken);

        Claim[] claims = [new(ClaimTypes.NameIdentifier, user.Id.ToString()), new(SecurityStampClaim, user.SecurityStamp.ToString())];
        await context.SignInAsync(new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)), new AuthenticationProperties { IsPersistent = true });
        logger.LogInformation("User {UserId} signed in.", user.Id);
        return user;
    }

    private Task<User?> FindAsync(EmailAddress email, CancellationToken cancellationToken) =>
        db.Users.SingleOrDefaultAsync(user => user.NormalizedEmail == email.Normalized, cancellationToken);

    // Null when the address already has a user: parallel first sign-ins (a double click, two devices)
    // race to insert it, and the unique index lets only one of them win.
    private async Task<User?> TryCreateAsync(EmailAddress email, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var user = new User { Id = Guid.NewGuid(), Email = email.Value, NormalizedEmail = email.Normalized, CreatedAt = now, SecurityStamp = Guid.NewGuid(), LastSignInAt = now };
        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException error) when (Database.IsUniqueViolation(error))
        {
            db.Entry(user).State = EntityState.Detached;
            return null;
        }
        logger.LogInformation("User {UserId} signed up.", user.Id);
        return user;
    }

    // Deletes the user with everything of theirs (see AppDbContext) and their sign-in challenges, and
    // ends this session. Their other sessions end with the user.
    public async Task DeleteAsync(HttpContext context, CancellationToken cancellationToken)
    {
        var userId = UserIdOf(context.User);
        var email = await db.Users.Where(user => user.Id == userId).Select(user => user.NormalizedEmail).SingleAsync(cancellationToken);
        await db.SignInChallenges.Where(challenge => challenge.NormalizedEmail == email).ExecuteDeleteAsync(cancellationToken);
        await db.Users.Where(user => user.Id == userId).ExecuteDeleteAsync(cancellationToken);
        await context.SignOutAsync();
        logger.LogInformation("User {UserId} deleted their account.", userId);
    }

    public static Guid UserIdOf(ClaimsPrincipal principal) => Guid.Parse(principal.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Runs on every request that is authenticated from a session cookie.
    public static async Task ValidateSessionAsync(CookieValidatePrincipalContext context)
    {
        var principal = context.Principal;
        if (Guid.TryParse(principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var userId)
            && Guid.TryParse(principal.FindFirstValue(SecurityStampClaim), out var stamp))
        {
            var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            if (await db.Users.AnyAsync(user => user.Id == userId && user.SecurityStamp == stamp, context.HttpContext.RequestAborted)) return;
        }
        context.RejectPrincipal();
        await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    }
}
