using System.Security.Cryptography;
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

    // The learner profile: optional free texts that the model gets as untrusted data.
    public string Interests { get; set; } = "";

    public string Background { get; set; } = "";

    public string Goal { get; set; } = "";

    public DateTimeOffset? OnboardingCompletedAt { get; set; }

    public Profile Profile => new(Interests, Background, Goal);
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

// The learner's own rating of a skill, 1-4. Skills without a row are at level 0.
public sealed class SkillLevel
{
    public Guid UserId { get; set; }

    public required string SkillId { get; set; }

    public int Level { get; set; }
}

// The latest "why it is useful for you" text of a skill.
public sealed class UsefulnessText
{
    public Guid UserId { get; set; }

    public required string SkillId { get; set; }

    public required string Text { get; set; }

    // The fingerprint of the profile the text was written for; after a profile change it is stale.
    public required byte[] ProfileFingerprint { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class Worksheet
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public required string SkillId { get; set; }

    // The worksheet's title, kept apart from the content for listing.
    public required string Title { get; set; }

    // What the learner asked for.
    public required string Request { get; set; }

    // The validated worksheet as JSON.
    public required string Content { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}

// The admins' review of a skill's illustration. Shared by the admins, not per learner.
public sealed class IllustrationReview
{
    public required string SkillId { get; set; }

    // "todo", "ok" or "fix".
    public required string Status { get; set; }

    public required string Note { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    // Null once that admin's account is deleted.
    public Guid? UpdatedByUserId { get; set; }

    public User? UpdatedBy { get; set; }
}

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // The lengths the request and model output schemas (RequestSchemas/, Ai/Schemas/) allow.
    private const int SkillIdMaxLength = 16;
    private const int ProfileTextMaxLength = 500;
    private const int UsefulnessTextMaxLength = 1200;
    private const int WorksheetTitleMaxLength = 240;
    private const int WorksheetRequestMaxLength = 2000;
    private const int ReviewNoteMaxLength = 2000;
    private const int ReviewStatusMaxLength = 8;

    public DbSet<User> Users => Set<User>();

    public DbSet<SignInChallenge> SignInChallenges => Set<SignInChallenge>();

    public DbSet<SkillLevel> SkillLevels => Set<SkillLevel>();

    public DbSet<UsefulnessText> UsefulnessTexts => Set<UsefulnessText>();

    public DbSet<Worksheet> Worksheets => Set<Worksheet>();

    public DbSet<IllustrationReview> IllustrationReviews => Set<IllustrationReview>();

    // Everything of a learner is deleted with the user (see the foreign keys below); only the shared
    // illustration reviews stay, without the reviewer.
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(user =>
        {
            user.Property(entity => entity.Email).HasMaxLength(EmailAddress.MaxLength);
            user.Property(entity => entity.NormalizedEmail).HasMaxLength(EmailAddress.MaxLength);
            user.HasIndex(entity => entity.NormalizedEmail).IsUnique();
            user.Property(entity => entity.Interests).HasMaxLength(ProfileTextMaxLength);
            user.Property(entity => entity.Background).HasMaxLength(ProfileTextMaxLength);
            user.Property(entity => entity.Goal).HasMaxLength(ProfileTextMaxLength);
            user.Ignore(entity => entity.Profile);
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
        modelBuilder.Entity<SkillLevel>(level =>
        {
            level.HasKey(entity => new { entity.UserId, entity.SkillId });
            level.Property(entity => entity.SkillId).HasMaxLength(SkillIdMaxLength);
            level.ToTable(table => table.HasCheckConstraint("CK_SkillLevels_Level", "[Level] BETWEEN 1 AND 4"));
            level.HasOne<User>().WithMany().HasForeignKey(entity => entity.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<UsefulnessText>(text =>
        {
            text.HasKey(entity => new { entity.UserId, entity.SkillId });
            text.Property(entity => entity.SkillId).HasMaxLength(SkillIdMaxLength);
            text.Property(entity => entity.Text).HasMaxLength(UsefulnessTextMaxLength);
            text.Property(entity => entity.ProfileFingerprint).HasMaxLength(SHA256.HashSizeInBytes).IsFixedLength();
            text.HasOne<User>().WithMany().HasForeignKey(entity => entity.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<Worksheet>(worksheet =>
        {
            worksheet.Property(entity => entity.SkillId).HasMaxLength(SkillIdMaxLength);
            worksheet.Property(entity => entity.Title).HasMaxLength(WorksheetTitleMaxLength);
            worksheet.Property(entity => entity.Request).HasMaxLength(WorksheetRequestMaxLength);
            worksheet.HasIndex(entity => new { entity.UserId, entity.SkillId, entity.CreatedAt });
            worksheet.HasOne<User>().WithMany().HasForeignKey(entity => entity.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<IllustrationReview>(review =>
        {
            review.HasKey(entity => entity.SkillId);
            review.Property(entity => entity.SkillId).HasMaxLength(SkillIdMaxLength);
            review.Property(entity => entity.Status).HasMaxLength(ReviewStatusMaxLength);
            review.Property(entity => entity.Note).HasMaxLength(ReviewNoteMaxLength);
            review.HasOne(entity => entity.UpdatedBy).WithMany().HasForeignKey(entity => entity.UpdatedByUserId).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
