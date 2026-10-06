using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace MathRecap.Api.Data;

public static class Database
{
    public static void AddDatabase(this IServiceCollection services) =>
        services.AddDbContext<AppDbContext>((services, options) => options.UseSqlServer(
            services.GetRequiredService<IConfiguration>().GetConnectionString("Database")
                ?? throw new InvalidOperationException("ConnectionStrings:Database is not configured.")));

    // Development applies pending migrations at startup. Other environments do not: there the
    // migrations are applied with "dotnet ef database update" before the app starts (see the README).
    public static async Task MigrateInDevelopmentAsync(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment()) return;
        await using var scope = app.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
    }

    // The save inserted a row whose key another request inserted first.
    public static bool IsUniqueViolation(DbUpdateException error) => error.InnerException is SqlException { Number: 2601 or 2627 };

    // Applies changes that insert-or-update rows by key and saves them. When a parallel request inserts
    // one of the rows first, the changes are applied again to the rows as they are now.
    public static async Task UpsertAsync(this AppDbContext db, Func<Task> applyChanges, CancellationToken cancellationToken)
    {
        await applyChanges();
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException error) when (IsUniqueViolation(error))
        {
            db.ChangeTracker.Clear();
            await applyChanges();
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
