using MathRecap.Api.Accounts;
using Microsoft.EntityFrameworkCore;

namespace MathRecap.Api.Data;

public sealed class User
{
    public Guid Id { get; set; }

    // As the learner entered it, trimmed.
    public required string Email { get; set; }

    public required string NormalizedEmail { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    // Part of every session cookie; changing it signs the user out everywhere.
    public Guid SecurityStamp { get; set; }

    public DateTimeOffset? LastSignInAt { get; set; }
}

// An emailed sign-in code and link. Only their hashes are stored.
public sealed class SignInChallenge
{
    public Guid Id { get; set; }

    // As entered, for creating the user when the challenge signs up a new learner.
    public required string Email { get; set; }

    public required string NormalizedEmail { get; set; }

    public required byte[] CodeHash { get; set; }

    public required byte[] LinkTokenHash { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public int FailedAttempts { get; set; }

    public DateTimeOffset? ConsumedAt { get; set; }
}

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<SignInChallenge> SignInChallenges => Set<SignInChallenge>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(user =>
        {
            user.Property(entity => entity.Email).HasMaxLength(EmailAddress.MaxLength);
            user.Property(entity => entity.NormalizedEmail).HasMaxLength(EmailAddress.MaxLength);
            user.HasIndex(entity => entity.NormalizedEmail).IsUnique();
        });
        modelBuilder.Entity<SignInChallenge>(challenge =>
        {
            challenge.Property(entity => entity.Email).HasMaxLength(EmailAddress.MaxLength);
            challenge.Property(entity => entity.NormalizedEmail).HasMaxLength(EmailAddress.MaxLength);
            challenge.Property(entity => entity.CodeHash).HasMaxLength(SignInSecrets.HashLength).IsFixedLength();
            challenge.Property(entity => entity.LinkTokenHash).HasMaxLength(SignInSecrets.HashLength).IsFixedLength();
            challenge.HasIndex(entity => entity.LinkTokenHash).IsUnique();
            challenge.HasIndex(entity => new { entity.NormalizedEmail, entity.CreatedAt });
        });
    }
}
