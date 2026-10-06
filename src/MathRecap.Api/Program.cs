using MathRecap.Api;
using MathRecap.Api.Accounts;
using MathRecap.Api.Ai;
using MathRecap.Api.Data;
using MathRecap.Api.Dev;
using MathRecap.Api.Email;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton(services => Curriculum.Load(Path.Combine(
    StaticHosting.FolderPath(services.GetRequiredService<IConfiguration>(), services.GetRequiredService<IHostEnvironment>(), "WebRoot"), "data", "curriculum.json")));
builder.Services.AddAiServices();
builder.Services.AddDatabase();
builder.Services.AddAccounts();
builder.AddDevTools();
builder.RequireEmailSenderOutsideDevelopment();
var app = builder.Build();
// Loads the curriculum at startup rather than on the first request.
app.Services.GetRequiredService<Curriculum>();
await app.MigrateInDevelopmentAsync();

app.UseRequestGuards();
app.UsePageAccess();
app.UseStaticHosting();
// Static files are answered above, without looking up the session.
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
app.MapApiEndpoints();

app.Run();
