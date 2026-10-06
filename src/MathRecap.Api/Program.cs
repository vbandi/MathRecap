using MathRecap.Api;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseLocalAccessGuards();
app.UseStaticHosting();
app.MapApiEndpoints();

app.Run();
