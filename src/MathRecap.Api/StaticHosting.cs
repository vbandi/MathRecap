using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;

namespace MathRecap.Api;

// Serves the front end at / and KaTeX at /vendor/katex/ from the folders in the StaticHosting
// configuration section (relative to the content root).
public static class StaticHosting
{
    public static void UseStaticHosting(this WebApplication app)
    {
        var contentTypes = new FileExtensionContentTypeProvider();
        contentTypes.Mappings[".html"] = "text/html; charset=utf-8";
        contentTypes.Mappings[".css"] = "text/css; charset=utf-8";
        contentTypes.Mappings[".js"] = "text/javascript; charset=utf-8";
        contentTypes.Mappings[".mjs"] = "text/javascript; charset=utf-8";
        // JSON module imports (import ... with { type: "json" }) require a JSON MIME type.
        contentTypes.Mappings[".json"] = "application/json; charset=utf-8";

        var webRoot = OpenFolder(app, "WebRoot");
        app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = webRoot });
        app.UseStaticFiles(new StaticFileOptions { FileProvider = webRoot, ContentTypeProvider = contentTypes });
        app.UseStaticFiles(new StaticFileOptions { FileProvider = OpenFolder(app, "KatexRoot"), RequestPath = "/vendor/katex", ContentTypeProvider = contentTypes });
    }

    private static PhysicalFileProvider OpenFolder(WebApplication app, string key)
    {
        var configured = app.Configuration[$"StaticHosting:{key}"] ?? throw new InvalidOperationException($"StaticHosting:{key} is not configured.");
        var path = Path.GetFullPath(configured, app.Environment.ContentRootPath);
        if (!Directory.Exists(path)) throw new DirectoryNotFoundException($"StaticHosting:{key} points to a missing folder: {path} (KaTeX comes from 'npm ci').");
        return new PhysicalFileProvider(path);
    }
}
