using System.Security.Claims;
using MathRecap.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MathRecap.Api.Accounts;

public sealed class AdminOptions
{
    public const string SectionName = "Admin";

    // The email addresses of the admins.
    public List<string> Emails { get; set; } = [];
}

// Admins are the signed-in users whose email address is in Admin:Emails. Only they may review the
// illustrations (review.html and /api/admin/*).
public sealed class Admins(AppDbContext db, IOptions<AdminOptions> options)
{
    public bool IsAdmin(User user) => options.Value.Emails.Any(email => EmailAddress.Parse(email).Normalized == user.NormalizedEmail);

    public async Task<bool> IsAdminAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var userId = UserAccounts.UserIdOf(principal);
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(user => user.Id == userId, cancellationToken);
        return user is not null && IsAdmin(user);
    }

    // An endpoint filter that answers 403 to everyone else.
    public static async ValueTask<object?> RequireAdminAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var http = context.HttpContext;
        return await http.RequestServices.GetRequiredService<Admins>().IsAdminAsync(http.User, http.RequestAborted)
            ? await next(context)
            : ApiErrors.Create(StatusCodes.Status403Forbidden, "forbidden", "Ehhez nincs jogosultságod.");
    }
}
