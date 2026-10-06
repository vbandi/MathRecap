using MathRecap.Api.Accounts;
using MathRecap.Api.Dev;
using MathRecap.Api.Tests.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace MathRecap.Api.Tests;

// Configurations the app refuses to start with.
public sealed class StartupChecksTests
{
    [Theory]
    [InlineData("Production")]
    [InlineData("Staging")]
    public async Task DevAccountsAreRefusedOutsideDevelopment(string environment)
    {
        var error = await StartupErrorAsync(environment, new() { ["DevAccounts:Enabled"] = "true" });

        Assert.Contains("DevAccounts:Enabled is only allowed in the Development environment", error);
    }

    [Theory]
    [InlineData("Production")]
    [InlineData("Staging")]
    public async Task DevOutboxIsRefusedOutsideDevelopment(string environment)
    {
        var error = await StartupErrorAsync(environment, new() { ["DevOutbox:Enabled"] = "true" });

        Assert.Contains("DevOutbox:Enabled is only allowed in the Development environment", error);
    }

    // Everything else a published app needs is configured, so only the missing sender can stop it.
    [Theory]
    [InlineData("Production")]
    [InlineData("Staging")]
    public async Task AnEmailSenderIsRequiredOutsideDevelopment(string environment)
    {
        var error = await StartupErrorAsync(environment, new()
        {
            ["App:BaseUrl"] = "https://mathrecap.example",
            ["SignIn:CodeHashKey"] = new string('k', 48),
            ["Admin:Emails:0"] = "admin@mathrecap.example",
        });

        Assert.Contains("No email sender is configured", error);
    }

    // appsettings.json is all a published app gets unless its environment configures more.
    [Fact]
    public void TheBaseConfigurationHasNoDevToolsAdminsOrSecrets()
    {
        var configuration = new ConfigurationBuilder().AddJsonFile(Repository.PathOf("src", "MathRecap.Api", "appsettings.json")).Build();

        Assert.False(configuration.GetValue<bool>($"{DevOutboxOptions.SectionName}:Enabled"));
        Assert.False(configuration.GetValue<bool>($"{DevAccountsOptions.SectionName}:Enabled"));
        Assert.Empty(configuration.GetSection($"{DevAccountsOptions.SectionName}:Accounts").GetChildren());
        Assert.Empty(configuration.GetSection($"{AdminOptions.SectionName}:Emails").GetChildren());
        Assert.Null(configuration.GetConnectionString("Database"));
        Assert.Null(configuration["SignIn:CodeHashKey"]);
        Assert.Null(configuration["App:BaseUrl"]);
        Assert.Null(configuration["OpenRouter:ApiKey"]);
    }

    [Theory]
    [InlineData("")]
    [InlineData("too-short")]
    public async Task TheCodeHashKeyIsRequired(string key)
    {
        var error = await StartupErrorAsync(Environments.Development, new() { ["SignIn:CodeHashKey"] = key });

        Assert.Contains("SignIn:CodeHashKey must be configured", error);
    }

    [Fact]
    public async Task AdminEmailsMustBeEmailAddresses()
    {
        var error = await StartupErrorAsync(Environments.Development, new() { ["Admin:Emails:0"] = "admin" });

        Assert.Contains("Every Admin:Emails entry must be a valid email address.", error);
    }

    // The messages of the exception (and its inner exceptions) that stopped the app from starting.
    private static async Task<string> StartupErrorAsync(string environment, Dictionary<string, string?> settings)
    {
        await using var factory = new MathRecapFactory { Environment = environment, Settings = settings };
        var error = Record.Exception(() => factory.Server);
        Assert.NotNull(error);
        var messages = new List<string>();
        for (var current = error; current is not null; current = current.InnerException) messages.Add(current.Message);
        return string.Join(Environment.NewLine, messages);
    }
}
