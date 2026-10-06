using MathRecap.Api.Tests.TestHost;
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

    [Fact]
    public async Task AnEmailSenderIsRequiredOutsideDevelopment()
    {
        var error = await StartupErrorAsync(Environments.Production, []);

        Assert.Contains("No email sender is configured", error);
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
