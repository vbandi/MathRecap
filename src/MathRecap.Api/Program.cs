using MathRecap.Api;
using MathRecap.Api.Ai;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton(services => Curriculum.Load(Path.Combine(
    StaticHosting.FolderPath(services.GetRequiredService<IConfiguration>(), services.GetRequiredService<IHostEnvironment>(), "WebRoot"), "data", "curriculum.json")));
builder.Services.AddAiServices();
var app = builder.Build();
// Loads the curriculum at startup rather than on the first request.
app.Services.GetRequiredService<Curriculum>();

app.UseLocalAccessGuards();
app.UseStaticHosting();
app.MapApiEndpoints();

app.Run();
