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
}
