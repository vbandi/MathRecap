using MathRecap.Api.Data;
using MathRecap.Api.Tests.TestHost;
using Microsoft.EntityFrameworkCore;

[assembly: AssemblyFixture(typeof(TestDatabase))]

namespace MathRecap.Api.Tests.TestHost;

// A throwaway LocalDB database for the test run: created through the migrations when the first app
// starts (so tests without an app need no LocalDB), and dropped after the last test. Tests share it, so
// each test uses its own email addresses.
public sealed class TestDatabase : IAsyncLifetime
{
    private static readonly Lazy<Task> Creation = new(async () =>
    {
        await using var db = CreateContext();
        await db.Database.MigrateAsync();
    });

    public static string ConnectionString { get; } = $@"Server=(localdb)\MathRecap;Database=MathRecapTests_{Guid.NewGuid():N};Trusted_Connection=True";

    public static AppDbContext CreateContext() => new(new DbContextOptionsBuilder<AppDbContext>().UseSqlServer(ConnectionString).Options);

    // Once per test run, before apps that start in parallel would race to create the database.
    public static Task EnsureCreatedAsync() => Creation.Value;

    public ValueTask InitializeAsync() => ValueTask.CompletedTask;

    public async ValueTask DisposeAsync()
    {
        if (!Creation.IsValueCreated || !Creation.Value.IsCompletedSuccessfully) return;
        await using var db = CreateContext();
        await db.Database.EnsureDeletedAsync();
    }
}
